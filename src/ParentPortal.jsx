/** @jsx localizedElement */
import React, { useState, useEffect } from 'react';
import { Button, Input, Alert, Empty, Select, Tag, Modal } from 'antd';
import { HomeOutlined, CalendarOutlined, CheckOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { localizedElement } from './language';
import { todayHK, teacherName, courseName, totalStudentLessons } from './model';
import { studentLessonStatus } from './studentLessonStatus';
import { PARENT_PHONE, PARENT_CODE, parentStudents, parentRecords } from './parentData';
import ParentCalendar from './ParentCalendar.jsx';
import { renderInvoicePdf, invoiceDocuments } from './invoicePdf';
import './parent-portal.css';
export default function ParentPortal({ db, exit }) {
  const [phone, setPhone] = useState(PARENT_PHONE), [code, setCode] = useState(PARENT_CODE);
  const [loggedIn, setLoggedIn] = useState(false), [error, setError] = useState('');
  const students = parentStudents(db);
  const [selected, setSelected] = useState('');
  const [tab, setTab] = useState('home'), [date, setDate] = useState(todayHK());
  const [courseId, setCourseId] = useState(''), [lessonId, setLessonId] = useState(null), [pdf, setPdf] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const timer=setInterval(()=>setNow(Date.now()),30000); return ()=>clearInterval(timer); },[]);
  useEffect(()=>()=>{if(pdf)URL.revokeObjectURL(pdf.url);},[pdf]);
  const student = students.find(s => s.id === selected) || students[0];
  const { sessions, invoices } = parentRecords(db, student?.id);
  const documents = invoiceDocuments(invoices);
  const courses = [...new Set(sessions.map(s=>s.courseId))].map(id=>({value:id,label:courseName(db,id)}));
  const lesson = sessions.find(s=>s.id===lessonId);
  const attendanceRow = s => { const status = studentLessonStatus(s,student.id,now); return <article className="parent-card parent-attendance-row" key={s.id}><div className="parent-row"><b>{s.date} · {s.start}–{s.end}</b><Tag color={status.color}>{status.label}</Tag></div><p className="parent-attendance-teacher">{teacherName(db,s.teacherId)}</p><p className="parent-attendance-note">{s.attendanceNotes?.[student.id] ?? s.attendanceNote ?? '暫無備註'}</p></article>; };
  const openPdf = doc => {try { const rendered=renderInvoicePdf(doc.invoice,student,doc.kind);const url=URL.createObjectURL(rendered.blob);setPdf({url,name:doc.name,pages:rendered.previewPages});setError(''); } catch {setError('PDF 產生失敗，請重試');}};
  if (!loggedIn) return <div className="parent-portal"><div className="parent-shell parent-login"><div className="parent-brand">ac.</div><p className="parent-eyebrow">AC EDUCATION</p><h1>家長登入</h1><p className="parent-muted">課表、考勤與課時，一目了然。</p><form onSubmit={e => {e.preventDefault(); if (phone.trim() !== PARENT_PHONE || code.trim() !== PARENT_CODE) return setError('手機號碼或驗證碼不正確'); setError(''); setLoggedIn(true);}}><label>手機號碼<Input aria-label="家長手機號碼" inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} required /></label><label>驗證碼<Input aria-label="家長驗證碼" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} required /></label>{error && <Alert type="error" title={error} />}<Button type="primary" size="large" block htmlType="submit">登入</Button></form><small className="parent-muted">測試登入：17788889999 / 123456<br/>展示系統已有學生資料；未接入簡訊服務。</small><Button type="text" onClick={exit}>返回超級管理員</Button></div></div>;
  return <div className="parent-portal"><div className="parent-shell"><header className="parent-header"><div><b>AC Education</b><small>家長中心</small></div><Button type="text" onClick={()=>{setLoggedIn(false);setPdf(null);setLessonId(null);}}>退出</Button></header><main className={`parent-main parent-page-${tab}`}>{student ? <>
    {tab === 'home' && <><div className="parent-student"><div><p className="parent-eyebrow">{student.parent || '家長'}，您好</p><h1>{student.name}<small>{student.english}</small></h1><p>{student.grade}</p></div>{students.length > 1 && <Select aria-label="選擇孩子" value={student.id} options={students.map(s=>({value:s.id,label:s.name}))} onChange={id=>{setSelected(id);setCourseId('');}} />}</div><div className="parent-stats"><section className="parent-card"><small>剩餘課時</small><strong>{student.balance ?? 0}<span>堂</span></strong></section><section className="parent-card"><small>總課時</small><strong>{totalStudentLessons(db,student.id)}<span>堂</span></strong></section></div></>}
    {tab === 'schedule' && <><h2>課表</h2><ParentCalendar db={db} sessions={sessions} studentId={student.id} date={date} setDate={setDate} now={now} onSelect={s=>setLessonId(s.id)}/></>}
    {tab === 'attendance' && <><h2>考勤</h2><Select className="parent-course-select" aria-label="選擇考勤課程" placeholder="先選擇課程" value={courseId || undefined} options={courses} onChange={setCourseId}/>{courseId ? <>{[...sessions].filter(s=>s.courseId===courseId).sort((a,b)=>(b.date+b.start).localeCompare(a.date+a.start)).map(attendanceRow)}</> : <Empty description={courses.length?'請先選擇課程，查看考勤記錄':'暫無課程考勤'} image={Empty.PRESENTED_IMAGE_SIMPLE}/>}</>}
    {tab === 'billing' && <><h2>帳單 PDF</h2>{error && <Alert type="error" title={error}/>}<div className="parent-pdf-list">{documents.map(doc=><button className="parent-pdf-file" key={`${doc.invoice.id}-${doc.kind}`} onClick={()=>openPdf(doc)}><FileTextOutlined/><span><b>{doc.name}</b><small>{doc.date}{doc.invoice.voided?' · 已作廢':''}</small></span><span className="parent-pdf-badge">PDF</span></button>)}</div>{!documents.length && <Empty description="暫無已出帳單" image={Empty.PRESENTED_IMAGE_SIMPLE}/>}</>}
    </> : <Empty description="尚未關聯學生，請聯絡教務" />}</main><nav className="parent-nav" aria-label="家長功能">{[['home','首頁',HomeOutlined],['schedule','課表',CalendarOutlined],['attendance','考勤',CheckOutlined],['billing','帳單',FileTextOutlined]].map(([key,label,Icon])=><button key={key} aria-current={tab===key?'page':undefined} className={tab===key?'active':''} onClick={()=>{setTab(key);window.scrollTo(0,0);}}><Icon/><span>{label}</span></button>)}</nav>
    <Modal open={!!lesson} title={lesson ? `${courseName(db,lesson.courseId)} · 考勤` : '考勤'} footer={<Button onClick={()=>setLessonId(null)}>關閉</Button>} onCancel={()=>setLessonId(null)} width={460}>{lesson && attendanceRow(lesson)}</Modal>
    <Modal className="parent-pdf-modal" open={!!pdf} title={pdf?.name} onCancel={()=>setPdf(null)} width={760} footer={<><Button onClick={()=>setPdf(null)}>關閉</Button>{pdf && <Button type="primary" icon={<DownloadOutlined/>} href={pdf.url} download={pdf.name}>下載 PDF</Button>}</>}>{pdf && <><div className="parent-pdf-preview">{pdf.pages.map((page,index)=><img key={index} src={page} alt={`帳單 PDF 第 ${index+1} 頁`}/>)}</div><a href={pdf.url} target="_blank" rel="noreferrer">在新分頁開啟 PDF</a></>}</Modal>
    </div></div>;
}
