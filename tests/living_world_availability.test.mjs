import test from "node:test";
import assert from "node:assert/strict";
import {AVAILABILITY,LINKS,connected,shortestRoute,availability} from "../tools/living_world_availability.mjs";
test("established connections are bidirectional",()=>{assert.equal(connected("LOC-RAILGARDEN-RESIDENTIAL","LOC-COMMERCIAL-DISTRICT"),true);assert.equal(connected("LOC-COMMERCIAL-DISTRICT","LOC-RAILGARDEN-RESIDENTIAL"),true)});
test("unestablished direct link rejected",()=>assert.equal(connected("LOC-WILSON-WORKSHOP","LOC-CROSSWATER-PLAZA"),false));
test("route uses only established links",()=>assert.deepEqual(shortestRoute("LOC-WILSON-WORKSHOP","LOC-TRANSIT-TERMINAL"),["LOC-WILSON-WORKSHOP","LOC-WILSON-APARTMENT","LOC-RAILGARDEN-RESIDENTIAL","LOC-COMMERCIAL-DISTRICT","LOC-CROSSWATER-PLAZA","LOC-TRANSIT-TERMINAL"]));
test("unreachable destination",()=>assert.equal(shortestRoute("LOC-WILSON-WORKSHOP","LOC-UNKNOWN"),null));
test("unspecified schedule remains unknown",()=>assert.equal(availability().status,AVAILABILITY.UNKNOWN));
test("unconfirmed schedule cannot assert closed",()=>assert.equal(availability({schedule:{confirmed:false,weekdays:{"1":[[540,1020]]}},weekday:1,minute:600}).status,AVAILABILITY.UNKNOWN));
test("confirmed schedule evaluates open and closed",()=>{const schedule={confirmed:true,weekdays:{"0":[],"1":[[540,1020]]}};assert.equal(availability({schedule,weekday:1,minute:600}).status,AVAILABILITY.OPEN);assert.equal(availability({schedule,weekday:1,minute:1100}).status,AVAILABILITY.CLOSED)});
test("missing weekday stays unknown",()=>assert.equal(availability({schedule:{confirmed:true,weekdays:{"1":[]}},weekday:2,minute:600}).status,AVAILABILITY.UNKNOWN));
test("confirmed exception overrides schedule",()=>assert.deepEqual(availability({exception:{confirmed:true,status:"closed"}}),{status:"closed",source:"confirmed_exception"}));
test("unconfirmed exception does not override",()=>assert.equal(availability({exception:{confirmed:false,status:"closed"}}).status,AVAILABILITY.UNKNOWN));
test("invalid intervals cannot establish availability",()=>assert.equal(availability({schedule:{confirmed:true,weekdays:{"1":[[1000,500]]}},weekday:1,minute:600}).status,AVAILABILITY.UNKNOWN));
test("invalid minute stays unknown",()=>assert.equal(availability({schedule:{confirmed:true,weekdays:{"1":[]}},weekday:1,minute:1440}).status,AVAILABILITY.UNKNOWN));
test("malformed null interval yields unknown instead of throwing",()=>assert.equal(availability({schedule:{confirmed:true,weekdays:{"1":[null]}},weekday:1,minute:600}).status,AVAILABILITY.UNKNOWN));
test("unknown identical locations are not valid routes",()=>assert.equal(shortestRoute("LOC-UNKNOWN","LOC-UNKNOWN"),null));
test("known identical location is a zero-hop route",()=>assert.deepEqual(shortestRoute("LOC-CROSSWATER-PLAZA","LOC-CROSSWATER-PLAZA"),["LOC-CROSSWATER-PLAZA"]));
test("narrative relative day cannot impersonate weekday",()=>assert.equal(availability({schedule:{confirmed:true,weekdays:{"1":[[540,1020]]}},weekday:-29,minute:600}).status,AVAILABILITY.UNKNOWN));
test("schedule requires explicit weekday not story day",()=>assert.equal(availability({schedule:{confirmed:true,weekdays:{"1":[[540,1020]]}},day:1,minute:600}).status,AVAILABILITY.UNKNOWN));
test("confirmed schedule respects interval boundaries",()=>{const schedule={confirmed:true,weekdays:{"0":[],"1":[[540,1020]]}};assert.equal(availability({schedule,weekday:1,minute:540}).status,AVAILABILITY.OPEN);assert.equal(availability({schedule,weekday:1,minute:1020}).status,AVAILABILITY.CLOSED)});

test("Café Bruma is reachable using only confirmed world connections",()=>{
 assert.equal(connected("LOC-COMMERCIAL-DISTRICT","LOC-CAFE-BRUMA"),true);
 assert.deepEqual(shortestRoute("LOC-WILSON-WORKSHOP","LOC-CAFE-BRUMA"),[
  "LOC-WILSON-WORKSHOP","LOC-WILSON-APARTMENT",
  "LOC-RAILGARDEN-RESIDENTIAL","LOC-COMMERCIAL-DISTRICT","LOC-CAFE-BRUMA"]);
});
test("confirmed overnight shift carries across calendar midnight",()=>{
 const schedule={confirmed:true,weekdays:{"0":[],"1":[[1320,1560]],"2":[]}};
 assert.equal(availability({schedule,weekday:1,minute:1410}).status,AVAILABILITY.OPEN);
 assert.equal(availability({schedule,weekday:2,minute:90}).status,AVAILABILITY.OPEN);
 assert.equal(availability({schedule,weekday:2,minute:120}).status,AVAILABILITY.CLOSED);
});
test("confirmed Sunday overnight hours carry into Monday",()=>{
 const schedule={confirmed:true,weekdays:{"0":[[1380,1500]],"1":[],"6":[]}};
 assert.equal(availability({schedule,weekday:1,minute:59}).status,AVAILABILITY.OPEN);
 assert.equal(availability({schedule,weekday:1,minute:60}).status,AVAILABILITY.CLOSED);
});
test("missing previous weekday does not falsely assert closed",()=>{
 const schedule={confirmed:true,weekdays:{"2":[]}};
 assert.deepEqual(availability({schedule,weekday:2,minute:90}),
  {status:AVAILABILITY.UNKNOWN,source:"day_not_documented"});
});
test("a documented empty previous weekday permits closed",()=>{
 const schedule={confirmed:true,weekdays:{"1":[],"2":[]}};
 assert.equal(availability({schedule,weekday:2,minute:90}).status,AVAILABILITY.CLOSED);
});
test("invalid reversed and longer-than-a-day shifts remain unknown",()=>{
 for(const bad of [[1000,500],[700,2141],[0,2880],[-1,100]])
  assert.equal(availability({schedule:{confirmed:true,weekdays:{"0":[],"1":[bad]}},weekday:1,minute:600}).status,AVAILABILITY.UNKNOWN);
});
test("invalid prior-day schedule cannot be used to infer closed",()=>{
 const schedule={confirmed:true,weekdays:{"1":[[1200,500]],"2":[]}};
 assert.equal(availability({schedule,weekday:2,minute:120}).status,AVAILABILITY.UNKNOWN);
});
test("no canonical weekday or clock means even overnight proposals remain unknown",()=>{
 const schedule={confirmed:true,weekdays:{"0":[],"1":[[1320,1560]],"2":[]}};
 assert.equal(availability({schedule,weekday:null,minute:null}).status,AVAILABILITY.UNKNOWN);
});
