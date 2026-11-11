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
