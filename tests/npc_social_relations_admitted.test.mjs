// Selective PR #13 regression port. Historical test blob c8bc14d84ae45d217fa41470b5c710ed840c9099.
// Admitted 15-place world + PR #98 causal decisions + preserved story turn 9.
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

test('social trace persists across a second synthetic turn with no duplicate encounter',()=>{
 const first=stage(draft());
 const second=stageLivingWorldTurn({
  snapshot:first,observedHead:'b'.repeat(40),npcResolutions:[],
  turn:{...turn(),key:'synthetic-social-followup-002',
   player_text:'I inspect the other tool.',
   intent:'Jack reviews a second tool.',
   narration_messages:['The workshop equipment remains in place.']}
 });
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.equal(verifySocialEventHistory(second),true);
 assert.equal(second.manifest.last_completed_turn,11);
 assert.equal(second.events.events.at(-1).kind,'player_action');
 assert.equal(second.events.events.filter(x=>x.social_context?.interaction_id===
  'SOC-MARKET-SYNTH-010').length,2);
 assert.equal(snapshot.manifest.last_completed_turn,9);
});
test('historical readback detects tampered social participants and relationship evidence',()=>{
 const candidate=stage(draft());
 const altered=structuredClone(candidate);
 altered.events.events.at(-1).social_context.transfer.speaker_id='NPC-001';
 altered.events.events.at(-2).social_context.transfer.speaker_id='NPC-001';
 assert.throws(()=>verifySocialEventHistory(altered),/Malformed saved social context/);
 const badBond=structuredClone(candidate);
 const bond=badBond.events.events.at(-2).state_changes.find(x=>x.field==='relationship');
 bond.after.latest_shared_moment='An unrelated moment never reviewed.';
 assert.throws(()=>verifySocialEventHistory(badBond),/lost the reviewed encounter evidence/);
});

test('world admission is preserved and an additional store is not an NPC meeting',()=>{
 const before=JSON.stringify(snapshot);
 assert.equal(Object.keys(state.world.locations).length,15);
 for(const id of ['LOC-RAILGARDEN-CLINIC','LOC-MARKET-NOAH-REPAIR',
  'LOC-MARKET-BUSINESS-OFFICES'])assert.ok(Object.hasOwn(state.world.locations,id));
 const reports=inspectLivingWorld({snapshot,actorIds:p,elapsedMinutes:25});
 assert.equal(reports.possibleNPCContacts.length,1);
 assert.equal(reports.possibleNPCContacts[0].conversationOccurred,false);
 assert.equal(reports.possibleNPCContacts[0].knowledgeShared,false);
 assert.equal(JSON.stringify(snapshot),before);
});

test('social participant pairs must preserve transfer speaker first',()=>{
 const pair=draft();
 assert.deepEqual(pair.map(x=>x.actor_id),['NPC-006','NPC-003']);
 assert.throws(()=>validateSocialResolutionBatch({state,npcResolutions:[pair[1],pair[0]]}),
  /speaker first, recipient second/);
 assert.throws(()=>stage([pair[1],pair[0]]),
  /speaker first, recipient second/);
});

test('social readback forbids unrelated actor changes and private player events',()=>{
 const original=stage(draft());
 const extra=structuredClone(original);
 extra.events.events.at(-1).state_changes.push({actor_id:'NPC-003',
  field:'resources',before:{},after:{invented:true}});
 assert.throws(()=>verifySocialEventHistory(extra),/unrelated actor mutation/);
 const forged=structuredClone(original);
 forged.events.events.at(-1).kind='player_action';
 assert.throws(()=>verifySocialEventHistory(forged),/actor-owned private NPC event/);
 const known=structuredClone(original);
 known.events.events.at(-1).known_to=['PLAYER-001'];
 assert.throws(()=>verifySocialEventHistory(known),/actor-owned private NPC event/);
});

test('social batches cannot alter independent NPC resources or metadata',()=>{
 const pair=draft();
 pair[0].changes.push({field:'resources',before:{},after:{invented:'payload'}});
 assert.throws(()=>validateSocialResolutionBatch({state,npcResolutions:pair}),
  /cannot smuggle unrelated state changes/);
 assert.equal(snapshot.manifest.last_completed_turn,9);
});

test('social knowledge does not automatically disclose speaker secret to the player',()=>{
 const before=JSON.stringify(snapshot);
 const staged=stage(draft());
 const visible=playerVisibleDiagnostic(inspectLivingWorld({snapshot:staged,
  actorIds:p,elapsedMinutes:25}));
 assert.ok(!JSON.stringify(visible).includes(noahFact));
 assert.ok(!JSON.stringify(visible).includes('SOC-MARKET-SYNTH-010'));
 assert.ok(!staged.chapter.includes(noahFact));
 assert.equal(JSON.stringify(snapshot),before);
});

test('historical encounters use the participants’ locations at the time',()=>{
 const saved=stage(draft({knowledgeTransfer:null}));
 for(const event of saved.events.events.slice(-2))event.social_context.location_id='LOC-CAFE-BRUMA';
 assert.throws(()=>verifySocialEventHistory(saved),/share the recorded location/);
});

test('replay preserves relationship attributes and keeps social testimony private',()=>{
 const saved=stage(draft());
 const effect=saved.events.events.at(-1).state_changes.find(change=>change.field==='relationship');
 effect.after.knowledge_of_crimes=true;
 assert.throws(()=>verifySocialEventHistory(saved),/rewrites prior relationship attributes/);
 const leaked=stage(draft());
 leaked.events.events.at(-2).known_to.push(state.player.id);
 assert.throws(()=>verifySocialEventHistory(leaked),/private NPC event/);
 const stripped=stage(draft());
 for(const event of stripped.events.events.slice(-2))delete event.social_context;
 assert.throws(()=>verifySocialEventHistory(stripped),/encounter provenance|Missing social context/);
});

test('each participant can spend the same meeting interval but cannot exceed it',()=>{
 const pair=draft({elapsedMinutes:25});
 assert.equal(stage(pair).events.events.at(-1).social_context.elapsed_minutes,25);
 assert.throws(()=>stage(draft({elapsedMinutes:26})),/exceed turn duration/);
 assert.throws(()=>draft({elapsedMinutes:0}),/Invalid social contact duration/);
 assert.throws(()=>stageLivingWorldTurn({snapshot,observedHead:'a'.repeat(40),
  turn:{...turn(),elapsed_minutes:0},npcResolutions:draft()}),/duration/);
});

test('visible prose requires a source before quoting a private encounter',()=>{
 const privateText=observation.fact;
 const render=changes=>stageLivingWorldTurn({snapshot:stage(draft()),observedHead:'a'.repeat(40),
  turn:{...turn(),key:'synthetic-source-disclosure',changes,narration_messages:[privateText]}});
 assert.throws(()=>render([]),/Private social encounter leaked/);
 const disclosed=render([{field:'knowledge',fact:privateText,source:'A participant reports the exchange to Jack in this synthetic turn.'}]);
 assert.equal(disclosed.transcript.entries.at(-1).text,privateText);
});


test('separate social encounters give two recipients only their own reviewed accounts',()=>{
 const before=JSON.stringify(snapshot),head='a'.repeat(40);
 const sourceFact='SYNTHETIC QA PRIVATE: a parcel contains an unpublished customer address and private delivery instructions.';
 const stageOn=(snap,key,npcResolutions)=>stageLivingWorldTurn({
   snapshot:snap,observedHead:head,turn:{...turn(),key},npcResolutions
 });
 const original=stageOn(snapshot,'synthetic-social-disclosure-source',[{
   actor_id:'NPC-003',reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Darius privately reads a sealed delivery note.',
   outcome:'SYNTHETIC QA PRIVATE: Darius retains this note without disclosing it.',
   changes:[{field:'knowledge',fact:sourceFact,
      source:'SYNTHETIC QA: direct observation of a sealed note'}]
 }]);
 assert.equal(verifyNarrativeSnapshot(original),true);
 const privateEntry=original.state.world.actors['NPC-003'].knowledge.at(-1);
 assert.ok(privateEntry.includes('EV-000031'));
 const observation=recipient=>({
   kind:'current_turn_observation',
   fact:'SYNTHETIC QA: two NPCs speak privately without Jack attending.',
   causal_source:'SYNTHETIC QA: separately reviewed direct communication.',
   observer_actor_id:recipient,confirmed_by_reviewer:true
 });
 const talk=(state,interaction,recipient,mode,text)=>draftReviewedSocialContact({
   state,interactionId:interaction,participantIds:['NPC-003',recipient],
   observation:observation(recipient),reviewed:true,
   relationshipUpdates:[],knowledgeTransfer:{
     speaker_id:'NPC-003',recipient_id:recipient,
     known_entry:privateEntry,reported_form:mode,reported_text:text
   },
   outcomes:{
     'NPC-003':'Darius privately chooses what to disclose to this person.',
     [recipient]:'The listener retains only the particular reviewed account.'
   }
 });
 const partialText='A package is expected, but no recipient address was disclosed.';
 const partial=stageOn(original,'synthetic-social-disclosure-noah',
   talk(original.state,'SOC-DISCLOSE-PARTIAL-01','NPC-006','partial',partialText));
 assert.equal(verifyNarrativeSnapshot(partial),true);
 const noahEntry=partial.state.world.actors['NPC-006'].knowledge.at(-1);
 assert.ok(noahEntry.includes(partialText));
 assert.ok(!noahEntry.includes(sourceFact));
 assert.ok(!noahEntry.includes('unpublished customer address'));
 const moved=stageOn(partial,'synthetic-social-disclosure-mara-walk',[{
   actor_id:'NPC-007',reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Mara independently walks from the cafe to Market Row.',
   outcome:'SYNTHETIC QA: Mara completes a short ordinary walk.',
   changes:[{field:'location_id',before:'LOC-CAFE-BRUMA',
     after:'LOC-COMMERCIAL-DISTRICT',
     route:['LOC-CAFE-BRUMA','LOC-COMMERCIAL-DISTRICT'],
     travel:{mode:'walk',basis:'SYNTHETIC QA: travel from cafe to Market Row',
       elapsed_minutes:12}}]
 }]);
 assert.equal(verifyNarrativeSnapshot(moved),true);
 const alteredText='Darius claims the parcel was cancelled without disclosing any private addresses.';
 const altered=stageOn(moved,'synthetic-social-disclosure-mara',
   talk(moved.state,'SOC-DISCLOSE-ALTERED-02','NPC-007','altered',alteredText));
 assert.equal(verifyNarrativeSnapshot(altered),true);
 assert.equal(verifySocialEventHistory(altered),true);
 const maraEntry=altered.state.world.actors['NPC-007'].knowledge.at(-1);
 assert.ok(maraEntry.includes(alteredText));
 assert.ok(!maraEntry.includes(partialText));
 assert.ok(!maraEntry.includes(sourceFact));
 assert.ok(!noahEntry.includes(alteredText));
 assert.ok(altered.state.world.actors['NPC-003'].knowledge.includes(privateEntry));
 assert.ok(!altered.state.world.actors['NPC-002'].knowledge.some(x=>
   x.includes(partialText)||x.includes(alteredText)));
 assert.ok(!altered.state.player.knowledge.some(x=>x.includes(sourceFact)));
 assert.ok(!altered.chapter.includes(sourceFact));
 assert.ok(!altered.chapter.includes(partialText));
 assert.ok(!altered.chapter.includes(alteredText));
 const pairs=altered.events.events.filter(e=>e.social_context);
 assert.equal(pairs.length,4);
 assert.deepEqual(pairs.filter(e=>e.social_context.transfer?.recipient_id==='NPC-006')
   .map(e=>e.social_context.transfer.reported_form),['partial','partial']);
 assert.deepEqual(pairs.filter(e=>e.social_context.transfer?.recipient_id==='NPC-007')
   .map(e=>e.social_context.transfer.reported_form),['altered','altered']);
 assert.equal(JSON.stringify(snapshot),before);
});

test('social report forms require paired reviewed text and replay rejects altered provenance',()=>{
 const opt=options();
 const text='Only a schedule change was mentioned, without customer details.';
 const t={...opt.knowledgeTransfer,reported_text:text};
 assert.throws(()=>draftReviewedSocialContact({...opt,knowledgeTransfer:t}),
   /Selective social report requires reviewed form and text/);
 assert.throws(()=>draftReviewedSocialContact({...opt,
   knowledgeTransfer:{...t,reported_form:'verified_truth'}}),
   /Selective social report requires reviewed form and text/);
 assert.throws(()=>draftReviewedSocialContact({...opt,
   knowledgeTransfer:{...t,reported_form:'partial',reported_text:' '}}),
   /Selective social report requires reviewed form and text/);
 const pair=draftReviewedSocialContact({...opt,knowledgeTransfer:{
   ...t,reported_form:'partial'}});
 const accepted=stage(pair);
 assert.equal(accepted.events.events.at(-1).state_changes.find(x=>x.field==='knowledge').fact,
   'Reported by NPC-006 (not independently verified): '+text);
 for(const e of accepted.events.events.filter(x=>x.social_context))
   e.social_context.transfer.reported_text='A different unreviewed social claim.';
 assert.throws(()=>verifySocialEventHistory(accepted),
   /Saved social information lacks correct reported source/);
});

test('private social recipient report cannot appear bare in public narration',()=>{
 const detail='SYNTHETIC QA: only the delivery time is known, not the recipient identity.';
 const pair=draftReviewedSocialContact({...options(),knowledgeTransfer:{
   ...options().knowledgeTransfer,reported_form:'partial',reported_text:detail}});
 const render=message=>stageLivingWorldTurn({
   snapshot,observedHead:'a'.repeat(40),npcResolutions:pair,
   turn:{...turn(),key:'synthetic-social-selective-public-quote',
     narration_messages:['Jack reads: '+message]}
 });
 assert.throws(()=>render(detail),/Private social encounter leaked/);
});
