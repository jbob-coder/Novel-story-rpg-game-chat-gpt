import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const crosswalk=()=>read('../docs/01_world/MERIDIAN_BAY_ATLAS_PREBUILT_CROSSWALK_20261112.json');
const prebuilt=()=>read('../game/MERIDIAN_BAY_PREBUILT.json');
const checkpoint=()=>read('../game/STATE.json');

test('atlas reconciliation enumerates thirteen unique historical draft references',()=>{
 const c=crosswalk();
 assert.equal(c.authority,'integration_review_only_not_story_canon');
 assert.equal(c.draft_references.length,13);
 assert.equal(c.atlas_source.draft_reference_count,13);
 assert.equal(c.atlas_source.blob_sha,'f30efb2ef27469d3375d693db2f1b48849de4fac');
 assert.equal(new Set(c.draft_references.map(x=>x.draft_id)).size,13);
 assert.deepEqual(c.draft_references.map(x=>x.draft_id),[
  'MB-DES-RAIL-01','MB-DES-RAIL-02','MB-DES-RAIL-03','MB-DES-RAIL-04',
  'MB-DES-MARKET-01','MB-DES-MARKET-02','MB-DES-MARKET-03','MB-DES-MARKET-04',
  'MB-DES-CROSS-01','MB-DES-CROSS-02','MB-DES-TERM-01',
  'MB-DES-HARBOR-01','MB-DES-HARBOR-02']);
});
test('only two draft references have confirmed authored-design identity',()=>{
 const c=crosswalk(),p=prebuilt();
 const refs=c.draft_references.filter(x=>x.relationship==='same_site_in_prebuilt_design');
 assert.deepEqual(refs.map(x=>x.prebuilt_location_id),[
  'LOC-RAILGARDEN-ABARROTES','LOC-MARKET-NOAH-REPAIR']);
 for(const x of refs) {
  const place=p.places.find(y=>y.id===x.prebuilt_location_id);
  assert.ok(place);
  assert.equal(place.parent_id,x.anchor_id);
 }
 assert.equal(c.prebuilt_source.world_design_id,p.world_design_id);
 assert.equal(c.prebuilt_source.authored_location_count,p.places.length);
});
test('related services are NOT aliases and cannot create duplicate addresses',()=>{
 const c=crosswalk(),p=prebuilt();
 const delivery=c.draft_references.find(x=>x.draft_id==='MB-DES-MARKET-02');
 assert.equal(delivery.relationship,'related_but_not_equivalent');
 assert.equal(delivery.prebuilt_location_id,'LOC-MARKET-DELIVERY-POINT');
 assert.match(delivery.reason,/identity is NOT established/);
 const formal=c.draft_references.filter(x=>x.relationship==='same_site_in_prebuilt_design');
 assert.ok(formal.every(x=>!formal.some(y=>x!==y&&y.prebuilt_location_id===x.prebuilt_location_id)));
 const none=c.draft_references.filter(x=>!['same_site_in_prebuilt_design','related_but_not_equivalent'].includes(x.relationship));
 assert.ok(none.every(x=>x.prebuilt_location_id===null));
 assert.deepEqual(new Set(c.prebuilt_without_direct_draft_identity),new Set(
  p.places.map(x=>x.id).filter(id=>!formal.some(x=>x.prebuilt_location_id===id))));
});
test('district references match original checkpoint and do not create play events',()=>{
 const c=crosswalk(),s=checkpoint();
 for(const entry of c.draft_references){
  assert.ok(Object.hasOwn(s.world.locations,entry.anchor_id));
  assert.ok(entry.reason.length>15);
  if(entry.relationship==='unmapped_reference')
   assert.equal(entry.prebuilt_location_id,null);
 }
 assert.equal(c.rules.no_automatic_promotion_of_pending_sites,true);
 assert.equal(c.rules.never_treat_related_concept_as_same_location,true);
 assert.equal(c.rules.do_not_infer_player_knowledge,true);
 assert.equal(c.rules.no_scene_turn_or_time_effect,true);
 assert.equal(s.save.last_verified_turn,9);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
});
