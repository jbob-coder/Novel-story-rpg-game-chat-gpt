// Narrative time policy. No fabricated clock or weekday: validate only intervals
// that are logically possible without an absolute wall-clock anchor.
const PERIODS = Object.freeze(['morning','midday','afternoon','evening','night']);
const START = Object.freeze({morning:360,midday:660,afternoon:780,evening:1020,night:1260});
const END = Object.freeze({morning:660,midday:780,afternoon:1020,evening:1260,night:1440});
const requireTime=(ok,message)=>{if(!ok)throw new Error(message)};
export function validateTemporalAdvance({currentPeriod,elapsedDays,elapsedMinutes,nextPeriod=null}={}){
 requireTime(Number.isSafeInteger(elapsedDays)&&elapsedDays>=0&&elapsedDays<=365,
  'Invalid narrative days');
 requireTime(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0&&elapsedMinutes<=525600,
  'Invalid narrative minutes');
 // Any interval of length M minutes crosses floor(M/1440) or ceil(M/1440)
 // midnights; this bound requires no exact starting hour.
 const minimum=Math.floor(elapsedMinutes/1440), maximum=Math.ceil(elapsedMinutes/1440);
 requireTime(elapsedDays>=minimum&&elapsedDays<=maximum,
  'Narrative days/minutes disagree');
 if(nextPeriod==null)return {elapsedDays,elapsedMinutes,nextPeriod:null};
 requireTime(PERIODS.includes(nextPeriod),'Unknown time-of-day label');
 const oldIndex=PERIODS.indexOf(currentPeriod),nextIndex=PERIODS.indexOf(nextPeriod);
 if(elapsedDays===0&&oldIndex>=0){
  requireTime(nextIndex>=oldIndex,
   'Time of day cannot go backwards within the same narrative day');
  if(nextIndex>oldIndex){
   // Approximate labeled windows establish only a lower bound; never assert an
   // exact clock. Adjacent windows share a boundary and need no minimum.
   const minimumElapsed=Math.max(0,START[nextPeriod]-END[currentPeriod]);
   requireTime(elapsedMinutes>=minimumElapsed,
    'Insufficient narrative minutes for time-of-day transition');
  }
 }
 return {elapsedDays,elapsedMinutes,nextPeriod};
}
