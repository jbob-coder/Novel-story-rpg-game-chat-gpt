import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 closestPointToSection,deriveM1P1AccessEvidence,
 validateM1P1AccessEvidence,inspectM1P1AccessEvidence
} from '../tools/meridian_harbor_m1_p1_access_evidence.mjs';

const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const state=()=>json('../game/STATE.json');
const review=()=>json('../docs/01_world/MERIDIAN_BAY_M1_P1_ACCESS_EVIDENCE_20261122.json');
const SHA=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');

test('M1/P1 source evidence matches deterministic independent source derivation',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.deepEqual(deriveM1P1AccessEvidence({state:s}),review());
 assert.equal(validateM1P1AccessEvidence({state:s}),true);
 assert.equal(JSON.stringify(s),before);
});

test('all four historical source documents retain their immutable original Git blobs',()=>{
 const files={
  'MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json':
   'a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b',
  'MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json':
   '2e8c5ff412436a6e7d526bc0172adfca77107263',
  'SOURCE_PR69_LAND_03_20261120.json':
   '2a95eb9e50f69436cb65711daf8ff586f4ef4279',
  'MERIDIAN_BAY_PREBUILT_DESIGN.json':
   '014586f9c2996501f3bf16b9bfb8aebaf44fd462'
 };
 for(const [name,sha] of Object.entries(files))assert.equal(
  SHA(raw('../docs/01_world/'+name)),sha,name);
});

test('point-to-segment projections are bounded and return finite distances',()=>{
 const p=closestPointToSection({x:2,y:2},{x:0,y:0},{x:4,y:0});
 assert.deepEqual(p,{distanceCanvasUnits:2,t:0.5,closest:{x:2,y:0}});
 const lower=closestPointToSection({x:-2,y:2},{x:0,y:0},{x:4,y:0});
 assert.deepEqual(lower,{distanceCanvasUnits:2.828427,t:0,closest:{x:0,y:0}});
 const upper=closestPointToSection({x:6,y:2},{x:0,y:0},{x:4,y:0});
 assert.deepEqual(upper,{distanceCanvasUnits:2.828427,t:1,closest:{x:4,y:0}});
});

test('invalid projection geometry never produces artificial proximity evidence',()=>{
 assert.throws(()=>closestPointToSection({x:0,y:0},{x:0,y:0},{x:0,y:0}),
  /zero-length/);
 assert.throws(()=>closestPointToSection({x:NaN,y:1},{x:0,y:0},{x:1,y:1}),
  /finite/);
});

test('M1 screens exact three historical place-reference uncertainty envelopes',()=>{
 const entry=inspectM1P1AccessEvidence({state:state()}).sectionEntries[0];
 assert.equal(entry.sectionId,'MB-04-M1');
 assert.deepEqual(entry.start,{x:58.869565,y:42});
 assert.deepEqual(entry.end,{x:60,y:40.7});
 assert.deepEqual(entry.existingLocationReferenceCandidates.map(x=>x.id),[
  'LOC-CAFE-BRUMA','LOC-COMMERCIAL-DISTRICT',
  'LOC-MARKET-BUSINESS-OFFICES']);
 assert.deepEqual(entry.existingLocationReferenceCandidates.map(
  x=>x.nearestLineDistanceCanvasUnits),[0.069565,1.325196,0.578277]);
 assert.deepEqual(entry.existingLocationReferenceCandidates.map(
  x=>x.placementUncertaintyCanvasUnits),[1.5,3,1]);
});

test('Café Bruma proximity is not a café entrance or valid sidewalk',()=>{
 const s=state(),m=inspectM1P1AccessEvidence({state:s}).sectionEntries[0];
 const cafe=m.existingLocationReferenceCandidates.find(x=>x.id==='LOC-CAFE-BRUMA');
 assert.equal(cafe.cityAnchorKind,'existing_business');
 assert.equal(cafe.locationPublicArea,true);
 assert.equal(cafe.locationAccessStatus,null);
 assert.equal(cafe.footprintDefined,false);
 assert.equal(cafe.evidence,'reference_uncertainty_disk_intersects_proposed_line');
 assert.equal(cafe.evidenceDoesNotEstablish,
  'doorway_sidewalk_crossing_easement_or_passable_route');
 assert.equal(m.doorwayConnectionToRouteVerified,false);
});

test('prebuilt Market Row services have public access to a PLACE, not to M1',()=>{
 const m=inspectM1P1AccessEvidence({state:state()}).sectionEntries[0];
 const offices=m.existingLocationReferenceCandidates.find(
  x=>x.id==='LOC-MARKET-BUSINESS-OFFICES');
 assert.equal(offices.locationPublicArea,true);
 assert.equal(offices.locationAccessStatus,'public_confirmed');
 assert.equal(offices.cityAnchorKind,'prebuilt_public_site');
 assert.equal(offices.footprintDefined,false);
 assert.equal(m.adjacentPublicSidewalkKnown,false);
 assert.equal(m.physicalAccessApproved,false);
});

test('M1 land03 exit is not falsely matched to an existing schematic road endpoint',()=>{
 const m=inspectM1P1AccessEvidence({state:state()}).sectionEntries[0];
 assert.deepEqual(m.historicInlandStreetEndpointCoincidences,[]);
 assert.deepEqual(m.startsOnDraftLandUseBoundaries,[]);
 assert.equal(m.schematicBoundaryY42,true);
 assert.equal(m.noPositiveLand03PhysicalCoverage,true);
});

test('P1 retains the existing plaza and terminal as uncertain public-place references',()=>{
 const p=inspectM1P1AccessEvidence({state:state()}).sectionEntries[1];
 assert.equal(p.sectionId,'MB-04-P1');
 assert.deepEqual(p.start,{x:65,y:42});
 assert.deepEqual(p.end,{x:66.9,y:40.6});
 assert.deepEqual(p.existingLocationReferenceCandidates.map(x=>x.id),
  ['LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL']);
 assert.deepEqual(p.existingLocationReferenceCandidates.map(
  x=>x.nearestLineDistanceCanvasUnits),[0,0.593199]);
 assert.deepEqual(p.existingLocationReferenceCandidates.map(
  x=>x.locationPublicArea),[true,false]);
});

test('P1 schematic junction matches both old plaza endpoints but grants no new route',()=>{
 const p=inspectM1P1AccessEvidence({state:state()}).sectionEntries[1];
 assert.deepEqual(p.historicInlandStreetEndpointCoincidences.map(x=>x.id),
  ['MX-A-MARKET-PLAZA','MX-A-PLAZA-TERM']);
 assert.deepEqual(p.historicInlandStreetEndpointCoincidences.map(
  x=>x.pointIndex),[4,0]);
 assert.ok(p.historicInlandStreetEndpointCoincidences.every(
  x=>x.usableStreetConfirmed===false));
 assert.deepEqual(p.startsOnDraftLandUseBoundaries,['MX-Z-TRANSIT']);
 assert.equal(p.schematicBoundaryY42,true);
 assert.equal(p.noPositiveLand03PhysicalCoverage,true);
});

test('public area and schematic references never imply public rights of way',()=>{
 const v=inspectM1P1AccessEvidence({state:state()});
 for(const s of v.sectionEntries){
  assert.equal(s.parcelOwnershipVerified,false);
  assert.equal(s.adjacentPublicSidewalkKnown,false);
  assert.equal(s.doorwayConnectionToRouteVerified,false);
  assert.equal(s.trafficOrGradeVerified,false);
  assert.equal(s.physicalAccessApproved,false);
  assert.ok(s.existingLocationReferenceCandidates.every(
   x=>x.footprintDefined===false));
 }
 assert.equal(v.readyForPhysicalApproval,false);
 assert.deepEqual(v.newPublicRoads,[]);
 assert.deepEqual(v.siteBuildingsProposed,[]);
 assert.equal(v.actualDistancesKm,null);
 assert.equal(v.travelMinutes,null);
});

test('forged approvals and invented business doorways fail frozen-source verification',()=>{
 const s=state(),x=review();x.sectionEntries[1].physicalAccessApproved=true;
 assert.throws(()=>validateM1P1AccessEvidence({state:s,candidate:x}),/altered/);
 const y=review();y.sectionEntries[0].existingLocationReferenceCandidates[0].footprintDefined=true;
 assert.throws(()=>validateM1P1AccessEvidence({state:s,candidate:y}),/altered/);
 const z=review();z.newPublicRoads=['UNVERIFIED'];
 assert.throws(()=>validateM1P1AccessEvidence({state:s,candidate:z}),/altered/);
});

test('tampered prebuilt public access cannot silently authorize M1',()=>{
 const s=state();s.world.locations['LOC-MARKET-BUSINESS-OFFICES'].access_status=
  'private_only';
 assert.throws(()=>deriveM1P1AccessEvidence({state:s}),
  /diverged|saved|access/i);
});

test('missing saved-world connection or absence of player state fails closed',()=>{
 assert.throws(()=>deriveM1P1AccessEvidence({state:{}}));
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=s.world.locations[
  'LOC-HARBOR-WALK'].connected_ids.filter(x=>x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>deriveM1P1AccessEvidence({state:s}));
});

test('read-only diagnostic is cloned and cannot change canonical world/player/NPC/time',()=>{
 const s=state(),before=JSON.stringify(s);
 const a=inspectM1P1AccessEvidence({state:s});
 a.sectionEntries[0].existingLocationReferenceCandidates[0].id='UNVERIFIED';
 const b=inspectM1P1AccessEvidence({state:s});
 assert.equal(b.sectionEntries[0].existingLocationReferenceCandidates[0].id,
  'LOC-CAFE-BRUMA');
 assert.equal(b.existingGraphModified,false);
 assert.equal(b.playerMoved,false);
 assert.equal(b.npcMoved,false);
 assert.equal(b.fictionalTimeAdvanced,false);
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(JSON.stringify(s),before);
});

test('all five canonical story Git blobs match original main checkpoint',()=>{
 const protectedFiles={
  '../game/SAVE_MANIFEST.json':'897ec2e77ece4f8edf506c7058552a5dd3cdb320',
  '../game/STATE.json':'3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  '../chapters/CH-000.events.json':'1f40c724e44f70c9b45814dc11ff1f73262c5a5f',
  '../chapters/CH-000.transcript.json':'1350916ead7fb1f2f15fdd635dda42e69a0a3fed',
  '../chapters/CH-000.md':'e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4'
 };
 for(const [name,expected] of Object.entries(protectedFiles))
  assert.equal(SHA(raw(name)),expected,name);
});
