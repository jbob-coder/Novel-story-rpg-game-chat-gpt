// Preparation and explicit metadata-only chapter transitions. Never creates a scene.
import {isDeepStrictEqual} from 'node:util';
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {chapterFilePaths,fileDigest,allEvents,allTranscriptEntries} from './chapter_history.mjs';
import {assertMayAdvance} from './save_gate.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message)};
const text=value=>typeof value==='string'&&value.trim().length>0;
const list=value=>Array.isArray(value)&&value.every(text)&&new Set(value).size===value.length;
const copy=value=>JSON.parse(JSON.stringify(value));

export function validateChapterPlan(plan,{snapshot,observedHead}={}){
 check(plan&&typeof plan==='object'&&!Array.isArray(plan),'Chapter planning record required');
 check(isDeepStrictEqual(JSON.parse(JSON.stringify(plan)),plan),'Chapter plan must be JSON serializable');
 check(plan.plan_version===1&&/^CH-\d{3}$/.test(plan.chapter_id)&&text(plan.title)&&
  ['draft','prepared'].includes(plan.status)&&text(plan.purpose),'Invalid chapter planning identity or purpose');
 check(typeof plan.source_commit==='string'&&/^[0-9a-f]{40}$/.test(plan.source_commit),
  'Chapter plan needs a source commit');
 if(observedHead!==undefined)check(plan.source_commit===observedHead,'Stale chapter planning source commit');
 check(plan.time_context&&Number.isSafeInteger(plan.time_context.day)&&
  (plan.time_context.period===null||['morning','midday','afternoon','evening','night'].includes(plan.time_context.period))&&
  list(plan.time_context.constraints),'Invalid chapter planning time context');
 for(const field of ['location_ids','npc_ids','thread_ids','hidden_plan_ids','possible_developments','exit_conditions'])
  check(list(plan[field]),'Chapter planning list required: '+field);
 check(plan.exit_conditions.length>0,'Chapter planning exit conditions required');
 if(snapshot){
  check(plan.time_context.day===snapshot.state.time.day&&
   plan.time_context.period===(snapshot.state.time.time_of_day??null),'Chapter planning time differs from current checkpoint');
  check(plan.location_ids.every(id=>Object.hasOwn(snapshot.state.world.locations,id)),
   'Chapter plan references an unknown location');
  check(plan.npc_ids.every(id=>Object.hasOwn(snapshot.state.world.actors,id)),
   'Chapter plan references an unknown NPC');
  const threads=new Set(snapshot.state.narrative_threads.map(thread=>thread.id));
  check(plan.thread_ids.every(id=>threads.has(id)),'Chapter plan references an unknown thread');
  const plans=new Set(Object.values(snapshot.state.world.actors).flatMap(actor=>(actor.plans??[]).map(p=>p.id)));
  check(plan.hidden_plan_ids.every(id=>plans.has(id)),'Chapter plan references an unknown hidden plan');
 }
 return true;
}

export function stageChapterTransition({snapshot,nextPlan,reason,observedHead,reviewed=false,sourceFiles}={}){
 verifyNarrativeSnapshot(snapshot);
 assertMayAdvance({checkpoint_valid:true,observed_head:observedHead});
 check(reviewed===true&&text(reason),'Chapter closure requires explicit review and a reason');
 validateChapterPlan(nextPlan,{snapshot,observedHead});
 check(nextPlan.status==='prepared','Chapter plan is not prepared');
 const previousId=snapshot.manifest.chapter_id;
 const nextId='CH-'+String(Number(previousId.slice(3))+1).padStart(3,'0');
 check(/^CH-\d{3}$/.test(nextId)&&nextPlan.chapter_id===nextId,'Chapter transition must open the next chapter');
 check(!snapshot.archives?.[nextId],'Chapter destination already exists');
 check(snapshot.events.events.length>0&&snapshot.transcript.entries.some(entry=>entry.kind==='resolution'),
  'Cannot close an empty or unplayed chapter');
 const paths=chapterFilePaths(previousId),files=sourceFiles??snapshot.sourceFiles;
 for(const path of [...paths,'game/STATE.json','game/SAVE_MANIFEST.json'])
  check(typeof files?.[path]==='string','Verified original file required to close chapter: '+path);
 check(isDeepStrictEqual(JSON.parse(files[paths[0]]),snapshot.transcript)&&
  isDeepStrictEqual(JSON.parse(files[paths[1]]),snapshot.events)&&files[paths[2]]===snapshot.chapter&&
  isDeepStrictEqual(JSON.parse(files['game/STATE.json']),snapshot.state)&&
  isDeepStrictEqual(JSON.parse(files['game/SAVE_MANIFEST.json']),snapshot.manifest),
  'Chapter source files differ from the checkpoint');
 const next=copy(snapshot),events=allEvents(snapshot),entries=allTranscriptEntries(snapshot);
 const descriptor={id:previousId,
  first_turn:snapshot.events.events[0].turn,last_turn:snapshot.manifest.last_completed_turn,
  first_event_sequence:events.length-snapshot.events.events.length+1,last_event_sequence:events.length,
  first_transcript_sequence:entries.length-snapshot.transcript.entries.length+1,last_transcript_sequence:entries.length,
  file_hashes:Object.fromEntries(paths.map(path=>[path,fileDigest(files[path])])),
  closed_from_commit:observedHead,closure_reason:reason};
 next.archives??={};
 next.archives[previousId]={chapter:snapshot.chapter,events:copy(snapshot.events),transcript:copy(snapshot.transcript),
  files:Object.fromEntries(paths.map(path=>[path,files[path]]))};
 next.state.history.completed_chapters.push(descriptor);
 next.state.chapter={...next.state.chapter,id:nextId,status:'opening',planning:copy(nextPlan)};
 next.manifest.chapter_id=nextId;
 next.chapter='';
 next.events={schema_version:snapshot.events.schema_version,chapter_id:nextId,events:[]};
 next.transcript={schema_version:1,chapter_id:nextId,
  last_entry_sequence:next.manifest.last_transcript_sequence,entries:[]};
 // Only a reload of the verified destination commit can supply fresh original bytes.
 delete next.sourceFiles;
 verifyNarrativeSnapshot(next);
 return next;
}
