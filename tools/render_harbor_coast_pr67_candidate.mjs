// Read-only reviewed alternative to the PR86 Coast01 design.
// PR67 historical source is byte-preserved, not a replacement of saved-world canon.
// This module writes only the distinct candidate SVG with an explicit --write.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {fileURLToPath} from 'node:url';
import {
 validateMeridianRegionalSeams,coastalWaterConflicts,coastRoadBuildingConflicts
} from './meridian_bay_three_region_seams.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const paths={
 historicJSON:new URL('MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json',root),
 historicSVG:new URL('MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg',root),
 historicalPR67:new URL('SOURCE_PR67_COAST_01_20261120.json',root),
 candidate:new URL('MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json',root),
 output:new URL('MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.svg',root),
 coast02:new URL('SOURCE_PR67_COAST_02_20261120.json',root)
};
const sha={
 historicJSON:'81ef8da51951205394ba050fe6f867bfc00d7244',
 historicSVG:'56e6ba7a830fdc53e6dcff205871b3af57e7c04e',
 historicalPR67:'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7',
 coast02:'325a0acde67a1ce3b44576860824657a3db41695'
};
const check=(condition,message)=>{if(!condition)throw Error(message)};
const copy=x=>structuredClone(x);
const blobSha=bytes=>{
 const b=Buffer.from(bytes);
 return createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
};
const readChecked=(key)=>{
 const raw=readFileSync(paths[key]);
 check(blobSha(raw)===sha[key],'Immutable source has changed: '+key);
 return raw;
};
const old=JSON.parse(readChecked('historicJSON'));
const source=JSON.parse(readChecked('historicalPR67'));
const candidate=JSON.parse(readFileSync(paths.candidate,'utf8'));
const fragment02=JSON.parse(readChecked('coast02'));
const oldSvg=readChecked('historicSVG').toString('utf8');
const equalPoint=(a,b)=>a?.x===b?.x&&a?.y===b?.y;

const coord=p=>{
 check(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&
  p.x>=68&&p.x<=77&&p.y>=32&&p.y<=42,
  'Proposed coordinates outside the original Harbor Walk study box');
 return [100+(p.x-68)*84,74+(42-p.y)*61.4];
};
const renderNumber=n=>(Math.round((n+Number.EPSILON)*10)/10).toFixed(1);
const svgCoords=arr=>arr.map(p=>coord(p).map(renderNumber).join(',')).join(' ');
const readSvgCoords=s=>s.trim().split(/\s+/).map(p=>p.split(',').map(Number));
const matches=(rendered,authoritative)=>rendered.length===authoritative.length&&
 rendered.every((pair,i)=>pair.length===2&&pair.every((n,j)=>
  Number.isFinite(n)&&Math.abs(n-coord(authoritative[i])[j])<0.061));
const shapes=f=>[
 {id:'HC-WATER',points:[
  ...f.proposed_coast.shoreline.toReversed(),
  {x:f.study_box.x_max,y:f.study_box.y_min},
  {x:f.study_box.x_max,y:f.study_box.y_max}
 ]},
 ...f.land_use_patches.map(x=>({id:x.id,points:x.polygon})),
 ...f.building_footprints.map(x=>({id:x.id,points:x.polygon}))
];
const lines=f=>[
 {id:'HC-COAST',points:f.proposed_coast.shoreline},
 ...f.street_alignments.map(x=>({id:x.id,points:x.points}))
];

export function validatePr67CoastCandidate({state,fragment=candidate}={}){
 check(state?.world?.locations&&state?.player?.location_id,
  'Saved world and player required for candidate review');
 validateMeridianRegionalSeams({state});
 check(fragment&&typeof fragment==='object','Candidate draft required');
 const metadata=fragment.candidate_review_2026_11_22;
 check(metadata?.source_pr===67&&
  metadata.source_commit==='8bdf34c5eddf4e12e34352018b2a893cb9a14056'&&
  metadata.source_json_blob===sha.historicalPR67&&
  metadata.reference_original_json_blob===sha.historicJSON&&
  metadata.approval==='not_admitted_not_physical_survey_not_game_navigation'&&
  metadata.story_state_untouched===true,
  'Candidate source/approval boundary is invalid');
 const stripped=copy(fragment);
 delete stripped.candidate_review_2026_11_22;
 check(same(stripped,source),
  'PR67 candidate differs from exact historical JSON source');
 const three=copy(old);
 three.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon[3].x=72.25;
 const oldRoad=three.street_alignments.find(x=>x.id==='HC-A-OLD');
 oldRoad.points[3].y=39.95;
 oldRoad.points[4].y=39.3;
 check(same(three,source),'PR67 historical data no longer has precisely 3 scalar corrections');
 check(same(metadata.exact_source_changes_from_pr66,[
  {kind:'land_use_patch',id:'HC-Z-FREIGHT',property:'polygon[3].x',from:72.5,to:72.25},
  {kind:'street_alignment',id:'HC-A-OLD',property:'points[3].y',from:39.1,to:39.95},
  {kind:'street_alignment',id:'HC-A-OLD',property:'points[4].y',from:38.9,to:39.3}
 ]),'Declared three-scalar correction set changed');
 check(coastalWaterConflicts(fragment).length===0&&
  coastRoadBuildingConflicts(fragment).length===0,
  'Candidate fails internal water / road-building geometry');
 check(equalPoint(fragment.proposed_coast.shoreline.at(-1),{x:75.1,y:42})&&
  equalPoint(fragment.proposed_coast.shoreline.at(-1),
   fragment02.proposed_coast.shoreline[0])&&
  equalPoint(fragment.assembly_seams.find(x=>x.id==='COAST-HIGH'),
   fragment02.assembly_seams.find(x=>x.id==='COAST-02-START')?.xy),
  'Candidate does not stitch to saved historical fragment02 plan');
 check(fragment.street_alignments.every(x=>x.registered_as_new_story_link===false)&&
  Object.values(fragment.limits).every(v=>v===true),
  'Candidate must not create canonical navigation or fictional events');
 return true;
}

export function renderPr67CoastCandidateSvg({state}={}){
 validatePr67CoastCandidate({state});
 const previousShapes=shapes(old),newShapes=shapes(candidate);
 const previousLines=lines(old),newLines=lines(candidate);
 let p=0,l=0;
 let svg=oldSvg.replace(/(<polygon\s+points=")([^"]+)(")/g,(all,a,s,b)=>{
  const before=previousShapes[p],after=newShapes[p];p++;
  check(before&&after&&before.id===after.id&&
   matches(readSvgCoords(s),before.points),
   'Archived SVG polygon diverges from original JSON at index '+p);
  return a+svgCoords(after.points)+b+' data-map-id="'+after.id+'"';
 }).replace(/(<polyline\s+points=")([^"]+)(")/g,(all,a,s,b)=>{
  const before=previousLines[l],after=newLines[l];l++;
  check(before&&after&&before.id===after.id&&
   matches(readSvgCoords(s),before.points),
   'Archived SVG polyline diverges from original JSON at index '+l);
  return a+svgCoords(after.points)+b+' data-map-id="'+after.id+'"';
 });
 check(p===11&&l===7,'Historical SVG geometry count unexpectedly changed');
 const replace=(from,to)=>{
  check(svg.includes(from),'Historical SVG text marker missing');
  svg=svg.replace(from,to);
 };
 replace('<title>Meridian Bay: fragmento del borde de la bahía</title>',
  '<title>Meridian Bay: fragmento costero PR67 corregido (borrador no canónico)</title>');
 replace('<desc>Blueprint regional editable, no mapa definitivo. Costa irregular, huellas de edificios, calles antiguas y dos conexiones existentes a Harbor Walk.</desc>',
  '<desc>Candidato PR67: tres correcciones geométricas internas verificadas. No es costa medida, vía aprobada ni acceso jugable.</desc>');
 replace('<text class="h" x="75" y="35">Meridian Bay · bahía · fragmento 01</text>',
  '<text class="h" x="75" y="35">Meridian Bay · costa 01 · candidato PR67</text>');
 replace('<text class="s" x="75" y="55">Harbor Walk — propuesta regional editable, sin orientación geográfica verificada</text>',
  '<text class="s" x="75" y="55">Revisión cartográfica · 3 ajustes · no canónico · acceso sin certificar</text>');
 replace('</svg>',
  '<metadata id="harbor-pr67-candidate" data-source-pr="67"'+
  ' data-source-json-blob="'+sha.historicalPR67+'"'+
  ' data-original-svg-blob="'+sha.historicSVG+'"'+
  ' data-admitted="false" data-story-action="false"/>\n</svg>');
 return svg;
}
export function verifyPr67CoastCandidateSvg({state}={}){
 const generated=renderPr67CoastCandidateSvg({state});
 const stored=readFileSync(paths.output,'utf8');
 check(stored===generated,'PR67 candidate SVG is stale versus pinned historical JSON');
 return true;
}
export function inspectPr67CoastCandidate({state}={}){
 validatePr67CoastCandidate({state});
 return copy({
  classification:'narrator_private_pr67_coast01_candidate',
  sourcePr:67,sourceGitBlob:sha.historicalPR67,
  proposedLandAndRoadErrors:0,illustratedShorelineSurveyed:false,
  amendedScalarCount:3,
  shorelineSeam:{x:75.1,y:42,joinsHistoricalFragment02:true,playable:false},
  alternativesStillOpen:['PR44_vs_PR58_market_harbor','PR56_plaza_harbor_building_collision'],
  physicalIntegrationReady:'pending_editorial_selection_and_full_city_review',
  routesApproved:false,savedWorldChanged:false,playerMoved:false,
  npcMoved:false,fictionalTimeAdvanced:false
 });
}
// No writing on import or inspector/CI usage. Explicit one-file output only.
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 check(process.argv.length===3&&process.argv[2]==='--write',
  'Use: node tools/render_harbor_coast_pr67_candidate.mjs --write');
 const state=JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url),'utf8'));
 writeFileSync(paths.output,renderPr67CoastCandidateSvg({state}),'utf8');
 verifyPr67CoastCandidateSvg({state});
 console.log('PASS: PR67 Coast01 candidate SVG reproduced from exact historical sources');
}
