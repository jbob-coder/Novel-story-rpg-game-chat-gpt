// Synthetic integration seam: chapter transitions must not erase fields added
// by the parallel NPC needs/services branch. This does NOT import that branch
// or claim to have tested the combined implementations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const originalFiles=Object.fromEntries(savePaths('CH-000').map(path=>
  [path,readFileSync(resolve(root,path),'utf8')]));
const fixedHead='a'.repeat(40);

function chapterPlan(snapshot) {
  return {
    plan_version:1,chapter_id:'CH-001',title:'Synthetic NPC contract',
    status:'prepared',source_commit:fixedHead,
    purpose:'Verify future NPC metadata survives a chapter boundary without a story turn.',
    time_context:{day:snapshot.state.time.day,
      period:snapshot.state.time.time_of_day,constraints:[]},
    location_ids:[snapshot.state.player.location_id],
    npc_ids:['NPC-001','NPC-005','NPC-007'],
    thread_ids:snapshot.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
    hidden_plan_ids:[],possible_developments:[],
    exit_conditions:['The fictional situation reaches an appropriate boundary.']
  };
}

test('parallel NPC state extension fields remain intact through a reviewed chapter boundary',()=>{
  const baseline=decodeFiveFiles(originalFiles,'CH-000');
  const synthetic=structuredClone(baseline);
  const extended=['NPC-001','NPC-005','NPC-007'];
  for(const actorId of extended){
    const actor=synthetic.state.world.actors[actorId];
    // Empty but valid initial collections: PRs #10-15 will supply event-backed
    // nonempty cases in a combined integration branch, never retroactive data.
    actor.commitments=[];
    actor.needs=[];
    actor.service_cases=[];
    actor.plans=[];
  }
  synthetic.sourceFiles=encodeFiveFiles(synthetic);
  const prior=structuredClone(synthetic);
  assert.equal(verifyNarrativeSnapshot(synthetic),true);
  const next=stageChapterTransition({
    snapshot:synthetic,nextPlan:chapterPlan(synthetic),reviewed:true,
    reason:'Synthetic separation of story arcs for NPC metadata compatibility.',
    observedHead:fixedHead
  });
  assert.equal(verifyNarrativeSnapshot(next),true);
  assert.equal(next.manifest.chapter_id,'CH-001');
  assert.equal(next.manifest.last_completed_turn,9);
  assert.equal(next.manifest.last_event_id,'EV-000029');
  assert.equal(next.manifest.last_transcript_id,'TXT-000020');
  assert.equal(next.state.time.day,-29);
  assert.deepEqual(next.state.world,prior.state.world);
  assert.deepEqual(next.state.narrative_threads,prior.state.narrative_threads);
  for(const id of extended){
    const actor=next.state.world.actors[id];
    for(const key of ['commitments','needs','service_cases','plans'])
      assert.deepEqual(actor[key],[]);
  }
  assert.deepEqual(synthetic,prior);
  for(const [path,original] of Object.entries(originalFiles)){
    assert.equal(readFileSync(resolve(root,path),'utf8'),original,
      'synthetic chapter QA must never modify '+path);
  }
});
