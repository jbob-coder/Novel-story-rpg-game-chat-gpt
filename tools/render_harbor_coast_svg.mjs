// Regenerate the reviewed, noncanonical Harbor Coast SVG from its reviewed JSON.
// The immutable historic PR #66 JSON/SVG are input evidence, not writable targets.
// Deterministic, dependency-free; importing this module never writes files.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {fileURLToPath} from 'node:url';

const historicSVG=new URL('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg',import.meta.url);
const historicJSON=new URL('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json',import.meta.url);
const reviewJSON=new URL('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json',import.meta.url);
const output=new URL('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.svg',import.meta.url);
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const rawSVG=readFileSync(historicSVG,'utf8');
const old=JSON.parse(readFileSync(historicJSON,'utf8'));
const updated=JSON.parse(readFileSync(reviewJSON,'utf8'));
const sha=data=>{const b=Buffer.from(data);return createHash('sha1')
 .update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');};
const blobSVG='56e6ba7a830fdc53e6dcff205871b3af57e7c04e';
const blobJSON='81ef8da51951205394ba050fe6f867bfc00d7244';
const round=v=>(Math.round((v+Number.EPSILON)*10)/10).toFixed(1);
const point=p=>{
 assert(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&
  p.x>=68&&p.x<=77&&p.y>=32&&p.y<=42,'Out of bounds provisional coast XY');
 return [100+(p.x-68)*84,74+(42-p.y)*61.4];
};
const pixels=points=>points.map(p=>point(p).map(round).join(',')).join(' ');
const fromAttribute=value=>value.trim().split(/\s+/).map(pair=>pair.split(',').map(Number));
const near=(rendered,points)=>rendered.length===points.length&&
 rendered.every((pair,i)=>pair.length===2&&pair.every((n,j)=>
  Number.isFinite(n)&&Math.abs(n-point(points[i])[j])<0.061));
const coastPolys=data=>[
 {id:'HC-WATER',points:[
  ...data.proposed_coast.shoreline.toReversed(),
  {x:data.study_box.x_max,y:data.study_box.y_min},
  {x:data.study_box.x_max,y:data.study_box.y_max}]},
 ...data.land_use_patches.map(item=>({id:item.id,points:item.polygon})),
 ...data.building_footprints.map(item=>({id:item.id,points:item.polygon}))
];
const lines=data=>[
 {id:'HC-COAST',points:data.proposed_coast.shoreline},
 ...data.street_alignments.map(item=>({id:item.id,points:item.points}))
];

export function renderHarborCoastReviewSvg(){
 assert(sha(rawSVG)===blobSVG&&sha(readFileSync(historicJSON))===blobJSON,
  'Archived Harbor Coast source SVG or JSON changed');
 const fresh=structuredClone(updated);
 const review=fresh.review_2026_11_20;
 assert(review?.historical_json_blob_sha===blobJSON&&
  review.historical_head_sha==='d5f8af27779aa49ecfa082e091f6bb57308a146a'&&
  fresh.status==='editable_fragment_draft_not_admitted_to_saved_world',
  'Only the verified historical coast proposal may be rendered');
 delete fresh.review_2026_11_20;
 const sourceFreight=old.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 const currentFreight=fresh.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 assert(sourceFreight?.polygon.length===7&&
  currentFreight?.polygon.length===9&&
  same(currentFreight.polygon.slice(3,5),[{x:71.8,y:34.6},{x:72.02,y:35.1}]),
  'Unexpected candidate coast repair vertices');
 currentFreight.polygon=structuredClone(sourceFreight.polygon);
 assert(same(fresh,old),'Beyond the two freight vertices, the historic draft must be unchanged');

 const oldPolys=coastPolys(old),newPolys=coastPolys(updated);
 const oldLines=lines(old),newLines=lines(updated);
 let pol=0,lin=0;
 let svg=rawSVG.replace(/(<polygon\s+points=")([^"]+)(")/g,(whole,open,coords,close)=>{
  const previous=oldPolys[pol],next=newPolys[pol];pol++;
  assert(previous&&next&&previous.id===next.id&&
   near(fromAttribute(coords),previous.points),
   'Historical coastline/polygon SVG does not match its original JSON at '+pol);
  return open+pixels(next.points)+close+' data-map-id="'+next.id+'"';
 }).replace(/(<polyline\s+points=")([^"]+)(")/g,(whole,open,coords,close)=>{
  const previous=oldLines[lin],next=newLines[lin];lin++;
  assert(previous&&next&&previous.id===next.id&&
   near(fromAttribute(coords),previous.points),
   'Historical polyline SVG does not match original JSON at '+lin);
  return open+pixels(next.points)+close+' data-map-id="'+next.id+'"';
 });
 assert(pol===11&&lin===7,'Original Harbor Coast artwork feature count changed');
 const title='<title>Meridian Bay: fragmento del borde de la bahía</title>';
 const replacement='<title>Meridian Bay: fragmento costero revisado (borrador no canónico)</title>';
 assert(svg.includes(title),'Historical SVG title changed');
 svg=svg.replace(title,replacement);
 const description='<desc>Blueprint regional editable, no mapa definitivo. Costa irregular, huellas de edificios, calles antiguas y dos conexiones existentes a Harbor Walk.</desc>';
 assert(svg.includes(description),'Historical SVG description changed');
 svg=svg.replace(description,
  '<desc>VARIANTE REVISADA Y NO CANÓNICA: el polígono portuario HC-Z-FREIGHT ya no cruza la costa hipotética. Fuente: PR 66; son propuestas sin revisión física, navegación ni accesos certificados.</desc>');
 const heading='<text class="h" x="75" y="35">Meridian Bay · bahía · fragmento 01</text>';
 assert(svg.includes(heading),'Historical SVG heading changed');
 svg=svg.replace(heading,
  '<text class="h" x="75" y="35">Meridian Bay · bahía · fragmento 01 (revisado)</text>');
 const subtitle='<text class="s" x="75" y="55">Harbor Walk — propuesta regional editable, sin orientación geográfica verificada</text>';
 assert(svg.includes(subtitle),'Historical SVG subtitle changed');
 svg=svg.replace(subtitle,
  '<text class="s" x="75" y="55">Borrador no canónico · costa interna corregida · accesos físicos no verificados</text>');
 assert(svg.includes('</svg>'),'Historical SVG root tag lost');
 svg=svg.replace('</svg>',
  '<metadata id="harbor-review" data-original-svg-git-blob="'+blobSVG+
  '" data-original-json-git-blob="'+blobJSON+
  '" data-review-plan="MB-HARBOR-COAST-FRAGMENT-01-20261117"'+
  ' data-admitted="false"/>\n</svg>');
 return svg;
}

export function verifyHarborCoastReviewSvg(){
 const expected=renderHarborCoastReviewSvg();
 const stored=readFileSync(output,'utf8');
 assert(expected===stored,'Reviewed Harbor Coast SVG is stale versus reviewed JSON/source');
 return true;
}

// Deliberate opt-in only; no file write happens during import or CI verification.
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 assert(process.argv.length===3&&process.argv[2]==='--write',
  'Use: node tools/render_harbor_coast_svg.mjs --write');
 writeFileSync(output,renderHarborCoastReviewSvg(),'utf8');
 verifyHarborCoastReviewSvg();
 console.log('Verified reviewed Harbor Coast SVG (noncanonical draft)');
}
