// Verified, read-only context retrieval from one immutable GitHub checkpoint.
// No narration, journal writes, branch changes, or in-game time advances.
import {readCheckpoint,assertReadyJournalBaseline,assertVerifiedJournalCheckpoint} from './save_transaction.mjs';
import {buildContextPacket} from './context_manager.mjs';

const insist=(ok,message)=>{if(!ok)throw Error(message)};
const sha=s=>typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);
const stableJson=x=>JSON.stringify(x??null);

function checkJournalRecord(record,branch){
 if(record===null)return 'not_initialized';
 insist(record&&typeof record==='object'&&record.branch===branch&&
  ['ready','blocked','verified'].includes(record.status),'Invalid journal identity or status');
 if(record.status==='blocked')
  throw Error('Unresolved durable narrative save attempt: recover journal before context use');
 if(record.status==='ready')return 'ready_baseline';
 insist(sha(record.commitHead)&&record.attempt?.status==='verified'&&
  record.attempt?.percent===100&&record.attempt.verified_head===record.commitHead,
  'Malformed verified durable journal');
 return 'verified_previous_attempt';
}

/**
 * Perform a complete, immutable snapshot read before constructing context.
 * An absent journal still allows read-only research, never permission to play.
 */
export async function loadVerifiedContextPacket({remote,journal=null,branch,
 query='',audience='narrator_private',maxReferences=8,maxPreviewCharacters=1600,
 npcIds=[],sceneNpcIds=[],autoNpcMemory=true,npcKnowledgeClaims=[]}={}){
 insist(remote&&typeof remote.readHead==='function'&&typeof remote.readFiles==='function',
  'Remote read-only Git adapter required');
 insist(typeof branch==='string'&&branch.length>0&&
  !branch.startsWith('qa/')&&!branch.startsWith('journal/')&&
  !branch.startsWith('backup/'),'Authoritative non-QA story branch required');
 insist(journal===null||(typeof journal.read==='function'),
  'Read-only journal adapter required');

 // Read the journal before touching the current checkpoint. A blocked write
 // must not be hidden by a seemingly coherent branch ref.
 const journalBefore=journal===null?null:await journal.read(branch);
 const journalGate=journal===null?'not_connected':checkJournalRecord(journalBefore,branch);
 const head=await remote.readHead(branch);
 insist(sha(head),'Remote branch has no verified commit SHA');

 // Read the active manifest from this SHA, never infer an active chapter from
 // a stale README or a caller-provided chapter ID.
 const header=await remote.readFiles(head,['game/SAVE_MANIFEST.json']);
 insist(typeof header?.['game/SAVE_MANIFEST.json']==='string',
  'Remote save manifest is missing');
 const manifest=JSON.parse(header['game/SAVE_MANIFEST.json']);
 insist(typeof manifest.chapter_id==='string'&&/^CH-\d{3}$/.test(manifest.chapter_id),
  'Remote manifest has no valid chapter');
 const snapshot=await readCheckpoint({remote,commitSha:head,chapterId:manifest.chapter_id});
 insist(header['game/SAVE_MANIFEST.json']===snapshot.sourceFiles['game/SAVE_MANIFEST.json'],
  'Manifest changed within immutable commit read');

 if(journalGate==='ready_baseline')
  await assertReadyJournalBaseline({remote,record:journalBefore,branch,sourceHead:head,snapshot});
 if(journalGate==='verified_previous_attempt')
  await assertVerifiedJournalCheckpoint({
   remote,record:journalBefore,branch,sourceHead:head,snapshot});
 const packet=buildContextPacket({snapshot,audience,query,maxReferences,
  maxPreviewCharacters,sourceCommit:head,npcIds,sceneNpcIds,autoNpcMemory,
  npcKnowledgeClaims});
 insist(await remote.readHead(branch)===head,
  'Branch moved during context retrieval; restart from new HEAD');
 if(journal!==null){
  const journalAfter=await journal.read(branch);
  insist(stableJson(journalAfter)===stableJson(journalBefore),
   'Journal changed during context retrieval; retry safely');
 }
 return {...packet,sourceCommitStatus:'verified_immutable_remote_readback',
  loadStatus:'verified_read_only',journalGate,
  // Context retrieval never serves as a save-authorization token.
  mayAdvanceStory:false};
}
