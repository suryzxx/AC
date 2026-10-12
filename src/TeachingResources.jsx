/** @jsx localizedElement */
import { assetUrl } from './assetUrl';
import React, { useState } from 'react';
import { App, Button, Input, Modal, Form, Pagination, Empty, Breadcrumb, Select } from 'antd';
import { FolderFilled, FolderAddOutlined, PlusOutlined, SearchOutlined, PlayCircleOutlined, SoundOutlined, FileTextOutlined } from '@ant-design/icons';
import { PageHeading } from './NativeUI';
import { localizedElement, t } from './language';
import './teaching-resources.css';
import { QuestionEditor, QuestionPreview } from './QuestionEditor';
import AIResourceStudio from './AIResourceStudio';
import { loadResources, persistResources } from './resourceStore';
import { grades, questionTypes, typeLabel, withoutQuestionScores, upgradeDemoQuestions } from './questionModel';
const names = { audio:'音頻', video:'視頻', questions:'試題' };
export default function TeachingResources({ type }) {
  const { message } = App.useApp();
  const [items, setItems] = useState(loadResources);
  const [path, setPath] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [preview, setPreview] = useState(null);
  const [questionEditor, setQuestionEditor] = useState(null);
  const [gradeFilter, setGradeFilter] = useState();
  const [typeFilter, setTypeFilter] = useState();
  const [form] = Form.useForm();
  const parent = path.at(-1)?.id || null;
  const rows = items.filter(item => item.type === type && item.parent === parent && item.title.toLowerCase().includes(search.toLowerCase()) && (item.kind === 'folder' || ((!gradeFilter || item.grade === gradeFilter) && (!typeFilter || item.questionType === typeFilter))));
  const navigate = next => { setPath(next); setPage(1); setSearch(''); };
  const open = kind => { if (type === 'questions' && kind === 'resource') { setQuestionEditor({initial:null}); return; } form.resetFields(); setDialog(kind); };
  const audios = items.filter(item => item.type === 'audio' && item.kind === 'resource');
  const saveQuestion = draft => {
    const existing = questionEditor.initial;
    const item = { ...withoutQuestionScores(draft), id: existing?.id || crypto.randomUUID(), kind:'resource', type:'questions', parent:existing?.parent ?? parent, date:existing?.date || new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai'}).format(new Date()) };
    const next = existing ? items.map(x=>x.id===existing.id?item:x) : [...items,item];
    try { persistResources(next); } catch { message.error(t('儲存失敗，請檢查瀏覽器儲存空間。')); return; }
    setItems(next);setQuestionEditor(null);setSearch('');setGradeFilter(undefined);setTypeFilter(undefined);setPage(existing?1:Math.ceil(next.filter(x=>x.type===type&&x.parent===parent).length/12));message.success(t(existing?'已保存試題':'已建立試題'));
  };
  const save = async () => {
    let values; try { values = await form.validateFields(); } catch { return; }
    const next = [...items, { ...values, title: values.title.trim(), id: crypto.randomUUID(), kind: dialog, type, parent, date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date()) }];
    try { persistResources(next); } catch { message.error(t('儲存失敗，請縮小封面圖片或檢查瀏覽器儲存空間。')); return; }
    setItems(next); setSearch(''); setPage(Math.ceil(next.filter(item => item.type === type && item.parent === parent).length / 12)); setDialog(null); message.success(t('已建立'));
  };
  const icon = type === 'audio' ? <SoundOutlined /> : type === 'video' ? <PlayCircleOutlined /> : <FileTextOutlined />;
  return <>
    <PageHeading><div><h1>{names[type]}</h1></div><div className="actions"><Button icon={<FolderAddOutlined />} onClick={() => open('folder')}>新建文件夾</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => open('resource')}>新建{names[type]}資源</Button></div></PageHeading>
    <AIResourceStudio type={type} parent={parent} onSaved={(next,destination)=>{setItems(next);setSearch('');setGradeFilter(undefined);setTypeFilter(undefined);if(destination!==parent)setPath([]);setPage(1);}} />
    <section className="resource-browser">
      <div className="resource-toolbar"><Breadcrumb items={[{ title: <button onClick={() => navigate([])}>{names[type]}</button> }, ...path.map((folder, index) => ({ title: <button onClick={() => navigate(path.slice(0, index + 1))}>{folder.title}</button> }))]} />{type === 'questions' && <div className="resource-question-filters"><Select allowClear placeholder="全部年級" value={gradeFilter} options={grades} onChange={value=>{setGradeFilter(value);setPage(1);}} /><Select allowClear placeholder="全部題型" value={typeFilter} options={questionTypes} onChange={value=>{setTypeFilter(value);setPage(1);}} /></div>}<Input allowClear prefix={<SearchOutlined />} placeholder={t('搜尋當前文件夾')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
      <div className="resource-section-label"><span>{path.at(-1)?.title || `全部${names[type]}`}</span><small>{rows.length} 個項目</small></div>
      {rows.length ? <div className="resource-grid">{rows.slice((page - 1) * 12, page * 12).map((item, index) => <button className={`resource-card ${item.kind === 'folder' ? 'is-folder' : ''}`} key={item.id} onClick={() => item.kind === 'folder' ? navigate([...path, item]) : setPreview(item)}>
        <div className={`resource-cover cover-${index % 4}`}>
          {item.kind === 'folder' ? <FolderFilled /> : item.cover ? <img src={assetUrl(item.cover)} alt={item.title} onError={e => { e.currentTarget.style.display = 'none'; }} /> : <><span className="resource-cover-icon">{icon}</span><span className="resource-cover-title">{item.title}</span></>}
          {item.kind !== 'folder' && type !== 'questions' && <span className="resource-duration">{item.duration}</span>}
        </div>
        <strong title={item.title}>{item.title}</strong>
        {item.kind === 'folder' ? <small>{items.filter(child => child.parent === item.id).length} 個項目</small> : type === 'questions' ? <small className="resource-stem">{item.stem}</small> : <small>AR {item.ar || '—'}</small>}
        {type === 'questions' && item.kind === 'resource' && <div className="resource-question-meta"><span>{item.grade || '未設定年級'}</span><span>{typeLabel(item.questionType)}</span></div>}{type !== 'questions' && <time>添加日期 · {item.date}</time>}
      </button>)}</div> : <Empty description={search ? '沒有符合的資源' : '文件夾為空，可新建文件夾或資源'} />}
      <div className="resource-pagination"><span>共 {rows.length} 個項目</span><Pagination current={page} pageSize={12} total={rows.length} onChange={setPage} showSizeChanger={false} hideOnSinglePage={false} /></div>
    </section>
    <Modal title={dialog === 'folder' ? '新建文件夾' : `新建${names[type]}資源`} open={!!dialog} onCancel={() => setDialog(null)} onOk={save} okText="建立" cancelText="取消" destroyOnHidden>
      <Form form={form} layout="vertical"><Form.Item name="title" label={dialog === 'folder' ? '文件夾名稱' : type === 'questions' ? '名稱' : '標題'} rules={[{ required: true, whitespace: true, message: '請輸入名稱' }]}><Input maxLength={100} /></Form.Item>
        {dialog === 'resource' && (type === 'questions' ? <Form.Item name="stem" label="題幹" rules={[{ required: true, whitespace: true, message: '請輸入題幹' }]}><Input.TextArea rows={4} /></Form.Item> : <>
          <Form.Item name="cover" label="封面圖片網址" rules={[{ type: 'url', message: '請輸入有效網址' }]}><Input placeholder="https://" /></Form.Item>
          <div className="resource-form-row"><Form.Item name="ar" label="AR" rules={[{ required: true, whitespace: true, message: '請輸入 AR' }]}><Input /></Form.Item><Form.Item name="duration" label="時長（分:秒）" rules={[{ required: true, pattern: /^\d+:[0-5]\d$/, message: '例如 03:20' }]}><Input placeholder="03:20" /></Form.Item></div>
          <Form.Item name="url" label={`${names[type]}網址`} rules={[{ required: true, type: 'url', message: '請輸入有效資源網址' }]}><Input placeholder="https://" /></Form.Item>
        </>)}
      </Form>
    </Modal>
    {questionEditor && <QuestionEditor key={questionEditor.initial?.id || 'new'} initial={questionEditor.initial} audios={audios} onCancel={()=>setQuestionEditor(null)} onSave={saveQuestion} />}
    <Modal width={type === 'questions' ? 850 : 520} title={preview?.title} open={!!preview} onCancel={() => setPreview(null)} footer={type === 'questions' ? <Button type="primary" onClick={()=>{setQuestionEditor({initial:preview});setPreview(null);}}>編輯試題</Button> : null} destroyOnHidden>
      {preview && <div className="resource-preview">{preview.kind === 'resource' && type === 'questions' ? <QuestionPreview key={preview.id} question={preview} audios={audios} /> : preview.url ? type === 'audio' ? <><img className="resource-audio-poster" src={assetUrl(preview.cover)} alt={preview.title} /><audio controls preload="metadata" src={assetUrl(preview.url)} /></> : <video controls preload="metadata" src={assetUrl(preview.url)} poster={assetUrl(preview.cover)} /> : <Empty description="示例教材，尚未關聯媒體文件" />}{preview.demo && type !== 'questions' && <small className="resource-demo-note">原型示例 · {type === 'audio' ? '英語問候聽力' : '自然拼讀動畫'}，用於體驗播放效果</small>}{type !== 'questions' && <p>AR {preview.ar || '—'} · {preview.duration} · 添加日期 · {preview.date}</p>}</div>}
    </Modal>
  </>;
}
