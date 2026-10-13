/** @jsx localizedElement */
import React, { useState } from 'react';
import { Button, Empty, Input, Tag } from 'antd';
import { CalendarOutlined, BookOutlined, UserOutlined, ArrowLeftOutlined, ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { localizedElement } from './language';
import { courseName, studentName, dateAdd, todayHK, mins } from './model';
import {teacherLessons, weekDates, dayStats} from './teacherSchedule';
import { TeacherAvatar } from './TeacherAvatar';
import './teacher-portal.css';
const days=['日','一','二','三','四','五','六'];
const weekday=date=>days[new Date(date+'T12:00:00').getDay()];
const hours=minutes=>Number((minutes/60).toFixed(1));
function Memo({teacher,onSave}) {
 const [value,setValue]=useState(teacher.scheduleMemo || '');
 return <section className="teacher-info-card"><h2>備忘錄</h2><p className="teacher-hint">記下自己的教學提醒。</p><Input.TextArea aria-label="我的備忘錄" rows={6} value={value} onChange={e=>setValue(e.target.value)} placeholder="今天有哪些需要記住的事？"/><Button type="primary" block onClick={()=>onSave(value)} style={{marginTop:16}}>儲存備忘錄</Button></section>;
}
export default function TeacherPortal({db,teacherId,setDialog,logout,storageError,saveMemo,children}) {
 const [tab,setTab]=useState('agenda');
 const [agenda,setAgenda]=useState('today');
 const [date,setDate]=useState(todayHK());
 const teacher=db.teachers.find(t=>t.id===teacherId);
 const today=todayHK(), tomorrow=dateAdd(today,1), activeDate=agenda==='tomorrow'?tomorrow:today;
 const lessons=teacherLessons(db,teacherId,activeDate), dates=weekDates(date);
 if(!teacher) return <div className="teacher-phone"><Empty description="老師帳號已移除"/><Button onClick={logout}>返回登入</Button></div>;
 const stats=dayStats(teacher,lessons,activeDate);
 const color=s=>`teacher-pastel-${Math.max(0,db.courses.findIndex(c=>c.id===s.courseId))%5}`;
 const open=s=>setDialog({type:'session',session:s});
 const weekLessons=dates.flatMap(d=>teacherLessons(db,teacherId,d));
 const start=Math.floor(Math.min(600,...weekLessons.map(s=>mins(s.start)))/60)*60;
 const end=Math.ceil(Math.max(1200,...weekLessons.map(s=>mins(s.end)))/60)*60;
 const height=(end-start)*1.1;
 return <div className="teacher-portal"><div className="teacher-phone">
 <header className="teacher-phone-header"><div><TeacherAvatar teacher={teacher}/><span><b>{teacher.name}</b><small>{teacher.type==='full'?'全職老師':'兼職老師'} · AC Education</small></span></div><Button type="text" onClick={logout}>退出</Button></header>
 <main>{storageError && <p role="alert">儲存失敗，請勿重新整理。</p>}
 {tab==='agenda' && <><div className="teacher-day-stats"><div><b>{stats.count} 堂</b><span>{agenda==='tomorrow'?'明日':'今日'}課數</span></div><div><b>{hours(stats.teachingMinutes)}h</b><span>上課時長</span></div><div><b>{hours(stats.freeMinutes)}h</b><span>可授課空閒</span></div></div>
 <div className="teacher-agenda-tabs" role="tablist" aria-label="日程檢視">{[['today','今日課程'],['tomorrow','明日課程'],['memo','備忘錄']].map(([key,text])=><button key={key} role="tab" aria-selected={agenda===key} className={agenda===key?'active':''} onClick={()=>setAgenda(key)}>{text}</button>)}</div>
 {agenda==='memo'?<Memo key={teacherId} teacher={teacher} onSave={saveMemo}/>:<><section className="teacher-timeline-panel"><h2>{agenda==='tomorrow'?'明日日程':'今日日程'}</h2><p className="teacher-hint">按上課時間順序展示{agenda==='tomorrow'?'明天':'今天'}的課程安排</p>
 {lessons.length?lessons.map((s,i)=><React.Fragment key={s.id}><div className="teacher-timeline-item"><div className="teacher-timeline-time"><b>{s.start}</b><span>{s.end}</span><small>{mins(s.end)-mins(s.start)} 分鐘</small></div><button className={`teacher-timeline-course ${color(s)}`} onClick={()=>open(s)}><h3>{courseName(db,s.courseId)}</h3><p>{s.studentIds.map(id=>studentName(db,id)).join('、')}</p><small>{s.room?`教室 ${s.room} · `:''}{s.pendingConsumption?'待確認課銷':s.status==='completed'?'已完成':'考勤 / 課銷'} ›</small></button></div>{i<lessons.length-1 && <p className="teacher-timeline-gap">{Math.max(0,mins(lessons[i+1].start)-mins(s.end))?'空閒 '+Math.max(0,mins(lessons[i+1].start)-mins(s.end))+' 分鐘':'課程相連'}</p>}</React.Fragment>):<Empty description="這天沒有課堂" image={Empty.PRESENTED_IMAGE_SIMPLE}/>}</section>
 </>}
 </>}
 {tab==='schedule' && <><div className="teacher-week-controls"><Button aria-label="上一週" icon={<ArrowLeftOutlined/>} onClick={()=>setDate(dateAdd(date,-7))}/><input aria-label="課表日期" type="date" value={date} onChange={e=>e.target.value && setDate(e.target.value)}/><Button aria-label="下一週" icon={<ArrowRightOutlined/>} onClick={()=>setDate(dateAdd(date,7))}/></div>
 <section className="teacher-mobile-week"><div className="teacher-mobile-week-head"><b>{Number(dates[0].slice(5,7))}月</b>{dates.map(d=><div key={d}><span>週{weekday(d)}</span><b className={d===today?'today':''}>{Number(d.slice(8))}</b></div>)}</div><div className="teacher-mobile-week-body" style={{height}}><div className="teacher-mobile-time-axis">{Array.from({length:(end-start)/60+1},(_,i)=><span key={i} style={{top:i*66}}>{String(start/60+i).padStart(2,'0')}:00</span>)}</div>{dates.map(d=><div className="teacher-mobile-day" key={d}>{teacherLessons(db,teacherId,d).map(s=><button key={s.id} aria-label={`${d} ${s.start} ${courseName(db,s.courseId)}`} className={`teacher-mobile-event ${color(s)}`} style={{top:(mins(s.start)-start)*1.1,height:(mins(s.end)-mins(s.start))*1.1-3}} onClick={()=>open(s)}><b>{courseName(db,s.courseId)}</b><span>{s.start}</span><small>{s.studentIds.map(id=>studentName(db,id)).join('、')}</small>{s.room && <small>{s.room}室</small>}</button>)}</div>)}</div></section><p className="teacher-week-hint">點擊課程，查看詳情並記錄考勤。</p>{!weekLessons.length && <Empty description="本週沒有課堂" image={Empty.PRESENTED_IMAGE_SIMPLE}/>}</>}
 {tab==='profile' && <><section className="teacher-my-profile"><TeacherAvatar teacher={teacher} large/><h1>{teacher.name}</h1><Tag>{teacher.type==='full'?'全職老師':'兼職老師'}</Tag><p>{teacher.subjects.map(id=>courseName(db,id)).join(' · ')}</p></section><Button type="primary" size="large" block icon={<EditOutlined/>} onClick={()=>setDialog({type:'availability',teacher})}>編輯可用時間</Button><section className="teacher-info-card"><h2>每週固定時段</h2>{teacher.weekly.length?teacher.weekly.map((w,i)=><p key={i}><b>{w.days.map(d=>'週'+days[d]).join('、')}</b><span>{w.start}–{w.end}</span></p>):<p>尚未設定</p>}</section><section className="teacher-info-card"><h2>指定日期</h2>{teacher.extra.length?[...teacher.extra].sort((a,b)=>a.date.localeCompare(b.date)).map((w,i)=><p key={i}><b>{w.date}</b><span>{w.start}–{w.end}</span></p>):<p>尚未設定</p>}</section>{!!teacher.unavailable?.length && <section className="teacher-info-card"><h2>停課時段</h2>{teacher.unavailable.map(w=><p key={w.id}><b>{w.date} · {w.reason}</b><span>{w.start}–{w.end}</span></p>)}</section>}</>}
 </main><nav className="teacher-bottom-nav" aria-label="老師功能">{[['agenda','日程',CalendarOutlined],['schedule','課表',BookOutlined],['profile','我的',UserOutlined]].map(([key,text,Icon])=><button key={key} aria-label={text} aria-current={tab===key?'page':undefined} className={tab===key?'active':''} onClick={()=>setTab(key)}><Icon/><span>{text}</span></button>)}</nav>{children}
 </div></div>;
}
