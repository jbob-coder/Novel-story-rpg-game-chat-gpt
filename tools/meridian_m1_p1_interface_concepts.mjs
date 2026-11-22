// Review-only public-realm interface concepts for Section04 M1/P1.
// These are physical *arrangement hypotheses*, not georeferenced sidewalks.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validateM1P1HistoricalExitGates} from './meridian_m1_p1_historical_exit_gates.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const pinned={
 gates:['MERIDIAN_BAY_M1_P1_HISTORICAL_EXIT_GATES_20261122.json',
  'c4fb60f05c605e031a753b7f5cfc6a2c89d495bb'],
 section:['MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json',
  'a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b'],
 evidence:['MERIDIAN_BAY_M1_P1_ACCESS_EVIDENCE_20261122.json',
  '464bb09f77c4c01b3c75ee2dccfc13b0b2dfafba']
};
const failUnless=(v,m)=>{if(!v)throw Error(m);};
const source={};
for(const [key,[file,sha]] of Object.entries(pinned)){
 const bytes=readFileSync(new URL(file,root));
 const found=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');
 failUnless(found===sha,'Source blob changed: '+key);
 source[key]=JSON.parse(bytes.toString('utf8'));
}
const recorded=JSON.parse(readFileSync(new URL(
 'MERIDIAN_BAY_M1_P1_INTERFACE_CONCEPTS_20261122.json',root),'utf8'));
const defs=[
 {
  id:'M1-A',section:'M1',name:'commercial_frontage_separated_public_walk',
  concept:'Maintain shop/customer entry distinct from a proposed public walking strip, with service/delivery conflicts screened outside it.',
  layers:['existing_market_saved_graph_area','unverified_shop_door_and_delivery_interface',
   'proposed_public_pedestrian_clear_strip','proposed_delivery_conflict_buffer',
   'unmapped_M1_study_continuation'],
  focus:['M1-SOURCE-EXIT','M1-CAFE-DOOR','M1-CROSSING','M1-BUILDINGS'],
  concern:'Shop doors and delivery movements can interrupt an unmeasured clear path.',
  relativeSideOrientation:'unfixed',requiresNewLegalAccessEvidence:true,
  firstToInvestigate:true
 },
 {
  id:'M1-B',section:'M1',name:'commercial_perimeter_bypass',
  concept:'Study a public-realm perimeter bypass that does not assume passage through a café or loading frontage.',
  layers:['existing_market_saved_graph_area','unverified_public_perimeter_exit',
   'proposed_conflict_controlled_crossing','proposed_perimeter_pedestrian_band',
   'unmapped_M1_study_continuation'],
  focus:['M1-SOURCE-EXIT','M1-PARCEL-RIGHTS','M1-CROSSING','M1-GRADE'],
  concern:'The proposed public perimeter and any crossing have not been located or authorized.',
  relativeSideOrientation:'unfixed',requiresNewLegalAccessEvidence:true,
  firstToInvestigate:false
 },
 {
  id:'P1-A',section:'P1',name:'plaza_perimeter_non_terminal_exit',
  concept:'Study an outward public-plaza perimeter connection separated from terminal loading, ticketing and vehicle circulation.',
  layers:['existing_crosswater_public_plaza','unverified_public_plaza_outer_edge',
   'proposed_terminal_operations_separation','proposed_pedestrian_clear_strip',
   'unmapped_P1_study_continuation'],
  focus:['P1-PLAZA-EXIT','P1-TERMINAL-BOUNDARY','P1-PARCEL-RIGHTS','P1-WIDTH'],
  concern:'Exact terminal circulation and the public plaza edge are not surveyed.',
  relativeSideOrientation:'unfixed',requiresNewLegalAccessEvidence:true,
  firstToInvestigate:true
 },
 {
  id:'P1-B',section:'P1',name:'segregated_plaza_crossing',
  concept:'Compare a designed crossing from the public plaza to a separate proposed pedestrian approach outside controlled terminal premises.',
  layers:['existing_crosswater_public_plaza','unverified_crossing_location',
   'proposed_protected_pedestrian_crossing','proposed_buffer_from_transit_traffic',
   'unmapped_P1_study_continuation'],
  focus:['P1-PLAZA-EXIT','P1-CROSSING','P1-TERMINAL-BOUNDARY','P1-GRADE'],
  concern:'No certified crossing, vehicle conflict diagram, curb treatment or public easement exists.',
  relativeSideOrientation:'unfixed',requiresNewLegalAccessEvidence:true,
  firstToInvestigate:false
 }
];
const clone=x=>structuredClone(x);
const eq=(a,b)=>isDeepStrictEqual(a,b);

export function deriveM1P1InterfaceConcepts({state}={}){
 validateM1P1HistoricalExitGates({state});
 const gates=source.gates;
 failUnless(gates.status==='BLOCKED_ON_UNVERIFIED_PHYSICAL_ACCESS'&&
  gates.openRequirementsCount===12&&gates.provenPublicExits.length===0,
  'Physical access gate is no longer in its reviewed blocked state');
 failUnless(source.evidence.sectionEntries.length===2&&
  source.section.sections.length===5&&
  source.section.routes.length===2&&
  source.section.sections.every(x=>x.canNavigate===false),
  'Source Section04 site or route evidence changed');
 const alternatives=defs.map(def=>{
  const parent=gates.checks.find(x=>x.sectionId===def.section);
  const line=source.section.sections.find(x=>
   x.id==='MB-04-'+def.section);
  failUnless(parent&&line&&line.buildingFootprints===null&&
   line.publicEasement===null&&
   line.landUse===null&&
   parent.gate==='BLOCKED_PHYSICAL_EXIT_NOT_ESTABLISHED',
   'Cannot promote unreviewed physical Section04 geometry');
  const requirements=parent.requirements;
  failUnless(requirements.length===6&&requirements.every(x=>
   x.status==='missing'&&x.authoritativeProofRef===null),
   'Requirements must remain unproven until documented');
  failUnless(def.layers.length===5&&
   def.layers[0].startsWith('existing_')&&
   def.layers[4]===('unmapped_'+def.section+'_study_continuation')&&
   def.focus.every(id=>requirements.some(x=>x.requirementId===id)),
   'Concept incorrectly assumes a real-world location or invalid proof gate');
  return {
   id:def.id,studySection:'MB-04-'+def.section,
   description:def.concept,layoutName:def.name,
   conceptualRelativeLayers:clone(def.layers),
   relativeSideOrientation:def.relativeSideOrientation,
   fixedGeometry:null,polygon:null,measuredWidthMeters:null,
   pathDistanceKm:null,walkingTimeMinutes:null,
   sourceLineFrom:clone(line.from),sourceLineTo:clone(line.to),
   studyWindowOnlyNotPublicLand:true,
   evidenceRequired:requirements.map(x=>x.requirementId),
   reviewFocus:clone(def.focus),
   unresolvedInteraction:def.concern,
   firstToInvestigate:def.firstToInvestigate,
   requiresNewLegalAccessEvidence:def.requiresNewLegalAccessEvidence,
   physicallyLocated:false,parcelOwnerKnown:false,
   crossingDesigned:false,unrestrictedPublicAccessVerified:false,
   accessibilityVerified:false,
   selectedForBuild:false,canNavigate:false
  };
 });
 failUnless(alternatives.length===4&&
  alternatives.filter(x=>x.firstToInvestigate).length===2&&
  alternatives.filter(x=>x.studySection==='MB-04-M1').length===2&&
  alternatives.filter(x=>x.studySection==='MB-04-P1').length===2,
  'Two independent options per section are required');
 return clone({
  schema_version:1,
  id:'MB-SECTION04-M1-P1-PHYSICAL-INTERFACE-OPTIONS-20261122',
  status:'conceptual_interfaces_only_require_site_design',
  sourceGitBlobs:Object.fromEntries(Object.entries(pinned).map(
   ([key,[,sha]])=>[key,sha])),
  alternatives,
  reviewOrder:['M1-A','P1-A','M1-B','P1-B'],
  reviewOrderDoesNotSelectConstruction:true,
  hasMappedCrossSection:false,
  section04RemainingUnknown:['MB-04-M2','MB-04-P2','MB-04-M3'],
  physicalSurfaceApproval:null,
  selectedMarketExit:null,selectedPlazaExit:null,
  newPublicRoads:[],newBuildings:[],newLocationIds:[],
  originalSavedGraphUnchanged:true,storyBlobsUnchanged:true,
  noPlayerAction:true,noNpcAction:true,noFictionalTimeElapsed:true,
  nextEngineeringTask:'seek_source_or_owner_evidence_for_exit_parcels_and_schematic_public_boundaries'
 });
}
export function validateM1P1InterfaceConcepts({state,candidate=recorded}={}){
 failUnless(eq(deriveM1P1InterfaceConcepts({state}),candidate),
  'M1/P1 concept altered or unverified geometry approved');
 return true;
}
export function inspectM1P1InterfaceConcepts({state}={}){
 validateM1P1InterfaceConcepts({state});
 return clone(recorded);
}
