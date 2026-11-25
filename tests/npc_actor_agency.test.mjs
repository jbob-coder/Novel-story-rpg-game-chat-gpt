// Synthetic autonomous-actor review boundaries, NOT actual agent decisions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {inspectOpenNPCAgency,draftOpenNPCAction} from '../tools/npc_actor_agency.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';

const original=Object.fromEntries(savePaths('CH-000').map(path=>
 [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const baseline=()=>decodeFiveFiles(original,'CH-000');
const head='a'.repeat(40);
const turn=n=>({key:'qa-actor-open-'+n,
 intent:'SYNTHETIC QA: the player has no involvement in an NPC plan.',
 outcome:'The fictional test interval passes without exposing private information.',
 player_text:'[SYNTHETIC QA] Stay at the workbench.',
 narration_messages:['[SYNTHETIC QA] The workshop stays quiet.'],
 elapsed_days:0,elapsed_minutes:25,next_time_of_day:'morning'});
const frame=(snapshot,actorId)=>inspectOpenNPCAgency({
 snapshot,actorIds:[actorId],elapsedMinutes:25}).frames[0];

test('review includes offscreen actors but performs no automatic NPC actions',()=>{
 const s=baseline(),before=JSON.stringify(s);
 const d=inspectLivingWorld({snapshot:s,elapsedMinutes:25});
 const a=d.openNPCDecisionFrames;
 assert.equal(a.classification,'npc_private_open_agency_v1');
 assert.ok(a.frames.some(x=>x.actorId==='NPC-001'));
 assert.ok(a.frames.some(x=>x.actorId==='NPC-006'));
 assert.ok(a.frames.some(x=>x.actorId==='NPC-007'));
 assert.ok(!d.selectedActorIds.includes('NPC-001'));
 assert.equal(a.actionsPerformed,0);
 assert.ok(a.frames.every(x=>x.actionSelected===false&&x.resultKnown===false));
 assert.ok(!Object.hasOwn(playerVisibleDiagnostic(d),'openNPCDecisionFrames'));
 assert.equal(JSON.stringify(s),before);
});

test('Noah initiates a new offscreen business decision, then reconsiders saved result next turn',()=>{
 const s=baseline(),before=s.state.world.actors['NPC-006'];
 const focus=frame(s,'NPC-006');
 assert.equal(focus.previousResult,null);
 assert.equal(focus.sourceEventId,null);
 const plan='Review actual parts records before accepting another supplier order.';
 const draft=draftOpenNPCAction({snapshot:s,frame:focus,elapsedMinutes:25,
  intention:'Noah decides to reconcile his parts records before soliciting new purchases.',
  reasoning:'His recorded reputation and business goals support review of existing records, without inventing stock or customers.',
  outcome:'SYNTHETIC PRIVATE: Noah privately revises his next business priority without inventing a sale.',
  changes:[{field:'independent_plan',before:before.independent_plan,after:plan}],
  reviewed:true});
 assert.equal(Object.hasOwn(draft,'continuation_context'),false);
 const staged=stageLivingWorldTurn({
  snapshot:s,observedHead:head,turn:turn('one'),npcResolutions:[draft]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.deepEqual(staged.events.events.at(-1).caused_by,[]);
 assert.equal(staged.state.world.actors['NPC-006'].independent_plan,plan);
 const reread=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
 const next=frame(reread,'NPC-006');
 assert.equal(next.previousResult.eventId,staged.events.events.at(-1).id);
 assert.equal(next.sourceEventId,next.previousResult.eventId);
 assert.equal(next.independentPlan,plan);
 const follow=draftOpenNPCAction({snapshot:reread,frame:next,elapsedMinutes:25,
  intention:'Noah reviews his newly established procurement priorities before deciding on an order.',
  reasoning:'The first event supports private re-evaluation but no transaction, supplier arrival or completed purchase.',
  outcome:'SYNTHETIC PRIVATE: Noah maintains a new priority without assuming parts delivery.',
  sourceEventIds:[next.sourceEventId],reviewed:true});
 const second=stageLivingWorldTurn({
  snapshot:reread,observedHead:head,turn:turn('two'),npcResolutions:[follow]});
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.deepEqual(second.events.events.at(-1).caused_by,[next.sourceEventId]);
 assert.ok(!second.chapter.includes('SYNTHETIC PRIVATE:'));
 assert.ok(second.transcript.entries.every(x=>!x.text.includes('SYNTHETIC PRIVATE:')));
 assert.equal(second.state.player.location_id,s.state.player.location_id);
});

test('NPC contexts retain actor-owned differences rather than a common routine list',()=>{
 const s=baseline(),r=frame(s,'NPC-005'),n=frame(s,'NPC-006');
 assert.notEqual(r.goal,n.goal);
 assert.notDeepEqual(r.resources,n.resources);
 assert.equal(n.sourceEventId,null);
 assert.equal(r.sourceEventId,'EV-000029');
 assert.equal(r.actionSelected,false);
 assert.equal(n.actionSelected,false);
});

test('stale proposals and cross-actor frame tampering cannot be staged',()=>{
 const s=baseline(),from=frame(s,'NPC-006'),tampered=structuredClone(from);
 tampered.sourceEventId='EV-000029';
 const args={snapshot:s,elapsedMinutes:25,
  intention:'Noah evaluates a private maintenance report unrelated to his shop.',
  reasoning:'Another actor secret must never be treated as Noah own information.',
  outcome:'SYNTHETIC PRIVATE: a forbidden action must not be staged.',reviewed:true};
 assert.throws(()=>draftOpenNPCAction({...args,frame:tampered}),/Stale NPC evidence/);
 const progressed=stageLivingWorldTurn({
  snapshot:s,observedHead:head,turn:turn('noop'),npcResolutions:[]});
 assert.throws(()=>draftOpenNPCAction({...args,snapshot:progressed,frame:from}),
  /Stale NPC evidence/);
});

test('zero fictional time produces no review and at most one outcome per actor per turn',()=>{
 const s=baseline(),zero=inspectOpenNPCAgency({snapshot:s,elapsedMinutes:0});
 assert.deepEqual(zero.frames,[]);
 const f=frame(s,'NPC-005'),draft=draftOpenNPCAction({
  snapshot:s,frame:f,elapsedMinutes:25,
  intention:'Rosa considers timing for an existing repair obligation.',
  reasoning:'The existing repair state is known, but neighbor availability and direct contact remain unknown.',
  outcome:'SYNTHETIC PRIVATE: Rosa leaves the repair task unresolved until meaningful new evidence.',
  reviewed:true});
 assert.throws(()=>stageLivingWorldTurn({
  snapshot:s,observedHead:head,turn:turn('double'),
  npcResolutions:[draft,draft]}),/Multiple outcomes for one NPC/);
 for(const [path,bytes] of Object.entries(original))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
});


test('a later independent initiative does not silently cite a previous unrelated NPC result',()=>{
 const s=baseline(),focus=frame(s,'NPC-005');
 assert.equal(focus.sourceEventId,'EV-000029');
 const unrelated=draftOpenNPCAction({snapshot:s,frame:focus,elapsedMinutes:25,
  intention:'Rosa considers another ordinary household priority unrelated to the repaired clock.',
  reasoning:'Her saved independent goals permit a separate private household initiative without assuming a meeting or delivery.',
  outcome:'SYNTHETIC PRIVATE: Rosa reconsiders an independent household task without any invented contact.',
  reviewed:true});
 assert.equal(Object.hasOwn(unrelated,'continuation_context'),false);
 const staged=stageLivingWorldTurn({snapshot:s,observedHead:head,
  turn:turn('new-independent-priority'),npcResolutions:[unrelated]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.deepEqual(staged.events.events.at(-1).caused_by,[]);
 assert.throws(()=>draftOpenNPCAction({snapshot:s,frame:focus,elapsedMinutes:25,
  intention:'Rosa plans an ordinary independent household task after thinking it through.',
  reasoning:'Her existing independent goals remain available and no outside secrets can be assumed.',
  outcome:'SYNTHETIC PRIVATE: An unknown event cannot justify the action.',
  sourceEventIds:['EV-999999'],reviewed:true}),
  /event it does not know/);
});
