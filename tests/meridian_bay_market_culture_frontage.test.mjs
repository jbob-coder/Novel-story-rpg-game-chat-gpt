import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMarketCultureFrontage,
 previewMarketCultureFrontage} from '../tools/meridian_bay_market_culture_frontage.mjs';
import {validateMarketDeliveryFrontage} from '../tools/meridian_bay_market_delivery_frontage.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_MARKET_CULTURE_FRONTAGE_20261116.json');

test('cultural passage is a prepared location, not in the canonical saved world',()=>{
 const state=checkpoint(),before=JSON.stringify(state);
 assert.equal(validateMarketCultureFrontage({state}),true);
 assert.equal(Object.hasOwn(state.world.locations,'LOC-MARKET-CULTURE-PASSAGE'),false);
 assert.equal(plan().endpoints.prepared_only_not_live_world,true);
 assert.equal(JSON.stringify(state),before);
});

test('the cultural approach contains exactly three continuous links and three frontages',()=>{
 const state=checkpoint(),p=plan();
 assert.equal(validateMarketCultureFrontage({state}),true);
 assert.equal(p.nodes.length,4);
 assert.equal(p.links.length,3);
 assert.equal(p.frontage_bands.length,3);
 assert.deepEqual(p.links.map(x=>x.from),p.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(p.links.map(x=>x.to),p.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(p.links.map(x=>x.band_id),p.frontage_bands.map(x=>x.id));
 assert.ok(p.frontage_bands.every(x=>x.side_a&&x.side_b&&x.actual_buildings_confirmed===false));
});

test('forward and reverse previews traverse the exact in-between positions without movement',()=>{
 const state=checkpoint(),before=JSON.stringify(state);
 const a=previewMarketCultureFrontage({state,fromId:'MB-MCULT-N0',toId:'MB-MCULT-N3'});
 const b=previewMarketCultureFrontage({state,fromId:'MB-MCULT-N3',toId:'MB-MCULT-N0'});
 assert.deepEqual(a.nodeIds,['MB-MCULT-N0','MB-MCULT-N1','MB-MCULT-N2','MB-MCULT-N3']);
 assert.deepEqual(a.linkIds,['MB-MCULT-L1','MB-MCULT-L2','MB-MCULT-L3']);
 assert.deepEqual(b.nodeIds,[...a.nodeIds].reverse());
 assert.deepEqual(b.linkIds,[...a.linkIds].reverse());
 assert.deepEqual(b.bandIds,[...a.bandIds].reverse());
 for(const item of [a,b]){
  assert.equal(item.status,'proposed_connected');
  assert.equal(item.canonicalNavigationAuthorized,false);
  assert.equal(item.realWalkingMinutes,null);
  assert.equal(item.playerMoved,false);
  assert.equal(item.npcsMoved,false);
  assert.equal(item.playerKnowledgeChanged,false);
  assert.equal(item.fictionalTimeAdvanced,false);
  assert.equal(item.playableLocationAdmitted,false);
 }
 assert.equal(JSON.stringify(state),before);
});

test('Elena, a gallery opening, its staff, and operating hours are not invented',()=>{
 const state=checkpoint(),p=plan(),before=JSON.stringify(state);
 const prepared=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json')
  .places.find(x=>x.id==='LOC-MARKET-CULTURE-PASSAGE');
 assert.equal(prepared.related_actor_id,null);
 assert.equal(prepared.opening_hours,null);
 assert.equal(prepared.travel_minutes,null);
 assert.equal(p.story_safety.no_elena_visit_or_art_exhibition_established,true);
 const preview=previewMarketCultureFrontage({state,fromId:'MB-MCULT-N0',toId:'MB-MCULT-N3'});
 assert.equal(preview.elenaPresent,false);
 assert.equal(preview.activeExhibitionConfirmed,false);
 assert.equal(preview.staffAssigned,false);
 assert.equal(preview.publicSiteOpenNow,false);
 assert.equal(JSON.stringify(state),before);
});

test('the new frontage neither relocates Noah nor creates unintended shortcuts',()=>{
 const state=checkpoint();
 for(const dest of ['LOC-MARKET-NOAH-REPAIR','LOC-MARKET-DELIVERY-POINT',
  'LOC-CROSSWATER-PLAZA','LOC-MARKET-BUSINESS-OFFICES']){
  const p=previewMarketCultureFrontage({state,fromId:'MB-MCULT-N0',toId:dest});
  assert.equal(p.status,'outside_this_draft');
  assert.equal(p.nodeIds,null);
 }
 assert.ok(plan().nodes.slice(1,-1).every(x=>x.location_id===null &&
  !(x.id in state.world.locations)));
});

test('if the existing Market Row parent is unavailable validation fails closed',()=>{
 const state=checkpoint();
 delete state.world.locations['LOC-COMMERCIAL-DISTRICT'];
 assert.throws(()=>validateMarketCultureFrontage({state}),Error);
});

test('the delivery frontage remains independently valid on the same branch',()=>{
 const state=checkpoint(),before=JSON.stringify(state);
 assert.equal(validateMarketDeliveryFrontage({state}),true);
 assert.equal(validateMarketCultureFrontage({state}),true);
 assert.equal(plan().checks.preserve_delivery_frontage_without_relocation,true);
 assert.equal(JSON.stringify(state),before);
});
