// Lote 12 — migration plans are review-only, never an actual save or anchor swap.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assessNPCKnowledgeAnchorMigration,verifyNPCKnowledgeAnchorMigrationProposal}
 from '../tools/living_world_knowledge_migration.mjs';
import {NPC_KNOWLEDGE_ANCHOR} from '../tools/living_world_knowledge_anchor.mjs';
import {savePaths,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';

const chapter='CH-000',head='a'.repeat(40),futureHead='b'.repeat(40);
const original=Object.fromEntries(savePaths(chapter).map(path=>
 [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const baseline={
 state:JSON.parse(original['game/STATE.json']),
 manifest:JSON.parse(original['game/SAVE_MANIFEST.json']),
 events:JSON.parse(original['chapters/CH-000.events.json']),
 transcript:JSON.parse(original['chapters/CH-000.transcript.json']),
 chapter:original['chapters/CH-000.md']
};
const eligibleReason='Reviewed synthetic turn and source data for a forward-only archive proposal.';
const input=(snapshot,extra={})=>({
 snapshot,sourceFiles:extra.sourceFiles??(snapshot===baseline?original:encodeFiveFiles(snapshot)),
 observedHead:extra.observedHead??futureHead,
 operation:extra.operation??'promote_checkpoint',
 reviewed:extra.reviewed??true,
 reason:extra.reason??eligibleReason,
 ...(extra.actorId?{actorId:extra.actorId}:{}),
 ...(extra.entry?{entry:extra.entry}:{})
});
const future=()=>stageLivingWorldTurn({
 snapshot:baseline,observedHead:head,npcResolutions:[],
 turn:{key:'synthetic-anchor-promotion-turn-001',
  intent:'SYNTHETIC inspection without player input.',
  outcome:'SYNTHETIC quiet interval at the workbench.',
  player_text:'SYNTHETIC TEST ONLY',
  narration_messages:['The synthetic workbench remains unchanged.'],
  elapsed_days:0,elapsed_minutes:25}
});
const laterKnowledge=()=>stageLivingWorldTurn({
 snapshot:baseline,observedHead:head,
 npcResolutions:[{actor_id:'NPC-006',reviewed:true,resolved:true,
  causal_basis:'Reviewed synthetic observation by the individual shopkeeper.',
  outcome:'SYNTHETIC Noah quietly notes a warehouse supply detail.',
  changes:[{field:'knowledge',
   fact:'A synthetic shipment of parts reached the shop counter this morning.',
   source:'Direct synthetic observation by NPC-006, no actual world turn'}],
  disclosures:[]}],
 turn:{key:'synthetic-anchor-knowledge-turn-001',
  intent:'SYNTHETIC private interval after Jack reviews a component.',
  outcome:'SYNTHETIC quiet hour of ordinary maintenance.',
  player_text:'SYNTHETIC CHECK ONLY',
  narration_messages:['Only synthetic observations near Jack are recorded.'],
  elapsed_days:0,elapsed_minutes:25}
});

test('the sealed original turn cannot be promoted to itself',()=>{
 const old=JSON.stringify(baseline);
 const result=assessNPCKnowledgeAnchorMigration(input(baseline));
 assert.equal(result.status,'blocked');
 assert.equal(result.candidate,null);
 assert.ok(result.blockers.includes('requires_checkpoint_later_than_sealed_turn'));
 assert.ok(result.blockers.includes('requires_later_source_event'));
 assert.equal(result.applied,false);
 assert.equal(result.ownerApproved,false);
 assert.equal(JSON.stringify(baseline),old);
});

test('synthetic future checkpoint produces a candidate but never promotes it',()=>{
 const snapshot=future(),saved=JSON.stringify(snapshot);
 const options=input(snapshot);
 const first=assessNPCKnowledgeAnchorMigration(options);
 const second=assessNPCKnowledgeAnchorMigration(options);
 assert.deepEqual(first,second);
 assert.equal(first.status,'candidate_only_requires_external_review');
 assert.deepEqual(first.blockers,[]);
 assert.ok(first.candidate);
 assert.equal(first.candidate.lastTurn,10);
 assert.equal(first.candidate.lastEventId,'EV-000030');
 assert.equal(first.candidate.sourceCommit,futureHead);
 assert.equal(first.candidate.actorKnowledge['NPC-006'].length,2);
 assert.equal(first.verifiedRemoteCommit,false);
 assert.equal(first.ownerApproved,false);
 assert.equal(first.applied,false);
 assert.equal(verifyNPCKnowledgeAnchorMigrationProposal({proposal:first,...options}),true);
 assert.equal(JSON.stringify(snapshot),saved);
 assert.equal(baseline.manifest.last_completed_turn,9);
 assert.equal(NPC_KNOWLEDGE_ANCHOR.lastTurn,9);
});

test('source byte Git blob digests are tied to the raw five-file snapshot',()=>{
 const options=input(future()),proposed=assessNPCKnowledgeAnchorMigration(options);
 const stateText=options.sourceFiles['game/STATE.json'];
 const raw='blob '+Buffer.byteLength(stateText,'utf8')+'\0';
 const hash=createHash('sha1').update(raw,'utf8').update(stateText,'utf8').digest('hex');
 assert.equal(proposed.source.fileBlobs['game/STATE.json'],hash);
 assert.equal(proposed.candidate.sourceStateBlob,hash);
 assert.equal(Object.keys(proposed.source.fileBlobs).length,5);
 assert.notEqual(hash,NPC_KNOWLEDGE_ANCHOR.sourceStateBlob);
});

test('an unsigned or abbreviated review is blocked rather than silently approved',()=>{
 const snapshot=future();
 for(const params of [{reviewed:false},{reason:'too short'},{reviewed:false,reason:''}]){
  const result=assessNPCKnowledgeAnchorMigration(input(snapshot,params));
  assert.equal(result.status,'blocked');
  assert.equal(result.candidate,null);
  assert.ok(result.blockers.includes('requires_explicit_editorial_review_and_reason'));
  assert.equal(result.applied,false);
 }
});

test('missing, mismatched or corrupt raw checkpoint bytes fail closed',()=>{
 const snapshot=future(),options=input(snapshot);
 const badFiles=[
  {...options.sourceFiles},
  {...options.sourceFiles,'game/STATE.json':'{broken'},
  {...options.sourceFiles,'game/SAVE_MANIFEST.json':original['game/SAVE_MANIFEST.json']},
  {...options.sourceFiles,'chapters/CH-000.md':options.sourceFiles['chapters/CH-000.md']+'changed'}
 ];
 delete badFiles[0]['game/STATE.json'];
 for(const sourceFiles of badFiles){
  assert.throws(()=>assessNPCKnowledgeAnchorMigration({...options,sourceFiles}),
   /Raw checkpoint file missing|Malformed raw checkpoint JSON|Raw checkpoint differs|Raw chapter narration differs/);
 }
});

test('unsound HEAD, operation or review data cannot create a proposal',()=>{
 const options=input(future());
 assert.throws(()=>assessNPCKnowledgeAnchorMigration({...options,observedHead:'HEAD'}),
  /Observed 40-character commit required/);
 assert.throws(()=>assessNPCKnowledgeAnchorMigration({...options,operation:'erase_all'}),
  /Unsupported knowledge migration operation/);
 assert.throws(()=>assessNPCKnowledgeAnchorMigration({...options,reviewed:'yes'}),
  /Editorial review flag must be boolean/);
});

test('adding an NPC requires a separately supported actor-lifecycle contract',()=>{
 const options=input(future(),{operation:'register_npc',actorId:'NPC-008'});
 const report=assessNPCKnowledgeAnchorMigration(options);
 assert.equal(report.status,'blocked');
 assert.equal(report.candidate,null);
 assert.ok(report.blockers.includes('actor_creation_event_and_knowledge_provenance_not_supported'));
 assert.equal(report.review.targetActorId,'NPC-008');
 assert.equal(report.applied,false);
});

test('forgetting a fact cannot be inferred from a proposed anchor migration',()=>{
 const options=input(future(),{
  operation:'forget',actorId:'NPC-006',
  entry:baseline.state.world.actors['NPC-006'].knowledge[0]});
 const report=assessNPCKnowledgeAnchorMigration(options);
 assert.equal(report.status,'blocked');
 assert.equal(report.candidate,null);
 assert.ok(report.blockers.includes('causal_forgetting_and_replay_not_supported'));
 assert.equal(report.ownerApproved,false);
});

test('altered migration candidate or fingerprint fails deterministic readback',()=>{
 const options=input(future());
 const valid=assessNPCKnowledgeAnchorMigration(options);
 const changed=structuredClone(valid);
 changed.candidate.actorKnowledge['NPC-006'].push('fabricated memory');
 assert.throws(()=>verifyNPCKnowledgeAnchorMigrationProposal({
  proposal:changed,...options}),/proposal differs from verified source and review/);
 const signature=structuredClone(valid);
 signature.proposalDigest='0'.repeat(64);
 assert.throws(()=>verifyNPCKnowledgeAnchorMigrationProposal({
  proposal:signature,...options}),/proposal differs from verified source and review/);
});

test('a later event-backed NPC knowledge addition can appear in a new candidate',()=>{
 const snapshot=laterKnowledge(),before=JSON.stringify(baseline);
 const result=assessNPCKnowledgeAnchorMigration(input(snapshot));
 assert.equal(result.status,'candidate_only_requires_external_review');
 assert.equal(result.candidate.actorKnowledge['NPC-006'].length,3);
 assert.ok(result.candidate.actorKnowledge['NPC-006'].at(-1).includes('EV-000031'));
 assert.equal(JSON.stringify(baseline),before);
});

test('injecting unsourced NPC memory cannot be laundered through migration',()=>{
 const snapshot=future(),forged=structuredClone(snapshot);
 forged.state.world.actors['NPC-006'].knowledge.push('Synthetic secret with no causal event.');
 const sourceFiles={...encodeFiveFiles(snapshot),
  'game/STATE.json':JSON.stringify(forged.state,null,2)+'\n'};
 const options={...input(snapshot),snapshot:forged,sourceFiles};
 assert.throws(()=>assessNPCKnowledgeAnchorMigration(options),
  /NPC knowledge diverges from sealed anchor and event history|Recorded knowledge/);
});

test('migration can never silently change the requested operation or actor',()=>{
 const options=input(future());
 const candidate=assessNPCKnowledgeAnchorMigration(options);
 assert.throws(()=>verifyNPCKnowledgeAnchorMigrationProposal({
  ...options,proposal:candidate,operation:'forget',
  actorId:'NPC-006',entry:'Unreviewed proposed memory removal'}),
  /proposal differs from verified source and review/);
});

test('an added actor with no documented lifecycle cannot be hidden in promotion',()=>{
 const checkpoint=future(),forged=structuredClone(checkpoint);
 const actor=structuredClone(forged.state.world.actors['NPC-007']);
 actor.id='NPC-008';actor.name='SYNTHETIC undocumented actor';
 actor.knowledge=[];
 forged.state.world.actors['NPC-008']=actor;
 const files=encodeFiveFiles(checkpoint);
 files['game/STATE.json']=JSON.stringify(forged.state,null,2)+'\n';
 const report=assessNPCKnowledgeAnchorMigration({
  ...input(checkpoint),snapshot:forged,sourceFiles:files
 });
 assert.equal(report.status,'blocked');
 assert.equal(report.candidate,null);
 assert.deepEqual(report.actorDrift.added,['NPC-008']);
 assert.ok(report.blockers.includes('actor_roster_migration_not_implemented'));
});

test('removing old knowledge from final state cannot be disguised as forgetting',()=>{
 const checkpoint=future(),forged=structuredClone(checkpoint);
 forged.state.world.actors['NPC-006'].knowledge.pop();
 const files=encodeFiveFiles(checkpoint);
 files['game/STATE.json']=JSON.stringify(forged.state,null,2)+'\n';
 assert.throws(()=>assessNPCKnowledgeAnchorMigration({
  ...input(checkpoint),snapshot:forged,sourceFiles:files
 }),/NPC knowledge diverges from sealed anchor and event history/);
});
