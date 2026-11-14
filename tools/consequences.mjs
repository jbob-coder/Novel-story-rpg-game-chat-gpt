import {allEvents} from './chapter_history.mjs';
// Persistent, event-backed decision consequences for the chat-run story.
// A thread is a causally supported open question, not a predetermined ending.
function need(ok,message){if(!ok)throw new Error(message)}
const duplicate=x=>JSON.parse(JSON.stringify(x));
function verifyConsequences(snapshot){
 const s=snapshot.state,e=snapshot.events;
 need(Array.isArray(s.narrative_threads),"Narrative thread ledger missing");
 const events=new Map(allEvents(snapshot).map(x=>[x.id,x]));
 const actors=new Set([s.player.id,...Object.keys(s.world.actors)]);
 s.narrative_threads.forEach((x,index)=>{
  const id="THREAD-"+String(index+1).padStart(6,"0");
  need(x&&x.id===id,"Consequence thread ID mismatch or duplicate");
  need(actors.has(x.owner_actor_id),"Consequence thread actor missing");
  need(typeof x.question==="string"&&x.question.trim().length>=10,"Consequence thread question missing");
  need(["open","resolved"].includes(x.status),"Consequence thread status invalid");
  need(["private","observable","world"].includes(x.scope),"Consequence thread scope invalid");
  need(Array.isArray(x.history)&&x.history.length>=1,"Consequence thread has no event history");
  need(x.origin_event_id===x.history[0].event_id,"Consequence thread origin mismatch");
  let lastTurn=0;
  x.history.forEach((h,i)=>{
   need(h&&["open","develop","resolve"].includes(h.kind),"Consequence operation invalid");
   need(i===0 ? h.kind==="open" : h.kind!=="open","Consequence history opening invalid");
   const event=events.get(h.event_id);
   need(event&&event.turn>=lastTurn,"Consequence update event missing/out of order");
   need(typeof h.summary==="string"&&h.summary.trim().length>=6,"Consequence summary missing");
   need(["hidden","known"].includes(h.visibility),"Consequence visibility invalid");
   lastTurn=event.turn;
  });
  const ends=x.history.filter(h=>h.kind==="resolve");
  need(ends.length<=1,"Consequence thread resolved multiple times");
  need((x.status==="resolved")===(ends.length===1),"Consequence resolution status mismatch");
  need(x.status==="resolved" ? x.resolution_event_id===ends[0].event_id : x.resolution_event_id===null,"Consequence resolution ID mismatch");
 });
 return true;
}
function stageConsequences(snapshot,updates=[]){
 verifyConsequences(snapshot);
 need(Array.isArray(updates)&&updates.length<=12,"Too many consequence operations");
 const next=duplicate(snapshot);
 const records=next.state.narrative_threads;
 const events=new Map(allEvents(next).map(e=>[e.id,e]));
 const currentTurn=next.manifest.last_completed_turn;
 for(const change of updates){
  need(change&&["open","develop","resolve"].includes(change.op),"Unknown consequence operation");
  const event=events.get(change.event_id);
  need(event&&event.turn===currentTurn&&currentTurn>=1,"Consequence must reference an actual event in the current turn");
  need(typeof change.summary==="string"&&change.summary.trim().length>=6,"Consequence needs factual summary");
  need(["hidden","known"].includes(change.visibility),"Consequence needs defined knowledge visibility");
  if(change.op==="open"){
   const owner=change.owner_actor_id;
   need(owner===next.state.player.id||Object.hasOwn(next.state.world.actors,owner),"Consequence opening actor unknown");
   need(typeof change.question==="string"&&change.question.trim().length>=10,"Opening question required");
   need(["private","observable","world"].includes(change.scope),"Scope missing");
   const id="THREAD-"+String(records.length+1).padStart(6,"0");
   records.push({id,owner_actor_id:owner,question:change.question,scope:change.scope,status:"open",origin_event_id:event.id,resolution_event_id:null,history:[{kind:"open",event_id:event.id,summary:change.summary,visibility:change.visibility}]});
  }else{
   const current=records.find(x=>x.id===change.thread_id);
   need(current&&current.status==="open","Consequence target not open or missing");
   need(!current.history.some(x=>x.event_id===event.id&&x.kind===change.op),"Consequence event duplicated");
   current.history.push({kind:change.op,event_id:event.id,summary:change.summary,visibility:change.visibility});
   if(change.op==="resolve"){current.status="resolved";current.resolution_event_id=event.id}
  }
 }
 verifyConsequences(next);
 return next;
}
export {verifyConsequences,stageConsequences};
