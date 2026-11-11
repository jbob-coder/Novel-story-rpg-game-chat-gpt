import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUTINE_PROPOSALS, worldRoute, previewNPCRoutines, stageNPCResolution, visibleFacts} from '../tools/living_world_routines.mjs';

const makeState = () => ({
  chapter:{id:'CH-000'}, time:{day:-29,time_of_day:'morning',clock_time:null},
  player:{id:'PLAYER-001', location_id:'LOC-WILSON-WORKSHOP', knowledge:[]},
  world:{actors:Object.fromEntries(['NPC-001','NPC-002','NPC-003','NPC-004','NPC-005','NPC-006','NPC-007'].map(id=>[id,{id,goal:'Own goal',independent_plan:'Unresolved plan',location_id:id==='NPC-004'?'LOC-RAILGARDEN-RESIDENTIAL':id==='NPC-005'?'LOC-WILSON-APARTMENT':id==='NPC-007'?'LOC-CAFE-BRUMA':'LOC-COMMERCIAL-DISTRICT',knowledge:[]}])),
    locations:Object.fromEntries([
      ['LOC-WILSON-WORKSHOP',['LOC-WILSON-APARTMENT']],
      ['LOC-WILSON-APARTMENT',['LOC-WILSON-WORKSHOP','LOC-RAILGARDEN-RESIDENTIAL']],
      ['LOC-RAILGARDEN-RESIDENTIAL',['LOC-WILSON-APARTMENT','LOC-COMMERCIAL-DISTRICT']],
      ['LOC-COMMERCIAL-DISTRICT',['LOC-RAILGARDEN-RESIDENTIAL','LOC-CROSSWATER-PLAZA','LOC-CAFE-BRUMA']],
      ['LOC-CAFE-BRUMA',['LOC-COMMERCIAL-DISTRICT']],
      ['LOC-CROSSWATER-PLAZA',['LOC-COMMERCIAL-DISTRICT','LOC-TRANSIT-TERMINAL']],
      ['LOC-TRANSIT-TERMINAL',['LOC-CROSSWATER-PLAZA']],
      ['CITY-MERIDIAN-BAY',['LOC-WILSON-WORKSHOP','LOC-CROSSWATER-PLAZA']]
    ].map(([id,connected_ids])=>[id,{connected_ids}]))}
});
const defaultArgs = state => ({state,actorIds:['NPC-004','NPC-005'],elapsedMinutes:15});
const makeResolution = state => ({state,actorId:'NPC-005',eventId:'EV-000030',turn:10,day:-29,outcome:'Rosa decides to visit a neighbor after preparing the clock.',changes:[{field:'independent_plan',before:'Unresolved plan',after:'Prepare a neighbor visit'}]});

test('templates contain seven existing NPCs',()=>assert.deepEqual(ROUTINE_PROPOSALS.map(p=>p.actorId),['NPC-001','NPC-002','NPC-003','NPC-004','NPC-005','NPC-006','NPC-007']));
test('existing graph computes workshop-to-terminal route',()=>assert.deepEqual(worldRoute(makeState(),'LOC-WILSON-WORKSHOP','LOC-TRANSIT-TERMINAL'),['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT','LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL']));
test('world graph never treats city group as shortcut',()=>assert.equal(worldRoute(makeState(),'CITY-MERIDIAN-BAY','LOC-CROSSWATER-PLAZA'),null));
test('unknown school cannot become a route',()=>assert.equal(worldRoute(makeState(),'LOC-RAILGARDEN-RESIDENTIAL','LOC-SCHOOL'),null));
test('zero elapsed time produces no routine proposals',()=>assert.deepEqual(previewNPCRoutines({...defaultArgs(makeState()),elapsedMinutes:0}),[]));
test('no selected NPC means no offscreen progress',()=>assert.deepEqual(previewNPCRoutines({state:makeState(),actorIds:[],elapsedMinutes:30}),[]));
test('the two relevant NPCs receive proposals but no resolution',()=>{const items=previewNPCRoutines(defaultArgs(makeState()));assert.deepEqual(items.map(x=>x.actorId),['NPC-004','NPC-005']);assert.ok(items.every(x=>x.kind==='unresolved_proposal' && x.visibility==='narrator_private' && x.requiresCausalResolution));});
test('school and neighbor remain unmapped',()=>assert.ok(previewNPCRoutines(defaultArgs(makeState())).every(p=>p.destination===null && p.route===null)));
test('morning is a suggestion, not fixed attendance',()=>{const [a]=previewNPCRoutines({...defaultArgs(makeState()),actorIds:['NPC-007']});assert.equal(a.timing,'outside_suggested_period');assert.equal(a.availability,'unknown')});
test('confirmed override controls availability without claiming an event',()=>{const [p]=previewNPCRoutines({...defaultArgs(makeState()),actorIds:['NPC-007'],exceptions:{'NPC-007':{confirmed:true,status:'closed'}}});assert.equal(p.availability,'closed');assert.equal(p.kind,'unresolved_proposal');});
test('relative Day -29 is not a weekday',()=>{const [p]=previewNPCRoutines({...defaultArgs(makeState()),schedules:{'NPC-004':{confirmed:true,weekdays:{'1':[[540,1020]]}}},weekday:-29,minute:600});assert.equal(p.availability,'unknown')});
test('preview is read-only including actor plans and player knowledge',()=>{const state=makeState(),before=JSON.stringify(state);previewNPCRoutines(defaultArgs(state));assert.equal(JSON.stringify(state),before)});
test('staging an NPC event does not mutate state or claim persistence',()=>{const state=makeState(),before=JSON.stringify(state);const r=stageNPCResolution(makeResolution(state));assert.equal(r.status,'staged_only');assert.equal(r.persistRequired,true);assert.equal(r.event.actor_ids[0],'NPC-005');assert.deepEqual(r.event.state_changes,[]);assert.equal(JSON.stringify(state),before)});
test('staging rejects nonexistent NPC',()=>assert.throws(()=>stageNPCResolution({...makeResolution(makeState()),actorId:'NPC-999'}),/Unknown NPC/));
test('staging rejects cross-actor effects',()=>assert.throws(()=>stageNPCResolution({...makeResolution(makeState()),changes:[{actor_id:'PLAYER-001',field:'knowledge',fact:'Secret',source:'invented'}]}),/Cross-actor/));
test('unshared offscreen result invisible to Jack',()=>{const r=stageNPCResolution(makeResolution(makeState()));assert.deepEqual(visibleFacts(r,'PLAYER-001'),[]);assert.equal(r.event.known_to.includes('PLAYER-001'),false)});
test('only explicitly disclosed facts reach the matching viewer',()=>{const state=makeState();const r=stageNPCResolution({...makeResolution(state),disclosures:[{fact:'Rosa told Jack the clock has been repaired.',viewerIds:['PLAYER-001']},{fact:'A neighbor asked Rosa about another repair.',viewerIds:['NPC-004']}]});assert.deepEqual(visibleFacts(r,'PLAYER-001'),['Rosa told Jack the clock has been repaired.']);assert.deepEqual(visibleFacts(r,'NPC-004'),['A neighbor asked Rosa about another repair.']);assert.deepEqual(visibleFacts(r,'NPC-007'),[])});
test('invalid disclosure recipient rejected',()=>assert.throws(()=>stageNPCResolution({...makeResolution(makeState()),disclosures:[{fact:'Some valid narrative information',viewerIds:['NPC-999']}]}),/Disclosure/));
test('malformed saved adjacency is handled without crashing',()=>{const state=makeState();state.world.locations['LOC-WILSON-WORKSHOP'].connected_ids={oops:true};assert.equal(worldRoute(state,'LOC-WILSON-WORKSHOP','LOC-CROSSWATER-PLAZA'),null)});
test('invalid effects cannot be staged',()=>assert.throws(()=>stageNPCResolution({...makeResolution(makeState()),changes:[{field:'progression',after:100}]}),/Cross-actor or invalid effect/));
