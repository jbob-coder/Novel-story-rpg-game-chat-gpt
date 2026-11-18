// Authored urban-region fragment; source geometry is JSON, SVG is derived.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export function auditLandRegion(f,adjacent,city,web,term){
 const errs=[],b=f.study_box,EPS=1e-8;
 const eq=(a,c)=>a?.x===c?.x&&a?.y===c?.y;
 const orient=(a,c,d)=>(c.x-a.x)*(d.y-a.y)-(c.y-a.y)*(d.x-a.x);
 const cross=(a,c,d,e)=>orient(a,c,d)*orient(a,c,e)<-EPS&&orient(d,e,a)*orient(d,e,c)<-EPS;
 const inside=(q,poly)=>{let ok=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],c=poly[j];if((a.y>q.y)!=(c.y>q.y)&&q.x<(c.x-a.x)*(q.y-a.y)/(c.y-a.y)+a.x)ok=!ok}return ok};
 if(f.region_type!=="land_only_no_water_or_new_shoreline"||f.proposed_coast||f.status!=="editable_fragment_not_saved_canon")errs.push("No verified inland-only draft status");
 const ids=new Set();for(const obj of [...f.land_use_patches.map(v=>({v,points:v.polygon,closed:true})),...f.building_footprints.map(v=>({v,points:v.polygon,closed:true})),...f.street_alignments.map(v=>({v,points:v.points,closed:false}))]){const {v,points,closed}=obj;if(ids.has(v.id))errs.push("Duplicate "+v.id);ids.add(v.id);if(!Array.isArray(points)||points.length<(closed?3:2)){errs.push("Insufficient geometry "+v.id);continue}for(const q of points)if(!Number.isFinite(q.x)||!Number.isFinite(q.y)||q.x<b.x_min-EPS||q.x>b.x_max+EPS||q.y<b.y_min-EPS||q.y>b.y_max+EPS)errs.push("Out of bounds "+v.id);if(closed){const area=Math.abs(points.reduce((s,q,i)=>s+q.x*points[(i+1)%points.length].y-q.y*points[(i+1)%points.length].x,0))/2;if(area<0.003)errs.push("Degenerate "+v.id);for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){if(i===0&&j===points.length-1)continue;if(cross(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))errs.push("Self intersection "+v.id)}}if(v.registered_as_new_story_link!==undefined&&v.registered_as_new_story_link!==false)errs.push("Invented playable link "+v.id);if(v.traversable_in_saved_story===true)errs.push("Sketch geometry must not become a certified street route "+v.id)}
 for(let i=0;i<f.building_footprints.length;i++)for(let j=i+1;j<f.building_footprints.length;j++){const a=f.building_footprints[i],c=f.building_footprints[j],pa=a.polygon,pc=c.polygon;let hit=inside(pa[0],pc)||inside(pc[0],pa);for(let k=0;k<pa.length;k++)for(let l=0;l<pc.length;l++)if(cross(pa[k],pa[(k+1)%pa.length],pc[l],pc[(l+1)%pc.length]))hit=true;if(hit)errs.push("Footprints intersect "+a.id+" / "+c.id)}
 for(const rd of f.street_alignments){if(rd.mode.includes("blocked"))continue;for(const building of f.building_footprints){if(rd.points.some(q=>inside(q,building.polygon)))errs.push("Road in building "+rd.id+" / "+building.id);for(let k=0;k<rd.points.length-1;k++)for(let l=0;l<building.polygon.length;l++)if(cross(rd.points[k],rd.points[k+1],building.polygon[l],building.polygon[(l+1)%building.polygon.length]))errs.push("Road crosses building "+rd.id+" / "+building.id)}}
 const anchors=new Map(city.locations.map(x=>[x.id,x.reference_xy_units]));for(const a of f.source_existing_places)if(!eq(a.xy,anchors.get(a.id)))errs.push("Existing story anchor relocated "+a.id);
 const mk=f.street_alignments.find(x=>x.id==="MX-A-MARKET-PLAZA"),pt=f.street_alignments.find(x=>x.id==="MX-A-PLAZA-TERM"),parent=web.segments.find(x=>x.id==="MB-WEB-007");
 if(!mk||!parent||JSON.stringify(mk.points)!==JSON.stringify([anchors.get("LOC-COMMERCIAL-DISTRICT"),...parent.via_xy_units,anchors.get("LOC-CROSSWATER-PLAZA")]))errs.push("Market to Crosswater route no longer matches already-authored segment");
 if(!pt||JSON.stringify(pt.points)!==JSON.stringify(term.nodes.map(x=>x.xy)))errs.push("Crosswater to terminal approach changed");
 for(const [roadId,sourceId,seamId] of [["MX-A-OLD-SEAM","HN-A-OLD","MX-EAST-OLD"],["MX-A-LATER-BYPASS","HN-A-NEW","MX-EAST-BYPASS"]]){const end=f.street_alignments.find(x=>x.id===roadId)?.points.at(-1),start=adjacent.street_alignments.find(x=>x.id===sourceId)?.points[0],join=f.boundary_interfaces.find(x=>x.id===seamId);if(!eq(end,start)||!eq(join?.point,start)||join?.transport_status!=="candidate_not_saved_route")errs.push("Inland/coastal seam mismatch "+roadId)}
 const rule=f.preservation_rules;if(!rule||Object.values(rule).some(x=>x!==true))errs.push("Missing prohibition on live world/story changes");
 return [...new Set(errs)];
}
export function renderLandRegionSvg(f){
 const esc=x=>String(x).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");const b=f.study_box,k=70,ox=119,oy=108,w=(b.x_max-b.x_min)*k,h=(b.y_max-b.y_min)*k;
 const F=x=>Number(x).toFixed(1),xy=q=>({x:ox+(q.x-b.x_min)*k,y:oy+(b.y_max-q.y)*k}),pt=q=>{const a=xy(q);return F(a.x)+","+F(a.y)},poly=(a,opt)=>`<polygon points="${a.map(pt).join(" ")}" ${opt}/>`,line=(a,opt)=>`<polyline points="${a.map(pt).join(" ")}" ${opt}/>`,label=(text,x,y,cls="txt",anchor="middle")=>`<text class="${cls}" text-anchor="${anchor}" x="${F(x)}" y="${F(y)}">${esc(text)}</text>`;
 const l=['<?xml version="1.0" encoding="UTF-8"?>','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1450 990" width="1450" height="990">',
 '<title>Meridian Bay · fragmento de tierra 03</title><desc>Mapa editable Market Row–Crosswater y costuras con región costera</desc>',
 '<style>text{font-family:Arial,Helvetica,sans-serif}.title{font-size:27px;font-weight:700;fill:#263e44}.sub{font-size:14px;fill:#526a70}.grid{font-family:monospace;font-size:12px;fill:#74817f}.ptlabel{font-size:12px;font-weight:700;fill:#1d4d64;paint-order:stroke;stroke:#fafaf3;stroke-width:3px}.tiny{font-family:monospace;font-size:10px;fill:#384e52}.sect{font-size:15px;font-weight:700;fill:#314951}.desc{font-size:12px;fill:#465b61}</style>',
 '<rect width="1450" height="990" fill="#f7f6f0"/>',
 label('MERIDIAN BAY — FRAGMENTO TERRESTRE 03',ox,41,'title','start'),
 label('Market Row → Crosswater: crecimiento irregular y empalmes con la bahía',ox,65,'sub','start'),
 `<rect x="${ox}" y="${oy}" width="${F(w)}" height="${F(h)}" fill="#e9e5d9" stroke="#889d9a" stroke-width="2"/>`];
 for(let x=Math.ceil(b.x_min);x<=b.x_max;x++){const q=xy({x,y:b.y_min});l.push(`<line x1="${F(q.x)}" x2="${F(q.x)}" y1="${oy}" y2="${F(oy+h)}" stroke="#b8c1bb" stroke-width=".7" opacity=".6"/>`,label(x,q.x,oy+h+19,'grid'))}
 for(let y=Math.ceil(b.y_min);y<=b.y_max;y++){const q=xy({x:b.x_min,y});l.push(`<line x1="${ox}" x2="${F(ox+w)}" y1="${F(q.y)}" y2="${F(q.y)}" stroke="#b8c1bb" stroke-width=".7" opacity=".6"/>`,label(y,ox-16,q.y+3,'grid'))}
 const fills=['#d6c0a2','#bdb5a7','#cec4b0','#b6c5b9','#c4bea8','#cdcbbd'];for(let i=0;i<f.land_use_patches.length;i++){const z=f.land_use_patches[i];l.push(poly(z.polygon,`fill="${fills[i%fills.length]}" opacity=".86" stroke="#8e887b" stroke-width="1.3" stroke-dasharray="4 4"`))}
 for(const r of f.street_alignments){const style=r.source==='existing_topology_provisional_geometry'?'stroke="#276886" stroke-width="5.3"':/blocked/.test(r.mode)?'stroke="#aa5b4a" stroke-width="4" stroke-dasharray="3 6"':/service|restricted/.test(r.mode)?'stroke="#806d58" stroke-width="4" stroke-dasharray="8 6"':'stroke="#6b706a" stroke-width="4.2" stroke-dasharray="9 6"';l.push(line(r.points,`fill="none" ${style} stroke-linecap="round" stroke-linejoin="round"`))}
 for(const building of f.building_footprints){l.push(poly(building.polygon,'fill="#a09281" opacity=".98" stroke="#455352" stroke-width="1.8"'));const c={x:building.polygon.reduce((z,q)=>z+q.x,0)/building.polygon.length,y:building.polygon.reduce((z,q)=>z+q.y,0)/building.polygon.length},q=xy(c);l.push(label(building.id.split('-').at(-1),q.x,q.y+3,'tiny'))}
 for(const a of f.source_existing_places){const q=xy(a.xy);l.push(`<circle cx="${F(q.x)}" cy="${F(q.y)}" r="8" fill="#246686" stroke="#fff" stroke-width="2.5"/>`);let txt=a.id==='LOC-COMMERCIAL-DISTRICT'?'Market Row':a.id==='LOC-CROSSWATER-PLAZA'?'Crosswater Plaza':'Terminal';l.push(label(txt,q.x+(a.id==='LOC-COMMERCIAL-DISTRICT'?12:0),q.y-15,'ptlabel',a.id==='LOC-COMMERCIAL-DISTRICT'?'start':'middle'))}
 for(const s of f.boundary_interfaces){const q=xy(s.point);l.push(`<circle cx="${F(q.x)}" cy="${F(q.y)}" r="7" fill="#f7f6f0" stroke="#4c7456" stroke-width="3"/>`);l.push(label('EMPALME',q.x-10,q.y-12,'tiny','end'))}
 const sx=ox+w+30,panel=['FRAGMENTO 03','SIN COSTA NUEVA',`${f.land_use_patches.length} zonas físicas`,`${f.building_footprints.length} edificios candidatos`,`${f.street_alignments.length} trazas de calle`,'','ANCLAJES EXISTENTES','Market Row · (58,43)','Crosswater · (65,42)','Terminal · (66,42)','','EMPALME A COSTA','Calle vieja (68.1,43.8)','Avenida (68.2,46.65)','','VERIFICAR','Sin nuevos accesos','Sin tráfico simulado','Sin partida modificada'];let yy=117;for(const text of panel){if(!text){yy+=13;continue}l.push(`<text x="${F(sx)}" y="${F(yy)}" font-size="${/^(FRAGMENTO|SIN COSTA|ANCLAJES|EMPALME|VERIFICAR)/.test(text)?16:13}" font-weight="${/^(FRAGMENTO|SIN COSTA|ANCLAJES|EMPALME|VERIFICAR)/.test(text)?'700':'400'}" fill="#394f53">${esc(text)}</text>`);yy+=29}
 l.push('<rect x="119" y="852" width="1232" height="100" rx="10" fill="#fffdf7" stroke="#c3cbc5"/>',
 label('PLANO EDITABLE · DOS CONEXIONES DE HISTORIA PRESERVADAS · RESTO SOLO PROPUESTAS',135,882,'sect','start'),
 label('Azul = conexión de lugares existente; gris = calle candidata; rojo = calle antigua bloqueada; edificios no visitados.',135,909,'desc','start'),
 label('Costuras con fragmento 02: (68.1,43.8) y (68.2,46.65). No equivale a nuevas rutas jugables.',135,932,'desc','start'),'</svg>');
 return l.join('\n')+'\n';
}
const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
export function loadLandRegionSources(){return {
 f:read('docs/01_world/MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117.json'),
 adjacent:read('docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_02_20261117.json'),
 city:read('docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'),
 web:read('docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'),
 term:read('docs/01_world/MERIDIAN_BAY_PLAZA_TERMINAL_DETAIL_20261116.json')}}
export function checkLandBlueprint(){const s=loadLandRegionSources(),problems=auditLandRegion(s.f,s.adjacent,s.city,s.web,s.term),svg=readFileSync(new URL('docs/01_world/MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117.svg',root),'utf8');if(svg!==renderLandRegionSvg(s.f))problems.push('SVG not synchronized with JSON');return problems}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const cmd=process.argv[2]??'--check';if(cmd==='--render'){const s=loadLandRegionSources();writeFileSync(new URL('docs/01_world/MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117.svg',root),renderLandRegionSvg(s.f));console.log('Updated fragment 03')}else if(cmd==='--check'){const errors=checkLandBlueprint();if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('PASS: inland fragment 03, source routes, physical footprints, seams and SVG')}else {console.error('Usage: node tools/meridian_bay_land_region_blueprint.mjs --check | --render');process.exitCode=2}}
