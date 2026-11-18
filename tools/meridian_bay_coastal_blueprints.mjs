// Regional cartography: authored JSON is the source of truth; no story writes.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export function auditCoastRegion(f){
  const errors=[],b=f.study_box,s=f.proposed_coast.shoreline,EPS=1e-7;
  const orient=(a,c,d)=>(c.x-a.x)*(d.y-a.y)-(c.y-a.y)*(d.x-a.x);
  const properCross=(a,c,d,e)=>orient(a,c,d)*orient(a,c,e)<-EPS && orient(d,e,a)*orient(d,e,c)<-EPS;
  const inside=(q,poly)=>{let r=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],z=poly[j];if((a.y>q.y)!=(z.y>q.y)&&q.x<(z.x-a.x)*(q.y-a.y)/(z.y-a.y)+a.x)r=!r;}return r};
  const shoreX=y=>{for(let i=0;i<s.length-1;i++){const a=s[i],z=s[i+1];if(y>=a.y-EPS&&y<=z.y+EPS)return a.x+(z.x-a.x)*(y-a.y)/(z.y-a.y)}return NaN};
  if(!Array.isArray(s)||s.length<8||s.some((p,i)=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||(i>0&&p.y<=s[i-1].y)))errors.push("Coast must be a strictly ordered list of finite x/y points");
  if(s[0].y!==b.y_min||s.at(-1).y!==b.y_max)errors.push("Shoreline must cover this fragment edge-to-edge");
  const items=[...f.land_use_patches.map(v=>({v,path:v.polygon,closed:true,type:"zone"})),...f.building_footprints.map(v=>({v,path:v.polygon,closed:true,type:"building"})),...f.street_alignments.map(v=>({v,path:v.points,closed:false,type:"road"}))],seen=new Set();
  for(const obj of items){const {v,path,closed,type}=obj;if(seen.has(v.id))errors.push("Duplicate id "+v.id);seen.add(v.id);if(!Array.isArray(path)||path.length<(closed?3:2)){errors.push("Empty geometry "+v.id);continue}for(const q of path){if(!Number.isFinite(q.x)||!Number.isFinite(q.y)||q.x<b.x_min-EPS||q.x>b.x_max+EPS||q.y<b.y_min-EPS||q.y>b.y_max+EPS)errors.push("Out of bounds "+v.id)}for(let j=0;j<path.length-(closed?0:1);j++){const a=path[j],z=path[(j+1)%path.length],lo=Math.min(a.y,z.y),hi=Math.max(a.y,z.y);const ys=[lo,hi,...s.map(t=>t.y).filter(y=>y>lo&&y<hi)];for(const y of ys){let x=Math.abs(z.y-a.y)<EPS?Math.max(a.x,z.x):a.x+(z.x-a.x)*(y-a.y)/(z.y-a.y);if(!Number.isFinite(shoreX(y))||x>shoreX(y)+EPS){errors.push("Geometry in water: "+v.id);break}}}
    if(closed){const area=Math.abs(path.reduce((sum,q,i)=>sum+q.x*path[(i+1)%path.length].y-q.y*path[(i+1)%path.length].x,0))/2;if(area<0.002)errors.push("Degenerate footprint "+v.id);for(let i=0;i<path.length;i++)for(let j=i+2;j<path.length;j++){if(i===0&&j===path.length-1)continue;if(properCross(path[i],path[(i+1)%path.length],path[j],path[(j+1)%path.length]))errors.push("Self crossing "+v.id)}}
    if(type==="road"&&v.registered_as_new_story_link!==false)errors.push("New playable route created: "+v.id);
    if(type==="building"&&(v.access_status??"not_established")==="public_confirmed")errors.push("Building unexpectedly became public: "+v.id);
  }
  for(let i=0;i<f.building_footprints.length;i++)for(let j=i+1;j<f.building_footprints.length;j++){const a=f.building_footprints[i],d=f.building_footprints[j],pa=a.polygon,pd=d.polygon;let overlap=inside(pa[0],pd)||inside(pd[0],pa);for(let u=0;u<pa.length;u++)for(let v=0;v<pd.length;v++)if(properCross(pa[u],pa[(u+1)%pa.length],pd[v],pd[(v+1)%pd.length]))overlap=true;if(overlap)errors.push("Buildings overlap: "+a.id+" / "+d.id)}
  for(const road of f.street_alignments){if(/blocked|trace/.test(road.mode))continue;for(const building of f.building_footprints){if(road.points.some(q=>inside(q,building.polygon)))errors.push("Road within building: "+road.id+" / "+building.id);for(let i=0;i<road.points.length-1;i++)for(let j=0;j<building.polygon.length;j++)if(properCross(road.points[i],road.points[i+1],building.polygon[j],building.polygon[(j+1)%building.polygon.length]))errors.push("Road crosses building: "+road.id+" / "+building.id)}}
  if(f.limits?.no_canonical_story_change!==true&&f.limits?.canonical_save_untouched!==true)errors.push("No explicit story save protection");
  return [...new Set(errors)];
}
export function auditCoastSeam(one,two){
 const errors=[],a=one.proposed_coast.shoreline.at(-1),b=two.proposed_coast.shoreline[0],match=(p,q)=>p.x===q.x&&p.y===q.y;
 if(!match(a,b))errors.push("Shoreline seam discontinuity");
 if(one.study_box.y_max!==two.study_box.y_min)errors.push("Not adjoining regional vertical boundaries");
 if(two.previous_fragment!=="docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json")errors.push("Wrong prior fragment authority");
 const lowerSeam=one.assembly_seams.find(x=>x.id==="COAST-HIGH"),upperSeam=two.assembly_seams.find(x=>x.id==="COAST-02-START");
 if(!lowerSeam||!upperSeam||!match(lowerSeam,a)||!match(upperSeam.xy,b))errors.push("Missing matching shoreline join markers");
 const firstRoutes=one.street_alignments.filter(x=>x.source==="preexisting_connection");
 for(const id of ["HC-A-MARKET","HC-A-PLAZA"]){const r=firstRoutes.find(x=>x.id===id);if(!r||!match(r.points.at(-1),{x:71,y:37}))errors.push("Known Harbor Walk edge changed: "+id)}
 if(two.street_alignments.some(x=>x.registered_as_new_story_link!==false))errors.push("Second fragment illegally creates a story route");
 return errors;
}
export function renderCoastRegionSvg(f){
 const e=x=>String(x).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
 const box=f.study_box,k=70,ox=119,oy=108,mw=(box.x_max-box.x_min)*k,mh=(box.y_max-box.y_min)*k;
 const XY=q=>({x:ox+(q.x-box.x_min)*k,y:oy+(box.y_max-q.y)*k});
 const fmt=n=>n.toFixed(1),coords=q=>{const a=XY(q);return fmt(a.x)+","+fmt(a.y)};
 const drawPoly=(qs,attrs)=>`<polygon points="${qs.map(coords).join(" ")}" ${attrs}/>`;
 const drawLine=(qs,attrs)=>`<polyline points="${qs.map(coords).join(" ")}" ${attrs}/>`;
 const lab=(s,x,y,cl="maptext",anchor="middle")=>`<text class="${cl}" text-anchor="${anchor}" x="${fmt(x)}" y="${fmt(y)}">${e(s)}</text>`;
 const name=f.id.includes("-01-")?"01":"02",water=f.proposed_coast.shoreline,lines=[];
 lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
 lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1450" height="990" viewBox="0 0 1450 990">`);
 lines.push(`<title>${e("Meridian Bay · fragmento costero "+name)}</title><desc>${e("Plano regional editable derivado de la geometría JSON; no es la ciudad entera ni una ruta jugable")}</desc>`);
 lines.push(`<style>text{font-family:Arial,Helvetica,sans-serif}.title{font-size:27px;font-weight:700;fill:#263e44}.sub{font-size:14px;fill:#4d6871}.gridtxt{font-family:monospace;font-size:12px;fill:#7a8787}.maptext{font-size:13px;font-weight:700;fill:#344b50;paint-order:stroke;stroke:#f8f8f0;stroke-width:3px}.tiny{font-family:monospace;font-size:10px;fill:#3a4a4b}.sect{font-size:15px;font-weight:700;fill:#334951}.desc{font-size:12px;fill:#45595d}.warn{font-size:12px;font-weight:700;fill:#845a2a}</style>`);
 lines.push(`<rect width="1450" height="990" fill="#f7f6f0"/>`);
 lines.push(lab("MERIDIAN BAY — FRAGMENTO COSTERO "+name,119,42,"title","start"));
 lines.push(lab(name==="01"?"Harbor Walk: borde antiguo y suelo readaptado":"Continuación del borde: barrio irregular, rellenos y calles truncadas",119,66,"sub","start"));
 lines.push(`<rect x="${ox}" y="${oy}" width="${mw}" height="${mh}" fill="#eae5d9" stroke="#8d9e9e" stroke-width="2"/>`);
 for(let x=Math.ceil(box.x_min);x<=box.x_max;x++){const A=XY({x,y:box.y_min});lines.push(`<line x1="${fmt(A.x)}" y1="${oy}" x2="${fmt(A.x)}" y2="${fmt(oy+mh)}" stroke="#b7c3bd" stroke-width="0.6" opacity=".55"/>`);lines.push(lab(x, A.x,oy+mh+18,"gridtxt"))}
 for(let y=Math.ceil(box.y_min);y<=box.y_max;y++){const A=XY({x:box.x_min,y});lines.push(`<line x1="${ox}" y1="${fmt(A.y)}" x2="${fmt(ox+mw)}" y2="${fmt(A.y)}" stroke="#b7c3bd" stroke-width="0.6" opacity=".55"/>`);lines.push(lab(y,ox-14,A.y+4,"gridtxt"))}
 const shades=["#d3c2a8","#bdb4a5","#b9c5b1","#b6c8c0","#d9c8ae","#bdc4bd"];
 for(let i=0;i<f.land_use_patches.length;i++){const patch=f.land_use_patches[i];lines.push(drawPoly(patch.polygon,`fill="${shades[i%shades.length]}" opacity=".81" stroke="#8c8b7e" stroke-width="1.2" stroke-dasharray="5 4"`));}
 const swater=[...water,{x:box.x_max,y:box.y_max},{x:box.x_max,y:box.y_min}];lines.push(drawPoly(swater,`fill="#acd0da" stroke="none"`));
 for(const r of f.street_alignments){let attrs=r.source==="preexisting_connection"?`stroke="#246686" stroke-width="5"`:/blocked|trace/.test(r.mode)?`stroke="#b86b57" stroke-width="3.6" stroke-dasharray="4 6"`:/pedestrian/.test(r.mode)?`stroke="#3b766c" stroke-width="4" stroke-dasharray="8 6"`:/restricted|service/.test(r.mode)?`stroke="#8c6b50" stroke-width="4" stroke-dasharray="9 5"`:`stroke="#746b5f" stroke-width="4.4" stroke-dasharray="9 5"`;lines.push(drawLine(r.points,`fill="none" ${attrs} stroke-linecap="round" stroke-linejoin="round"`))}
 for(const building of f.building_footprints){lines.push(drawPoly(building.polygon,`fill="#9c9082" opacity=".96" stroke="#4c5353" stroke-width="1.8"`));const c={x:building.polygon.reduce((n,q)=>n+q.x,0)/building.polygon.length,y:building.polygon.reduce((n,q)=>n+q.y,0)/building.polygon.length},q=XY(c);lines.push(lab(building.id.split("-").at(-1),q.x,q.y+3,"tiny"))}
 lines.push(drawLine(water,`fill="none" stroke="#246276" stroke-width="4.5" stroke-linejoin="round"`));
 for(const seam of f.assembly_seams.filter(x=>(x.id.includes("COAST")||x.kind==="shoreline_only"))){const q=XY(seam.xy??seam);lines.push(`<circle cx="${fmt(q.x)}" cy="${fmt(q.y)}" r="7.2" fill="#fffdf8" stroke="#26566a" stroke-width="2.5"/>`);const label=seam.id.includes("START")||seam.id==="COAST-HIGH"?"EMPALME":"COSTURA";lines.push(lab(label,q.x-9,q.y+(q.y<oy+30?29:-13),"tiny","end"))}
 for(const a of f.reference_anchors.filter(x=>x.id==="LOC-HARBOR-WALK")){const q=XY(a);lines.push(`<circle cx="${fmt(q.x)}" cy="${fmt(q.y)}" r="9" fill="#286486" stroke="white" stroke-width="3"/>`);lines.push(lab("HARBOR WALK",q.x+12,q.y-13,"maptext","start"))}
 const sx=ox+mw+24,linesPanel=[
 ["FRAGMENTO "+name, "#263e44"],
 ["Costa irregular — diseño","#45595d"],
 [`${water.length} puntos de ribera`,"#45595d"],
 [`${f.land_use_patches.length} áreas de suelo`,"#45595d"],
 [`${f.building_footprints.length} huellas de edificios`,"#45595d"],
 [`${f.street_alignments.length} trazados viarios`,"#45595d"],
 ["","#45595d"],
 ["NO ES CANON JUGABLE","#9a5836"],
 ["Sin horarios ni NPC","#45595d"],
 ["Sin nuevos enlaces","#45595d"],
 ["Orientación pendiente","#45595d"],
 ["","#45595d"],
 ["CLAVES","#263e44"],
 ["Azul: conexiones previas","#45595d"],
 ["Verde: senda propuesta","#45595d"],
 ["Rojo: traza bloqueada","#45595d"],
 ["Gris: calle propuesta","#45595d"]
 ];let y=120;for(const [s,color] of linesPanel){if(!s){y+=17;continue}lines.push(`<text font-family="Arial" font-size="${s.startsWith("FRAGMENTO")||s==="CLAVES"?17:13}" font-weight="${s==="NO ES CANON JUGABLE"||s.startsWith("FRAGMENTO")||s==="CLAVES"?"700":"400"}" x="${fmt(sx)}" y="${fmt(y)}" fill="${color}">${e(s)}</text>`);y+=29}
 lines.push(`<rect x="119" y="851" width="1232" height="101" rx="10" fill="#fffdf7" stroke="#c2c9c5"/>`);
 lines.push(lab("BORRADOR EDITABLE  •  CONTINUIDAD ENTRE FRAGMENTOS  •  NO MODIFICA PARTIDA",135,881,"sect","start"));
 lines.push(lab(name==="01"?"Siguiente costura costera: (75.1, 42). El taller Wilson no pertenece a este plano.":"Costura de entrada: (75.1, 42), exactamente igual al fragmento 01; extremo nuevo (79.2, 51).",135,907,"desc","start"));
 lines.push(lab("Cuadrícula provisional. La bahía, los edificios y calles locales pueden cambiar al ensamblar las regiones.",135,931,"desc","start"));
 lines.push(`</svg>`);return lines.join("\n")+"\n";
}
const root=new URL('../',import.meta.url);
export function loadCoastalFragment(n){if(n!==1&&n!==2)throw Error('Only authored coastal fragments 01 and 02 are supported');const id=String(n).padStart(2,'0');return JSON.parse(readFileSync(new URL('docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_'+id+'_20261117.json',root),'utf8'));}
export function verifyCoastalBlueprints(){const a=loadCoastalFragment(1),b=loadCoastalFragment(2),errors=[...auditCoastRegion(a),...auditCoastRegion(b),...auditCoastSeam(a,b)];for(const [n,s] of [[1,a],[2,b]]){const id=String(n).padStart(2,'0');const file=new URL('docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_'+id+'_20261117.svg',root);if(readFileSync(file,'utf8')!==renderCoastRegionSvg(s))errors.push('SVG out of sync with authored JSON fragment '+id)}return errors;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const cmd=process.argv[2]??'--check';if(cmd==='--render'){for(let n=1;n<=2;n++){const id=String(n).padStart(2,'0');writeFileSync(new URL('docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_'+id+'_20261117.svg',root),renderCoastRegionSvg(loadCoastalFragment(n)))}console.log('Updated two editable region schematics from JSON')}else if(cmd==='--check'){const issues=verifyCoastalBlueprints();if(issues.length){console.error(issues.join('\n'));process.exitCode=1}else console.log('PASS: both coastal regions, seam, land geometry and derived SVGs')}else{console.error('Usage: node tools/meridian_bay_coastal_blueprints.mjs --check | --render');process.exitCode=2}}
