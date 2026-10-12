/** @jsx localizedElement */
import React, { useState } from 'react';
import { Button, Empty, Input, Popconfirm, Tag } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CalendarOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { availability, courseName, dateAdd, mins, studentName, todayHK } from './model';
import { TeacherAvatar } from './TeacherAvatar';
import { PageHeading } from './NativeUI';
import { localizedElement, simplify } from './language';

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
export default function Teachers({ db, isAdmin, teacherId, setDialog, update, record }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(teacherId);
  const [date, setDate] = useState(todayHK());
  const teachers = db.teachers.filter(t => isAdmin || t.id === teacherId);
  const teacher = teachers.find(t => t.id === selectedId) || teachers[0];
  const monday = dateAdd(date, -((new Date(date + 'T12:00:00').getDay() + 6) % 7));
  const dates = Array.from({ length: 7 }, (_, i) => dateAdd(monday, i));
  const lessons = db.sessions.filter(s => s.teacherId === teacher?.id && s.status !== 'cancelled' && dates.includes(s.date)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const windows = teacher ? dates.flatMap(d => [...availability(teacher, d), ...(teacher.unavailable || []).filter(w => w.date === d)]) : [];
  const start = Math.floor(Math.min(600, ...windows.map(w => mins(w.start)), ...lessons.map(s => mins(s.start))) / 60) * 60;
  const end = Math.ceil(Math.max(1200, ...windows.map(w => mins(w.end)), ...lessons.map(s => mins(s.end))) / 60) * 60;
  const position = w => ({ top: (mins(w.start) - start) * 1.5, height: (mins(w.end) - mins(w.start)) * 1.5 });
  const edit = (type, t = teacher) => setDialog({ type, teacher: t });
  return <>
    <PageHeading><div><h1>{isAdmin ? '老師與可用時間' : '我的可用時間'}</h1></div>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialog({ type: 'teacher' })}>新增老師</Button>}</PageHeading>
    <div className="native-teacher-workspace">
    <aside className="native-teacher-master"><div className="native-master-header"><b>老師</b><span>{teachers.length}</span></div><div className="native-master-search"><Input prefix={<SearchOutlined />} aria-label="搜尋老師" placeholder="搜尋老師" value={query} onChange={e => setQuery(e.target.value)} allowClear /></div><div className="native-master-items">{teachers.filter(t => simplify(t.name+t.english).toLowerCase().includes(simplify(query).toLowerCase())).map(t => <button key={t.id} aria-pressed={teacher?.id === t.id} className={teacher?.id === t.id ? 'selected' : ''} onClick={() => setSelectedId(t.id)}><TeacherAvatar teacher={t} /><span><b>{t.name}</b><small>{t.english} · {t.type === 'full' ? '全職' : '兼職'}</small></span></button>)}</div><div className="native-master-foot">選擇老師查看課表</div></aside>
    <div className="native-teacher-detail">
    {teacher && <div className="native-teacher-info"><div className="teacher-profile-identity"><TeacherAvatar teacher={teacher} large /><div><h2>{teacher.name}<small>{teacher.english}</small></h2><p>{teacher.subjects.map(c => courseName(db,c)).join(' · ')}<span>可教年級 {teacher.grades.join(' / ')}</span></p></div></div>{isAdmin && <Button onClick={() => edit('teacher')}>編輯資料</Button>}</div>}
    {!teacher ? <Empty description="尚未新增老師" /> : <section className="panel teacher-calendar section">
      <div className="teacher-calendar-heading"><div className="actions"><Button aria-label="上一週" icon={<ArrowLeftOutlined />} onClick={() => setDate(dateAdd(date, -7))} /><Button onClick={() => setDate(todayHK())}>本週</Button><Button aria-label="下一週" icon={<ArrowRightOutlined />} onClick={() => setDate(dateAdd(date, 7))} /></div><div className="actions"><Button className="button-soft" icon={<CalendarOutlined />} onClick={() => edit('availability')}>編輯可用時間</Button><Button onClick={() => edit('teacherOff')}>這天不能上課</Button></div></div>
      <div className="teacher-calendar-legend"><div className="calendar-legend"><span><i className="available-key" />可授課時段</span><span><i className="lesson-key" />已排課</span><span><i className="done-key" />已完成</span><span><i className="off-key" />停課</span></div></div>
      <div className="teacher-calendar-scroll"><div className="teacher-week-grid"><div className="teacher-week-head">香港時間</div>{dates.map(d => <div key={d} className={'teacher-week-head' + (d === todayHK() ? ' is-today' : '')}><span>週{weekdays[new Date(d + 'T12:00:00').getDay()]}</span><b>{d.slice(5).replace('-', '/')}</b>{d === todayHK() && <small>今天</small>}</div>)}
        <div className="teacher-hour-axis" style={{ height: (end - start) * 1.5 }}>{Array.from({ length: (end - start) / 60 }, (_, i) => <span key={i} style={{ top: i * 90 }}>{String(start / 60 + i).padStart(2, '0')}:00</span>)}</div>
        {dates.map(d => <div key={d} className="teacher-day-column" style={{ height: (end - start) * 1.5 }}>
          {availability(teacher, d).map((w, i) => <div key={'available' + i} className="teacher-available" style={position(w)}><span>{w.start}–{w.end}</span></div>)}
          {(teacher.unavailable || []).filter(w => w.date === d).map(w => <div key={w.id} className="teacher-off" style={position(w)} title={w.reason}>停課 {w.start}–{w.end}<small>{w.reason}</small></div>)}
          {lessons.filter(s => s.date === d).map(s => <button key={s.id} className={'teacher-calendar-lesson' + (s.status === 'completed' ? ' completed' : '')} style={position(s)} onClick={() => setDialog({ type: 'session', session: s })}><b>{s.start}–{s.end}</b><strong>{courseName(db, s.courseId)}</strong><span>{s.studentIds.map(id => studentName(db, id)).join('、')}</span><small>{s.status === 'completed' ? '已完成' : '已安排'}</small></button>)}
          {!availability(teacher, d).length && !lessons.some(s => s.date === d) && !(teacher.unavailable || []).some(w => w.date === d) && <p className="teacher-day-empty">未設定可用時間</p>}
        </div>)}
      </div></div>
      {!!teacher.unavailable?.length && <div className="teacher-off-records"><h3>停課記錄</h3>{teacher.unavailable.map(w => <div className="unavailable-notice" key={w.id}><Tag color="orange">停課</Tag>{w.date} {w.start}–{w.end} · {w.reason}{isAdmin && <Popconfirm title="恢復這個時段？仍需符合每週或指定可用時間。" onConfirm={() => update(old => ({ ...old, teachers: old.teachers.map(t => t.id === teacher.id ? { ...t, unavailable: t.unavailable.filter(o => o.id !== w.id) } : t), history: record(old, `恢復 ${teacher.name} ${w.date} 時段`) }), '已恢復')}><Button size="small">恢復</Button></Popconfirm>}</div>)}</div>}
    </section>}
    </div></div>
  </>;
}
