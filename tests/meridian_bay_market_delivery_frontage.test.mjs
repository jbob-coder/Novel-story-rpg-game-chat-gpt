import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMarketDeliveryFrontage,
 previewMarketDeliveryFrontage} from '../tools/meridian_bay_market_delivery_frontage.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_MARKET_DELIVERY_FRONTAGE_20261116.json');

test('one prepared delivery frontage stays outside the playable saved world',()=>{
 const s=checkpoint(),before=JSON.stringify(s),p=plan();
 assert.equal(validateMarketDeliveryFrontage({state:s}),true);
 assert.equal(Object.hasOwn(s.world.locations,'LOC-MARKET-DELIVERY-POINT'),false);
 assert.equal(p.endpoints.canonical_admission_required_for_live_travel,true);
 assert.equal(JSON.stringify(s),before);
});

test('the short approach has three contiguous segments and matching frontage bands',()=>{
 const s=checkpoint(),p=plan();
 assert.equal(validateMarketDeliveryFrontage({state:s}),true);
 assert.equal(p.provisional_geometry.nodes.length,4);
 assert.equal(p.provisional_geometry.links.length,3);
 assert.equal(p.provisional_geometry.frontage_bands.length,3);
 assert.deepEqual(p.provisional_geometry.links.map(x=>x.from),
  p.provisional_geometry.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(p.provisional_geometry.links.map(x=>x.to),
  p.provisional_geometry.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(p.provisional_geometry.links.map(x=>x.frontage_band_id),
  p.provisional_geometry.frontage_bands.map(x=>x.id));
});

test('preview shows in-between path both ways but does not act or expose a visit',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 const f=previewMarketDeliveryFrontage({state:s,fromId:'MB-MD-N0',toId:'MB-MD-N3'});
 const b=previewMarketDeliveryFrontage({state:s,fromId:'MB-MD-N3',toId:'MB-MD-N0'});
 assert.deepEqual(f.nodeIds,['MB-MD-N0','MB-MD-N1','MB-MD-N2','MB-MD-N3']);
 assert.deepEqual(f.linkIds,['MB-MD-L1','MB-MD-L2','MB-MD-L3']);
 assert.deepEqual(b.nodeIds,[...f.nodeIds].reverse());
 assert.deepEqual(b.linkIds,[...f.linkIds].reverse());
 for(const item of [f,b]){
  assert.equal(item.status,'proposed_connected');
  assert.equal(item.canonicalNavigationAuthorized,false);
  assert.equal(item.walkingMinutes,null);
  assert.equal(item.playerMoved,false);
  assert.equal(item.npcsMoved,false);
  assert.equal(item.playerKnowledgeChanged,false);
  assert.equal(item.fictionalTimeAdvanced,false);
  assert.equal(item.ownerVisitRecorded,false);
 }
 assert.equal(JSON.stringify(s),before);
});

test('Darius is not assigned, with no package, staff, hours or opening claim',()=>{
 const s=checkpoint(),before=JSON.stringify(s),p=plan();
 const original=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json')
  .places.find(x=>x.id==='LOC-MARKET-DELIVERY-POINT');
 assert.equal(original.related_actor_id,null);
 assert.equal(original.opening_hours,null);
 assert.equal(original.travel_minutes,null);
 assert.equal(p.narrative_constraints.actor_darius_not_assigned_to_this_specific_site,true);
 const x=previewMarketDeliveryFrontage({state:s,fromId:'MB-MD-N1',toId:'MB-MD-N3'});
 assert.equal(x.staffConfirmed,false);
 assert.equal(x.deliveriesConfirmed,false);
 assert.equal(x.publicSiteOpenNow,false);
 assert.equal(JSON.stringify(s),before);
});

test('off-corridor places do not become new shortcuts or public exits',()=>{
 const s=checkpoint();
 for(const dest of ['LOC-CAFE-BRUMA','LOC-MARKET-CULTURE-PASSAGE','LOC-HARBOR-WALK']){
  const out=previewMarketDeliveryFrontage({state:s,fromId:'MB-MD-N0',toId:dest});
  assert.equal(out.status,'outside_this_draft');
  assert.equal(out.nodeIds,null);
 }
 assert.ok(plan().provisional_geometry.nodes.slice(1,-1)
  .every(x=>x.location_id===null));
});

test('if the prepared parent link disappears, the draft is rejected',()=>{
 const s=checkpoint();
 const before=JSON.stringify(s);
 assert.equal(validateMarketDeliveryFrontage({state:s}),true);
 // Prepared site has no independently saved journal authority; deleting the
 // parent location in a test must not yield a usable route.
 delete s.world.locations['LOC-COMMERCIAL-DISTRICT'];
 assert.throws(()=>validateMarketDeliveryFrontage({state:s}),
  /Unverified road or invented shortcut|Story route contradicts|Cannot read|Unknown|missing/i);
 assert.notEqual(JSON.stringify(s),before);
});

test('the full inherited road detail remains valid, independent of storefront draft',()=>{
 const s=checkpoint();
 assert.equal(validateMarketDeliveryFrontage({state:s}),true);
 assert.equal(plan().verification.no_branch_merges,true);
 assert.equal(plan().verification.no_canonical_state_changes,undefined);
 assert.equal(plan().verification.no_store_admission_without_valid_journal,true);
});
