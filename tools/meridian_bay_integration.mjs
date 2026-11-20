// Opt-in bridge. The ordinary turn engine does not silently import draft maps.
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {stageLivingWorldTurn} from './living_world_coordinator.mjs';
import {verifyMeridianBayWorld} from './meridian_bay_locations.mjs';
import {saveFiveFileTurn} from './save_transaction.mjs';

export function stageMeridianBayTurn({snapshot,turn,observedHead,designReview,
 npcResolutions=[]}={}){
 verifyNarrativeSnapshot(snapshot);
 if(designReview!==undefined||snapshot.state.world.prebuilt_design_id===undefined)
  throw Error('World admission must be saved independently before gameplay');
 verifyMeridianBayWorld(snapshot.state);
 return stageLivingWorldTurn({snapshot,turn,observedHead,npcResolutions});
}

export function saveMeridianBayTurn({remote,journal,branch,chapterId,turn,
 designReview,npcResolutions=[]}={}){
 if(!journal)return Promise.resolve({status:'blocked',
  reason:'Durable journal required for city integration',attempt:null});
 return saveFiveFileTurn({remote,journal,branch,chapterId,
  buildNext:({snapshot,observedHead})=>stageMeridianBayTurn({snapshot,turn,observedHead,
   designReview,npcResolutions})});
}
