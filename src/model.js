export const uid = () => crypto.randomUUID();
export const dateAdd = (date, n) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const todayHK = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Hong_Kong',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
export const mins = t => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);
export const overlap = (a, b) => mins(a.start) < mins(b.end) && mins(b.start) < mins(a.end);
export const money = n => `HK$ ${Number(n).toLocaleString('en-HK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
export const courseName = (db, id) => db.courses.find(x => x.id === id)?.name || '—';
export const studentName = (db, id) => db.students.find(x => x.id === id)?.name || '—';
export const teacherName = (db, id) => db.teachers.find(x => x.id === id)?.name || '—';
export function availability(t, date) {
  const day = new Date(`${date}T12:00:00`).getDay();
  let ranges = [...t.weekly.filter(w => w.days.includes(day)), ...t.extra.filter(w => w.date === date)];
  for (const off of (t.unavailable || []).filter(w => w.date === date)) {
    ranges = ranges.flatMap(w => {
      if (!overlap(w, off)) return [w];
      return [...(mins(w.start) < mins(off.start) ? [{
        ...w,
        end: off.start
      }] : []), ...(mins(w.end) > mins(off.end) ? [{
        ...w,
        start: off.end
      }] : [])];
    });
  }
  return ranges;
}
const additionalDemoStudents = () => [
  ['周芷妍', 'Zoe', 'P3', 0], ['吳俊熙', 'Ryan', 'P4', 1],
  ['鄭曉彤', 'Sophie', 'P5', 2], ['王柏翰', 'Alex', 'P6', 12],
  ['梁雅晴', 'Grace', 'P3', 7], ['許朗軒', 'Leo', 'P4', 0, 'single'],
  ['劉心怡', 'Lily', 'P5', 1], ['馮子睿', 'Noah', 'P6', 2],
  ['蔡穎恩', 'Ella', 'P3', 0], ['曾皓宇', 'Oliver', 'P4', 4],
  ['潘樂瑤', 'Mia', 'P5', 9], ['謝承希', 'James', 'P6', 0, 'single'],
  ['蘇詠晴', 'Chloe', 'P3', 2], ['葉俊朗', 'Henry', 'P4', 1],
  ['羅思穎', 'Alice', 'P5', 0], ['郭梓軒', 'Daniel', 'P6', 6],
  ['鄧凱晴', 'Charlotte', 'P3', 11], ['黃宇謙', 'Oscar', 'P4', 0, 'single']
].map(([name, english, grade, balance, mode = 'package'], index) => ({
  id: `demo-student-${index + 7}`, name, english, grade, balance, mode,
  parent: `${name[0]}${index % 2 ? '先生' : '太'}`,
  phone: `+852 6900 ${String(index + 101).padStart(4, '0')}`,
  notes: '模擬學生資料，供操作演示使用。'
}));

// Extend older browser demos once without overwriting edited or added records.
export function upgradeDemoStudents(db) {
  if (db.demoStudentsVersion >= 1) return db;
  const ids = new Set(db.students.map(student => student.id));
  return {
    ...db,
    demoStudentsVersion: 1,
    students: [...db.students, ...additionalDemoStudents().filter(student => !ids.has(student.id))]
  };
}

// Add the requested sample once, preserving existing course and teacher edits.
export function upgradeDemoCourses(db) {
  if (db.demoCoursesVersion >= 1) return db;
  const existing = db.courses.find(c => c.id === 'demo-trial-course' || ['體驗課', '体验课'].includes(c.name));
  if (existing) return { ...db, demoCoursesVersion: 1 };
  const course = { id: 'demo-trial-course', name: '體驗課', price: 100, color: '#4977c8', description: '體驗課程內容，了解學生程度與學習需要。' };
  return {
    ...db, demoCoursesVersion: 1,
    courses: [...db.courses, course],
    teachers: db.teachers.map(t => ({ ...t, subjects: [...t.subjects, course.id] }))
  };
}

export function upgradeDemoAvatars(db) {
  if (db.demoAvatarsVersion >= 1) return db;
  const avatars = { t1: '/avatars/avatar-01.png', t2: '/avatars/avatar-02.png', t3: '/avatars/avatar-03.png' };
  return { ...db, demoAvatarsVersion: 1, teachers: db.teachers.map(t => avatars[t.id] ? { ...t, avatar: avatars[t.id] } : t) };
}

export function seed() {
  const d = todayHK();
  return {
    version: 3,
    demoStudentsVersion: 1,
    students: [{
      id: 's1',
      name: '陳梓晴',
      english: 'Chloe',
      grade: 'P4',
      parent: '陳太',
      phone: '+852 6123 0081',
      balance: 8,
      mode: 'package',
      notes: '英文寫作需要多些引導；通常週二、四放學後到校。'
    }, {
      id: 's2',
      name: '林浩然',
      english: 'Ethan',
      grade: 'P5',
      parent: '林先生',
      phone: '+852 6234 0092',
      balance: 2,
      mode: 'package',
      notes: '本週可連續三天上課，優先安排下午。'
    }, {
      id: 's3',
      name: '黃樂彤',
      english: 'Emma',
      grade: 'P3',
      parent: '黃太',
      phone: '+852 6345 0103',
      balance: 5,
      mode: 'package',
      notes: '適合與同程度學生一起練習閱讀。'
    }, {
      id: 's4',
      name: '李卓軒',
      english: 'Lucas',
      grade: 'P6',
      parent: '李先生',
      phone: '+852 6456 0114',
      balance: 0,
      mode: 'single',
      notes: '按次付款；準備升中面試。'
    }, {
      id: 's5',
      name: '何子謙',
      english: 'Oscar',
      grade: 'P4',
      parent: '何太',
      phone: '+852 6567 0125',
      balance: 6,
      mode: 'package',
      notes: '週末較方便。'
    }, {
      id: 's6',
      name: '張凱琳',
      english: 'Kelly',
      grade: 'P5',
      parent: '張太',
      phone: '+852 6678 0136',
      balance: 10,
      mode: 'package',
      notes: ''
    }, ...additionalDemoStudents()],
    courses: [{
      id: 'c1',
      name: '英文閱讀',
      color: '#4977c8',
      price: 280,
      description: '按程度搭配，可一對一或 2–3 人同行。'
    }, {
      id: 'c2',
      name: '英文寫作',
      color: '#9675c8',
      price: 320,
      description: '針對作文、文法與學校功課。'
    }, {
      id: 'c3',
      name: '口語與面試',
      color: '#cb8b43',
      price: 380,
      description: '一對一練習表達及升中面試。'
    }],
    teachers: [{
      id: 't1',
      avatar: '/avatars/avatar-01.png',
      name: '李健',
      english: 'Mr. Lee',
      type: 'full',
      subjects: ['c1', 'c2'],
      grades: ['P3', 'P4', 'P5', 'P6'],
      weekly: [{
        days: [1, 2, 3, 4, 5, 6],
        start: '10:00',
        end: '19:00'
      }],
      extra: [],
      color: '#37786a'
    }, {
      id: 't2',
      avatar: '/avatars/avatar-02.png',
      name: '周雅雯',
      english: 'Ms. Chow',
      type: 'full',
      subjects: ['c1', 'c3'],
      grades: ['P3', 'P4', 'P5', 'P6'],
      weekly: [{
        days: [1, 2, 3, 4, 5, 6],
        start: '11:00',
        end: '20:00'
      }],
      extra: [],
      color: '#5577b1'
    }, {
      id: 't3',
      avatar: '/avatars/avatar-03.png',
      name: '黃思敏',
      english: 'Ms. Wong',
      type: 'part',
      subjects: ['c1', 'c2', 'c3'],
      grades: ['P3', 'P4', 'P5', 'P6'],
      weekly: [],
      extra: [{
        date: d,
        start: '15:00',
        end: '19:00'
      }, {
        date: dateAdd(d, 1),
        start: '14:00',
        end: '18:00'
      }, {
        date: dateAdd(d, 2),
        start: '14:00',
        end: '18:00'
      }],
      color: '#ad8454'
    }],
    sessions: [{
      id: 'b1',
      date: d,
      start: '11:00',
      end: '12:00',
      courseId: 'c1',
      teacherId: 't1',
      studentIds: ['s3'],
      room: 'A',
      status: 'scheduled',
      note: '閱讀理解練習',
      attendance: {}
    }, {
      id: 'b2',
      date: d,
      start: '14:00',
      end: '15:00',
      courseId: 'c2',
      teacherId: 't1',
      studentIds: ['s1', 's6'],
      room: 'A',
      status: 'scheduled',
      note: '同程度同行，不綁定固定班級',
      attendance: {}
    }, {
      id: 'b3',
      date: d,
      start: '15:30',
      end: '16:30',
      courseId: 'c3',
      teacherId: 't2',
      studentIds: ['s4'],
      room: 'B',
      status: 'scheduled',
      note: '升中面試練習',
      attendance: {}
    }, {
      id: 'b4',
      date: d,
      start: '16:00',
      end: '17:00',
      courseId: 'c1',
      teacherId: 't3',
      studentIds: ['s2'],
      room: 'A',
      status: 'scheduled',
      note: '臨時加課',
      attendance: {}
    }, {
      id: 'b5',
      date: dateAdd(d, 1),
      start: '14:00',
      end: '15:00',
      courseId: 'c2',
      teacherId: 't1',
      studentIds: ['s1'],
      room: 'A',
      status: 'scheduled',
      note: '常規預約',
      attendance: {}
    }],
    requests: [{
      id: 'r1',
      studentId: 's2',
      courseId: 'c2',
      date: dateAdd(d, 1),
      days: 3,
      start: '15:00',
      end: '16:00',
      note: '明天開始想連上三天，老師可以靈活安排。',
      status: 'pending'
    }, {
      id: 'r2',
      studentId: 's1',
      courseId: 'c2',
      date: dateAdd(d, 2),
      days: 1,
      start: '17:00',
      end: '18:00',
      note: '原本明天的課想改到後天，學校有活動。',
      sessionId: 'b5',
      status: 'pending'
    }],
    ledger: [],
    invoices: [],
    history: []
  };
}
export function validateSessions(db, drafts, excludeId) {
  const accepted = [];
  for (const b of drafts) {
    const t = db.teachers.find(x => x.id === b.teacherId),
      c = db.courses.find(x => x.id === b.courseId);
    const prefix = `${b.date}：`;
    if (!t || !c || !b.studentIds.length) return prefix + '請選擇老師、課程和學生';
    if (mins(b.start) >= mins(b.end)) return prefix + '結束時間必須晚於開始時間';
    if (!t.subjects.includes(c.id)) return prefix + '老師未設定可教此課程';
    if (b.studentIds.some(id => !t.grades.includes(db.students.find(s => s.id === id)?.grade))) return prefix + '老師的可教年級與學生不符';
    if (!availability(t, b.date).some(w => mins(w.start) <= mins(b.start) && mins(w.end) >= mins(b.end))) return prefix + '老師尚未確認這個時段可授課';
    for (const old of [...db.sessions, ...accepted].filter(x => x.id !== excludeId && x.status !== 'cancelled' && x.date === b.date)) {
      if (!overlap(b, old)) continue;
      if (old.teacherId === b.teacherId) return prefix + '老師時間衝突';
      if (old.studentIds.some(id => b.studentIds.includes(id))) return prefix + '學生已有其他課堂';
    }
    accepted.push(b);
  }
  return '';
}
export function completeSession(db, id, attendance, note) {
  const b = db.sessions.find(x => x.id === id);
  if (!b || b.status !== 'scheduled') throw Error('此課堂已處理，不能重複扣課');
  const deductions = b.studentIds.filter(s => ['present', 'late'].includes(attendance[s]));
  if (b.studentIds.some(id => !['present', 'late', 'leave', 'absent'].includes(attendance[id]))) throw Error('請逐位確認出勤');
  const charges = Object.fromEntries(b.studentIds.map(id => [id, lessonCharge(db, b, id)]));
  const pending = deductions.filter(id => charges[id].mode === 'package' && db.students.find(s => s.id === id).balance < 1);
  const time = new Date().toISOString();
  return {
    ...db,
    students: db.students.map(s => deductions.includes(s.id) && charges[s.id].mode === 'package' && !pending.includes(s.id) ? {
      ...s,
      balance: s.balance - 1
    } : s),
    sessions: db.sessions.map(x => x.id === id ? {
      ...x,
      status: 'completed',
      attendance,
      charges,
      note
    } : x),
    ledger: [...db.ledger, ...deductions.map(s => ({
      id: uid(),
      studentId: s,
      sessionId: id,
      date: b.date,
      delta: charges[s].mode === 'package' && !pending.includes(s) ? -1 : 0,
      type: pending.includes(s) ? '待補扣' : charges[s].mode === 'package' ? '上課扣減' : '按次待開單',
      note: courseName(db, b.courseId)
    }))],
    history: [{
      id: uid(),
      at: time,
      text: `完成 ${b.date} ${b.start} ${courseName(db, b.courseId)}，${deductions.length} 人到課`
    }, ...db.history]
  };
}
// Save the full roster atomically; corrections retain the existing reversal audit.
export function saveSessionAttendance(db, id, attendance, reason = '') {
  const lesson = db.sessions.find(session => session.id === id);
  if (!lesson || lesson.status === 'cancelled') throw Error('此課堂不能記錄考勤');
  if (lesson.studentIds.some(studentId => !['present', 'late', 'leave', 'absent'].includes(attendance[studentId]))) throw Error('請逐位確認出勤');
  if (lesson.status === 'completed' && lesson.studentIds.every(studentId => lesson.attendance?.[studentId] === attendance[studentId])) return db;
  const next = lesson.status === 'completed' ? reverseAttendance(db, id, reason) : db;
  return completeSession(next, id, Object.fromEntries(lesson.studentIds.map(studentId => [studentId, attendance[studentId]])), lesson.note || '');
}

export function totals(lines, surcharge, kind, value) {
  const subtotal = Math.round(lines.reduce((n, x) => n + x.quantity * x.unitPrice, 0) * 100) / 100;
  const discount = Math.round((kind === 'percent' ? subtotal * value / 100 : value) * 100) / 100;
  return {
    subtotal,
    surcharge: Number(surcharge),
    discount,
    total: Math.round((subtotal + Number(surcharge) - discount) * 100) / 100
  };
}
export function billableLessons(db) {
  return db.sessions.filter(b => b.status === 'completed').flatMap(b => b.studentIds.filter(id => lessonCharge(db, b, id).mode === 'single' && ['present', 'late'].includes(b.attendance[id]) && !db.invoices.some(i => !i.voided && i.studentId === id && i.lines.some(l => l.sessionId === b.id))).map(id => ({
    id: `${b.id}:${id}`,
    sessionId: b.id,
    studentId: id,
    date: b.date,
    start: b.start,
    courseId: b.courseId
  })));
}
export function reverseAttendance(db, id, reason) {
  const b = db.sessions.find(x => x.id === id);
  if (!b || b.status !== 'completed') throw Error('只有已完成課堂可以更正考勤');
  if (!reason.trim()) throw Error('請填寫更正原因');
  if (db.invoices.some(i => !i.voided && i.lines.some(l => l.sessionId === id))) throw Error('這堂課已開單，需先處理單據；本原型暫不支援作廢單據');
  const entries = db.ledger.filter(l => l.sessionId === id && !l.reversed && ['上課扣減', '按次待開單', '待補扣'].includes(l.type));
  return {
    ...db,
    students: db.students.map(s => ({
      ...s,
      balance: s.balance - entries.filter(l => l.studentId === s.id).reduce((n, l) => n + l.delta, 0)
    })),
    sessions: db.sessions.map(x => x.id === id ? {
      ...x,
      status: 'scheduled',
      attendance: {}
    } : x),
    ledger: [...db.ledger.map(l => entries.some(e => e.id === l.id) ? {
      ...l,
      reversed: true
    } : l), ...entries.map(l => ({
      id: uid(),
      sessionId: id,
      studentId: l.studentId,
      date: todayHK(),
      delta: -l.delta,
      type: '考勤更正',
      note: reason
    }))],
    history: [{
      id: uid(),
      at: new Date().toISOString(),
      text: `更正 ${b.date} ${b.start} 考勤：${reason}`
    }, ...db.history]
  };
}

// Freeze the agreement on each lesson. Legacy records are snapshotted on first load.
export function lessonCharge(db, lesson, studentId) {
  return lesson.charges?.[studentId] || {
    mode: db.students.find(s => s.id === studentId)?.mode || 'single',
    unitPrice: db.courses.find(c => c.id === lesson.courseId)?.price || 0
  };
}
export function normalizeDb(db) {
  return {
    ...db,
    sessions: db.sessions.map(b => ({
      ...b,
      charges: Object.fromEntries(b.studentIds.map(id => [id, lessonCharge(db, b, id)]))
    }))
  };
}
export function audit(db, text) {
  return [{
    id: uid(),
    at: new Date().toISOString(),
    text
  }, ...db.history];
}
export function pendingDeductions(db) {
  return db.ledger.filter(l => l.type === '待補扣' && !l.reversed && !l.settled);
}
export function settleCredits(db, studentId) {
  let balance = db.students.find(s => s.id === studentId)?.balance || 0;
  const ids = pendingDeductions(db).filter(l => l.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date)).slice(0, Math.floor(balance)).map(l => l.id);
  if (!ids.length) return db;
  return {
    ...db,
    students: db.students.map(s => s.id === studentId ? {
      ...s,
      balance: s.balance - ids.length
    } : s),
    ledger: [...db.ledger.map(l => ids.includes(l.id) ? {
      ...l,
      settled: true
    } : l), ...db.ledger.filter(l => ids.includes(l.id)).map(l => ({
      ...l,
      id: uid(),
      type: '上課扣減',
      delta: -1,
      note: '續費後補扣 · ' + l.note
    }))],
    history: audit(db, `${studentName(db, studentId)} 補扣 ${ids.length} 堂已上課記錄`)
  };
}
export function registerPayment(db, id, method, paidDate = todayHK()) {
  const i = db.invoices.find(i => i.id === id);
  if (!i || i.paid || i.voided) throw Error('此帳單不能重複收款或已作廢');
  const next = {
    ...db,
    invoices: db.invoices.map(x => x.id === id ? {
      ...x,
      paid: true,
      kind: 'both',
      method,
      paidDate,
      receiptNo: x.receiptNo || x.no.replace('INV', 'REC')
    } : x),
    students: db.students.map(s => s.id === i.studentId && i.source === 'package' ? {
      ...s,
      balance: s.balance + i.packageCount
    } : s),
    ledger: i.source === 'package' ? [...db.ledger, {
      id: uid(),
      studentId: i.studentId,
      invoiceId: id,
      date: paidDate,
      delta: i.packageCount,
      type: '課包入帳',
      note: i.no
    }] : db.ledger,
    history: audit(db, `登記收款 ${i.no} · ${money(i.total)}`)
  };
  return settleCredits(next, i.studentId);
}
export function fixInvoice(db, id, action, reason) {
  const i = db.invoices.find(i => i.id === id);
  if (!reason?.trim()) throw Error('請填寫更正原因');
  if (!i || i.voided) throw Error('單據已作廢');
  if (action === 'void' && i.paid) throw Error('請先撤銷誤登收款，再作廢帳單');
  if (action === 'unpay' && !i.paid) throw Error('此單據尚未收款');
  if (!['void', 'unpay'].includes(action)) throw Error('無效操作');
  const credit = action === 'unpay' && i.source === 'package' ? i.packageCount : 0;
  if (credit && db.students.find(s => s.id === i.studentId).balance < credit) throw Error('這筆課包已有課時被使用，不能直接撤銷。請先更正誤記的課消；真實退費需另行結算。');
  return {
    ...db,
    invoices: db.invoices.map(x => x.id === id ? {
      ...x,
      ...(action === 'void' ? {
        voided: true
      } : {
        paid: false,
        kind: 'invoice',
        paidDate: null
      }),
      corrections: [...(x.corrections || []), {
        at: new Date().toISOString(),
        action,
        reason,
        method: x.method,
        paidDate: x.paidDate
      }]
    } : x),
    students: db.students.map(s => s.id === i.studentId ? {
      ...s,
      balance: s.balance - credit
    } : s),
    ledger: credit ? [...db.ledger, {
      id: uid(),
      studentId: i.studentId,
      invoiceId: id,
      date: todayHK(),
      delta: -credit,
      type: '撤銷誤收款',
      note: `${i.no} · ${reason}`
    }] : db.ledger,
    history: audit(db, `${action === 'void' ? '作廢帳單' : '撤銷誤收款'} ${i.no}：${reason}`)
  };
}
export function markTeacherOff(db, teacherId, off) {
  if (!off.reason?.trim() || !off.date || off.date < todayHK() || mins(off.start) >= mins(off.end)) throw Error('請填寫今天或以後的日期、有效時段及原因');
  return {
    ...db,
    teachers: db.teachers.map(t => t.id === teacherId ? {
      ...t,
      unavailable: [...(t.unavailable || []), {
        ...off,
        id: uid()
      }]
    } : t),
    history: audit(db, `${teacherName(db, teacherId)} ${off.date} ${off.start}–${off.end} 暫停授課：${off.reason}`)
  };
}
export function affectedLessons(db) {
  return db.sessions.filter(b => b.status === 'scheduled' && !availability(db.teachers.find(t => t.id === b.teacherId), b.date).some(w => mins(w.start) <= mins(b.start) && mins(w.end) >= mins(b.end)));
}
export function leaveLesson(db, id, studentId, reason, makeup, role = 'admin') {
  const b = db.sessions.find(x => x.id === id);
  if (!b || b.status !== 'scheduled' || !b.studentIds.includes(studentId)) throw Error('此學生已不在待上課名單中');
  if (!reason?.trim()) throw Error('請填寫請假原因');
  const remaining = b.studentIds.filter(s => s !== studentId);
  const requests = db.requests.map(r => ['pending', 'awaiting'].includes(r.status) && r.sessionId === id && r.studentId === studentId ? {
    ...r,
    status: 'declined',
    response: '已請假，原調課申請結束'
  } : r);
  const request = {
    id: uid(),
    studentId,
    courseId: b.courseId,
    date: dateAdd(todayHK(), 1),
    days: 1,
    start: b.start,
    end: b.end,
    status: 'pending',
    makeupFor: id,
    note: `請假後另約：${reason}`
  };
  return {
    ...db,
    sessions: db.sessions.map(x => x.id === id ? {
      ...x,
      studentIds: remaining.length ? remaining : x.studentIds,
      status: remaining.length ? 'scheduled' : 'cancelled',
      excused: [...(x.excused || []), {
        studentId,
        reason,
        at: todayHK()
      }]
    } : x),
    requests: makeup ? [request, ...requests] : requests,
    history: audit(db, `${role === 'parent' ? '家長' : '管理員'} 登記 ${studentName(db, studentId)} ${b.date} 請假（不扣課）${makeup ? '，待另約' : ''}：${reason}`)
  };
}
export function switchBillingMode(db, studentId, mode) {
  const s = db.students.find(s => s.id === studentId);
  if (!s || !['package', 'single'].includes(mode)) throw Error('無效學生或方式');
  return {
    ...normalizeDb(db),
    students: db.students.map(x => x.id === studentId ? {
      ...x,
      mode
    } : x),
    history: audit(db, `${s.name} 新預約改為${mode === 'package' ? '課包' : '按次'}，已有課堂保留原約定`)
  };
}
export function confirmProposal(db, requestId, accept) {
  const r = db.requests.find(r => r.id === requestId);
  if (!r || r.status !== 'awaiting') throw Error('此方案已處理');
  if (!accept) return {
    ...db,
    requests: db.requests.map(x => x.id === requestId ? {
      ...x,
      status: 'pending',
      proposal: null,
      response: '家長希望重新安排'
    } : x),
    history: audit(db, '家長退回約課方案，待重新安排')
  };
  return commitSchedule(db, r.proposal, {
    requestId,
    originalId: r.sessionId,
    confirmation: 'confirmed'
  });
}
export function commitSchedule(db, drafts, opts = {}) {
  if (!drafts.length) throw Error('至少選擇一堂課');
  const original = db.sessions.find(b => b.id === opts.originalId);
  if (opts.originalId && (!original || original.status !== 'scheduled')) throw Error('原課堂已完成或取消，請重新安排');
  const request = db.requests.find(r => r.id === opts.requestId);
  if (request && !['pending', 'awaiting'].includes(request.status)) throw Error('申請已處理');
  const requestedIds = drafts[0].studentIds;
  const remaining = original && opts.requestId ? original.studentIds.filter(id => !requestedIds.includes(id)) : [];
  const base = {
    ...db,
    sessions: db.sessions.filter(b => b.id !== original?.id)
  };
  if (remaining.length) base.sessions.push({
    ...original,
    studentIds: remaining
  });
  const batchId = remaining.length ? undefined : original?.batchId || (drafts.length > 1 ? uid() : undefined);
  const ready = drafts.map(b => ({
    ...b,
    id: original && !remaining.length ? original.id : uid(),
    batchId,
    status: 'scheduled',
    attendance: {},
    charges: Object.fromEntries(b.studentIds.map(id => [id, b.charges?.[id] || (original?.courseId === b.courseId ? original.charges?.[id] : null) || lessonCharge(db, b, id)]))
  }));
  if (ready.some(b => b.date < todayHK())) throw Error('安排日期已過，請選擇新的日期');
  const conflict = validateSessions(base, ready);
  if (conflict) throw Error(conflict);
  if (request && opts.confirmation === 'propose') return {
    ...db,
    requests: db.requests.map(r => r.id === request.id ? {
      ...r,
      status: 'awaiting',
      proposal: ready,
      remainingDates: opts.omittedDates || [],
      response: '新方案待家長確認；確認時再次檢查空檔'
    } : r),
    history: audit(db, `向 ${studentName(db, request.studentId)} 提出 ${ready.length} 堂約課方案`)
  };
  const omitted = opts.omittedDates || request?.remainingDates || [];
  const requests = db.requests.map(r => r.id === request?.id ? {
    ...r,
    status: 'accepted',
    response: `已確認 ${ready.length} 堂課${omitted.length ? '，其餘日期繼續待安排' : ''}`,
    sessionIds: ready.map(b => b.id),
    proposal: null,
    remainingDates: []
  } : r);
  for (const date of omitted) requests.push({
    ...request,
    id: uid(),
    date,
    days: 1,
    status: 'pending',
    sessionId: undefined,
    sessionIds: undefined,
    remainingDates: [],
    proposal: null,
    note: '餘下日期待安排 · ' + request.note
  });
  return {
    ...db,
    sessions: [...base.sessions, ...ready],
    requests,
    history: audit(db, `${original ? '調整' : '安排'} ${ready.length} 堂課${opts.confirmation === 'phone' ? '，已電話確認' : ''}`)
  };
}
export function seriesDrafts(db, original, next) {
  if (!original.batchId) return [next];
  const shift = Math.round((new Date(next.date + 'T12:00:00') - new Date(original.date + 'T12:00:00')) / 86400000);
  return db.sessions.filter(b => b.batchId === original.batchId && b.status === 'scheduled' && b.date >= original.date).map(b => ({
    ...b,
    date: dateAdd(b.date, shift),
    start: next.start,
    end: next.end,
    teacherId: next.teacherId,
    room: next.room
  }));
}
export function changeSeries(db, original, next) {
  const drafts = seriesDrafts(db, original, next),
    ids = new Set(drafts.map(b => b.id));
  if (drafts.some(b => b.date < todayHK())) throw Error('不能把課堂移到過去');
  const conflict = validateSessions({
    ...db,
    sessions: db.sessions.filter(b => !ids.has(b.id))
  }, drafts);
  if (conflict) throw Error(conflict);
  return {
    ...db,
    sessions: db.sessions.map(b => drafts.find(d => d.id === b.id) || b),
    history: audit(db, `調整本次及以後 ${drafts.length} 堂課（保留學生、課程及收費約定）`)
  };
}
export function suggestSlot(db, draft, from, to, duration = 60, excludeId) {
  for (let minute = mins(from); minute + duration <= mins(to); minute += 15) {
    const time = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    for (const teacher of db.teachers) for (const room of ['A', 'B']) {
      const b = {
        ...draft,
        start: time(minute),
        end: time(minute + duration),
        teacherId: teacher.id,
        room
      };
      if (!validateSessions(db, [b], excludeId)) return b;
    }
  }
  return null;
}

// Opening credit records lessons already purchased, without creating a new payment.
export function addStudentWithLessons(db, profile, purchasedLessons) {
  if (!Number.isSafeInteger(purchasedLessons) || purchasedLessons < 0) throw Error('請輸入 0 或以上的整數課時');
  const student = {
    id: uid(), name: profile.name, english: profile.english, grade: profile.grade,
    parent: profile.parent, phone: profile.phone, notes: profile.notes,
    mode: 'package', balance: purchasedLessons
  };
  return {
    ...db,
    students: [...db.students, student],
    ledger: purchasedLessons ? [...db.ledger, {
      id: uid(), studentId: student.id, date: todayHK(), delta: purchasedLessons,
      type: '初始課時錄入', note: `建檔時錄入已購買 ${purchasedLessons} 堂`
    }] : db.ledger,
    history: [{ id: uid(), at: new Date().toISOString(), text: `新增學生 ${student.name} · 已購買 ${purchasedLessons} 堂` }, ...db.history]
  };
}

// Retire per-lesson billing for current students and uncompleted bookings.
// Completed lessons and financial history retain their original snapshots.
export function usePurchasedLessonCredits(db) {
  const convert = b => ({ ...b, charges: Object.fromEntries(b.studentIds.map(id => [id, { ...lessonCharge(db, b, id), mode: 'package' }])) });
  return {
    ...db,
    students: db.students.map(s => ({ ...s, mode: 'package' })),
    sessions: db.sessions.map(b => b.status === 'scheduled' ? convert(b) : b),
    requests: db.requests.map(r => r.proposal ? { ...r, proposal: r.proposal.map(convert) } : r)
  };
}

// Opening balance plus net purchases equals remaining credit plus valid usage.
// Reversed attendance and unpaid/pending deductions do not count as usage.
export function totalStudentLessons(db, studentId) {
  const remaining = db.students.find(s => s.id === studentId)?.balance || 0;
  const used = db.ledger.filter(l => l.studentId === studentId && l.type === '上課扣減' && !l.reversed)
    .reduce((sum, l) => sum - l.delta, 0);
  return remaining + used;
}

// A one-time set of current-week examples for the prototype calendar.
export function upgradeDemoCalendar(db, referenceDate = todayHK()) {
  if (db.demoCalendarVersion >= 1) return db;
  const monday = dateAdd(referenceDate, -((new Date(referenceDate + 'T12:00:00').getDay() + 6) % 7));
  const dates = Array.from({ length: 6 }, (_, i) => dateAdd(monday, i));
  let next = { ...db, sessions: [...db.sessions], teachers: db.teachers.map(t => {
    if (t.id !== 't3') return t;
    const extra = dates.slice(0, 3).filter(date => !availability(t, date).length)
      .map(date => ({ date, start: '11:00', end: '18:00' }));
    return { ...t, extra: [...t.extra, ...extra] };
  }) };
  for (const [teacherId, studentId] of [['t1', 's1'], ['t2', 's3'], ['t3', 's6']]) {
    const teacher = next.teachers.find(t => t.id === teacherId);
    if (!teacher || !next.students.some(s => s.id === studentId)) continue;
    const courseId = teacher.subjects.find(id => next.courses.some(c => c.id === id));
    if (!courseId) continue;
    for (let index = 0; index < 3; index++) {
      let lesson;
      const preferredDates = [...dates.slice(index), ...dates.slice(0, index)];
      for (const date of preferredDates) {
        for (let hour = 11; hour < 18 && !lesson; hour++) {
          for (const room of ['A', 'B']) {
            const draft = { id: `demo-calendar-${teacherId}-${index}`, date,
              start: `${hour}:00`, end: `${hour + 1}:00`, courseId, teacherId,
              studentIds: [studentId], room, status: 'scheduled', attendance: {},
              note: '模擬課堂 · 本週排課展示' };
            if (!validateSessions(next, [draft])) { lesson = draft; break; }
          }
        }
        if (lesson) break;
      }
      if (!lesson) continue;
      next = { ...next, sessions: [...next.sessions, lesson] };
      if (index === 0) next = completeSession(next, lesson.id, { [studentId]: 'present' }, '模擬已完成課堂 · 已記錄出席及扣減課時');
    }
  }
  return { ...next, demoCalendarVersion: 1 };
}

export function addSessionStudents(db, sessionId, studentIds) {
  const session = db.sessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'scheduled') throw Error('只有未完成課堂可以增加學生');
  const additions = [...new Set(studentIds)].filter(id => !session.studentIds.includes(id));
  if (!additions.length) throw Error('請選擇要增加的學生');
  if (additions.some(id => !db.students.some(s => s.id === id))) throw Error('學生資料不存在');
  const updated = { ...session, studentIds: [...session.studentIds, ...additions],
    charges: { ...session.charges, ...Object.fromEntries(additions.map(id => [id, lessonCharge(db, session, id)])) } };
  const conflict = validateSessions(db, [updated], sessionId);
  if (conflict) throw Error(conflict);
  return { ...db, sessions: db.sessions.map(s => s.id === sessionId ? updated : s),
    history: audit(db, `課堂增加學生：${additions.map(id => studentName(db, id)).join('、')} · ${session.date} ${session.start}`) };
}
