// Coarse narrator-time windows, NOT a canonical exact hour or weekday.
// Intervals are deliberately approximate policy windows (minutes since 00:00).
// Unknown absolute dates remain unknown. No day may be advanced impossibly.
const PERIODS=Object.freeze(['morning','midday','afternoon','evening','night']);
const WINDOWS=Object.freeze({
 morning:[[300,720]],    // broad early morning to noon
 midday:[[720,840]],
 afternoon:[[840,1080]],
 evening:[[1080,1260]],
 night:[[0,300],[1260,1440]] // pre-dawn or late night on that day
});
const requireTime=(ok,message)=>{if(!ok)throw Error(message)};
const windowsFor=period=>WINDOWS[period]??[[0,1440]];
// There must exist a legal start instant and end instant in their respective
// periods with EXACTLY the supplied minute duration and calendar-day delta.
// This is an existential consistency check, not an invented timestamp.
function possibleInterval(currentPeriod,nextPeriod,elapsedDays,elapsedMinutes){
 const offset=elapsedDays*1440;
 return windowsFor(currentPeriod).some(([startMin,startMax])=>
  windowsFor(nextPeriod).some(([endMin,endMax])=>{
   const earliest=Math.max(startMin,offset+endMin-elapsedMinutes);
   const latest=Math.min(startMax,offset+endMax-elapsedMinutes);
   return earliest<latest;
  }));
}
export function validateTemporalAdvance({currentPeriod,elapsedDays,elapsedMinutes,nextPeriod=null}={}){
 requireTime(Number.isSafeInteger(elapsedDays)&&elapsedDays>=0&&elapsedDays<=365,
  'Invalid narrative days');
 requireTime(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0&&elapsedMinutes<=525600,
  'Invalid narrative minutes');
 const minimum=Math.floor(elapsedMinutes/1440), maximum=Math.ceil(elapsedMinutes/1440);
 requireTime(elapsedDays>=minimum&&elapsedDays<=maximum,
  'Narrative days/minutes disagree');
 if(nextPeriod!==null)requireTime(PERIODS.includes(nextPeriod),'Unknown time-of-day label');
 // An unqualified reversal like night -> morning on the same narrative day
 // is not silently accepted: its ambiguous pre-dawn interpretation would
 // conflict with the existing chronological period-order contract.
 if(elapsedDays===0&&PERIODS.includes(currentPeriod)&&nextPeriod!==null)
  requireTime(PERIODS.indexOf(nextPeriod)>=PERIODS.indexOf(currentPeriod),
   'Time of day cannot go backwards within the same narrative day');
 requireTime(possibleInterval(currentPeriod,nextPeriod,elapsedDays,elapsedMinutes),
  nextPeriod===null?'Impossible narrative day transition from current period':
   'Insufficient narrative minutes for time-of-day transition');
 return {elapsedDays,elapsedMinutes,nextPeriod};
}
