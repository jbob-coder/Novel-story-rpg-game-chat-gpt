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
