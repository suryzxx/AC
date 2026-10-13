import {availability,mins,dateAdd} from './model.js';
export const teacherLessons = (db,id,date) => db.sessions.filter(s=>s.teacherId===id && s.date===date && s.status!=='cancelled' && !s.deletedAt).sort((a,b)=>a.start.localeCompare(b.start));
export const weekDates = date => Array.from({length:7},(_,i)=>dateAdd(date,i-((new Date(date+'T12:00:00').getDay()+6)%7)));
function union(ranges) {
 const merged=[];
 for(const [start,end] of ranges.filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0])) {
  const last=merged.at(-1);
  if(last && start<=last[1]) last[1]=Math.max(last[1],end); else merged.push([start,end]);
 }
 return merged;
}
const length = ranges => ranges.reduce((total,[a,b])=>total+b-a,0);
export function dayStats(teacher,lessons,date) {
 const busy=union(lessons.map(s=>[mins(s.start),mins(s.end)]));
 const windows=union(availability(teacher,date).map(w=>[mins(w.start),mins(w.end)]));
 const occupied=union(windows.flatMap(([a,b])=>busy.map(([c,d])=>[Math.max(a,c),Math.min(b,d)])));
 return {count:lessons.length,teachingMinutes:length(busy),freeMinutes:length(windows)-length(occupied)};
}
