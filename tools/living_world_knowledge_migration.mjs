// Lote 12: reversible, narrator-private preview of a future knowledge anchor.
// Never edits canon, promotes an anchor, approves an owner decision or saves a turn.
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {savePaths} from './save_transaction.mjs';
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {verifySealedNPCKnowledge} from './living_world_social.mjs';
import {NPC_KNOWLEDGE_ANCHOR} from './living_world_knowledge_anchor.mjs';

const insist=(ok,message)=>{if(!ok)throw new Error(message)};
const sha40=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const copy=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>isDeepStrictEqual(a,b);
const sha256=x=>createHash('sha256').update(x,'utf8').digest('hex');
const gitBlob=text=>createHash('sha1')
 .update('blob '+Buffer.byteLength(text,'utf8')+'\0','utf8')
 .update(text,'utf8').digest('hex');

function authenticateBytesAgainstSnapshot(snapshot,sourceFiles){
 const paths=savePaths(snapshot.manifest.chapter_id);
 insist(sourceFiles&&typeof sourceFiles==='object'&&!Array.isArray(sourceFiles),
  'Raw five-file checkpoint source required');
 const [transcript,events,chapter,state,manifest]=paths;
 for(const p of paths)insist(typeof sourceFiles[p]==='string',
  'Raw checkpoint file missing: '+p);
 for(const [path,expected] of [[transcript,snapshot.transcript],
  [events,snapshot.events],[state,snapshot.state],[manifest,snapshot.manifest]]){
  let parsed;
  try{parsed=JSON.parse(sourceFiles[path]);}
  catch{throw Error('Malformed raw checkpoint JSON: '+path);}
  insist(same(parsed,expected),'Raw checkpoint differs from inspected snapshot: '+path);
 }
 insist(sourceFiles[chapter]===snapshot.chapter,
  'Raw chapter narration differs from inspected snapshot');
 return Object.fromEntries(paths.map(p=>[p,gitBlob(sourceFiles[p])]));
}

/**
 * A candidate, never an executable migration. Commit-to-tree authentication
 * and actual owner authorization must be independently verified later.
 *
 * "promote_checkpoint": only a later, fully reconstructable seven-NPC state.
 * "register_npc": blocked until an actor-creation event and provenance schema.
 * "forget": blocked until an explicit causal removal/retention event schema.
 */
export function assessNPCKnowledgeAnchorMigration({
 snapshot,sourceFiles,observedHead,operation='promote_checkpoint',
 reviewed=false,reason='',actorId=null,entry=null
}={}){
 insist(snapshot?.manifest&&snapshot?.state,'Full narrative snapshot required');
 insist(sha40(observedHead),'Observed 40-character commit required');
 insist(['promote_checkpoint','register_npc','forget'].includes(operation),
  'Unsupported knowledge migration operation');
 insist(typeof reviewed==='boolean','Editorial review flag must be boolean');
 insist(typeof reason==='string'&&reason.length<=600,
  'Invalid migration review reason');
 insist(actorId===null||(typeof actorId==='string'&&/^NPC-\d{3,}$/.test(actorId)),
  'Invalid migration target NPC identifier');
 insist(entry===null||(typeof entry==='string'&&entry.length>0&&entry.length<=1200),
  'Invalid migration target knowledge entry');
 // No candidate can bypass the ordinary save, archive, chapter or social gates.
 verifyNarrativeSnapshot(snapshot);
 const fileBlobs=authenticateBytesAgainstSnapshot(snapshot,sourceFiles);
 const anchor=NPC_KNOWLEDGE_ANCHOR;
 const actors=snapshot.state.world.actors;
 const oldIds=Object.keys(anchor.actorKnowledge).sort();
 const newIds=Object.keys(actors).sort();
 const added=newIds.filter(id=>!own(anchor.actorKnowledge,id));
 const removed=oldIds.filter(id=>!own(actors,id));
 const blockers=[];
 if(snapshot.manifest.last_completed_turn<=anchor.lastTurn)
  blockers.push('requires_checkpoint_later_than_sealed_turn');
 if(snapshot.manifest.last_event_sequence<=Number(anchor.lastEventId.slice(3)))
  blockers.push('requires_later_source_event');
 if(!reviewed||reason.trim().length<12)
  blockers.push('requires_explicit_editorial_review_and_reason');
 if(added.length||removed.length)blockers.push('actor_roster_migration_not_implemented');
 if(operation==='register_npc'){
  insist(actorId!==null,'New NPC migration target required');
  blockers.push('actor_creation_event_and_knowledge_provenance_not_supported');
 }
 if(operation==='forget'){
  insist(actorId!==null&&entry!==null,'Forgetting target and entry required');
  blockers.push('causal_forgetting_and_replay_not_supported');
 }
 if(operation==='promote_checkpoint'&&(actorId!==null||entry!==null))
  blockers.push('promotion_cannot_smuggle_actor_or_forgetting_changes');
 // Even with no saved social event, enforce the sealed baseline for all actors.
 // Unsupported actor changes remain blocked rather than partially replayed.
 if(!added.length&&!removed.length)verifySealedNPCKnowledge(snapshot);
 const raw=sourceFiles['game/STATE.json'];
 const target={
  chapterId:snapshot.manifest.chapter_id,
  lastTurn:snapshot.manifest.last_completed_turn,
  lastEventId:snapshot.manifest.last_event_id,
  sourceCommit:observedHead,
  sourceStateBlob:gitBlob(raw)
 };
 const candidate=blockers.length?null:{
  ...target,
  actorKnowledge:Object.fromEntries(newIds.map(id=>[id,copy(actors[id].knowledge)]))
 };
 const proposal={
  schemaVersion:1,kind:'npc_knowledge_anchor_migration_review',
  operation,status:blockers.length?'blocked':'candidate_only_requires_external_review',
  // This code never confers authority to replace an anchor.
  applied:false,verifiedRemoteCommit:false,ownerApproved:false,
  currentAnchor:{chapterId:anchor.chapterId,lastTurn:anchor.lastTurn,
   lastEventId:anchor.lastEventId,sourceCommit:anchor.sourceCommit,
   sourceStateBlob:anchor.sourceStateBlob},
  source:{observedHead,chapterId:snapshot.manifest.chapter_id,
   manifestTurn:snapshot.manifest.last_completed_turn,
   lastEventId:snapshot.manifest.last_event_id,fileBlobs},
  review:{reviewed,reason:reason.trim(),targetActorId:actorId,targetEntry:entry},
  actorDrift:{added,removed},blockers,candidate
 };
 return {...proposal,proposalDigest:sha256(JSON.stringify(proposal))};
}

export function verifyNPCKnowledgeAnchorMigrationProposal({proposal,...input}={}){
 insist(proposal?.schemaVersion===1&&
  proposal.kind==='npc_knowledge_anchor_migration_review',
  'Knowledge anchor migration proposal required');
 const rebuilt=assessNPCKnowledgeAnchorMigration(input);
 insist(same(proposal,rebuilt),
  'Knowledge migration proposal differs from verified source and review');
 return true;
}
