// Lote 11: exact social knowledge anchor and adversarial replay; in-memory only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NPC_KNOWLEDGE_ANCHOR as anchor} from '../tools/living_world_knowledge_anchor.mjs';
import {draftReviewedSocialContact,verifySocialEventHistory} from '../tools/living_world_social.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const stateText=read('game/STATE.json');
const baseline={
 state:JSON.parse(stateText),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const noah='NPC-006',darius='NPC-003';
const turn=key=>({key,
 intent:'SYNTHETIC: review ordinary scene.',
 outcome:'SYNTHETIC: a quiet interval passes.',
 player_text:'SYNTHETIC QA INPUT',
 narration_messages:['SYNTHETIC QA: light falls on the workbench.'],
 elapsed_days:0,elapsed_minutes:25
});
const stage=(snapshot,resolutions,key)=>stageLivingWorldTurn({
 snapshot,observedHead:'a'.repeat(40),npcResolutions:resolutions,turn:turn(key)
});
const contact=(state,knownEntry,id='SOC-ANCHOR-PINNED-001')=>
 draftReviewedSocialContact({state,reviewed:true,interactionId:id,
  participantIds:[darius,noah],
  observation:{kind:'current_turn_observation',
   fact:'SYNTHETIC Noah and Darius spoke directly about repair components.',
   causal_source:'SYNTHETIC reviewed exchange; no real player turn occurred.',
   observer_actor_id:noah,confirmed_by_reviewer:true},
  knowledgeTransfer:{speaker_id:noah,recipient_id:darius,known_entry:knownEntry},
  relationshipUpdates:[],
  outcomes:{
   [noah]:'SYNTHETIC Noah shares a recorded statement in a private exchange.',
   [darius]:'SYNTHETIC Darius hears a source-attributed, unverified report.'
  }
 });
const first=()=>stage(baseline,contact(baseline.state,
 baseline.state.world.actors[noah].knowledge[0]),'synthetic-anchor-social-one');
const later=()=>{
 const one=stage(baseline,[{actor_id:noah,reviewed:true,resolved:true,
  causal_basis:'Synthetic later direct observation during fictional time.',
  outcome:'SYNTHETIC Noah records a newly noticed detail.',
  changes:[{field:'knowledge',
   fact:'Synthetic verified engine parts are stacked at the repair counter.',
   source:'SYNTHETIC reviewed direct workshop observation'}],
  disclosures:[]}],'synthetic-anchor-new-knowledge');
 const learned=one.state.world.actors[noah].knowledge.at(-1);
 return {one,learned,two:stage(one,contact(one.state,learned,
  'SOC-ANCHOR-FOLLOWUP-002'),'synthetic-anchor-social-two')};
};

test('pinned NPC memory exactly matches the verified Git state blob and turn nine',()=>{
 const prefix='blob '+Buffer.byteLength(stateText,'utf8')+'\0';
 const digest=createHash('sha1').update(prefix).update(stateText,'utf8').digest('hex');
 assert.equal(anchor.sourceStateBlob,digest);
 assert.equal(anchor.sourceStateBlob,'3f4e9c98a7211068faefd31d0a0acbd4260ef589');
 assert.equal(anchor.sourceCommit,'019175c6463ff31807a0f7013d91299add94913c');
 assert.equal(anchor.lastEventId,'EV-000029');
 assert.equal(anchor.lastTurn,baseline.manifest.last_completed_turn);
 assert.equal(anchor.chapterId,baseline.manifest.chapter_id);
 assert.deepEqual(Object.keys(anchor.actorKnowledge).sort(),
  Object.keys(baseline.state.world.actors).sort());
 for(const [id,knowledge] of Object.entries(anchor.actorKnowledge)){
  assert.ok(Object.isFrozen(knowledge));
  assert.deepEqual(knowledge,baseline.state.world.actors[id].knowledge);
 }
});

test('a saved social pair cannot acquire unrecorded legacy knowledge',()=>{
 const candidate=first(),before=JSON.stringify(candidate);
 const forged=structuredClone(candidate);
 forged.state.world.actors[noah].knowledge.unshift(
  'SYNTHETIC secret never recorded in any saved event.');
 assert.throws(()=>verifySocialEventHistory(forged),
  /NPC knowledge diverges from sealed anchor and event history/);
 assert.equal(JSON.stringify(candidate),before);
 assert.deepEqual(baseline.state,JSON.parse(stateText));
});

test('legacy knowledge cannot be substituted after valid social staging',()=>{
 const forged=structuredClone(first());
 forged.state.world.actors[noah].knowledge[0]=
  'SYNTHETIC replacement of a protected historical fact.';
 assert.throws(()=>verifySocialEventHistory(forged),
  /NPC knowledge diverges from sealed anchor and event history/);
});

test('recorded later knowledge can be communicated only after acquisition',()=>{
 const before=JSON.stringify(baseline);
 const {one,learned,two}=later();
 assert.ok(learned.includes('EV-000031'));
 assert.equal(one.manifest.last_completed_turn,10);
 assert.equal(two.manifest.last_completed_turn,11);
 assert.equal(verifySocialEventHistory(two),true);
 assert.equal(verifyNarrativeSnapshot(two),true);
 assert.ok(two.state.world.actors[darius].knowledge.at(-1).includes(learned));
 assert.equal(JSON.stringify(baseline),before);
});

test('falsifying the acquired event fact and final NPC memory still fails',()=>{
 const {two,learned}=later(),forged=structuredClone(two);
 const event=forged.events.events.find(e=>e.id==='EV-000031');
 const acquired=event.state_changes.find(x=>x.field==='knowledge');
 assert.equal(acquired.after,learned);
 acquired.after=acquired.after.replace('Synthetic verified engine parts',
  'Synthetic invented engine parts');
 const list=forged.state.world.actors[noah].knowledge;
 list.splice(list.indexOf(learned),1,acquired.after);
 assert.throws(()=>verifySocialEventHistory(forged),
  /Event-backed NPC knowledge has inconsistent source or event ID/);
});

test('cross-owner knowledge copied without event cannot masquerade as testimony',()=>{
 const forged=structuredClone(first());
 const transferred=forged.state.world.actors[darius].knowledge.at(-1);
 forged.state.world.actors['NPC-007'].knowledge.push(transferred);
 assert.throws(()=>verifySocialEventHistory(forged),
  /NPC knowledge diverges from sealed anchor and event history/);
});

test('historical social events cannot be added before the pinned boundary',()=>{
 const forged=structuredClone(first());
 forged.events.events[1].social_context=structuredClone(
  forged.events.events.at(-1).social_context);
 assert.throws(()=>verifySocialEventHistory(forged),
  /Unverified social interaction predates the sealed knowledge anchor|two linked events/);
});

test('baseline and reviewed draft remain read-only with no synthetic turn saved',()=>{
 const before=JSON.stringify(baseline);
 const draft=contact(baseline.state,baseline.state.world.actors[noah].knowledge[0]);
 assert.equal(draft.length,2);
 assert.equal(verifyNarrativeSnapshot(baseline),true);
 assert.equal(verifySocialEventHistory(baseline),true);
 assert.equal(JSON.stringify(baseline),before);
});
