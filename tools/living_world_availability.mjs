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
  if (typeof start!=="string" || typeof end!=="string") return null;
  const known=new Set(links.flat());
  if (!known.has(start) || !known.has(end)) return null;
  if (start===end) return [start];
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
// establish open/closed. A weekday is NOT the narrative Day -29.
// Unknown calendar weekday or tentative schedule => unknown.
export function availability({schedule=null, exception=null, weekday=null, minute=null}={}) {
  if(exception && exception.confirmed===true && [AVAILABILITY.OPEN,AVAILABILITY.CLOSED].includes(exception.status)) return {status:exception.status,source:"confirmed_exception"};
  if(!schedule || schedule.confirmed!==true || (!Number.isInteger(weekday) || weekday<0 || weekday>6) || !Number.isInteger(minute) || minute<0 || minute>=1440) return {status:AVAILABILITY.UNKNOWN,source:"insufficient_confirmed_data"};
  const intervals=schedule.weekdays?.[String(weekday)];
  if(!Array.isArray(intervals)) return {status:AVAILABILITY.UNKNOWN,source:"day_not_documented"};
  const valid=intervals.every(interval=>Array.isArray(interval)&&interval.length===2&&Number.isInteger(interval[0])&&Number.isInteger(interval[1])&&interval[0]>=0&&interval[1]<=1440&&interval[0]<interval[1]);
  if(!valid) return {status:AVAILABILITY.UNKNOWN,source:"invalid_schedule"};
  return {status:intervals.some(([from,to])=>minute>=from&&minute<to)?AVAILABILITY.OPEN:AVAILABILITY.CLOSED,source:"confirmed_schedule"};
}
