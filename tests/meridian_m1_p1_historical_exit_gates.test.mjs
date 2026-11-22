import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 deriveM1P1HistoricalExitGates,validateM1P1HistoricalExitGates,
 inspectM1P1HistoricalExitGates
} from '../tools/meridian_m1_p1_historical_exit_gates.mjs';

const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const state=()=>json('../game/STATE.json');
const source=p=>json('../docs/01_world/'+p);
const archive=()=>source('MERIDIAN_BAY_M1_P1_HISTORICAL_EXIT_GATES_20261122.json');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');

test('exact derived historical gate equals committed review, with zero state mutation',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.deepEqual(deriveM1P1HistoricalExitGates({state:s}),archive());
 assert.equal(validateM1P1HistoricalExitGates({state:s}),true);
 assert.equal(JSON.stringify(s),before);
});

test('PR40/PR54 copies are byte-exact source Git blobs and other sources are pinned',()=>{
 const pinned={
  'SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json':
   '904983876226ba82451bf9e3b5d6aed8e7885d6a',
  'SOURCE_PR54_PLAZA_TERMINAL_ACCESS_20261122.json':
   '8f687b97adecd3c03a4b962ef539f0b058520f0f',
  'SOURCE_PR44_MARKET_HARBOR_20261120.json':
   'e8efe8e5f6a746ab4e628f76a9deb5f71061010d',
  'SOURCE_PR56_PLAZA_HARBOR_20261120.json':
   'a5ac772922b4717797118b15f182207be1d1a7fb',
  'MERIDIAN_BAY_M1_P1_ACCESS_EVIDENCE_20261122.json':
   '464bb09f77c4c01b3c75ee2dccfc13b0b2dfafba'
 };
 for(const [name,sha] of Object.entries(pinned))
  assert.equal(blob(raw('../docs/01_world/'+name)),sha,name);
});

test('PR40 and PR54 were separate draft corridors, not incorporated streets',()=>{
 const a=source('SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json');
 const b=source('SOURCE_PR54_PLAZA_TERMINAL_ACCESS_20261122.json');
 assert.equal(a.status,'detailed_draft_not_story_canon');
 assert.equal(b.status,'detailed_draft_not_story_canon');
 assert.equal(a.endpoints.from_location_id,'LOC-COMMERCIAL-DISTRICT');
 assert.equal(a.endpoints.to_location_id,'LOC-CROSSWATER-PLAZA');
 assert.equal(b.from_id,'LOC-CROSSWATER-PLAZA');
 assert.equal(b.to_id,'LOC-TRANSIT-TERMINAL');
});

test('M1 comes from original PR44 first segment clipping at y42, not invented path',()=>{
 const p=source('SOURCE_PR44_MARKET_HARBOR_20261120.json');
 const original=p.nodes.slice(0,2).map(n=>n.xy);
 assert.deepEqual(original,[{x:58,y:43},{x:60,y:40.7}]);
 const t=(42-original[0].y)/(original[1].y-original[0].y);
 const x=Math.round((original[0].x+
  (original[1].x-original[0].x)*t)*1e6)/1e6;
 assert.equal(x,58.869565);
 assert.equal(p.route_links[0].passable_verified,false);
 assert.equal(p.route_links[0].minutes,null);
});

test('M1 public exits are blocked even though commercial district and café exist',()=>{
 const v=inspectM1P1HistoricalExitGates({state:state()});
 const m=v.checks[0];
 assert.equal(m.sectionId,'M1');
 assert.deepEqual(m.sourcePrIds,[40,44]);
 assert.deepEqual(m.placeReferenceIds,[
  'LOC-CAFE-BRUMA','LOC-COMMERCIAL-DISTRICT','LOC-MARKET-BUSINESS-OFFICES']);
 assert.equal(m.gate,'BLOCKED_PHYSICAL_EXIT_NOT_ESTABLISHED');
 assert.equal(m.physicalPassageEstablished,false);
 assert.equal(m.mayPromoteToSavedWorld,false);
});

test('PR40 specifically preserves café doorway and sightline uncertainty',()=>{
 const c=source('SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json');
 assert.ok(c.links[0].site_access.includes('Separate Café Bruma frontage'));
 assert.equal(c.visibility_gate.exact_corner_unknown,true);
 assert.equal(c.visibility_gate.raycast_or_sightline_completed,false);
 assert.equal(c.frontage_bands[0].physical_buildings_confirmed,false);
});

test('P1 is an illustrative common plaza anchor, not a new street or platform route',()=>{
 const a=source('SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json');
 const b=source('SOURCE_PR54_PLAZA_TERMINAL_ACCESS_20261122.json');
 const c=source('SOURCE_PR56_PLAZA_HARBOR_20261120.json');
 assert.deepEqual(a.nodes.at(-1).xy,{x:65,y:42});
 assert.deepEqual(b.nodes[0].xy,a.nodes.at(-1).xy);
 assert.deepEqual(c.nodes[0].xy,a.nodes.at(-1).xy);
 const p=inspectM1P1HistoricalExitGates({state:state()}).checks[1];
 assert.deepEqual(p.sourcePrIds,[40,54,56]);
 assert.equal(p.physicalPassageEstablished,false);
 assert.equal(p.publicEasementVerified,false);
});

test('PR54 records no actual safe, accessible terminal/plaza crossing',()=>{
 const pt=source('SOURCE_PR54_PLAZA_TERMINAL_ACCESS_20261122.json');
 assert.equal(pt.pedestrian_interface.verified_accessibility,false);
 assert.equal(pt.pedestrian_interface.verified_crosswalk,false);
 assert.equal(pt.pedestrian_interface.verified_vehicle_conflict_free,false);
 assert.equal(pt.pedestrian_interface.verified_curb_alignment,false);
 assert.equal(pt.pedestrian_interface.verified_ticketed_boundary,false);
});

test('PR56 explicitly leaves public easement, grade and crossings unverified',()=>{
 const p=source('SOURCE_PR56_PLAZA_HARBOR_20261120.json');
 assert.ok(p.links[0].access_notes.includes(
  'No verified crossing, grade, or public easement'));
 assert.equal(p.links[0].estimated_minutes,null);
 assert.equal(p.bands[0].physical_building_footprints_confirmed,false);
});

test('all 12 required physical claims remain unknown and unapproved',()=>{
 const v=inspectM1P1HistoricalExitGates({state:state()});
 assert.equal(v.status,'BLOCKED_ON_UNVERIFIED_PHYSICAL_ACCESS');
 assert.equal(v.openRequirementsCount,12);
 assert.deepEqual(v.checks.map(x=>x.requirements.length),[6,6]);
 assert.ok(v.checks.flatMap(x=>x.requirements).every(x=>
  x.status==='missing'&&x.authoritativeProofRef===null));
 assert.equal(new Set(v.checks.flatMap(x=>x.requirements.map(y=>y.requirementId))).size,12);
 assert.equal(v.legalEasementEstablished,false);
 assert.equal(v.physicalRoutesApproved,false);
 assert.deepEqual(v.provenPublicExits,[]);
});

test('future owner decision cannot be silently replaced by a guessed access approval',()=>{
 const s=state(),v=archive();
 v.checks[1].requirements[0].status='verified';
 v.checks[1].requirements[0].authoritativeProofRef='fake-source';
 assert.throws(()=>validateM1P1HistoricalExitGates({state:s,candidate:v}),
  /gate altered/);
 const w=archive();w.physicalRoutesApproved=true;
 assert.throws(()=>validateM1P1HistoricalExitGates({state:s,candidate:w}),
  /gate altered/);
});

test('claiming a public easement or overriding missing requirements fails closed',()=>{
 const s=state(),a=archive();a.legalEasementEstablished=true;
 assert.throws(()=>validateM1P1HistoricalExitGates({state:s,candidate:a}),
  /gate altered/);
 const b=archive();b.checks[0].requirements=[];
 assert.throws(()=>validateM1P1HistoricalExitGates({state:s,candidate:b}),
  /gate altered/);
 const c=archive();c.newRoadsAndBuildings.push({id:'FABRICATED'});
 assert.throws(()=>validateM1P1HistoricalExitGates({state:s,candidate:c}),
  /gate altered/);
});

test('missing player world or lost saved-world connectivity blocks report',()=>{
 assert.throws(()=>deriveM1P1HistoricalExitGates({state:{}}));
 const s=state(),h=s.world.locations['LOC-HARBOR-WALK'];
 h.connected_ids=h.connected_ids.filter(x=>x!=='LOC-CROSSWATER-PLAZA');
 assert.throws(()=>deriveM1P1HistoricalExitGates({state:s}));
});

test('public business status alone cannot be accepted as proof of M1 access',()=>{
 const s=state();
 assert.equal(s.world.locations['LOC-MARKET-BUSINESS-OFFICES'].access_status,
  'public_confirmed');
 const g=inspectM1P1HistoricalExitGates({state:s});
 assert.equal(g.checks[0].publicEasementVerified,false);
 assert.equal(g.checks[0].actualDoorwayOrCrosswalkMapped,false);
});

test('inspection returns a defensive clone without modifying time, player or NPCs',()=>{
 const s=state(),before=JSON.stringify(s);
 const x=inspectM1P1HistoricalExitGates({state:s});
 x.checks[0].requirements[0].status='verified';
 x.checks[1].placeReferenceIds[0]='FORGED';
 const y=inspectM1P1HistoricalExitGates({state:s});
 assert.equal(y.checks[0].requirements[0].status,'missing');
 assert.equal(y.checks[1].placeReferenceIds[0],'LOC-CROSSWATER-PLAZA');
 assert.equal(y.playerMoved,false);
 assert.equal(y.npcMoved,false);
 assert.equal(y.fictionalTimeAdvanced,false);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(JSON.stringify(s),before);
});

test('five canonical story blobs remain bit-identical to main checkpoint',()=>{
 const base={
  '../game/SAVE_MANIFEST.json':'897ec2e77ece4f8edf506c7058552a5dd3cdb320',
  '../game/STATE.json':'3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  '../chapters/CH-000.events.json':'1f40c724e44f70c9b45814dc11ff1f73262c5a5f',
  '../chapters/CH-000.transcript.json':'1350916ead7fb1f2f15fdd635dda42e69a0a3fed',
  '../chapters/CH-000.md':'e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4'
 };
 for(const [path,sha] of Object.entries(base))
  assert.equal(blob(raw(path)),sha,path);
});
