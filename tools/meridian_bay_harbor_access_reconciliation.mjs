// Source-locked comparison of historical PR44/PR58/PR56 harbor approaches.
// This module has no story side effects and does not admit physical routes.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {fileURLToPath} from 'node:url';
import {validatePr67CoastCandidate} from './render_harbor_coast_pr67_candidate.mjs';
import {coastalWaterConflicts,coastRoadBuildingConflicts} from './meridian_bay_three_region_seams.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const sources={
 market44:['SOURCE_PR44_MARKET_HARBOR_20261120.json','e8efe8e5f6a746ab4e628f76a9deb5f71061010d'],
 market58:['SOURCE_PR58_MARKET_HARBOR_20261120.json','280a444f6eed99a33027aea2edb48af70cc67bd0'],
 plaza56:['SOURCE_PR56_PLAZA_HARBOR_20261120.json','a5ac772922b4717797118b15f182207be1d1a7fb'],
 coast:['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json','139c3687c98285aff886d28422544d082768217d']
};
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const copy=x=>structuredClone(x);
const blob=b=>{const data=Buffer.from(b);return createHash('sha1')
 .update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');};
const data={};
for(const [key,[file,sha]] of Object.entries(sources)){
 const raw=readFileSync(new URL(file,root));
 assert(blob(raw)===sha,'Historical source Git blob changed: '+key);
 data[key]=JSON.parse(raw);
}
const proposed=JSON.parse(readFileSync(new URL(
 'MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json',root)));
const output=new URL('MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.svg',root);
const orientation=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const EPS=1e-8;
const strictCross=(a,b,c,d)=>orientation(a,b,c)*orientation(a,b,d)<-EPS&&
 orientation(c,d,a)*orientation(c,d,b)<-EPS;
const polygonInside=(p,vertices)=>{
 let inside=false;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
  const a=vertices[i],b=vertices[j];
  if((a.y>p.y)!==(b.y>p.y)&&
   p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
};
const segmentPointDist=(p,a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y;
 const fraction=Math.max(0,Math.min(1,
  ((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(p.x-a.x-fraction*dx,p.y-a.y-fraction*dy);
};
const segmentDistance=(a,b,c,d)=>strictCross(a,b,c,d)?0:Math.min(
 segmentPointDist(a,c,d),segmentPointDist(b,c,d),
 segmentPointDist(c,a,b),segmentPointDist(d,a,b));
const segmentPairs=points=>points.slice(1).map((b,i)=>[points[i],b,i]);
const shapePairs=polygon=>polygon.map((a,i)=>[a,polygon[(i+1)%polygon.length],i]);
const crossingSegments=(route,shape,closed)=>segmentPairs(route).flatMap(([a,b,segment])=>
 (closed?shapePairs(shape):segmentPairs(shape).map(([c,d,i])=>[c,d,i]))
 .filter(([c,d])=>strictCross(a,b,c,d))
 .map(([, ,edge])=>({segment,edge})));
const distanceFromRoute=(route,shape,closed)=>Math.min(
 ...segmentPairs(route).flatMap(([a,b])=>
 (closed?shapePairs(shape):segmentPairs(shape)).map(([c,d])=>segmentDistance(a,b,c,d))
 ));
const pointEquals=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const path=nodes=>nodes.map(n=>n.xy);
const harbor={x:71,y:37};
const cityStart={x:58,y:43};
const plazaStart={x:65,y:42};

export function inspectRouteAgainstCoast(points,fragment=data.coast){
 assert(Array.isArray(points)&&points.length>=2,'Candidate route must have at least 2 points');
 assert(points.every(q=>Number.isFinite(q?.x)&&Number.isFinite(q?.y)),
  'Nonfinite geometry coordinate');
 const buildingCrossings=fragment.building_footprints.flatMap(o=>
  crossingSegments(points,o.polygon,true).map(h=>({id:o.id,...h})));
 const buildingInterior=fragment.building_footprints.flatMap(o=>
  points.flatMap((p,i)=>polygonInside(p,o.polygon)?[{id:o.id,point:i}]:[]));
 const freight=fragment.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 assert(freight,'Freight-zone source missing');
 const freightCrossings=crossingSegments(points,freight.polygon,true);
 const freightInterior=points.flatMap((p,i)=>
  polygonInside(p,freight.polygon)?[i]:[]);
 const blocked=fragment.street_alignments.find(x=>x.id==='HC-A-OLDTRACE');
 assert(blocked?.mode==='blocked','Historic blocked-trace context missing');
 const traceCrossings=crossingSegments(points,blocked.points,false);
 const coastCrossings=crossingSegments(points,fragment.proposed_coast.shoreline,false);
 return copy({
  buildingCrossings,buildingInterior,freightCrossings,freightInterior,
  traceCrossings,coastCrossings,
  nearestCandidateBuildingDistance:Math.min(...fragment.building_footprints.map(o=>
   distanceFromRoute(points,o.polygon,true))),
  nearestBlockedTraceDistance:distanceFromRoute(points,blocked.points,false),
  nearestFreightZoneDistance:distanceFromRoute(points,freight.polygon,true),
  withinCoastFragmentSurvey:false,verifiedPassability:false
 });
}

function expectedCandidate(){
 const market=data.market44.nodes.map(n=>({id:n.id,xy:copy(n.xy)}));
 market.splice(market.length-1,0,{
  id:'MB-MH-REVIEW-BEND-20261122',xy:{x:69,y:37.6}});
 const plaza=data.plaza56.nodes.map(n=>({id:n.id,xy:copy(n.xy)}));
 plaza.find(n=>n.id==='MB-PH-N2').xy={x:68.3,y:38.1};
 return {market,plaza};
}

export function validateHarborAccessReconciliation({state,candidate=proposed}={}){
 assert(state?.world?.locations&&state?.player?.location_id,
  'Canonical world and player required for private geometric audit');
 validatePr67CoastCandidate({state});
 assert(candidate?.status==='review_only_not_admitted_to_saved_world'&&
  candidate.id==='MB-HARBOR-ACCESS-LOCAL-ALTERNATIVE-20261122'&&
  candidate.authority==='derived_from_historical_draft_geometry_not_a_new_location'&&
  candidate.schema_version===1,
  'Review-only candidate boundary was changed');
 for(const [key,entry] of Object.entries(candidate.historical_sources??{})){
  const expected=sources[({market_44:'market44',market_58:'market58',
   plaza_56:'plaza56',coast_pr67_variant:'coast'})[key]];
  assert(expected&&entry.archive==='docs/01_world/'+expected[0]&&
   entry.blob===expected[1],
   'Proposal source provenance mismatch: '+key);
 }
 assert(Object.keys(candidate.historical_sources).length===4,
  'Proposal source manifest incomplete');
 const {market,plaza}=expectedCandidate();
 assert(candidate.market_to_harbor.original_pr===44&&
  candidate.plaza_to_harbor.original_pr===56&&
  candidate.market_to_harbor.reviewed_only===true&&
  candidate.plaza_to_harbor.reviewed_only===true&&
  same(candidate.market_to_harbor.nodes,market)&&
  same(candidate.plaza_to_harbor.nodes,plaza),
  'Unreviewed waypoint insertion or relocation');
 assert(same(candidate.market_to_harbor.change,{
  kind:'insert_waypoint_before_saved_harbor_anchor',after_node:'MB-MH-N3',
  new_node_id:'MB-MH-REVIEW-BEND-20261122',xy:{x:69,y:37.6}})&&
  same(candidate.plaza_to_harbor.change,{
   kind:'relocate_intermediate_waypoint',node_id:'MB-PH-N2',
   from:{x:68.9,y:39.15},to:{x:68.3,y:38.1}}),
  'Local route changes not fully attributed');
 const tail=candidate.market_to_harbor.local_coast_tail_overlay;
 const historicalTail=data.coast.street_alignments.find(x=>x.id==='HC-A-MARKET');
 assert(tail?.id==='HC-A-MARKET'&&tail.changed_only_in_this_overlay===true&&
  same(tail.source_coast_pr67_tail,historicalTail.points)&&
  same(tail.points,market.slice(-2).map(x=>x.xy))&&
  candidate.plaza_to_harbor.local_coast_tail_inherited==='HC-A-PLAZA'&&
  same(data.coast.street_alignments.find(x=>x.id==='HC-A-PLAZA').points,
   plaza.slice(-2).map(x=>x.xy)),
  'Coast01 route tails fail to attach to reviewed variants');
 for(const [section,from,to,initial] of [
  ['market_to_harbor','LOC-COMMERCIAL-DISTRICT','LOC-HARBOR-WALK',cityStart],
  ['plaza_to_harbor','LOC-CROSSWATER-PLAZA','LOC-HARBOR-WALK',plazaStart]]){
  const x=candidate[section],vertices=path(x.nodes);
  assert(x.source_graph_link?.from===from&&x.source_graph_link.to===to&&
   x.source_graph_link.existing===true&&
   x.candidate_path_status==='geometry_proposed_not_verified_traversable'&&
   pointEquals(vertices[0],initial)&&pointEquals(vertices.at(-1),harbor)&&
   state.world.locations[from]?.connected_ids?.filter(id=>id===to).length===1&&
   state.world.locations[to]?.connected_ids?.filter(id=>id===from).length===1,
   'Saved graph relationship or existing location endpoints lost: '+section);
 }
 assert(candidate.retired_from_current_local_preference?.original_pr===58&&
  candidate.retired_from_current_local_preference.preview_only===true&&
  candidate.acceptance==='needs_cross_region_and_full_city_street_review_then_editorial_approval'&&
  Object.keys(candidate.limitations??{}).length===9&&
  Object.values(candidate.limitations).every(value=>value===true),
  'Draft incorrectly admitted or missing approval limitations');
 const old44=inspectRouteAgainstCoast(path(data.market44.nodes));
 const old58=inspectRouteAgainstCoast(path(data.market58.nodes));
 const old56=inspectRouteAgainstCoast(path(data.plaza56.nodes));
 assert(old44.traceCrossings.length===1&&old44.freightCrossings.length===0&&
  old58.traceCrossings.length===1&&old58.freightCrossings.length===2&&
  old58.freightInterior.length===1&&old56.buildingCrossings.length===2,
  'Historical baseline conflicts unexpectedly changed');
 const proposedPaths=[market,plaza].map(x=>path(x));
 for(const route of proposedPaths){
  const result=inspectRouteAgainstCoast(route);
  assert(result.buildingCrossings.length===0&&result.buildingInterior.length===0&&
   result.coastCrossings.length===0&&result.traceCrossings.length===0&&
   result.freightCrossings.length===0&&result.freightInterior.length===0&&
   result.nearestCandidateBuildingDistance>0.2&&
   result.nearestBlockedTraceDistance>0.18,
   'Proposed route still intersects or approaches a known draft obstruction');
 }
 assert(crossingSegments(proposedPaths[0],proposedPaths[1],false).length===0&&
  pointEquals(proposedPaths[0].at(-1),proposedPaths[1].at(-1)),
  'Two proposed routes have an unregistered strict crossing');
 const detachedCoast=copy(data.coast);
 detachedCoast.street_alignments.find(x=>x.id==='HC-A-MARKET').points=copy(tail.points);
 assert(coastalWaterConflicts(detachedCoast).length===0&&
  coastRoadBuildingConflicts(detachedCoast).length===0,
  'Local coast tail overlay breaks the safer PR67 geometry');
 return true;
}

export function inspectHarborAccessReconciliation({state}={}){
 validateHarborAccessReconciliation({state});
 const {market,plaza}=expectedCandidate();
 return copy({
  classification:'narrator_private_harbor_access_geometry_review',
  status:'unadmitted_alternative',
  studyScope:'Coast01 crossing checks only; out-of-region portions unverified',
  marketComparison:{
   historical44:inspectRouteAgainstCoast(path(data.market44.nodes)),
   historical58:inspectRouteAgainstCoast(path(data.market58.nodes)),
   reviewed44Detour:inspectRouteAgainstCoast(path(market)),
   preferredForLocalSketch:44,
   canonicalRouteSelected:false
  },
  plazaComparison:{
   historical56:inspectRouteAgainstCoast(path(data.plaza56.nodes)),
   reviewed56Detour:inspectRouteAgainstCoast(path(plaza)),
   canonicalRouteSelected:false
  },
  reviewedOverlayMarketTail:copy(proposed.market_to_harbor.local_coast_tail_overlay),
  savedGraphUnchanged:true,travelMinutes:null,certifiedAccess:false,
  newSavedEdges:[],playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  requiresFullCityReview:true
 });
}

// The diagram is source-backed, not an authority for player navigation.
const esc=value=>String(value).replaceAll('&','&amp;')
 .replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const number=x=>(Math.round((x+Number.EPSILON)*10)/10).toFixed(1);
const xy=p=>{
 assert(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&
  p.x>=58&&p.x<=77&&p.y>=32&&p.y<=43,
  'Overview point outside documented hypothetical canvas');
 return [80+(p.x-58)*60,96+(43-p.y)*60];
};
const points=path=>path.map(p=>xy(p).map(number).join(',')).join(' ');
const polygon=(id,p,fill,opacity)=>'<polygon points="'+points(p)+
 '" data-map-id="'+id+'" fill="'+fill+'" opacity="'+opacity+
 '" stroke="#666" stroke-width="1"/>';
const line=(id,p,stroke,dash,width)=>'<polyline points="'+points(p)+
 '" data-map-id="'+id+'" fill="none" stroke="'+stroke+
 '" stroke-width="'+width+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+
 ' stroke-linejoin="round" stroke-linecap="round"/>';
const label=(title,x,y,size=14)=>'<text x="'+number(x)+'" y="'+number(y)+
 '" font-size="'+size+'" fill="#243942">'+esc(title)+'</text>';

export function renderHarborAccessReconciliationSvg({state}={}){
 validateHarborAccessReconciliation({state});
 const coast=data.coast,{market,plaza}=expectedCandidate();
 const [marketSource,marketOther,plazaSource]=[
  data.market44,data.market58,data.plaza56].map(s=>path(s.nodes));
 const coastLine=coast.proposed_coast.shoreline;
 const water=[...coastLine,{x:77,y:42},{x:77,y:32}];
 const list=[
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="1570" height="900" viewBox="0 0 1570 900">',
  '<title>Meridian Bay: rutas candidatas a Harbor Walk (NO CANÓNICAS)</title>',
  '<desc>Comparación geométrica del borrador PR44/PR58/PR56 sobre Coast01 PR67; ninguna ruta física verificada ni habilitada en la partida.</desc>',
  '<rect width="1570" height="900" fill="#f7f5ef"/>',
  label('MERIDIAN BAY · HARBOR WALK · RECONCILIACIÓN LOCAL',80,42,23),
  label('Dibujo provisional; coordenadas ilustrativas sin escala real ni verificación de accesos',80,68,14),
  '<rect x="80" y="96" width="1140" height="660" fill="#ece8dd" stroke="#80989c" stroke-width="1.6"/>'
 ];
 for(let x=58;x<=77;x++)list.push('<line x1="'+number(xy({x,y:43})[0])+
  '" y1="96" x2="'+number(xy({x,y:43})[0])+
  '" y2="756" stroke="#c4c8c1" stroke-width=".6"/>');
 for(let y=32;y<=43;y++)list.push('<line x1="80" y1="'+number(xy({x:58,y})[1])+
  '" x2="1220" y2="'+number(xy({x:58,y})[1])+
  '" stroke="#c4c8c1" stroke-width=".6"/>');
 list.push(polygon('HC-WATER',water,'#b5d6df',1));
 list.push(polygon('HC-Z-FREIGHT',
  coast.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon,'#d6a9a2',0.55));
 for(const b of coast.building_footprints)
  list.push(polygon(b.id,b.polygon,'#938b82',0.85));
 list.push(line('HC-COAST',coastLine,'#276a8b','',3.5));
 list.push(line('HC-A-OLDTRACE',
  coast.street_alignments.find(x=>x.id==='HC-A-OLDTRACE').points,'#b55b48','4 7',3));
 list.push(line('SOURCE-PR44',marketSource,'#888','5 8',2.2));
 list.push(line('SOURCE-PR58',marketOther,'#98604e','4 8',2.2));
 list.push(line('SOURCE-PR56',plazaSource,'#8c8794','4 8',2.2));
 list.push(line('REVIEW-MARKET',path(market),'#217a69','',4.5));
 list.push(line('REVIEW-PLAZA',path(plaza),'#326d9b','',4.5));
 list.push(line('REVIEW-MARKET-TAIL',
  proposed.market_to_harbor.local_coast_tail_overlay.points,'#164e3f','2 4',2.3));
 for(const [title,p] of [
  ['Market Row · origen',marketSource[0]],
  ['Crosswater Plaza · origen',plazaSource[0]],
  ['Harbor Walk · destino existente',harbor]]){
  const dot=xy(p);list.push('<circle cx="'+number(dot[0])+'" cy="'+number(dot[1])+
  '" r="7" fill="#1a5472" stroke="white" stroke-width="2.5"/>');
  list.push(label(title,dot[0]+9,dot[1]-12,12));
 }
 list.push('<rect x="1240" y="100" width="305" height="625" rx="10" fill="#fffdf8" stroke="#bfc6c5"/>');
 const notes=[
  'SOLO BOCETO — SIN CANON',
  'Verde: PR44 con desvío',
  'Azul: PR56 con rodeo',
  'Gris: PR44/PR56 originales',
  'Marrón: PR58 alternativo',
  'Rojo: calle vieja bloqueada',
  'Rosa: zona portuaria candidata',
  'Gris oscuro: huellas provisionales',
  'Azul claro: agua hipotética',
  '',
  'Punto PR44 añadido:',
  '(69.0, 37.6)',
  'Punto PR56 revisado:',
  '(68.3, 38.1)',
  '',
  'No se crean enlaces ni calles',
  'utilizables en el juego.',
  'Sin distancias ni tiempos.',
  'Sin permisos de puerto.',
  'Tramos fuera de Coast01:',
  'NO VERIFICADOS.'
 ];
 let yy=143;
 for(const msg of notes){if(!msg){yy+=12;continue;}
  list.push(label(msg,1255,yy,msg.includes('BOCETO')?15:13));yy+=25;
 }
 list.push('<rect x="80" y="790" width="1465" height="68" rx="10" fill="#fffdf8" stroke="#c3c9c7"/>');
 list.push(label('Dibujo de coordinación de propuestas. No actualizar STATE.json, no afirmar pasabilidad, no narrar desplazamientos.',95,818,15));
 list.push(label('Fuentes conservadas: PR #44 / #58 / #56; Coast 01 PR #67 vía PR #89. Requiere revisión regional independiente.',95,843,13));
 list.push('<metadata id="harbor-routes-review" data-map-source="PR89" data-admitted="false" data-story-action="false"/>');
 list.push('</svg>');
 return list.join('\n')+'\n';
}
export function verifyHarborAccessReconciliationSvg({state}={}){
 const target=renderHarborAccessReconciliationSvg({state});
 assert(readFileSync(output,'utf8')===target,'Harbor route overlay SVG is out of sync');
 return true;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 assert(process.argv.length===3&&process.argv[2]==='--write',
  'Use: node tools/meridian_bay_harbor_access_reconciliation.mjs --write');
 const state=JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url)));
 writeFileSync(output,renderHarborAccessReconciliationSvg({state}),'utf8');
 verifyHarborAccessReconciliationSvg({state});
 console.log('PASS: source-backed noncanonical Harbor access diagram regenerated');
}
