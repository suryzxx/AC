export const PARENT_PHONE = '17788889999';
export const PARENT_CODE = '123456';
export function parentStudents(db) {
  const matching = db.students.filter(s => String(s.phone || '').replace(/\D/g, '') === PARENT_PHONE);
  return matching.length ? matching : db.students.filter(s => s.id === 's1');
}
export function parentRecords(db, studentId) {
  if (!parentStudents(db).some(s => s.id === studentId)) return { sessions: [], invoices: [] };
  return {
    sessions: db.sessions.filter(s => !s.deletedAt && (s.studentIds.includes(studentId) || s.excused?.some(e => e.studentId === studentId))),
    invoices: db.invoices.filter(i => i.studentId === studentId)
  };
}
