// Complete game dialogue archiver; pure functions only, no repository network writes.
function ensure(ok,msg){if(!ok)throw new Error(msg);}
function checkFullNarration(snapshot){
 const s=snapshot.state,m=snapshot.manifest,e=snapshot.events,a=snapshot.transcript;
 ensure(a&&Array.isArray(a.entries),"Full transcript missing");
 ensure(a.schema_version===1&&a.chapter_id===m.chapter_id&&e.chapter_id===m.chapter_id,"Transcript chapter/schema mismatch");
 ensure(a.last_entry_sequence===a.entries.length,"Transcript length mismatch");
 ensure(s.history.last_transcript_sequence===a.entries.length&&m.last_transcript_sequence===a.entries.length,"Transcript count mismatch");
 ensure(m.last_transcript_id===(a.entries.length?a.entries[a.entries.length-1].id:null),"Transcript last ID mismatch");
 const ids=new Set(e.events.map(x=>x.id)),scenes=new Set(),turns=new Map();
 a.entries.forEach((x,i)=>{
  ensure(x.id==="TXT-"+String(i+1).padStart(6,"0"),"Transcript duplicate/gap in entry ID");
  ensure(x.chapter_id===m.chapter_id&&Number.isInteger(x.turn)&&x.turn>=0&&x.turn<=m.last_completed_turn,"Transcript event turn mismatch");
  ensure(typeof x.text==="string"&&x.text.trim()!=="","Verbatim text is missing");
  ensure(Array.isArray(x.event_ids)&&x.event_ids.every(id=>ids.has(id)),"Transcript event link missing");
  ensure((x.role==="player"&&x.kind==="player_action")||(x.role==="assistant"&&(x.kind==="scene"||x.kind==="resolution")),"Transcript role/type mismatch");
  if(x.kind==="scene"){
    ensure(typeof x.source_key==="string"&&x.source_key.length>=6,"Scene source key missing");
    ensure(!scenes.has(x.source_key),"Scene duplicate");scenes.add(x.source_key);
  }
  if(x.turn===0)ensure(x.kind==="scene","Turn zero cannot contain an action");
  const list=turns.get(x.turn)||[];list.push(x);turns.set(x.turn,list);
 });
 for(let i=1;i<=m.last_completed_turn;i++){
  const list=turns.get(i)||[];
  const p=list.filter(x=>x.role==="player"),n=list.filter(x=>x.kind==="resolution");
  ensure(p.length===1&&n.length>=1,"Completed turn lacks full player/narrator text");
  ensure(list.indexOf(p[0])<list.indexOf(n[0]),"Narration before player action");
  const action=e.events.find(x=>x.turn===i&&x.kind==="player_action");
  ensure(action&&p[0].event_ids.includes(action.id),"Action not linked to transcript");
 }
 return true;
}
function addFullEntry(snapshot,role,kind,turn,body,eventIds,sceneKey){
 ensure(typeof body==="string"&&body.trim().length>0,"Exact message text required");
 const a=snapshot.transcript;
 const entry={id:"TXT-"+String(a.entries.length+1).padStart(6,"0"),chapter_id:a.chapter_id,turn:turn,role:role,kind:kind,text:body,event_ids:eventIds};
 if(sceneKey!==null)entry.source_key=sceneKey;
 a.entries.push(entry);a.last_entry_sequence=a.entries.length;
 snapshot.state.history.last_transcript_sequence=a.entries.length;
 snapshot.manifest.last_transcript_sequence=a.entries.length;
 snapshot.manifest.last_transcript_id=entry.id;
 return entry;
}
function stageNarratorScene(snapshot,sceneText,sceneKey){
 checkFullNarration(snapshot);
 ensure(typeof sceneKey==="string"&&sceneKey.length>=6,"Scene key required");
 ensure(!snapshot.transcript.entries.some(x=>x.source_key===sceneKey),"Scene already saved");
 const next=JSON.parse(JSON.stringify(snapshot));
 addFullEntry(next,"assistant","scene",next.manifest.last_completed_turn,sceneText,[],sceneKey);
 checkFullNarration(next);
 return next;
}
function appendFullTurn(snapshot,playerText,narrationMessages){
 ensure(typeof playerText==="string"&&playerText.trim().length>0,"Exact player message required");
 ensure(Array.isArray(narrationMessages)&&narrationMessages.length>0&&narrationMessages.every(x=>typeof x==="string"&&x.trim().length>0),"Exact narrator messages required");
 const t=snapshot.manifest.last_completed_turn;
 ensure(t>0&&!snapshot.transcript.entries.some(x=>x.turn===t&&x.role==="player"),"Already recorded player turn");
 const es=snapshot.events.events.filter(x=>x.turn===t),playerEvent=es.find(x=>x.kind==="player_action");
 ensure(playerEvent,"Player event missing");
 addFullEntry(snapshot,"player","player_action",t,playerText,[playerEvent.id],null);
 narrationMessages.forEach(body=>addFullEntry(snapshot,"assistant","resolution",t,body,es.map(x=>x.id),null));
 checkFullNarration(snapshot);
 return snapshot;
}
export {checkFullNarration,stageNarratorScene,appendFullTurn};
