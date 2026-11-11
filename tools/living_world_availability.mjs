// Pure, proposal-only availability and route model. Never mutates story state.
export const AVAILABILITY = Object.freeze({ OPEN: "open", CLOSED: "closed", UNKNOWN: "unknown" });
export const LINKS = Object.freeze([
  ["LOC-RAILGARDEN-RESIDENTIAL","LOC-COMMERCIAL-DISTRICT"],
  ["LOC-RAILGARDEN-RESIDENTIAL","LOC-WILSON-APARTMENT"],
  ["LOC-WILSON-APARTMENT","LOC-WILSON-WORKSHOP"],
  ["LOC-COMMERCIAL-DISTRICT","LOC-CROSSWATER-PLAZA"],
  ["LOC-COMMERCIAL-DISTRICT","LOC-HARBOR-WALK"],
  ["LOC-CROSSWATER-PLAZA","LOC-HARBOR-WALK"],
  ["LOC-CROSSWATER-PLAZA","LOC-TRANSIT-TERMINAL"]
]);
// Connectivity is established; durations are proposals and intentionally not encoded.
export function connected(a,b,links=LINKS) {
  return typeof a==="string" && typeof b==="string" && links.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
}
export function shortestRoute(start,end,links=LINKS) {
  if (start===end && typeof start==="string") return [start];
  if (!start || !end) return null;
  const queue=[[start]], seen=new Set([start]);
  for (let i=0;i<queue.length;i++) {
    const route=queue[i], current=route.at(-1);
    for(const [a,b] of links) {
      const next=a===current?b:b===current?a:null;
      if (!next || seen.has(next)) continue;
      if(next===end) return [...route,next];
      seen.add(next);queue.push([...route,next]);
    }
  }
  return null;
}
// Only an explicitly established exception or applicable confirmed schedule can
// establish open/closed. Unspecified time, calendar or tentative schedule => unknown.
export function availability({schedule=null, exception=null, day=null, minute=null}={}) {
  if(exception && exception.confirmed===true && [AVAILABILITY.OPEN,AVAILABILITY.CLOSED].includes(exception.status)) return {status:exception.status,source:"confirmed_exception"};
  if(!schedule || schedule.confirmed!==true || !Number.isInteger(day) || !Number.isInteger(minute) || minute<0 || minute>=1440) return {status:AVAILABILITY.UNKNOWN,source:"insufficient_confirmed_data"};
  const intervals=schedule.days?.[String(day)];
  if(!Array.isArray(intervals)) return {status:AVAILABILITY.UNKNOWN,source:"day_not_documented"};
  const valid=intervals.every(([from,to])=>Number.isInteger(from)&&Number.isInteger(to)&&from>=0&&to<=1440&&from<to);
  if(!valid) return {status:AVAILABILITY.UNKNOWN,source:"invalid_schedule"};
  return {status:intervals.some(([from,to])=>minute>=from&&minute<to)?AVAILABILITY.OPEN:AVAILABILITY.CLOSED,source:"confirmed_schedule"};
}
