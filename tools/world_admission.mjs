// Worldbuilding admission is separate from a played turn. Only the reviewed
// catalog, its district links and admission metadata may differ from source.
import {isDeepStrictEqual as same} from 'node:util';
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {admitMeridianBayWorld} from './meridian_bay_locations.mjs';

const check=(ok,message)=>{if(!ok)throw Error(message)};
const copy=value=>structuredClone(value);
const withoutSource=snapshot=>{
 const result=copy(snapshot);delete result.sourceFiles;return result;
};

export function stageWorldAdmission({snapshot,designReview,observedHead}={}){
 verifyNarrativeSnapshot(snapshot);
 check(snapshot.state.world.prebuilt_design_id===undefined,
  'World design is already admitted; recover its original operation');
 const candidate=withoutSource(snapshot);
 candidate.state=admitMeridianBayWorld({state:snapshot.state,designReview,observedHead,
  admissionTurn:snapshot.manifest.last_completed_turn});
 verifyNarrativeSnapshot(candidate);
 assertWorldAdmission(snapshot,candidate,observedHead);
 return candidate;
}

export function assertWorldAdmission(before,after,sourceHead){
 verifyNarrativeSnapshot(before);verifyNarrativeSnapshot(after);
 check(before.state.world.prebuilt_design_id===undefined,
  'World design is already admitted; cannot duplicate admission');
 const review=after.state.world.prebuilt_design_review;
 check(review?.operation==='world_admission'&&
  review.effective_from_turn===before.manifest.last_completed_turn&&
  review.source_commit===sourceHead,'World admission identity differs from source');
 const expected=withoutSource(before);
 expected.state=admitMeridianBayWorld({state:before.state,designReview:review,
  observedHead:sourceHead,admissionTurn:before.manifest.last_completed_turn});
 check(same(expected,withoutSource(after)),
  'World admission changed something beyond the reviewed catalog and its district links');
 return true;
}
