// Opt-in bridge. The ordinary turn engine does not silently import draft maps.
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {stageLivingWorldTurn} from './living_world_coordinator.mjs';
import {admitMeridianBayWorld} from './meridian_bay_locations.mjs';
import {saveFiveFileTurn} from './save_transaction.mjs';

export function stageMeridianBayTurn({snapshot,turn,observedHead,designReview,
 npcResolutions=[]}={}){
 verifyNarrativeSnapshot(snapshot);
 const prepared=structuredClone(snapshot);
 prepared.state=admitMeridianBayWorld({state:snapshot.state,designReview,observedHead,
  nextTurn:snapshot.manifest.last_completed_turn+1});
 return stageLivingWorldTurn({snapshot:prepared,turn,observedHead,npcResolutions});
}

export function saveMeridianBayTurn({remote,journal,branch,chapterId,turn,
 designReview,npcResolutions=[]}={}){
 if(!journal)return Promise.resolve({status:'blocked',
  reason:'Durable journal required for city integration',attempt:null});
 return saveFiveFileTurn({remote,journal,branch,chapterId,
  buildNext:({snapshot,observedHead})=>stageMeridianBayTurn({snapshot,turn,observedHead,
   designReview,npcResolutions})});
}
