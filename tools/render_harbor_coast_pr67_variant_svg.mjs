// Deterministic, source-locked rendering of noncanonical Coast 01 PR67 geometry.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
const prefix=new URL('../docs/01_world/',import.meta.url);
const loc=name=>new URL(name,prefix);
const paths={
 a:loc('MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json'),
 b:loc('SOURCE_PR67_COAST_01_20261120.json'),
 s:loc('MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg'),
 output:loc('MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_PR67_VARIANT_20261122.svg')};
const expected={a:'81ef8da51951205394ba050fe6f867bfc00d7244',
 b:'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7',
 s:'56e6ba7a830fdc53e6dcff205871b3af57e7c04e'};
const need=(x,msg)=>{if(!x)throw Error(msg)};
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));
const xy=p=>{
 need(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=68&&p.x<=77&&p.y>=32&&p.y<=42,'Invalid draft point');
 return [100+(p.x-68)*84,74+(42-p.y)*61.4];
};
const fmt=pts=>pts.map(p=>xy(p).map(v=>(Math.round((v+Number.EPSILON)*10)/10).toFixed(1)).join(',')).join(' ');
const near=(raw,pts)=>{
 const v=raw.trim().split(/\s+/).map(x=>x.split(',').map(Number));
 return v.length===pts.length&&v.every((p,i)=>p.length===2&&p.every((n,j)=>Number.isFinite(n)&&Math.abs(n-xy(pts[i])[j])<0.061));
};
const shapes=d=>[
 {id:'HC-WATER',pts:[...d.proposed_coast.shoreline].reverse().concat([
  {x:d.study_box.x_max,y:d.study_box.y_min},{x:d.study_box.x_max,y:d.study_box.y_max}])},
 ...d.land_use_patches.map(x=>({id:x.id,pts:x.polygon})),
 ...d.building_footprints.map(x=>({id:x.id,pts:x.polygon}))];
const lines=d=>[{id:'HC-COAST',pts:d.proposed_coast.shoreline},
 ...d.street_alignments.map(x=>({id:x.id,pts:x.points}))];
export function renderPR67CoastSvg(){
 const bytes=Object.fromEntries(['a','b','s'].map(k=>[k,readFileSync(paths[k])]));
 for(const [k,s] of Object.entries(expected))need(blob(bytes[k])===s,'Historical blob mismatch '+k);
 const a=JSON.parse(bytes.a),b=JSON.parse(bytes.b),expectedDraft=clone(a);
 need(b.status==='editable_fragment_draft_not_admitted_to_saved_world'&&
  Object.values(b.limits).every(x=>x===true),'Source candidate is no longer unadmitted');
 const freight=expectedDraft.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 const road=expectedDraft.street_alignments.find(x=>x.id==='HC-A-OLD');
 need(freight?.polygon[3]?.x===72.5&&road?.points[3]?.y===39.1&&road?.points[4]?.y===38.9,'Historic geometry baseline changed');
 freight.polygon[3].x=72.25;road.points[3].y=39.95;road.points[4].y=39.3;
 need(isDeepStrictEqual(expectedDraft,b),'Only three historic scalar differences permitted');
 const p=shapes(a),q=shapes(b),l=lines(a),t=lines(b);
 let n=0,m=0,svg=bytes.s.toString('utf8');
 svg=svg.replace(/(<polygon\s+points=")([^"]+)(")/g,(z,before,coords,after)=>{
  const i=n++;need(p[i]&&q[i]&&p[i].id===q[i].id&&near(coords,p[i].pts),'Historic polygon SVG mismatched at '+i);
  return before+fmt(q[i].pts)+after+' data-map-id="'+q[i].id+'"';
 }).replace(/(<polyline\s+points=")([^"]+)(")/g,(z,before,coords,after)=>{
  const i=m++;need(l[i]&&t[i]&&l[i].id===t[i].id&&near(coords,l[i].pts),'Historic street SVG mismatched at '+i);
  return before+fmt(t[i].pts)+after+' data-map-id="'+t[i].id+'"';
 });
 need(n===11&&m===7,'Historic SVG shape count mismatch');
 const sub=[
 ['<title>Meridian Bay: fragmento del borde de la bahía</title>','<title>Meridian Bay: alternativa costera PR 67 (borrador no canónico)</title>'],
 ['<desc>Blueprint regional editable, no mapa definitivo. Costa irregular, huellas de edificios, calles antiguas y dos conexiones existentes a Harbor Walk.</desc>','<desc>Alternativa histórica PR 67 sincronizada con JSON de fuente inmutable; geometría hipotética sin admisión al mundo guardado ni acceso jugable.</desc>'],
 ['<text class="h" x="75" y="35">Meridian Bay · bahía · fragmento 01</text>','<text class="h" x="75" y="35">Meridian Bay · fragmento 01 (PR 67)</text>'],
 ['<text class="s" x="75" y="55">Harbor Walk — propuesta regional editable, sin orientación geográfica verificada</text>','<text class="s" x="75" y="55">Alternativa técnica no canónica · litoral y calles hipotéticos</text>'],
 ['</svg>','<metadata id="harbor-pr67-variant" data-source-pr67-git-blob="'+expected.b+'" data-original-pr66-svg-git-blob="'+expected.s+'" data-admitted="false"/>\n</svg>']];
 for(const [a,b]of sub){need(svg.includes(a),'Historical SVG annotation mismatch');svg=svg.replace(a,b)}
 return svg;
}
export function verifyPR67CoastSvg(){
 need(readFileSync(paths.output,'utf8')===renderPR67CoastSvg(),'PR67 SVG differs from archived JSON');
 return true;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 need(process.argv.length===3&&['--check','--write'].includes(process.argv[2]),'Usage: --check | --write');
 if(process.argv[2]==='--write')writeFileSync(paths.output,renderPR67CoastSvg(),'utf8');
 verifyPR67CoastSvg();
 console.log('PR67 geometry SVG verified: no story admission');
}
