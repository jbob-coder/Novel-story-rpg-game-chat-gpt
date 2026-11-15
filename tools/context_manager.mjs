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
  maxReferences=8,maxPreviewCharacters=1600,sourceCommit=null}={}){
  ensure(validAudience.has(audience),'Unsupported context audience');
  ensure(typeof query==='string'&&query.length<=500,'Invalid context query');
  ensure(Number.isSafeInteger(maxReferences)&&maxReferences>=1&&maxReferences<=30,
    'Invalid reference limit');
  ensure(Number.isSafeInteger(maxPreviewCharacters)&&maxPreviewCharacters>=0&&
    maxPreviewCharacters<=10000,'Invalid preview budget');
  ensure(sourceCommit===null||(typeof sourceCommit==='string'&&/^[0-9a-f]{40}$/.test(sourceCommit)),
    'Invalid source commit identifier');
  const checkpoint=basis(snapshot),entries=selectEntries(snapshot,audience),q=tokens(query);
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
