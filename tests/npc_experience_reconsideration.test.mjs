// Synthetic QA only. Nothing here is a player turn or a canonical world event.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {draftReviewedSocialContact} from '../tools/living_world_social.mjs';
import {draftReviewedNPCCausalContinuation} from '../tools/living_world_causal_continuations.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {checkNPCFactEvidence,buildContextPacket} from '../tools/context_manager.mjs';

const head='a'.repeat(40),darius='NPC-003',noah='NPC-006';
const paths=savePaths('CH-000');
const originals=Object.fromEntries(paths.map(path=>
 [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const initial=()=>decodeFiveFiles(originals,'CH-000');
const turn=key=>({
 key,intent:'SYNTHETIC QA: Jack remains in his workshop.',
 outcome:'SYNTHETIC QA: no private information reaches Jack.',
 player_text:'SYNTHETIC QA INPUT — NOT A REAL PLAYER ACTION',
 narration_messages:['SYNTHETIC QA: the workshop remains quiet.'],
 elapsed_days:0,elapsed_minutes:20
});
function stage(snapshot,key,resolutions){
 return stageLivingWorldTurn({snapshot,turn:turn(key),
  observedHead:head,npcResolutions:resolutions});
}
function sourceTestimony(){
 const base=initial(),noahEntry=base.state.world.actors[noah].knowledge[0];
 const resolutions=draftReviewedSocialContact({
  state:base.state,reviewed:true,
  interactionId:'SOC-RECONSIDER-ORIGIN-01',
  participantIds:[darius,noah],
  observation:{kind:'current_turn_observation',
   fact:'SYNTHETIC QA: Noah discusses an ordinary repair claim privately with Darius.',
   causal_source:'SYNTHETIC QA: witnessed and reviewed ordinary contact.',
   observer_actor_id:noah,confirmed_by_reviewer:true},
  relationshipUpdates:[],
  knowledgeTransfer:{speaker_id:noah,recipient_id:darius,known_entry:noahEntry},
  outcomes:{
   [noah]:'SYNTHETIC QA: Noah shares one attributed observation.',
   [darius]:'SYNTHETIC QA: Darius hears a report without establishing its truth.'
  }
 });
 const result=stage(base,'synthetic-reconsideration-origin',resolutions);
 assert.equal(verifyNarrativeSnapshot(result),true);
 const oldEntry=result.state.world.actors[darius].knowledge.at(-1);
 assert.ok(oldEntry.includes('EV-000032'));
 return {base,heard:result,oldEntry};
}
function actorExperience(heard){
 return stage(heard,'synthetic-reconsideration-experience',[{
  actor_id:darius,reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Darius personally checks a repair claim by inspecting equipment.',
  outcome:'SYNTHETIC QA PRIVATE: Darius gains a later first-hand observation.',
  changes:[{
   field:'knowledge',
   fact:'SYNTHETIC QA: Darius inspected the work and found its condition uncertain.',
   source:'SYNTHETIC QA: direct inspection by Darius'
  }]
 }]);
}
function close(snapshot){
 return stageChapterTransition({
  snapshot:{...snapshot,sourceFiles:encodeFiveFiles(snapshot)},
  nextPlan:{plan_version:1,chapter_id:'CH-001',
   title:'SYNTHETIC QA: continued personal reconsideration',
   status:'prepared',source_commit:head,
   purpose:'SYNTHETIC QA: verify independently revised memories and relationships.',
   time_context:{day:snapshot.state.time.day,
    period:snapshot.state.time.time_of_day,
    constraints:['Never publish this fictional QA run as canon.']},
   location_ids:[snapshot.state.player.location_id],
   npc_ids:[darius,noah],
   thread_ids:[],hidden_plan_ids:[],
   possible_developments:['Private re-evaluation remains open.'],
   exit_conditions:['Reconsideration evidence survives reload.']},
  reason:'SYNTHETIC QA: metadata-only archival boundary.',
  observedHead:head,reviewed:true
 });
}

test('later private experience may prompt a reviewed NPC revision, directional trust and a new plan without deleting evidence',()=>{
 const {base,heard,oldEntry}=sourceTestimony();
 const before=JSON.stringify(base);
 const experience=actorExperience(heard);
 assert.equal(verifyNarrativeSnapshot(experience),true);
 const firstReview=checkNPCFactEvidence({snapshot:experience,actorId:darius,
  fact:'Reported by NPC-006 (not independently verified): '+base.state.world.actors[noah].knowledge[0]});
 assert.equal(firstReview.statementRevisionStatus,'not_marked_revised');
 assert.equal(firstReview.reconsiderationEventCount,0);
 assert.equal(experience.state.world.actors[darius].relationships?.[noah],undefined);
 assert.equal(experience.state.world.actors[darius].independent_plan,
  heard.state.world.actors[darius].independent_plan);
 const priorPlan=experience.state.world.actors[darius].independent_plan;
 const revisedFact='SYNTHETIC QA: Darius now treats the earlier report as uncertain pending further inspection.';
 const review=draftReviewedNPCCausalContinuation({
  snapshot:experience,actorId:darius,reviewed:true,
  sourceEventIds:['EV-000034'],
  reasoning:'SYNTHETIC QA: Darius weighs his own new inspection before revising a prior statement.',
  outcome:'SYNTHETIC QA PRIVATE: Darius revises his interpretation and chooses a cautious next action.',
  changes:[
   {field:'knowledge',fact:revisedFact,source:'SYNTHETIC QA: direct personal reconsideration',
    revision_of:oldEntry,
    revision_reason:'SYNTHETIC QA: the new inspection makes the original report less reliable.'},
   {field:'relationship',target_actor_id:noah,before:null,
    after:{relation:'contacto de reparaciones',
     bond:'confianza cautelosa después de contrastar un informe'}},
   {field:'independent_plan',before:priorPlan,
    after:'SYNTHETIC QA: independently verify the repair before relying on another report.'}
  ]
 });
 const revised=stage(experience,'synthetic-reconsideration-choice',[review]);
 assert.equal(verifyNarrativeSnapshot(revised),true);
 assert.equal(revised.manifest.last_event_id,'EV-000036');
 const actor=revised.state.world.actors[darius];
 const revisedEntry=actor.knowledge.at(-1);
 assert.ok(actor.knowledge.includes(oldEntry));
 assert.ok(revisedEntry.includes('EV-000036'));
 assert.equal(actor.relationships[noah].bond,
  'confianza cautelosa después de contrastar un informe');
 assert.equal(actor.independent_plan,
  'SYNTHETIC QA: independently verify the repair before relying on another report.');
 assert.equal(revised.state.world.actors[noah].relationships?.[darius],undefined);
 assert.deepEqual(revised.state.world.actors[noah].knowledge,
  experience.state.world.actors[noah].knowledge);
 assert.deepEqual(revised.state.world.actors['NPC-002'].knowledge,
  base.state.world.actors['NPC-002'].knowledge);
 const originalFact='Reported by NPC-006 (not independently verified): '+
  base.state.world.actors[noah].knowledge[0];
 const knowledge=checkNPCFactEvidence({snapshot:revised,actorId:darius,fact:originalFact});
 assert.equal(knowledge.status,'recorded_event');
 assert.equal(knowledge.statementRevisionStatus,'explicitly_revised');
 assert.equal(knowledge.latestLinkedStatementForReview,revisedFact);
 assert.deepEqual(knowledge.revisionEventIds,['EV-000036']);
 assert.equal(knowledge.reconsiderationEventCount,1);
 assert.deepEqual(knowledge.reconsiderationsForReview,[{
  revisionEventId:'EV-000036',
  revisionEventPath:'chapters/CH-000.events.json',
  causalExperienceEventIds:['EV-000034'],
  causalEvidenceStatus:'reviewed_actor_event_links',
  changedRelationshipTargetIds:[noah],
  independentPlanChanged:true,
  interpretation:'causal_links_only_not_truth_or_intent'
 }]);
 assert.equal(knowledge.truthStatus,'not_assessed');
 const linked=checkNPCFactEvidence({snapshot:revised,actorId:darius,fact:revisedFact});
 assert.equal(linked.status,'recorded_event');
 assert.deepEqual(linked.reconsiderationsForReview,[]);
 const closed=close(revised);
 const reloaded=decodeFiveFiles({...encodeFiveFiles(revised),...encodeFiveFiles(closed)},'CH-001');
 assert.equal(verifyNarrativeSnapshot(reloaded),true);
 const recovered=checkNPCFactEvidence({snapshot:reloaded,actorId:darius,fact:originalFact});
 assert.deepEqual(recovered.reconsiderationsForReview,knowledge.reconsiderationsForReview);
 assert.equal(reloaded.state.world.actors[darius].relationships[noah].bond,
  'confianza cautelosa después de contrastar un informe');
 assert.ok(reloaded.state.world.actors[darius].knowledge.includes(oldEntry));
 assert.ok(reloaded.state.world.actors[darius].knowledge.includes(revisedEntry));
 const privatePacket=buildContextPacket({snapshot:reloaded,
  npcKnowledgeClaims:[{actorId:darius,fact:originalFact}]});
 assert.deepEqual(privatePacket.npcKnowledgeChecks[0].reconsiderationsForReview,
  knowledge.reconsiderationsForReview);
 const publicPacket=buildContextPacket({snapshot:reloaded,audience:'reader_visible'});
 assert.equal(publicPacket.npcKnowledgeChecks,undefined);
 assert.equal(JSON.stringify(publicPacket).includes('reconsiderationsForReview'),false);
 for(const term of [revisedFact,'confianza cautelosa después de contrastar un informe']){
  assert.equal(reloaded.chapter.includes(term),false);
  assert.equal(JSON.stringify(reloaded.transcript).includes(term),false);
 }
 assert.equal(JSON.stringify(base),before);
 for(const [path,raw] of Object.entries(originals))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),raw);
});

test('reason-only revision must not falsely claim witnessed events or force relationship changes',()=>{
 const {heard,oldEntry}=sourceTestimony();
 const statement='SYNTHETIC QA: Darius is uncertain about the previous statement.';
 const withoutExperience=stage(heard,'synthetic-reconsideration-reason-only',[{
  actor_id:darius,reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Darius reflects on what he heard but cites no newly verified experience.',
  outcome:'SYNTHETIC QA PRIVATE: he records uncertainty without adopting a planned action.',
  changes:[{field:'knowledge',fact:statement,
   source:'SYNTHETIC QA: private reflection',
   revision_of:oldEntry,
   revision_reason:'SYNTHETIC QA: cautious subjective reassessment without a later event.'}]
 }]);
 assert.equal(verifyNarrativeSnapshot(withoutExperience),true);
 const previousFact='Reported by NPC-006 (not independently verified): '+
  initial().state.world.actors[noah].knowledge[0];
 const evidence=checkNPCFactEvidence({snapshot:withoutExperience,
  actorId:darius,fact:previousFact});
 assert.equal(evidence.reconsiderationEventCount,1);
 assert.deepEqual(evidence.reconsiderationsForReview[0].causalExperienceEventIds,[]);
 assert.equal(evidence.reconsiderationsForReview[0].causalEvidenceStatus,'revision_reason_only');
 assert.deepEqual(evidence.reconsiderationsForReview[0].changedRelationshipTargetIds,[]);
 assert.equal(evidence.reconsiderationsForReview[0].independentPlanChanged,false);
 assert.equal(withoutExperience.state.world.actors[darius].relationships?.[noah],undefined);
 assert.equal(withoutExperience.state.world.actors[darius].independent_plan,
  heard.state.world.actors[darius].independent_plan);
});

test('an NPC cannot claim another person private experience as its own cause',()=>{
 const {heard,oldEntry}=sourceTestimony();
 const sourceEvent='EV-000031'; // Noah's separate privately owned social event.
 assert.throws(()=>draftReviewedNPCCausalContinuation({
  snapshot:heard,actorId:darius,reviewed:true,
  sourceEventIds:[sourceEvent],
  reasoning:'SYNTHETIC QA: Darius attempts to claim a separate NPC private outcome.',
  outcome:'SYNTHETIC QA PRIVATE: this attempt must not be stageable.',
  changes:[{field:'knowledge',
   fact:'SYNTHETIC QA: invented certainty from someone else private event.',
   source:'SYNTHETIC QA: forged cause',
   revision_of:oldEntry,
   revision_reason:'SYNTHETIC QA: an unsupported personal-cause claim.'}]
 }),/NPC cannot react to a future event or an event it does not know/);
 assert.equal(verifyNarrativeSnapshot(heard),true);
});


test('two NPCs can independently contrast one sourced rumor and choose different actions without erasing memory',()=>{
 const base=initial(),before=JSON.stringify(base),mara='NPC-007';
 const rumor='SYNTHETIC QA: Darius claims an ordinary repair parcel was already delivered to its customer.';
 const source=stage(base,'synthetic-contrasts-source',[{
  actor_id:darius,reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Darius records a privately received shipping report.',
  outcome:'SYNTHETIC QA PRIVATE: Darius keeps one unverified delivery report.',
  changes:[{field:'knowledge',fact:rumor,
    source:'SYNTHETIC QA: attributed private shipping message'}]
 }]);
 const sourceEntry=source.state.world.actors[darius].knowledge.at(-1);
 assert.ok(sourceEntry.includes('EV-000031'));
 const report='SYNTHETIC QA: a colleague said the parcel was already delivered.';
 const recipients=stage(source,'synthetic-contrasts-recipients',[
  {actor_id:noah,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Noah hears an attributed account while working in Market Row.',
   outcome:'SYNTHETIC QA PRIVATE: Noah hears a claim, not a confirmed delivery.',
   changes:[{field:'knowledge',fact:report,
     source:'SYNTHETIC QA: direct report from Darius',
     transmitted_from:{actor_id:darius,knowledge_entry:sourceEntry,
       event_id:'EV-000031',reported_form:'as_heard'}}]},
  {actor_id:mara,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Mara privately reads a message attributed to Darius.',
   outcome:'SYNTHETIC QA PRIVATE: Mara sees only the claimed delivery.',
   changes:[{field:'knowledge',fact:report,
     source:'SYNTHETIC QA: attributed phone message from Darius',
     transmitted_from:{actor_id:darius,knowledge_entry:sourceEntry,
       event_id:'EV-000031',reported_form:'as_heard'}}]}
 ]);
 assert.equal(verifyNarrativeSnapshot(recipients),true);
 const noahEntry=recipients.state.world.actors[noah].knowledge.at(-1);
 const maraEntry=recipients.state.world.actors[mara].knowledge.at(-1);
 assert.notEqual(noahEntry,maraEntry);
 assert.ok(noahEntry.includes('EV-000033'));
 assert.ok(maraEntry.includes('EV-000034'));
 const oldPlan=recipients.state.world.actors[noah].independent_plan;
 const noahCounter='SYNTHETIC QA: Noah personally sees the same parcel waiting undelivered on the counter.';
 const maraCounter='SYNTHETIC QA: Mara sees a generic receipt without a customer name or proof of delivery.';
 const contrasted=stage(recipients,'synthetic-contrasts-divergent-observations',[
  {actor_id:noah,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Noah checks the market counter before making an independent decision.',
   outcome:'SYNTHETIC QA PRIVATE: Noah sees competing evidence and chooses further checks.',
   changes:[
    {field:'knowledge',fact:noahCounter,source:'SYNTHETIC QA: own direct inspection',
     contrasts_with:noahEntry,
     contrast_reason:'SYNTHETIC QA: the parcel physically remains on the market counter.'},
    {field:'independent_plan',before:oldPlan,
     after:'SYNTHETIC QA: verify the parcel destination before promising a handover.'}]},
  {actor_id:mara,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Mara independently compares her message against an ambiguous receipt.',
   outcome:'SYNTHETIC QA PRIVATE: Mara remains uncertain rather than choosing a new plan.',
   changes:[{field:'knowledge',fact:maraCounter,
    source:'SYNTHETIC QA: own receipt inspection',
    contrasts_with:maraEntry,
    contrast_reason:'SYNTHETIC QA: the generic receipt cannot establish delivery of this parcel.'}]}
 ]);
 assert.equal(verifyNarrativeSnapshot(contrasted),true);
 assert.equal(contrasted.manifest.last_event_id,'EV-000037');
 const noahBefore=checkNPCFactEvidence({snapshot:contrasted,actorId:noah,fact:report});
 const maraBefore=checkNPCFactEvidence({snapshot:contrasted,actorId:mara,fact:report});
 const noahAfter=checkNPCFactEvidence({snapshot:contrasted,actorId:noah,fact:noahCounter});
 const maraAfter=checkNPCFactEvidence({snapshot:contrasted,actorId:mara,fact:maraCounter});
 assert.equal(noahBefore.status,'recorded_event');
 assert.equal(maraBefore.status,'recorded_event');
 assert.equal(noahBefore.contrastLinkCount,1);
 assert.equal(maraBefore.contrastLinkCount,1);
 assert.equal(noahBefore.statementRevisionStatus,'not_marked_revised');
 assert.equal(maraBefore.statementRevisionStatus,'not_marked_revised');
 assert.deepEqual(noahBefore.contrastLinksForReview,[{
  recordedByActorId:noah,contrastEventId:'EV-000036',
  contrastEventPath:'chapters/CH-000.events.json',
  otherStatementOriginEventId:'EV-000036',
  direction:'prior_competing_account',
  status:'actor_reviewed_competing_reports_only',
  establishedTruth:'not_assessed',decisionInferred:false
 }]);
 assert.equal(noahAfter.contrastLinkCount,1);
 assert.equal(noahAfter.contrastLinksForReview[0].otherStatementOriginEventId,'EV-000033');
 assert.equal(noahAfter.contrastLinksForReview[0].direction,'later_competing_account');
 assert.equal(maraBefore.contrastLinksForReview[0].contrastEventId,'EV-000037');
 assert.equal(maraAfter.contrastLinksForReview[0].otherStatementOriginEventId,'EV-000034');
 assert.equal(noahAfter.truthStatus,'not_assessed');
 assert.equal(maraAfter.truthStatus,'not_assessed');
 assert.ok(contrasted.state.world.actors[noah].knowledge.includes(noahEntry));
 assert.ok(contrasted.state.world.actors[mara].knowledge.includes(maraEntry));
 assert.ok(contrasted.state.world.actors[darius].knowledge.includes(sourceEntry));
 assert.equal(contrasted.state.world.actors[mara].independent_plan,
  recipients.state.world.actors[mara].independent_plan);
 assert.notEqual(contrasted.state.world.actors[noah].independent_plan,oldPlan);
 assert.deepEqual(contrasted.state.player,base.state.player);
 const closed=close(contrasted);
 const reloaded=decodeFiveFiles({...encodeFiveFiles(contrasted),...encodeFiveFiles(closed)},'CH-001');
 assert.equal(verifyNarrativeSnapshot(reloaded),true);
 assert.deepEqual(checkNPCFactEvidence({snapshot:reloaded,actorId:noah,fact:report})
  .contrastLinksForReview,noahBefore.contrastLinksForReview);
 assert.deepEqual(checkNPCFactEvidence({snapshot:reloaded,actorId:mara,fact:report})
  .contrastLinksForReview,maraBefore.contrastLinksForReview);
 const privateContext=buildContextPacket({snapshot:reloaded,
  npcKnowledgeClaims:[{actorId:noah,fact:report},{actorId:mara,fact:report}]});
 assert.deepEqual(privateContext.npcKnowledgeChecks.map(x=>x.contrastLinkCount),[1,1]);
 const visible=buildContextPacket({snapshot:reloaded,audience:'reader_visible'});
 assert.equal(visible.npcKnowledgeChecks,undefined);
 assert.equal(JSON.stringify(visible).includes('contrastLinksForReview'),false);
 for(const statement of [rumor,noahCounter,maraCounter]){
  assert.equal(reloaded.chapter.includes(statement),false);
  assert.equal(JSON.stringify(visible).includes(statement),false);
 }
 assert.equal(JSON.stringify(base),before);
});

test('contrasts require an older exact actor-owned memory and an explicit review reason',()=>{
 const {heard,oldEntry}=sourceTestimony();
 const before=JSON.stringify(heard);
 const foreign=heard.state.world.actors[noah].knowledge[0];
 assert.throws(()=>stage(heard,'synthetic-contrast-wrong-actor',[{
  actor_id:darius,reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Darius claims another actor memory as his own.',
  outcome:'SYNTHETIC QA PRIVATE: the invalid contradiction is refused.',
  changes:[{field:'knowledge',
   fact:'SYNTHETIC QA: an unsupported competing observation.',
   source:'SYNTHETIC QA: fictitious private cause',
   contrasts_with:foreign,
   contrast_reason:'SYNTHETIC QA: a competing observation was claimed.'}]
 }]),/Knowledge contrast requires a prior actor-owned statement and reason/);
 assert.throws(()=>stage(heard,'synthetic-contrast-missing-reason',[{
  actor_id:darius,reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Darius proposes an unexplained contrast.',
  outcome:'SYNTHETIC QA PRIVATE: the unexplained contrast is refused.',
  changes:[{field:'knowledge',
   fact:'SYNTHETIC QA: a second ungrounded competing observation.',
   source:'SYNTHETIC QA: private review',
   contrasts_with:oldEntry}]
 }]),/Knowledge contrast requires a prior actor-owned statement and reason/);
 assert.equal(JSON.stringify(heard),before);
});

test('readback refuses a contrast relinked to later NPC memory, even if final state holds it',()=>{
 const {heard,oldEntry}=sourceTestimony();
 const first=stage(heard,'synthetic-contrast-historical',[
  {actor_id:darius,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Darius finds one apparently competing report.',
   outcome:'SYNTHETIC QA PRIVATE: the competing fact is kept for review.',
   changes:[{field:'knowledge',
    fact:'SYNTHETIC QA: an observation complicates the earlier report.',
    source:'SYNTHETIC QA: independently checked source',
    contrasts_with:oldEntry,
    contrast_reason:'SYNTHETIC QA: the new report may contradict previous testimony.'}]}
 ]);
 const later=stage(first,'synthetic-contrast-future-owner',[
  {actor_id:darius,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Darius learns additional information later.',
   outcome:'SYNTHETIC QA PRIVATE: a separate later observation is recorded.',
   changes:[{field:'knowledge',
    fact:'SYNTHETIC QA: later independent measurement of the same repair.',
    source:'SYNTHETIC QA: later check'}]}
 ]);
 assert.equal(verifyNarrativeSnapshot(later),true);
 const tampered=structuredClone(later);
 const old= tampered.events.events.find(x=>x.id==='EV-000034')
   .state_changes.find(x=>x.field==='knowledge');
 old.contrasts_with=tampered.state.world.actors[darius].knowledge.at(-1);
 assert.throws(()=>verifyNarrativeSnapshot(tampered),
  /Saved NPC contrast lacks older actor-specific provenance/);
 assert.equal(verifyNarrativeSnapshot(later),true);
});


// Independent goal changes are distinct from plan changes and preserve the
// exact previous motive in actor-owned causal history. No canonical save.
const goalDraft=(snapshot,after,reason='SYNTHETIC QA: reconsider an obsolete task after earlier experience.')=>({
 actor_id:darius,reviewed:true,resolved:true,
 causal_basis:'SYNTHETIC QA: Darius independently reconsiders a personal goal.',
 outcome:'SYNTHETIC QA PRIVATE: Darius chooses a different goal.',
 changes:[{field:'goal',before:snapshot.state.world.actors[darius].goal,after,reason}]
});
test('goal replacement survives next turn and chapter boundary without losing old motives',()=>{
 const base=initial(),original=JSON.stringify(base),old=base.state.world.actors[darius];
 const first=stage(base,'synthetic-goal-revision-first',[goalDraft(base,'Seek legitimate work rather than repeat the completed delivery.')]);
 const revised=first.state.world.actors[darius];
 assert.equal(revised.goal,'Seek legitimate work rather than repeat the completed delivery.');
 assert.deepEqual(revised.knowledge,old.knowledge);
 assert.equal(revised.independent_plan,old.independent_plan);
 assert.deepEqual(first.state.player,base.state.player);
 const change=first.events.events.at(-1).state_changes.find(c=>c.field==='goal');
 assert.equal(change.before,old.goal);
 assert.equal(change.after,revised.goal);
 const closed=close(first);
 const reread=decodeFiveFiles({...encodeFiveFiles(first),...encodeFiveFiles(closed)},'CH-001');
 const second=stage(reread,'synthetic-goal-revision-second',[goalDraft(reread,'Set aside the search and reconsider personal priorities.')]);
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.equal(second.state.world.actors[darius].goal,'Set aside the search and reconsider personal priorities.');
 assert.equal(second.events.events.at(-1).state_changes.find(c=>c.field==='goal').before,revised.goal);
 assert.equal(JSON.stringify(base),original);
});
test('goal changes reject stale, empty, unexplained, duplicate and cross-actor effects',()=>{
 const base=initial(),before=JSON.stringify(base);
 const make=()=>goalDraft(base,'Seek a different legitimate opportunity.');
 for(const [key,edit,pattern] of [
  ['stale',d=>d.changes[0].before='A different previous goal',/Stale NPC goal/],
  ['empty',d=>d.changes[0].after='',/goal revision requires/],
  ['reason',d=>delete d.changes[0].reason,/goal revision requires/],
  ['same',d=>d.changes[0].after=d.changes[0].before,/goal revision requires/],
  ['duplicate',d=>d.changes.push({...d.changes[0],before:d.changes[0].after,after:'Consider a second possible goal.'}),/one goal revision/],
  ['foreign',d=>d.changes[0].actor_id=noah,/Cross-actor/]
 ]){
  const draft=make();edit(draft);
  assert.throws(()=>stage(base,'synthetic-goal-invalid-'+key,[draft]),pattern);
 }
 assert.equal(JSON.stringify(base),before);
});
test('goal history rejects silent state edits, forged first motive and invalid privacy',()=>{
 const base=initial(),silent=structuredClone(base);
 silent.state.world.actors[darius].goal='A fabricated new goal.';
 assert.throws(()=>verifyNarrativeSnapshot(silent),/Saved NPC goal differs/);
 const staged=stage(base,'synthetic-goal-tamper',[goalDraft(base,'Seek a different legitimate opportunity.')]);
 for(const [edit,pattern] of [
  [s=>s.events.events.at(-1).state_changes.find(c=>c.field==='goal').before='Invented previous motive.',/goal history precondition/],
  [s=>s.events.events.at(-1).known_to.push(noah),/goal revision requires/],
  [s=>s.state.world.actors[darius].goal='Another silent goal edit.',/Saved NPC goal differs/]
 ]){
  const copy=structuredClone(staged);edit(copy);
  assert.throws(()=>verifyNarrativeSnapshot(copy),pattern);
 }
});
test('a private NPC goal cannot be copied verbatim into Jack narration',()=>{
 const base=initial(),draft=goalDraft(base,'Privately reconsider what kind of ordinary work to pursue.');
 const scene=turn('synthetic-goal-private-leak');
 scene.narration_messages=[draft.changes[0].after];
 assert.throws(()=>stageLivingWorldTurn({snapshot:base,turn:scene,observedHead:head,npcResolutions:[draft]}),/Private NPC goal leaked/);
});


test('NPC may abandon goal and plan, remain reviewable, and later adopt a new motive',()=>{
 const base=initial(),original=JSON.stringify(base),id=darius;
 const draft=goalDraft(base,null);
 draft.changes.push({field:'independent_plan',before:base.state.world.actors[id].independent_plan,
  after:null,reason:'Synthetic voluntary pause without an assigned replacement task.'});
 const paused=stage(base,'synthetic-goal-and-plan-pause',[draft]);
 const actor=paused.state.world.actors[id];
 assert.equal(actor.goal,null);
 assert.equal(actor.independent_plan,null);
 assert.deepEqual(actor.knowledge,base.state.world.actors[id].knowledge);
 assert.equal(verifyNarrativeSnapshot(paused),true);
 const closed=close(paused);
 const reread=decodeFiveFiles({...encodeFiveFiles(paused),...encodeFiveFiles(closed)},'CH-001');
 assert.equal(reread.state.world.actors[id].goal,null);
 assert.equal(reread.state.world.actors[id].independent_plan,null);
 const resumed=stage(reread,'synthetic-goal-resume-after-pause',[
  goalDraft(reread,'Explore a freely chosen personal interest.')]);
 assert.equal(resumed.state.world.actors[id].goal,'Explore a freely chosen personal interest.');
 assert.equal(resumed.state.world.actors[id].independent_plan,null);
 assert.equal(verifyNarrativeSnapshot(resumed),true);
 const missing=structuredClone(paused);delete missing.state.world.actors[id].goal;
 assert.throws(()=>verifyNarrativeSnapshot(missing),/Saved NPC goal differs/);
 assert.equal(JSON.stringify(base),original);
});

test('goal absence is explicit, causal and not an empty or missing field',()=>{
 const base=initial(),paused=stage(base,'synthetic-goal-pause-only',[goalDraft(base,null)]);
 const duplicate=goalDraft(paused,null);
 assert.throws(()=>stage(paused,'synthetic-goal-null-noop',[duplicate]),/goal revision requires/);
 const missing=goalDraft(base,null);delete missing.changes[0].after;
 assert.throws(()=>stage(base,'synthetic-goal-missing-after',[missing]),/goal revision requires/);
 const noReason=goalDraft(base,null);noReason.changes.push({
  field:'independent_plan',before:base.state.world.actors[darius].independent_plan,after:null});
 assert.throws(()=>stage(base,'synthetic-plan-null-no-reason',[noReason]),/Nullable NPC plan/);
});
