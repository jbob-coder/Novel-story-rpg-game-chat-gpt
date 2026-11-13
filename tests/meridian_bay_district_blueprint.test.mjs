import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const map = () => read('../docs/01_world/MERIDIAN_BAY_DISTRICT_BLUEPRINT_20261112.json');
const checkpoint = () => read('../game/STATE.json');

test('prepared map is a draft distinct from played fiction and exact coordinates',()=>{
  const m=map();
  assert.equal(m.purpose,'world_preparation_before_player_visit');
  assert.equal(m.authority,'draft_design_not_in_canonical_checkpoint');
  assert.equal(m.geometry,'topological_only');
  assert.equal(m.coordinates,null);
  assert.equal(m.cardinal_directions_confirmed,false);
  assert.equal(m.new_canonical_locations,0);
  assert.equal(m.construction_rules.design_precedes_discovery,true);
  assert.equal(m.construction_rules.design_does_not_imply_player_knowledge,true);
  assert.equal(m.construction_rules.player_turn_not_advanced,true);
});
test('all eight prepared anchors exactly match checkpoint LOC entries and edges',()=>{
  const m=map(),state=checkpoint();
  const saved=Object.keys(state.world.locations).filter(id=>id.startsWith('LOC-')).sort();
  const ids=m.districts.map(d=>d.id);
  assert.deepEqual([...ids].sort(),saved);
  assert.equal(new Set(ids).size,8);
  for (const d of m.districts) {
    assert.deepEqual(d.confirmed_edges,state.world.locations[d.id].connected_ids);
    assert.ok(d.confirmed_edges.every(id=>saved.includes(id)));
    for(const next of d.confirmed_edges)
      assert.ok(state.world.locations[next].connected_ids.includes(d.id));
  }
  const undirected = new Set(m.districts.flatMap(d=>
    d.confirmed_edges.map(e=>[d.id,e].sort().join('|'))));
  assert.equal(undirected.size,8);
});
test('the design never treats city containment as a street or invents graph links',()=>{
  const m=map(),state=checkpoint();
  assert.equal(m.city_anchor_id,'CITY-MERIDIAN-BAY');
  assert.ok(m.districts.every(d=>!d.confirmed_edges.includes('CITY-MERIDIAN-BAY')));
  assert.deepEqual(state.world.locations['LOC-WILSON-WORKSHOP'].connected_ids,['LOC-WILSON-APARTMENT']);
  assert.deepEqual(state.world.locations['LOC-CAFE-BRUMA'].connected_ids,['LOC-COMMERCIAL-DISTRICT']);
});
test('thirteen designed sites are stable references, not phantom LOC places',()=>{
  const m=map(),state=checkpoint();
  assert.equal(m.prepared_sites.length,13);
  assert.equal(new Set(m.prepared_sites.map(p=>p.id)).size,m.prepared_sites.length);
  for (const p of m.prepared_sites) {
    assert.match(p.id,/^MB-DES-[A-Z]+-\d{2}$/);
    assert.equal(Object.hasOwn(state.world.locations,p.id),false);
    assert.equal(p.id.startsWith('LOC-'),false);
    assert.ok(m.districts.some(d=>d.id===p.anchor_id));
    assert.ok(p.relative_placement.length>15);
    assert.ok(p.role.length>15);
    assert.ok(p.access.length>5);
  }
  assert.equal(m.construction_rules.prepared_sites_are_not_routable,true);
  assert.equal(m.construction_rules.prepared_site_location_ids,null);
});
test('old characters and knowledge remain distinct from world preparation',()=>{
  const m=map();
  const noah=m.prepared_sites.find(p=>p.id==='MB-DES-MARKET-01');
  const school=m.prepared_sites.find(p=>p.id==='MB-DES-RAIL-04');
  assert.equal(noah.character_link,'NPC-006');
  assert.equal(noah.access,'business_access_unknown');
  assert.equal(school.character_link,'NPC-004');
  assert.equal(school.access,'route_unknown');
  assert.equal(m.construction_rules.actor_presence_not_implied,true);
  assert.equal(m.construction_rules.events_not_created,true);
});
test('loading map never alters real saved state or invents times or schedules',()=>{
  const state=checkpoint(),before=JSON.stringify(state),m=map();
  assert.equal(m.timing_rule,'travel_durations_not_established');
  assert.equal(m.scheduling_rule,'opening_hours_unknown');
  assert.equal(m.construction_rules.canon_integration_requires_review,true);
  assert.equal(JSON.stringify(state),before);
});

test('each prepared reference identifies its actual evidence class',()=>{
  const m=map();
  const groups=Object.groupBy(m.prepared_sites,p=>p.evidence_class);
  assert.equal(groups.proposed_site.length,9);
  assert.equal(groups.existing_subfeature.length,2);
  assert.equal(groups.existing_business_unmapped.length,1);
  assert.equal(groups.unmapped_reference_not_site.length,1);
  assert.ok(m.prepared_sites.every(p=>p.canonical_location_id===null));
  assert.ok(m.prepared_sites.every(p=>p.design_extension_approved===false));
  assert.ok(m.prepared_sites.every(p=>p.player_knowledge_status==='not_established'));
  assert.ok(groups.proposed_site.every(p=>p.source==='design_only'));
  assert.ok(groups.existing_subfeature.every(p=>p.source.startsWith('game/')));
  assert.equal(groups.existing_business_unmapped[0].character_link,'NPC-006');
  assert.equal(groups.unmapped_reference_not_site[0].character_link,'NPC-004');
});
test('preauthored locations do not require Jack to discover them before they exist',()=>{
  const m=map();
  assert.equal(m.metadata_review.draft_not_canon,true);
  assert.match(m.metadata_review.promotion_policy,/independent of Jack visiting/);
  assert.match(m.metadata_review.promotion_policy,/no unapproved design becomes canon/);
  assert.equal(m.construction_rules.design_precedes_discovery,true);
  assert.equal(m.construction_rules.actor_presence_not_implied,true);
});
