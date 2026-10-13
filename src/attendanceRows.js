import {hasConfirmedConsumption} from './model.js';
export function attendanceRows(db, sessions = db.sessions, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  const current = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  return sessions.filter(s=>s.status !== 'cancelled' && !s.deletedAt).flatMap(session=>session.studentIds.map(studentId=>{
    const value=session.attendance?.[studentId];
    const status=['present','late'].includes(value)?'present':['absent','leave'].includes(value)?'absent':'unrecorded';
    if(status==='unrecorded' && `${session.date} ${session.end}` > current) return null;
    const confirmed=status==='absent'?!!session.absenceConfirmations?.[studentId]:status==='present' && hasConfirmedConsumption(db,session.id,studentId);
    return {id:`${session.id}:${studentId}`,session,studentId,status,confirmed};
  }).filter(Boolean)).sort((a,b)=>(b.session.date+b.session.start).localeCompare(a.session.date+a.session.start));
}
