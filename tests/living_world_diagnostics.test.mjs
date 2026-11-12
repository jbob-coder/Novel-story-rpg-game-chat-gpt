import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const snapshot={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
test('diagnostic preserves latest saved checkpoint and does not change files',()=>{
 const before=JSON.stringify(snapshot);
 const d=inspectLivingWorld({snapshot,elapsedMinutes:25,actorIds:['NPC-004','NPC-005']});
 assert.equal(d.classification,'narrator_private_only');
 assert.equal(d.checkpoint.turn,snapshot.manifest.last_completed_turn);
 assert.equal(d.checkpoint.event,snapshot.manifest.last_event_id);
 assert.equal(d.proposedNPCActivities.length,2);
 assert.ok(d.proposedNPCActivities.every(x=>x.kind==='unresolved_proposal'));
 assert.equal(JSON.stringify(snapshot),before);
});
test('unknown schedules remain unknown instead of inventing closures',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:20,actorIds:['NPC-006']});
 assert.ok(Object.values(d.placeAvailability).every(x=>x.status==='unknown'));
 assert.equal(d.proposedNPCActivities[0].availability,'unknown');
});
test('explicit confirmed exception is visible as availability, never an event',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:20,actorIds:['NPC-007'],
   exceptions:{'NPC-007':{confirmed:true,status:'closed'}}});
 assert.equal(d.proposedNPCActivities[0].availability,'closed');
 assert.equal(d.proposedNPCActivities[0].kind,'unresolved_proposal');
});
test('safe player projection cannot expose private offscreen plans or hidden threads',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:20,actorIds:['NPC-001','NPC-004']});
 const visible=playerVisibleDiagnostic(d);
 assert.equal(visible.turn,snapshot.manifest.last_completed_turn);
 assert.deepEqual(visible.knownFacts,snapshot.state.player.knowledge);
 assert.equal('proposedNPCActivities' in visible,false);
 assert.equal('unresolvedThreads' in visible,false);
 assert.equal('placeAvailability' in visible,false);
 assert.equal('pending' in visible,false);
 assert.equal('guardrails' in visible,false);
});
test('zero elapsed minutes never generates fictitious NPC activity',()=>{
 const d=inspectLivingWorld({snapshot,actorIds:['NPC-004','NPC-005'],elapsedMinutes:0});
 assert.deepEqual(d.proposedNPCActivities,[]);
});
test('invalid actor selections and time are rejected',()=>{
 assert.throws(()=>inspectLivingWorld({snapshot,actorIds:['NPC-004','NPC-004'],elapsedMinutes:15}),/unique IDs/);
 assert.throws(()=>inspectLivingWorld({snapshot,elapsedMinutes:-5}),/Invalid elapsed/);
});
test('player projection refuses unsupported/untrusted reports',()=>{
 assert.throws(()=>playerVisibleDiagnostic({classification:'some_other_kind'}),/Narrator diagnostic required/);
});

test('default diagnostic chooses relevant nearby NPCs without forcing any event',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:20});
 assert.ok(d.selectedActorIds.length>0&&d.selectedActorIds.length<=3);
 assert.ok(d.selectedActorIds.includes('NPC-005'));
 assert.ok(d.commitmentReview.every(x=>x.requiresResolution&&x.visibility==='narrator_private'));
 assert.equal('commitmentReview' in playerVisibleDiagnostic(d),false);
});
test('explicit empty selection preserves zero NPC suggestions',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:20,actorIds:[]});
 assert.deepEqual(d.proposedNPCActivities,[]);
 assert.deepEqual(d.commitmentReview,[]);
});
test('commitment audit never invents deadline or completion',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:30,actorIds:['NPC-004','NPC-005']});
 assert.ok(d.commitmentReview.some(x=>x.actorId==='NPC-004'&&x.review==='deadline_unknown'));
 assert.ok(d.commitmentReview.every(x=>x.kind==='existing_plan'));
});
test('an explicitly recorded deadline can be reviewed without declaring delivery',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:20,actorIds:['NPC-003'],commitments:[
  {id:'OBL-DELIVERY_001',actor_id:'NPC-003',
   summary:'Deliver parcel to contracted customer',
   status:'pending',source_event_id:'EV-000001',due_day:-30}
 ]});
 const x=d.commitmentReview.find(x=>x.id==='OBL-DELIVERY_001');
 assert.equal(x.review,'overdue_review');
 assert.equal(x.requiresResolution,true);
 assert.equal('commitmentReview' in playerVisibleDiagnostic(d),false);
});
test('zero narrative time yields no commitment activity',()=>{
 const d=inspectLivingWorld({snapshot,elapsedMinutes:0});
 assert.deepEqual(d.commitmentReview,[]);
});
