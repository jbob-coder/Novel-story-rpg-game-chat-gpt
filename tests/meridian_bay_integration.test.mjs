// Synthetic city integration only. All story inputs are read-only; remote and
// journal fixtures retain exact five-file commits entirely in memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles,readCheckpoint,saveChapterTransition,
 recoverJournaledSave} from '../tools/save_transaction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageMeridianBayTurn,saveMeridianBayTurn} from '../tools/meridian_bay_integration.mjs';
import {meridianBayDesign,prepareMeridianBayWorld} from '../tools/meridian_bay_locations.mjs';
import {inspectSceneEstablishedPlaces,verifyReviewedPlaceHistory} from '../tools/meridian_bay_discovery.mjs';
import {previewPrebuiltMeridianRoute} from '../tools/meridian_bay_prebuilt_routes.mjs';
import {allEvents,allTranscriptEntries} from '../tools/chapter_history.mjs';

const originals=Object.fromEntries(savePaths('CH-000').map(path=>[
 path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const baseline=()=>decodeFiveFiles(structuredClone(originals),'CH-000');
const sourceHead='a'.repeat(40),branch='qa/meridian-bay-phase1-synthetic';
const workshop='LOC-WILSON-WORKSHOP',market='LOC-COMMERCIAL-DISTRICT';
const noah='LOC-MARKET-NOAH-REPAIR';
const marketRoute=[workshop,'LOC-WILSON-APARTMENT','LOC-RAILGARDEN-RESIDENTIAL',market];
const designReview=source_commit=>({reviewed:true,design_id:meridianBayDesign().world_design_id,
 source_commit,reason:'SYNTHETIC editorial admission of the six already-authored locations.'});
const action=(key,overrides={})=>({key,player_text:'SYNTHETIC: remain at the bench.',
 intent:'A synthetic authorized interval.',outcome:'The chosen quiet interval concludes.',
 elapsed_days:0,elapsed_minutes:0,narration_messages:['SYNTHETIC: the workbench remains quiet.'],
 ...overrides});
const travel=(route,elapsed_minutes)=>({field:'location_id',before:route[0],after:route.at(-1),route,
 travel:{mode:'walk',elapsed_minutes,basis:'SYNTHETIC reviewed walking estimate for the chosen connected route.'}});

function fixture(){
 let head=sourceHead,created=0,updated=0,entry=null,failNextUpdate=false;
 const commits=new Map([[head,structuredClone(originals)]]);
 const remote={async readHead(){return head},
  async readFiles(sha,paths){
   const files=commits.get(sha);assert.ok(files,'Known simulated immutable commit');
   return Object.fromEntries(paths.map(path=>[path,files[path]]));
  },
  async assertFilesAbsent(sha,paths){
   assert.ok(paths.every(path=>!Object.hasOwn(commits.get(sha),path)));return true;
  },
  async createCommit({parentSha,files}){
   assert.equal(parentSha,head);const sha=(++created).toString(16).padStart(40,'0');
   commits.set(sha,{...commits.get(parentSha),...structuredClone(files)});return sha;
  },
  async updateHead({expectedSha,newSha}){
   assert.equal(expectedSha,head);
   if(failNextUpdate){failNextUpdate=false;throw Error('SYNTHETIC interruption before ref update');}
   head=newSha;updated++;return true;
  }
 };
 const journal={async read(){return structuredClone(entry)},
  async write(_branch,value){entry=structuredClone(value)}};
 return {remote,journal,commits,get head(){return head},get writes(){return [created,updated]},
  interruptNextUpdate(){failNextUpdate=true},
  async snapshot(){const manifest=JSON.parse(commits.get(head)['game/SAVE_MANIFEST.json']);
   return readCheckpoint({remote,commitSha:head,chapterId:manifest.chapter_id})}};
}

test('ordinary turn preparation keeps draft city sites out of the saved world',()=>{
 const snapshot=baseline(),before=JSON.stringify(snapshot);
 const draft=prepareMeridianBayWorld({state:snapshot.state});
 assert.equal(Object.keys(draft.world.locations).filter(id=>id.startsWith('LOC-')).length,14);
 const candidate=stageLivingWorldTurn({snapshot,observedHead:sourceHead,
  turn:action('synthetic-ordinary-no-city-admission')});
 assert.equal(Object.keys(candidate.state.world.locations).filter(id=>id.startsWith('LOC-')).length,8);
 assert.equal(candidate.state.world.prebuilt_design_id,undefined);
 assert.deepEqual(candidate.state.player.knowledge,snapshot.state.player.knowledge);
 assert.equal(JSON.stringify(snapshot),before);
});

test('a design route is not a travel permission before explicit world admission',()=>{
 const snapshot=baseline();
 const preview=previewPrebuiltMeridianRoute({state:snapshot.state,destinationId:noah});
 assert.equal(preview.status,'route_available');
 assert.equal(preview.graphSource,'draft_design_preview');
 assert.equal(preview.travelAuthorized,false);
 assert.throws(()=>stageLivingWorldTurn({snapshot,observedHead:sourceHead,
  turn:action('synthetic-draft-route-refused',{elapsed_minutes:30,
   changes:[travel([...marketRoute,noah],30)]})}),/Unknown location|known location|Nonadjacent|unknown destination/i);
 assert.equal(snapshot.state.player.location_id,workshop);
});

test('world admission binds editorial review to the verified source checkpoint',()=>{
 const snapshot=baseline(),before=JSON.stringify(snapshot);
 assert.throws(()=>stageMeridianBayTurn({snapshot,observedHead:sourceHead,
  turn:action('synthetic-stale-city-admission'),designReview:designReview('b'.repeat(40))}),
  /source HEAD differs/);
 assert.throws(()=>stageMeridianBayTurn({snapshot,observedHead:sourceHead,
  turn:action('synthetic-unreviewed-city-admission'),
  designReview:{...designReview(sourceHead),reviewed:false}}),/reviewed.*admission/i);
 assert.equal(JSON.stringify(snapshot),before);
});

test('city admission requires durable journaling before any remote action',async()=>{
 let calls=0;
 const result=await saveMeridianBayTurn({remote:{readHead(){calls++;}},branch,
  chapterId:'CH-000',turn:action('synthetic-no-city-journal'),designReview:designReview(sourceHead)});
 assert.equal(result.status,'blocked');assert.match(result.reason,/Durable journal/);
 assert.equal(calls,0);
});

test('authored city, physical discovery and chosen visit persist through interrupted save and chapter recovery',async()=>{
 const f=fixture(),initial=await f.snapshot();
 const admitted=await saveMeridianBayTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',turn:action('synthetic-city-admission'),designReview:designReview(f.head)});
 assert.equal(admitted.status,'verified',admitted.reason);
 let current=await f.snapshot();
 assert.equal(Object.keys(current.state.world.locations).filter(id=>id.startsWith('LOC-')).length,14);
 assert.equal(current.state.player.location_id,workshop);
 assert.deepEqual(current.state.player,initial.state.player);
 assert.deepEqual(current.state.time,initial.state.time);
 assert.deepEqual(current.state.world.actors,initial.state.world.actors);
 assert.deepEqual(inspectSceneEstablishedPlaces({snapshot:current}),[]);
 assert.equal(previewPrebuiltMeridianRoute({state:current.state,destinationId:noah}).graphSource,'admitted_world');

 const sceneQuote='SYNTHETIC: from Market Row, the repair-and-components shop has an identifiable frontage.';
 const accessQuote='SYNTHETIC: its public-facing entrance connects to the Market Row pavement.';
 const discoveryTurn=action('synthetic-city-observation',{
  player_text:'SYNTHETIC: walk to Market Row and observe the repair shop frontage.',
  intent:'Travel along the chosen saved route and observe a public exterior.',
  outcome:'The shop frontage is observed from its district without a visit inside.',
  elapsed_minutes:30,changes:[travel(marketRoute,30)],narration_messages:[sceneQuote,accessQuote],
  location_discoveries:[{id:noah,reviewed:true,public_access_confirmed:true,
   scene_quote:sceneQuote,access_quote:accessQuote,observed_from:market}]
 });
 f.interruptNextUpdate();
 const writesBefore=f.writes;
 const interrupted=await saveMeridianBayTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',turn:discoveryTurn});
 assert.equal(interrupted.status,'blocked');
 assert.match(interrupted.reason,/interruption before ref update/);
 assert.deepEqual(f.writes,[writesBefore[0]+1,writesBefore[1]]);
 const recovered=await recoverJournaledSave({remote:f.remote,journal:f.journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.equal(recovered.commitHead,interrupted.commitHead);
 assert.deepEqual(recovered.narration_messages,discoveryTurn.narration_messages);
 current=await f.snapshot();
 const observationEvent=current.manifest.last_event_id;
 assert.equal(current.state.player.location_id,market);
 let known=inspectSceneEstablishedPlaces({snapshot:current});
 assert.equal(known.length,1);assert.equal(known[0].locationId,noah);
 assert.equal(known[0].evidenceEventId,observationEvent);
 assert.equal(known[0].visited,false);assert.equal(known[0].accessNow,'unknown');
 const writes=f.writes;
 const redelivered=await recoverJournaledSave({remote:f.remote,journal:f.journal,branch});
 assert.equal(redelivered.status,'verified',redelivered.reason);
 assert.deepEqual(redelivered.narration_messages,discoveryTurn.narration_messages);
 assert.deepEqual(f.writes,writes);

 const visitTurn=action('synthetic-city-chosen-visit',{
  player_text:'SYNTHETIC: walk from Market Row to the repair shop public entrance.',
  intent:'Follow the chosen connection to the shop entrance.',
  outcome:'The chosen public entrance is reached; no service or encounter is claimed.',
  elapsed_minutes:5,changes:[travel([market,noah],5)],
  narration_messages:['SYNTHETIC: the short walk ends at the repair shop public entrance.']
 });
 const visited=await saveMeridianBayTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',turn:visitTurn});
 assert.equal(visited.status,'verified',visited.reason);
 current=await f.snapshot();
 const visitEvent=current.manifest.last_event_id;
 known=inspectSceneEstablishedPlaces({snapshot:current});
 assert.equal(known[0].visited,true);
 assert.ok(known[0].visitEventIds.includes(visitEvent));
 assert.equal(known[0].accessNow,'unknown');
 assert.deepEqual(current.state.world.actors,initial.state.world.actors);
 const beforeTransition=structuredClone(current),oldFiles={...current.sourceFiles};
 const nextPlan={plan_version:1,chapter_id:'CH-001',title:'Synthetic Meridian Bay continuation',
  status:'prepared',source_commit:f.head,purpose:'Retain authored geography and observed places across a chapter boundary.',
  time_context:{day:current.state.time.day,period:current.state.time.time_of_day,constraints:[]},
  location_ids:[market,noah],npc_ids:[],thread_ids:[],hidden_plan_ids:[],
  possible_developments:['Further chosen exploration may occur.'],
  exit_conditions:['A later synthetic interval reaches a natural narrative pause.']};
 const transitioned=await saveChapterTransition({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',nextPlan,reviewed:true,reason:'Synthetic chapter boundary after a completed chosen walk.'});
 assert.equal(transitioned.status,'verified',transitioned.reason);
 assert.deepEqual(transitioned.narration_messages,[]);
 current=await f.snapshot();
 assert.equal(current.manifest.chapter_id,'CH-001');
 assert.equal(current.events.events.length,0);assert.equal(current.transcript.entries.length,0);
 assert.deepEqual(current.state.world,beforeTransition.state.world);
 assert.deepEqual(current.state.player,beforeTransition.state.player);
 assert.deepEqual(current.state.time,beforeTransition.state.time);
 assert.equal(verifyReviewedPlaceHistory(current),true);
 known=inspectSceneEstablishedPlaces({snapshot:current});
 assert.equal(known[0].evidenceEventId,observationEvent);
 assert.ok(known[0].visitEventIds.includes(visitEvent));
 assert.equal(known[0].visited,true);
 for(const path of savePaths('CH-000').slice(0,3))assert.equal(f.commits.get(f.head)[path],oldFiles[path]);
 assert.equal(allEvents(current).length,current.manifest.last_event_sequence);
 assert.equal(allTranscriptEntries(current).length,current.manifest.last_transcript_sequence);
 const transitionWrites=f.writes;
 const chapterRecovered=await recoverJournaledSave({remote:f.remote,journal:f.journal,branch});
 assert.equal(chapterRecovered.status,'verified',chapterRecovered.reason);
 assert.deepEqual(chapterRecovered.narration_messages,[]);
 assert.deepEqual(f.writes,transitionWrites);
 for(const [path,text] of Object.entries(originals))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),text);
});
