/** @jsx localizedElement */
import Input from './SystemInput';
import { courseRates, coursePrice, validateCourseRates } from './coursePricing';
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntApp, ConfigProvider, Button, InputNumber, Select, Tag, Modal, Empty, Segmented, Alert, Checkbox, Popconfirm } from 'antd';
import { CalendarOutlined, TeamOutlined, BookOutlined, FileTextOutlined, ClockCircleOutlined, PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined, SearchOutlined, AppstoreOutlined, SwapOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { deleteSession, upgradeDemoBilling, reconcileDemoBookingCredits, hasConfirmedConsumption, confirmStudentConsumption, markStudentAbsent, upgradeDemoTeacherVariety, confirmSessionConsumption, saveSessionAttendance, addSessionStudents, upgradeDemoCalendar, upgradeDemoAvatars, upgradeDemoCourses, totalStudentLessons, usePurchasedLessonCredits, addStudent, seed, upgradeDemoStudents, uid, dateAdd, todayHK, mins, money, availability, validateSessions, completeSession, totals, courseName, studentName, teacherName, billableLessons, reverseAttendance, normalizeDb, lessonCharge, pendingDeductions, registerPayment, settleCredits, commitSchedule, changeSeries, seriesDrafts, suggestSlot } from './model';
import 'antd/dist/reset.css';
import './style.css';
import './mac-theme.css';
import './native-layout.css';
import './glass-layout.css';
import './dialog-theme.css';
import { NativeLayoutContext, PageHeading, NativeSidebar, NativeToolbar, NativeRecordTable } from './NativeUI';
import { macTheme } from './themes';
import { OperationsDialog, operationTypes, WeekView } from './Operations';
import Teachers from './Teachers';
import TeacherPortal from './TeacherPortal';
import ParentPortal from './ParentPortal';
import { upgradeDemoTeacherPasswords } from './demoTeacherPasswords';
import { purchasedTeacher } from './purchaseTeacher';
import { attendanceRows } from './attendanceRows';
import { authenticateTeacher, hashTeacherPassword, loginName } from './teacherAuth';
import Dashboard from './Dashboard';
import TeacherAvatarEditor, { TeacherAvatar } from './TeacherAvatar';
import StudentRecords from './StudentRecords.jsx';
import TeachingResources from './TeachingResources.jsx';
import ExamPapers from './ExamPapers.jsx';
import zhCN from 'antd/locale/zh_CN';
import zhHK from 'antd/locale/zh_HK';
import { localizedElement, t, simplify, LANGUAGE_KEY, setDisplayLanguage } from './language';
const STORE = 'ac-flex-demo-v3';
const statusNames = {
  scheduled: '已安排',
  pendingConsumption: '待老師確認課銷',
  completed: '已完成',
  cancelled: '已取消',
  pending: '待安排',
  accepted: '已安排',
  declined: '未接受',
  awaiting: '待家長確認'
};
const days = ['日', '一', '二', '三', '四', '五', '六'];
const options = (items, label = 'name') => items.map(x => ({
  value: x.id,
  label: x[label]
}));
const dateLabel = d => `${d.slice(5).replace('-', '月')}日 · 週${days[new Date(d + 'T12:00:00').getDay()]}`;
function Status({
  value
}) {
  return <Tag color={value === 'completed' || value === 'accepted' ? 'green' : value === 'pending' ? 'gold' : value === 'cancelled' || value === 'declined' ? 'default' : 'blue'}>{statusNames[value] || value}</Tag>;
}
function Field({
  label,
  children,
  wide
}) {
  return <label className={'field ' + (wide ? 'wide' : '')}><span>{label}</span>{children}</label>;
}
function Panel({
  title,
  extra,
  children,
  className = ''
}) {
  return <section className={'panel ' + className}><div className="panel-title"><h3>{title}</h3>{extra}</div>{children}</section>;
}
function Demo({
  language,
  onLanguageChange
}) {
  const {
    message: rawMessage
  } = AntApp.useApp();
  const message = {
    success: content => rawMessage.success(t(content))
  };
  const [savedDb, setSavedDb] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(STORE));
      return upgradeDemoTeacherPasswords(upgradeDemoBilling(reconcileDemoBookingCredits(upgradeDemoTeacherVariety(upgradeDemoCalendar(usePurchasedLessonCredits(normalizeDb(upgradeDemoAvatars(upgradeDemoCourses(v?.version === 3 ? upgradeDemoStudents(v) : seed())))))))));
    } catch {
      return upgradeDemoTeacherPasswords(upgradeDemoBilling(reconcileDemoBookingCredits(upgradeDemoTeacherVariety(upgradeDemoCalendar(usePurchasedLessonCredits(normalizeDb(upgradeDemoAvatars(upgradeDemoCourses(seed())))))))));
    }
  });
  const [parentEntry, setParentEntry] = useState(new URLSearchParams(window.location.search).get('view') === 'parent');
  const [teacherAccount, setTeacherAccount] = useState(null);
  const [teacherEntry, setTeacherEntry] = useState(new URLSearchParams(window.location.search).get('view') === 'teacher');
  const [loginOpen, setLoginOpen] = useState(teacherEntry);
  const [login, setLogin] = useState({name:'KK',password:'123456'});
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const role = teacherAccount ? 'teacher' : 'admin';
  const teacherId = teacherAccount?.id;

  const [page, setPage] = useState('schedule'),
    [date, setDate] = useState(todayHK()),
    [filter, setFilter] = useState('all'),
    [search, setSearch] = useState(''),
    [dialog, setDialog] = useState(null),
    [storageError, setStorageError] = useState(false);
  const [toolbarHost, setToolbarHost] = useState(null);
  const contentRef = useRef(null);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [page]);
  const [scheduleView, setScheduleView] = useState('day');
  const [studentFilter, setStudentFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [attendanceNow, setAttendanceNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setAttendanceNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  const [billingFilter, setBillingFilter] = useState('pending');
  const [billingSearch, setBillingSearch] = useState('');
  const db = savedDb;
  const setDb = setSavedDb;
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(savedDb));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [savedDb]);
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }, [page, role]);
  const parentId = 's1';
  const isAdmin = role === 'admin';
  const visibleSessions = db.sessions.filter(s => !s.deletedAt && (isAdmin || s.teacherId === teacherId));
  const visibleStudents = db.students;
  const current = visibleSessions.filter(b => b.date === date && b.status !== 'cancelled');
  const billingQuery = simplify(billingSearch.trim()).toLowerCase();
  const visibleInvoices = db.invoices.filter(i => billingFilter === 'all' || (billingFilter === 'pending' ? !i.paid && !i.voided : billingFilter === 'paid' ? i.paid && !i.voided : false)).filter(i => {
    const student = db.students.find(s => s.id === i.studentId);
    return !billingQuery || simplify(`${student?.name || ''} ${student?.english || ''}`).toLowerCase().includes(billingQuery);
  });
  const update = (fn, text) => {
    setDb(old => fn(old));
    if (text) message.success(text);
  };
  const record = (old, text) => [{
    id: uid(),
    at: new Date().toISOString(),
    text
  }, ...old.history];
  const openSchedule = (request = null, session = null) => setDialog({
    type: 'schedule',
    request,
    session
  });
  const menu = [{ key: 'dashboard', label: '數據面板', icon: <AppstoreOutlined /> }, {
    key: 'schedule',
    label: isAdmin ? '課表' : '課堂安排',
    icon: <CalendarOutlined />
  }, ...(role !== 'parent' ? [{
    key: 'teachers',
    label: isAdmin ? '老師與可用時間' : '我的可用時間',
    icon: <ClockCircleOutlined />
  }] : []), {
    key: 'students',
    label: role === 'parent' ? '孩子與課時' : '學生與課時',
    icon: <TeamOutlined />
  }, {
    key: 'courses',
    label: '課程與收費',
    icon: <BookOutlined />
  }, ...(role !== 'parent' ? [{
    key: 'attendance',
    label: '考勤與課銷',
    icon: <CheckOutlined />
  }] : []), ...(role !== 'teacher' ? [{
    key: 'billing',
    label: isAdmin ? '帳單與收款' : '我的單據',
    icon: <FileTextOutlined />
  }] : [])];
  menu.push(...[{ key: 'audio', label: '音頻' }, { key: 'video', label: '視頻' }, { key: 'questions', label: '試題' }, { key: 'papers', label: '試卷' }]);
  const nav = k => {
    setPage(k);
    setSearch('');
    if (k === 'students') setStudentFilter('all');
  };
  const table = (rows, cols, props = {}) => <NativeRecordTable key={props.key || page} rows={rows} cols={cols} tableProps={props} />;
  const sessionCols = [{
    title: '課堂時間',
    render: (_, b) => <><b>{b.date.slice(5)}　{b.start}–{b.end}</b><small>{courseName(db, b.courseId)}</small></>
  }, {
    title: '學生',
    render: (_, b) => b.studentIds.filter(s => role !== 'parent' || s === parentId).map(s => studentName(db, s)).join('、')
  }, {
    title: '老師',
    render: (_, b) => teacherName(db, b.teacherId)
  }, {
    title: '狀態',
    render: (_, b) => <Status value={b.pendingConsumption ? 'pendingConsumption' : b.status} />
  }, {
    title: '操作',
    render: (_, b) => <Button size="small" onClick={() => setDialog({
      type: 'session',
      session: b
    })}>查看課堂</Button>
  }];
  function scheduleBoard() {
    const teachers = db.teachers.filter(t => (role !== 'teacher' || t.id === teacherId) && (filter === 'all' || filter === t.id));
    return <div className="board-scroll"><div className="board" style={{
        minWidth: Math.max(520, teachers.length * 165 + 59)
      }}><div className="time-col"><div className="lane-head">香港時間</div>{Array.from({
            length: 11
          }, (_, i) => <div className="time-label" key={i}>{String(i + 10).padStart(2, '0')}:00</div>)}</div>{teachers.map(t => <div className="teacher-lane" key={t.id}><div className="lane-head"><TeacherAvatar teacher={t} /><div><b>{t.name}</b><small>{t.type === 'full' ? '全職 · 固定在崗' : '兼職 · 已確認時段'}</small></div></div><div className="lane-body">{availability(t, date).map((w, i) => <div className="available" key={i} style={{
              top: (mins(w.start) - 600) * 1.15,
              height: (mins(w.end) - mins(w.start)) * 1.15
            }}><span>{w.start}–{w.end} 可授課</span></div>)}{current.filter(b => b.teacherId === t.id).map(b => <button key={b.id} className={'lesson ' + (b.status === 'completed' ? 'done' : '')} style={{
              top: (mins(b.start) - 600) * 1.15,
              height: Math.max(48, (mins(b.end) - mins(b.start)) * 1.15 - 3),
              borderLeftColor: db.courses.find(c => c.id === b.courseId)?.color
            }} onClick={() => setDialog({
              type: 'session',
              session: b
            })}><div><b>{b.start}–{b.end}</b></div><strong>{courseName(db, b.courseId)}</strong><p>{b.studentIds.filter(s => role !== 'parent' || s === parentId).map(s => studentName(db, s)).join('、')}{b.status === 'completed' ? ' ✓' : ''}</p></button>)}{!availability(t, date).length && <div className="no-availability">未確認可用時間<br /><small>先與老師確認，再安排課堂</small></div>}</div></div>)}</div></div>;
  }
  let body;
  if (page === 'papers') body = <ExamPapers />;
  if (['audio', 'video', 'questions'].includes(page)) body = <TeachingResources key={page} type={page} />;
  if (page === 'dashboard') body = <Dashboard db={db} />;
  if (page === 'schedule') body = <><PageHeading><div><h1>{isAdmin ? '課表' : '課堂安排'}</h1></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => openSchedule()}>安排課堂</Button>}</PageHeading><Panel title={dateLabel(date)} extra={<div className="actions"><Segmented value={scheduleView} onChange={setScheduleView} options={[{
        value: "day",
        label: "日"
      }, {
        value: "week",
        label: "週"
      }]} /><Button aria-label="前一天" icon={<ArrowLeftOutlined />} onClick={() => setDate(dateAdd(date, scheduleView === 'week' ? -7 : -1))} /><Input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} style={{
        width: 150
      }} /><Button aria-label="後一天" icon={<ArrowRightOutlined />} onClick={() => setDate(dateAdd(date, scheduleView === 'week' ? 7 : 1))} /><Button onClick={() => setDate(todayHK())}>今天</Button>{isAdmin && <Select value={filter} onChange={setFilter} options={[{
        value: 'all',
        label: '全部老師'
      }, ...options(db.teachers)]} style={{
        width: 140
      }} />}</div>}>{scheduleView === 'week' && role !== 'parent' ? <WeekView db={db} date={date} sessions={visibleSessions.filter(b => filter === 'all' || b.teacherId === filter)} onOpen={b => setDialog({
        type: 'session',
        session: b
      })} onDay={d => {
        setDate(d);
        setScheduleView('day');
      }} /> : role === 'parent' ? table(current, sessionCols) : <><div className="board-note"><span className="dot green" /> 可授課空檔 <span className="dot blue" /> 已安排課堂</div>{scheduleBoard()}</>}</Panel><Panel title="課堂記錄" className="section">{table([...visibleSessions].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)), sessionCols)}</Panel></>;
  if (page === 'teachers') body = <Teachers db={db} isAdmin={isAdmin} teacherId={teacherId} setDialog={setDialog} update={update} record={record} />;
  if (page === 'students') body = <><PageHeading><div><h1>{role === 'parent' ? '孩子與課時' : '學生與課時'}</h1></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialog({
        type: 'student'
      })}>新增學生</Button>}</PageHeading><Panel title="學生名單" extra={<div className="actions"><Segmented value={studentFilter} onChange={setStudentFilter} options={[{
        value: "all",
        label: "全部"
      }, {
        value: "low",
        label: "課時不足 / 即將用完"
      }]} /><Input prefix={<SearchOutlined />} placeholder="搜尋姓名、年級" value={search} onChange={e => setSearch(e.target.value)} style={{
        width: 220
      }} /></div>}>{table(visibleStudents.filter(s => studentFilter === 'all' || s.mode === 'package' && s.balance <= 2 || pendingDeductions(db).some(l => l.studentId === s.id)).filter(s => simplify(s.name + s.english + s.grade).toLowerCase().includes(simplify(search).toLowerCase())), [{
        title: '學生',
        render: (_, s) => <><b>{s.name}</b><small>{s.english}</small></>
      }, {
        title: '家長 / 聯絡',
        render: (_, s) => <>{s.parent}<small>{s.phone}</small></>
      }, {
        title: '年級',
        dataIndex: 'grade'
      }, {
        title: '課時餘額',
        render: (_, s) => {
          const total = totalStudentLessons(db, s.id);
          const percent = total > 0 ? Math.max(0, Math.min(100, s.balance / total * 100)) : 0;
          return <div className={`student-credit-progress${s.balance <= 2 ? ' is-low' : ''}`}>
            <div className="student-credit-label"><b>剩餘 {s.balance} 堂</b><span>共 {total} 堂</span></div>
            <div className="student-credit-track" role="progressbar" aria-label={t(`${s.name}剩餘課時`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-valuetext={t(`剩餘 ${s.balance} 堂，共 ${total} 堂`)}><div style={{width:`${percent}%`}} /></div>
          </div>;
        }
      }, {
        title: '操作',
        render: (_, s) => <div className="actions"><Button size="small" onClick={() => setDialog({
            type: 'studentDetail',
            student: s
          })}>查看記錄</Button><Button size="small" onClick={() => setDialog({ type: 'student', student: s })}>編輯資料</Button>{isAdmin && s.mode === 'package' && <Button size="small" onClick={() => setDialog({
            type: 'bill',
            studentId: s.id,
            source: 'package'
          })}>購買課時</Button>}</div>
      }], {
        key: `students-${role}-${teacherId}-${studentFilter}-${search}`,
        pagination: {
          pageSize: 8,
          showSizeChanger: false,
          hideOnSinglePage: false,
          showTotal: total => t(`共 ${total} 位學生`)
        }
      })}</Panel></>;
  if (page === 'courses') body = <><PageHeading><div><h1>課程與收費</h1></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialog({
        type: 'course'
      })}>新增課程</Button>}</PageHeading><div className="teacher-cards">{db.courses.map(c => <Panel key={c.id} title={c.name}><p className="muted">{c.description}</p>{courseRates(c).map(r => <div className="course-price" key={r.durationMinutes}>{money(r.price)} <small>/ 人 / {r.durationMinutes / 60} 小時</small></div>)}<p className="muted">可授課 · {db.teachers.filter(t => t.subjects.includes(c.id)).map(t => t.name).join('、') || '待設定老師'}</p>{isAdmin ? <Button className="card-action button-soft" onClick={() => setDialog({
          type: 'course',
          course: c
        })}>編輯課程與單價</Button> : null}</Panel>)}</div></>;
  if (page === 'attendance') body = <><PageHeading><div><h1>考勤與課銷</h1></div></PageHeading><Panel title="考勤記錄" extra={<Select aria-label="篩選考勤記錄" style={{minWidth:180}} value={attendanceFilter} onChange={setAttendanceFilter} options={[{value:'all',label:'全部考勤'},{value:'unrecorded',label:'已過課次未考勤'},{value:'present',label:'出勤'},{value:'absent',label:'缺勤'},{value:'pending',label:'待確認課銷'},{value:'completed',label:'已確認課銷'}]} />}>{table(attendanceRows(db,visibleSessions,attendanceNow).filter(r=>attendanceFilter==='all'||(['unrecorded','present','absent'].includes(attendanceFilter)?r.status===attendanceFilter:attendanceFilter==='completed'?r.confirmed:r.status!=='unrecorded'&&!r.confirmed)),[
      {title:'學生',render:(_,r)=><><b>{studentName(db,r.studentId)}</b><small>{db.students.find(s=>s.id===r.studentId)?.english}</small></>},
      {title:'課堂',render:(_,r)=><><b>{r.session.date} · {r.session.start}–{r.session.end}</b><small>{courseName(db,r.session.courseId)}</small></>},
      {title:'老師',render:(_,r)=>teacherName(db,r.session.teacherId)},
      {title:'考勤狀態',render:(_,r)=><Tag color={r.status==='unrecorded'?'gold':r.status==='present'?'green':'default'}>{r.status==='unrecorded'?'已過課次未考勤':r.status==='present'?'出勤':'缺勤'}</Tag>},
      {title:'考勤備註',render:(_,r)=>r.session.attendanceNotes?.[r.studentId] ?? r.session.attendanceNote ?? '—'},
      {title:'課銷狀態',render:(_,r)=>r.status==='unrecorded'?'待記錄考勤':<Tag color={r.confirmed?'green':'gold'}>{r.confirmed?'已確認課銷':'待確認課銷'}{r.status==='absent'?' · 不扣課時':''}</Tag>},
      {title:'操作',render:(_,r)=><div className="actions"><Button onClick={()=>setDialog({type:'session',session:r.session})}>{r.status==='unrecorded'?'補錄考勤':'查看 / 更正考勤'}</Button>{r.status!=='unrecorded'&&!r.confirmed&&<Button type="primary" onClick={()=>{try{setDb(confirmStudentConsumption(db,r.session.id,r.studentId,r.session.teacherId));message.success(r.status==='absent'?'缺勤課銷已確認，不扣課時':'已確認課銷');}catch(e){rawMessage.error(t(e.message));}}}>{r.status==='absent'?'確認缺勤課銷':'確認課銷'}</Button>}{r.status==='present'&&<Popconfirm title="改為缺勤？已扣課時會退回，缺勤課銷需重新確認。" onConfirm={()=>{try{setDb(markStudentAbsent(db,r.session.id,r.studentId));message.success('已改為缺勤，待確認缺勤課銷');}catch(e){rawMessage.error(t(e.message));}}}><Button>改為缺勤</Button></Popconfirm>}</div>}
    ])}</Panel></>;
  if (page === 'billing') body = <><PageHeading><div><h1>{isAdmin ? '帳單與收款' : '我的單據'}</h1></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialog({
        type: 'bill'
      })}>購課 / 續費</Button>}</PageHeading><div className="billing-filters"><Segmented value={billingFilter} onChange={setBillingFilter} options={[
        {value:'pending',label:`待收款 (${db.invoices.filter(i => !i.paid && !i.voided).length})`},
        {value:'paid',label:'已收款'},
        {value:'all',label:'全部記錄'}
      ]} /><Input className="billing-student-search" prefix={<SearchOutlined />} placeholder="搜尋學生中英文名" aria-label="搜尋帳單學生" allowClear value={billingSearch} onChange={e=>setBillingSearch(e.target.value)} /></div><Panel title={billingFilter === 'pending' ? '待收款帳單' : billingFilter === 'paid' ? '已收款記錄' : '全部單據'} className="section">{table(visibleInvoices, [{
        title: '單據編號',
        render: (_, i) => <><b>{i.no}</b><small>{i.paid ? '收據已開立' : '帳單'} · {i.date}</small></>
      }, {
        title: '學生',
        render: (_, i) => studentName(db, i.studentId)
      }, {
        title: '收費項目',
        render: (_, i) => <b>{i.lines.map(l => l.description).join('、')}</b>
      }, {
        title: '金額',
        render: (_, i) => <b>{money(i.total)}</b>
      }, {
        title: '付款狀態',
        render: (_, i) => <Tag color={i.voided ? 'default' : i.paid ? 'green' : 'orange'}>{i.voided ? '已作廢' : i.paid ? '已收款' : '待收款'}</Tag>
      }, {
        title: '操作',
        render: (_, i) => <div className="actions"><Button size="small" onClick={() => setDialog({
            type: 'invoice',
            invoice: i
          })}>查看單據</Button>{isAdmin && !i.paid && !i.voided && <Button size="small" type="primary" onClick={() => setDialog({
            type: 'payment',
            invoice: i
          })}>登記收款</Button>}{isAdmin && !i.voided && <Button size="small" onClick={() => setDialog({
            type: 'invoiceFix',
            invoice: i
          })}>{i.paid ? '撤銷誤收款' : '作廢帳單'}</Button>}</div>
      }], {key:`billing-${billingFilter}-${billingQuery}-${visibleInvoices.length}`, inspectorTitle:'學生', pagination:{pageSize:6,showSizeChanger:false,hideOnSinglePage:true}, onChange:()=>contentRef.current?.scrollTo({top:0,left:0})})}</Panel></>;
  if (parentEntry) return <ParentPortal db={db} exit={() => { setParentEntry(false); const url = new URL(window.location.href); url.searchParams.delete('view'); window.history.replaceState(null, '', url.pathname + url.search + url.hash); }} />;
  const logoutTeacher = () => { setTeacherAccount(null); setDialog(null); setLogin({name:'KK',password:'123456'}); setLoginError(''); setLoginOpen(true); };
  const teacherDialogs = dialog && ['availability', 'session', 'attendance'].includes(dialog.type) && (dialog.teacher?.id === teacherId || dialog.session?.teacherId === teacherId) ? <Dialogs key={dialog.type + (dialog.session?.id || dialog.teacher?.id || '')} dialog={dialog} close={() => setDialog(null)} db={db} setDb={setDb} setDialog={setDialog} role={role} teacherId={teacherId} date={date} message={message} record={record} /> : null;
  if (teacherAccount) {
    const account = db.teachers.find(t => t.id === teacherId);
    if (account && account.passwordHash !== teacherAccount.passwordHash) return <div className="teacher-portal"><div className="teacher-phone"><Empty description="密碼已更新，請重新登入" /><Button onClick={logoutTeacher}>重新登入</Button></div></div>;
    return <TeacherPortal db={db} teacherId={teacherId} setDialog={setDialog} logout={logoutTeacher} saveMemo={value => {setDb(old=>({...old,teachers:old.teachers.map(t=>t.id===teacherId?{...t,scheduleMemo:value}:t)}));message.success('備忘錄已儲存');}} storageError={storageError}>{teacherDialogs}</TeacherPortal>;
  }
  const returnToAdmin = () => {
    setTeacherAccount(null); setTeacherEntry(false); setLoginOpen(false); setLoginError(''); setLogin({name:'KK',password:'123456'}); setDialog(null);
    const url = new URL(window.location.href); url.searchParams.delete('view'); window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  };
  const loginModal = <Modal open={loginOpen} title="老師登入" closable={!teacherEntry} maskClosable={!teacherEntry} keyboard={!teacherEntry} onCancel={() => !teacherEntry && setLoginOpen(false)} footer={null} width={400}><form className="teacher-login-form" onSubmit={async e => {
    e.preventDefault(); setLoginBusy(true); setLoginError('');
    try {
      const id = await authenticateTeacher(db.teachers, login.name, login.password);
      if (!id) { setLoginError('姓名或密碼不正確，請聯絡教務確認帳號。'); return; }
      const account = db.teachers.find(t => t.id === id);
      setTeacherAccount({id, passwordHash:account.passwordHash}); setLoginOpen(false); setDialog(null); setLogin({name:'KK',password:'123456'});
    } catch { setLoginError('登入失敗，請重試。'); } finally { setLoginBusy(false); }
  }}><label>老師姓名<Input required autoComplete="username" value={login.name} onChange={e=>setLogin({...login,name:e.target.value})} /></label><label>密碼<Input.Password required autoComplete="current-password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} /></label>{loginError && <Alert type="error" title={loginError} />}<Button type="primary" htmlType="submit" size="large" block loading={loginBusy}>登入</Button><small className="muted">請使用教務在老師基本資料中設定的姓名和密碼。</small><Button type="text" block disabled={loginBusy} onClick={returnToAdmin}>返回超級管理員</Button></form></Modal>;
  if (teacherEntry) return <div className="teacher-portal"><div className="teacher-phone"><header className="teacher-phone-header"><b>AC Education · 老師工作台</b></header>{loginModal}</div></div>;
  return <NativeLayoutContext.Provider value={{host:toolbarHost}}><div data-page={page} className="app native-app"><NativeSidebar menu={menu} page={page} nav={nav} roleLabel="超級管理員" onParentLogin={() => { setParentEntry(true); setDialog(null); setLoginOpen(false); const url = new URL(window.location.href); url.searchParams.set('view', 'parent'); window.history.replaceState(null, '', url.pathname + url.search + url.hash); }} onTeacherLogin={() => { setLogin({name:'KK',password:'123456'}); setLoginError(''); setLoginOpen(true); }} /><main><NativeToolbar setHost={setToolbarHost} language={language} onLanguageChange={onLanguageChange} /><div className="content" ref={contentRef}>{storageError && <Alert type="warning" title="瀏覽器儲存空間不足，本次變更暫未保存；請勿重新整理。" />}{body}<footer>AC Education · 少一點行政，多一點教學 <span>香港時間 · HKD</span></footer></div></main>{dialog && (operationTypes.includes(dialog.type) ? <OperationsDialog key={dialog.type + (dialog.studentId || dialog.invoice?.id || dialog.request?.id || dialog.session?.id || '')} dialog={dialog} db={db} setDb={setDb} close={() => setDialog(null)} role={role} message={message} /> : <Dialogs key={dialog.type + (dialog.session?.id || dialog.teacher?.id || '')} dialog={dialog} close={() => setDialog(null)} db={db} setDb={setDb} setDialog={setDialog} role={role} teacherId={teacherId} parentId={parentId} date={date} setDate={setDate} nav={nav} message={message} record={record} />)}{loginModal}</div></NativeLayoutContext.Provider>;
}
function Dialogs({
  dialog: d,
  close,
  db,
  setDb,
  setDialog,
  role,
  teacherId,
  parentId,
  date,
  setDate,
  nav,
  message,
  record
}) {
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState('');
  const [v, setV] = useState(() => {
    if (d.type === 'schedule') {
      const b = d.session,
        r = d.request;
      return {
        courseId: b?.courseId || r?.courseId || undefined,
        studentIds: b?.studentIds || (r ? [r.studentId] : []),
        date: b?.date || r?.date || '',
        start: b?.start || r?.start || '',
        end: b?.end || r?.end || '',
        days: r?.days || 1,
        repeat: 'daily',
        teacherId: b?.teacherId || '',
        teachers: {},
        room: b?.room || 'A',
        note: b?.note || r?.note || '',
        adjustments: {},
        skipped: [],
        scope: 'one',
        confirmation: 'confirmed'
      };
    }
    if (d.type === 'availability') return {
      weekly: structuredClone(d.teacher.weekly),
      extra: structuredClone(d.teacher.extra)
    };
    if (d.type === 'student') return d.student ? {
      ...d.student
    } : {
      name: '',
      english: '',
      grade: 'P4',
      parent: '',
      phone: '',
      mode: 'package',
      notes: ''
    };
    if (d.type === 'teacher') return d.teacher ? {
      ...d.teacher
    } : {
      name: '',
      english: '',
      type: 'part',
      subjects: ['c1'],
      grades: ['P3', 'P4', 'P5', 'P6'],
      weekly: [],
      extra: [],
      color: '#37786a'
    };
    if (d.type === 'course') return d.course ? {
      ...d.course,
      rates: courseRates(d.course).map(r => ({ ...r }))
    } : {
      name: '',
      price: null,
      rates: [{ durationMinutes: 60, price: null }],
      description: '',
      color: '#4977c8',
      teacherIds: []
    };
    return {
      method: 'FPS 轉數快',
      response: '',
      reason: ''
    };
  });
  const formRef = useRef(null);
  const put = (k, value) => {
    setV(x => ({
      ...x,
      [k]: value,
      ...(d.type === 'schedule' && ['studentIds', 'courseId'].includes(k) ? {teachers:{}, adjustments:{}, ...(!d.session ? {teacherId:''} : {})} : {}),
      ...(d.type==='schedule'&&['start','end','room'].includes(k)?{adjustments:Object.fromEntries(Object.entries(x.adjustments).map(([i,a])=>[i,Object.fromEntries(Object.entries(a).filter(([key])=>key!==k))]))}: {})
    }));
    setError('');
  };
  const save = (fn, text) => {
    setDb(fn);
    message.success(text);
    close();
  };
  const input = (key, type = 'text') => <Input required type={type} pattern={type === 'time' ? '([01][0-9]|2[0-3]):[0-5][0-9]' : undefined} placeholder={type === 'time' ? 'HH:mm' : undefined} value={v[key]} onInput={e => put(key, e.currentTarget.value)} onChange={e => put(key, e.target.value)} />;
  const modal = (title, body, onSubmit, ok = '儲存', width = 660, extraActions = null) => <Modal className={role === 'teacher' ? 'teacher-dialog' : undefined} open title={title} onCancel={close} width={width} footer={onSubmit ? <div className="modal-actions">{extraActions}<Button onClick={close}>取消</Button><Button type="primary" htmlType="submit" form="dialog-form" disabled={avatarBusy}>{ok}</Button></div> : <div className="modal-actions">{extraActions}<Button onClick={close}>關閉</Button></div>}><form ref={formRef} id="dialog-form" onSubmit={e => {
      e.preventDefault();
      setError('');
      if (!avatarBusy) onSubmit?.();
    }}>{body}{error && <Alert className="section" showIcon type="error" title={error} />}</form></Modal>;
  if (d.type === 'bill') return <BillingDialog {...{
    db,
    setDb,
    close,
    message,
    d,
    record
  }} />;
  if (d.type === 'invoice') return <InvoiceView invoice={db.invoices.find(i => i.id === d.invoice.id)} db={db} close={close} />;
  if (d.type === 'schedule') {
    const original = d.session || db.sessions.find(b => b.id === d.request?.sessionId);
    const splitting = !!d.request && original?.studentIds.some(id => !v.studentIds.includes(id));
    const remaining = splitting ? {
      ...original,
      studentIds: original.studentIds.filter(id => !v.studentIds.includes(id))
    } : null;
    const validationDb = v.scope === 'future' && original?.batchId ? {
      ...db,
      sessions: db.sessions.filter(b => !(b.batchId === original.batchId && b.status === 'scheduled' && b.date >= original.date))
    } : splitting ? {
      ...db,
      sessions: db.sessions.map(b => b.id === original.id ? remaining : b)
    } : db;
    const excluded = splitting ? undefined : original?.id;
    const scheduleReady = !!(v.courseId && v.studentIds.length && v.date && v.start && v.end);
    const drafts = Array.from({
      length: scheduleReady ? (v.days || 1) : 0
    }, (_, i) => ({
      id: !splitting && original?.id || `draft-${i}`,
      date: dateAdd(v.date, i * (v.repeat === 'weekly' ? 7 : 1)),
      start: v.adjustments[i]?.start || v.start,
      end: v.adjustments[i]?.end || v.end,
      courseId: v.courseId,
      studentIds: v.studentIds,
      teacherId: v.adjustments[i]?.teacherId || v.teachers[i] || v.teacherId || purchasedTeacher(db, v.studentIds, v.courseId),
      room: v.adjustments[i]?.room || v.room,
      status: 'scheduled',
      note: v.note,
      attendance: {}
    }));
    for (const b of drafts) {
      if (!b.teacherId) b.teacherId = db.teachers.find(t => !validateSessions(validationDb, [{
        ...b,
        teacherId: t.id
      }], excluded))?.id || '';
    }
    const checkingDrafts=scheduleReady&&v.scope==='future'&&original?seriesDrafts(db,original,drafts[0]):drafts.filter((b,i)=>!v.skipped.includes(i));
    const conflict = validateSessions(validationDb, checkingDrafts, excluded);
    const activeDrafts = drafts.filter((b, i) => !v.skipped.includes(i));
    const changedRequest = !!d.request && activeDrafts.some(b => b.courseId !== d.request.courseId || (d.request.timeMode === 'range' ? b.start < d.request.start || b.end > d.request.end || mins(b.end) - mins(b.start) !== Number(d.request.duration) : b.start !== d.request.start || b.end !== d.request.end) || !Array.from({
      length: d.request.days
    }, (_, i) => dateAdd(d.request.date, i)).includes(b.date));
    const confirmation = changedRequest ? v.confirmation === 'phone' ? 'phone' : 'propose' : v.confirmation;
    const submit = () => {
      if (!scheduleReady) return setError('請選擇學生、課程、日期及開始和結束時間');
      try {
        const next = v.scope === 'future' && original ? changeSeries(db, original, activeDrafts[0]) : commitSchedule(db, activeDrafts, {
          originalId: original?.id,
          requestId: d.request?.id,
          confirmation,
          omittedDates: d.request ? v.skipped.map(i => drafts[i].date) : []
        });
        setDb(next);
        message.success(confirmation === 'propose' ? '已提出方案，待家長確認' : '已儲存安排');
        close();
        setDate(v.date);
        nav('schedule');
      } catch (e) {
        setError(e.message);
      }
    };
    return modal(original ? '調整課堂安排' : d.request ? '安排預約需求' : '安排一堂課', <><div className="dialog-intro">{d.request ? d.request.note : '選學生與時間，再從可用的老師中安排。小組同行只限同一次課堂。'}</div>{splitting && <Alert type="info" title="只調整申請學生；同堂其他學生保留原老師及時間。" />}{original && <Alert type="info" title={`原安排：${original.date} ${original.start}–${original.end} · ${teacherName(db, original.teacherId)}`} />}<div className="form-grid"><div className="wide schedule-student-course-row"><Field label="學生 · 可多人同行"><Select mode="multiple" disabled={!!d.request || v.scope === 'future'} value={v.studentIds} onChange={x => put('studentIds', x)} options={options(db.students)} placeholder="選擇學生" /></Field><Field label="課程"><Select placeholder="選擇課程" disabled={v.scope === 'future'} value={v.courseId} onChange={x => put('courseId', x)} options={options(db.courses)} /></Field></div><div className="wide schedule-datetime-row"><Field label="開始日期">{input('date', 'date')}</Field><Field label="開始時間">{input('start', 'time')}</Field><Field label="結束時間">{input('end', 'time')}</Field></div><div className="wide schedule-repeat-row"><Field label="安排方式"><Select disabled={!!original || !!d.request} value={v.repeat} onChange={x => put('repeat', x)} options={[{
            value: 'daily',
            label: '單次 / 連續多日'
          }, {
            value: 'weekly',
            label: '每週同一時間'
          }]} /></Field><Field label={v.repeat === 'weekly' ? '安排週數' : '連續天數'}><InputNumber min={1} max={14} precision={0} disabled={!!original || !!d.request} value={v.days} onChange={x => put('days', x || 1)} /></Field></div></div>{original?.batchId && !d.request && <Field label="調整範圍"><Select value={v.scope} onChange={scope => setV(x => ({
          ...x,
          scope,
          studentIds: original.studentIds,
          courseId: original.courseId
        }))} options={[{
          value: 'one',
          label: '僅本次'
        }, {
          value: 'future',
          label: '本次及以後未上課的同系列'
        }]} /></Field>}{scheduleReady && v.scope === 'future' && <p>將更新 {seriesDrafts(db, original, drafts[0]).length} 堂課，保留各堂學生、課程及收費約定；任何衝突都不會儲存。</p>}
    <p className="muted">先選可用老師；多日安排可展開微調，或保留某天待安排。</p>{d.request?.timeMode === 'range' && <Button onClick={() => {
        const adjustments = {};
        drafts.forEach((b, i) => {
          const slot = suggestSlot(validationDb, b, d.request.start, d.request.end, Number(d.request.duration), excluded);
          if (slot) adjustments[i] = {
            start: slot.start,
            end: slot.end,
            teacherId: slot.teacherId,
            room: slot.room
          };
        });
        if(drafts.length===1&&adjustments[0]) {setV(x=>({...x,...adjustments[0],adjustments:{},teachers:{0:adjustments[0].teacherId}}));setError('');}
        else put('adjustments',adjustments);
        if(Object.keys(adjustments).length<drafts.length) setError('部分日期沒有合適空檔，可改時間或保留待安排');
      }}>在希望時段內尋找空檔</Button>}<div className="assign-list">{drafts.map((b, i) => <div key={i} className="assignment-day"><div><b>{dateLabel(b.date)}</b><small>{b.start}–{b.end}</small></div>{!original && drafts.length > 1 && <Checkbox checked={!v.skipped.includes(i)} onChange={e => put('skipped', e.target.checked ? v.skipped.filter(n => n !== i) : [...v.skipped, i])}>本次安排</Checkbox>}{drafts.length > 1 && <details className="day-adjust"><summary>調整當天時間</summary><div className="actions"><Input aria-label={`第 ${i + 1} 天開始時間`} type="time" value={b.start} onChange={e => put('adjustments', {
                ...v.adjustments,
                [i]: {
                  ...v.adjustments[i],
                  start: e.target.value
                }
              })} /><Input aria-label={`第 ${i + 1} 天結束時間`} type="time" value={b.end} onChange={e => put('adjustments', {
                ...v.adjustments,
                [i]: {
                  ...v.adjustments[i],
                  end: e.target.value
                }
              })} /></div></details>}<Select placeholder="為這天選老師" style={{
            width: 260
          }} value={b.teacherId || undefined} onChange={id => {
            put('teachers', {
              ...v.teachers,
              [i]: id
            });
            put('adjustments', {
              ...v.adjustments,
              [i]: {
                ...v.adjustments[i],
                teacherId: id
              }
            });
          }} options={db.teachers.map(t => {
            const reason = validateSessions(validationDb, [{
              ...b,
              teacherId: t.id
            }], excluded);
            return {
              value: t.id,
              label: `${t.name} · ${reason ? reason.split('：').slice(1).join('：') : '可安排'}`,
              disabled: !!reason
            };
          })} /></div>)}</div><Alert className="schedule-conflict-alert" showIcon type={!scheduleReady ? 'info' : conflict ? 'warning' : 'success'} title={!scheduleReady ? '請先選擇學生、課程、日期及時間，再安排老師。' : conflict || `本次 ${checkingDrafts.length} 堂，老師與學生均無衝突`} />{v.studentIds.some(id => db.students.find(s => s.id === id)?.mode === 'package' && db.students.find(s => s.id === id)?.balance < drafts.length) && <p className="warning-text">部分學生可用課時不足，請先購課再預約。</p>}{v.skipped.length > 0 && <Alert type="warning" title={d.request ? `餘下 ${v.skipped.length} 天會繼續保留為待安排需求` : `本次只建立選中的 ${activeDrafts.length} 堂，未選日期不建立課堂`} />} {changedRequest && <Field label="與原需求不同，如何確認"><Select value={confirmation} onChange={x => put('confirmation', x)} options={[{
          value: 'propose',
          label: '發給家長確認（暫不佔用時段）'
        }, {
          value: 'phone',
          label: '已電話 / 線下確認，直接安排'
        }]} /></Field>}</>, submit, original ? '確認調課' : '確認安排', 760);
  }
  if (d.type === 'session' || d.type === 'attendance') {
    const b = db.sessions.find(b => b.id === d.session.id);
    const locked = b.status === 'cancelled' || db.invoices.some(invoice => !invoice.voided && invoice.lines.some(line => line.sessionId === b.id));
    const attendanceValues = Object.fromEntries(b.studentIds.map(id => [id, v.attendance?.[id] ?? (['present', 'late'].includes(b.attendance?.[id]) ? 'present' : ['absent', 'leave'].includes(b.attendance?.[id]) ? 'absent' : undefined)]));
    const changed = b.studentIds.some(id => attendanceValues[id] !== (['present', 'late'].includes(b.attendance?.[id]) ? 'present' : ['absent', 'leave'].includes(b.attendance?.[id]) ? 'absent' : undefined));
    const attendanceNotes = Object.fromEntries(b.studentIds.map(id => [id, v.attendanceNotes?.[id] ?? b.attendanceNotes?.[id] ?? b.attendanceNote ?? '']));
    const noteChanged = b.studentIds.some(id => attendanceNotes[id] !== (b.attendanceNotes?.[id] ?? b.attendanceNote ?? ''));
    const submitAttendance = () => {
      try {
        setDb(saveSessionAttendance(db, b.id, attendanceValues, v.reason, undefined, attendanceNotes));
        message.success('已儲存考勤');
        put('attendance', attendanceValues);
      } catch (e) { setError(e.message); }
    };
    return modal(role === 'teacher' ? courseName(db, b.courseId) : '課堂詳情', <><div className="session-summary">{role === 'teacher' ? <div className="teacher-session-when"><span>{b.date}</span><span>{b.start}–{b.end}</span></div> : <><Status value={b.pendingConsumption ? 'pendingConsumption' : b.status} /><dl className="session-summary-fields"><div><dt>課程</dt><dd>{courseName(db, b.courseId)}</dd></div><div><dt>日期</dt><dd>{b.date}</dd></div><div><dt>時間</dt><dd>{b.start}–{b.end}</dd></div><div><dt>老師</dt><dd>{teacherName(db, b.teacherId)}</dd></div></dl></>}</div>
      <div className="session-roster-heading"><h3>學生列表 · {b.studentIds.length} 人</h3>{!locked && <Button onClick={() => put('attendance', Object.fromEntries(b.studentIds.map(id => [id, 'present'])))}>一鍵出勤</Button>}</div>
      <div className="session-students-table"><table><thead><tr><th scope="col">中文名</th><th scope="col">英文名</th><th scope="col">考勤狀態</th><th scope="col">考勤操作</th><th scope="col">考勤備註</th></tr></thead><tbody>{b.studentIds.map(id => {
        const student = db.students.find(s => s.id === id);
        const attendance = b.status === 'cancelled' ? '已取消' : ['absent', 'leave'].includes(b.attendance?.[id]) ? (b.absenceConfirmations?.[id] ? '缺勤 · 已確認課銷（不扣課時）' : '缺勤 · 待確認課銷（不扣課時）') : ['present', 'late'].includes(b.attendance?.[id]) ? (hasConfirmedConsumption(db,b.id,id) ? '出勤 · 已確認課銷' : '出勤 · 待確認課銷') : '待記錄';
        return <tr key={id}>{role === 'teacher' ? <td colSpan={2}><div className="teacher-student-identity"><b>{student?.name || '—'}</b><span>{student?.english || '—'}</span></div></td> : <><td>{student?.name || '—'}</td><td>{student?.english || '—'}</td></>}{(role !== 'teacher' || attendance !== '待記錄') && <td>{attendance}</td>}<td><Select className="session-attendance-select" aria-label={`${student?.name || id}考勤`} placeholder="選擇考勤" disabled={locked} value={attendanceValues[id]} onChange={value => put('attendance', {...attendanceValues, [id]: value})} options={[{value:'present',label:'出勤'},{value:'absent',label:'缺勤'}]} /></td><td className="session-attendance-note"><Input.TextArea aria-label={`${student?.name || id}考勤備註`} rows={1} disabled={locked} placeholder="考勤備註（選填）" value={attendanceNotes[id]} onChange={e => put('attendanceNotes', { ...attendanceNotes, [id]: e.target.value })} /></td></tr>;
      })}</tbody></table></div>
      {role === 'admin' && b.status === 'scheduled' && <Field label="增加學生 · 可多選"><div className="session-add-students"><Select mode="multiple" aria-label="增加學生" placeholder="選擇要加入本堂課的學生" value={v.addStudentIds || []} onChange={ids => put('addStudentIds', ids)} options={db.students.filter(s => !b.studentIds.includes(s.id)).map(s => ({ value: s.id, label: `${s.name} · ${s.english || ''} · ${s.grade}` }))} /><Button disabled={!v.addStudentIds?.length} onClick={() => {
        try { setDb(addSessionStudents(db, b.id, v.addStudentIds)); put('addStudentIds', []); message.success('學生已加入本堂課'); }
        catch (e) { setError(e.message); }
      }}>增加學生</Button></div></Field>}
      {!locked && b.status === 'completed' && changed && <Field label="更正原因"><Input.TextArea required value={v.reason} onChange={e => put('reason', e.target.value)} placeholder="請填寫更正考勤的原因" /></Field>}
      {!locked && b.pendingConsumption && <div className="session-consumption-confirm"><p>出勤已記錄，待授課老師 {teacherName(db, b.teacherId)} 確認課銷；缺勤不扣課時。</p><Popconfirm title={`確認由 ${teacherName(db, b.teacherId)} 核對並確認本堂課銷？`} onConfirm={() => {
        try { setDb(confirmSessionConsumption(db, b.id, role === 'teacher' ? teacherId : b.teacherId)); message.success('已確認課銷'); close(); }
        catch (e) { setError(e.message); }
      }}><Button type="primary" disabled={changed || noteChanged}>老師確認課銷</Button></Popconfirm>{(changed || noteChanged) && <small>請先儲存考勤變更，再確認課銷。</small>}</div>}
      {!locked && b.studentIds.filter(id => ['absent','leave'].includes(b.attendance?.[id]) && !b.absenceConfirmations?.[id]).map(id => <div className="session-consumption-confirm" key={id}><span>{studentName(db,id)} · 缺勤，不扣課時</span><Button disabled={changed} onClick={()=>{try {setDb(confirmStudentConsumption(db,b.id,id,role==='teacher'?teacherId:b.teacherId));message.success('缺勤課銷已確認，不扣課時');} catch(e) {setError(e.message);}}}>確認缺勤課銷</Button></div>)}
      {locked && b.status !== 'cancelled' && <p className="muted">此課堂已開單，請先處理相關單據再更正考勤。</p>}
      </>, locked ? undefined : submitAttendance, b.status === 'completed' ? '儲存考勤' : '確認考勤', 760, role === 'admin' && b.status !== 'cancelled' ? <Popconfirm title="刪除這堂課？" description="僅刪除此課堂；已扣課時會退回，操作記錄會保留。" okText="刪除課堂" cancelText="保留" onConfirm={() => {
        try { setDb(deleteSession(db, b.id)); message.success('課堂已刪除，已扣課時已退回'); close(); }
        catch (e) { setError(e.message); }
      }}><Button danger disabled={locked} className="session-delete-action">刪除課堂</Button></Popconfirm> : null);
  }
  if (d.type === 'correction') return modal('更正考勤', <><Alert type="info" title="原扣課會退回，課堂恢復待記錄；更正原因及流水會保留。已開單的課堂不能在此更正。" /><Field label="更正原因"><Input.TextArea required value={v.reason} onChange={e => put('reason', e.target.value)} placeholder="例如誤記出席，實際請假。" /></Field></>, () => {
    try {
      const next = reverseAttendance(db, d.session.id, v.reason);
      setDb(next);
      message.success('已退回原扣課，請重新記錄考勤');
      close();
    } catch (e) {
      setError(e.message);
    }
  }, '退回並重新記錄');
  if (d.type === 'availability') return modal('編輯可用時間 · ' + d.teacher.name, <><div className="dialog-intro">只有確認可授課的時間才能被安排。修改時會檢查未完成課堂，避免已排課堂失去可用時段。</div><h4>每週固定在崗</h4>{v.weekly.map((w, i) => <div className="availability-editor" key={i}><Checkbox.Group value={w.days} options={days.map((label, value) => ({
        label: '週' + label,
        value
      }))} onChange={x => put('weekly', v.weekly.map((r, j) => j === i ? {
        ...r,
        days: x
      } : r))} /><div className="actions"><Input required type="time" value={w.start} onChange={e => put('weekly', v.weekly.map((r, j) => j === i ? {
          ...r,
          start: e.target.value
        } : r))} /><span>至</span><Input required type="time" value={w.end} onChange={e => put('weekly', v.weekly.map((r, j) => j === i ? {
          ...r,
          end: e.target.value
        } : r))} /><Button aria-label="刪除固定時段" icon={<CloseOutlined />} onClick={() => put('weekly', v.weekly.filter((_, j) => j !== i))} /></div></div>)}<Button size="small" onClick={() => put('weekly', [...v.weekly, {
      days: [1, 2, 3, 4, 5],
      start: '10:00',
      end: '19:00'
    }])}>新增每週時段</Button><h4>指定日期 · 臨時加開 / 兼職確認</h4>{v.extra.map((w, i) => <div className="availability-editor actions" key={i}><Input required type="date" value={w.date} onChange={e => put('extra', v.extra.map((r, j) => j === i ? {
        ...r,
        date: e.target.value
      } : r))} /><Input required type="time" value={w.start} onChange={e => put('extra', v.extra.map((r, j) => j === i ? {
        ...r,
        start: e.target.value
      } : r))} /><Input required type="time" value={w.end} onChange={e => put('extra', v.extra.map((r, j) => j === i ? {
        ...r,
        end: e.target.value
      } : r))} /><Button aria-label="刪除指定時段" icon={<CloseOutlined />} onClick={() => put('extra', v.extra.filter((_, j) => j !== i))} /></div>)}<Button size="small" onClick={() => put('extra', [...v.extra, {
      date: todayHK(),
      start: '14:00',
      end: '18:00'
    }])}>新增指定日期</Button></>, () => {
    if ([...v.weekly, ...v.extra].some(w => mins(w.start) >= mins(w.end) || mins(w.start) < 600 || mins(w.end) > 1260) || v.weekly.some(w => !w.days.length)) return setError('請選擇星期和有效時段，演示開放時間為 10:00–21:00');
    const next = {
      ...d.teacher,
      ...v
    };
    const conflict = db.sessions.find(b => b.teacherId === next.id && b.status === 'scheduled' && !availability(next, b.date).some(w => mins(w.start) <= mins(b.start) && mins(w.end) >= mins(b.end)));
    if (conflict) return setError(`${conflict.date} ${conflict.start} 已有課堂，請先調課或保留可用時段`);
    save(old => ({
      ...old,
      teachers: old.teachers.map(t => t.id === next.id ? next : t),
      history: record(old, `更新 ${next.name} 可用時間`)
    }), '可用時間已更新');
  }, '儲存可用時間', 750);
  if (d.type === 'student') return modal(d.student ? '編輯學生' : '新增學生', <div className="form-grid"><Field label="中文姓名">{input('name')}</Field><Field label="英文姓名"><Input value={v.english} onChange={e => put('english', e.target.value)} /></Field><Field label="年級"><Select value={v.grade} onChange={x => put('grade', x)} options={['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3'].map(x => ({
        value: x,
        label: x
      }))} /></Field><Field label="家長姓名">{input('parent')}</Field><Field label="聯絡電話">{input('phone', 'tel')}</Field><Field label="學習需求 / 備註" wide><Input.TextArea value={v.notes} onChange={e => put('notes', e.target.value)} /></Field></div>, () => {
    if (!d.student) {
      return save(old => addStudent(old, v), '學生已儲存');
    }
    save(old => ({
      ...old,
      students: old.students.map(s => s.id === d.student.id ? {
        ...s, name: v.name, english: v.english, grade: v.grade,
        parent: v.parent, phone: v.phone, notes: v.notes
      } : s),
      history: record(old, `儲存學生 ${v.name}`)
    }), '學生資料已儲存');
  });
  if (d.type === 'teacher') return modal(d.teacher ? '編輯老師資料' : '新增老師', <div className="form-grid"><Field label="老師頭像" wide><TeacherAvatarEditor teacher={v} onChange={avatar => put('avatar', avatar)} busy={avatarBusy} onBusy={setAvatarBusy} /></Field><Field label="老師姓名">{input('name')}</Field><Field label="登入密碼"><Input.Password autoComplete="new-password" minLength={6} required={!d.teacher} value={v.password || ''} onChange={e => put('password', e.target.value)} placeholder={d.teacher ? '留空保留原密碼' : '至少 6 位'} /><small>老師使用姓名和此密碼登入；留空的既有帳號尚不能登入。</small></Field><Field label="英文稱呼"><Input value={v.english} onChange={e => put('english', e.target.value)} /></Field><Field label="聘用類型"><Select value={v.type} onChange={x => put('type', x)} options={[{
        value: 'full',
        label: '全職 · 每週固定在崗'
      }, {
        value: 'part',
        label: '兼職 · 按日期確認'
      }]} /></Field><Field label="可教年級"><Select mode="multiple" value={v.grades} onChange={x => put('grades', x)} options={['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3'].map(x => ({
        value: x,
        label: x
      }))} /></Field><Field label="可教課程" wide><Select mode="multiple" value={v.subjects} onChange={x => put('subjects', x)} options={options(db.courses)} /></Field><div className="wide"><Alert type="info" title="儲存後，請在老師卡片中設定可用時間，再安排課堂。" /></div></div>, async () => {
    if ((!d.teacher && !v.password) || (v.password && v.password.length < 6)) return setError('請設定至少 6 位的登入密碼');
    if (db.teachers.some(t => t.id !== d.teacher?.id && loginName(t.name) === loginName(v.name))) return setError('老師姓名已存在，請使用不同姓名以便登入');
    if (!v.name.trim() || !v.grades.length || !v.subjects.length) return setError('請填寫姓名、可教課程及年級');
    if (d.teacher && db.sessions.some(b => b.teacherId === d.teacher.id && b.status === 'scheduled' && (!v.subjects.includes(b.courseId) || b.studentIds.some(id => !v.grades.includes(db.students.find(s => s.id === id).grade))))) return setError('新設定與已安排課堂不符，請先調課');
    let credentials = {};
    if (v.password) {
      setAvatarBusy(true);
      try { const result = await hashTeacherPassword(v.password); credentials = {passwordHash:result.hash,passwordSalt:result.salt}; }
      catch { return setError('密碼儲存失敗，請重試'); } finally { setAvatarBusy(false); }
    }
    const {password, ...teacherValues} = v;
    save(old => ({
      ...old,
      teachers: d.teacher ? old.teachers.map(t => t.id === d.teacher.id ? {
        ...t,
        ...teacherValues,
        ...credentials,
        name: v.name.trim()
      } : t) : [...old.teachers, {
        ...teacherValues,
        ...credentials,
        name: v.name.trim(),
        id: uid()
      }],
      history: record(old, `儲存老師 ${v.name}`)
    }), '老師資料已儲存');
  });
  if (d.type === 'studentDetail') {
    const s = db.students.find(x => x.id === d.student.id);
    return modal('學生上課記錄', <StudentRecords db={db} student={s} />, null, '關閉', 800);
  }
  if (d.type === 'course') return modal(d.course ? '編輯課程' : '新增課程', <div className="form-grid"><Field label="課程名稱" wide>{input('name')}</Field><div className="wide"><p>按課堂時長設定價格 · HKD / 人 / 堂</p>{v.rates.map((rate, index) => <div className="course-rate-row" key={index}><Field label="時長（小時）"><InputNumber aria-label={`時長 ${index + 1}`} required min={0.25} step={0.25} value={rate.durationMinutes == null ? null : rate.durationMinutes / 60} onChange={value => put('rates', v.rates.map((r, i) => i === index ? { ...r, durationMinutes: value == null ? null : value * 60 } : r))} /></Field><Field label="每堂價格"><InputNumber aria-label={`價格 ${index + 1}`} required min={0} precision={2} placeholder="輸入價格" value={rate.price} onChange={value => put('rates', v.rates.map((r, i) => i === index ? { ...r, price: value } : r))} /></Field><Button disabled={v.rates.length === 1} onClick={() => put('rates', v.rates.filter((_, i) => i !== index))}>移除</Button></div>)}<Button onClick={() => put('rates', [...v.rates, { durationMinutes: null, price: null }])}>新增時長價格</Button></div><Field label="課程說明" wide><Input.TextArea required value={v.description} onChange={e => put('description', e.target.value)} /></Field></div>, () => {
    const validation = validateCourseRates(v.rates);
    if (validation) return setError(validation);
    if (!v.name.trim()) return setError('請填寫課程名稱');
    const id = d.course?.id || uid();
    const { teacherIds, ...values } = v;
    const rates = [...v.rates].sort((a, b) => a.durationMinutes - b.durationMinutes);
    const course = { ...values, id, name: v.name.trim(), rates, price: rates[0].price };
    save(old => ({ ...old,
      courses: d.course ? old.courses.map(c => c.id === id ? course : c) : [...old.courses, course],
      history: record(old, `儲存課程 ${v.name}`)
    }), '課程已儲存');
  });
  if (d.type === 'payment') return modal('登記收款', <><div className="dialog-intro">{d.invoice.no} · {studentName(db, d.invoice.studentId)}<h2>{money(d.invoice.total)}</h2>本次登記全額收款，產生對應收據。課包在確認收款後才加入餘額。</div><Field label="付款方式"><Select value={v.method} onChange={x => put('method', x)} options={['FPS 轉數快', '現金', '銀行轉帳', '信用卡', '支票'].map(x => ({
        value: x,
        label: x
      }))} /></Field></>, () => {
    try {
      setDb(registerPayment(db, d.invoice.id, v.method));
      message.success('已收款，購買課時已入帳');
      close();
    } catch (e) {
      setError(e.message);
    }
  }, '確認收到款項');
  return null;
}
function BillingDialog({
  db,
  setDb,
  close,
  message,
  d,
  record
}) {
  const [v, setV] = useState({
    studentId: d.studentId,
    source: 'package',
    courseId: undefined,
    teacherId: undefined,
    packageCount: null,
    unitPrice: null,
    durationMinutes: undefined,
    sessionIds: d.sessionIds || [],
    surcharge: 0,
    discountKind: 'fixed',
    discountValue: 0,
    method: 'FPS 轉數快',
    issuer: 'AC Education',
    remarks: ''
  });
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const put = (key, value) => {
    setV(x => ({
      ...x,
      [key]: value,
      ...(key === 'courseId' ? { unitPrice: null, durationMinutes: undefined, teacherId: undefined } : {}),
      ...(key === 'durationMinutes' ? { unitPrice: coursePrice(db.courses.find(c => c.id === x.courseId), value) } : {}),
      ...(key === 'studentId' || key === 'source' ? {
        sessionIds: [],
        teacherId: undefined
      } : {})
    }));
    setError('');
  };
  const lines = v.courseId && Number.isSafeInteger(v.packageCount) && v.packageCount > 0 && v.unitPrice != null ? [{
    courseId: v.courseId,
    description: `${courseName(db, v.courseId)} · ${v.packageCount} 堂`,
    quantity: v.packageCount,
    unitPrice: v.unitPrice,
    lessonDate: '', time: '', durationMinutes: v.durationMinutes, duration: `${v.durationMinutes / 60} 小時 · 按每次到課扣 1 堂`
  }] : [];
  const total = totals(lines, v.surcharge || 0, v.discountKind, v.discountValue || 0);
  const submit = () => {
    if (!db.students.some(s => s.id === v.studentId)) return setError('請選擇學生');
    if (v.source === 'package' && !db.courses.some(c => c.id === v.courseId)) return setError('請先選擇購買課程');
    if (v.source === 'package' && (!Number.isSafeInteger(v.packageCount) || v.packageCount < 1 || v.packageCount > 100)) return setError('請輸入 1–100 的整數購買堂數');
    if (!courseRates(db.courses.find(c => c.id === v.courseId)).some(r => r.durationMinutes === v.durationMinutes)) return setError('請選擇課堂時長');
    if (v.source === 'package' && (!Number.isFinite(v.unitPrice) || v.unitPrice < 0)) return setError('請填寫有效的每堂價格');
    const teacher = db.teachers.find(t => t.id === v.teacherId);
    const student = db.students.find(s => s.id === v.studentId);
    if (!teacher || !teacher.subjects.includes(v.courseId) || !teacher.grades.includes(student.grade)) return setError('請選擇可教授此課程及學生年級的老師');
    if (!lines.length) return setError('請先選擇已完成且尚未開單的課堂');
    if (total.total < 0) return setError('折扣不能高於小計加附加費');
    if (v.discountKind === 'percent' && (v.discountValue < 0 || v.discountValue > 100)) return setError('百分比折扣需為 0–100');
    if (!v.issuer.trim() || lines.some(l => !l.description.trim() || !l.quantity || l.unitPrice == null)) return setError('請填寫完整的單據明細和發行人');
    const serial = String(db.invoices.length + 1).padStart(3, '0');
    const invoice = {
      ...v,
      ...total,
      id: uid(),
      kind: 'receipt',
      no: `REC-${todayHK().replaceAll('-', '')}-${serial}`,
      receiptNo: `REC-${todayHK().replaceAll('-', '')}-${serial}`,
      date: todayHK(),
      paid: true,
      paidDate: todayHK(),
      lines: structuredClone(lines)
    };
    setDb(old => ({
      ...old,
      invoices: [invoice, ...old.invoices],
      students: old.students.map(s => s.id === v.studentId && v.source === 'package' ? {
        ...s,
        balance: s.balance + v.packageCount
      } : s),
      ledger: v.source === 'package' ? [...old.ledger, {
        id: uid(),
        studentId: v.studentId,
        invoiceId: invoice.id,
        date: todayHK(),
        delta: v.packageCount,
        type: '課包入帳',
        note: invoice.no
      }] : old.ledger,
      history: record(old, `開立 ${invoice.no} · ${money(total.total)}`)
    }));
    message.success('已開立收據並登記收款');
    close();
  };
  return <Modal open width={800} title="購課 / 續費" onCancel={close} footer={<div className="modal-actions"><span className="muted">確認代表已實際收到款項</span><Button onClick={close}>取消</Button><Button type="primary" htmlType="submit" form="billing-form">確認收款並開立收據</Button></div>}><form ref={formRef} id="billing-form" onSubmit={e => {
      e.preventDefault();
      submit();
    }}><div className="form-grid"><Field label="學生" wide><Select showSearch optionFilterProp="label" placeholder="選擇學生" value={v.studentId} onChange={x => put('studentId', x)} options={options(db.students)} /></Field><><Field label="購買課程" wide><Select aria-label="購買課程" placeholder="先選擇課程" value={v.courseId} onChange={x => put('courseId', x)} options={options(db.courses)} notFoundContent="請先新增課程" /></Field><Field label="授課老師" wide><Select aria-label="購課老師" placeholder="選擇老師" disabled={!v.courseId || !v.studentId} value={v.teacherId} onChange={x => put('teacherId', x)} options={options(db.teachers.filter(t => t.subjects.includes(v.courseId) && t.grades.includes(db.students.find(s => s.id === v.studentId)?.grade)))} notFoundContent="沒有符合課程及年級的老師" /><small>建立此學生的同課程課堂時預設此老師，排課時仍可修改。</small></Field><Field label="課堂時長"><Select aria-label="購課時長" disabled={!v.courseId} placeholder="選擇時長" value={v.durationMinutes} onChange={x => put('durationMinutes', x)} options={courseRates(db.courses.find(c => c.id === v.courseId)).map(r => ({value:r.durationMinutes,label:`${r.durationMinutes / 60} 小時 · ${money(r.price)}`}))} /></Field><Field label="購買堂數"><InputNumber aria-label="購買堂數" required disabled={!v.courseId} min={1} max={100} precision={0} placeholder="輸入購買堂數" value={v.packageCount} onChange={x => put('packageCount', x)} /></Field><Field label="每堂價格 · HKD"><InputNumber required disabled={!v.courseId} min={0} precision={2} value={v.unitPrice} onChange={x => put('unitPrice', x)} /></Field><div className="wide"><Alert type="info" title="登記收款後，購買的課時會加入學生剩餘課時。" /></div></></div><div className="bill-preview">{lines.map((l, i) => <div key={i}><span>{l.description}<small>{l.lessonDate} {l.time} · {l.quantity} × {money(l.unitPrice)}</small></span><b>{money(l.quantity * l.unitPrice)}</b></div>)}{!lines.length && <p className="muted">選擇課程並填寫堂數後，這裡會顯示單據明細。</p>}</div><Field label="付款方式"><Select value={v.method} onChange={x => put('method', x)} options={['FPS 轉數快', '現金', '銀行轉帳', '信用卡', '支票'].map(x => ({
          value: x,
          label: x
        }))} /></Field><details className="advanced-options"><summary>更多設定：折扣、附加費及備註</summary><div className="form-grid"><Field label="附加費 · HKD"><InputNumber min={0} precision={2} value={v.surcharge} onChange={x => put('surcharge', x || 0)} /></Field><Field label="折扣方式"><Select value={v.discountKind} onChange={x => put('discountKind', x)} options={[{
              value: 'fixed',
              label: '固定金額 · HKD'
            }, {
              value: 'percent',
              label: '百分比 · 按明細小計'
            }]} /></Field><Field label={v.discountKind === 'percent' ? '折扣百分比 %' : '折扣金額 · HKD'}><InputNumber min={0} max={v.discountKind === 'percent' ? 100 : undefined} precision={2} value={v.discountValue} onChange={x => put('discountValue', x || 0)} /></Field><Field label="發行人"><Input required value={v.issuer} onChange={e => put('issuer', e.target.value)} /></Field><Field label="備註"><Input value={v.remarks} onChange={e => put('remarks', e.target.value)} /></Field></div></details><div className="bill-total"><span>小計 {money(total.subtotal)} + 附加費 {money(total.surcharge)} − 折扣 {money(total.discount)}</span><b>{money(total.total)}</b></div>{error && <Alert type="error" title={error} showIcon />}</form></Modal>;
}
function InvoiceView({
  invoice: i,
  db,
  close
}) {
  const kinds = i.kind === 'both' ? ['invoice', 'receipt'] : [i.kind];
  return <Modal open width={800} title="單據預覽" onCancel={close} footer={<><Button onClick={close}>關閉</Button><Button icon={<PrinterOutlined />} type="primary" onClick={() => window.print()}>列印 / 另存 PDF</Button></>}>{i.voided && <Alert type="warning" title="此帳單已作廢，不可收款" />}{i.corrections?.map((c, n) => <p key={n}>{c.action === 'void' ? '作廢' : '撤銷誤收款'} · {c.reason}</p>)}<div className="print-documents">{kinds.map(kind => <article className="invoice-paper" key={kind}><div className="invoice-heading"><div><b>ac.</b><p>AC EDUCATION</p></div><div><h2>{i.voided ? 'VOID · 已作廢' : kind === 'invoice' ? 'INVOICE' : 'RECEIPT'}</h2><span>{kind === 'invoice' ? '帳單' : '收據'}</span></div></div><div className="invoice-meta"><div><small>BILL TO / 學生</small><h3>{studentName(db, i.studentId)}</h3><p>{db.students.find(s => s.id === i.studentId)?.parent}</p></div><div><p>單據編號　{kind === 'receipt' ? i.receiptNo : i.no}</p><p>發出日期　{kind === 'receipt' ? i.paidDate : i.date}</p><p>貨幣　HKD 港幣</p></div></div><table><thead><tr><th>課堂 / 項目</th><th>數量</th><th>單價</th><th>金額</th></tr></thead><tbody>{i.lines.map((l, n) => <tr key={n}><td><b>{l.description}</b><small>{l.lessonDate} {l.time}<br />{l.duration}</small></td><td>{l.quantity}</td><td>{money(l.unitPrice)}</td><td>{money(l.quantity * l.unitPrice)}</td></tr>)}</tbody></table><div className="invoice-totals"><p><span>小計</span>{money(i.subtotal)}</p><p><span>附加費</span>{money(i.surcharge)}</p><p><span>折扣</span>− {money(i.discount)}</p><h3><span>{kind === 'receipt' ? '已收金額' : '合計'}</span>{money(i.total)}</h3></div>{kind === 'receipt' && <p className="paid-stamp">已收款 · {i.method} · {i.paidDate}</p>}<p>備註：{i.remarks || '多謝支持 AC Education。'}</p><p>發行人：{i.issuer}</p><div className="invoice-foot">DEMO · 示範單據，非正式收費憑證</div></article>)}</div></Modal>;
}
function Root() {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) === 'zh-CN' ? 'zh-CN' : 'zh-HK';
    } catch {
      return 'zh-HK';
    }
  });
  setDisplayLanguage(language);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('AC Education · 教務工作室');
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {}
  }, [language]);
  return <ConfigProvider locale={language === 'zh-CN' ? zhCN : zhHK} theme={macTheme}><AntApp><Demo language={language} onLanguageChange={setLanguage} /></AntApp></ConfigProvider>;
}
createRoot(document.getElementById('root')).render(<Root />);
