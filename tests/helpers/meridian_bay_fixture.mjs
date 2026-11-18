// Test-only normalization for scenarios that need a city before admission.
// This never writes files and must not erase played references to these places.
import {meridianBayDesign,verifyMeridianBayWorld} from '../../tools/meridian_bay_locations.mjs';

const designedIds=new Set(meridianBayDesign().places.map(place=>place.id));
const mentionsDesign=value=>[...designedIds].some(id=>JSON.stringify(value).includes(id));
const insist=(ok,message)=>{if(!ok)throw Error(message)};

export function preAdmissionStateForQA(state){
 verifyMeridianBayWorld(state);
 const copy=structuredClone(state);
 for(const id of designedIds)delete copy.world.locations[id];
 for(const location of Object.values(copy.world.locations))
  if(Array.isArray(location.connected_ids))
   location.connected_ids=location.connected_ids.filter(id=>!designedIds.has(id));
 delete copy.world.prebuilt_design_id;
 delete copy.world.prebuilt_design_review;
 insist(!mentionsDesign(copy),
  'Synthetic pre-admission fixture cannot erase established place-dependent facts');
 return copy;
}

export function preAdmissionFilesForQA(files){
 const copy=structuredClone(files);
 insist(typeof copy['game/STATE.json']==='string','Synthetic fixture needs the saved state');
 for(const [path,text] of Object.entries(copy))
  if(path.startsWith('chapters/')&&(path.endsWith('.events.json')||path.endsWith('.transcript.json')))
   insist(!mentionsDesign(text),
    'Synthetic pre-admission fixture cannot erase played place references');
 const state=JSON.parse(copy['game/STATE.json']);
 const normalized=preAdmissionStateForQA(state);
 // Preserve the original bytes when no design was present in the first place.
 if(JSON.stringify(normalized)!==JSON.stringify(state))
  copy['game/STATE.json']=JSON.stringify(normalized,null,2)+'\n';
 return copy;
}
