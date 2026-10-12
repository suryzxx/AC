/** @jsx localizedElement */
import Input from './SystemInput';
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntApp, ConfigProvider, Button, InputNumber, Select, Tag, Modal, Empty, Segmented, Alert, Checkbox, Popconfirm } from 'antd';
import { CalendarOutlined, TeamOutlined, BookOutlined, FileTextOutlined, ClockCircleOutlined, PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined, SearchOutlined, AppstoreOutlined, SwapOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { saveSessionAttendance, addSessionStudents, upgradeDemoCalendar, upgradeDemoAvatars, upgradeDemoCourses, totalStudentLessons, usePurchasedLessonCredits, addStudentWithLessons, seed, upgradeDemoStudents, uid, dateAdd, todayHK, mins, money, availability, validateSessions, completeSession, totals, courseName, studentName, teacherName, billableLessons, reverseAttendance, normalizeDb, lessonCharge, pendingDeductions, registerPayment, settleCredits, commitSchedule, changeSeries, seriesDrafts, suggestSlot } from './model';
import 'antd/dist/reset.css';
import './style.css';
import './mac-theme.css';
import './native-layout.css';
import './glass-layout.css';
import './dialog-theme.css';
import { NativeLayoutContext, PageHeading, NativeSidebar, NativeToolbar, NativeRecordTable } from './NativeUI';
import { macTheme } from './themes';
import { OperationsDialog, operationTypes, WorkQueue, WeekView } from './Operations';
import Teachers from './Teachers';
import Dashboard from './Dashboard';
import TeacherAvatarEditor, { TeacherAvatar } from './TeacherAvatar';
import StudentRecords from './StudentRecords.jsx';
import zhCN from 'antd/locale/zh_CN';
import zhHK from 'antd/locale/zh_HK';
import { localizedElement, t, simplify, LANGUAGE_KEY, setDisplayLanguage } from './language';
const STORE = 'ac-flex-demo-v3';
const statusNames = {
  scheduled: '已安排',
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
      return upgradeDemoCalendar(usePurchasedLessonCredits(normalizeDb(upgradeDemoAvatars(upgradeDemoCourses(v?.version === 3 ? upgradeDemoStudents(v) : seed())))));
    } catch {
      return upgradeDemoCalendar(usePurchasedLessonCredits(normalizeDb(upgradeDemoAvatars(upgradeDemoCourses(seed())))));
    }
  });
  const role = 'admin';
  const teacherId = 't1';
  const [page, setPage] = useState('home'),
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
  const [attendanceFilter, setAttendanceFilter] = useState('pending');
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
  const visibleSessions = db.sessions;
  const visibleStudents = db.students;
  const current = visibleSessions.filter(b => b.date === date && b.status !== 'cancelled');
  const visibleInvoices = db.invoices;
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
    key: 'home',
    label: isAdmin ? '今日工作台' : role === 'teacher' ? '我的工作台' : '孩子的學習',
    icon: <AppstoreOutlined />
  }, {
    key: 'schedule',
    label: isAdmin ? '靈活排課' : '課堂安排',
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
    label: '考勤與課消',
    icon: <CheckOutlined />
  }] : []), ...(role !== 'teacher' ? [{
    key: 'billing',
    label: isAdmin ? '帳單與收款' : '我的單據',
    icon: <FileTextOutlined />
  }] : [])];
  const nav = k => {
    setPage(k);
    setSearch('');
    if (k === 'home') setDate(todayHK());
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
    render: (_, b) => <Status value={b.status} />
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
  if (page === 'dashboard') body = <Dashboard db={db} />;
  if (page === 'home') body = <>
    <PageHeading><div><h1>今日工作台</h1><p>{dateLabel(todayHK())} · 超級管理員</p></div><Button icon={<PlusOutlined />} onClick={() => openSchedule()}>安排課堂</Button></PageHeading>
    <div className="native-overview">{(isAdmin ? [[current.length,'今日課堂','schedule'],[visibleSessions.filter(b => b.status === 'scheduled' && b.date <= todayHK()).length,'待記錄課堂','attendance'],[db.students.filter(s => s.mode === 'package' && s.balance <= 2).length,'課時即將用完','students']] : role === 'teacher' ? [[current.length,'今日課堂','schedule'],[visibleStudents.length,'相關學生','students'],[visibleSessions.filter(b => b.status === 'scheduled' && b.date <= todayHK()).length,'待記錄課堂','attendance']] : [[db.students.find(s => s.id === parentId)?.balance || 0,'剩餘課時','students'],[visibleSessions.filter(b => b.status === 'scheduled').length,'已安排課堂','schedule'],[visibleSessions.filter(b => b.status === 'completed').length,'已完成課堂','attendance']]).map(([count,label,target]) => <button key={label} onClick={() => {nav(target); if (target === 'students' && isAdmin) setStudentFilter('low');}}><span>{label}</span><b>{count}</b><ArrowRightOutlined /></button>)}</div>
    <div className="native-home-workspace"><section className="native-agenda"><div className="native-section-bar"><h2>今日課堂</h2><Button size="small" type="text" onClick={() => nav('schedule')}>打開日曆 <ArrowRightOutlined /></Button></div>{current.length ? current.map(b => <button className="native-agenda-row" key={b.id} onClick={() => setDialog({type:'session',session:b})}><time>{b.start}<small>{b.end}</small></time><span><b>{courseName(db,b.courseId)}</b><small>{teacherName(db,b.teacherId)}</small></span><Status value={b.status} /><ArrowRightOutlined /></button>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="今天沒有已安排的課堂" />}<div className="native-agenda-foot">香港時間 · {todayHK()}</div></section>{isAdmin ? <WorkQueue db={db} setDialog={setDialog} onStudents={() => {nav('students');setStudentFilter('low');}} /> : <section className="native-upcoming"><div className="native-section-bar"><h2>課堂記錄</h2></div>{table(visibleSessions.filter(b => b.status !== 'cancelled'),sessionCols)}</section>}</div>
  </>;
  if (page === 'schedule') body = <><PageHeading><div><h1>{isAdmin ? '靈活排課' : '課堂安排'}</h1><p>先確認老師可用時間，再安排學生；自動檢查老師和學生衝突。</p></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => openSchedule()}>安排課堂</Button>}</PageHeading><Panel title={dateLabel(date)} extra={<div className="actions"><Segmented value={scheduleView} onChange={setScheduleView} options={[{
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
  if (page === 'students') body = <><PageHeading><div><h1>{role === 'parent' ? '孩子與課時' : '學生與課時'}</h1><p>管理年級、家長聯絡、課時餘額與每次扣課記錄。</p></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialog({
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
        title: '總課時',
        render: (_, s) => <b>{totalStudentLessons(db, s.id)} 堂</b>
      }, {
        title: '剩餘課時',
        render: (_, s) => <b className={s.balance <= 2 ? 'low-balance' : ''}>{s.balance} 堂</b>
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
  if (page === 'courses') body = <><PageHeading><div><h1>課程與收費</h1><p>課程是可約的教學內容，每次課堂可安排不同學生和老師。</p></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialog({
        type: 'course'
      })}>新增課程</Button>}</PageHeading><div className="teacher-cards">{db.courses.map(c => <Panel key={c.id} title={c.name}><p className="muted">{c.description}</p><div className="course-price">{money(c.price)} <small>/ 人 / 堂</small></div><p className="muted">可授課 · {db.teachers.filter(t => t.subjects.includes(c.id)).map(t => t.name).join('、') || '待設定老師'}</p>{isAdmin ? <Button className="card-action button-soft" onClick={() => setDialog({
          type: 'course',
          course: c
        })}>編輯課程與單價</Button> : null}</Panel>)}</div></>;
  if (page === 'attendance') body = <><PageHeading><div><h1>考勤與課消</h1><p>按學生記錄出勤，一次確認完成課堂，課時記錄同步更新。</p></div></PageHeading><Alert showIcon type="info" title="出席 / 遲到扣 1 節，請假 / 缺席不扣課。剩餘課時不足會記為待補扣，購買課時並登記收款後自動補扣。" /><Panel title="課堂考勤" className="section" extra={<Segmented value={attendanceFilter} onChange={setAttendanceFilter} options={[{
      value: 'pending',
      label: '待記錄'
    }, {
      value: 'completed',
      label: '已完成'
    }, {
      value: 'all',
      label: '全部課堂'
    }]} />}>{table(visibleSessions.filter(b => b.status !== 'cancelled' && (attendanceFilter === 'all' || (attendanceFilter === 'pending' ? b.status === 'scheduled' : b.status === 'completed'))), [{
        title: '課堂',
        render: (_, b) => <><b>{b.date} · {b.start}–{b.end}</b><small>{courseName(db, b.courseId)} · {teacherName(db, b.teacherId)}</small></>
      }, {
        title: '學生',
        render: (_, b) => b.studentIds.filter(s => role !== 'parent' || s === parentId).map(s => studentName(db, s)).join('、')
      }, {
        title: '狀態',
        render: (_, b) => <Status value={b.status} />
      }, {
        title: '操作',
        render: (_, b) => <Button type={b.status === 'scheduled' ? 'primary' : 'default'} onClick={() => setDialog({
          type: b.status === 'completed' ? 'session' : 'attendance',
          session: b
        })}>{b.status === 'completed' ? '查看課消' : '記錄與確認'}</Button>
      }])}</Panel><Panel title="課時流水" className="section">{table(db.ledger.filter(l => visibleStudents.some(s => s.id === l.studentId)), [{
        title: '日期',
        dataIndex: 'date'
      }, {
        title: '學生',
        render: (_, l) => studentName(db, l.studentId)
      }, {
        title: '類型',
        render: (_, l) => <>{l.type}{l.reversed && <Tag>已沖回</Tag>}{l.settled && <Tag>已補扣</Tag>}</>
      }, {
        title: '變動',
        render: (_, l) => <b>{l.delta > 0 ? '+' : ''}{l.delta} 堂</b>
      }, {
        title: '說明',
        dataIndex: 'note'
      }])}</Panel></>;
  if (page === 'billing') body = <><PageHeading><div><h1>{isAdmin ? '帳單與收款' : '我的單據'}</h1><p>選擇收費項目，再確認是否收到款項；系統產生相應帳單與收據。</p></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialog({
        type: 'bill'
      })}>開立單據</Button>}</PageHeading>{isAdmin && billableLessons(db).length > 0 && <div className="billing-callout"><FileTextOutlined /><div><b>{billableLessons(db).length} 堂歷史課堂待開單</b><p>從已到課記錄帶入課堂日期、時段和收費，避免遺漏。</p></div><Button onClick={() => setDialog({
        type: 'bill',
        source: 'lesson'
      })}>從課堂開單</Button></div>}{isAdmin && billableLessons(db).length > 0 && <Panel title="待開單課堂" className="section">{table(billableLessons(db), [{
        title: '學生',
        render: (_, l) => studentName(db, l.studentId)
      }, {
        title: '已完成課堂',
        render: (_, l) => `${l.date} ${l.start} · ${courseName(db, l.courseId)}`
      }, {
        title: '操作',
        render: (_, l) => <Button type="primary" size="small" onClick={() => setDialog({
          type: 'bill',
          source: 'lesson',
          studentId: l.studentId,
          sessionIds: [l.sessionId]
        })}>為這堂課開單</Button>
      }])}</Panel>}<Panel title="單據記錄" className="section">{table(visibleInvoices, [{
        title: '單據編號',
        render: (_, i) => <><b>{i.no}</b><small>{i.kind === 'both' ? 'Invoice + Receipt' : i.kind === 'invoice' ? 'Invoice' : 'Receipt'} · {i.date}</small></>
      }, {
        title: '學生',
        render: (_, i) => studentName(db, i.studentId)
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
      }])}</Panel></>;
  return <NativeLayoutContext.Provider value={{host:toolbarHost}}><div data-page={page} className="app native-app"><NativeSidebar menu={menu} page={page} nav={nav} roleLabel="超級管理員" /><main><NativeToolbar setHost={setToolbarHost} preferences={<><Select className="language-select" data-language-names="true" aria-label="简繁切换" value={language} onChange={onLanguageChange} options={[{
            value: 'zh-CN',
            label: '简体中文'
          }, {
            value: 'zh-HK',
            label: '繁體中文'
          }]} style={{
            width: 115
          }} /></>} /><div className="content" ref={contentRef}>{storageError && <Alert type="warning" title="瀏覽器儲存空間不足，本次變更暫未保存；請勿重新整理。" />}{body}<footer>AC Education · 少一點行政，多一點教學 <span>香港時間 · HKD</span></footer></div></main>{dialog && (operationTypes.includes(dialog.type) ? <OperationsDialog key={dialog.type + (dialog.studentId || dialog.invoice?.id || dialog.request?.id || dialog.session?.id || '')} dialog={dialog} db={db} setDb={setDb} close={() => setDialog(null)} role={role} message={message} /> : <Dialogs key={dialog.type + (dialog.session?.id || dialog.teacher?.id || '')} dialog={dialog} close={() => setDialog(null)} db={db} setDb={setDb} setDialog={setDialog} role={role} teacherId={teacherId} parentId={parentId} date={date} setDate={setDate} nav={nav} message={message} record={record} />)}</div></NativeLayoutContext.Provider>;
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
        courseId: b?.courseId || r?.courseId || 'c1',
        studentIds: b?.studentIds || (r ? [r.studentId] : []),
        date: b?.date || r?.date || date,
        start: b?.start || r?.start || '15:00',
        end: b?.end || r?.end || '16:00',
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
    if (d.type === 'attendance') return {
      attendance: Object.fromEntries(d.session.studentIds.map(id => [id, 'present'])),
      note: d.session.note || ''
    };
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
      purchasedLessons: 0,
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
      ...d.course
    } : {
      name: '',
      price: 280,
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
  const modal = (title, body, onSubmit, ok = '儲存', width = 660) => <Modal open title={title} onCancel={close} width={width} footer={onSubmit ? <div className="modal-actions"><Button onClick={close}>取消</Button><Button type="primary" htmlType="submit" form="dialog-form" disabled={avatarBusy}>{ok}</Button></div> : <Button onClick={close}>關閉</Button>}><form ref={formRef} id="dialog-form" onSubmit={e => {
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
    const drafts = Array.from({
      length: v.days || 1
    }, (_, i) => ({
      id: !splitting && original?.id || `draft-${i}`,
      date: dateAdd(v.date, i * (v.repeat === 'weekly' ? 7 : 1)),
      start: v.adjustments[i]?.start || v.start,
      end: v.adjustments[i]?.end || v.end,
      courseId: v.courseId,
      studentIds: v.studentIds,
      teacherId: v.adjustments[i]?.teacherId || v.teachers[i] || v.teacherId,
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
    const checkingDrafts=v.scope==='future'&&original?seriesDrafts(db,original,drafts[0]):drafts.filter((b,i)=>!v.skipped.includes(i));
    const conflict = validateSessions(validationDb, checkingDrafts, excluded);
    const activeDrafts = drafts.filter((b, i) => !v.skipped.includes(i));
    const changedRequest = !!d.request && activeDrafts.some(b => b.courseId !== d.request.courseId || (d.request.timeMode === 'range' ? b.start < d.request.start || b.end > d.request.end || mins(b.end) - mins(b.start) !== Number(d.request.duration) : b.start !== d.request.start || b.end !== d.request.end) || !Array.from({
      length: d.request.days
    }, (_, i) => dateAdd(d.request.date, i)).includes(b.date));
    const confirmation = changedRequest ? v.confirmation === 'phone' ? 'phone' : 'propose' : v.confirmation;
    const submit = () => {
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
    return modal(original ? '調整課堂安排' : d.request ? '安排預約需求' : '安排一堂課', <><div className="dialog-intro">{d.request ? d.request.note : '選學生與時間，再從可用的老師中安排。小組同行只限同一次課堂。'}</div>{splitting && <Alert type="info" title="只調整申請學生；同堂其他學生保留原老師及時間。" />}{original && <Alert type="info" title={`原安排：${original.date} ${original.start}–${original.end} · ${teacherName(db, original.teacherId)}`} />}<div className="form-grid"><Field label="學生 · 可多人同行" wide><Select mode="multiple" disabled={!!d.request || v.scope === 'future'} value={v.studentIds} onChange={x => put('studentIds', x)} options={options(db.students)} placeholder="選擇學生" /></Field><Field label="課程" wide><Select disabled={v.scope === 'future'} value={v.courseId} onChange={x => put('courseId', x)} options={options(db.courses)} /></Field><Field label="開始日期">{input('date', 'date')}</Field><Field label="安排方式"><Select disabled={!!original || !!d.request} value={v.repeat} onChange={x => put('repeat', x)} options={[{
            value: 'daily',
            label: '單次 / 連續多日'
          }, {
            value: 'weekly',
            label: '每週同一時間'
          }]} /></Field><Field label="開始時間">{input('start', 'time')}</Field><Field label="結束時間">{input('end', 'time')}</Field><Field label={v.repeat === 'weekly' ? '安排週數' : '連續天數'}><InputNumber min={1} max={14} precision={0} disabled={!!original || !!d.request} value={v.days} onChange={x => put('days', x || 1)} /></Field></div>{original?.batchId && !d.request && <Field label="調整範圍"><Select value={v.scope} onChange={scope => setV(x => ({
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
        }]} /></Field>}{v.scope === 'future' && <p>將更新 {seriesDrafts(db, original, drafts[0]).length} 堂課，保留各堂學生、課程及收費約定；任何衝突都不會儲存。</p>}
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
          })} /></div>)}</div><Alert className="schedule-conflict-alert" showIcon type={conflict ? 'warning' : 'success'} title={conflict || `本次 ${checkingDrafts.length} 堂，老師與學生均無衝突`} />{v.studentIds.some(id => db.students.find(s => s.id === id)?.mode === 'package' && db.students.find(s => s.id === id)?.balance < drafts.length) && <p className="warning-text">部分學生課時不足以覆蓋這次安排，請在上課前續購；此處不預扣課時。</p>}{v.skipped.length > 0 && <Alert type="warning" title={d.request ? `餘下 ${v.skipped.length} 天會繼續保留為待安排需求` : `本次只建立選中的 ${activeDrafts.length} 堂，未選日期不建立課堂`} />} {changedRequest && <Field label="與原需求不同，如何確認"><Select value={confirmation} onChange={x => put('confirmation', x)} options={[{
          value: 'propose',
          label: '發給家長確認（暫不佔用時段）'
        }, {
          value: 'phone',
          label: '已電話 / 線下確認，直接安排'
        }]} /></Field>}<Field label="安排備註"><Input.TextArea rows={2} value={v.note} onChange={e => put('note', e.target.value)} /></Field></>, submit, original ? '確認調課' : '確認安排', 760);
  }
  if (d.type === 'session') {
    const b = db.sessions.find(b => b.id === d.session.id);
    const locked = b.status === 'cancelled' || db.invoices.some(invoice => !invoice.voided && invoice.lines.some(line => line.sessionId === b.id));
    const attendanceValues = Object.fromEntries(b.studentIds.map(id => [id, v.attendance?.[id] ?? b.attendance?.[id]]));
    const changed = b.studentIds.some(id => attendanceValues[id] !== b.attendance?.[id]);
    const submitAttendance = () => {
      try {
        setDb(saveSessionAttendance(db, b.id, attendanceValues, v.reason));
        message.success('已儲存考勤與課消');
        close();
      } catch (e) { setError(e.message); }
    };
    return modal('課堂詳情', <><div className="session-summary"><Status value={b.status} /><dl className="session-summary-fields"><div><dt>課程</dt><dd>{courseName(db, b.courseId)}</dd></div><div><dt>日期</dt><dd>{b.date}</dd></div><div><dt>時間</dt><dd>{b.start}–{b.end}</dd></div><div><dt>老師</dt><dd>{teacherName(db, b.teacherId)}</dd></div></dl></div>
      <div className="session-roster-heading"><h3>學生列表 · {b.studentIds.length} 人</h3>{!locked && <Button onClick={() => put('attendance', Object.fromEntries(b.studentIds.map(id => [id, 'present'])))}>一鍵出勤</Button>}</div>
      <div className="session-students-table"><table><thead><tr><th scope="col">中文名</th><th scope="col">英文名</th><th scope="col">考勤狀態</th><th scope="col">考勤操作</th></tr></thead><tbody>{b.studentIds.map(id => {
        const student = db.students.find(s => s.id === id);
        const attendance = pendingDeductions(db).some(l => l.sessionId === b.id && l.studentId === id) ? '已到課 · 待補扣' : b.status === 'completed' ? { present: '出席', late: '遲到', leave: '請假', absent: '缺席' }[b.attendance?.[id]] || '未記錄' : b.status === 'cancelled' ? '已取消' : '待記錄';
        return <tr key={id}><td>{student?.name || '—'}</td><td>{student?.english || '—'}</td><td>{attendance}</td><td><Select className="session-attendance-select" aria-label={`${student?.name || id}考勤`} placeholder="選擇考勤" disabled={locked} value={attendanceValues[id]} onChange={value => put('attendance', {...attendanceValues, [id]: value})} options={[{value:'present',label:'出席'},{value:'late',label:'遲到'},{value:'leave',label:'請假'},{value:'absent',label:'缺席'}]} /></td></tr>;
      })}</tbody></table></div>
      {b.status === 'scheduled' && <Field label="增加學生 · 可多選"><div className="session-add-students"><Select mode="multiple" aria-label="增加學生" placeholder="選擇要加入本堂課的學生" value={v.addStudentIds || []} onChange={ids => put('addStudentIds', ids)} options={db.students.filter(s => !b.studentIds.includes(s.id)).map(s => ({ value: s.id, label: `${s.name} · ${s.english || ''} · ${s.grade}` }))} /><Button disabled={!v.addStudentIds?.length} onClick={() => {
        try { setDb(addSessionStudents(db, b.id, v.addStudentIds)); put('addStudentIds', []); message.success('學生已加入本堂課'); }
        catch (e) { setError(e.message); }
      }}>增加學生</Button></div></Field>}
      {!locked && b.status === 'completed' && changed && <Field label="更正原因"><Input.TextArea required value={v.reason} onChange={e => put('reason', e.target.value)} placeholder="請填寫更正考勤的原因" /></Field>}
      {locked && b.status !== 'cancelled' && <p className="muted">此課堂已開單，請先處理相關單據再更正考勤。</p>}
      </>, locked ? undefined : submitAttendance, b.status === 'completed' ? '儲存考勤' : '確認考勤', 760);
  }
  if (d.type === 'attendance') return modal('考勤 · 學生列表', <><div className="dialog-intro">{d.session.date} · {d.session.start}–{d.session.end} · {courseName(db, d.session.courseId)}</div><div className="attendance-list">{d.session.studentIds.map(id => {
        const student = db.students.find(x => x.id === id);
        const s = {
          ...student,
          mode: lessonCharge(db, d.session, id).mode
        };
        return <div key={id}><div><b>{s.name}</b><small>{s.mode === 'package' ? `剩餘 ${s.balance} 堂` : '按次付費 · 到課後待開單'}</small></div><Select style={{
            width: 200
          }} value={v.attendance[id]} onChange={x => put('attendance', {
            ...v.attendance,
            [id]: x
          })} options={[{
            value: 'present',
            label: '出席 · 扣 1 堂'
          }, {
            value: 'late',
            label: '遲到 · 扣 1 堂'
          }, {
            value: 'leave',
            label: '請假 · 不扣課'
          }, {
            value: 'absent',
            label: '缺席 · 不扣課'
          }].map(o => s.mode === 'single' ? {
            ...o,
            label: o.label.replace('扣 1 堂', '待開單')
          } : o)} /></div>;
      })}</div><Field label="課後記錄"><Input.TextArea rows={3} value={v.note} onChange={e => put('note', e.target.value)} placeholder="今日學習內容、回家練習..." /></Field><Alert type="info" showIcon title="確認後完成本次課堂並記入課時流水；相同課堂不能重複扣課。" /></>, () => {
    try {
      const next = completeSession(db, d.session.id, v.attendance, v.note);
      setDb(next);
      message.success('已完成考勤與課消');
      close();
    } catch (e) {
      setError(e.message);
    }
  }, '確認完成課堂');
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
      }))} /></Field>{!d.student && <Field label="已購買課時"><InputNumber aria-label="已購買課時" required min={0} precision={0} value={v.purchasedLessons} onChange={x => put('purchasedLessons', x)} addonAfter={t('節')} /><small>填寫已購買、尚未使用的節數，完成考勤後扣減。</small></Field>}<Field label="家長姓名">{input('parent')}</Field><Field label="聯絡電話">{input('phone', 'tel')}</Field><Field label="學習需求 / 備註" wide><Input.TextArea value={v.notes} onChange={e => put('notes', e.target.value)} /></Field></div>, () => {
    if (!d.student) {
      if (!Number.isSafeInteger(v.purchasedLessons) || v.purchasedLessons < 0) return setError('請輸入 0 或以上的整數課時');
      return save(old => addStudentWithLessons(old, v, v.purchasedLessons), '學生及已購買課時已儲存');
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
  if (d.type === 'teacher') return modal(d.teacher ? '編輯老師資料' : '新增老師', <div className="form-grid"><Field label="老師頭像" wide><TeacherAvatarEditor teacher={v} onChange={avatar => put('avatar', avatar)} busy={avatarBusy} onBusy={setAvatarBusy} /></Field><Field label="老師姓名">{input('name')}</Field><Field label="英文稱呼"><Input value={v.english} onChange={e => put('english', e.target.value)} /></Field><Field label="聘用類型"><Select value={v.type} onChange={x => put('type', x)} options={[{
        value: 'full',
        label: '全職 · 每週固定在崗'
      }, {
        value: 'part',
        label: '兼職 · 按日期確認'
      }]} /></Field><Field label="可教年級"><Select mode="multiple" value={v.grades} onChange={x => put('grades', x)} options={['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3'].map(x => ({
        value: x,
        label: x
      }))} /></Field><Field label="可教課程" wide><Select mode="multiple" value={v.subjects} onChange={x => put('subjects', x)} options={options(db.courses)} /></Field><div className="wide"><Alert type="info" title="儲存後，請在老師卡片中設定可用時間，再安排課堂。" /></div></div>, () => {
    if (!v.name.trim() || !v.grades.length || !v.subjects.length) return setError('請填寫姓名、可教課程及年級');
    if (d.teacher && db.sessions.some(b => b.teacherId === d.teacher.id && b.status === 'scheduled' && (!v.subjects.includes(b.courseId) || b.studentIds.some(id => !v.grades.includes(db.students.find(s => s.id === id).grade))))) return setError('新設定與已安排課堂不符，請先調課');
    save(old => ({
      ...old,
      teachers: d.teacher ? old.teachers.map(t => t.id === d.teacher.id ? {
        ...t,
        ...v
      } : t) : [...old.teachers, {
        ...v,
        id: uid()
      }],
      history: record(old, `儲存老師 ${v.name}`)
    }), '老師資料已儲存');
  });
  if (d.type === 'studentDetail') {
    const s = db.students.find(x => x.id === d.student.id);
    return modal('學生上課記錄', <StudentRecords db={db} student={s} />, null, '關閉', 800);
  }
  if (d.type === 'course') return modal(d.course ? '編輯課程' : '新增課程', <div className="form-grid"><Field label="課程名稱" wide>{input('name')}</Field><Field label="每人每堂價格 · HKD" wide><InputNumber required min={0} precision={2} value={v.price} onChange={x => put('price', x)} /></Field><Field label="課程說明" wide><Input.TextArea required value={v.description} onChange={e => put('description', e.target.value)} /></Field><Field label="可授課老師" wide><Select mode="multiple" value={v.teacherIds || db.teachers.filter(t => t.subjects.includes(d.course?.id)).map(t => t.id)} onChange={x => put('teacherIds', x)} options={options(db.teachers)} /></Field></div>, () => {
    if (v.price == null) return setError('請填寫單價');
    const id = d.course?.id || uid(),
      teacherIds = v.teacherIds || db.teachers.filter(t => t.subjects.includes(id)).map(t => t.id);
    if (!teacherIds.length) return setError('請至少選擇一位可授課老師');
    if (db.sessions.some(b => b.courseId === id && b.status === 'scheduled' && !teacherIds.includes(b.teacherId))) return setError('新設定與已安排課堂衝突，請先調整課堂');
    save(old => ({
      ...old,
      courses: d.course ? old.courses.map(c => c.id === id ? {
        ...v,
        id
      } : c) : [...old.courses, {
        ...v,
        id
      }],
      teachers: old.teachers.map(t => ({
        ...t,
        subjects: [...t.subjects.filter(c => c !== id), ...(teacherIds.includes(t.id) ? [id] : [])]
      })),
      history: record(old, `儲存課程 ${v.name}`)
    }), '課程已儲存');
  });
  if (d.type === 'payment') return modal('登記收款', <><div className="dialog-intro">{d.invoice.no} · {studentName(db, d.invoice.studentId)}<h2>{money(d.invoice.total)}</h2>本次登記全額收款，產生對應收據。課包在確認收款後才加入餘額。</div><Field label="付款方式"><Select value={v.method} onChange={x => put('method', x)} options={['FPS 轉數快', '現金', '銀行轉帳', '信用卡', '支票'].map(x => ({
        value: x,
        label: x
      }))} /></Field></>, () => {
    try {
      setDb(registerPayment(db, d.invoice.id, v.method));
      message.success('已收款，課包已入帳並補扣待處理課時');
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
    studentId: d.studentId || db.students[0]?.id,
    source: d.source === 'lesson' ? 'lesson' : 'package',
    kind: 'invoice',
    courseId: undefined,
    packageCount: null,
    unitPrice: null,
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
      ...(key === 'courseId' ? { unitPrice: db.courses.find(c => c.id === value)?.price ?? null } : {}),
      ...(key === 'studentId' || key === 'source' ? {
        sessionIds: []
      } : {})
    }));
    setError('');
  };
  const eligible = db.sessions.filter(b => b.status === 'completed' && b.studentIds.includes(v.studentId) && ['present', 'late'].includes(b.attendance[v.studentId]) && lessonCharge(db, b, v.studentId).mode === 'single' && !db.invoices.some(i => !i.voided && i.studentId === v.studentId && i.lines.some(l => l.sessionId === b.id)));
  const lines = v.source === 'lesson' ? eligible.filter(b => v.sessionIds.includes(b.id)).map(b => ({
    sessionId: b.id,
    description: courseName(db, b.courseId),
    lessonDate: b.date,
    time: `${b.start}–${b.end}`,
    duration: `${mins(b.end) - mins(b.start)} 分鐘`,
    quantity: 1,
    unitPrice: lessonCharge(db, b, v.studentId).unitPrice
  })) : v.courseId && Number.isSafeInteger(v.packageCount) && v.packageCount > 0 && v.unitPrice != null ? [{
    courseId: v.courseId,
    description: `${courseName(db, v.courseId)} · ${v.packageCount} 堂`,
    quantity: v.packageCount,
    unitPrice: v.unitPrice,
    lessonDate: '', time: '', duration: '按每次到課扣 1 堂'
  }] : [];
  const total = totals(lines, v.surcharge || 0, v.discountKind, v.discountValue || 0);
  const submit = () => {
    if (!db.students.some(s => s.id === v.studentId)) return setError('請選擇學生');
    if (v.source === 'package' && !db.courses.some(c => c.id === v.courseId)) return setError('請先選擇購買課程');
    if (v.source === 'package' && (!Number.isSafeInteger(v.packageCount) || v.packageCount < 1 || v.packageCount > 100)) return setError('請輸入 1–100 的整數購買堂數');
    if (v.source === 'package' && (!Number.isFinite(v.unitPrice) || v.unitPrice < 0)) return setError('請填寫有效的每堂價格');
    if (!lines.length) return setError('請先選擇已完成且尚未開單的課堂');
    if (total.total < 0) return setError('折扣不能高於小計加附加費');
    if (v.discountKind === 'percent' && (v.discountValue < 0 || v.discountValue > 100)) return setError('百分比折扣需為 0–100');
    if (!v.issuer.trim() || lines.some(l => !l.description.trim() || !l.quantity || l.unitPrice == null)) return setError('請填寫完整的單據明細和發行人');
    const paid = v.kind !== 'invoice';
    const serial = String(db.invoices.length + 1).padStart(3, '0');
    const prefix = v.kind === 'receipt' ? 'REC' : 'INV';
    const invoice = {
      ...v,
      ...total,
      id: uid(),
      no: `${prefix}-${todayHK().replaceAll('-', '')}-${serial}`,
      receiptNo: `REC-${todayHK().replaceAll('-', '')}-${serial}`,
      date: todayHK(),
      paid,
      paidDate: paid ? todayHK() : null,
      lines: structuredClone(lines)
    };
    setDb(old => settleCredits({
      ...old,
      invoices: [invoice, ...old.invoices],
      students: old.students.map(s => s.id === v.studentId && paid && v.source === 'package' ? {
        ...s,
        balance: s.balance + v.packageCount
      } : s),
      ledger: paid && v.source === 'package' ? [...old.ledger, {
        id: uid(),
        studentId: v.studentId,
        date: todayHK(),
        delta: v.packageCount,
        type: '課包入帳',
        note: invoice.no
      }] : old.ledger,
      history: record(old, `開立 ${invoice.no} · ${money(total.total)}`)
    }, v.studentId));
    message.success(paid ? '已開立單據並登記收款' : '帳單已開立，等待收款');
    close();
  };
  return <Modal open width={800} title="登記收費" onCancel={close} footer={<div className="modal-actions"><span className="muted">{v.kind === 'invoice' ? '只開帳單，尚未收款' : '確認代表已實際收到款項'}</span><Button onClick={close}>取消</Button><Button type="primary" htmlType="submit" form="billing-form">{v.kind === 'invoice' ? '開立帳單' : '確認收款並開立'}</Button></div>}><form ref={formRef} id="billing-form" onSubmit={e => {
      e.preventDefault();
      submit();
    }}><div className="form-grid"><Field label="學生"><Select value={v.studentId} onChange={x => put('studentId', x)} options={options(db.students)} /></Field><Field label="款項收到了嗎？"><Select value={v.kind} onChange={x => put('kind', x)} options={[{
            value: 'invoice',
            label: '尚未收到，先開帳單'
          }, {
            value: 'both',
            label: '已收到，開帳單及收據'
          }]} /></Field>{v.source === 'lesson' ? <Field label="選擇已到課的按次付費記錄" wide><Select mode="multiple" placeholder="先完成考勤，再選擇待開單課堂" value={v.sessionIds} onChange={x => put('sessionIds', x)} options={eligible.map(b => ({
            value: b.id,
            label: `${b.date} ${b.start} · ${courseName(db, b.courseId)} · ${money(lessonCharge(db, b, v.studentId).unitPrice)}`
          }))} />{!eligible.length && <small>此學生沒有待開單的按次課堂。課包學生的到課只扣課時，不重複收費。</small>}</Field> : <><Field label="購買課程" wide><Select aria-label="購買課程" placeholder="先選擇課程" value={v.courseId} onChange={x => put('courseId', x)} options={options(db.courses)} notFoundContent="請先新增課程" /></Field><Field label="購買堂數"><InputNumber aria-label="購買堂數" required disabled={!v.courseId} min={1} max={100} precision={0} placeholder="輸入購買堂數" value={v.packageCount} onChange={x => put('packageCount', x)} /></Field><Field label="每堂價格 · HKD"><InputNumber required disabled={!v.courseId} min={0} precision={2} value={v.unitPrice} onChange={x => put('unitPrice', x)} /></Field><div className="wide"><Alert type="info" title="登記收款後，購買的課時會加入學生剩餘課時。" /></div></>}</div><div className="bill-preview">{lines.map((l, i) => <div key={i}><span>{l.description}<small>{l.lessonDate} {l.time} · {l.quantity} × {money(l.unitPrice)}</small></span><b>{money(l.quantity * l.unitPrice)}</b></div>)}{!lines.length && <p className="muted">選擇課程並填寫堂數後，這裡會顯示單據明細。</p>}</div>{v.kind !== 'invoice' && <Field label="付款方式"><Select value={v.method} onChange={x => put('method', x)} options={['FPS 轉數快', '現金', '銀行轉帳', '信用卡', '支票'].map(x => ({
          value: x,
          label: x
        }))} /></Field>}<details className="advanced-options"><summary>更多設定：折扣、附加費及備註</summary><div className="form-grid"><Field label="附加費 · HKD"><InputNumber min={0} precision={2} value={v.surcharge} onChange={x => put('surcharge', x || 0)} /></Field><Field label="折扣方式"><Select value={v.discountKind} onChange={x => put('discountKind', x)} options={[{
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
