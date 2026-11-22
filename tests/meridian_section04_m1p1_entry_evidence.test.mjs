import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 deriveSection04M1P1EntryEvidence,validateSection04M1P1EntryEvidence,
 inspectSection04M1P1EntryEvidence,renderSection04M1P1EntrySvg,
 verifySection04M1P1EntrySvg
} from '../tools/meridian_section04_m1p1_entry_evidence.mjs';
import {inspectHarborSection04Study} from '../tools/meridian_harbor_section04_ledger.mjs';

const bytes=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(bytes(p));
const state=()=>json('../game/STATE.json');
const evidence=()=>json('../docs/01_world/MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.json');
const ledger=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json');
const svg=()=>bytes('../docs/01_world/MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.svg').toString('utf8');
const sha=x=>{const b=Buffer.from(x);return createHash('sha1')
 .update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');};
const pos=p=>[80+(p.x-57.8)*82,100+(44.5-p.y)*125];
const svgMap=(name)=>new Map([...svg().matchAll(new RegExp(
 '<'+name+' data-map-id="([^"]+)"[^>]*?(?:points="([^"]+)")','g'))]
 .filter(x=>x[2]).map(x=>[x[1],x[2].split(/\s+/)
  .map(y=>y.split(',').map(Number))]));
const matchPoints=(map,id,points)=>{
 const actual=map.get(id);assert.ok(actual,id+' not drawn');
 assert.equal(actual.length,points.length);
 for(let i=0;i<points.length;i++){
  const expected=pos(points[i]);
  for(let j=0;j<2;j++)assert.ok(
   Math.abs(actual[i][j]-expected[j])<=0.0051,
   id+' graphical point '+i+' component '+j+' mismatches source');
 }
};
test('frozen M1/P1 evidence is exactly regenerated from immutable narrative and map facts',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.deepEqual(deriveSection04M1P1EntryEvidence({state:s}),evidence());
 assert.equal(validateSection04M1P1EntryEvidence({state:s}),true);
 assert.equal(JSON.stringify(s),before);
});

test('seven source Git blobs are pinned, including actual game and played transcript',()=>{
 const table=[
 ['../game/STATE.json','state','3f4e9c98a7211068faafd31d0a0acbd4260ef589'],
 ['../game/STARTING_LOCATIONS.md','places','0c1717e8f63d86e95e1aed431927f5a092c5b061'],
 ['../chapters/CH-000.transcript.json','story','1350916ead7fb1f2f15fdd635dda42e69a0a3fed'],
 ['../docs/01_world/MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json','ledger','a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b'],
 ['../docs/01_world/SOURCE_PR69_LAND_03_20261120.json','land03','2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
 ['../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json','cityPlan','2e8c5ff412436a6e7d526bc0172adfca77107263'],
 ['../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json','design','014586f9c2996501f3bf16b9bfb8aebaf44fd462']
 ];
 const doc=evidence();assert.equal(Object.keys(doc.sourceGitBlobs).length,7);
 for(const [path,key,hash] of table){
  assert.equal(doc.sourceGitBlobs[key],hash);
  assert.equal(sha(bytes(path)),hash,path);
 }
});

test('M1 entry derives exactly from the Land03 boundary and historical Market anchor',()=>{
 const doc=evidence(),[m]=doc.entries,s=ledger().sections.find(x=>x.id==='MB-04-M1');
 assert.equal(m.sectionId,'MB-04-M1');
 assert.deepEqual(m.lineFrom,s.from);
 assert.deepEqual(m.lineTo,s.to);
 assert.deepEqual(m.priorSourceAnchor,{x:58,y:43});
 assert.deepEqual(m.studySearchBox,
  {x_min:58.869565,x_max:60,y_min:40.7,y_max:42});
 assert.deepEqual(doc.historicalLand03Context.existingTopologySketchPoints[0],
  m.priorSourceAnchor);
 assert.equal(m.accessGateCoordinatesVerified,false);
 assert.equal(m.canNavigate,false);
});

test('P1 starts on the historical plaza study border but not on an approved harbor street',()=>{
 const doc=evidence(),p=doc.entries[1],s=ledger().sections.find(x=>x.id==='MB-04-P1');
 assert.equal(p.sectionId,'MB-04-P1');
 assert.deepEqual(p.lineFrom,s.from);
 assert.deepEqual(p.lineTo,s.to);
 assert.deepEqual(p.lineFrom,{x:65,y:42});
 assert.deepEqual(p.studySearchBox,{x_min:65,x_max:66.9,y_min:40.6,y_max:42});
 assert.deepEqual(doc.historicalLand03Context.existingTopologySketchPoints.at(-1),
  p.lineFrom);
 assert.deepEqual(doc.historicalLand03Context.plazaTerminalSketchPoints[0],
  p.lineFrom);
 assert.equal(p.evidence.plazaPublicArea,true);
 assert.equal(p.evidence.sourcePedestrianHarborStreetExistsOnMap,false);
 assert.equal(p.accessGateCoordinatesVerified,false);
});

test('saved world has broad reciprocal place connectivity only; no new LOC graph edges',()=>{
 const s=state(),e=evidence();
 for(const row of e.entries){
  assert.ok(s.world.locations[row.savedPlaceId].connected_ids.includes('LOC-HARBOR-WALK'));
  assert.ok(s.world.locations['LOC-HARBOR-WALK'].connected_ids.includes(row.savedPlaceId));
 }
 assert.equal(s.world.locations['LOC-CROSSWATER-PLAZA'].public_area,true);
 assert.deepEqual(e.limitations.newLocationLinks,[]);
 assert.equal(e.limitations.routeApproved,false);
 assert.equal(e.sharedFactBoundaries.narrativeGraphAdjacencyDoesNotSurveyStreets,true);
});

test('played Café Bruma terminal glow remains an explicit future building-massing constraint',()=>{
 const e=evidence(),s=json('../chapters/CH-000.transcript.json');
 const rendered=s.entries.map(x=>x.text??'').join('\n');
 assert.ok(rendered.includes('resplandor del terminal'));
 assert.ok(rendered.includes('Jack se aleja hacia Market Row'));
 assert.equal(e.entries[0].evidence.chapterSceneCafeTerminalGlowEstablished,true);
 assert.equal(e.sharedFactBoundaries.cafeTerminalGlowRequiresFutureMassingReview,true);
 assert.ok(e.entries[0].unanswered.includes('urban_building_massing_and_terminal_glow'));
});

test('Market public-facing establishments do not establish Harbor exit coordinates',()=>{
 const e=evidence(),d=json('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json');
 assert.equal(d.places.filter(x=>x.parent_id==='LOC-COMMERCIAL-DISTRICT').length,4);
 assert.ok(e.entries[0].unanswered.includes('precise_public_market_row_egress'));
 assert.equal(e.sharedFactBoundaries.historicalMarketPlazaRouteDoesNotAuthoriseHarborBranch,true);
 assert.equal(e.sharedFactBoundaries.plazaPublicAreaDoesNotApproveSpecificWalkway,true);
});

test('every mapped M1/P1 parcel and public easement remains UNKNOWN, not falsely empty',()=>{
 const e=evidence();assert.equal(e.status,
  'source_evidence_and_unmapped_entry_search_only_not_physical_fragment');
 for(const row of e.entries){
  for(const field of ['landUse','buildingFootprints','rightOfWay'])
   assert.equal(row[field],null,field);
  assert.equal(row.searchBoxMeaning,
   'point_derived_search_extent_not_urban_parcel_or_public_road');
  assert.equal(row.accessGateCoordinatesVerified,false);
  assert.equal(row.canNavigate,false);
  assert.ok(row.unanswered.length>=6);
 }
 assert.equal(e.sharedFactBoundaries.missingPhysicalStudyDoesNotMeanEmptyLand,true);
 assert.equal(e.limitations.publicEasementVerified,false);
 assert.equal(e.limitations.buildingsMapped,false);
});

test('forged physical access, building footprints or parcel rights fail closed',()=>{
 const s=state(),a=evidence();
 a.entries[0].canNavigate=true;
 assert.throws(()=>validateSection04M1P1EntryEvidence({state:s,review:a}),/Section04 frontage study changed/);
 const b=evidence();b.entries[1].buildingFootprints=[];
 assert.throws(()=>validateSection04M1P1EntryEvidence({state:s,review:b}),/Section04 frontage study changed/);
 const c=evidence();c.entries[1].rightOfWay='public';
 assert.throws(()=>validateSection04M1P1EntryEvidence({state:s,review:c}),/Section04 frontage study changed/);
});

test('missing graph edge or modified player state cannot be used as evidence',()=>{
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=
  s.world.locations['LOC-HARBOR-WALK'].connected_ids.filter(x=>x!=='LOC-CROSSWATER-PLAZA');
 assert.throws(()=>deriveSection04M1P1EntryEvidence({state:s}),/Only exact canonical saved state/);
 assert.throws(()=>deriveSection04M1P1EntryEvidence({state:{}}),/Only exact canonical saved state/);
});

test('diagram exactly equals repeated renderer output and embeds clear noncanonical warning',()=>{
 const s=state();
 assert.equal(verifySection04M1P1EntrySvg({state:s}),true);
 assert.equal(renderSection04M1P1EntrySvg({state:s}),svg());
 assert.equal(renderSection04M1P1EntrySvg({state:s}),
  renderSection04M1P1EntrySvg({state:s}));
 assert.ok(svg().includes('NO CANÓNICO'));
 assert.ok(svg().includes('data-admitted="false"'));
 assert.ok(svg().includes('data-access-approved="false"'));
 assert.ok(svg().includes('data-story-action="false"'));
});

test('SVG polylines M1/P1 and original Land03 street retain exact source vertex data',()=>{
 const e=evidence(),map=svgMap('polyline'),m=e.entries[0],p=e.entries[1];
 assert.equal(map.size,5);
 matchPoints(map,'MX-A-MARKET-PLAZA',
  e.historicalLand03Context.existingTopologySketchPoints);
 matchPoints(map,'MX-A-PLAZA-TERM',
  e.historicalLand03Context.plazaTerminalSketchPoints);
 matchPoints(map,'M1-SOURCE-APPROACH',[m.priorSourceAnchor,m.lineFrom]);
 matchPoints(map,'MB-04-M1',[m.lineFrom,m.lineTo]);
 matchPoints(map,'MB-04-P1',[p.lineFrom,p.lineTo]);
});

test('SVG footprints depict only preexisting Land03 source buildings in the displayed area',()=>{
 const map=svgMap('polygon'),land=json('../docs/01_world/SOURCE_PR69_LAND_03_20261120.json');
 const expected=land.building_footprints.filter(x=>
  x.polygon.every(pt=>pt.y>=42&&pt.y<=44.5));
 assert.equal(map.size,expected.length);
 for(const b of expected)matchPoints(map,b.id,b.polygon);
 assert.ok(!svg().includes('MB-04-NEW-BUILDING'));
});

test('private diagnostic returns a deep copy and preserves turn 9 story unchanged',()=>{
 const s=state(),before=JSON.stringify(s);
 const a=inspectSection04M1P1EntryEvidence({state:s});
 a.entries[0].studySearchBox.x_min=999;
 const b=inspectSection04M1P1EntryEvidence({state:s});
 assert.equal(b.entries[0].studySearchBox.x_min,58.869565);
 assert.equal(b.limitations.storyTurnAdvanced,false);
 assert.equal(b.limitations.playerMoved,false);
 assert.equal(b.limitations.npcMoved,false);
 assert.equal(b.limitations.realTravelMinutes,null);
 assert.equal(b.illustrativeCoordinateFrame.actualDistanceScale,null);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(JSON.stringify(s),before);
});
