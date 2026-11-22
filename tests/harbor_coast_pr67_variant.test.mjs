import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderPR67CoastSvg,verifyPR67CoastSvg} from '../tools/render_harbor_coast_pr67_variant_svg.mjs';
import {coastalWaterConflicts,coastRoadBuildingConflicts} from '../tools/meridian_bay_three_region_seams.mjs';
const raw=p=>readFileSync(new URL(p,import.meta.url));
const dir='../docs/01_world/';
const load=p=>JSON.parse(raw(dir+p));
const a=()=>load('MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json');
const b=()=>load('SOURCE_PR67_COAST_01_20261120.json');
const c=()=>load('MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json');
const svg=()=>raw(dir+'MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_PR67_VARIANT_20261122.svg').toString('utf8');
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
test('archive Git blob identity',()=>{
 assert.equal(sha(raw(dir+'MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json')),'81ef8da51951205394ba050fe6f867bfc00d7244');
 assert.equal(sha(raw(dir+'MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg')),'56e6ba7a830fdc53e6dcff205871b3af57e7c04e');
 assert.equal(sha(raw(dir+'SOURCE_PR67_COAST_01_20261120.json')),'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7');
});
test('PR67 changes exactly three scalar coordinates',()=>{
 const p=a();p.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon[3].x=72.25;
 const r=p.street_alignments.find(x=>x.id==='HC-A-OLD');r.points[3].y=39.95;r.points[4].y=39.3;
 assert.deepEqual(p,b());
});
test('PR67 solves coast and candidate building conflicts but PR86 does not solve both',()=>{
 assert.ok(coastalWaterConflicts(a()).length>0);
 assert.equal(coastalWaterConflicts(c()).length,0);
 assert.equal(coastRoadBuildingConflicts(c()).length,3);
 assert.equal(coastalWaterConflicts(b()).length,0);
 assert.equal(coastRoadBuildingConflicts(b()).length,0);
});
test('SVG remains byte-identical to deterministic rendering',()=>{
 assert.equal(verifyPR67CoastSvg(),true);
 assert.equal(renderPR67CoastSvg(),svg());
});
test('all 11 polygon and 7 polyline features match candidate points',()=>{
 const d=b(),s=svg(),px=p=>[100+(p.x-68)*84,74+(42-p.y)*61.4];
 const ps=[{id:'HC-WATER',pts:[...d.proposed_coast.shoreline].reverse().concat([
  {x:d.study_box.x_max,y:d.study_box.y_min},{x:d.study_box.x_max,y:d.study_box.y_max}])},
  ...d.land_use_patches.map(x=>({id:x.id,pts:x.polygon})),
  ...d.building_footprints.map(x=>({id:x.id,pts:x.polygon}))];
 const ls=[{id:'HC-COAST',pts:d.proposed_coast.shoreline},...d.street_alignments.map(x=>({id:x.id,pts:x.points}))];
 const ap=[...s.matchAll(/<polygon\s+points="([^"]+)"\s+data-map-id="([^"]+)"/g)];
 const al=[...s.matchAll(/<polyline\s+points="([^"]+)"\s+data-map-id="([^"]+)"/g)];
 assert.equal(ap.length,11);assert.equal(al.length,7);
 for(const [actual,expect]of [...ap.map((x,i)=>[x,ps[i]]),...al.map((x,i)=>[x,ls[i]])]){
  assert.equal(actual[2],expect.id);
  const pts=actual[1].trim().split(/\s+/).map(x=>x.split(',').map(Number));
  assert.equal(pts.length,expect.pts.length);
  pts.forEach((xy,i)=>xy.forEach((v,j)=>assert.ok(Math.abs(v-px(expect.pts[i])[j])<0.051,expect.id+' vertex '+i)));
 }
});
test('noncanon status, no route registration, read-only checkpoint',()=>{
 const d=b(),s=svg(),files=['../game/STATE.json','../game/SAVE_MANIFEST.json',
  dir+'SOURCE_PR67_COAST_01_20261120.json'];
 const before=files.map(x=>sha(raw(x)));
 assert.ok(Object.values(d.limits).every(v=>v===true));
 assert.ok(d.street_alignments.every(x=>x.registered_as_new_story_link===false));
 assert.ok(s.includes('data-admitted="false"'));assert.ok(!s.includes('data-admitted="true"'));
 assert.equal(verifyPR67CoastSvg(),true);assert.deepEqual(files.map(x=>sha(raw(x))),before);
});
