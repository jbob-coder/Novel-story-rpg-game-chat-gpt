// Noncanonical multi-turn rehearsal. NEVER copy fixtures into game/ or chapters/.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {savePaths,decodeFiveFiles} from '../tools/save_transaction.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const paths=savePaths('CH-000'),source='a'.repeat(40),branch='qa/living-world-synthetic-only';
const originals=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const initial=decodeFiveFiles(originals,'CH-000');
const template=(number)=>({key:'qa-synthetic-lw-step-'+String(number).padStart(3,'0'),
 intent:'Synthetic, no player input.',outcome:'Quiet continuation in the workshop.',
 player_text:'SYNTHETIC QA INPUT '+number,
 narration_messages:['SYNTHETIC QA SCENE '+number+': Only perceptions available to Jack.'],
 elapsed_days:0,elapsed_minutes:20});
test('three synthetic turns preserve causality, privacy, and exact five-file readback',async()=>{
 let head=source,created=0,updates=0;
 const commits=new Map([[source,originals]]);
 const remote={
  async readHead(){return head},
  async readFiles(sha,wanted){
   const stored=commits.get(sha);if(!stored)throw Error('Unknown simulated commit');
   return Object.fromEntries(wanted.map(path=>[path,stored[path]]));
  },
  async createCommit({parentSha,files}){
   assert.equal(parentSha,head);
   assert.deepEqual(Object.keys(files).sort(),paths.slice().sort());
   const next=(++created).toString(16).padStart(40,'0');
   commits.set(next,structuredClone(files));return next;
  },
  async updateHead({expectedSha,newSha}){
   assert.equal(head,expectedSha);head=newSha;updates++;return true;
  }
 };
 const checkpoints=[];
 for(let i=1;i<=3;i++){
  const current=decodeFiveFiles(commits.get(head),'CH-000');
  const privateReport=inspectLivingWorld({snapshot:current,elapsedMinutes:20});
  assert.ok(privateReport.selectedActorIds.length>0);
  assert.equal('commitmentReview' in playerVisibleDiagnostic(privateReport),false);
  const actorId=['NPC-005','NPC-003','NPC-006'][i-1];
  const before=current.state.world.actors[actorId].independent_plan;
  const secret='QA-PRIVATE-NPC-RESOLUTION-'+i+'-NOT-KNOWN-TO-JACK';
  const proposed={actor_id:actorId,resolved:true,reviewed:true,
   causal_basis:'A plausible independent NPC choice in synthetic QA.',
   outcome:secret,
   changes:[{field:'independent_plan',before,
    after:'QA-only private ongoing plan '+i}]};
  const result=await saveLivingWorldTurn({remote,branch,chapterId:'CH-000',
   turn:template(i),npcResolutions:[proposed]});
  assert.equal(result.status,'verified',result.reason);
  assert.equal(result.attempt.percent,100);
  const snapshot=decodeFiveFiles(commits.get(head),'CH-000');
  assert.equal(snapshot.manifest.last_completed_turn,initial.manifest.last_completed_turn+i);
  assert.equal(snapshot.events.events.at(-1).outcome,secret);
  assert.ok(!snapshot.chapter.includes(secret));
  assert.ok(!snapshot.transcript.entries.at(-1).text.includes(secret));
  assert.equal(snapshot.state.world.actors[actorId].independent_plan,'QA-only private ongoing plan '+i);
  assert.equal(snapshot.state.player.location_id,initial.state.player.location_id);
  assert.equal(snapshot.state.time.day,-29);
  assert.equal(snapshot.state.time.clock_time,null);
  assert.equal(snapshot.state.time.calendar_date,null);
  checkpoints.push(head);
 }
 assert.equal(created,3);assert.equal(updates,3);
 assert.equal(commits.get(source)['game/SAVE_MANIFEST.json'],originals['game/SAVE_MANIFEST.json']);
 assert.equal(decodeFiveFiles(originals,'CH-000').manifest.last_completed_turn,9);
 assert.equal(new Set(checkpoints).size,3);
});
