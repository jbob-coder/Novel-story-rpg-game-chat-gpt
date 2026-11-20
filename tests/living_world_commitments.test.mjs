import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectRelevantNPCs,reviewNPCCommitments} from '../tools/living_world_commitments.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const state=JSON.parse(readFileSync(resolve(root,'game/STATE.json'),'utf8'));
test('proximity selects Rosa before distant workers',()=>{
 const a=selectRelevantNPCs({state});
 assert.ok(a.includes('NPC-005'));assert.ok(a.length<=3);
});
test('commitment review never changes checkpoint or actor plans',()=>{
 const before=JSON.stringify(state);
 const x=reviewNPCCommitments({state,actorIds:['NPC-005'],elapsedMinutes:15});
 assert.equal(x[0].review,'deadline_unknown');
 assert.equal(JSON.stringify(state),before);
});
test('a due day from an explicit event is review-only, never automatically completed',()=>{
 const x=reviewNPCCommitments({state,actorIds:['NPC-003'],elapsedMinutes:15,commitments:[
 {id:'OBL-TEST_001',actor_id:'NPC-003',source_event_id:'EV-000001',
 summary:'Paid delivery is unresolved',status:'pending',due_day:-30}
 ]});
 assert.equal(x.find(c=>c.id==='OBL-TEST_001').review,'overdue_review');
 assert.ok(x.every(c=>c.requiresResolution));
});
test('resolved commitment not reported as pending',()=>{
 const x=reviewNPCCommitments({state,actorIds:['NPC-003'],elapsedMinutes:15,commitments:[
 {id:'OBL-TEST_002',actor_id:'NPC-003',source_event_id:'EV-000001',
 summary:'Already completed',status:'resolved',due_day:-30}
 ]});
 assert.ok(!x.some(c=>c.id==='OBL-TEST_002'));
});
test('malformed actor commitments rejected instead of invented',()=>{
 assert.throws(()=>reviewNPCCommitments({state,actorIds:['NPC-003'],elapsedMinutes:15,commitments:[
 {id:'OBL-TEST_003',actor_id:'NPC-003',summary:'Fake due',status:'pending',due_day:-30}
 ]}),/source event/);
});
