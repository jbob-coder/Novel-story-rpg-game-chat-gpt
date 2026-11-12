import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareLivingWorldTurn,stageLivingWorldTurn,saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {validateTemporalAdvance} from '../tools/living_world_time.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {savePaths,decodeFiveFiles} from '../tools/save_transaction.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const paths=savePaths('CH-000');
const originals=Object.fromEntries(paths.map(p=>[p,readFileSync(resolve(root,p),'utf8')]));
const baseline=decodeFiveFiles(originals,'CH-000');
const head='a'.repeat(40), savedHead='b'.repeat(40);
const turn=()=>({key:'lw-independent-npc-review-turn-001',
 intent:'Jack remains at his workbench.',outcome:'A quiet period passes at the workshop.',
 player_text:'I examine the workbench.',narration_messages:['The workshop remains quiet.'],
 elapsed_days:0,elapsed_minutes:20});
const resolved=()=>({
 actor_id:'NPC-005',reviewed:true,resolved:true,
 causal_basis:'Rosa decides to prepare the repaired clock for a later visit.',
 outcome:'Rosa prepares to take the repaired clock to its owner without claiming delivery.',
 changes:[{field:'independent_plan',
   before:baseline.state.world.actors['NPC-005'].independent_plan,
   after:'Prepare a future visit with the repaired clock.'}]
});
const stage=(overrides={})=>stageLivingWorldTurn({snapshot:baseline,turn:turn(),observedHead:head,
  npcResolutions:[resolved()],...overrides});

test('read-only preparation produces one reviewed NPC event candidate',()=>{
 const before=JSON.stringify(baseline);
 const x=prepareLivingWorldTurn({snapshot:baseline,turn:turn(),observedHead:head,npcResolutions:[resolved()]});
 assert.equal(x.turn.offscreen.length,1);
 assert.equal(x.turn.offscreen[0].actor_id,'NPC-005');
 assert.equal(x.turn.offscreen[0].changes[0].field,'independent_plan');
 assert.equal(x.turn.save_guard.observed_head,head);
 assert.equal(JSON.stringify(baseline),before);
});
test('integration records an NPC change and time without changing the original checkpoint',()=>{
 const before=JSON.stringify(baseline);
 const after=stage();
 assert.equal(verifyNarrativeSnapshot(after),true);
 assert.equal(after.manifest.last_completed_turn,baseline.manifest.last_completed_turn+1);
 assert.equal(after.events.events.length,baseline.events.events.length+2);
 assert.equal(after.events.events.at(-1).kind,'independent_actor');
 assert.equal(after.events.events.at(-1).state_changes.at(-1).field,'independent_plan');
 assert.equal(after.state.world.actors['NPC-005'].independent_plan,
  'Prepare a future visit with the repaired clock.');
 assert.equal(after.state.time.elapsed_minutes_since_opening_approx,
  baseline.state.time.elapsed_minutes_since_opening_approx+20);
 assert.equal(after.transcript.entries.at(-1).text,'The workshop remains quiet.');
 assert.equal(JSON.stringify(baseline),before);
});
test('zero resolved NPC actions never fabricate an offscreen event',()=>{
 const x=stage({npcResolutions:[]});
 assert.equal(x.events.events.length,baseline.events.events.length+1);
 assert.equal(x.manifest.last_completed_turn,baseline.manifest.last_completed_turn+1);
});
test('unreviewed or unresolved proposals cannot become events',()=>{
 for(const patch of [{reviewed:false},{resolved:false},{causal_basis:'no'}])
 assert.throws(()=>stage({npcResolutions:[{...resolved(),...patch}]}),
  /explicit causal resolution and review/);
});
test('direct offscreen injection is refused',()=>{
 assert.throws(()=>stage({turn:{...turn(),offscreen:[{actor_id:'NPC-005',outcome:'Unexpected'}]}}),
  /Use npcResolutions/);
});
test('offscreen disclosures cannot silently reveal private facts',()=>{
 assert.throws(()=>stage({npcResolutions:[{...resolved(),
  disclosures:[{fact:'Private detail.',viewerIds:['PLAYER-001']}]}]}),
  /Disclosure must be recorded explicitly/);
});
test('cross-actor and unsupported state mutations are rejected',()=>{
 assert.throws(()=>stage({npcResolutions:[{...resolved(),changes:[{field:'conditions',
  actor_id:'PLAYER-001',before:[],after:['informed']}]}]}),/Cross-actor/);
 assert.throws(()=>stage({npcResolutions:[{...resolved(),changes:[{field:'progression',after:2}]}]}),
  /invalid effect/);
});
test('invalid narrative minutes are rejected without a saved turn',()=>{
 for(const elapsed_minutes of [-1,1.25,NaN])
 assert.throws(()=>stage({turn:{...turn(),elapsed_minutes}}),/narrative minutes/);
});
test('explicit time-of-day change cannot rewind the same day',()=>{
 assert.throws(()=>stage({turn:{...turn(),next_time_of_day:'night',elapsed_minutes:20,
    elapsed_days:0},npcResolutions:[resolved(),resolved()]}),/Multiple outcomes/);
 const t={...turn(),elapsed_minutes:700,next_time_of_day:'night'};
 const after=stage({turn:t,npcResolutions:[]});
 assert.equal(after.state.time.time_of_day,'night');
 assert.throws(()=>stage({snapshot:after,turn:{...turn(),key:'lw-next-action-unique',next_time_of_day:'morning'},
    npcResolutions:[]}),/go backwards/);
});
test('mocked atomic five-file transaction saves only reviewed resolved outcomes',async()=>{
 let branchHead=head,created=0,updated=0;
 const remote={
  async readHead(){return branchHead},
  async readFiles(sha,wanted){const obj=sha===head?originals:this.persisted;
    return Object.fromEntries(wanted.map(p=>[p,obj[p]]));},
  async createCommit({parentSha,files}){assert.equal(parentSha,head);
    assert.deepEqual(Object.keys(files).sort(),paths.slice().sort());
    this.persisted=files;created++;return savedHead;},
  async updateHead({expectedSha,newSha}){assert.equal(expectedSha,head);
    assert.equal(newSha,savedHead);branchHead=savedHead;updated++;return true;}
 };
 const result=await saveLivingWorldTurn({remote,
  branch:'work/living-world-design-review-20261110',chapterId:'CH-000',
  turn:turn(),npcResolutions:[resolved()]});
 assert.equal(result.status,'verified',result.reason);
 assert.equal(result.attempt.percent,100);
 assert.equal(created,1);assert.equal(updated,1);
 assert.equal(result.narration_messages[0],'The workshop remains quiet.');
 const final=decodeFiveFiles(remote.persisted,'CH-000');
 assert.equal(final.manifest.last_completed_turn,baseline.manifest.last_completed_turn+1);
 assert.equal(final.events.events.at(-1).actor_ids[0],'NPC-005');
 assert.equal(JSON.stringify(decodeFiveFiles(originals,'CH-000')),JSON.stringify(baseline));
});
test('an unreviewed event cannot cause a remote write',async()=>{
 let created=0;
 const remote={
  async readHead(){return head},
  async readFiles(_sha,wanted){return Object.fromEntries(wanted.map(p=>[p,originals[p]]));},
  async createCommit(){created++;return savedHead},
  async updateHead(){return true}
 };
 const result=await saveLivingWorldTurn({remote,branch:'work/living-world-design-review-20261110',
  chapterId:'CH-000',turn:turn(),npcResolutions:[{...resolved(),reviewed:false}]});
 assert.equal(result.status,'blocked');
 assert.equal(created,0);
});

test('coordinated secret NPC resolution remains recorded without becoming visible chapter prose',()=>{
 const privateOutcome='PRIVATE-NPC-OFFSCREEN-UNREVEALED-003: Rosa keeps an unshared schedule.';
 const prepared=stage({npcResolutions:[{...resolved(),outcome:privateOutcome}]});
 assert.equal(prepared.events.events.at(-1).outcome,privateOutcome);
 assert.ok(!prepared.chapter.includes(privateOutcome));
 assert.ok(!prepared.transcript.entries.at(-1).text.includes(privateOutcome));
 assert.equal(verifyNarrativeSnapshot(prepared),true);
});

test('narrative minutes and day crossings cannot contradict each other',()=>{
 for(const [elapsed_days,elapsed_minutes] of [[1,0],[0,1440],[0,1500],[3,60],[0,2880]])
  assert.throws(()=>stage({turn:{...turn(),elapsed_days,elapsed_minutes},npcResolutions:[]}),
   /Narrative days\/minutes disagree/);
});
test('legitimate short midnight crossing remains possible without inventing a clock',()=>{
 const x=stage({turn:{...turn(),elapsed_days:1,elapsed_minutes:20,
  next_time_of_day:'morning'},npcResolutions:[]});
 assert.equal(x.state.time.day,baseline.state.time.day+1);
 assert.equal(x.state.time.elapsed_minutes_since_opening_approx,
  baseline.state.time.elapsed_minutes_since_opening_approx+20);
});
test('morning to night in twenty minutes is rejected, but later transition is possible',()=>{
 assert.throws(()=>stage({turn:{...turn(),elapsed_minutes:20,
  next_time_of_day:'night'},npcResolutions:[]}),/Insufficient narrative minutes/);
 const x=stage({turn:{...turn(),elapsed_minutes:700,
  next_time_of_day:'night'},npcResolutions:[]});
 assert.equal(x.state.time.time_of_day,'night');
});
test('one day and exactly 1440 minutes is coherent, no weekdays are manufactured',()=>{
 const x=stage({turn:{...turn(),elapsed_days:1,elapsed_minutes:1440},npcResolutions:[]});
 assert.equal(x.state.time.day,baseline.state.time.day+1);
 assert.equal(x.state.time.calendar_date,null);
 assert.equal(x.state.time.clock_time,null);
});
test('narrative time policy refuses noninteger input and accepts an unknown next period',()=>{
 assert.throws(()=>validateTemporalAdvance({elapsedDays:0,elapsedMinutes:1.5}),/Invalid narrative minutes/);
 assert.equal(validateTemporalAdvance({elapsedDays:0,elapsedMinutes:15}).nextPeriod,null);
});

test('coordinator refuses a hidden Rosa outcome duplicated in visible narration',()=>{
 const secret='PRIVATE-ROSA-NEIGHBOR-CONVERSATION-0001';
 assert.throws(()=>stage({npcResolutions:[{...resolved(),outcome:secret}],
  turn:{...turn(),narration_messages:['Jack knows: '+secret]}}),/Private NPC outcome leaked/);
});

test('canonical story cannot advance through coordinator without durable journal',async()=>{
 let remoteCalls=0;
 const remote={async readHead(){remoteCalls++;return head}};
 const result=await saveLivingWorldTurn({remote,
  branch:'work/chat-narrative-foundation',chapterId:'CH-000',turn:turn()});
 assert.equal(result.status,'blocked');
 assert.match(result.reason,/Durable save journal required/);
 assert.equal(remoteCalls,0);
});
