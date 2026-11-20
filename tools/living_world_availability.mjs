// Pure, proposal-only availability and route model. Never mutates story state.
export const AVAILABILITY = Object.freeze({ OPEN: "open", CLOSED: "closed", UNKNOWN: "unknown" });
export const LINKS = Object.freeze([
  ["LOC-RAILGARDEN-RESIDENTIAL","LOC-COMMERCIAL-DISTRICT"],
  ["LOC-RAILGARDEN-RESIDENTIAL","LOC-WILSON-APARTMENT"],
  ["LOC-WILSON-APARTMENT","LOC-WILSON-WORKSHOP"],
  ["LOC-COMMERCIAL-DISTRICT","LOC-CROSSWATER-PLAZA"],
  ["LOC-COMMERCIAL-DISTRICT","LOC-HARBOR-WALK"],
  ["LOC-COMMERCIAL-DISTRICT","LOC-CAFE-BRUMA"],
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
// A confirmed weekday interval [start,end] uses minutes since that day's 00:00.
// An end > 1440 explicitly extends into the NEXT day, at most 24 hours after
// start. This avoids treating a reversed/typo interval as an overnight shift.
// The previous weekday must be checked before asserting "closed" just after
// midnight. A missing day is never silently treated as a closed day.
const validIntervals = intervals => Array.isArray(intervals) && intervals.every(pair =>
  Array.isArray(pair) && pair.length===2 &&
  Number.isInteger(pair[0]) && Number.isInteger(pair[1]) &&
  pair[0]>=0 && pair[0]<1440 &&
  pair[1]>pair[0] && pair[1]<=pair[0]+1440
);

// Only an explicitly established exception or applicable confirmed schedule can
// establish open/closed. A weekday is NOT the narrative Day -29.
// Unknown calendar weekday or tentative schedule => unknown.
export function availability({schedule=null, exception=null, weekday=null, minute=null}={}) {
  if(exception && exception.confirmed===true && [AVAILABILITY.OPEN,AVAILABILITY.CLOSED].includes(exception.status))
    return {status:exception.status,source:"confirmed_exception"};
  if(!schedule || schedule.confirmed!==true ||
     !Number.isInteger(weekday) || weekday<0 || weekday>6 ||
     !Number.isInteger(minute) || minute<0 || minute>=1440)
    return {status:AVAILABILITY.UNKNOWN,source:"insufficient_confirmed_data"};

  const today=schedule.weekdays?.[String(weekday)];
  const yesterday=schedule.weekdays?.[String((weekday+6)%7)];
  if((today!==undefined && !validIntervals(today)) ||
     (yesterday!==undefined && !validIntervals(yesterday)))
    return {status:AVAILABILITY.UNKNOWN,source:"invalid_schedule"};

  const openedToday=Array.isArray(today) &&
    today.some(([from,to])=>minute>=from && minute<Math.min(to,1440));
  const carriedFromYesterday=Array.isArray(yesterday) &&
    yesterday.some(([,to])=>to>1440 && minute<to-1440);
  if(openedToday || carriedFromYesterday)
    return {status:AVAILABILITY.OPEN,source:"confirmed_schedule"};
  // Both days must be explicitly documented before a CLOSED conclusion.
  // The prior day might contain an overnight shift ending late today.
  if(!Array.isArray(today) || !Array.isArray(yesterday))
    return {status:AVAILABILITY.UNKNOWN,source:"day_not_documented"};
  return {status:AVAILABILITY.CLOSED,source:"confirmed_schedule"};
}
