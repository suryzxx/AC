/** @jsx localizedElement */
import React, { useMemo, useState } from 'react';
import { Select, Segmented, Table, Empty, Input as SearchInput } from 'antd';
import Input from './SystemInput';
import { PageHeading } from './NativeUI';
import { TeacherAvatar } from './TeacherAvatar';
import { todayHK, dateAdd, money } from './model';
import { dashboardStats } from './analytics';
import { localizedElement, t } from './language';
import './dashboard.css';
const metricMoney = value => money(Math.round(value * 100) / 100);
function Metric({ label, value, hint }) { return <div className="insight-metric"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>; }
function Trend({ rows, metric }) {
  if (!rows.length) return <Empty description="這個時段尚無已完成課堂" />;
  const max = Math.max(1, ...rows.map(r => r[metric]));
  return <div className="insight-trend" role="img" aria-label={t(metric === 'count' ? '已完成課堂趨勢' : '授課金額趨勢')}>
    <div className="insight-trend-scale"><span>{metric === 'count' ? max + t(' 堂') : metricMoney(max)}</span><span>0</span></div>
    <div className="insight-trend-columns">{rows.map(r => <div className="insight-trend-column" key={r.date}><div className="insight-bar-track"><div className="insight-bar" style={{ height: `${r[metric] / max * 100}%` }} tabIndex={0} title={`${r.date} · ${r.count} ${t('堂')} · ${metricMoney(r.amount)}`}><span>{metric === 'count' ? r.count : metricMoney(r.amount)}</span></div></div><small>{r.date.slice(5)}</small></div>)}</div>
  </div>;
}
export default function Dashboard({ db }) {
  const today = todayHK();
  const [from, setFrom] = useState(today.slice(0, 8) + '01');
  const [to, setTo] = useState(today.slice(0, 8) + new Date(Number(today.slice(0,4)), Number(today.slice(5,7)), 0).getDate());
  const [preset, setPreset] = useState('month');
  const [teacherId, setTeacherId] = useState(null);
  const [ranking, setRanking] = useState('completed');
  const [metric, setMetric] = useState('count');
  const [query, setQuery] = useState('');
  const valid = from <= to;
  const stats = useMemo(() => dashboardStats(db, valid ? from : '', valid ? to : ''), [db, from, to, valid]);
  const ranked = [...stats.teachers].sort((a,b) => b[ranking] - a[ranking] || a.name.localeCompare(b.name));
  const selected = stats.teachers.find(x => x.id === teacherId) || ranked[0] || { completed: 0, scheduled: 0, amount: 0 };
  const selectedLessons = stats.lessons.filter(b => b.teacherId === selected.id);
  const grouped = new Map();
  selectedLessons.forEach(b => { const value = grouped.get(b.date) || {date:b.date,count:0,amount:0}; value.count++; value.amount+=b.amount; grouped.set(b.date,value); });
  const trend = [...grouped.values()].sort((a,b) => a.date.localeCompare(b.date));
  const changePreset = key => {
    setPreset(key);
    if(key==='week'){const monday=dateAdd(today,-((new Date(today+'T12:00:00').getDay()+6)%7));setFrom(monday);setTo(dateAdd(monday,6));}
    if(key==='month'){setFrom(today.slice(0,8)+'01');setTo(today.slice(0,8)+new Date(Number(today.slice(0,4)),Number(today.slice(5,7)),0).getDate());}
    if(key==='year'){setFrom(today.slice(0,4)+'-01-01');setTo(today.slice(0,4)+'-12-31');}
  };
  const students = stats.students.filter(s => (s.name+' '+s.english).toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading><div><h1>數據面板</h1></div></PageHeading>
    <div className="insight-dashboard">
      <div className="insight-filters"><Segmented value={preset} options={[{value:'week',label:'本週'},{value:'month',label:'本月'},{value:'year',label:'今年'}]} onChange={changePreset} /><div className="actions"><Input aria-label="統計開始日期" type="date" value={from} onChange={e=>{setFrom(e.target.value);setPreset(null);}} /><span>至</span><Input aria-label="統計結束日期" type="date" value={to} onChange={e=>{setTo(e.target.value);setPreset(null);}} /></div><span className="insight-period">香港時間 · HKD</span></div>
      {!valid && <p role="alert" className="warning-text">開始日期不能晚於結束日期</p>}
      <div className="insight-heading"><h2>全體老師概覽</h2><span>所選時段 · 所有老師</span></div>
      <div className="insight-metrics"><Metric label="已完成課堂" value={stats.totals.completed+' '+t('堂')} hint={`${stats.totals.hours.toFixed(1)} ${t('小時 · 每堂只計一次')}`} /><Metric label="已排課堂" value={stats.totals.scheduled+' '+t('堂')} hint="尚未完成考勤的課堂" /><Metric label="授課課時費" value={metricMoney(stats.totals.amount)} hint="已完成課堂的到課學生費用" /></div>
      <div className="insight-grid">
      <section className="insight-panel"><div className="insight-heading"><div><h2>老師排名</h2><p>全體老師 · 點擊查看老師分析</p></div><Select aria-label="老師排名方式" value={ranking} onChange={setRanking} options={[{value:'completed',label:'按課堂數量'},{value:'amount',label:'按課時費'}]} /></div><div className="insight-ranking">{ranked.map((teacher,index)=><button key={teacher.id} onClick={()=>setTeacherId(teacher.id)} aria-pressed={selected.id===teacher.id}><span className="insight-rank">{index>0 && teacher[ranking]===ranked[index-1][ranking] ? ranked.findIndex(x=>x[ranking]===teacher[ranking])+1:index+1}</span><TeacherAvatar teacher={teacher} /><div className="insight-rank-body"><div><b>{teacher.name}</b><span>{ranking==='completed'?`${teacher.completed} ${t('堂')}`:metricMoney(teacher.amount)}</span></div><div className="insight-rank-track"><i style={{width:`${teacher[ranking]/Math.max(1,...ranked.map(t=>t[ranking]))*100}%`}} /></div><small>{teacher.completed} 堂 · {teacher.hours.toFixed(1)} 小時 · {metricMoney(teacher.amount)}</small></div></button>)}</div></section>
      <section className="insight-panel"><div className="insight-heading"><div><h2>{selected.name ? `${selected.name} · 授課分析` : '老師授課分析'}</h2><p>{selected.name ? '所選時段的課堂數量與課時費' : '尚未新增老師'}</p></div></div><div className="insight-inline-stats"><div><small>已完成</small><b>{selected.completed} 堂</b></div><div><small>已排課</small><b>{selected.scheduled} 堂</b></div><div><small>課時費</small><b>{metricMoney(selected.amount)}</b></div></div><Segmented value={metric} onChange={setMetric} options={[{value:'count',label:'課堂數量'},{value:'amount',label:'課時費'}]} /><Trend rows={trend} metric={metric} /><p className="insight-note">按上課日期統計，僅顯示有已完成課堂的日期。懸停或聚焦柱形查看數值。</p></section></div>
      <section className="insight-panel"><div className="insight-heading"><h2>學生費用明細</h2><SearchInput placeholder="搜尋學生中英文名" aria-label="搜尋統計學生" value={query} onChange={e=>setQuery(e.target.value)} allowClear /></div><Table rowKey="id" dataSource={students} pagination={{pageSize:8,showSizeChanger:false}} scroll={{x:720}} columns={[{title:'學生',render:(_,s)=><div><b>{s.name}</b><small className="insight-student-english">{s.english}</small></div>},{title:'購課總費用',dataIndex:'purchased',render:metricMoney,sorter:(a,b)=>a.purchased-b.purchased},{title:'收款 / 核銷',key:'fees',render:(_,s)=><div className="insight-student-fees"><span><small>已收</small><b>{metricMoney(s.received)}</b></span><span><small>已核銷（估算）</small><b>{metricMoney(s.consumed)}</b></span></div>,sorter:(a,b)=>a.received-b.received},{title:'已扣課時',dataIndex:'used',render:v=>`${v} ${t('堂')}`}]} /></section>
      <details className="insight-definitions"><summary>統計口徑</summary><p>老師課時費按已完成課堂中出席、遲到學生的課堂單價快照加總，多人課堂數量只計一堂。此金額是授課金額，並非老師薪酬。</p><p>購課費用使用有效購課帳單實際總額，包含帳單折扣與附加費；撤銷收款不计入已收。已課銷費用使用有效扣課記錄及課堂單價估算，不含待補扣，考勤更正後原扣課不重複計算。歷史初始課時沒有購課金額，因此不推算收入或剩餘金額。收款與課銷可屬不同期間，不表示同一筆課包的收支配對。</p></details>
    </div>
  </>;
}
