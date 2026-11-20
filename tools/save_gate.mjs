// Block the next narrative advance unless a completed story save was remotely verified.
// The percentage is the weight of evidence-backed stages, NOT a progress estimate or background job.
export const SAVE_PHASES=[
  {
    "id": "read",
    "label": "Lectura de checkpoint original",
    "weight": 10
  },
  {
    "id": "validate",
    "label": "Validación del estado original",
    "weight": 15
  },
  {
    "id": "stage",
    "label": "Preparación íntegra del turno",
    "weight": 20
  },
  {
    "id": "preflight",
    "label": "Validación de cinco archivos preparados",
    "weight": 15
  },
  {
    "id": "commit",
    "label": "Creación del commit de guardado",
    "weight": 15
  },
  {
    "id": "ref",
    "label": "Actualización protegida de la rama",
    "weight": 10
  },
  {
    "id": "readback",
    "label": "Lectura remota literal y confirmación",
    "weight": 15
  }
];
export const REQUIRED_SAVE_FILES=[
  "chapters/CH-NNN.transcript.json",
  "chapters/CH-NNN.events.json",
  "chapters/CH-NNN.md",
  "game/STATE.json",
  "game/SAVE_MANIFEST.json"
];
function insist(ok,message){if(!ok)throw new Error(message)}
const copy=x=>JSON.parse(JSON.stringify(x));
export function startSave({source_head,chapter_id,turn}){
 insist(typeof source_head==="string" && /^[a-f0-9]{40}$/.test(source_head),"Verified 40-digit source HEAD required");
 insist(typeof chapter_id==="string" && /^CH-\d{3}$/.test(chapter_id),"Valid chapter ID required");
 insist(Number.isSafeInteger(turn)&&turn>=0,"Turn must be a nonnegative integer");
 return {version:1,status:"saving",source_head,chapter_id,turn,completed:[],evidence:{},percent:0,blocked_reason:null,verified_head:null};
}
export function recordSaveStage(attempt,stage,evidence){
 insist(attempt&&attempt.status==="saving","Save is blocked or already verified; resume after investigation");
 const expected=SAVE_PHASES[attempt.completed.length];
 insist(expected && expected.id===stage,"Unexpected stage; cannot skip, reorder or replay save evidence");
 insist(typeof evidence==="string" && evidence.trim().length>0,"Stage requires observed evidence");
 insist(stage!=="readback","Readback must use confirmRemoteReadback to compare exact files");
 const next=copy(attempt);
 next.completed.push(stage);next.evidence[stage]=evidence;next.percent+=expected.weight;
 insist(next.percent<=85,"Cannot mark 100% until exact remote readback");
 return next;
}
export function blockSave(attempt,reason){
 insist(attempt&&attempt.status!=="verified","Verified save cannot be blocked");
 insist(typeof reason==="string" && reason.trim().length>0,"Blocking reason required");
 const next=copy(attempt);
 next.status="blocked";next.blocked_reason=reason;
 return next;
}
export function resumeSave(attempt,{observed_head,staged_commit_head=null}){
 insist(attempt&&attempt.status==="blocked","Only a blocked save can be resumed");
 insist(typeof observed_head==="string" && /^[a-f0-9]{40}$/.test(observed_head),"Observed remote head required");
 insist(observed_head===attempt.source_head || (staged_commit_head!==null && observed_head===staged_commit_head),"Remote branch changed; stop and reconcile, never overwrite");
 const next=copy(attempt);next.status="saving";next.blocked_reason=null;
 return next;
}
export function confirmRemoteReadback(attempt,{branch_head,commit_head,expected_files,fetched_files}){
 insist(attempt&&attempt.status==="saving","Save blocked; no remote confirmation allowed");
 insist(attempt.completed.length===SAVE_PHASES.length-1,"Cannot confirm before all save stages");
 insist(typeof commit_head==="string" && /^[a-f0-9]{40}$/.test(commit_head),"Commit SHA not verified");
 insist(commit_head===branch_head,"Branch ref does not point at saved commit");
 insist(expected_files&&fetched_files&&typeof expected_files==="object"&&typeof fetched_files==="object","Missing remote readback");
 const required=REQUIRED_SAVE_FILES.map(path=>path.replace("CH-NNN",attempt.chapter_id));
 for(const path of required){
  insist(typeof expected_files[path]==="string","Missing staged file: "+path);
  insist(typeof fetched_files[path]==="string","Missing fetched file: "+path);
  insist(expected_files[path]===fetched_files[path],"Remote bytes differ for: "+path);
 }
 const next=copy(attempt);
 next.completed.push("readback");next.evidence.readback="All five exact files matched at "+commit_head;
 next.percent=100;next.status="verified";next.verified_head=commit_head;
 return next;
}
export function assertMayAdvance({checkpoint_valid,observed_head,attempt=null}){
 insist(checkpoint_valid===true,"Checkpoint has not passed state/event/transcript validation");
 insist(typeof observed_head==="string"&&/^[a-f0-9]{40}$/.test(observed_head),"Missing verified branch HEAD");
 if(attempt!==null){
  insist(attempt.status==="verified"&&attempt.percent===100&&attempt.verified_head===observed_head,"Previous story save not fully verified: NARRATIVE LOCKED");
 }
 return true;
}
export function saveProgressMessage(attempt){
 if(!attempt)return "GUARDADO: sin intento en curso. Leer checkpoint remoto antes de narrar.";
 const current=SAVE_PHASES[attempt.completed.length];
 if(attempt.status==="verified")return "GUARDADO VERIFICADO: 100% — cinco archivos recuperados idénticos. Se puede continuar en el próximo input.";
 const label=attempt.status==="blocked"?"🚩 GUARDADO BLOQUEADO":"GUARDANDO";
 const missing=current?current.label:"confirmación final";
 return label+": "+attempt.percent+"% verificado. Próxima etapa: "+missing+"."+
  (attempt.blocked_reason?" Motivo: "+attempt.blocked_reason+".":"")+
  " NO avanzar la narración. Próximo input: «CONTINUAR GUARDADO».";
}
