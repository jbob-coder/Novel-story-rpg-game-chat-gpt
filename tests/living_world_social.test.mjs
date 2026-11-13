import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {draftReviewedSocialContact,validateSocialResolutionBatch,verifySocialEventHistory}
 from '../tools/living_world_social.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const snapshot={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const state=snapshot.state, p=['NPC-003','NPC-006'];
const noahFact=state.world.actors['NPC-006'].knowledge[0];
const observation={
 kind:'current_turn_observation',
 fact:'Darius and Noah exchange a short question about repair supplies while at Market Row.',
 causal_source:'Synthetic reviewed direct exchange during player-triggered fictional time.',
 observer_actor_id:'NPC-006',confirmed_by_reviewer:true
};
const options=()=>({
 state,interactionId:'SOC-MARKET-SYNTH-010',participantIds:p,
 observation,reviewed:true,
 relationshipUpdates:[{actorId:'NPC-003',relation:'contacto comercial',
   bond:'cortesía cautelosa'},
   {actorId:'NPC-006',relation:'contacto comercial',
   bond:'interés profesional prudente'}],
 knowledgeTransfer:{speaker_id:'NPC-006',recipient_id:'NPC-003',
   known_entry:noahFact},
 outcomes:{
  'NPC-003':'Darius listens to a remark without treating it as independently confirmed.',
  'NPC-006':'Noah exchanges one known remark and continues his ordinary shop planning.'
 }
});
const draft=(overrides={})=>draftReviewedSocialContact({...options(),...overrides});
const turn=()=>({
 key:'synthetic-social-encounter-test-001',
 intent:'Jack inspects a loose workshop component.',
 outcome:'An ordinary quiet interval passes at the workbench.',
 player_text:'I inspect the component.',
 narration_messages:['The workbench remains quiet while Jack inspects a component.'],
 elapsed_days:0,elapsed_minutes:25
});
const stage=npcResolutions=>stageLivingWorldTurn({
 snapshot,observedHead:'a'.repeat(40),turn:turn(),npcResolutions
});

test('a real stored co-location only suggests contact and creates no history',()=>{
 const before=JSON.stringify(snapshot);
 const d=inspectLivingWorld({snapshot,actorIds:p,elapsedMinutes:25});
 assert.equal(d.possibleNPCContacts.length,1);
 assert.equal(d.possibleNPCContacts[0].conversationOccurred,false);
 assert.equal(d.possibleNPCContacts[0].knowledgeShared,false);
 assert.equal(JSON.stringify(snapshot),before);
});

test('reviewed synthetic contact creates speaker-first, actor-owned effect proposals',()=>{
 const before=JSON.stringify(snapshot);
 const resolutions=draft();
 assert.equal(resolutions.length,2);
 assert.deepEqual(resolutions.map(r=>r.actor_id),['NPC-006','NPC-003']);
 assert.ok(resolutions.every(r=>r.reviewed&&r.resolved&&
  r.social_context.location_id==='LOC-COMMERCIAL-DISTRICT'));
 const speaker=resolutions[0],recipient=resolutions[1];
 assert.equal(speaker.changes.length,1);
 assert.equal(speaker.changes[0].field,'relationship');
 assert.equal(recipient.changes.length,2);
 assert.equal(recipient.changes[0].target_actor_id,'NPC-006');
 assert.equal(recipient.changes[1].field,'knowledge');
 assert.ok(recipient.changes[1].fact.startsWith('Reported by NPC-006 (not independently verified): '));
 assert.equal(JSON.stringify(snapshot),before);
});

test('two reviewed NPC records persist causal provenance in a synthetic turn only',()=>{
 const before=JSON.stringify(snapshot);
 const resolutions=draft();
 const candidate=stage(resolutions);
 assert.equal(verifyNarrativeSnapshot(candidate),true);
 assert.equal(verifySocialEventHistory(candidate),true);
 assert.equal(candidate.manifest.last_completed_turn,10);
 const last=candidate.events.events.slice(-2);
 assert.equal(last[0].actor_ids[0],'NPC-006');
 assert.equal(last[1].actor_ids[0],'NPC-003');
 assert.equal(last[1].caused_by.includes(last[0].id),true);
 assert.equal(last[0].social_context.interaction_id,'SOC-MARKET-SYNTH-010');
 assert.equal(last[1].social_context.interaction_id,'SOC-MARKET-SYNTH-010');
 assert.equal(candidate.state.world.actors['NPC-003'].relationships['NPC-006'].bond,'cortesía cautelosa');
 assert.equal(candidate.state.world.actors['NPC-006'].relationships['NPC-003'].bond,'interés profesional prudente');
 assert.ok(candidate.state.world.actors['NPC-003'].knowledge.some(k=>
  k.includes('Reported by NPC-006')&&k.includes(last[1].id)));
 assert.ok(!candidate.chapter.includes(noahFact));
 assert.ok(!candidate.transcript.entries.at(-1).text.includes(noahFact));
 const safe=playerVisibleDiagnostic(inspectLivingWorld({snapshot:candidate,
  actorIds:p,elapsedMinutes:20}));
 assert.ok(!JSON.stringify(safe).includes('SOC-MARKET-SYNTH-010'));
 assert.ok(!JSON.stringify(safe).includes('Reported by NPC-006'));
 assert.equal(JSON.stringify(snapshot),before);
 assert.equal(snapshot.manifest.last_completed_turn,9);
});

test('an inferred contact without a confirmed shared location is rejected',()=>{
 const off=structuredClone(state);
 off.world.actors['NPC-006'].location_id='LOC-CAFE-BRUMA';
 assert.throws(()=>draftReviewedSocialContact({...options(),state:off}),
  /confirmed shared NPC location/);
 assert.throws(()=>draftReviewedSocialContact({...options(),reviewed:false}),
  /editorial review/);
});

test('a social exchange cannot fabricate knowledge the speaker never had',()=>{
 assert.throws(()=>draft({knowledgeTransfer:{
  speaker_id:'NPC-006',recipient_id:'NPC-003',
  known_entry:'A witness personally confirmed an invented secret about another NPC.'
 }}),/Speaker must already know/);
 assert.throws(()=>draft({knowledgeTransfer:{
  speaker_id:'NPC-001',recipient_id:'NPC-003',known_entry:noahFact
 }}),/Speaker must already know/);
});

test('observations require a reviewer, named observer and actual turn narrative source',()=>{
 assert.throws(()=>draft({observation:{...observation,confirmed_by_reviewer:false}}),
  /attributed current-turn observation/);
 assert.throws(()=>draft({observation:{...observation,observer_actor_id:'NPC-001'}}),
  /attributed current-turn observation/);
 assert.throws(()=>draft({observation:{...observation,causal_source:'?'}}),
  /attributed current-turn observation/);
});

test('the coordinator rejects one-sided, missing and mismatched social resolutions',()=>{
 const good=draft();
 assert.throws(()=>stage(good.slice(0,1)),/two reviewed, matching/);
 assert.throws(()=>stage([{...good[0],social_context:{
  ...good[0].social_context,interaction_id:'SOC-TAMPER'
 }},good[1]]),/two reviewed, matching/);
 const leak=structuredClone(good);
 leak[0].changes.push({field:'knowledge',
  fact:'Impossible information from nowhere',source:'Anonymous unrelated hidden agent'});
 assert.throws(()=>stage(leak),/Unaddressed NPC cannot receive/);
});

test('same-person duplication or fake relation updates are not social encounters',()=>{
 assert.throws(()=>draft({participantIds:['NPC-003','NPC-003']}),
  /Invalid social interaction participants/);
 assert.throws(()=>draft({relationshipUpdates:[{
  actorId:'NPC-003',relation:'contacto comercial',bond:'cortesía cautelosa'
 },{
  actorId:'NPC-003',relation:'contacto comercial',bond:'confianza completa'
 }]}),/duplicated social relationship updates/);
 const forged=draft();
 forged[0].changes[0].after.knowledge_of_crimes=true;
 assert.throws(()=>validateSocialResolutionBatch({state,npcResolutions:forged}),
  /preserve previous context and target partner/);
});

test('relationship is directional; one participant may revise trust without automatic reciprocity',()=>{
 const one=draft({knowledgeTransfer:null,
  relationshipUpdates:[{actorId:'NPC-003',relation:'contacto ocasional',
   bond:'curiosidad profesional'}]});
 assert.equal(one[0].actor_id,'NPC-003');
 assert.equal(one[0].changes.length,1);
 assert.equal(one[1].actor_id,'NPC-006');
 assert.equal(one[1].changes.length,0);
 const after=stage(one);
 assert.equal(after.state.world.actors['NPC-003'].relationships['NPC-006'].bond,
  'curiosidad profesional');
 assert.equal(after.state.world.actors['NPC-006'].relationships['NPC-003'],undefined);
});

test('an existing relationship preserves unrelated privacy fields',()=>{
 const existing=structuredClone(state);
 existing.world.actors['NPC-003'].relationships['NPC-006']={
  relation:'contacto profesional',bond:'prudente',knowledge_of_crimes:false
 };
 const opt=options();opt.state=existing;
 opt.relationshipUpdates=[{actorId:'NPC-003',bond:'respeto moderado'}];
 opt.knowledgeTransfer=null;
 const pair=draftReviewedSocialContact(opt);
 assert.equal(pair[0].changes[0].after.knowledge_of_crimes,false);
 assert.equal(pair[0].changes[0].after.relation,'contacto profesional');
 assert.throws(()=>draftReviewedSocialContact({...opt,
  relationshipUpdates:[{actorId:'NPC-003',relation:'amistad íntima',bond:'respeto moderado'}]}),
 /Existing relationship kind cannot silently be rewritten/);
});

test('saved history detects missing partner, lost source and forged causal linkage',()=>{
 const candidate=stage(draft());
 const onlyOne=structuredClone(candidate);
 onlyOne.events.events[onlyOne.events.events.length-2].social_context=undefined;
 assert.throws(()=>verifySocialEventHistory(onlyOne),
  /two linked events/);
 const falseSource=structuredClone(candidate);
 const effect=falseSource.events.events.at(-1).state_changes.find(x=>x.field==='knowledge');
 effect.source='No source';
 assert.throws(()=>verifySocialEventHistory(falseSource),
  /lacks correct reported source/);
 const unlinked=structuredClone(candidate);
 unlinked.events.events.at(-1).caused_by=[];
 assert.throws(()=>verifySocialEventHistory(unlinked),/two linked events/);
});

test('pure relationship/knowledge drafts never advance canonical time or alter canon',()=>{
 const before=JSON.stringify(snapshot);
 const d=draft();
 assert.equal(d[0].reviewed,true);
 assert.equal(d[0].disclosures.length,0);
 assert.equal(JSON.stringify(snapshot),before);
 assert.equal(snapshot.state.time.day,-29);
});
