import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMarketBusinessFrontage,previewMarketBusinessFrontage} from '../tools/meridian_bay_market_business_frontage.mjs';
import {validateMarketCultureFrontage} from '../tools/meridian_bay_market_culture_frontage.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_MARKET_BUSINESS_FRONTAGE_20261116.json');

test('business-offices arcade remains a prepared but unadmitted site',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 assert.equal(validateMarketBusinessFrontage({state:s}),true);
 assert.equal(Object.hasOwn(s.world.locations,'LOC-MARKET-BUSINESS-OFFICES'),false);
 assert.equal(plan().status,'draft_unadmitted');
 assert.equal(JSON.stringify(s),before);
});
test('exactly three ordered in-between spans and two-sided frontage descriptions',()=>{
 const s=checkpoint(),d=plan();
 assert.equal(validateMarketBusinessFrontage({state:s}),true);
 assert.deepEqual(d.nodes.map(n=>n.xy),[
  {x:58,y:43},{x:58.04,y:42.74},{x:58.17,y:42.42},{x:58.3,y:42.1}]);
 assert.deepEqual(d.links.map(x=>x.from),d.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(d.links.map(x=>x.to),d.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(d.links.map(x=>x.band),d.bands.map(x=>x.id));
 assert.ok(d.bands.every(x=>x.side_a&&x.side_b));
});
test('bidirectional preview has no live navigation or fictional time effects',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 const a=previewMarketBusinessFrontage({state:s,fromId:'MB-MBO-N0',toId:'MB-MBO-N3'});
 const b=previewMarketBusinessFrontage({state:s,fromId:'MB-MBO-N3',toId:'MB-MBO-N0'});
 assert.deepEqual(a.nodeIds,['MB-MBO-N0','MB-MBO-N1','MB-MBO-N2','MB-MBO-N3']);
 assert.deepEqual(a.linkIds,['MB-MBO-L1','MB-MBO-L2','MB-MBO-L3']);
 assert.deepEqual(b.nodeIds,[...a.nodeIds].reverse());
 assert.deepEqual(b.linkIds,[...a.linkIds].reverse());
 assert.deepEqual(b.bandIds,[...a.bandIds].reverse());
 for(const x of [a,b]){
  assert.equal(x.status,'proposed_connected');
  assert.equal(x.canonicalNavigationAuthorized,false);
  assert.equal(x.walkingMinutes,null);
  assert.equal(x.playerMoved,false);
  assert.equal(x.npcsMoved,false);
  assert.equal(x.storyTimeAdvanced,false);
  assert.equal(x.playerKnowledgeChanged,false);
 }
 assert.equal(JSON.stringify(s),before);
});
test('prepared arcade cannot acquire staff, occupants, contracts or opening hours from plan',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 const site=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json')
  .places.find(x=>x.id==='LOC-MARKET-BUSINESS-OFFICES');
 assert.equal(site.related_actor_id,null);
 assert.equal(site.opening_hours,null);
 const out=previewMarketBusinessFrontage({state:s,fromId:'MB-MBO-N0',toId:'MB-MBO-N3'});
 assert.equal(out.staffConfirmed,false);
 assert.equal(out.companiesConfirmed,false);
 assert.equal(out.siteOpenNow,false);
 assert.equal(out.siteAdmitted,false);
 assert.equal(JSON.stringify(s),before);
});
test('other Market Row sites never become a back-door shortcut',()=>{
 const s=checkpoint();
 for(const target of ['LOC-CAFE-BRUMA','LOC-MARKET-DELIVERY-POINT','LOC-MARKET-CULTURE-PASSAGE']){
  const x=previewMarketBusinessFrontage({state:s,fromId:'MB-MBO-N0',toId:target});
  assert.equal(x.status,'outside_this_draft');
  assert.equal(x.nodeIds,null);
 }
 assert.ok(plan().nodes.slice(1,-1).every(x=>x.location_id===null));
});
test('missing parent street world location rejects frontage validation',()=>{
 const s=checkpoint();
 delete s.world.locations['LOC-COMMERCIAL-DISTRICT'];
 assert.throws(()=>validateMarketBusinessFrontage({state:s}),Error);
});
test('preexisting cultural passage and delivery sections remain valid',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 assert.equal(validateMarketCultureFrontage({state:s}),true);
 assert.equal(validateMarketBusinessFrontage({state:s}),true);
 assert.equal(plan().map_guards.all_prior_routes_preserved,true);
 assert.equal(JSON.stringify(s),before);
});
