// Audit the M2/M3/P2 gap in Meridian Bay Section04 without authoring roads.
// This validator can NEVER authorize travel or promote an unapproved map to canon.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {fileURLToPath} from 'node:url';
import {validateHarborSection04Study} from './meridian_harbor_section04_ledger.mjs';
import {validateSection04M1P1EntryEvidence} from './meridian_section04_m1p1_entry_evidence.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const inputs={
 section04:['MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json','a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b'],
 m1p1:['MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.json','760e819f0b9027e9eb7a8b55f1f33d0e65251a74'],
 routeReconciliation:['MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json','aae66aae315603e37e8cb88034600446bf46d21d'],
 coast01:['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json','139c3687c98285aff886d28422544d082768217d'],
 cityCanvas:['MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json','2e8c5ff412436a6e7d526bc0172adfca77107263']
};
const fail=(ok,msg)=>{if(!ok)throw Error(msg);};
const clone=x=>structuredClone(x);
const hash=b=>{const bytes=Buffer.from(b);return createHash('sha1')
 .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');};
const source={};
for(const [key,[filename,expectedSHA]] of Object.entries(inputs)){
 const raw=readFileSync(new URL(filename,root));
 fail(hash(raw)===expectedSHA,'Pinned Section04 middle source changed: '+key);
 source[key]=JSON.parse(raw.toString('utf8'));
}
const destination=new URL('MERIDIAN_BAY_SECTION04_MIDDLE_READINESS_20261122.json',root);
const svgDestination=new URL('MERIDIAN_BAY_SECTION04_MIDDLE_READINESS_20261122.svg',root);
const saved=JSON.parse(readFileSync(destination,'utf8'));
const ids=['MB-04-M2','MB-04-M3','MB-04-P2'];
const queries={
 'MB-04-M2':[
 'documented_parcel_and_building_massing',
 'public_pedestrian_right_of_way',
 'road_crossings_and_traffic_separation',
 'obstruction_inventory_including_walls',
 'pedestrian_width_and_accessibility',
 'continuity_from_M1_and_to_M3'
 ],
 'MB-04-M3':[
 'documented_parcel_and_building_massing',
 'public_pedestrian_right_of_way',
 'coast01_boundary_and_seam_access',
 'industrial_port_fence_and_security_transition',
 'obstruction_inventory_and_safe_crossings',
 'pedestrian_width_and_accessibility'
 ],
 'MB-04-P2':[
 'documented_parcel_and_building_massing',
 'public_pedestrian_right_of_way',
 'safe_separation_from_plaza_terminal_traffic',
 'coast01_boundary_and_seam_access',
 'obstruction_inventory_and_safe_crossings',
 'pedestrian_width_and_accessibility'
 ]
};
const xyEqual=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const intersectsStrictly=(a,b,c,d)=>{
 const v=cross(a,b,c)*cross(a,b,d),w=cross(c,d,a)*cross(c,d,b);
 return v<-1e-10&&w<-1e-10;
};
const range=s=>({x_min:Math.min(s.from.x,s.to.x),
 x_max:Math.max(s.from.x,s.to.x),y_min:Math.min(s.from.y,s.to.y),
 y_max:Math.max(s.from.y,s.to.y)});
const find=id=>source.section04.sections.find(s=>s.id===id);
const routeNode=(route,key)=>source.routeReconciliation[route].nodes.find(n=>n.id===key);

export function deriveSection04MiddleReadiness({state}={}){
 fail(state?.world?.locations&&state?.player?.location_id,
  'Canonical location graph and player required for middle-region inspection');
 validateHarborSection04Study({state});
 validateSection04M1P1EntryEvidence({state});
 fail(source.cityCanvas.planning_envelope?.georeferenced===false&&
  source.cityCanvas.planning_envelope?.width_units===100&&
  source.cityCanvas.planning_envelope?.height_units===80&&
  source.coast01.study_box.x_min===68&&
  source.coast01.study_box.y_max===42,
  'Section04 coordinate frame no longer agrees with original source');
 const focus=ids.map(id=>{
  const s=find(id);
  fail(s&&s.status==='line_from_unapproved_source_only_missing_physical_region_study'&&
   s.buildingFootprints===null&&s.landUse===null&&s.publicEasement===null&&
   s.canNavigate===false&&s.measuredWidth===null,
   'Prior register promoted unknown physical geometry: '+id);
  const route=s.route==='market'?'market_to_harbor':'plaza_to_harbor';
  fail(s.sourcePr103Property===route&&
   xyEqual(routeNode(route,s.sourceWaypointIds[0])?.xy,s.from)&&
   xyEqual(routeNode(route,s.sourceWaypointIds[1])?.xy,s.to),
   'Section04 segment no longer matches unapproved source polyline: '+id);
  return {
   id,route:s.route,sourcePr103Property:s.sourcePr103Property,
   sourceWaypointIds:clone(s.sourceWaypointIds),
   sourceSegmentIndex:s.sourceSegmentIndex,
   from:clone(s.from),to:clone(s.to),
   hypotheticalLengthUnits:s.hypotheticalLengthUnits,
   searchBox:range(s),
   searchBoxMeaning:'derived_line_extent_not_parcel_or_road_survey',
   evidenceRequirements:queries[id].map(key=>({
    key,status:'unknown',sourceEvidence:null
   })),
   landUse:null,buildingFootprints:null,publicRightOfWay:null,
   actualRoadWidth:null,physicalObstacles:null,
   entranceApproved:false,canNavigate:false
  };
 });
 const [m2,m3,p2]=focus,m1=find('MB-04-M1'),p1=find('MB-04-P1');
 fail(m1&&p1&&xyEqual(m1.to,m2.from)&&xyEqual(m2.to,m3.from)&&
  xyEqual(p1.to,p2.from)&&xyEqual(m3.to,{x:68,y:36.9})&&
  xyEqual(p2.to,{x:68,y:38.635714})&&
  source.m1p1.entries[0].sectionId===m1.id&&
  source.m1p1.entries[1].sectionId===p1.id,
  'M1/M2/M3 or P1/P2 edge custody broken');
 const candidates=[m2,m3].map(s=>[s.from,s.to]);
 const plaza=[p2.from,p2.to];
 const crossings=candidates.filter(([a,b])=>
  intersectsStrictly(a,b,plaza[0],plaza[1])).length;
 fail(crossings===0,'Middle-section draft centerlines unexpectedly cross');
 fail(state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-HARBOR-WALK')&&
  state.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids.includes('LOC-HARBOR-WALK'),
  'Existing broad location topology changed');
 return clone({
  schema_version:1,
  id:'MB-SECTION04-M2-M3-P2-PHYSICAL-READINESS-20261122',
  status:'source_locked_middle_sections_unmapped_not_playable',
  parentDraftPr:132,
  sourceGitBlobs:Object.fromEntries(Object.entries(inputs).map(([k,[,sha]])=>[k,sha])),
  coordinateAuthority:'non_georeferenced_reversible_100x80_illustrative_canvas',
  focusSections:clone(ids),
  studySearchWindow:{
   x_min:60,x_max:68,y_min:36.9,y_max:40.7,
   meaning:'mathematical_envelope_only_not_physical_territory_or_parcels'
  },
  sections:focus,
  handoffs:{
   market:{
    m1_end:clone(m1.to),m2_start:clone(m2.from),
    m2_end:clone(m2.to),m3_start:clone(m3.from),
    m3_end:clone(m3.to),coast01_entry:{x:68,y:36.9}
   },
   plaza:{
    p1_end:clone(p1.to),p2_start:clone(p2.from),
    p2_end:clone(p2.to),coast01_entry:{x:68,y:38.635714}
   }
  },
  existingPlaceGraphAlreadyLinksMarketPlazaToHarbor:true,
  knownInternalRouteCrossings:crossings,
  knownMapCollisionsBeyondStudyRegions:'unknown',
  routeSharedStreetVerified:false,
  sourceWindowCoveredByApprovedPhysicalPlan:false,
  missingEvidenceRequirementCount:focus.reduce((n,s)=>n+s.evidenceRequirements.length,0),
  admissionRules:{
   newRoadsAuthorized:false,publicPassageProven:false,
   coast01IntegrationCertified:false,privatePortAccessAllowed:false,
   centerlineClearanceEstablishesAccessibility:false,
   unknownBuildingFootprintsImplyEmptyLand:false,
   needsEditorialPhysicalDesignReview:true
  },
  storyProtection:{
   savedWorldChanged:false,newLocationEdges:[],playerMoved:false,
   npcMoved:false,fictionalTimeAdvanced:false
  },
  nextAction:'obtain_authored_parcel_frontage_crossing_and_public_access_evidence_before_section04_physical_fragment'
 });
}
export function validateSection04MiddleReadiness({state,review=saved}={}){
 const expected=deriveSection04MiddleReadiness({state});
 fail(same(review,expected),
  'Middle Section04 evidence differs from source or asserts unauthorized street access');
 return true;
}
export function inspectSection04MiddleReadiness({state}={}){
 validateSection04MiddleReadiness({state});
 return clone(saved);
}
// For any physical candidate, unknown source claims cannot be treated as
// success even if a caller fills all input fields with arbitrary values.
export function assessSection04AdmissionClaim({state,candidate}={}){
 const doc=inspectSection04MiddleReadiness({state});
 const perSection=doc.sections.map(s=>{
  const entry=candidate?.sections?.find?.(x=>x?.id===s.id);
  const missing=queries[s.id].filter(key=>{
   const evidence=entry?.evidence?.[key];
   return evidence?.verification!=='verified_against_source'||
    typeof evidence?.sourcePath!=='string'||
    typeof evidence?.sourceBlob!=='string';
  });
  return {sectionId:s.id,
   missingEvidence:missing,
   callerClaimsComplete:missing.length===0};
 });
 const anyUnsafe=(candidate?.approved===true||
  candidate?.playable===true||
  candidate?.publicRightOfWayApproved===true||
  candidate?.sections?.some?.(x=>x?.canNavigate===true))===true;
 return clone({
  admission:'BLOCKED_NOT_EDITORIALLY_REVIEWED',
  requestedUnsafePromotion:anyUnsafe,
  candidatePresent:!!candidate,
  sourceProofValidated:false,
  certifiedPhysicalAccess:false,
  additionalOwnerAndSourceReviewRequired:true,
  perSection
 });
}
const num=n=>Number(n).toFixed(2);
const pt=p=>({x:85+(p.x-58)*100,y:70+(43-p.y)*95});
const pts=arr=>arr.map(p=>{const q=pt(p);return num(q.x)+','+num(q.y)}).join(' ');
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;');
const label=(s,x,y,size=14)=>'<text x="'+num(x)+'" y="'+num(y)+
 '" font-size="'+size+'" fill="#243943">'+xml(s)+'</text>';
const line=(id,arr,color,dash,width)=>'<polyline data-map-id="'+id+
 '" points="'+pts(arr)+'" stroke="'+color+'" stroke-width="'+width+
 '" fill="none" stroke-linecap="round" stroke-linejoin="round"'+
 (dash?' stroke-dasharray="'+dash+'"':'')+'/>';
const rect=(id,box,fill)=>{
 const corner=pt({x:box.x_min,y:box.y_max});
 return '<rect data-map-id="'+id+'" x="'+num(corner.x)+
 '" y="'+num(corner.y)+'" width="'+num((box.x_max-box.x_min)*100)+
 '" height="'+num((box.y_max-box.y_min)*95)+
 '" fill="'+fill+'" opacity=".28" stroke="#63757c" stroke-width="1.5" stroke-dasharray="6 5"/>';
};
export function renderSection04MiddleReadinessSvg({state}={}){
 const doc=inspectSection04MiddleReadiness({state}),a=find('MB-04-M1'),b=find('MB-04-P1');
 const rows=[
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="1550" height="930" viewBox="0 0 1550 930">',
  '<title>Meridian Bay Section 04 M2 M3 P2 — unmapped, NOT playable</title>',
  '<desc>All lines derive from immutable provisional corridor source nodes. Colored boxes are segment envelopes, not parcels or real city geometry. Nothing is approved for walking.</desc>',
  '<rect width="1550" height="930" fill="#f6f4ed"/>',
  label('MERIDIAN BAY · SECTION 04 — M2 / M3 / P2',85,38,25),
  label('PROPUESTA DE INVESTIGACIÓN · SIN PARCELAS NI VÍAS FÍSICAS APROBADAS',85,62,15),
  '<rect x="85" y="70" width="1200" height="760" fill="#ecece5" stroke="#aab9b6"/>',
  rect('MIDDLE-SEARCH-NOT-SURVEY',doc.studySearchWindow,'#d9b2a4')
 ];
 for(const [i,s] of doc.sections.entries()){
  rows.push(rect(s.id+'-QUERY-BOX',s.searchBox,i===2?'#b4c9d6':'#e3c7a0'));
 }
 rows.push(line('INHERITED-M1',[a.from,a.to],'#8c9998','4 8',2));
 rows.push(line('INHERITED-P1',[b.from,b.to],'#8c9998','4 8',2));
 for(const s of doc.sections){
  rows.push(line(s.id,[s.from,s.to],s.route==='market'?'#b05945':'#286a9e','7 6',4.5));
  const mid=pt({x:(s.from.x+s.to.x)/2,y:(s.from.y+s.to.y)/2});
  rows.push(label(s.id+' · ? ',mid.x+8,mid.y-8,13));
 }
 for(const [labelText,p] of [
  ['LAND03 EXIT · not certified',a.from],
  ['COAST01 M3 HANDOFF',doc.handoffs.market.coast01_entry],
  ['COAST01 P2 HANDOFF',doc.handoffs.plaza.coast01_entry]
 ]){
  const c=pt(p);
  rows.push('<circle cx="'+num(c.x)+'" cy="'+num(c.y)+
   '" r="5" fill="#305e72" stroke="white" stroke-width="2"/>');
  rows.push(label(labelText,c.x+8,c.y-12,12));
 }
 rows.push('<rect x="1300" y="75" width="237" height="744" rx="9" fill="#fffefa" stroke="#b8c4c4"/>');
 let y=114;
 for(const note of [
  'ESTUDIOS PENDIENTES:',
  'M2 · zona comercial',
  'M3 · llegada a costa',
  'P2 · transición plaza',
  '',
  'Desconocido:',
  'Parcelas y edificios',
  'Derechos de paso',
  'Obstáculos reales',
  'Cruces y seguridad',
  'Anchura accesible',
  'Transición a Coast01',
  '',
  '18 requisitos abiertos',
  'No habilitar rutas',
  'No construir casas',
  'No conceder acceso',
  'al puerto industrial',
  '',
  'M1 / P1: PR #132',
  'Registro: PR #122',
  '',
  'NO CANÓNICO'
 ]){if(!note){y+=13;continue;}rows.push(label(note,1314,y,12));y+=29;}
 rows.push('<rect x="85" y="850" width="1451" height="61" rx="8" fill="#fffefa" stroke="#bac7c4"/>');
 rows.push(label('Líneas de origen hipotético, no calles públicas. Ningún permiso, edificio, navegación, tiempo ni hecho narrativo nuevo.',98,878,15));
 rows.push(label('La ausencia de huellas de edificios en este dibujo NO significa que el suelo esté vacío.',98,899,13));
 rows.push('<metadata id="section04-middle-gate" data-admitted="false" data-travel-approved="false" data-story-action="false"/>');
 rows.push('</svg>');
 return rows.join('\n')+'\n';
}
export function verifySection04MiddleReadinessSvg({state}={}){
 const generated=renderSection04MiddleReadinessSvg({state});
 fail(readFileSync(svgDestination,'utf8')===generated,
  'Section04 middle visualization differs from source-derived geometry');
 return true;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 fail(process.argv.length===3&&process.argv[2]==='--write',
  'Run with --write for the one draft SVG; never writes game files');
 const state=JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url),'utf8'));
 writeFileSync(svgDestination,renderSection04MiddleReadinessSvg({state}),'utf8');
 verifySection04MiddleReadinessSvg({state});
 console.log('PASS: source-derived M2/M3/P2 study map, no physical route admission');
}
