// Entirely synthetic. Original story files are read, never written.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {savePaths,decodeFiveFiles,readCheckpoint,saveChapterTransition,recoverJournaledSave} from '../tools/save_transaction.mjs';
import {saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {evaluateNPCPlans,draftReviewedPlanResolution} from '../tools/world_plans.mjs';
import {allEvents,allTranscriptEntries} from '../tools/chapter_history.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {stageNarrativeTurn} from '../tools/turn_engine.mjs';
import {stageNarratorScene} from '../tools/narrative_archive.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const originals=Object.fromEntries(savePaths('CH-000').map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const actorId='NPC-005',home='LOC-WILSON-APARTMENT',branch='qa/world-plan-pilot';
const objective='SYNTHETIC PRIVATE OBJECTIVE: prepare a neighbor repair kit.';
const review=reason=>({reviewed:true,reason,observations:[{actor_id:actorId,
 fact:reason,source:'Direct inspection of the available household supplies in this synthetic interval.'}]});
const nextNPCEvent=s=>'EV-'+String(s.manifest.last_event_sequence+2).padStart(6,'0');
const eventIds=s=>new Set(allEvents(s).map(event=>event.id));
const plan=(eventId)=>({id:'PLAN-000001',kind:'actor_intent',owner_actor_id:actorId,
 objective,motivation:'SYNTHETIC PRIVATE MOTIVATION: help a neighbor with a later repair.',
 status:'proposed',requirements:[{kind:'location',location_id:home},
  {kind:'resource',key:'pilot_supply',expected:'ready'},
  {kind:'commitment',commitment_id:'OBL-PILOT-PREPARE',status:'pending'}],
 earliest_day:-29,dependencies:[],known_by:[actorId],risks:['A supply may be unavailable.'],
 alternatives:['Wait until supplies are available.'],source_event_id:eventId,
 last_change_event_id:eventId,resolution:null,resolution_event_id:null});
const obligation=eventId=>({id:'OBL-PILOT-PREPARE',summary:'SYNTHETIC: prepare a repair kit at home.',
 source_event_id:eventId,due_day:null,status:'pending',priority:'normal',blockers:[],
 last_change_event_id:eventId,resolution:null,resolution_event_id:null});

function remoteFixture(){
 let head='a'.repeat(40),created=0,updated=0,journalWrites=0,entry=null;
 const commits=new Map([[head,structuredClone(originals)]]);
 const remote={async readHead(){return head},
  async readFiles(sha,paths){
   const files=commits.get(sha);assert.ok(files,'Known simulated commit');
   return Object.fromEntries(paths.map(path=>[path,files[path]]));
  },
  async assertFilesAbsent(sha,paths){assert.ok(paths.every(path=>!Object.hasOwn(commits.get(sha),path)));return true},
  async createCommit({parentSha,files}){
   assert.equal(parentSha,head);const sha=(++created).toString(16).padStart(40,'0');
   commits.set(sha,{...commits.get(parentSha),...structuredClone(files)});return sha;
  },
  async updateHead({expectedSha,newSha}){assert.equal(expectedSha,head);head=newSha;updated++;return true}
 };
 const journal={async read(){return structuredClone(entry)},
  async write(_branch,value){entry=structuredClone(value);journalWrites++}};
 return {remote,journal,commits,get head(){return head},
  get writes(){return [created,updated,journalWrites]},
  async snapshot(){const manifest=JSON.parse(commits.get(head)['game/SAVE_MANIFEST.json']);
   return readCheckpoint({remote,commitSha:head,chapterId:manifest.chapter_id})}};
}
async function saveNPC(f,snapshot,changes,label){
 const turn=snapshot.manifest.last_completed_turn+1;
 const action={key:'synthetic-world-plan-'+turn,player_text:'SYNTHETIC: continue working at the bench.',
  intent:'Synthetic authorized workshop interval.',outcome:'A quiet interval passes.',
  narration_messages:['SYNTHETIC SCENE '+turn+': Light falls across the workbench.'],
  elapsed_days:0,elapsed_minutes:20};
 const result=await saveLivingWorldTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:snapshot.manifest.chapter_id,turn:action,npcResolutions:[{
   actor_id:actorId,reviewed:true,resolved:true,causal_basis:'An independent household task in synthetic QA.',
   outcome:label,changes}]});
 assert.equal(result.status,'verified',result.reason);
 assert.deepEqual(result.narration_messages,action.narration_messages);
 return f.snapshot();
}
function assessment(snapshot){return evaluateNPCPlans({state:snapshot.state,actorId,
 elapsedMinutes:20,elapsedDays:0,eventIds:eventIds(snapshot)})[0]}

test('private conditional plan survives interruption, chapter boundary, completion and literal recovery',async()=>{
 const f=remoteFixture(),initial=await f.snapshot(),initialWorld=structuredClone(initial.state.world);
 const introduction=nextNPCEvent(initial),resources=initial.state.world.actors[actorId].resources;
 let current=await saveNPC(f,initial,[
  {field:'resources',before:resources,after:{...resources,pilot_supply:'ready'}},
  {field:'commitments',before:[],after:[obligation(introduction)]},
  {field:'plans',before:[],after:[plan(introduction)],review:review('Rosa forms a private intention after inspecting the kit.')}
 ],'SYNTHETIC: Rosa records an intention and an unfinished preparation task.');
 const ready=assessment(current);
 assert.equal(ready.ready,true);
 const untouched=JSON.stringify(current);
 assert.deepEqual(evaluateNPCPlans({state:current.state,actorId,elapsedMinutes:0,
  elapsedDays:0,eventIds:eventIds(current)}),[]);
 assert.equal(JSON.stringify(current),untouched);
 assert.equal(current.state.world.actors[actorId].plans[0].status,'proposed');
 // Every narration entry point enforces the same privacy boundary, including
 // direct transaction builders that do not pass through the coordinator.
 const guard={observed_head:f.head,previous_attempt:null};
 const beforeLeakAttempt=JSON.stringify(current);
 assert.throws(()=>stageNarrativeTurn(current,{save_guard:guard,key:'synthetic-private-leak',
  player_text:'SYNTHETIC INPUT',intent:'A synthetic observation.',outcome:'A quiet moment.',
  elapsed_days:0,elapsed_minutes:0,narration_messages:[objective]}),/Private plan information leaked/);
 assert.throws(()=>stageNarratorScene(current,objective,'synthetic-private-opening',guard),
  /Private plan information leaked/);
 assert.equal(JSON.stringify(current),beforeLeakAttempt);

 // A condition changes after assessment. The stale proposal cannot force success.
 const interrupted=structuredClone(current);
 interrupted.state.world.actors[actorId].resources.pilot_supply='unavailable';
 assert.throws(()=>draftReviewedPlanResolution({state:interrupted.state,assessment:ready,
  eventId:nextNPCEvent(current),outcome:'succeeded',review:review('The old assessment is no longer valid.')}));
 const blockedChange=draftReviewedPlanResolution({state:interrupted.state,
  assessment:assessment(interrupted),eventId:nextNPCEvent(current),outcome:'blocked',
  review:review('A needed supply is unavailable, so preparation must wait.')});
 current=await saveNPC(f,current,[
  {field:'resources',before:current.state.world.actors[actorId].resources,
   after:interrupted.state.world.actors[actorId].resources},blockedChange
 ],'SYNTHETIC: a missing supply prevents the intended preparation.');
 assert.equal(current.state.world.actors[actorId].plans[0].status,'blocked');
 assert.equal(current.state.world.actors[actorId].commitments[0].status,'pending');
 const report=inspectLivingWorld({snapshot:current,elapsedMinutes:20,actorIds:[actorId]});
 assert.ok(!JSON.stringify(playerVisibleDiagnostic(report)).includes(objective));
 assert.ok(!current.chapter.includes(objective));

 const beforeTransition=structuredClone(current),closedFiles={...current.sourceFiles};
 const nextPlan={plan_version:1,chapter_id:'CH-001',title:'Synthetic continuation',status:'prepared',
  source_commit:f.head,purpose:'Continue the same open world situation in a new narrative container.',
  time_context:{day:current.state.time.day,period:current.state.time.time_of_day,constraints:[]},
  location_ids:[home],npc_ids:[actorId],thread_ids:current.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
  hidden_plan_ids:['PLAN-000001'],possible_developments:['The task may remain blocked or become possible.'],
  exit_conditions:['The next narrative interval reaches a natural closure.']};
 const transition=await saveChapterTransition({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',nextPlan,reviewed:true,reason:'Synthetic narrative boundary after an unresolved interruption.'});
 assert.equal(transition.status,'verified',transition.reason);
 assert.deepEqual(transition.narration_messages,[]);
 current=await f.snapshot();
 assert.deepEqual(current.state.world,beforeTransition.state.world);
 assert.deepEqual(current.state.time,beforeTransition.state.time);
 assert.deepEqual(current.state.narrative_threads,beforeTransition.state.narrative_threads);
 assert.equal(current.manifest.last_completed_turn,beforeTransition.manifest.last_completed_turn);
 assert.equal(current.manifest.chapter_id,'CH-001');
 for(const path of savePaths('CH-000').slice(0,3))assert.equal(f.commits.get(f.head)[path],closedFiles[path]);

 const restored=structuredClone(current);
 restored.state.world.actors[actorId].resources.pilot_supply='ready';
 const resume=draftReviewedPlanResolution({state:restored.state,assessment:assessment(restored),
  eventId:nextNPCEvent(current),outcome:'progress',review:review('The supply is available and Rosa resumes preparation.')});
 current=await saveNPC(f,current,[
  {field:'resources',before:current.state.world.actors[actorId].resources,
   after:restored.state.world.actors[actorId].resources},resume
 ],'SYNTHETIC: preparation can resume after the supply becomes available.');
 assert.equal(current.state.world.actors[actorId].plans[0].status,'active');
 const finishId=nextNPCEvent(current),old=current.state.world.actors[actorId].commitments;
 const finish=draftReviewedPlanResolution({state:current.state,assessment:assessment(current),
  eventId:finishId,outcome:'succeeded',review:review('Rosa assembles and checks the preparation kit inside the home.')});
 const finalResources=current.state.world.actors[actorId].resources;
 current=await saveNPC(f,current,[finish,{field:'commitments',before:old,
  after:[{...old[0],status:'resolved',last_change_event_id:finishId,resolution_event_id:finishId,
   resolution:'SYNTHETIC: the kit is assembled and checked at home.'}]},
  {field:'resources',before:finalResources,after:{...finalResources,pilot_kit:'prepared'}}],
 'SYNTHETIC: the preparation is completed at home; no visit or delivery is claimed.');
 assert.equal(current.state.world.actors[actorId].plans[0].status,'completed');
 assert.equal(current.state.world.actors[actorId].commitments[0].status,'resolved');
 assert.equal(current.state.world.actors[actorId].resources.pilot_kit,'prepared');
 assert.deepEqual(current.state.player,initial.state.player);
 assert.equal(current.state.world.actors[actorId].location_id,home);
 const writes=f.writes;
 const recovered=await recoverJournaledSave({remote:f.remote,journal:f.journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.deepEqual(recovered.narration_messages,[current.transcript.entries.at(-1).text]);
 assert.deepEqual(f.writes,writes);
 assert.equal(allEvents(current).length,current.manifest.last_event_sequence);
 assert.equal(allTranscriptEntries(current).length,current.manifest.last_transcript_sequence);
 assert.ok(allEvents(current).some(e=>e.state_changes.some(c=>c.field==='plans'&&c.review?.observations.length)));
 assert.equal(initialWorld.actors[actorId].plans,undefined);
 for(const [path,text] of Object.entries(originals))assert.equal(readFileSync(resolve(root,path),'utf8'),text);
});
