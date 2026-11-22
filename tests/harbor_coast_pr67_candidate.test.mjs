import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 validatePr67CoastCandidate,renderPr67CoastCandidateSvg,
 verifyPr67CoastCandidateSvg,inspectPr67CoastCandidate
} from '../tools/render_harbor_coast_pr67_candidate.mjs';
import {
 coastalWaterConflicts,coastRoadBuildingConflicts,inspectMeridianRegionalSeams
} from '../tools/meridian_bay_three_region_seams.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url));
const json=path=>JSON.parse(read(path));
const state=()=>json('../game/STATE.json');
const candidate=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json');
const historical=()=>json('../docs/01_world/SOURCE_PR67_COAST_01_20261120.json');
const pr66=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json');
const pr86=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json');
const svg=()=>read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.svg').toString('utf8');
const gitBlob=data=>{const b=Buffer.from(data);return createHash('sha1')
 .update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');};
const XY=p=>[100+(p.x-68)*84,74+(42-p.y)*61.4];
const decode=s=>s.trim().split(/\s+/).map(item=>item.split(',').map(Number));
const shapeMaps=(svgText,tag)=>[...svgText.matchAll(new RegExp(
 '<'+tag+'\\s+points="([^"]+)"\\s+data-map-id="([^"]+)"','g'))]
 .map(x=>({id:x[2],points:decode(x[1])}));
const pixelsAgree=(shape,input)=>{
 assert.ok(shape,'missing shape from candidate SVG');
 assert.equal(shape.points.length,input.length,'source/visual vertex count');
 for(let i=0;i<input.length;i++){
  const expected=XY(input[i]);
  for(let j=0;j<2;j++)assert.ok(
   Math.abs(shape.points[i][j]-expected[j])<=0.051,
   shape.id+' point '+i+' coordinate '+j+' differs from source');
 }
};

test('PR67 candidate is exactly a metadata-annotated copy of immutable historical source',()=>{
 const c=candidate(),a=historical();
 assert.equal(gitBlob(read('../docs/01_world/SOURCE_PR67_COAST_01_20261120.json')),
  '7cb79b2113bfef7b7fbbc39539c17fd80a275cd7');
 assert.equal(c.candidate_review_2026_11_22.source_pr,67);
 assert.equal(c.candidate_review_2026_11_22.approval,
  'not_admitted_not_physical_survey_not_game_navigation');
 delete c.candidate_review_2026_11_22;
 assert.deepEqual(c,a);
 assert.equal(validatePr67CoastCandidate({state:state()}),true);
});

test('the technical correction has exactly three scalar changes from PR66',()=>{
 const c=candidate(),o=pr66(),r=c.candidate_review_2026_11_22;
 assert.equal(r.exact_source_changes_from_pr66.length,3);
 const freight=c.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 const oldFreight=o.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 assert.equal(freight.polygon.length,7);
 assert.deepEqual(freight.polygon.map(x=>x.y),oldFreight.polygon.map(x=>x.y));
 assert.equal(oldFreight.polygon[3].x,72.5);
 assert.equal(freight.polygon[3].x,72.25);
 const road=c.street_alignments.find(x=>x.id==='HC-A-OLD');
 const oldRoad=o.street_alignments.find(x=>x.id==='HC-A-OLD');
 assert.deepEqual([oldRoad.points[3].y,oldRoad.points[4].y],[39.1,38.9]);
 assert.deepEqual([road.points[3].y,road.points[4].y],[39.95,39.3]);
 const restored=structuredClone(c);
 delete restored.candidate_review_2026_11_22;
 restored.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon[3].x=72.5;
 const restRoad=restored.street_alignments.find(x=>x.id==='HC-A-OLD');
 restRoad.points[3].y=39.1;restRoad.points[4].y=38.9;
 assert.deepEqual(restored,o);
});

test('new Coast01 candidate removes PR86 road-building collision without new water incursions',()=>{
 const c=candidate();
 assert.deepEqual(coastalWaterConflicts(c),[]);
 assert.deepEqual(coastRoadBuildingConflicts(c),[]);
 assert.equal(coastalWaterConflicts(pr86()).length,0);
 const conflicts=coastRoadBuildingConflicts(pr86());
 assert.equal(conflicts.length,3);
 assert.ok(conflicts.every(x=>x.roadId==='HC-A-OLD'&&x.buildingId==='HC-B-02'));
});

test('exact source-matched SVG renderer is deterministic and byte-identical',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.equal(verifyPr67CoastCandidateSvg({state:s}),true);
 assert.equal(renderPr67CoastCandidateSvg({state:s}),svg());
 assert.equal(renderPr67CoastCandidateSvg({state:s}),renderPr67CoastCandidateSvg({state:s}));
 assert.equal(JSON.stringify(s),before);
});

test('all 11 candidate SVG polygons match JSON vertices with pixel rounding bound',()=>{
 const c=candidate(),rendered=shapeMaps(svg(),'polygon');
 const byId=new Map(rendered.map(x=>[x.id,x]));
 assert.equal(rendered.length,11);
 assert.equal(byId.size,11);
 const water=[...c.proposed_coast.shoreline].reverse().concat([
  {x:c.study_box.x_max,y:c.study_box.y_min},
  {x:c.study_box.x_max,y:c.study_box.y_max}
 ]);
 pixelsAgree(byId.get('HC-WATER'),water);
 for(const shape of [...c.land_use_patches,...c.building_footprints])
  pixelsAgree(byId.get(shape.id),shape.polygon);
 assert.deepEqual([...byId.keys()],['HC-WATER',...c.land_use_patches.map(x=>x.id),
  ...c.building_footprints.map(x=>x.id)]);
});

test('all 7 SVG polylines match 16 shoreline points and 6 candidate road shapes',()=>{
 const c=candidate(),rendered=shapeMaps(svg(),'polyline');
 const byId=new Map(rendered.map(x=>[x.id,x]));
 assert.equal(rendered.length,7);
 assert.equal(byId.size,7);
 pixelsAgree(byId.get('HC-COAST'),c.proposed_coast.shoreline);
 for(const road of c.street_alignments)pixelsAgree(byId.get(road.id),road.points);
 assert.deepEqual([...byId.keys()],['HC-COAST',...c.street_alignments.map(x=>x.id)]);
});

test('the new SVG metadata labels the PR67 alternative without certifying public access',()=>{
 const text=svg();
 assert.ok(text.includes('candidato PR67'));
 assert.ok(text.includes('no canónico'));
 assert.ok(text.includes('data-source-json-blob="7cb79b2113bfef7b7fbbc39539c17fd80a275cd7"'));
 assert.ok(text.includes('data-original-svg-blob="56e6ba7a830fdc53e6dcff205871b3af57e7c04e"'));
 assert.ok(text.includes('data-admitted="false"'));
 assert.ok(text.includes('data-story-action="false"'));
 assert.ok(!text.includes('data-admitted="true"'));
});

test('historic SVG, historic JSON, and PR86 reviewed design remain byte-identical',()=>{
 assert.equal(gitBlob(read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg')),
  '56e6ba7a830fdc53e6dcff205871b3af57e7c04e');
 assert.equal(gitBlob(read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json')),
  '81ef8da51951205394ba050fe6f867bfc00d7244');
 assert.equal(gitBlob(read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json')),
  'dae1ea04e1addcaa1ed71b1a96e0e2171e0c7ac9');
});

test('candidate coastline stitches to historical Coast02 without authorizing a road',()=>{
 const c=candidate(),v=inspectPr67CoastCandidate({state:state()});
 const next=json('../docs/01_world/SOURCE_PR67_COAST_02_20261120.json');
 assert.deepEqual(c.proposed_coast.shoreline.at(-1),{x:75.1,y:42});
 assert.deepEqual(c.proposed_coast.shoreline.at(-1),next.proposed_coast.shoreline[0]);
 assert.equal(v.shorelineSeam.joinsHistoricalFragment02,true);
 assert.equal(v.shorelineSeam.playable,false);
 assert.equal(v.routesApproved,false);
});

test('candidate preview reports remaining external route conflicts rather than choosing one',()=>{
 const s=state(),v=inspectPr67CoastCandidate({state:s});
 const previous=inspectMeridianRegionalSeams({state:s});
 assert.equal(v.amendedScalarCount,3);
 assert.equal(v.proposedLandAndRoadErrors,0);
 assert.equal(v.illustratedShorelineSurveyed,false);
 assert.equal(v.physicalIntegrationReady,'pending_editorial_selection_and_full_city_review');
 assert.equal(previous.selectedPhysicalRoute,null);
 assert.deepEqual(v.alternativesStillOpen,
  ['PR44_vs_PR58_market_harbor','PR56_plaza_harbor_building_collision']);
 assert.equal(v.savedWorldChanged,false);
});

test('forged approval, unauthorized geometry and missing save fail closed',()=>{
 const s=state(),c=candidate();
 assert.throws(()=>validatePr67CoastCandidate({state:{}}),/Saved world and player required/);
 c.candidate_review_2026_11_22.approval='admitted_to_world';
 assert.throws(()=>validatePr67CoastCandidate({state:s,fragment:c}),/source\/approval boundary/);
 const changed=candidate();
 changed.street_alignments.find(x=>x.id==='HC-A-OLD').points[3].y=39.1;
 assert.throws(()=>validatePr67CoastCandidate({state:s,fragment:changed}),
  /candidate differs from exact historical JSON/);
 const removed=candidate();
 removed.assembly_seams=removed.assembly_seams.filter(x=>x.id!=='COAST-HIGH');
 assert.throws(()=>validatePr67CoastCandidate({state:s,fragment:removed}),
  /candidate differs from exact historical JSON/);
});

test('inspection cannot alter real saved-world state or claim player and NPC actions',()=>{
 const s=state(),before=JSON.stringify(s);
 const v=inspectPr67CoastCandidate({state:s});
 assert.equal(v.playerMoved,false);
 assert.equal(v.npcMoved,false);
 assert.equal(v.fictionalTimeAdvanced,false);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 v.shorelineSeam.x=999;
 const updated=inspectPr67CoastCandidate({state:s});
 assert.equal(updated.shorelineSeam.x,75.1);
 assert.equal(JSON.stringify(s),before);
});
