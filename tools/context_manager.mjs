// Read-only, evidence-linked context packets. No narration, world ticks or saves.
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {allEvents,allTranscriptEntries} from './chapter_history.mjs';

const ensure=(test,message)=>{if(!test)throw Error(message)};
const copy=value=>JSON.parse(JSON.stringify(value));
const tokens=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().match(/[a-z0-9_-]{2,}/g)??[];
const fixedDocs=[
  ['docs/CANON.md','world universe canon approved powers day zero'],
  ['docs/DECISIONS.md','owner approvals superseded decisions authority'],
  ['docs/NARRATIVE_CONTRACT.md','narrative style player agency no rpg'],
  ['docs/RECOVERY.md','checkpoint interrupted save recovery journal'],
  ['docs/CHAPTER_PROTOCOL.md','chapters transitions continuity arc'],
  ['docs/STATE_SCHEMA.md','state fields actors knowledge event provenance'],
  ['docs/WORLD_BIBLE.md','places universe lore background'],
  ['docs/NPC_RULES.md','npc autonomy knowledge independent actions'],
  ['game/ASTER_SPEC.md','aster robot brazo actuadores taller especificaciones first arm workshop specifications'],
  ['game/JACK_HACKER_HISTORY.md','jack background devices history'],
  ['game/STARTING_CAST.md','characters rosa elena noah relationships'],
  ['game/STARTING_LOCATIONS.md','meridian bay location routes']
];
const mandatoryReads=['AGENTS.md','docs/NARRATIVE_CONTRACT.md','docs/CANON.md',
  'docs/DECISIONS.md','docs/RECOVERY.md','docs/NARRATOR_RULES.md'];
const validAudience=new Set(['narrator_private','reader_visible']);
const npcMemoryFields=['name','age','role','location_id','goal','independent_plan',
  'knowledge','relationships','conditions','resources','inventory','commitments',
  'plans','needs','service_cases','last_resolved_action'];

// Memory is a projection of the exact saved actor, not a generated biography.
// Event IDs are evidence pointers, not a claim that the NPC knows every detail.

// Narrow retrieval is an editorial aid, NOT evidence that an actor is present.
// Explicit names/IDs win, then caller-known scene actors, then same saved LOC.
// Do not use approximate graph proximity or actor-private knowledge as matches.
export function selectNPCMemoryCandidates({state,query='',sceneNpcIds=[],maxActors=3}={}){
  const actors=state?.world?.actors;
  if(!actors||typeof query!=='string'||!Array.isArray(sceneNpcIds)||
     !Number.isSafeInteger(maxActors)||maxActors<0||maxActors>8)return [];
  const names=Object.entries(actors).map(([id,actor])=>({id,
    nameParts:tokens(actor.name??'')}));
  const givenCounts=new Map(),fullCounts=new Map();
  for(const {nameParts} of names)if(nameParts.length>0){
    givenCounts.set(nameParts[0],(givenCounts.get(nameParts[0])??0)+1);
    const full=nameParts.join(' ');
    fullCounts.set(full,(fullCounts.get(full)??0)+1);
  }
  const queryWords=new Set(tokens(query)),paddedQuery=' '+tokens(query).join(' ')+' ';
  const hinted=new Set(sceneNpcIds);
  return names.flatMap(({id,nameParts})=>{
    const actor=actors[id];
    if(!/^NPC-\d{3,}$/.test(id))return [];
    // A duplicate complete name is still ambiguous: a matching name is not
    // evidence that either actor was the individual mentioned by the user.
    const full=nameParts.join(' ');
    const fullName=nameParts.length>0 && fullCounts.get(full)===1 &&
      paddedQuery.includes(' '+full+' ');
    const byId=queryWords.has(id.toLowerCase());
    const givenName=nameParts.length>0 && givenCounts.get(nameParts[0])===1 &&
      queryWords.has(nameParts[0]);
    const sameSavedLocation=actor.location_id===state.player?.location_id &&
      typeof actor.location_id==='string';
    const score=byId||fullName?150:givenName?120:hinted.has(id)?100:sameSavedLocation?50:0;
    return score?[{id,score}]:[];
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))
    .slice(0,maxActors).map(x=>x.id);
}


// Report ambiguous given names without guessing who a pronoun or name denotes.
function unresolvedGivenNames(state,query){
  const groups=new Map(),words=tokens(query);
  for(const [id,actor] of Object.entries(state.world.actors)){
    const parts=tokens(actor.name??'');
    if(!/^NPC-\d{3,}$/.test(id)||!parts.length)continue;
    const first=parts[0],group=groups.get(first)??[];
    group.push({id,parts});groups.set(first,group);
  }
  const queryText=' '+words.join(' ')+' ';
  return [...groups.entries()].filter(([,items])=>items.length>1)
    .flatMap(([name,items])=>{
      // Every bare mention needs its own identifying surname. One full name
      // cannot silently resolve another bare mention.
      const unresolved=words.some((word,i)=>word===name&&!items.some(({parts})=>
        parts.length>1&&parts.every((part,j)=>words[i+j]===part)));
      const warnings=unresolved?[{name,candidateActorIds:items.map(x=>x.id).sort(),
        status:'requires_explicit_identity'}]:[];
      // A FULL name may itself be shared by different established people.
      // Exact-name duplication must also be reported, not silently treated as
      // unambiguous just because all name tokens match a single query span.
      const duplicateFullNames=new Map();
      for(const item of items){
        if(item.parts.length<2)continue;
        const full=item.parts.join(' ');
        const group=duplicateFullNames.get(full)??[];
        group.push(item.id);duplicateFullNames.set(full,group);
      }
      for(const [full,actorIds] of duplicateFullNames)if(actorIds.length>1&&
        queryText.includes(' '+full+' '))
        warnings.push({name:full,candidateActorIds:actorIds.sort(),
          status:'requires_explicit_identity'});
      return warnings;
    }).sort((a,b)=>a.name.localeCompare(b.name));
}
const sourcedKnowledge=/^(.*) \(source: (.+); (EV-\d{6,})\)$/;
// Similar wording can indicate a paraphrase, rumor, contradiction or lie.
// A lexical suggestion is never factual proof, even if words overlap.
function relatedKnowledgeForReview(actor,fact){
  const terms=new Set(tokens(fact).filter(t=>t.length>=4));
  if(!terms.size)return [];
  return (actor.knowledge??[]).map((entry,index)=>{
    const statement=sourcedKnowledge.exec(entry)?.[1]??entry;
    const overlaps=[...new Set(tokens(statement).filter(t=>t.length>=4))]
      .filter(word=>terms.has(word));
    return {statement,index,matchedTerms:overlaps};
  }).filter(x=>x.matchedTerms.length)
    .sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length||b.index-a.index)
    .slice(0,3).map(({statement,matchedTerms})=>({
      statement,matchedTerms,classification:'review_only_possible_relation'
    }));
}
// Exact recorded knowledge proves an actor holds a statement, never its truth.
function factEvidenceAtSnapshot(snapshot,actorId,fact){
  const actor=snapshot.state.world.actors[actorId];
  const entry=(actor.knowledge??[]).find(value=>
    value===fact||sourcedKnowledge.exec(value)?.[1]===fact);
  const foundation={actorId,fact,sourcePath:'game/STATE.json'};
  if(!entry)return {...foundation,status:'not_recorded',mayAssumeKnown:false,
    truthStatus:'not_assessed',relatedStatementsForReview:relatedKnowledgeForReview(actor,fact)};
  const source=sourcedKnowledge.exec(entry);
  if(!source)return {...foundation,status:'recorded_checkpoint',
    mayAssumeKnown:true,sourceEventId:null,truthStatus:'not_assessed'};
  const event=allEvents(snapshot).find(value=>value.id===source[3]);
  const backed=event?.actor_ids?.includes(actorId)&&event.state_changes?.some(change=>
    change.field==='knowledge'&&change.actor_id===actorId&&
    change.fact===fact&&change.after===entry&&change.source===source[2]);
  if(!backed)return {...foundation,status:'unverified_provenance',
    mayAssumeKnown:false,sourceEventId:source[3],truthStatus:'not_assessed'};
  return {...foundation,status:'recorded_event',
    mayAssumeKnown:true,sourceEventId:event.id,truthStatus:'not_assessed',
    eventPath:'chapters/'+event.chapter_id+'.events.json'};
}
/** Strict evidence check; never equate event involvement or rumors with knowledge. */
export function checkNPCFactEvidence({snapshot,actorId,fact}={}){
  basis(snapshot);
  ensure(typeof actorId==='string'&&Object.hasOwn(snapshot.state.world.actors,actorId),
    'Unknown NPC fact-check owner');
  ensure(typeof fact==='string'&&fact.trim().length>=4&&fact.length<=600,
    'Invalid NPC fact to verify');
  return factEvidenceAtSnapshot(snapshot,actorId,fact.trim());
}

const compactFields=['name','age','role','location_id','goal','independent_plan',
  'conditions','last_resolved_action'];
function compactActorState(actor,query,relatedIds){
  const state=Object.fromEntries(compactFields
    .filter(key=>Object.hasOwn(actor,key)).map(key=>[key,copy(actor[key])]));
  const list=Array.isArray(actor.knowledge)?actor.knowledge:[];
  const terms=new Set(tokens(query));
  const prioritized=list.map((value,index)=>({value,index,score:new Set(tokens(value))
    .intersection(terms).size})).sort((a,b)=>b.score-a.score||b.index-a.index);
  if(Array.isArray(actor.knowledge))state.knowledge=prioritized.slice(0,4)
    .sort((a,b)=>a.index-b.index).map(x=>copy(x.value));
  const relations=Object.fromEntries(Object.entries(actor.relationships??{})
    .filter(([id])=>relatedIds.has(id)).map(([id,value])=>[id,copy(value)]));
  if(Object.keys(relations).length)state.relationships=relations;
  return {state,knowledgeCount:list.length,
    knowledgeIncluded:state.knowledge?.length??0};
}

function actorMemoryAtCheckpoint(snapshot,npcIds,{compact=false,query=''}={}){
  const history=allEvents(snapshot),actors=snapshot.state.world.actors;
  return npcIds.map(actorId=>{
    const actor=actors[actorId];
    const selected=compact?compactActorState(actor,query,
      new Set([snapshot.state.player.id,...npcIds])):null;
    const state=compact?selected.state:Object.fromEntries(npcMemoryFields
      .filter(key=>Object.hasOwn(actor,key))
      .map(key=>[key,copy(actor[key])]));
    const related=history.filter(event=>(event.actor_ids??[]).includes(actorId)||
      (event.known_to??[]).includes(actorId));
    return {actorId,sourcePath:'game/STATE.json',state,
      relatedEventCount:related.length,
      recentEventReferences:related.slice(compact?-4:-10).reverse().map(event=>({
        id:event.id,path:'chapters/'+event.chapter_id+'.events.json',
        chapterId:event.chapter_id,turn:event.turn
      })),
      ...(compact?{memoryMode:'compact_auto',knowledgeCount:selected.knowledgeCount,
        knowledgeIncluded:selected.knowledgeIncluded}: {})};
  });
}

function basis(snapshot){
  verifyNarrativeSnapshot(snapshot);
  const {state,manifest}=snapshot;
  return {gameId:manifest.game_id,chapterId:manifest.chapter_id,
    turn:manifest.last_completed_turn,day:state.time.day,
    timeOfDay:state.time.time_of_day??null,clockTime:state.time.clock_time??null,
    playerLocationId:state.player.location_id,lastEventId:manifest.last_event_id,
    lastTranscriptId:manifest.last_transcript_id};
}
function selectEntries(snapshot,audience){
  // Never project raw event outcomes to the reader. known_to is too coarse
  // to certify that every field in an offscreen event may be disclosed.
  const result=[];
  if(audience==='narrator_private')for(const event of allEvents(snapshot)){
    result.push({id:event.id,kind:'event',chapterId:event.chapter_id,turn:event.turn,
      path:'chapters/'+event.chapter_id+'.events.json',
      search: [event.id,event.kind,...(event.actor_ids??[]),event.intent??'',event.outcome??''].join(' '),
      preview:String(event.outcome??'')});
  }
  for(const entry of allTranscriptEntries(snapshot)){
    result.push({id:entry.id,kind:'transcript',chapterId:entry.chapter_id,turn:entry.turn,
      path:'chapters/'+entry.chapter_id+'.transcript.json',
      search:[entry.id,entry.kind,entry.role,entry.text].join(' '),
      preview:audience==='narrator_private'?String(entry.text):''});
  }
  if(audience==='narrator_private')for(const [path,search] of fixedDocs)
    result.push({id:path,kind:'document_pointer',chapterId:null,turn:null,path,
      search:path+' '+search,preview:''});
  return result;
}
function rank(entry,queryTokens,nowTurn){
  if(!queryTokens.length)return entry.kind==='event'?Math.max(0,20-(nowTurn-entry.turn)*2):0;
  const words=new Set(tokens(entry.search));
  const matched=queryTokens.reduce((sum,t)=>sum+(words.has(t)?1:0),0);
  return matched?matched*100+(entry.turn===null?0:Math.min(entry.turn,nowTurn)/1000):0;
}

/** A derived, bounded and read-only packet, never a source of story truth. */
export function buildContextPacket({snapshot,audience='narrator_private',query='',
  maxReferences=8,maxPreviewCharacters=1600,sourceCommit=null,npcIds=[],
  sceneNpcIds=[],autoNpcMemory=true,npcKnowledgeClaims=[]}={}){
  ensure(validAudience.has(audience),'Unsupported context audience');
  ensure(typeof query==='string'&&query.length<=500,'Invalid context query');
  ensure(Number.isSafeInteger(maxReferences)&&maxReferences>=1&&maxReferences<=30,
    'Invalid reference limit');
  ensure(Number.isSafeInteger(maxPreviewCharacters)&&maxPreviewCharacters>=0&&
    maxPreviewCharacters<=10000,'Invalid preview budget');
  ensure(sourceCommit===null||(typeof sourceCommit==='string'&&/^[0-9a-f]{40}$/.test(sourceCommit)),
    'Invalid source commit identifier');
  ensure(Array.isArray(npcIds)&&npcIds.length<=8&&
    new Set(npcIds).size===npcIds.length &&
    npcIds.every(id=>typeof id==='string'&&/^NPC-\d{3,}$/.test(id)&&
      Object.hasOwn(snapshot?.state?.world?.actors??{},id)), 'Invalid NPC memory selection');
  ensure(Array.isArray(sceneNpcIds)&&sceneNpcIds.length<=8 &&
    new Set(sceneNpcIds).size===sceneNpcIds.length &&
    sceneNpcIds.every(id=>typeof id==='string'&&/^NPC-\d{3,}$/.test(id)&&
      Object.hasOwn(snapshot?.state?.world?.actors??{},id)), 'Invalid scene NPC selection');
  ensure(typeof autoNpcMemory==='boolean','Invalid auto NPC selection flag');
  ensure(Array.isArray(npcKnowledgeClaims)&&npcKnowledgeClaims.length<=8&&
    npcKnowledgeClaims.every(claim=>claim&&typeof claim==='object'&&
      typeof claim.actorId==='string'&&Object.hasOwn(snapshot?.state?.world?.actors??{},claim.actorId)&&
      typeof claim.fact==='string'&&claim.fact.trim().length>=4&&claim.fact.length<=600),
    'Invalid NPC knowledge checks');
  ensure(audience==='narrator_private'||(npcIds.length===0&&sceneNpcIds.length===0&&
    npcKnowledgeClaims.length===0),'NPC memory is narrator-private only');
  const checkpoint=basis(snapshot),entries=selectEntries(snapshot,audience),q=tokens(query);
  const automatic=audience==='narrator_private'&&autoNpcMemory&&npcIds.length===0;
  const selectedNpcIds=automatic?selectNPCMemoryCandidates({
    state:snapshot.state,query,sceneNpcIds}):npcIds;
  const ranked=entries.map(entry=>({...entry,score:rank(entry,q,checkpoint.turn)}))
    .filter(entry=>entry.score>0)
    .sort((a,b)=>b.score-a.score||(b.turn??-1)-(a.turn??-1)||a.id.localeCompare(b.id));
  // Preserve latest context anchors even when a query is very specific.
  const tail=audience==='narrator_private'?entries.filter(e=>e.kind==='event').slice(-2).reverse():
    entries.filter(e=>e.kind==='transcript').slice(-2).reverse();
  const selected=new Map();
  for(const entry of [...tail,...ranked]){
    if(selected.size>=maxReferences)break;
    if(!selected.has(entry.id))selected.set(entry.id,entry);
  }
  let remaining=audience==='narrator_private'?maxPreviewCharacters:0;
  const references=[...selected.values()].map(entry=>{
    const out={id:entry.id,kind:entry.kind,chapterId:entry.chapterId,
      turn:entry.turn,path:entry.path};
    if(remaining>0&&entry.preview){
      const excerpt=entry.preview.slice(0,Math.min(remaining,240));
      out.preview=excerpt;
      out.truncated=excerpt.length<entry.preview.length;
      remaining-=excerpt.length;
    }
    return out;
  });
  return {classification:audience,checkpoint,sourceCommit,
    sourceCommitStatus:sourceCommit?'caller_supplied_verify_against_remote':'not_supplied',
    summary:audience==='narrator_private'?
      'Chapter '+checkpoint.chapterId+'; turn '+checkpoint.turn+'; Day '+checkpoint.day+
      ', '+(checkpoint.timeOfDay??'unknown period')+'; player at '+checkpoint.playerLocationId+'.':
      null,
    references,
    ...(selectedNpcIds.length?{npcMemory:actorMemoryAtCheckpoint(snapshot,selectedNpcIds,
      {compact:automatic,query})}:{}),
    ...(automatic&&unresolvedGivenNames(snapshot.state,query).length?{
      npcAmbiguities:unresolvedGivenNames(snapshot.state,query)}:{}),
    ...(npcKnowledgeClaims.length?{npcKnowledgeChecks:npcKnowledgeClaims.map(claim=>
      factEvidenceAtSnapshot(snapshot,claim.actorId,claim.fact.trim()))}:{}),
    requiredReads:audience==='narrator_private'?mandatoryReads:[],
    warnings:audience==='narrator_private'?
      ['Summaries and pointers are not canon. Check original references before resolving actions.',
       'Run the durable save-journal gate before advancing the story.',
       'Private NPC plans/needs and events must not be copied into player-visible narration.']:
      ['Transcript pointers are not permission to disclose historical private narration.']};
}

/** Exact evidence is returned only for narrator-internal use. */
export function resolvePrivateContextReference({snapshot,referenceId}={}){
  ensure(typeof referenceId==='string'&&referenceId.length>0,'Reference ID required');
  basis(snapshot);
  const event=allEvents(snapshot).find(e=>e.id===referenceId);
  if(event)return {classification:'narrator_private_only',kind:'event',
    path:'chapters/'+event.chapter_id+'.events.json',data:copy(event)};
  const entry=allTranscriptEntries(snapshot).find(e=>e.id===referenceId);
  if(entry)return {classification:'narrator_private_only',kind:'transcript',
    path:'chapters/'+entry.chapter_id+'.transcript.json',data:copy(entry)};
  if(fixedDocs.some(([path])=>path===referenceId))return {
    classification:'narrator_private_only',kind:'document_pointer',path:referenceId,
    status:'fetch_original_from_verified_repository'};
  throw Error('Unresolved reference: '+referenceId);
}
