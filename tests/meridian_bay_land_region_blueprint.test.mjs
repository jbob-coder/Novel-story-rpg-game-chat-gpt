import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditLandRegion,loadLandRegionSources,renderLandRegionSvg,checkLandBlueprint} from '../tools/meridian_bay_land_region_blueprint.mjs';
const src=()=>loadLandRegionSources();
const audit=s=>auditLandRegion(s.f,s.adjacent,s.city,s.web,s.term);
const cross=(a,b,c,d)=>{const o=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return o(a,b,c)*o(a,b,d)<-1e-8&&o(c,d,a)*o(c,d,b)<-1e-8;};
test('inland third fragment connects only to already constructed neighboring coastal section',()=>{
 const s=src();
 assert.deepEqual(audit(s),[]);
 assert.equal(s.f.region_type,'land_only_no_water_or_new_shoreline');
 assert.equal(s.f.land_use_patches.length,6);
 assert.equal(s.f.building_footprints.length,12);
 assert.equal(s.f.street_alignments.length,8);
});
test('Market Row, plaza and terminal remain at exact original source coordinates',()=>{
 const s=src(),refs=Object.fromEntries(s.city.locations.map(q=>[q.id,q.reference_xy_units]));
 for(const a of s.f.source_existing_places)assert.deepEqual(a.xy,refs[a.id]);
 assert.deepEqual(s.f.source_existing_places.map(x=>x.id),[
  'LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL']);
});
test('Market Row to Crosswater link and terminal approach are inherited with no new story edges',()=>{
 const s=src(),m=s.f.street_alignments.find(r=>r.id==='MX-A-MARKET-PLAZA'),p=s.f.street_alignments.find(r=>r.id==='MX-A-PLAZA-TERM');
 const original=s.web.segments.find(x=>x.id==='MB-WEB-007');
 assert.deepEqual(m.points,[{x:58,y:43},...original.via_xy_units,{x:65,y:42}]);
 assert.deepEqual(p.points,s.term.nodes.map(x=>x.xy));
 for(const r of [m,p]){assert.equal(r.connection_known_in_saved_graph,true);assert.equal(r.traversable_in_saved_story,false);assert.equal(r.registered_as_new_story_link,false);}
});
test('physical road seams match inland and coastal endpoints exactly in overlapping narrow border',()=>{
 const s=src();
 for(const [id,source] of [['MX-A-OLD-SEAM','HN-A-OLD'],['MX-A-LATER-BYPASS','HN-A-NEW']]){
  const r=s.f.street_alignments.find(x=>x.id===id);
  const b=s.adjacent.street_alignments.find(x=>x.id===source);
  assert.deepEqual(r.points.at(-1),b.points[0]);
 }
 assert.deepEqual(audit(s),[]);
});
test('derived SVG is synchronized with source JSON and read-only validation',()=>{
 const s=src();
 assert.deepEqual(checkLandBlueprint(),[]);
 const svg=readFileSync(new URL('../docs/01_world/MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117.svg',import.meta.url),'utf8');
 assert.equal(svg,renderLandRegionSvg(s.f));
 assert.match(svg,/EMPALME/);
 assert.match(svg,/Market Row/);
});
test('candidate streets avoid building footprints and preserve layer differences',()=>{
 const s=src();
 assert.deepEqual(audit(s),[]);
 assert.ok(s.f.history_hypotheses.every(x=>x.design_only));
 assert.ok(s.f.building_footprints.every(x=>x.occupants_assigned===false&&x.interiors_defined===false));
 assert.ok(s.f.street_alignments.every(x=>x.verified_travel_minutes===null));
});
test('historical blocked street crossing later building is intentional and not a usable shortcut',()=>{
 const s=src(),r=s.f.street_alignments.find(x=>x.id==='MX-A-BLOCKED'),b=s.f.building_footprints.find(x=>x.id==='MX-B-05');
 assert.equal(r.mode,'blocked_historic_trace');
 assert.equal(r.traversable_in_saved_story,false);
 assert.ok(r.points.slice(0,-1).some((a,i)=>b.polygon.some((c,j)=>cross(a,r.points[i+1],c,b.polygon[(j+1)%b.polygon.length]))));
 assert.deepEqual(audit(s),[]);
});
test('an unauthorized route across a building must fail without rewriting the geometry',()=>{
 const s=src(),r=s.f.street_alignments.find(x=>x.id==='MX-A-LATER-BYPASS');
 r.points.splice(2,2,{x:64.4,y:47.55},{x:64.65,y:47.64});
 assert.ok(audit(s).some(x=>/Road (in|crosses) building/.test(x)));
});
test('source-based site placement or neighboring road seam corruption fails closed',()=>{
 const s=src();s.f.source_existing_places[1].xy.x=65.3;s.f.boundary_interfaces[0].point.x=67.5;
 const problems=audit(s);
 assert.ok(problems.some(x=>/anchor relocated/.test(x)));
 assert.ok(problems.some(x=>/seam mismatch/.test(x)));
});
test('a drawn route must not become a playable new link',()=>{
 const s=src();s.f.street_alignments[3].registered_as_new_story_link=true;s.f.street_alignments[0].traversable_in_saved_story=true;
 const problems=audit(s);assert.ok(problems.some(x=>/Invented playable link/.test(x)));assert.ok(problems.some(x=>/Sketch geometry must not become/.test(x)));
});
test('no character actions, school assignment or changes to five-file checkpoint',()=>{
 const s=src(),m=JSON.parse(readFileSync(new URL('../game/SAVE_MANIFEST.json',import.meta.url),'utf8'));
 assert.equal(m.last_completed_turn,9);
 assert.ok(Object.values(s.f.preservation_rules).every(v=>v===true));
 assert.ok(!JSON.stringify(s.f).includes('LOC-ELENA-SCHOOL-UNMAPPED'));
 assert.equal(s.f.status,'editable_fragment_not_saved_canon');
});
