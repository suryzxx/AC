/** @jsx localizedElement */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Input, Select, Checkbox, Alert, Tag, Segmented, Empty } from 'antd';
import { localizedElement } from './language';
import { todayHK, dateAdd, studentName, teacherName, courseName, money, pendingDeductions, billableLessons, affectedLessons, markTeacherOff, leaveLesson, fixInvoice, switchBillingMode, settleCredits, confirmProposal } from './model';
const titles = {
  teacherOff: '老師臨時不能上課',
  studentLeave: '學生請假 / 取消本次',
  invoiceFix: '更正單據',
  billingMode: '修改新預約的計費方式',
  proposal: '確認約課方案',
  settle: '處理待補扣'
};
export const operationTypes = Object.keys(titles);
export function OperationsDialog({
  dialog: d,
  db,
  setDb,
  close,
  message,
  role,
  automation
}) {
  const [v, setV] = useState({
    date: todayHK(),
    start: '10:00',
    end: '21:00',
    reason: '',
    makeup: true,
    studentId: d.studentId || d.session?.studentIds[0],
    mode: db.students.find(s => s.id === d.studentId)?.mode || 'package',
    action: d.invoice?.paid ? 'unpay' : 'void'
  });
  const [error, setError] = useState('');
  const form = useRef(null);
  useEffect(() => {
    if (!automation) return;
    const control = {
      fill: x => {
        setV(v => ({
          ...v,
          ...x
        }));
        setError('');
      },
      submit: () => form.current?.requestSubmit(),
      error: () => error
    };
    automation.current = control;
    return () => {
      if (automation.current === control) automation.current = null;
    };
  });
  const put = (key, value) => {
    setV(v => ({
      ...v,
      [key]: value
    }));
    setError('');
  };
  const apply = action => {
    try {
      const next = action(db);
      setDb(next);
      message.success('已儲存，相關待辦已更新');
      close();
    } catch (e) {
      setError(e.message);
    }
  };
  const field = (label, child) => <label className="field"><span>{label}</span>{child}</label>;
  const affected = d.type === 'teacherOff' ? db.sessions.filter(b => b.teacherId === d.teacher.id && b.status === 'scheduled' && b.date === v.date && b.start < v.end && b.end > v.start) : [];
  const request = d.type === 'proposal' ? db.requests.find(r => r.id === d.request.id) : null;
  const submit = () => apply(old => d.type === 'teacherOff' ? markTeacherOff(old, d.teacher.id, v) : d.type === 'studentLeave' ? leaveLesson(old, d.session.id, v.studentId, v.reason, v.makeup, role) : d.type === 'invoiceFix' ? fixInvoice(old, d.invoice.id, v.action, v.reason) : d.type === 'billingMode' ? switchBillingMode(old, d.studentId, v.mode) : d.type === 'proposal' ? confirmProposal(old, d.request.id, true) : settleCredits(old, d.studentId));
  return <Modal open width={650} title={titles[d.type]} onCancel={close} footer={<><Button onClick={close}>關閉</Button>{d.type === 'proposal' && <Button onClick={() => apply(old => confirmProposal(old, d.request.id, false))}>時間不合適，重新安排</Button>}<Button type="primary" htmlType="submit" form="operations-form">{d.type === 'proposal' ? role === 'admin' ? '已線下確認，安排課堂' : '同意方案並確認空檔' : d.type === 'settle' ? '用現有課時補扣' : '確認'}</Button></>}><form id="operations-form" ref={form} onSubmit={e => {
      e.preventDefault();
      submit();
    }}>
    {d.type === 'teacherOff' && <><p>登記不能授課的時間後，受影響課堂會出現在工作台。逐堂代課、改期或取消即可。</p><div className="form-grid">{field('日期', <Input required type="date" min={todayHK()} value={v.date} onChange={e => put('date', e.target.value)} />)}{field('開始', <Input required type="time" value={v.start} onChange={e => put('start', e.target.value)} />)}{field('結束', <Input required type="time" value={v.end} onChange={e => put('end', e.target.value)} />)}</div><Alert type="warning" title={`受影響 ${affected.length} 堂課；記錄停課不會直接取消學生預約`} />{affected.map(b => <p key={b.id}>{b.start}–{b.end} · {courseName(db, b.courseId)} · {b.studentIds.map(id => studentName(db, id)).join('、')}</p>)}</>}
    {d.type === 'studentLeave' && <><p>{d.session.date} {d.session.start} · {courseName(db, d.session.courseId)}</p>{field('只處理這位學生', <Select disabled={role === 'parent'} value={v.studentId} onChange={x => put('studentId', x)} options={d.session.studentIds.map(id => ({
          value: id,
          label: studentName(db, id)
        }))} />)}<Alert type="info" title="本原型請假不扣課；同堂其他學生維持原安排。" /><Checkbox checked={v.makeup} onChange={e => put('makeup', e.target.checked)}>需要另約，加入待安排事項（不額外贈送課時）</Checkbox></>}
    {['teacherOff', 'studentLeave', 'invoiceFix'].includes(d.type) && field('原因', <Input.TextArea required value={v.reason} onChange={e => put('reason', e.target.value)} placeholder="留下原因，方便之後追溯" />)}
    {d.type === 'invoiceFix' && <><p>{d.invoice.no} · {money(d.invoice.total)}</p><Alert type="warning" title={d.invoice.paid ? '撤銷誤登收款，恢復待收款；課包會扣回相應餘額。這不是退款。' : '作廢後保留原單據，關聯按次課堂可重新開單。'} /><p>已使用的課包不能直接撤銷；真實退費及部分退款仍需另行結算。</p></>}
    {d.type === 'billingMode' && <>{field('以後新預約使用', <Select value={v.mode} onChange={x => put('mode', x)} options={[{
          value: 'package',
          label: '課包扣課'
        }, {
          value: 'single',
          label: '按次付費'
        }]} />)}<Alert type="info" title="只影響新預約。已安排和已完成的課堂保留原計費方式、單價及剩餘課時。" /></>}
    {d.type === 'proposal' && <><Alert type="info" title="方案尚未佔用時段，確認時會再次檢查老師、學生及課室空檔。" />{request?.proposal?.map(b => <p key={b.id}>{b.date} {b.start}–{b.end} · {teacherName(db, b.teacherId)} · {b.room} 室</p>)}{!!request?.remainingDates?.length && <p>尚待安排：{request.remainingDates.join('、')}</p>}</>}
    {d.type === 'settle' && <><p>{studentName(db, d.studentId)} · 現有 {db.students.find(s => s.id === d.studentId)?.balance} 堂</p>{pendingDeductions(db).filter(l => l.studentId === d.studentId).map(l => <p key={l.id}>{l.date} · {l.note} · 待補扣 1 堂</p>)}<Alert type="info" title="按上課日期由早至晚補扣，最多扣到餘額為零。續購並收款後也會自動補扣。" /></>}
    {error && <Alert type="error" showIcon title={error} />}</form></Modal>;
}
export function WorkQueue({
  db,
  setDialog,
  onStudents
}) {
  const [group, setGroup] = useState('all');
  const items = [...affectedLessons(db).map(b => ({
    id: 'off' + b.id,
    group: 'exception',
    label: `${b.date} ${b.start} · ${teacherName(db, b.teacherId)} 不能授課`,
    hint: b.studentIds.map(id => studentName(db, id)).join('、'),
    action: '安排代課 / 改期',
    dialog: {
      type: 'schedule',
      session: b
    }
  })), ...pendingDeductions(db).map(l => ({
    id: l.id,
    group: 'exception',
    label: `${studentName(db, l.studentId)} · ${l.date} 待補扣`,
    hint: '出勤已記錄，尚欠 1 堂課時',
    action: db.students.find(s => s.id === l.studentId)?.balance > 0 ? '補扣' : '續購處理',
    dialog: db.students.find(s => s.id === l.studentId)?.balance > 0 ? {
      type: 'settle',
      studentId: l.studentId
    } : {
      type: 'bill',
      studentId: l.studentId,
      source: 'package'
    }
  })), ...db.requests.filter(r => ['pending', 'awaiting'].includes(r.status)).map(r => ({
    id: r.id,
    group: 'schedule',
    label: `${studentName(db, r.studentId)} · ${r.makeupFor ? '請假後另約' : r.status === 'awaiting' ? '待家長確認' : '預約待安排'}`,
    hint: r.date < todayHK() ? '希望日期已過，請重新聯絡確認' : `${r.date} ${r.start}–${r.end}`,
    action: r.status === 'awaiting' ? '查看確認方案' : '處理需求',
    dialog: r.status === 'awaiting' ? {
      type: 'proposal',
      request: r
    } : {
      type: 'schedule',
      request: r
    }
  })), ...db.sessions.filter(b => b.status === 'scheduled' && b.date <= todayHK()).map(b => ({
    id: 'attendance' + b.id,
    group: 'attendance',
    label: `${b.date} ${b.start} · ${courseName(db, b.courseId)}`,
    hint: b.date < todayHK() ? '已過上課日期，仍未點名' : '今日待點名',
    action: '記錄出勤',
    dialog: {
      type: 'attendance',
      session: b
    }
  })), ...billableLessons(db).map(l => ({
    id: 'bill' + l.id,
    group: 'money',
    label: `${studentName(db, l.studentId)} · ${l.date} 課堂待開單`,
    hint: '已到課，尚未開立帳單',
    action: '開單',
    dialog: {
      type: 'bill',
      source: 'lesson',
      studentId: l.studentId,
      sessionIds: [l.sessionId]
    }
  })), ...db.invoices.filter(i => !i.paid && !i.voided).map(i => ({
    id: i.id,
    group: 'money',
    label: `${studentName(db, i.studentId)} · ${money(i.total)} 待收款`,
    hint: i.no,
    action: '登記收款',
    dialog: {
      type: 'payment',
      invoice: i
    }
  }))];
  const labels = [['all', '全部'], ['exception', '異常'], ['schedule', '待安排'], ['attendance', '待點名'], ['money', '待收款']];
  return <section className="panel work-queue"><div className="panel-title"><h3>接下來要處理</h3><Button onClick={onStudents}>查看低課時學生</Button></div><Segmented value={group} onChange={setGroup} options={labels.map(([value, label]) => ({
      value,
      label: `${label} ${items.filter(i => value === 'all' || i.group === value).length}`
    }))} /><div className="task-list">{items.filter(i => group === 'all' || i.group === group).map(i => <div className="task-row" key={i.id}><div><b>{i.label}</b><small>{i.hint}</small></div><Button onClick={() => setDialog(i.dialog)}>{i.action}</Button></div>)}{!items.some(i => group === 'all' || i.group === group) && <Empty description="這一類待辦已處理完" />}</div></section>;
}
export function WeekView({
  db,
  date,
  sessions,
  onOpen,
  onDay
}) {
  const day = new Date(date + 'T12:00:00').getDay();
  const monday = dateAdd(date, -((day + 6) % 7));
  return <div className="week-board">{Array.from({
      length: 7
    }, (_, n) => dateAdd(monday, n)).map(d => <section key={d}><Button type="text" onClick={() => onDay(d)}>{d.slice(5)} · {['日', '一', '二', '三', '四', '五', '六'][new Date(d + 'T12:00:00').getDay()]}</Button>{sessions.filter(b => b.date === d && b.status !== 'cancelled').sort((a, b) => a.start.localeCompare(b.start)).map(b => <button className="week-lesson" key={b.id} onClick={() => onOpen(b)}><b>{b.start}–{b.end}</b><span>{teacherName(db, b.teacherId)}</span><span>{courseName(db, b.courseId)}</span><small>{b.studentIds.map(id => studentName(db, id)).join('、')}</small>{b.batchId && <Tag>系列課堂</Tag>}</button>)}</section>)}</div>;
}
