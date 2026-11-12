import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateNPCCommitments,validateNPCCommitmentChange} from '../tools/living_world_obligations.mjs';
import {applyStateChanges,verifyStateChanges} from '../tools/state_changes.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {selectRelevantNPCs,reviewNPCCommitments} from '../tools/living_world_commitments.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const item=(overrides={})=>({
 id:'OBL-ROSA_CLOCK_001',summary:'Return the repaired clock to its owner',
 source_event_id:'EV-000031',due_day:null,status:'pending',priority:'normal',
 blockers:[],last_change_event_id:'EV-000031',resolution:null,resolution_event_id:null,
 ...overrides
});
const turn=(key)=>({
 key,intent:'Jack works quietly in his home workshop.',
 outcome:'Time passes while Jack stays in the workshop.',
 player_text:'I continue inspecting the unfinished arm.',
 narration_messages:['Light fills the workbench as a quiet interval passes.'],
 elapsed_days:0,elapsed_minutes:20
});
const resolve=(changes,outcome)=>({
 actor_id:'NPC-005',reviewed:true,resolved:true,
 causal_basis:'Rosa assesses the repaired clock and her future visit to the neighbor.',
 outcome:outcome??'Rosa considers when to return the clock; no delivery is claimed.',
 changes
});
const stage=(snapshot,key,changes)=>stageLivingWorldTurn({
 snapshot,turn:turn(key),observedHead:'a'.repeat(40),npcResolutions:[resolve(changes)]
});
test('new obligation is an event-backed, pending task, not a retroactive completed action',()=>{
 const before=JSON.stringify(baseline);
 const next=stage(baseline,'npc-obligation-intro-001',[
  {field:'commitments',before:[],after:[item()]}
 ]);
 assert.equal(next.manifest.last_completed_turn,baseline.manifest.last_completed_turn+1);
 assert.equal(next.events.events.at(-1).id,'EV-000031');
 assert.equal(next.events.events.at(-1).state_changes.at(-1).field,'commitments');
 assert.deepEqual(next.state.world.actors['NPC-005'].commitments,[item()]);
 assert.equal(next.state.world.actors['NPC-005'].location_id,'LOC-WILSON-APARTMENT');
 assert.equal(JSON.stringify(baseline),before);
 assert.ok(!next.chapter.includes(item().summary));
 assert.ok(!next.transcript.entries.at(-1).text.includes(item().summary));
 const d=inspectLivingWorld({snapshot:next,elapsedMinutes:20,actorIds:['NPC-005']});
 const entry=d.commitmentReview.find(x=>x.id===item().id);
 assert.equal(entry.origin,'saved_checkpoint');
 assert.equal(entry.review,'deadline_unknown');
 assert.equal('commitmentReview' in playerVisibleDiagnostic(d),false);
});
test('second reviewed NPC event may resolve the persisted obligation without erasing it',()=>{
 const staged=stage(baseline,'npc-obligation-intro-002',[
  {field:'commitments',before:[],after:[item()]}
 ]);
 const closed=item({status:'resolved',resolution:'Owner receives the repaired clock in a reviewed synthetic scene.',
   last_change_event_id:'EV-000033',resolution_event_id:'EV-000033'});
 const next=stage(staged,'npc-obligation-close-003',[
  {field:'commitments',before:[item()],after:[closed]}
 ]);
 assert.deepEqual(next.state.world.actors['NPC-005'].commitments,[closed]);
 assert.equal(next.events.events.at(-1).id,'EV-000033');
 assert.equal(next.events.events.at(-1).actor_ids[0],'NPC-005');
 assert.equal(next.manifest.last_completed_turn,11);
 assert.ok(!reviewNPCCommitments({state:next.state,elapsedMinutes:30,actorIds:['NPC-005']})
   .some(x=>x.id===closed.id));
});
test('blocker and due day create a private review without deciding outcome',()=>{
 const state=structuredClone(baseline.state);
 state.world.actors['NPC-003'].commitments=[item({
  id:'OBL-DELIVERY_001',source_event_id:'EV-000029',last_change_event_id:'EV-000029',
  status:'blocked',blockers:['Road access has not been confirmed'],due_day:-30,priority:'urgent'
 })];
 const a=selectRelevantNPCs({state});
 assert.equal(a[0],'NPC-003');
 const review=reviewNPCCommitments({state,elapsedMinutes:20,actorIds:['NPC-003']});
 assert.equal(review.find(x=>x.id==='OBL-DELIVERY_001').review,'blocked_review');
 assert.equal(review.find(x=>x.id==='OBL-DELIVERY_001').origin,'saved_checkpoint');
});
test('cannot backfill historical obligations, invent completion or omit causal references',()=>{
 assert.throws(()=>validateNPCCommitmentChange({before:[],after:[item()],eventId:'EV-000032'}),/source event/);
 assert.throws(()=>validateNPCCommitmentChange({before:[],after:[item({
  status:'resolved',resolution:'Already delivered at an unknown point',
  resolution_event_id:'EV-000031'})],eventId:'EV-000031'}),/begin resolved/);
 assert.throws(()=>validateNPCCommitments([item({status:'blocked',blockers:[]})]),/stated obstacle/);
 assert.throws(()=>validateNPCCommitments([item({due_day:undefined})]),/deadline/);
 assert.throws(()=>validateNPCCommitments([item({status:'resolved'})]),/causal resolution/);
});
test('closed obligations cannot reopen, change source, or disappear without a new event',()=>{
 const end=item({status:'resolved',resolution:'A confirmed and reviewed handover.',
  resolution_event_id:'EV-000032',last_change_event_id:'EV-000032'});
 assert.throws(()=>validateNPCCommitmentChange({before:[end],after:[item({
  last_change_event_id:'EV-000033'})],eventId:'EV-000033'}),/cannot be reopened/);
 assert.throws(()=>validateNPCCommitmentChange({before:[item()],after:[],eventId:'EV-000032'}),/cannot be silently deleted/);
 assert.throws(()=>validateNPCCommitmentChange({before:[item()],after:[item({
  source_event_id:'EV-000020',last_change_event_id:'EV-000032'})],eventId:'EV-000032'}),/source cannot be rewritten/);
});
test('stale obstacle update is atomic and source verification rejects made-up events',()=>{
 const state={player:{id:'PLAYER-001'},world:{locations:{},actors:{
  'NPC-005':{id:'NPC-005',commitments:[]}
 }}};
 const event={id:'EV-000031',turn:10,actor_ids:['NPC-005'],state_changes:[]};
 const snapshot={state,events:{events:[event]}},before=JSON.stringify(state);
 assert.throws(()=>applyStateChanges(state,event,[
  {field:'commitments',before:[],after:[item()]},
  {field:'commitments',before:[],after:[item({id:'OBL-SECOND_001'})]}
 ]),/Stale NPC commitments/);
 assert.equal(JSON.stringify(state),before);
 assert.deepEqual(event.state_changes,[]);
 applyStateChanges(state,event,[{field:'commitments',before:[],after:[item()]}]);
 assert.equal(verifyStateChanges(snapshot),true);
 state.world.actors['NPC-005'].commitments[0].source_event_id='EV-999999';
 assert.throws(()=>verifyStateChanges(snapshot),/unknown event/);
});
test('NPC obligations cannot be written through the player event or through cross-actor effects',()=>{
 const state=structuredClone(baseline.state);
 const e={id:'EV-000030',actor_ids:['PLAYER-001'],state_changes:[]};
 assert.throws(()=>applyStateChanges(state,e,[{field:'commitments',before:[],after:[item({
  source_event_id:'EV-000030',last_change_event_id:'EV-000030'})]}]),/Only NPC commitments/);
});
