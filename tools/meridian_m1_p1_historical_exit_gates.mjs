// Source-based M1/P1 pedestrian exit evidence gate.
// A saved-world location edge or a draft footway NEVER constitutes a public right of way.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validateM1P1AccessEvidence} from './meridian_harbor_m1_p1_access_evidence.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const sources={
 current:['MERIDIAN_BAY_M1_P1_ACCESS_EVIDENCE_20261122.json',
  '464bb09f77c4c01b3c75ee2dccfc13b0b2dfafba'],
 marketCrossPR40:['SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json',
  '904983876226ba82451bf9e3b5d6aed8e7885d6a'],
 marketHarborPR44:['SOURCE_PR44_MARKET_HARBOR_20261120.json',
  'e8efe8e5f6a746ab4e628f76a9deb5f71061010d'],
 plazaTerminalPR54:['SOURCE_PR54_PLAZA_TERMINAL_ACCESS_20261122.json',
  '8f687b97adecd3c03a4b962ef539f0b058520f0f'],
 plazaHarborPR56:['SOURCE_PR56_PLAZA_HARBOR_20261120.json',
  'a5ac772922b4717797118b15f182207be1d1a7fb']
};
const requireTrue=(condition,message)=>{if(!condition)throw Error(message);};
const clone=value=>structuredClone(value);
const same=(a,b)=>isDeepStrictEqual(a,b);
const reference={};
for(const [key,[filename,blob]] of Object.entries(sources)){
 const bytes=readFileSync(new URL(filename,root));
 const actual=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');
 requireTrue(actual===blob,'Immutable M1/P1 historical access evidence changed: '+key);
 reference[key]=JSON.parse(bytes.toString('utf8'));
}
const savedReport=JSON.parse(readFileSync(new URL(
 'MERIDIAN_BAY_M1_P1_HISTORICAL_EXIT_GATES_20261122.json',root),'utf8'));
const boundaries={
 M1:[
  ['M1-SOURCE-EXIT','Evidence of a specific public pedestrian exit from Market Row to M1','missing'],
  ['M1-CAFE-DOOR','Surveyed Café Bruma doorway and frontage compatibility','missing'],
  ['M1-PARCEL-RIGHTS','Verified public land or legally usable easement for the proposed line','missing'],
  ['M1-CROSSING','Crossing, curb, sidewalk continuity and actual travel width','missing'],
  ['M1-BUILDINGS','Building footprint, deliveries and service access conflict review','missing'],
  ['M1-GRADE','Measured slope, grade and accessibility of public route','missing']
 ],
 P1:[
  ['P1-PLAZA-EXIT','Exact plaza boundary and verified outward pedestrian passage','missing'],
  ['P1-TERMINAL-BOUNDARY','Evidence that route remains outside restricted terminal/vehicle circulation','missing'],
  ['P1-PARCEL-RIGHTS','Verified public land or legally usable easement for the proposed line','missing'],
  ['P1-CROSSING','Crosswalk, curb and conflict-free passage from plaza','missing'],
  ['P1-WIDTH','Measured sidewalk clearance and continuous unobstructed width','missing'],
  ['P1-GRADE','Measured slope, grade and accessibility of plaza exit','missing']
 ]
};
const xy=(a,b)=>same(a,b);
const round6=n=>Math.round(n*1e6)/1e6;
const handoff=(id,sourceIds,checks,landmarks)=>({
 sectionId:id,
 sourcePrIds:sourceIds,
 verifiedSourceRelationships:checks,
 placeReferenceIds:landmarks,
 requirements:boundaries[id].map(([key,question,status])=>({
  requirementId:key,question,status,authoritativeProofRef:null
 })),
 gate:'BLOCKED_PHYSICAL_EXIT_NOT_ESTABLISHED',
 existingGraphConnectivityPreserved:true,
 physicalPassageEstablished:false,
 publicEasementVerified:false,
 actualDoorwayOrCrosswalkMapped:false,
 mayPromoteToSavedWorld:false
});

export function deriveM1P1HistoricalExitGates({state}={}){
 validateM1P1AccessEvidence({state});
 const {current,marketCrossPR40:mc,marketHarborPR44:mh,
  plazaTerminalPR54:pt,plazaHarborPR56:ph}=reference;
 const a=current.sectionEntries.find(x=>x.sectionId==='MB-04-M1');
 const b=current.sectionEntries.find(x=>x.sectionId==='MB-04-P1');
 requireTrue(a&&b&&current.sectionEntries.length===2&&
  current.readyForPhysicalApproval===false,
  'Read-only M1/P1 source classification changed');
 requireTrue([mc,mh,pt,ph].every(x=>x.status==='detailed_draft_not_story_canon'),
  'Historical road sketch falsely treated as accepted world authority');
 requireTrue(mc.endpoints.from_location_id==='LOC-COMMERCIAL-DISTRICT'&&
  mc.endpoints.to_location_id==='LOC-CROSSWATER-PLAZA'&&
  mh.connection.from_location_id==='LOC-COMMERCIAL-DISTRICT'&&
  mh.connection.to_location_id==='LOC-HARBOR-WALK'&&
  ph.endpoints.from_location_id==='LOC-CROSSWATER-PLAZA'&&
  ph.endpoints.to_location_id==='LOC-HARBOR-WALK'&&
  pt.from_id==='LOC-CROSSWATER-PLAZA'&&
  pt.to_id==='LOC-TRANSIT-TERMINAL',
  'A source corridor identity no longer matches the original graph');
 // M1 is a *subset* of the source's FIRST draft edge below the land03 box.
 const original=mh.nodes;
 requireTrue(xy(original[0].xy,{x:58,y:43})&&
  xy(original[1].xy,{x:60,y:40.7})&&
  xy(a.start,{x:58.869565,y:42})&&
  xy(a.end,original[1].xy)&&
  round6(original[0].xy.x+
   (original[1].xy.x-original[0].xy.x)*
   (42-original[0].xy.y)/(original[1].xy.y-original[0].xy.y))===a.start.x,
  'M1 boundary does not derive from the historic Market–Harbor candidate');
 requireTrue(mc.nodes[0].location_id==='LOC-COMMERCIAL-DISTRICT'&&
  mc.nodes.at(-1).location_id==='LOC-CROSSWATER-PLAZA'&&
  mc.links[0].site_access.includes('Separate Café Bruma frontage')&&
  mc.visibility_gate.exact_corner_unknown===true&&
  mc.visibility_gate.raycast_or_sightline_completed===false&&
  mh.route_links[0].passable_verified===false&&
  mh.route_links[0].minutes===null&&
  mh.frontage_bands[0].surveyed_building_footprints===false&&
  a.doorwayConnectionToRouteVerified===false&&
  a.historicInlandStreetEndpointCoincidences.length===0,
  'Market Row historical fronts do not support an approved M1 exit');
 // P1 starts at the same SCHEMATIC plaza reference as PR40, PR54, PR56.
 requireTrue(xy(ph.nodes[0].xy,{x:65,y:42})&&
  xy(pt.nodes[0].xy,ph.nodes[0].xy)&&
  xy(mc.nodes.at(-1).xy,ph.nodes[0].xy)&&
  xy(b.start,ph.nodes[0].xy)&&
  xy(b.end,ph.nodes[1].xy)&&
  pt.nodes[0].location_id==='LOC-CROSSWATER-PLAZA'&&
  pt.pedestrian_interface.verified_accessibility===false&&
  pt.pedestrian_interface.verified_crosswalk===false&&
  pt.pedestrian_interface.verified_vehicle_conflict_free===false&&
  pt.pedestrian_interface.verified_curb_alignment===false&&
  ph.links[0].access_notes.includes('No verified crossing, grade, or public easement')&&
  xy(b.historicInlandStreetEndpointCoincidences[0].coordinate,b.start)&&
  xy(b.historicInlandStreetEndpointCoincidences[1].coordinate,b.start)&&
  same(b.startsOnDraftLandUseBoundaries,['MX-Z-TRANSIT'])&&
  b.physicalAccessApproved===false,
  'Shared plaza anchor does not prove an outward public P1 passage');
 requireTrue(a.existingLocationReferenceCandidates.length===3&&
  b.existingLocationReferenceCandidates.length===2&&
  state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-HARBOR-WALK')&&
  state.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids.includes('LOC-HARBOR-WALK'),
  'Saved source world relationships are missing');

 const sections=[
  handoff('M1',[40,44],[
   {claim:'market_commercial_frontage_exists_in_setting',
    evidence:'PR40/PR44 planning references',class:'setting_supported_not_surveyed'},
   {claim:'cafe_actual_corner_or_door_is_fixed',
    evidence:'PR40 visibility and site-access guard',class:'explicitly_unverified'},
   {claim:'first_direct_market_harbor_sketch_subsegment_is_consistent',
    evidence:'PR44 M1 crop at y42',class:'illustrative_only'}
  ],a.existingLocationReferenceCandidates.map(x=>x.id)),
  handoff('P1',[40,54,56],[
   {claim:'plaza_anchor_shared_by_historic_plans',
    evidence:'PR40/PR54/PR56 (65,42)',class:'illustrative_only'},
   {claim:'plaza_terminal_walkway_is_physical_and_accessible',
    evidence:'PR54 pedestrian_interface',class:'explicitly_unverified'},
   {claim:'plaza_harbor_egress_right_of_way_established',
    evidence:'PR56 L1 access_notes',class:'explicitly_unverified'}
  ],b.existingLocationReferenceCandidates.map(x=>x.id))
 ];
 return clone({
  schema_version:1,
  id:'MB-M1-P1-HISTORICAL-PUBLIC-EXIT-GATES-20261122',
  status:'BLOCKED_ON_UNVERIFIED_PHYSICAL_ACCESS',
  sources:Object.fromEntries(Object.entries(sources).map(
   ([key,[filename,blob]])=>[key,{path:'docs/01_world/'+filename,gitBlob:blob}])),
  checks:sections,
  openRequirementsCount:sections.reduce((n,s)=>n+s.requirements.length,0),
  provenPublicExits:[],
  auditedSavedGraphOnly:true,
  unapprovedSketchesNotCanon:true,
  legalEasementEstablished:false,
  newRoadsAndBuildings:[],
  noNewLocationIds:true,
  physicalRoutesApproved:false,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  nextAction:'obtain_source_backed_parcel_frontage_curb_and_public_right_of_way_evidence'
 });
}

export function validateM1P1HistoricalExitGates({state,candidate=savedReport}={}){
 requireTrue(same(deriveM1P1HistoricalExitGates({state}),candidate),
  'M1/P1 gate altered: cannot promote unsupported physical access');
 return true;
}
export function inspectM1P1HistoricalExitGates({state}={}){
 validateM1P1HistoricalExitGates({state});
 return clone(savedReport);
}
