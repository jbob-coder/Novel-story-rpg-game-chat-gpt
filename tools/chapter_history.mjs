// Chapter-local archives with a single global history. Closed files are immutable.
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const check=(ok,message)=>{if(!ok)throw Error(message)};
const validId=id=>typeof id==='string'&&/^CH-\d{3}$/.test(id);
const chapterId=index=>'CH-'+String(index).padStart(3,'0');
const natural=value=>Number.isSafeInteger(value)&&value>=0;
export const fileDigest=text=>createHash('sha256').update(text,'utf8').digest('hex');

export function chapterFilePaths(id){
 check(validId(id),'Invalid chapter ID');
 return [`chapters/${id}.transcript.json`,`chapters/${id}.events.json`,`chapters/${id}.md`];
}

// Helpers also accept small single-chapter fixtures used by individual modules.
export function chapterRecords(snapshot){
 const closed=snapshot.state?.history?.completed_chapters??[];
 return [...closed.map(descriptor=>{
  const record=snapshot.archives?.[descriptor.id];
  check(record,'Missing closed chapter archive: '+descriptor.id);
  return {...record,id:descriptor.id,closed:true};
 }),{id:snapshot.manifest?.chapter_id??snapshot.events?.chapter_id,
  chapter:snapshot.chapter,events:snapshot.events,transcript:snapshot.transcript,closed:false}];
}
export function allEvents(snapshot){return chapterRecords(snapshot).flatMap(record=>record.events.events)}
export function allTranscriptEntries(snapshot){return chapterRecords(snapshot).flatMap(record=>record.transcript.entries)}

export function verifyChapterHistory(snapshot){
 const descriptors=snapshot.state?.history?.completed_chapters??[];
 check(Array.isArray(descriptors),'Completed chapter index must be an array');
 const archives=snapshot.archives??{};
 check(archives&&typeof archives==='object'&&!Array.isArray(archives),'Invalid chapter archives');
 check(Object.keys(archives).length===descriptors.length,'Undeclared or missing closed chapter archive');
 let eventOffset=0,transcriptOffset=0,lastTurn=0;
 for(let i=0;i<descriptors.length;i++){
  const d=descriptors[i];
  check(d&&d.id===chapterId(i),'Closed chapter order or identity mismatch');
  const record=archives[d.id];
  check(record&&typeof record.chapter==='string'&&Array.isArray(record.events?.events)&&
   Array.isArray(record.transcript?.entries),'Missing complete closed chapter: '+d.id);
  check(record.events.chapter_id===d.id&&record.transcript.chapter_id===d.id,
   'Closed chapter record identity mismatch');
  const events=record.events.events,entries=record.transcript.entries;
  check(events.length>0&&entries.length>0,'Cannot archive an empty chapter');
  const paths=chapterFilePaths(d.id);
  check(d.file_hashes&&Object.keys(d.file_hashes).length===3,'Closed chapter file hashes required');
  for(const path of paths){
   check(typeof record.files?.[path]==='string','Closed chapter original bytes missing: '+path);
   check(typeof d.file_hashes[path]==='string'&&/^[0-9a-f]{64}$/.test(d.file_hashes[path])&&
    fileDigest(record.files[path])===d.file_hashes[path],'Closed chapter hash mismatch: '+path);
  }
  check(isDeepStrictEqual(JSON.parse(record.files[paths[0]]),record.transcript)&&
   isDeepStrictEqual(JSON.parse(record.files[paths[1]]),record.events)&&
   record.files[paths[2]]===record.chapter,'Closed chapter parsed data differs from original files');
  check(d.first_event_sequence===eventOffset+1&&d.last_event_sequence===eventOffset+events.length&&
   d.first_transcript_sequence===transcriptOffset+1&&
   d.last_transcript_sequence===transcriptOffset+entries.length,'Closed chapter sequence bounds mismatch');
  check(natural(d.first_turn)&&d.first_turn===lastTurn+1&&d.last_turn>=d.first_turn&&
   d.first_turn===events[0].turn&&d.last_turn===events.at(-1).turn,'Closed chapter turn bounds mismatch');
  check(typeof d.closed_from_commit==='string'&&/^[0-9a-f]{40}$/.test(d.closed_from_commit)&&
   typeof d.closure_reason==='string'&&d.closure_reason.trim(),'Closed chapter closure provenance required');
  eventOffset=d.last_event_sequence;transcriptOffset=d.last_transcript_sequence;lastTurn=d.last_turn;
 }
 check(snapshot.manifest?.chapter_id===chapterId(descriptors.length),'Active chapter is not the next indexed chapter');
 let expectedEvent=1,expectedTranscript=1,priorTurn=0;
 for(const record of chapterRecords(snapshot)){
  check(typeof record.chapter==='string'&&record.events?.chapter_id===record.id&&
   record.transcript?.chapter_id===record.id&&Array.isArray(record.events.events)&&
   Array.isArray(record.transcript.entries),'Chapter records missing or mismatched');
  if(record.events.events.length)
   check(record.events.events[0].turn===priorTurn+1,'A chapter must begin with the next global turn');
  for(const event of record.events.events){
   check(event.chapter_id===record.id&&event.id==='EV-'+String(expectedEvent++).padStart(6,'0'),
    'Global event identity or chapter mismatch');
   check(Number.isSafeInteger(event.turn)&&event.turn>=priorTurn,'Global chapter turn order mismatch');
   priorTurn=event.turn;
  }
  for(const entry of record.transcript.entries)
   check(entry.chapter_id===record.id&&entry.id==='TXT-'+String(expectedTranscript++).padStart(6,'0'),
    'Global transcript identity or chapter mismatch');
  check(record.transcript.last_entry_sequence===expectedTranscript-1,'Transcript length mismatch: chapter global cursor');
 }
 return true;
}
