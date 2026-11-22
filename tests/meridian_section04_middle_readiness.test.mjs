import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 deriveSection04MiddleReadiness,validateSection04MiddleReadiness,
 inspectSection04MiddleReadiness,assessSection04AdmissionClaim,
 renderSection04MiddleReadinessSvg,verifySection04MiddleReadinessSvg
} from '../tools/meridian_section04_middle_readiness.mjs';
import {validateSection04M1P1EntryEvidence} from '../tools/meridian_section04_m1p1_entry_evidence.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url));
const parse=path=>JSON.parse(read(path));
const state=()=>parse('../game/STATE.json');
const doc=()=>parse('../docs/01_world/MERIDIAN_BAY_SECTION04_MIDDLE_READINESS_20261122.json');
const ledger=()=>parse('../docs/01_world/MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json');
const origin=()=>parse('../docs/01_world/MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json');
const diagram=()=>read('../docs/01_world/MERIDIAN_BAY_SECTION04_MIDDLE_READINESS_20261122.svg').toString('utf8');
const sha=x=>{const b=Buffer.from(x);return createHash('sha1')
 .update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');};
const byId=(id,source=doc())=>source.sections.find(x=>x.id===id);
const pointEqual=(x,y)=>assert.deepEqual(x,y);
const pixel=p=>[85+(p.x-58)*100,70+(43-p.y)*95];
const features=new Map([...diagram().matchAll(
 /<polyline data-map-id="([^"]+)" points="([^"]+)"/g)]
 .map(x=>[x[1],x[2].split(/\s+/).map(v=>v.split(',').map(Number))]));
const checkLine=(id,source)=>{
 const rendered=features.get(id);
 assert.ok(rendered,'SVG feature missing: '+id);
 assert.equal(rendered.length,source.length);
 for(let i=0;i<source.length;i++){
  const expected=pixel(source[i]);
  for(let j=0;j<2;j++)assert.ok(Math.abs(rendered[i][j]-expected[j])<=0.0051,
   id+' SVG pixel component '+j+' deviates from pinned source at point '+i);
 }
};

test('M2 M3 P2 JSON review reproduces byte-checked source evidence without game writes',()=>{
 const s=state(),snapshot=JSON.stringify(s);
 assert.deepEqual(deriveSection04MiddleReadiness({state:s}),doc());
 assert.equal(validateSection04MiddleReadiness({state:s}),true);
 assert.equal(JSON.stringify(s),snapshot);
});
test('all five source documents preserve their exact immutable historical Git blobs',()=>{
 const pairs=[
 ['section04','MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json','a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b'],
 ['m1p1','MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.json','760e819f0b9027e9eb7a8b55f1f33d0e65251a74'],
 ['routeReconciliation','MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json','aae66aae315603e37e8cb88034600446bf46d21d'],
 ['coast01','MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json','139c3687c98285aff886d28422544d082768217d'],
 ['cityCanvas','MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json','2e8c5ff412436a6e7d526bc0172adfca77107263']
 ];
 assert.equal(Object.keys(doc().sourceGitBlobs).length,5);
 for(const [key,file,hash] of pairs){
  assert.equal(sha(read('../docs/01_world/'+file)),hash);
  assert.equal(doc().sourceGitBlobs[key],hash);
 }
});
test('middle study has exactly M2 M3 and P2, preserves original node IDs and endpoints',()=>{
 const d=doc(),s=ledger();
 assert.deepEqual(d.focusSections,['MB-04-M2','MB-04-M3','MB-04-P2']);
 assert.equal(d.sections.length,3);
 for(const candidate of d.sections){
  const older=s.sections.find(x=>x.id===candidate.id);
  assert.ok(older);
  for(const key of ['route','from','to','sourcePr103Property','sourceSegmentIndex',
   'sourceWaypointIds','hypotheticalLengthUnits'])
   assert.deepEqual(candidate[key],older[key],key+': '+candidate.id);
  assert.equal(candidate.searchBoxMeaning,'derived_line_extent_not_parcel_or_road_survey');
 }
});
test('M1 M2 M3 form a source-closed Market handoff without authorizing any road',()=>{
 const d=doc(),source=ledger();
 const m1=source.sections.find(x=>x.id==='MB-04-M1'),m2=byId('MB-04-M2'),
  m3=byId('MB-04-M3');
 pointEqual(m1.to,m2.from);
 pointEqual(m2.to,m3.from);
 pointEqual(m3.to,{x:68,y:36.9});
 pointEqual(d.handoffs.market.m1_end,d.handoffs.market.m2_start);
 pointEqual(d.handoffs.market.m2_end,d.handoffs.market.m3_start);
 pointEqual(d.handoffs.market.coast01_entry,m3.to);
 assert.equal(d.admissionRules.coast01IntegrationCertified,false);
});
test('P1 P2 form the separate Plaza handoff and do not claim a Market crossing',()=>{
 const d=doc(),p1=ledger().sections.find(x=>x.id==='MB-04-P1'),
  p2=byId('MB-04-P2');
 pointEqual(p1.to,p2.from);
 pointEqual(p2.to,{x:68,y:38.635714});
 pointEqual(d.handoffs.plaza.p1_end,p2.from);
 pointEqual(d.handoffs.plaza.coast01_entry,p2.to);
 assert.equal(d.knownInternalRouteCrossings,0);
 assert.equal(d.routeSharedStreetVerified,false);
});
test('study extent is source endpoint arithmetic, not ownership, road or surveying proof',()=>{
 const d=doc();
 assert.deepEqual(d.studySearchWindow,{
  x_min:60,x_max:68,y_min:36.9,y_max:40.7,
  meaning:'mathematical_envelope_only_not_physical_territory_or_parcels'
 });
 assert.equal(d.coordinateAuthority,'non_georeferenced_reversible_100x80_illustrative_canvas');
 assert.equal(d.sourceWindowCoveredByApprovedPhysicalPlan,false);
 assert.equal(d.knownMapCollisionsBeyondStudyRegions,'unknown');
 assert.equal(d.admissionRules.unknownBuildingFootprintsImplyEmptyLand,false);
});
test('18 independent requirements remain unknown, rather than cleared or fabricated',()=>{
 const d=doc();
 assert.equal(d.missingEvidenceRequirementCount,18);
 for(const section of d.sections){
  assert.equal(section.evidenceRequirements.length,6);
  const keys=new Set(section.evidenceRequirements.map(x=>x.key));
  assert.equal(keys.size,6);
  for(const req of section.evidenceRequirements){
   assert.equal(req.status,'unknown');
   assert.equal(req.sourceEvidence,null);
  }
  for(const key of ['landUse','buildingFootprints','publicRightOfWay',
   'actualRoadWidth','physicalObstacles'])
   assert.equal(section[key],null);
  assert.equal(section.entranceApproved,false);
  assert.equal(section.canNavigate,false);
 }
});
test('M2 records rights of way, mixed street crossings and continuity blockers',()=>{
 const keys=byId('MB-04-M2').evidenceRequirements.map(x=>x.key);
 assert.ok(keys.includes('public_pedestrian_right_of_way'));
 assert.ok(keys.includes('road_crossings_and_traffic_separation'));
 assert.ok(keys.includes('continuity_from_M1_and_to_M3'));
});
test('M3 requires port security review rather than inventing private industrial access',()=>{
 const d=doc(),keys=byId('MB-04-M3').evidenceRequirements.map(x=>x.key);
 assert.ok(keys.includes('industrial_port_fence_and_security_transition'));
 assert.ok(keys.includes('coast01_boundary_and_seam_access'));
 assert.equal(d.admissionRules.privatePortAccessAllowed,false);
});
test('P2 requires pedestrian separation from transit movements and Coast01 seam review',()=>{
 const keys=byId('MB-04-P2').evidenceRequirements.map(x=>x.key);
 assert.ok(keys.includes('safe_separation_from_plaza_terminal_traffic'));
 assert.ok(keys.includes('coast01_boundary_and_seam_access'));
});
test('a missing candidate is an explicit blocker with 6 open gates per section',()=>{
 const result=assessSection04AdmissionClaim({state:state()});
 assert.equal(result.admission,'BLOCKED_NOT_EDITORIALLY_REVIEWED');
 assert.equal(result.candidatePresent,false);
 assert.equal(result.sourceProofValidated,false);
 assert.equal(result.certifiedPhysicalAccess,false);
 assert.equal(result.additionalOwnerAndSourceReviewRequired,true);
 assert.deepEqual(result.perSection.map(x=>x.missingEvidence.length),[6,6,6]);
});
test('fabricated physical approval and apparent evidence cannot authorize routes',()=>{
 const candidate={approved:true,playable:true,publicRightOfWayApproved:true,
  sections:doc().sections.map(s=>({id:s.id,canNavigate:true,
   evidence:Object.fromEntries(s.evidenceRequirements.map(req=>[req.key,{
    verification:'verified_against_source',sourcePath:'invented.json',
    sourceBlob:'abcdef'
   }]))}))};
 const result=assessSection04AdmissionClaim({state:state(),candidate});
 assert.equal(result.requestedUnsafePromotion,true);
 assert.equal(result.admission,'BLOCKED_NOT_EDITORIALLY_REVIEWED');
 assert.equal(result.sourceProofValidated,false);
 assert.equal(result.certifiedPhysicalAccess,false);
 assert.equal(result.perSection.every(s=>s.callerClaimsComplete),true);
});
test('partial and malformed evidence submissions never mark a section accepted',()=>{
 const one=byId('MB-04-M2').evidenceRequirements[0].key;
 const r=assessSection04AdmissionClaim({state:state(),
  candidate:{sections:[{id:'MB-04-M2',evidence:{
   [one]:{verification:'verified_against_source',sourcePath:'x',
    sourceBlob:'x'}
  }}]}});
 assert.deepEqual(r.perSection.map(s=>s.missingEvidence.length),[5,6,6]);
 assert.equal(r.certifiedPhysicalAccess,false);
});
test('injected roads, fabricated parcel boundaries and removal of blockers fail closed',()=>{
 const s=state(),fake=doc();fake.sections[0].canNavigate=true;
 assert.throws(()=>validateSection04MiddleReadiness({state:s,review:fake}),
  /Middle Section04 evidence differs/);
 const fake2=doc();fake2.sections[1].buildingFootprints=[];
 assert.throws(()=>validateSection04MiddleReadiness({state:s,review:fake2}),
  /Middle Section04 evidence differs/);
 const fake3=doc();fake3.sections[2].evidenceRequirements=[];
 assert.throws(()=>validateSection04MiddleReadiness({state:s,review:fake3}),
  /Middle Section04 evidence differs/);
});
test('existing M1/P1 and immutable original routes retain their source facts',()=>{
 const s=state();
 assert.equal(validateSection04M1P1EntryEvidence({state:s}),true);
 const original=origin();
 assert.equal(original.market_to_harbor.nodes[2].id,'MB-MH-N2');
 assert.equal(s.world.locations['LOC-HARBOR-WALK'].connected_ids.includes(
  'LOC-CROSSWATER-PLAZA'),true);
 assert.equal(doc().storyProtection.newLocationEdges.length,0);
});
test('SVG reproduces the middle-section source data exactly and remains read-only',()=>{
 const s=state();
 assert.equal(verifySection04MiddleReadinessSvg({state:s}),true);
 assert.equal(diagram(),renderSection04MiddleReadinessSvg({state:s}));
 assert.equal(renderSection04MiddleReadinessSvg({state:s}),
  renderSection04MiddleReadinessSvg({state:s}));
 assert.ok(diagram().includes('NO CANÓNICO'));
 assert.ok(diagram().includes('data-admitted="false"'));
 assert.ok(diagram().includes('data-travel-approved="false"'));
});
test('all five SVG section polylines contain only exact historical waypoints',()=>{
 const s=ledger(),d=doc();
 assert.equal(features.size,5);
 for(const id of ['MB-04-M1','MB-04-P1']){
  const x=s.sections.find(y=>y.id===id);
  checkLine('INHERITED-'+id.slice(-2),[x.from,x.to]);
 }
 for(const item of d.sections)checkLine(item.id,[item.from,item.to]);
});
test('SVG search boxes label unknown extents, not building footprints',()=>{
 const rendered=diagram(),d=doc();
 assert.ok(rendered.includes('data-map-id="MIDDLE-SEARCH-NOT-SURVEY"'));
 for(const section of d.sections)
  assert.ok(rendered.includes('data-map-id="'+section.id+'-QUERY-BOX"'));
 assert.ok(!rendered.includes('data-admitted="true"'));
 assert.ok(!rendered.includes('MB-04-BUILDING-'));
});
test('private inspectors preserve the canonical saved turn 9 and return clones',()=>{
 const s=state(),before=JSON.stringify(s),d=inspectSection04MiddleReadiness({state:s});
 d.sections[0].searchBox.x_min=-900;
 assert.equal(inspectSection04MiddleReadiness({state:s}).sections[0].searchBox.x_min,60);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(d.storyProtection.playerMoved,false);
 assert.equal(d.storyProtection.npcMoved,false);
 assert.equal(d.storyProtection.fictionalTimeAdvanced,false);
 assert.equal(JSON.stringify(s),before);
});
test('missing or altered saved context fails before interpreting M2/M3/P2 lines',()=>{
 assert.throws(()=>deriveSection04MiddleReadiness({state:{}}),/Canonical location graph/);
 const altered=state();altered.player.location_id='LOC-HARBOR-WALK';
 assert.throws(()=>deriveSection04MiddleReadiness({state:altered}));
});
