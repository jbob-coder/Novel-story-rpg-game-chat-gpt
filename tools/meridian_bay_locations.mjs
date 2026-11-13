// D-060: establish a single observed public place inside a known Meridian Bay
// neighborhood, exclusively when Jack actually observes it in a reviewed
// player-triggered scene. The catalog is not canon and cannot create places.
import {inspectMeridianBay} from './meridian_bay_city.mjs';

const insist=(ok,message)=>{if(!ok)throw Error(message)};
const copy=x=>JSON.parse(JSON.stringify(x));
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
const validNewId=x=>typeof x==='string'&&/^LOC-[A-Z][A-Z0-9-]{4,63}$/.test(x);
const textField=(x,min=12,max=500)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max;
const BUILTIN=new Set([
 'LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL',
 'LOC-COMMERCIAL-DISTRICT','LOC-HARBOR-WALK',
 'LOC-RAILGARDEN-RESIDENTIAL','LOC-WILSON-APARTMENT',
 'LOC-WILSON-WORKSHOP','LOC-CAFE-BRUMA'
]);
const RECORD_KEYS=new Set(['id','name','type','description','parent_id',
 'connected_ids','public_area','access_status','origin_opportunity_id',
 'established_event_id','scene_quote','access_quote',
 'opening_hours','travel_minutes']);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const shown=(messages,phrase)=>Array.isArray(messages)&&
 messages.some(s=>typeof s==='string'&&s.includes(phrase));
function isProposedAt(state,anchorId,opportunityId){
 const report=inspectMeridianBay({state,anchorId});
 return report.areas.some(a=>a.anchorId===anchorId &&
  a.opportunities.some(o=>o.id===opportunityId&&
   o.status==='proposed_not_canon'));
}
function validateRecord(loc,state){
 insist(loc&&typeof loc==='object'&&!Array.isArray(loc)&&
  Object.keys(loc).length===RECORD_KEYS.size&&
  Object.keys(loc).every(k=>RECORD_KEYS.has(k)),
  'Noncanonical added place shape');
 insist(validNewId(loc.id)&&textField(loc.name,3,90)&&
  textField(loc.type,4,64)&&textField(loc.description,12,500),
  'New place requires a concrete ID, name, type and description');
 insist(loc.parent_id!==loc.id&&loc.parent_id?.startsWith('LOC-')&&
  has(state.world.locations,loc.parent_id)&&
  isProposedAt(state,loc.parent_id,loc.origin_opportunity_id),
  'Place must originate from an opportunity in a known anchored district');
 insist(same(loc.connected_ids,[loc.parent_id])&&
  loc.public_area===true&&loc.access_status==='public_confirmed',
  'New visitable place must have explicitly confirmed public access and no shortcut');
 insist(/^EV-\d{6,}$/.test(loc.established_event_id)&&
  textField(loc.scene_quote,16,450)&&
  textField(loc.access_quote,16,450)&&loc.scene_quote!==loc.access_quote&&
  loc.opening_hours===null&&loc.travel_minutes===null,
  'New place needs distinct scene/access evidence; schedules and travel times stay unknown');
 return true;
}
/**
 * This mutation happens on a detached staged snapshot, before actor movement.
 * The caller must NOT invoke this on the canonical branch without an actual
 * player action, justified public scene, and durable five-file transaction.
 */
export function applyReviewedPlaceDiscovery({state,event,discoveries=[],
 narrationMessages=[]}={}){
 insist(state?.world?.locations&&state?.player&&event?.kind==='player_action'&&
  event.actor_ids?.length===1&&event.actor_ids[0]===state.player.id&&
  Array.isArray(event.state_changes),'Actual player event required for place establishment');
 insist(Array.isArray(discoveries)&&discoveries.length<=2,
  'Maximum two observed places per genuine player turn');
 if(discoveries.length===0)return [];
 insist(Array.isArray(narrationMessages)&&narrationMessages.length>0,
  'Narrated player scene required for a new place');
 const source=copy(state),draft=copy(state),emitted=[];
 const seenIds=new Set(),seenOpportunities=new Set();
 for(const d of discoveries){
  insist(d&&typeof d==='object'&&!Array.isArray(d)&&d.reviewed===true&&
   d.public_access_confirmed===true,
   'Narrator-reviewed public access confirmation required');
  insist(validNewId(d.id)&&!seenIds.has(d.id)&&
   !has(draft.world.locations,d.id),'New place ID is invalid, duplicate, or already in canon');
  insist(typeof d.opportunity_id==='string'&&
   !seenOpportunities.has(d.opportunity_id),
   'An opportunity can establish only one place per turn');
  insist(textField(d.scene_quote,16,450)&&textField(d.access_quote,16,450)&&
   d.scene_quote!==d.access_quote&&
   shown(narrationMessages,d.scene_quote)&&
   shown(narrationMessages,d.access_quote),
   'Public place and access must appear literally in the current narrated scene');
  insist(d.anchor_id?.startsWith('LOC-')&&
   has(source.world.locations,d.anchor_id)&&
   isProposedAt(source,d.anchor_id,d.opportunity_id),
   'Place is not backed by an opportunity at this existing anchor');
  insist(!Object.values(source.world.locations).some(loc=>
   loc.origin_opportunity_id===d.opportunity_id),
   'Opportunity was already established in a prior turn');
  const loc={id:d.id,name:d.name,type:d.type,description:d.description,
   parent_id:d.anchor_id,connected_ids:[d.anchor_id],
   public_area:true,access_status:'public_confirmed',
   origin_opportunity_id:d.opportunity_id,
   established_event_id:event.id,
   scene_quote:d.scene_quote,access_quote:d.access_quote,
   opening_hours:null,travel_minutes:null};
  draft.world.locations[d.id]=loc;
  validateRecord(loc,source);
  const anchor=draft.world.locations[d.anchor_id];
  insist(Array.isArray(anchor.connected_ids)&&
   !anchor.connected_ids.includes(d.id),
   'Existing connection graph conflicts with the new public place');
  const before=copy(anchor.connected_ids);
  anchor.connected_ids.push(d.id);
  emitted.push({actor_id:state.player.id,field:'world_location',
   location_id:d.id,before:null,after:copy(loc)});
  emitted.push({actor_id:state.player.id,field:'world_location_link',
   anchor_id:d.anchor_id,before,after:copy(anchor.connected_ids)});
  seenIds.add(d.id);
  seenOpportunities.add(d.opportunity_id);
 }
 // Commit to the staged state only when the entire proposed group is sound.
 state.world.locations=draft.world.locations;
 event.state_changes.push(...emitted);
 return copy(emitted);
}
// Read-only visited-place overview. Established access is not an opening-hour
// guarantee and does not establish a shopkeeper, inventory, service or receipt.
export function inspectSceneEstablishedPlaces({state,fromId=null}={}){
 insist(state?.world?.locations,'Saved city state required');
 insist(fromId===null||has(state.world.locations,fromId),
  'Unknown route origin for visitable inspection');
 const places=Object.values(state.world.locations)
  .filter(loc=>loc?.established_event_id!==undefined);
 return copy(places.map(loc=>({
  locationId:loc.id,name:loc.name,anchorId:loc.parent_id,
  publicAccessConfirmed:loc.public_area===true&&
   loc.access_status==='public_confirmed',
  evidenceEventId:loc.established_event_id,
  opportunityId:loc.origin_opportunity_id,
  openingHours:null,travelMinutes:null,
  route:fromId===null?null:routeWithinSavedGraph(state,fromId,loc.id)
 })));
}
function routeWithinSavedGraph(state,from,end){
 if(!from?.startsWith('LOC-')||!end?.startsWith('LOC-'))return null;
 const queue=[[from]],seen=new Set([from]);
 for(let i=0;i<queue.length;i++){
  const path=queue[i],last=path.at(-1);
  if(last===end)return path;
  for(const to of state.world.locations[last]?.connected_ids??[]){
   if(!to?.startsWith('LOC-')||!has(state.world.locations,to)||seen.has(to))
    continue;
   seen.add(to);queue.push([...path,to]);
  }
 }
 return null;
}
export function verifyReviewedPlaceHistory(snapshot){
 insist(snapshot?.state?.world?.locations&&snapshot?.events?.events&&
  snapshot?.transcript?.entries,'Complete saved scene and event record required');
 const {locations}=snapshot.state.world,events=snapshot.events.events;
 const newLocations=Object.entries(locations).filter(([id])=>
  id.startsWith('LOC-')&&!BUILTIN.has(id));
 const seen=new Set();
 for(const [id,loc] of newLocations){
  insist(!seen.has(loc.origin_opportunity_id),
   'Opportunity cannot establish multiple new places without separate evidence');
  seen.add(loc.origin_opportunity_id);
  validateRecord(loc,snapshot.state);
  insist(loc.id===id&&
   locations[loc.parent_id].connected_ids?.includes(id),
   'New public place has missing reciprocal anchor connection');
  const source=events.find(e=>e.id===loc.established_event_id);
  insist(source&&source.kind==='player_action'&&
   source.actor_ids?.[0]===snapshot.state.player.id,
   'New place lacks the actual player-scene event');
  insist(source.state_changes.some(c=>c.field==='world_location'&&
   c.location_id===id&&c.before===null&&same(c.after,loc))&&
   source.state_changes.some(c=>c.field==='world_location_link'&&
   c.anchor_id===loc.parent_id&&Array.isArray(c.after)&&
   c.after.includes(id)),
   'Place evidence and anchor link must be recorded in source event');
  const narrated=snapshot.transcript.entries.filter(e=>
   e.turn===source.turn&&e.role==='assistant');
  insist(shown(narrated.map(e=>e.text),loc.scene_quote)&&
   shown(narrated.map(e=>e.text),loc.access_quote),
   'New public place was not established in its saved narration');
 }
 for(const e of events){
  if(e.turn<=6)continue;
  for(const c of e.state_changes){
   if(c.field==='world_location')
    insist(newLocations.some(([id,loc])=>id===c.location_id&&
     c.after?.established_event_id===e.id&&
     same(loc,c.after)),'Orphaned or rewritten world location event');
   if(c.field==='world_location_link')
    insist(newLocations.some(([id,loc])=>
     loc.parent_id===c.anchor_id&&loc.established_event_id===e.id&&
     Array.isArray(c.after)&&c.after.includes(id)),
     'Orphaned or rewritten world connection event');
  }
 }
 return true;
}
