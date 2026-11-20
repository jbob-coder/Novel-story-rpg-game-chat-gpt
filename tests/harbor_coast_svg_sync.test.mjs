import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderHarborCoastReviewSvg,verifyHarborCoastReviewSvg}
 from '../tools/render_harbor_coast_svg.mjs';

const raw=path=>readFileSync(new URL(path,import.meta.url));
const read=path=>JSON.parse(raw(path));
const original=()=>read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json');
const reviewed=()=>read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json');
const sourceSvg=()=>raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg').toString('utf8');
const reviewedSvg=()=>raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.svg').toString('utf8');
const blob=x=>{const bytes=Buffer.from(x);return createHash('sha1')
 .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');};
const pixel=p=>[100+(p.x-68)*84,74+(42-p.y)*61.4];
const decoded=coords=>coords.split(/\s+/).map(s=>s.split(',').map(Number));
const polys=(svg)=>[...svg.matchAll(/<polygon\s+points="([^"]+)"\s+data-map-id="([^"]+)"/g)]
 .map(m=>({id:m[2],points:decoded(m[1])}));
const lines=(svg)=>[...svg.matchAll(/<polyline\s+points="([^"]+)"\s+data-map-id="([^"]+)"/g)]
 .map(m=>({id:m[2],points:decoded(m[1])}));
const assertPixelShape=(displayed,source,id)=>{
 assert.ok(displayed,id+' SVG element is absent');
 assert.equal(displayed.points.length,source.length,id+' vertex count');
 for(let i=0;i<source.length;i++){
  const p=pixel(source[i]);
  for(let j=0;j<2;j++)
   assert.ok(Number.isFinite(displayed.points[i][j])&&
    Math.abs(displayed.points[i][j]-p[j])<=0.051,
    id+' vertex '+i+' component '+j+' deviates from JSON');
 }
};

test('reviewed SVG is reproduced exactly and independently by deterministic renderer',()=>{
 assert.equal(verifyHarborCoastReviewSvg(),true);
 const current=reviewedSvg(),generated=renderHarborCoastReviewSvg();
 assert.equal(current,generated);
 assert.ok(current.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
 assert.ok(current.includes('viewBox="0 0 1020 820"'));
});

test('both original historical files have exactly the source PR66 git-blob identities',()=>{
 assert.equal(blob(raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg')),
  '56e6ba7a830fdc53e6dcff205871b3af57e7c04e');
 assert.equal(blob(raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json')),
  '81ef8da51951205394ba050fe6f867bfc00d7244');
 assert.ok(sourceSvg().includes('Meridian Bay: fragmento del borde de la bahía'));
 assert.ok(!sourceSvg().includes('data-map-id='));
});

test('11 reviewed SVG polygons match exactly 1 water body, 4 zoning and 6 building candidates',()=>{
 const svg=reviewedSvg(),p=reviewed(),all=polys(svg);
 assert.equal(all.length,11);
 const byId=new Map(all.map(x=>[x.id,x]));
 assert.equal(byId.size,11);
 const sea=[...p.proposed_coast.shoreline].reverse().concat([
  {x:p.study_box.x_max,y:p.study_box.y_min},
  {x:p.study_box.x_max,y:p.study_box.y_max}
 ]);
 assertPixelShape(byId.get('HC-WATER'),sea,'HC-WATER');
 for(const shape of [...p.land_use_patches,...p.building_footprints])
  assertPixelShape(byId.get(shape.id),shape.polygon,shape.id);
 assert.deepEqual([...byId.keys()],['HC-WATER',
  ...p.land_use_patches.map(x=>x.id),...p.building_footprints.map(x=>x.id)]);
});

test('seven SVG polylines match 16 shoreline vertices and all 6 draft street alignments',()=>{
 const svg=reviewedSvg(),p=reviewed(),all=lines(svg);
 assert.equal(all.length,7);
 const byId=new Map(all.map(x=>[x.id,x]));
 assert.equal(byId.size,7);
 assertPixelShape(byId.get('HC-COAST'),p.proposed_coast.shoreline,'HC-COAST');
 for(const feature of p.street_alignments)
  assertPixelShape(byId.get(feature.id),feature.points,feature.id);
 assert.deepEqual([...byId.keys()],['HC-COAST',...p.street_alignments.map(x=>x.id)]);
});

test('only the freight-zone polygon differs geometrically from the historic source',()=>{
 const current=reviewed(),old=original();
 const c=current.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 const o=old.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 assert.equal(c.polygon.length,9);
 assert.equal(o.polygon.length,7);
 assert.deepEqual(c.polygon.slice(3,5),[{x:71.8,y:34.6},{x:72.02,y:35.1}]);
 assert.equal(polys(reviewedSvg()).find(x=>x.id==='HC-Z-FREIGHT').points.length,9);
 assert.equal([...sourceSvg().matchAll(/<polygon\s+points="([^"]+)"/g)][2][1].trim().split(/\s+/).length,7);
 const restored=structuredClone(current);delete restored.review_2026_11_20;
 restored.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon=structuredClone(o.polygon);
 assert.deepEqual(restored,old);
});

test('revised SVG exposes noncanonical status and immutable provenance in embedded metadata',()=>{
 const svg=reviewedSvg();
 assert.ok(svg.includes('borrador no canónico'));
 assert.ok(svg.includes('data-original-svg-git-blob="56e6ba7a830fdc53e6dcff205871b3af57e7c04e"'));
 assert.ok(svg.includes('data-original-json-git-blob="81ef8da51951205394ba050fe6f867bfc00d7244"'));
 assert.ok(svg.includes('data-admitted="false"'));
 assert.ok(svg.includes('accesos físicos no verificados'));
 assert.ok(!svg.includes('data-admitted="true"'));
});

test('renderer is idempotent and does not write or change the immutable source when called',()=>{
 const historicBefore=blob(raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg'));
 const reviewBefore=blob(raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.svg'));
 assert.equal(renderHarborCoastReviewSvg(),renderHarborCoastReviewSvg());
 assert.equal(verifyHarborCoastReviewSvg(),true);
 assert.equal(blob(raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg')),historicBefore);
 assert.equal(blob(raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.svg')),reviewBefore);
});

test('existing city map, world graph and story stay unchanged by SVG verification',()=>{
 const state=raw('../game/STATE.json'),before=blob(state);
 const d=read('../game/STATE.json');
 assert.equal(d.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(d.pending.type,'await_player_action');
 assert.deepEqual(d.world.locations['LOC-HARBOR-WALK'].connected_ids,
  ['LOC-CROSSWATER-PLAZA','LOC-COMMERCIAL-DISTRICT']);
 assert.equal(verifyHarborCoastReviewSvg(),true);
 assert.equal(blob(raw('../game/STATE.json')),before);
});
