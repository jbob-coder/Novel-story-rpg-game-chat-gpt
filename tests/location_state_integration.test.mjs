// Fully synthetic: admission is not a turn; later closures and repairs are.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {stageWorldAdmission} from '../tools/world_admission.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {meridianBayDesign,inspectPrebuiltMeridianBay} from '../tools/meridian_bay_locations.mjs';
import {previewPrebuiltMeridianRoute} from '../tools/meridian_bay_prebuilt_routes.mjs';
import {applyStateChanges} from '../tools/state_changes.mjs';
import {applyReviewedPlaceDiscovery} from '../tools/meridian_bay_discovery.mjs';
import {preAdmissionFilesForQA} from './helpers/meridian_bay_fixture.mjs';
const head='a'.repeat(40),place='LOC-MARKET-NOAH-REPAIR';
const files=preAdmissionFilesForQA(Object.fromEntries(savePaths('CH-000').map(path=>[
 path,readFileSync(new URL('../'+path,import.meta.url),'utf8')])));
const admitted=()=>stageWorldAdmission({snapshot:decodeFiveFiles(files,'CH-000'),observedHead:head,
 designReview:{reviewed:true,source_commit:head,design_id:meridianBayDesign().world_design_id,
  reason:'SYNTHETIC independent world admission for dynamic-place QA.'}});
function changeBusiness(snapshot,overrides,key){
 const event='EV-'+String(snapshot.manifest.last_event_sequence+2).padStart(6,'0');
 const before=snapshot.state.world.location_states?.[place]??null;
 const after={operating_status:'unknown',physical_condition:'unknown',opening_hours:null,
  note:'SYNTHETIC reviewed business condition.',...before,...overrides,last_change_event_id:event};
 return stageLivingWorldTurn({snapshot,observedHead:head,turn:{key,
  player_text:'SYNTHETIC: continue working quietly.',intent:'A chosen synthetic work interval.',
  outcome:'The quiet work interval ends.',narration_messages:['SYNTHETIC: daylight falls on the workbench.'],
  elapsed_days:0,elapsed_minutes:20},npcResolutions:[{actor_id:'NPC-006',reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC: Noah reviews and records a change to his business.',
   outcome:'SYNTHETIC: a private shop condition changes.',
   changes:[{field:'location_state',location_id:place,before,after}]}]});
}

test('private closure, schedule and damage survive a complete chapter boundary and can later change',()=>{
 const source=admitted(),originalDesign=structuredClone(source.state.world.locations[place]);
 const closed=changeBusiness(source,{operating_status:'temporarily_closed',physical_condition:'damaged',
  opening_hours:{confirmed:true,weekdays:{'0':[[540,1020]],'6':[]}}},'synthetic-business-closure');
 const serialized=encodeFiveFiles(closed),loaded=decodeFiveFiles(serialized,'CH-000');
 const nextPlan={plan_version:1,chapter_id:'CH-001',title:'Synthetic business continuity',status:'prepared',
  source_commit:head,purpose:'Carry private business conditions into a new chapter.',
  time_context:{day:loaded.state.time.day,period:loaded.state.time.time_of_day,constraints:[]},
  location_ids:[place],npc_ids:['NPC-006'],thread_ids:[],hidden_plan_ids:[],
  possible_developments:['An independently reviewed repair may later change the conditions.'],
  exit_conditions:['A natural synthetic narrative pause.']};
 const transition=stageChapterTransition({snapshot:loaded,observedHead:head,nextPlan,reviewed:true,
  reason:'Synthetic chapter boundary with private conditions unresolved.'});
 let restored=decodeFiveFiles({...serialized,...encodeFiveFiles(transition)},'CH-001');
 const report=inspectLivingWorld({snapshot:restored,includeCityDesign:true,weekday:0,minute:600});
 assert.equal(report.placeAvailability[place].status,'closed');
 assert.equal(report.cityDesign.locations.find(x=>x.locationId===place).accessNow,'closed');
 assert.equal(previewPrebuiltMeridianRoute({state:restored.state,destinationId:place,weekday:0,minute:600}).openNow,'closed');
 assert.deepEqual(playerVisibleDiagnostic(report).knownFacts,source.state.player.knowledge);
 assert.ok(!JSON.stringify(playerVisibleDiagnostic(report)).includes('damaged'));
 assert.deepEqual(restored.state.world.locations[place],originalDesign);
 restored=changeBusiness(restored,{operating_status:'operating',physical_condition:'intact'},'synthetic-business-reopens');
 const views=inspectPrebuiltMeridianBay({state:restored.state,weekday:0,minute:600});
 assert.equal(views.find(x=>x.locationId===place).accessNow,'open');
 assert.equal(inspectPrebuiltMeridianBay({state:restored.state}).find(x=>x.locationId===place).accessNow,'unknown');
 assert.deepEqual(restored.state.world.locations[place],originalDesign);
 assert.deepEqual(restored.state.player,source.state.player);
});

test('independent admission cannot backdate a new-site effect or observation into the last played turn',()=>{
 const snapshot=admitted(),event=snapshot.events.events.at(-1);
 assert.throws(()=>applyStateChanges(snapshot.state,event,[{field:'location_state',location_id:place,before:null,
  after:{operating_status:'temporarily_closed',physical_condition:'unknown',opening_hours:null,
   note:'SYNTHETIC forbidden retroactive closure.',last_change_event_id:event.id}}]),/predate world admission/);
 const playerEvent={...event,kind:'player_action',actor_ids:[snapshot.state.player.id],state_changes:[]};
 assert.throws(()=>applyReviewedPlaceDiscovery({state:snapshot.state,event:playerEvent,discoveries:[{
  id:place,reviewed:true,public_access_confirmed:true,observed_from:'LOC-COMMERCIAL-DISTRICT',
  scene_quote:'Synthetic quoted scene outside a shop.',access_quote:'Synthetic public entrance of that shop.'}],
  narrationMessages:['Synthetic quoted scene outside a shop. Synthetic public entrance of that shop.']}),/predate world design admission/);
});
