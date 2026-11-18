import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 loadCoastalFragment,auditCoastRegion,auditCoastSeam,
 renderCoastRegionSvg,verifyCoastalBlueprints
} from '../tools/meridian_bay_coastal_blueprints.mjs';
const one=()=>loadCoastalFragment(1),two=()=>loadCoastalFragment(2);
const cross=(a,b,c,d)=>{
 const o=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 return o(a,b,c)*o(a,b,d)<-1e-7&&o(c,d,a)*o(c,d,b)<-1e-7;
};
test('two adjoining regional blueprints have valid land geometry and no active road through buildings',()=>{
 assert.deepEqual(auditCoastRegion(one()),[]);
 assert.deepEqual(auditCoastRegion(two()),[]);
});
test('shoreline join is exact, from (75.1,42), without an invented bridge or new playable route',()=>{
 const f1=one(),f2=two();
 assert.deepEqual(f1.proposed_coast.shoreline.at(-1),{x:75.1,y:42});
 assert.deepEqual(f2.proposed_coast.shoreline[0],{x:75.1,y:42});
 assert.deepEqual(auditCoastSeam(f1,f2),[]);
 assert.ok(f2.street_alignments.every(r=>r.registered_as_new_story_link===false));
});
test('each designed region is a physical patch with buildings and several separate street alignments',()=>{
 const f1=one(),f2=two();
 assert.equal(f1.land_use_patches.length,4);
 assert.equal(f1.building_footprints.length,6);
 assert.equal(f2.land_use_patches.length,6);
 assert.equal(f2.building_footprints.length,10);
 assert.equal(f2.street_alignments.length,7);
 assert.equal(f2.proposed_coast.shoreline.length,22);
 assert.equal(f2.study_box.y_min,f1.study_box.y_max);
});
test('all coastal SVGs are byte-identical to deterministic authored JSON drawings',()=>{
 assert.deepEqual(verifyCoastalBlueprints(),[]);
 for(const n of [1,2]){
  const id=String(n).padStart(2,'0');
  const s=readFileSync(new URL('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_'+id+'_20261117.svg',import.meta.url),'utf8');
  assert.equal(s,renderCoastRegionSvg(loadCoastalFragment(n)));
  assert.match(s,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(s,/NO ES CANON JUGABLE/);
 }
});
test('regression: damaged shoreline seam is rejected before neighboring pieces are assembled',()=>{
 const a=one(),b=two();
 b.proposed_coast.shoreline[0].x+=0.3;
 assert.ok(auditCoastSeam(a,b).some(msg=>/Shoreline seam discontinuity/.test(msg)));
});
test('regression: a candidate building moved into the bay is rejected',()=>{
 const a=two();
 a.building_footprints[0].polygon[0].x=81.5;
 assert.ok(auditCoastRegion(a).some(msg=>msg.includes('Geometry in water')));
});
test('regression: modern street cutting through existing building fails',()=>{
 const a=two(),r=a.street_alignments.find(x=>x.id==='HN-A-NEW');
 r.points.splice(3,2,{x:73.25,y:45.58},{x:73.68,y:45.62});
 assert.ok(auditCoastRegion(a).some(msg=>/Road (crosses|within) building/.test(msg)));
});
test('regression: duplicate IDs, newly routable streets and unrestricted admission flags fail closed',()=>{
 const a=two();
 a.building_footprints[0].id=a.building_footprints[1].id;
 a.street_alignments[0].registered_as_new_story_link=true;
 a.limits.canonical_save_untouched=false;
 const problems=auditCoastRegion(a);
 assert.ok(problems.some(s=>s.includes('Duplicate id')));
 assert.ok(problems.some(s=>s.includes('New playable route')));
 assert.ok(problems.some(s=>s.includes('No explicit story save protection')));
});
test('historical blocked trace intentionally underlies a later building, but is NOT navigable',()=>{
 const a=two(),r=a.street_alignments.find(x=>x.id==='HN-A-TRACE'),b=a.building_footprints.find(x=>x.id==='HN-B-08');
 assert.equal(r.mode,'blocked_remnant');
 assert.equal(r.registered_as_new_story_link,false);
 assert.equal(a.review_corrections.historic_blocked_trace_overbuilding_intentional,true);
 assert.ok(r.points.slice(0,-1).some((pt,i)=>b.polygon.some((q,j)=>cross(pt,r.points[i+1],q,b.polygon[(j+1)%b.polygon.length]))));
 assert.deepEqual(auditCoastRegion(a),[]);
});
test('two known approaches to Harbor Walk stay distinct in the first region',()=>{
 const a=one(),m=a.street_alignments.find(x=>x.id==='HC-A-MARKET'),p=a.street_alignments.find(x=>x.id==='HC-A-PLAZA');
 assert.notDeepEqual(m.points[0],p.points[0]);
 assert.deepEqual(m.points.at(-1),p.points.at(-1));
 assert.deepEqual(m.points.at(-1),{x:71,y:37});
 assert.equal(m.source,'preexisting_connection');
 assert.equal(p.source,'preexisting_connection');
});
test('regional map drafts do not edit the story state or become a global playable city',()=>{
 const a=one(),b=two(),manifest=JSON.parse(readFileSync(new URL('../game/SAVE_MANIFEST.json',import.meta.url),'utf8'));
 assert.equal(manifest.last_completed_turn,9);
 assert.equal(a.limits.no_canonical_story_change,true);
 assert.equal(b.limits.canonical_save_untouched,true);
 assert.equal(b.limits.no_new_travel_routes_in_saved_state,true);
 assert.equal(b.status,'editable_fragment_draft_not_admitted_to_saved_world');
 assert.equal(b.study_box.cardinal_orientation_known,false);
 assert.ok(b.reference_anchors.every(x=>!x.id.startsWith('LOC-')));
});
