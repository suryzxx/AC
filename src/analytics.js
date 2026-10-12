import { lessonCharge, mins } from './model.js';
export function dashboardStats(db, from, to) {
  const inRange = date => !!date && date >= from && date <= to;
  const teachers = db.teachers.map(t => ({ ...t, completed: 0, scheduled: 0, hours: 0, amount: 0, attendees: 0 }));
  const students = db.students.map(s => ({ ...s, purchased: 0, received: 0, consumed: 0, used: 0 }));
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const studentMap = new Map(students.map(s => [s.id, s]));
  const days = new Map();
  const lessons = [];
  for (const b of db.sessions.filter(s => inRange(s.date) && ['completed', 'scheduled'].includes(s.status))) {
    const teacher = teacherMap.get(b.teacherId);
    if (b.status === 'scheduled') { if (teacher) teacher.scheduled++; continue; }
    let amount = 0, attendees = 0;
    for (const id of b.studentIds) {
      if (!['present', 'late'].includes(b.attendance?.[id])) continue;
      const price = Number(lessonCharge(db, b, id).unitPrice) || 0;
      amount += price; attendees++;
      const deducted = db.ledger.some(l => l.sessionId === b.id && l.studentId === id && l.type === '上課扣減' && !l.reversed && l.delta < 0);
      const student = studentMap.get(id);
      if (student && deducted) { student.consumed += price; student.used++; }
    }
    const hours = (mins(b.end) - mins(b.start)) / 60;
    if (teacher) { teacher.completed++; teacher.hours += hours; teacher.amount += amount; teacher.attendees += attendees; }
    lessons.push({ ...b, amount, hours });
    const day = days.get(b.date) || { date: b.date, count: 0, amount: 0 };
    day.count++; day.amount += amount; days.set(b.date, day);
  }
  for (const invoice of db.invoices.filter(i => !i.voided && i.source === 'package')) {
    const s = studentMap.get(invoice.studentId);
    if (!s) continue;
    if (inRange(invoice.date)) s.purchased += Number(invoice.total) || 0;
    if (invoice.paid && inRange(invoice.paidDate)) s.received += Number(invoice.total) || 0;
  }
  const sum = (rows, key) => rows.reduce((n, row) => n + row[key], 0);
  return { teachers, students, lessons, days: [...days.values()].sort((a,b) => a.date.localeCompare(b.date)),
    totals: { completed: sum(teachers,'completed'), scheduled: sum(teachers,'scheduled'), hours: sum(teachers,'hours'), amount: sum(teachers,'amount'), purchased: sum(students,'purchased'), received: sum(students,'received'), consumed: sum(students,'consumed') } };
}
