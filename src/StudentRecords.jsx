/** @jsx localizedElement */
import React, { useEffect, useState } from 'react';
import { Table, Tag, Empty } from 'antd';
import { localizedElement } from './language';
import { totalStudentLessons, courseName, teacherName } from './model';
import { studentLessonStatus } from './studentLessonStatus';

export default function StudentRecords({ db, student }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const records = db.sessions.filter(s => s.studentIds.includes(student.id) || s.excused?.some(e => e.studentId === student.id))
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
  return <div className="student-records">
    <div className="student-records-header"><div><h2>{student.name}</h2><p>{student.english || '未填寫英文名'}</p></div><div className="student-records-credits"><div className="student-records-balance"><span>總課時</span><b>{totalStudentLessons(db, student.id)} 堂</b></div><div className="student-records-balance"><span>剩餘課時</span><b>{student.balance} 堂</b></div></div></div>
    <Table rowKey="id" size="small" dataSource={records} pagination={records.length > 10 ? { pageSize: 10, showSizeChanger: false } : false} scroll={{ x: 580 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暫無上課或預約記錄" /> }} columns={[
      { title: '上課時間', key: 'time', render: (_, s) => <><b>{s.date}</b><small>{s.start}–{s.end}</small></> },
      { title: '課程', key: 'course', render: (_, s) => courseName(db, s.courseId) },
      { title: '老師', key: 'teacher', render: (_, s) => teacherName(db, s.teacherId) },
      { title: '狀態', key: 'status', render: (_, s) => { const status = studentLessonStatus(s, student.id, now); return <Tag color={status.color}>{status.label}</Tag>; } }
    ]} />
  </div>;
}
