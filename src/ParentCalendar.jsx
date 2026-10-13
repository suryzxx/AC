/** @jsx localizedElement */
import React from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { localizedElement } from './language';
import { dateAdd, todayHK, mins, courseName } from './model';
import { weekDates, calendarBounds, calendarState } from './parentWeek';
const colors = [['upcoming','未開始'],['ongoing','進行中'],['completed','已完成'],['pending','待確認'],['absent','缺勤 / 請假'],['cancelled','已取消']];
export default function ParentCalendar({ db, sessions, studentId, date, setDate, onSelect, now }) {
  const dates = weekDates(date), lessons = sessions.filter(s => dates.includes(s.date));
  const bounds = calendarBounds(lessons), hourHeight = 74;
  const height = (bounds.end - bounds.start) / 60 * hourHeight;
  return <><div className="parent-week-controls"><Button aria-label="上一週" icon={<LeftOutlined/>} onClick={()=>setDate(dateAdd(date,-7))}/><div><b>{dates[0].slice(5).replace('-','/')} – {dates[6].slice(5).replace('-','/')}</b><small>{dates[0].slice(0,4)} 年</small></div><Button aria-label="下一週" icon={<RightOutlined/>} onClick={()=>setDate(dateAdd(date,7))}/><Button onClick={()=>setDate(todayHK())}>本週</Button></div><div className="parent-calendar-legend">{colors.map(([key,label])=><span key={key}><i className={key}/>{label}</span>)}</div><div className="parent-calendar-scroll"><div className="parent-calendar"><div className="parent-week-head"><div>{Number(dates[0].slice(5,7))}月</div>{dates.map((day,i)=><div key={day} className={day===todayHK()?'today':''}><small>{['一','二','三','四','五','六','日'][i]}</small><b>{Number(day.slice(8))}</b></div>)}</div><div className="parent-week-body" style={{height}}><div className="parent-time-axis">{Array.from({length:(bounds.end-bounds.start)/60},(_,i)=><span key={i} style={{top:i*hourHeight}}>{String(bounds.start/60+i).padStart(2,'0')}:00</span>)}</div>{dates.map(day=><div className="parent-day-column" key={day} style={{backgroundSize:`100% ${hourHeight}px`}}>{lessons.filter(s=>s.date===day).map(s=>{const state=calendarState(s,studentId,now);return <button key={s.id} className={`parent-calendar-event ${state.key}`} style={{top:(mins(s.start)-bounds.start)/60*hourHeight,height:Math.max(32,(mins(s.end)-mins(s.start))/60*hourHeight-3)}} aria-label={`${s.date} ${s.start} ${courseName(db,s.courseId)} ${state.label}，查看考勤`} onClick={()=>onSelect(s)}><b>{courseName(db,s.courseId)}</b><small>{s.start}–{s.end}</small><small>{state.label}</small></button>;})}</div>)}</div></div></div>{!lessons.length && <p className="parent-muted">本週沒有課堂</p>}</>;
}
