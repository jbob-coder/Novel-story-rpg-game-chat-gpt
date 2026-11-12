import test from 'node:test';
import assert from 'node:assert/strict';
import {startSave,recordSaveStage,blockSave,resumeSave,confirmRemoteReadback,assertMayAdvance,saveProgressMessage,SAVE_PHASES,REQUIRED_SAVE_FILES} from '../tools/save_gate.mjs';
const old='a'.repeat(40),fresh='b'.repeat(40);
const sample=()=>Object.fromEntries(REQUIRED_SAVE_FILES.map((p,i)=>[p.replace('CH-NNN','CH-000'),'Archivo completo '+i+'\n—Con diálogo.']));
function throughPreReadback(){
 let x=startSave({source_head:old,chapter_id:'CH-000',turn:1});
 for(const p of SAVE_PHASES.slice(0,-1))x=recordSaveStage(x,p.id,'Evidence: '+p.id);
 return x;
}
test('every real stage is ordered and totals 85% before readback',()=>{
 const x=throughPreReadback();assert.equal(x.percent,85);assert.equal(x.status,'saving');
 assert.throws(()=>assertMayAdvance({checkpoint_valid:true,observed_head:fresh,attempt:x}),/NARRATIVE LOCKED/);
});
test('gated progression is denied on save failure',()=>{
 const x=blockSave(recordSaveStage(startSave({source_head:old,chapter_id:'CH-000',turn:1}),'read','Verified original'),"GitHub unavailable");
 assert.equal(x.percent,10);assert.equal(x.status,'blocked');assert.match(saveProgressMessage(x),/10%/);
 assert.throws(()=>assertMayAdvance({checkpoint_valid:true,observed_head:old,attempt:x}),/NARRATIVE LOCKED/);
 assert.throws(()=>recordSaveStage(x,'validate','cannot skip'),/blocked/);
});
test('resume requires matching remote branch',()=>{
 const x=blockSave(throughPreReadback(),'lost network');
 assert.throws(()=>resumeSave(x,{observed_head:'c'.repeat(40)}),/Remote branch changed/);
 assert.equal(resumeSave(x,{observed_head:old}).percent,85);
});
test('cannot reorder, skip, or forge readback stage',()=>{
 const x=startSave({source_head:old,chapter_id:'CH-000',turn:1});
 assert.throws(()=>recordSaveStage(x,'commit','Made up'),/Unexpected stage/);
 assert.throws(()=>recordSaveStage(throughPreReadback(),'readback','Claim without compare'),/confirmRemoteReadback/);
});
test('exact five-file readback allows advance',()=>{
 const files=sample(),x=confirmRemoteReadback(throughPreReadback(),{branch_head:fresh,commit_head:fresh,expected_files:files,fetched_files:{...files}});
 assert.equal(x.percent,100);assert.equal(x.status,'verified');assert.equal(assertMayAdvance({checkpoint_valid:true,observed_head:fresh,attempt:x}),true);
 assert.match(saveProgressMessage(x),/100%/);
});
test('tampered remote transcript blocks save',()=>{
 const files=sample(),bad={...files,'chapters/CH-000.transcript.json':'TRUNCATED'};
 assert.throws(()=>confirmRemoteReadback(throughPreReadback(),{branch_head:fresh,commit_head:fresh,expected_files:files,fetched_files:bad}),/Remote bytes differ/);
});
test('failed branch update blocks 100% confirmation',()=>{
 const files=sample();assert.throws(()=>confirmRemoteReadback(throughPreReadback(),{branch_head:old,commit_head:fresh,expected_files:files,fetched_files:files}),/Branch ref/);
});
test('real first turn may start only from verified checkpoint with no previous attempt',()=>{
 assert.equal(assertMayAdvance({checkpoint_valid:true,observed_head:old}),true);
 assert.throws(()=>assertMayAdvance({checkpoint_valid:false,observed_head:old}),/Checkpoint/);
});
