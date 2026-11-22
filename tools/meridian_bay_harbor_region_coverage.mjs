// Audits *spatial source coverage* only: study boxes are NOT survey certificates.
// Source snapshots are pinned by Git blob identity. Never writes game, journal or chapters.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateHarborAccessReconciliation} from './meridian_bay_harbor_access_reconciliation.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const SOURCE={
 routes:['MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json','aae66aae315603e37e8cb88034600446bf46d21d'],
 coast01:['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json','139c3687c98285aff886d28422544d082768217d'],
 coast02:['SOURCE_PR67_COAST_02_20261120.json','325a0acde67a1ce3b44576860824657a3db41695'],
 land03:['SOURCE_PR69_LAND_03_20261120.json','2a95eb9e50f69436cb65711daf8ff586f4ef4279']
};
const OUT=new URL('MERIDIAN_BAY_HARBOR_REGIONAL_COVERAGE_20261122.svg',root);
const check=(ok,message)=>{if(!ok)throw Error(message);};
const rawHash=bytes=>{
 const b=Buffer.from(bytes);
 return createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
};
const refs={};
for(const [id,[name,expected]] of Object.entries(SOURCE)){
 const bytes=readFileSync(new URL(name,root));
 check(rawHash(bytes)===expected,'Immutable map-source Git blob changed: '+id);
 refs[id]=JSON.parse(bytes.toString('utf8'));
}
const clone=value=>structuredClone(value);
const EPS=1e-9;
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const near=(a,b)=>Math.abs(a-b)<EPS;
const eq=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const pointAt=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const hypot=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const round6=x=>Math.round(x*1e6)/1e6;
const boxValid=b=>b&&[b.x_min,b.x_max,b.y_min,b.y_max].every(Number.isFinite)&&
 b.x_min<b.x_max&&b.y_min<b.y_max;

export function clipSegmentToStudyBox(a,b,box){
 check(finite(a)&&finite(b)&&boxValid(box),'Finite endpoints and valid study rectangle required');
 if(hypot(a,b)<=EPS)return null; // touching at one point is not spatial coverage
 let start=0,end=1,dx=b.x-a.x,dy=b.y-a.y;
 for(const [p,q] of [[-dx,a.x-box.x_min],[dx,box.x_max-a.x],
  [-dy,a.y-box.y_min],[dy,box.y_max-a.y]]){
  if(Math.abs(p)<EPS){if(q<0)return null;continue;}
  const t=q/p;
  if(p<0)start=Math.max(start,t);else end=Math.min(end,t);
  if(end<start-EPS)return null;
 }
 return end-start>EPS?[Math.max(0,start),Math.min(1,end)]:null;
}

const defaultRegions=[
 {id:'LAND-03',status:'historical_unadmitted_urban_fragment',data:refs.land03},
 {id:'COAST-02',status:'historical_unadmitted_coast_fragment',data:refs.coast02},
 {id:'COAST-01',status:'pr67_based_unadmitted_coast_fragment',data:refs.coast01}
];
function checkedRegions(regions){
 check(Array.isArray(regions)&&regions.length>0,'At least one study region required');
 const seen=new Set();
 return regions.map(region=>{
  check(typeof region.id==='string'&&region.id.length>0&&!seen.has(region.id)&&
   boxValid(region.data?.study_box),'Duplicate or invalid region study box');
  seen.add(region.id);
  return region;
 });
}

export function measurePhysicalDraftCoverage(points,regions=defaultRegions){
 check(Array.isArray(points)&&points.length>=2&&points.every(finite),
  'At least two finite path nodes are required');
 const valid=checkedRegions(regions);
 const coverageByRegion=Object.fromEntries(valid.map(x=>[x.id,0]));
 let total=0,notCovered=0;
 const sections=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],length=hypot(a,b);
  check(length>EPS,'Zero-length segment cannot prove physical-route coverage');
  total+=length;
  const overlaps=valid.flatMap(region=>{
   const clip=clipSegmentToStudyBox(a,b,region.data.study_box);
   return clip?[{regionId:region.id,start:clip[0],end:clip[1]}]:[];
  });
  const cuts=[0,1,...overlaps.flatMap(x=>[x.start,x.end])]
   .sort((a,b)=>a-b).filter((v,j,arr)=>j===0||v-arr[j-1]>EPS);
  for(let j=0;j<cuts.length-1;j++){
   const start=cuts[j],end=cuts[j+1];if(end-start<=EPS)continue;
   const regionIds=overlaps.filter(item=>
    item.start<=(start+end)/2+EPS&&item.end>=(start+end)/2-EPS)
    .map(item=>item.regionId);
   const clippedLength=length*(end-start);
   const x={
    segmentIndex:i,
    tStart:round6(start),tEnd:round6(end),
    from:pointAt(a,b,start),to:pointAt(a,b,end),
    regionIds,
    classification:regionIds.length?'within_unadmitted_study_box':'no_physical_fragment_coverage',
    hypotheticalLengthUnits:round6(clippedLength)
   };
   sections.push(x);
   if(!regionIds.length)notCovered+=clippedLength;
   else for(const id of regionIds)coverageByRegion[id]+=clippedLength;
  }
 }
 const measured=total-notCovered;
 check(total>0&&measured>=-EPS&&measured<=total+EPS,
  'Physical draft coverage arithmetic invalid');
 return clone({
  hypotheticalLengthUnits:round6(total),
  coveredByAtLeastOneStudyBoxUnits:round6(measured),
  outsideKnownStudyBoxesUnits:round6(notCovered),
  outsideKnownStudyBoxesFraction:round6(notCovered/total),
  studiedRegionUnits:Object.fromEntries(Object.entries(coverageByRegion).map(([k,v])=>[k,round6(v)])),
  sections,
  allRouteGeometryStudied:notCovered<=EPS,
  passabilityCertified:false,
  locationGraphChanged:false
 });
}

const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-EPS&&
 orient(c,d,a)*orient(c,d,b)<-EPS;
const onSegment=(a,b,p)=>Math.abs(orient(a,b,p))<=EPS&&
 p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&
 p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
const contains=(p,poly)=>{
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(onSegment(a,b,p))return true; // boundary touching remains unresolved
  if((a.y>p.y)!==(b.y>p.y)&&
   p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
};
const segmentContacts=(a,b,c,d)=>crosses(a,b,c,d)||
 onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b);
function clippedBuildingContacts(a,b,poly){
 if(contains(a,poly)||contains(b,poly))return true;
 return poly.some((p,i)=>segmentContacts(a,b,p,poly[(i+1)%poly.length]));
}
function clippedTraceContacts(a,b,line){
 for(let i=0;i<line.length-1;i++)if(segmentContacts(a,b,line[i],line[i+1]))return true;
 return false;
}
export function inspectStudiedRegionContacts(points,regions=defaultRegions){
 const coverage=measurePhysicalDraftCoverage(points,regions),byId=new Map(checkedRegions(regions).map(x=>[x.id,x]));
 const collisions=[];
 for(const section of coverage.sections){
  const a=section.from,b=section.to;
  for(const id of section.regionIds){
   const source=byId.get(id)?.data;
   for(const shape of source.building_footprints??[]){
    if(clippedBuildingContacts(a,b,shape.polygon))
     collisions.push({studyRegion:id,segmentIndex:section.segmentIndex,
      shapeId:shape.id,kind:'candidate_building_contact'});
   }
   for(const line of source.street_alignments??[]){
    if(/blocked|trace/i.test(line.mode)&&clippedTraceContacts(a,b,line.points))
     collisions.push({studyRegion:id,segmentIndex:section.segmentIndex,
      shapeId:line.id,kind:'candidate_historical_blocked_trace_contact'});
   }
   if(source.proposed_coast?.shoreline&&
    clippedTraceContacts(a,b,source.proposed_coast.shoreline))
    collisions.push({studyRegion:id,segmentIndex:section.segmentIndex,
     shapeId:id+'-SHORELINE',kind:'draft_shoreline_contact'});
  }
 }
 return clone({collisions,
  positivelyCoveredSegmentIndices:[...new Set(coverage.sections
   .filter(s=>s.regionIds.length).map(s=>s.segmentIndex))],
  uncheckedGeometrySections:coverage.sections.filter(x=>!x.regionIds.length),
  noCertificateBeyondStudyBoxes:coverage.outsideKnownStudyBoxesUnits>0
 });
}
const routeNodes=key=>refs.routes[key].nodes.map(x=>x.xy);

export function validateHarborRegionalCoverage({state}={}){
 check(state?.world?.locations&&state?.player?.location_id,
  'Canonical saved world required for coverage audit');
 validateHarborAccessReconciliation({state});
 check(refs.land03.region_type==='land_only_no_water_or_new_shoreline'&&
  refs.coast02.proposed_coast?.shoreline?.length===22&&
  refs.coast01.proposed_coast?.shoreline?.length===16,
  'Unexpected historical fragment schema or shoreline');
 check(eq(refs.coast01.proposed_coast.shoreline.at(-1),
  refs.coast02.proposed_coast.shoreline[0]),
  'Coast01/Coast02 shared source seam changed');
 const market=routeNodes('market_to_harbor'),plaza=routeNodes('plaza_to_harbor');
 check(eq(market[0],{x:58,y:43})&&eq(plaza[0],{x:65,y:42})&&
  eq(market.at(-1),{x:71,y:37})&&eq(plaza.at(-1),{x:71,y:37}),
  'Known route anchors moved without approval');
 const a=measurePhysicalDraftCoverage(market),b=measurePhysicalDraftCoverage(plaza);
 check(a.outsideKnownStudyBoxesUnits>10&&
  b.outsideKnownStudyBoxesUnits>4&&
  a.studiedRegionUnits['COAST-02']===0&&
  b.studiedRegionUnits['COAST-02']===0&&
  b.studiedRegionUnits['LAND-03']===0,
  'Previously unmapped route segments were silently promoted');
 check(inspectStudiedRegionContacts(market).collisions.length===0&&
  inspectStudiedRegionContacts(plaza).collisions.length===0,
  'Draft route contacts a known candidate footprint, block or shoreline');
 check(refs.routes.acceptance==='needs_cross_region_and_full_city_street_review_then_editorial_approval',
  'Corridor acceptance gate changed');
 return true;
}

export function inspectHarborRegionalCoverage({state}={}){
 validateHarborRegionalCoverage({state});
 const market=measurePhysicalDraftCoverage(routeNodes('market_to_harbor'));
 const plaza=measurePhysicalDraftCoverage(routeNodes('plaza_to_harbor'));
 return clone({
  classification:'narrator_private_regional_spatial_coverage_audit',
  mapStudyNotSurvey:true,
  sourceBlobIDs:Object.fromEntries(Object.entries(SOURCE).map(([key,value])=>[key,value[1]])),
  studyBoxes:defaultRegions.map(x=>({region:x.id,status:x.status,box:x.data.study_box})),
  market,plaza,
  marketContacts:inspectStudiedRegionContacts(routeNodes('market_to_harbor')),
  plazaContacts:inspectStudiedRegionContacts(routeNodes('plaza_to_harbor')),
  verdict:'INCOMPLETE_PHYSICAL_REGION_COVERAGE',
  nextRequiredArea:'unmapped_central_west_harbor_approach_below_y42_before_x68',
  newCanonicalGraphEdges:[],certifiedRoads:[],
  travelMinutes:null,surveyedDistanceKm:null,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false
 });
}

// Deterministic schematic: all depicted features derive from the saved pinned
// source route JSON and region rectangles; no guessed buildings fill the gap.
const str=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;');
const num=x=>Number(x).toFixed(2);
const XY=p=>({x:100+(p.x-58)*42,y:120+(51-p.y)*42});
const coords=items=>items.map(p=>{const q=XY(p);return num(q.x)+','+num(q.y)}).join(' ');
const rect=(b,id,fill)=>'<rect data-map-id="'+id+'" x="'+num(XY({x:b.x_min,y:b.y_max}).x)+
 '" y="'+num(XY({x:b.x_min,y:b.y_max}).y)+'" width="'+num((b.x_max-b.x_min)*42)+
 '" height="'+num((b.y_max-b.y_min)*42)+'" fill="'+fill+
 '" opacity=".55" stroke="#607782" stroke-dasharray="5 4" stroke-width="1.5"/>';
const line=(id,pts,color,dash)=>'<polyline data-map-id="'+id+
 '" points="'+coords(pts)+'" stroke="'+color+'" stroke-width="4"'+
 (dash?' stroke-dasharray="'+dash+'"':'')+
 ' stroke-linejoin="round" stroke-linecap="round" fill="none"/>';
const lbl=(value,x,y,size=14)=>'<text x="'+x+'" y="'+y+
 '" font-size="'+size+'" fill="#243b47">'+str(value)+'</text>';
export function renderHarborRegionalCoverageSvg({state}={}){
 const report=inspectHarborRegionalCoverage({state});
 const result=[
 '<?xml version="1.0" encoding="UTF-8"?>',
 '<svg xmlns="http://www.w3.org/2000/svg" width="1490" height="1040" viewBox="0 0 1490 1040">',
 '<title>Meridian Bay: cobertura física DOCUMENTADA e INCOMPLETA de rutas a Harbor Walk</title>',
 '<desc>Contorno de fragmentos históricos y rutas propuestas. Los tramos sin cobertura NO tienen edificios ni seguridad verificada. Borrador no canónico.</desc>',
 '<rect width="1490" height="1040" fill="#f6f4ee"/>',
 lbl('MERIDIAN BAY — AUDITORÍA DE COBERTURA REGIONAL',100,45,24),
 lbl('Solo cajas de estudio, NO costa medida, NO seguridad de paso, NO rutas jugables.',100,70,15),
 '<rect x="100" y="120" width="1008" height="798" fill="#ece9df" stroke="#9faaa6" stroke-width="1.5"/>'
 ];
 const colors={'LAND-03':'#c7d7b7','COAST-02':'#b4d5dc','COAST-01':'#c6c4e0'};
 for(const region of report.studyBoxes)result.push(rect(region.box,region.region,colors[region.region]));
 for(const [key,route] of [['MARKET',report.market],['PLAZA',report.plaza]]){
  for(const s of route.sections){
   const gap=!s.regionIds.length;
   result.push(line(key+'-SEG'+s.segmentIndex+'-T'+s.tStart+'-'+s.tEnd,
    [s.from,s.to],gap?'#b65e4c':key==='MARKET'?'#277660':'#276fa0',
    gap?'7 7':null));
  }
 }
 for(const [title,p] of [
  ['MARKET ROW',{x:58,y:43}],['CROSSWATER',{x:65,y:42}],
  ['HARBOR WALK',{x:71,y:37}]]){
  const q=XY(p);result.push('<circle cx="'+num(q.x)+'" cy="'+num(q.y)+
   '" r="5" fill="#1c5871" stroke="white" stroke-width="2"/>');
  result.push(lbl(title,q.x+7,q.y-8,11));
 }
 result.push('<rect x="1126" y="120" width="342" height="755" rx="9" fill="#fffdf8" stroke="#bec6c1"/>');
 const notes=[
  'ZONAS CON BOCETO PREVIO:',
  'LAND-03: área urbana interior',
  'COAST-02: continuación costera',
  'COAST-01: Harbor Walk',
  '',
  'LÍNEAS VERDES/AZULES:',
  'Segmento dentro de alguna caja',
  'de estudio, NO pasabilidad.',
  '',
  'LÍNEAS ROJAS DISCONTINUAS:',
  'SIN plano físico conocido.',
  'No inventar edificios o calles.',
  '',
  'MARKET ROW:',
  round6(report.market.outsideKnownStudyBoxesFraction*100)+'% sin cobertura de boceto',
  'CROSSWATER:',
  round6(report.plaza.outsideKnownStudyBoxesFraction*100)+'% sin cobertura de boceto',
  '',
  'Sin rutas físicas aprobadas.',
  'Sin distancias reales o tiempos.',
  'Sin acciones de Jack o NPC.'
 ];
 let y=160;
 for(const note of notes){if(!note){y+=11;continue;}result.push(lbl(note,1143,y,13));y+=30;}
 result.push('<rect x="100" y="948" width="1368" height="64" rx="10" fill="#fffdf7" stroke="#c7ccca"/>');
 result.push(lbl('PENDIENTE: cartografiar área entre x menor que 68 e y menor que 42. Validar edificaciones, acceso y continuidad.',114,974,14));
 result.push(lbl('Cuadrícula ficticia 100×80 sin norte ni escala terrestre. No admite rutas o escenas a STATE.',114,997,13));
 result.push('<metadata id="regional-coverage" data-source="PR103" data-admitted="false" data-story-action="false"/>');
 result.push('</svg>');
 return result.join('\n')+'\n';
}
export function verifyHarborRegionalCoverageSvg({state}={}){
 const rendered=renderHarborRegionalCoverageSvg({state});
 check(readFileSync(OUT,'utf8')===rendered,'Coverage SVG has diverged from source geometry');
 return true;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 check(process.argv.length===3&&process.argv[2]==='--write',
  'Use node tools/meridian_bay_harbor_region_coverage.mjs --write');
 const state=JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url),'utf8'));
 writeFileSync(OUT,renderHarborRegionalCoverageSvg({state}),'utf8');
 verifyHarborRegionalCoverageSvg({state});
 console.log('PASS: regional source coverage diagram generated; no canon admission');
}
