import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyConsequences,stageConsequences} from '../tools/consequences.mjs';
const state={player:{id:'PLAYER-001'},world:{actors:{'NPC-001':{}}},narrative_threads:[]};
const events={events:[{id:'EV-000001',turn:1},{id:'EV-000002',turn:2}]};
const snapshot=(turn)=>({state:structuredClone(state),events:structuredClone(events),manifest:{last_completed_turn:turn}});
const open={op:'open',event_id:'EV-000001',owner_actor_id:'PLAYER-001',question:'¿Cómo afectará la decisión a los demás?',scope:'observable',summary:'Jack decide intervenir con resultados todavía inciertos.',visibility:'known'};
test('initial ledger is valid and empty',()=>assert.equal(verifyConsequences(snapshot(1)),true));
test('cannot preordain an outcome without an event',()=>assert.throws(()=>stageConsequences(snapshot(1),[{...open,event_id:'EV-999999'}]),/actual event/));
test('opening choice creates event-backed unresolved thread',()=>{const x=stageConsequences(snapshot(1),[open]);assert.equal(x.state.narrative_threads[0].status,'open');assert.equal(x.state.narrative_threads[0].origin_event_id,'EV-000001');assert.equal(state.narrative_threads.length,0)});
test('subsequent event changes same thread',()=>{const x=stageConsequences(snapshot(1),[open]);x.manifest.last_completed_turn=2;const n=stageConsequences(x,[{op:'develop',thread_id:'THREAD-000001',event_id:'EV-000002',summary:'La reacción se extiende a la estación.',visibility:'hidden'}]);assert.equal(n.state.narrative_threads[0].history.length,2);assert.equal(n.state.narrative_threads[0].status,'open')});
test('event-based resolution closes a specific thread',()=>{const x=stageConsequences(snapshot(1),[open]);x.manifest.last_completed_turn=2;const n=stageConsequences(x,[{op:'resolve',thread_id:'THREAD-000001',event_id:'EV-000002',summary:'El conflicto terminó por una consecuencia comprobada.',visibility:'known'}]);assert.equal(n.state.narrative_threads[0].resolution_event_id,'EV-000002');assert.equal(n.state.narrative_threads[0].status,'resolved')});
test('cannot close same branch twice',()=>{let x=stageConsequences(snapshot(1),[open]);x.manifest.last_completed_turn=2;x=stageConsequences(x,[{op:'resolve',thread_id:'THREAD-000001',event_id:'EV-000002',summary:'Resolución confirmada dentro del mundo.',visibility:'known'}]);assert.throws(()=>stageConsequences(x,[{op:'resolve',thread_id:'THREAD-000001',event_id:'EV-000002',summary:'Resolución repetida inválida.',visibility:'known'}]),/not open/)});
test('offscreen information can remain hidden',()=>{const x=stageConsequences(snapshot(1),[{...open,visibility:'hidden'}]);assert.equal(x.state.narrative_threads[0].history[0].visibility,'hidden')});
test('no fake pregame threads without played actions',()=>assert.equal(state.narrative_threads.length,0));

test('same-turn consequences must preserve actual source event order',()=>{
 const prior=stageConsequences(snapshot(1),[open]);
 prior.manifest.last_completed_turn=2;
 prior.events.events.push({id:'EV-000003',turn:2});
 const good=stageConsequences(prior,[
  {op:'develop',thread_id:'THREAD-000001',event_id:'EV-000002',
   summary:'An independently observed reaction follows the original event.',visibility:'hidden'},
  {op:'resolve',thread_id:'THREAD-000001',event_id:'EV-000003',
   summary:'A later event closes the consequences with observed evidence.',visibility:'known'}
 ]);
 assert.equal(verifyConsequences(good),true);
 assert.deepEqual(good.state.narrative_threads[0].history.map(h=>h.event_id),
  ['EV-000001','EV-000002','EV-000003']);
 assert.throws(()=>stageConsequences(prior,[
  {op:'develop',thread_id:'THREAD-000001',event_id:'EV-000003',
   summary:'A later event is intentionally placed before an earlier event.',visibility:'hidden'},
  {op:'resolve',thread_id:'THREAD-000001',event_id:'EV-000002',
   summary:'An earlier event should not close a future sequence.',visibility:'known'}
 ]),/out of order/);
});

test('a saved history with reversed same-turn events fails checkpoint verification',()=>{
 const prior=stageConsequences(snapshot(1),[open]);
 prior.manifest.last_completed_turn=2;
 prior.events.events.push({id:'EV-000003',turn:2});
 const staged=stageConsequences(prior,[
  {op:'develop',thread_id:'THREAD-000001',event_id:'EV-000002',
   summary:'The first independent observation is archived.',visibility:'hidden'},
  {op:'develop',thread_id:'THREAD-000001',event_id:'EV-000003',
   summary:'The second observation follows the first.',visibility:'hidden'}
 ]);
 const forged=structuredClone(staged);
 forged.state.narrative_threads[0].history[1].event_id='EV-000003';
 forged.state.narrative_threads[0].history[2].event_id='EV-000002';
 assert.throws(()=>verifyConsequences(forged),/out of order/);
});

test('the same event cannot both develop and resolve the same thread',()=>{
 const prior=stageConsequences(snapshot(1),[open]);
 prior.manifest.last_completed_turn=2;
 const first=stageConsequences(prior,[{
  op:'develop',thread_id:'THREAD-000001',event_id:'EV-000002',
  summary:'A first review records the impact.',visibility:'known'
 }]);
 assert.throws(()=>stageConsequences(first,[{
  op:'resolve',thread_id:'THREAD-000001',event_id:'EV-000002',
  summary:'A duplicate causal reference attempts to close the thread.',visibility:'known'
 }]),/already used/);
});

test('a forged development after a resolved event is not a valid saved thread',()=>{
 const prior=stageConsequences(snapshot(1),[open]);
 prior.manifest.last_completed_turn=2;
 const resolved=stageConsequences(prior,[{
  op:'resolve',thread_id:'THREAD-000001',event_id:'EV-000002',
  summary:'The last causal event definitively resolves the branch.',visibility:'known'
 }]);
 const forged=structuredClone(resolved);
 forged.events.events.push({id:'EV-000003',turn:3});
 forged.state.narrative_threads[0].history.push({
  kind:'develop',event_id:'EV-000003',
  summary:'A later forged detail appears after the recorded closure.',
  visibility:'hidden'
 });
 assert.throws(()=>verifyConsequences(forged),/after resolution/);
});

test('event order checks do not restrict actor identity or independent thread scope',()=>{
 const independent=snapshot(2);
 independent.events.events[1].actor_ids=['NPC-001'];
 independent.events.events[1].known_to=['NPC-001'];
 const npcOpen={...open,event_id:'EV-000002',owner_actor_id:'NPC-001',
  scope:'world',visibility:'hidden'};
 const staged=stageConsequences(independent,[npcOpen]);
 assert.equal(verifyConsequences(staged),true);
 assert.equal(staged.state.narrative_threads[0].owner_actor_id,'NPC-001');
 assert.equal(staged.state.narrative_threads[0].scope,'world');
});
