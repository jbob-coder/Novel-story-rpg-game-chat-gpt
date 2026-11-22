// Section04 M1/P1: source-constrained frontage evidence and explicit unknowns.
// No plot, public easement, physical road, transit minute or narrative action is inferred.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {fileURLToPath} from 'node:url';
import {validateHarborSection04Study} from './meridian_harbor_section04_ledger.mjs';

const sources={
 state:['../game/STATE.json','3f4e9c98a7211068faefd31d0a0acbd4260ef589'],
 places:['../game/STARTING_LOCATIONS.md','0c1717e8f63d86e95e1aed431927f5a092c5b061'],
 story:['../chapters/CH-000.transcript.json','1350916ead7fb1f2f15fdd635dda42e69a0a3fed'],
 ledger:['../docs/01_world/MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json','a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b'],
 land03:['../docs/01_world/SOURCE_PR69_LAND_03_20261120.json','2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
 cityPlan:['../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json','2e8c5ff412436a6e7d526bc0172adfca77107263'],
 design:['../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json','014586f9c2996501f3bf16b9bfb8aebaf44fd462']
};
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const clone=x=>structuredClone(x);
const bHash=raw=>{
 const data=Buffer.from(raw);
 return createHash('sha1').update(Buffer.from('blob '+data.length+'\0'))
  .update(data).digest('hex');
};
const loaded={};
for(const [key,[file,sha]] of Object.entries(sources)){
 const raw=readFileSync(new URL(file,import.meta.url));
 check(bHash(raw)===sha,'Original evidence file changed: '+key);
 loaded[key]=file.endsWith('.json')?JSON.parse(raw.toString('utf8')):raw.toString('utf8');
}
const root=new URL('../docs/01_world/',import.meta.url);
const expectedFile=new URL('MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.json',root);
const imageFile=new URL('MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.svg',root);
const frozen=JSON.parse(readFileSync(expectedFile,'utf8'));

const eq=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const from=key=>loaded.ledger.sections.find(x=>x.id===key);
export function deriveSection04M1P1EntryEvidence({state}={}){
 check(state&&same(state,loaded.state),
  'Only exact canonical saved state can establish starting-place evidence');
 validateHarborSection04Study({state});
 const {places,story,ledger,land03,cityPlan,design}=loaded;
 const m=from('MB-04-M1'),p=from('MB-04-P1');
 const road=land03.street_alignments.find(x=>x.id==='MX-A-MARKET-PLAZA');
 const terminal=land03.street_alignments.find(x=>x.id==='MX-A-PLAZA-TERM');
 const market=state.world.locations['LOC-COMMERCIAL-DISTRICT'],
  plaza=state.world.locations['LOC-CROSSWATER-PLAZA'],
  harbor=state.world.locations['LOC-HARBOR-WALK'];
 check(m&&p&&market&&plaza&&harbor&&road&&terminal,
  'Source Section04 or canonical place/road context lost');
 check(eq(m.from,{x:58.869565,y:42})&&eq(m.to,{x:60,y:40.7})&&
  eq(p.from,{x:65,y:42})&&eq(p.to,{x:66.9,y:40.6}),
  'Section04 M1/P1 changed from source');
 check(eq(road.points[0],{x:58,y:43})&&eq(road.points.at(-1),{x:65,y:42})&&
  eq(terminal.points[0],{x:65,y:42})&&
  road.mode==='existing_topology_sketch'&&terminal.mode==='existing_topology_sketch',
  'Existing historical Market-Plaza or Plaza-Terminal drawing has changed');
 check(market.name==='Market Row'&&plaza.name==='Crosswater Transit Plaza'&&
  harbor.name==='Harbor Walk'&&plaza.public_area===true&&
  market.connected_ids.includes(harbor.id)&&plaza.connected_ids.includes(harbor.id)&&
  harbor.connected_ids.includes(market.id)&&harbor.connected_ids.includes(plaza.id),
  'Established saved-city identities or bidirectional adjacency changed');
 check(places.includes('## LOC-COMMERCIAL-DISTRICT — Market Row')&&
  places.includes('Small businesses, food vendors, offices and delivery traffic')&&
  places.includes('## LOC-CROSSWATER-PLAZA — Crosswater Transit Plaza')&&
  places.includes('harbor visible between buildings')&&
  places.includes('## LOC-HARBOR-WALK — Harbor Walk')&&
  places.includes('Public walkway toward the waterfront'),
  'Authoritative setting facts for public places changed');
 const narrated=story.entries.map(x=>x.text??'').join('\n');
 check(narrated.includes('Jack se aleja hacia Market Row')&&
  narrated.includes('Café Bruma')&&
  narrated.includes('resplandor del terminal'),
  'Played visibility and Market/Cafe narrative evidence changed');
 check(cityPlan.planning_envelope?.georeferenced===false&&
  cityPlan.planning_envelope?.cardinal_orientation_confirmed===false&&
  cityPlan.planning_envelope?.width_units===100&&
  cityPlan.planning_envelope?.height_units===80&&
  land03.study_box.y_min===42,
  'City planning coordinates are not certified or source Land03 extent changed');
 check(design.world_design_id==='MB-PREBUILT-20261112-V2'&&
  design.access_semantics?.includes('public_confirmed means an identifiable public-facing access path exists')&&
  design.places.filter(x=>x.parent_id===market.id).length===4,
  'Market public-frontage design differs from admitted-world source');
 const getBounds=section=>({
  x_min:Math.min(section.from.x,section.to.x),
  x_max:Math.max(section.from.x,section.to.x),
  y_min:Math.min(section.from.y,section.to.y),
  y_max:Math.max(section.from.y,section.to.y)
 });
 return clone({
  schema_version:1,id:'MB-SECTION04-M1P1-ENTRY-EVIDENCE-20261122',
  status:'source_evidence_and_unmapped_entry_search_only_not_physical_fragment',
  sourceGitBlobs:Object.fromEntries(Object.entries(sources).map(([k,[,sha]])=>[k,sha])),
  inheritedSectionLedgerId:ledger.id,
  illustrativeCoordinateFrame:{
   widthUnits:100,heightUnits:80,georeferenced:false,
   cardinalDirectionVerified:false,actualDistanceScale:null
  },
  historicalLand03Context:{
   sourceFragment:'SOURCE_PR69_LAND_03_20261120.json',
   studyBox:{
    x_min:land03.study_box.x_min,x_max:land03.study_box.x_max,
    y_min:land03.study_box.y_min,y_max:land03.study_box.y_max
   },
   existingTopologySketchId:road.id,
   existingTopologySketchPoints:clone(road.points),
   plazaTerminalSketchId:terminal.id,
   plazaTerminalSketchPoints:clone(terminal.points),
   roadsArePhysicalPassageProof:false
  },
  entries:[
   {
    sectionId:m.id,priority:'M1',sourceRoute:'market',
    savedPlaceId:market.id,savedPlaceName:market.name,
    priorSourceAnchor:{x:58,y:43},lineFrom:clone(m.from),lineTo:clone(m.to),
    studySearchBox:getBounds(m),
    searchBoxMeaning:'point_derived_search_extent_not_urban_parcel_or_public_road',
    evidence:{
     savedGraphHarborAdjacency:true,
     historicalRoadMarketPlazaStart:{x:58,y:43},
     sourceOldRoadPassabilityVerified:false,
     startingSetting:'small_shops_food_vendors_offices_delivery_traffic',
     chapterSceneMarketCafeArrivalEstablished:true,
     chapterSceneCafeTerminalGlowEstablished:true
    },
    unanswered:[
     'precise_public_market_row_egress','status_of_old_street_traces',
     'property_and_parcel_ownership','frontage_and_entrance_geometry',
     'pedestrian_clearance_and_crossings','urban_building_massing_and_terminal_glow'
    ],
    landUse:null,buildingFootprints:null,rightOfWay:null,
    accessGateCoordinatesVerified:false,canNavigate:false
   },
   {
    sectionId:p.id,priority:'P1',sourceRoute:'plaza',
    savedPlaceId:plaza.id,savedPlaceName:plaza.name,
    priorSourceAnchor:{x:65,y:42},lineFrom:clone(p.from),lineTo:clone(p.to),
    studySearchBox:getBounds(p),
    searchBoxMeaning:'point_derived_search_extent_not_urban_parcel_or_public_road',
    evidence:{
     savedGraphHarborAdjacency:true,
     plazaPublicArea:true,
     sourceLand03MarketPlazaStreetEndsAtAnchor:true,
     sourceLand03TerminalStreetStartsAtAnchor:true,
     sourcePedestrianHarborStreetExistsOnMap:false,
     startingSetting:'public_plaza_glass_terminal_harbor_visible_between_buildings'
    },
    unanswered:[
     'precise_public_plaza_harbor_exit','transit_vehicle_vs_pedestrian_crossing',
     'parcel_and_fence_boundary','frontage_buildings_and_heights',
     'legal_public_right_of_way','pedestrian_accessibility_and_visibility'
    ],
    landUse:null,buildingFootprints:null,rightOfWay:null,
    accessGateCoordinatesVerified:false,canNavigate:false
   }
  ],
  sharedFactBoundaries:{
   narrativeGraphAdjacencyDoesNotSurveyStreets:true,
   plazaPublicAreaDoesNotApproveSpecificWalkway:true,
   historicalMarketPlazaRouteDoesNotAuthoriseHarborBranch:true,
   cafeTerminalGlowRequiresFutureMassingReview:true,
   missingPhysicalStudyDoesNotMeanEmptyLand:true,
   noParticularBuildingsOrParcelsAssigned:true,
   notACertifiedPhysicalRoute:true,notASurveyOrRealWorldMap:true
  },
  limitations:{
   savedWorldChanged:false,storyTurnAdvanced:false,playerMoved:false,npcMoved:false,
   fictionalTimeAdvanced:false,newLocationLinks:[],realTravelMinutes:null,
   roadWidthMeters:null,buildingsMapped:false,
   publicEasementVerified:false,routeApproved:false
  },
  nextAction:'inspect_parcel_and_frontage_sources_for_M1_P1_before_creating_first_Section04_physical_zone'
 });
}
export function validateSection04M1P1EntryEvidence({state,review=frozen}={}){
 const expected=deriveSection04M1P1EntryEvidence({state});
 check(same(review,expected),
  'Section04 frontage study changed, invented structures or broke source facts');
 return true;
}
export function inspectSection04M1P1EntryEvidence({state}={}){
 validateSection04M1P1EntryEvidence({state});
 return clone(frozen);
}

const color={bg:'#f5f4ee',known:'#c0d3c7',coast:'#b8cedc',unknown:'#e7b6a3'};
const num=x=>Number(x).toFixed(2);
const P=p=>({x:80+(p.x-57.8)*82,y:100+(44.5-p.y)*125});
const attr=points=>points.map(p=>{const a=P(p);return num(a.x)+','+num(a.y)}).join(' ');
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(s,x,y,sz=14)=>'<text x="'+num(x)+'" y="'+num(y)+
 '" font-size="'+sz+'" fill="#263c43">'+xml(s)+'</text>';
const rectangle=(id,b,fill,opacity,dashed)=>{
 const a=P({x:b.x_min,y:b.y_max});
 return '<rect data-map-id="'+id+'" x="'+num(a.x)+'" y="'+num(a.y)+
 '" width="'+num((b.x_max-b.x_min)*82)+
 '" height="'+num((b.y_max-b.y_min)*125)+
 '" fill="'+fill+'" opacity="'+opacity+'" stroke="#567176" stroke-width="2"'+
 (dashed?' stroke-dasharray="6 5"':'')+'/>';
};
const polyline=(id,pts,stroke,width,dash)=>'<polyline data-map-id="'+id+
 '" points="'+attr(pts)+'" fill="none" stroke="'+stroke+
 '" stroke-width="'+width+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+
 ' stroke-linejoin="round" stroke-linecap="round"/>';
const polygon=(id,pts)=>'<polygon data-map-id="'+id+'" points="'+attr(pts)+
 '" fill="#888783" fill-opacity=".68" stroke="#575653" stroke-width="1"/>';

export function renderSection04M1P1EntrySvg({state}={}){
 const doc=inspectSection04M1P1EntryEvidence({state});
 const [m,p]=doc.entries,road=doc.historicalLand03Context.existingTopologySketchPoints;
 const screen=[
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="1540" height="880" viewBox="0 0 1540 880">',
  '<title>Meridian Bay: M1/P1 SOURCE FACTS, unmapped access points</title>',
  '<desc>Source-backed Market Row and Crosswater context. The line studies and their bounding rectangles are not surveyed streets, real buildings or approved passage.</desc>',
  '<rect width="1540" height="880" fill="'+color.bg+'"/>',
  text('SECTION 04 · M1 / P1 — GATES DE EVIDENCIA',80,42,24),
  text('NO CANÓNICO · continuidad narrativa confirmada, posición física del acceso desconocida',80,67,15),
  '<rect x="80" y="100" width="934.8" height="587.5" fill="#eceae3" stroke="#a5b2b0"/>',
  rectangle('LAND-03-STUDY-BOX-CROPPED',{
   x_min:doc.historicalLand03Context.studyBox.x_min,
   x_max:doc.historicalLand03Context.studyBox.x_max,y_min:42,y_max:44.5
  },color.known,0.56,false),
  rectangle('COAST01-ADJACENT-STUDY',{
   x_min:68,x_max:69.2,y_min:39.8,y_max:42
  },color.coast,0.5,true),
  rectangle('M1-SEARCH-NOT-SURVEY',m.studySearchBox,color.unknown,0.37,true),
  rectangle('P1-SEARCH-NOT-SURVEY',p.studySearchBox,color.unknown,0.37,true)
 ];
 // Land03 building shapes in this cropped neighborhood are *existing historical
 // candidates*, not added objects and not proof that blanks are empty parcels.
 for(const b of loaded.land03.building_footprints.filter(x=>
  x.polygon.every(pt=>pt.y>=42&&pt.y<=44.5)))
  screen.push(polygon(b.id,b.polygon));
 screen.push(polyline('MX-A-MARKET-PLAZA',road,'#6a7574',3.5,'4 6'));
 screen.push(polyline('MX-A-PLAZA-TERM',
  doc.historicalLand03Context.plazaTerminalSketchPoints,'#6a7574',2,'4 6'));
 screen.push(polyline('M1-SOURCE-APPROACH',[
  m.priorSourceAnchor,m.lineFrom],'#73716d',2.5,'3 5'));
 screen.push(polyline('MB-04-M1',[m.lineFrom,m.lineTo],'#b55b49',4,'7 7'));
 screen.push(polyline('MB-04-P1',[p.lineFrom,p.lineTo],'#b55b49',4,'7 7'));
 for(const [id,point,label] of [
  ['MARKET-LOCATION-ANCHOR',m.priorSourceAnchor,'MARKET ROW · fuente de dibujo'],
  ['M1-LAND03-EXIT',m.lineFrom,'M1 sale de LAND03: no calle verificada'],
  ['PLAZA-LOCATION-ANCHOR',p.priorSourceAnchor,'CROSSWATER · plaza pública'],
  ['P1-END-UNKNOWN',p.lineTo,'P1 desconocido']]){
  const c=P(point);
  screen.push('<circle data-map-id="'+id+'" cx="'+num(c.x)+
   '" cy="'+num(c.y)+'" r="5" fill="#34596c" stroke="#fff" stroke-width="2"/>');
  screen.push(text(label,c.x+8,c.y-11,11));
 }
 screen.push('<rect x="1043" y="100" width="462" height="625" rx="9" fill="#fffefa" stroke="#b9c6c2"/>');
 let y=143;
 for(const label of [
  'HECHOS DE FUENTE:',
  'Market Row ↔ Harbor Walk: enlace guardado',
  'Crosswater ↔ Harbor Walk: enlace guardado',
  'Crosswater es plaza pública.',
  'Market-Plaza: solo trazado histórico.',
  'Desde Café Bruma: brillo del terminal.',
  '',
  'NO SE HA ESTABLECIDO:',
  'Entrada pública exacta desde Market Row.',
  'Salida hacia puerto desde la plaza.',
  'Parcelas, edificios de sección 04.',
  'Límites de propiedad / servidumbres.',
  'Ancho de acera, paso o tráfico.',
  'Altura de edificios y visual al terminal.',
  '',
  'ZONAS ROJIZAS: CAJAS DE BÚSQUEDA',
  'Líneas rojas: accesos por investigar.',
  'LAND03: plano histórico no admitido.',
  'Gris oscuro: edificios candidatos LAND03.',
  '',
  'No es ruta jugable ni plano catastral.'
 ]){if(!label){y+=14;continue;}screen.push(text(label,1057,y,13));y+=27;}
 screen.push('<rect x="80" y="760" width="1425" height="79" rx="10" fill="#fffcf5" stroke="#b7c3c1"/>');
 screen.push(text('PRIORIDAD: M1/P1 requieren evidencia real de fachadas, parcelas y paso público ANTES de crear un fragmento 04 físico.',96,790,16));
 screen.push(text('Las coordenadas son referencias ilustrativas; el hueco del dibujo no representa terreno vacío ni seguridad de circulación.',96,820,14));
 screen.push('<metadata id="section04-frontage-evidence" data-admitted="false" data-access-approved="false" data-story-action="false"/>');
 screen.push('</svg>');
 return screen.join('\n')+'\n';
}
export function verifySection04M1P1EntrySvg({state}={}){
 const svg=renderSection04M1P1EntrySvg({state});
 check(readFileSync(imageFile,'utf8')===svg,
  'Section04 M1/P1 diagram is out of sync with source facts');
 return true;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 check(process.argv.length===3&&process.argv[2]==='--write',
  'Use node tools/meridian_section04_m1p1_entry_evidence.mjs --write');
 writeFileSync(imageFile,renderSection04M1P1EntrySvg({state:loaded.state}),'utf8');
 verifySection04M1P1EntrySvg({state:loaded.state});
 console.log('PASS M1/P1 source-provenance diagram; no maps or narrative admitted');
}
