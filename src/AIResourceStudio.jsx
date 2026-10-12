/** @jsx localizedElement */
import { assetUrl } from './assetUrl';
import React, {useEffect, useState} from 'react';
import {App, Alert, Button, Checkbox, Empty, Form, Input, InputNumber, Modal, Progress, Select, Tag, Upload} from 'antd';
import {RobotOutlined, ScanOutlined, FileTextOutlined, UploadOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined} from '@ant-design/icons';
import {localizedElement, t} from './language';
import {grades, questionTypes, validateQuestion} from './questionModel';
import {QuestionEditor, QuestionPreview} from './QuestionEditor';
import {loadResources, persistResources} from './resourceStore';
import {AI_TASK_STORE, createResourceTask, taskStatus, acceptResourceTask} from './aiResourceModel';
import './ai-resource-studio.css';
import {blankExam, examEntry, EXAM_STORE} from './examModel.js';

const labels = {running:'生成中', review:'待確認', saved:'已加入', cancelled:'已取消'};
const modes = {generate:'AI 生成', extract:'試卷圖片提取', paper:'AI 組卷'};
export default function AIResourceStudio({type,parent,onSaved,paperItems=[]}) {
  const {message} = App.useApp();
  const [tasks,setTasks] = useState(()=>{try {return JSON.parse(localStorage.getItem(AI_TASK_STORE)) || [];} catch {return [];}});
  const [now,setNow] = useState(Date.now());
  const [mode,setMode] = useState(null);
  const [reviewId,setReviewId] = useState(null);
  const [selected,setSelected] = useState([]);
  const [editing,setEditing] = useState(null);
  const [image,setImage] = useState(null);
  const [fileName,setFileName] = useState('');
  const [form] = Form.useForm();
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),700);return ()=>clearInterval(timer);},[]);
  const saveTasks = next => {try {localStorage.setItem(AI_TASK_STORE,JSON.stringify(next));setTasks(next);return true;} catch {message.error(t('儲存失敗，請縮小圖片或檢查瀏覽器空間'));return false;}};
  const task = tasks.find(x=>x.id===reviewId);
  const updateTask = updated => saveTasks(tasks.map(x=>x.id===updated.id?updated:x));
  const open = next => {setMode(next);setImage(null);setFileName('');form.resetFields();};
  const start = async () => {
    let values;try {values=await form.validateFields();} catch {return;}
    try {const job=createResourceTask({...values,type,parent,mode,image,fileName},loadResources());if(saveTasks([job,...tasks])){setMode(null);message.success(t('任務已建立，可離開此頁，稍後預覽結果'));}} catch(e){message.error(t(e.message));}
  };
  const accept = () => {
    try {
      if(taskStatus(task)!=='review') throw Error('此任務尚未完成或已處理');
      const invalid=task.results.filter(x=>selected.includes(x.id)&&x.type==='questions').flatMap(validateQuestion);
      if(invalid.length) throw Error(invalid[0]);
      let next;
      if(task.mode==='paper') {
        const existing=JSON.parse(localStorage.getItem(EXAM_STORE) || 'null') || paperItems;
        const paper={...blankExam(),id:`ai-paper-${task.id}`,title:task.prompt,grade:task.grade,demo:true,entries:task.results.filter(x=>selected.includes(x.id)).map(q=>{const entry=examEntry(q,q.id);return {...entry,marks:entry.marks.map(()=>2)};})};
        next=existing.some(x=>x.id===paper.id)?existing:[paper,...existing];
        localStorage.setItem(EXAM_STORE,JSON.stringify(next));
      } else {next=acceptResourceTask(task,selected,loadResources());persistResources(next);}
      updateTask({...task,status:'saved'});onSaved(next,task.parent);setReviewId(null);message.success(t('已加入資源庫'));
    } catch(e){message.error(t(e.message));}
  };
  const upload = file => {
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){message.error(t('請選擇 2 MB 以下的 PNG、JPEG 或 WebP 圖片'));return false;}
    const reader=new FileReader();reader.onload=()=>{setImage(reader.result);setFileName(file.name);};reader.onerror=()=>message.error(t('圖片讀取失敗'));reader.readAsDataURL(file);return false;
  };
  const move = (index,delta) => {const results=[...task.results];[results[index],results[index+delta]]=[results[index+delta],results[index]];updateTask({...task,results});};
  return <section className="ai-studio">
    <div className="ai-studio-toolbar"><div className="actions">{type!=='papers'&&<Button icon={<RobotOutlined />} onClick={()=>open('generate')}>AI 生成{type==='audio'?'音頻':type==='video'?'視頻':'試題'}</Button>}{type==='questions'&&<><Button icon={<ScanOutlined />} onClick={()=>open('extract')}>試卷圖片提取</Button></>}{type==='papers'&&<Button icon={<FileTextOutlined />} onClick={()=>open('paper')}>AI 組卷</Button>}</div><Tag>AI 原型 · 模擬結果</Tag></div>
    {tasks.some(x=>x.type===type)&&<details className="ai-task-list" open><summary>生成任務（{tasks.filter(x=>x.type===type).length}）</summary>{tasks.filter(x=>x.type===type).map(job=>{const status=taskStatus(job,now);return <div className="ai-task" key={job.id}><div><strong>{job.prompt}</strong><small>{modes[job.mode]} · {job.count} 項 · {new Date(job.createdAt).toLocaleString('zh-CN')}</small></div><Tag color={status==='review'?'gold':status==='saved'?'green':'blue'}>{labels[status]}</Tag>{status==='running'?<><Progress percent={Math.min(99,Math.max(0,Math.floor((now-job.createdAt)/120)))} size="small" /><Button onClick={()=>updateTask({...job,status:'cancelled'})}>取消</Button></>:status==='review'?<Button type="primary" onClick={()=>{setReviewId(job.id);setSelected(job.results.map(x=>x.id));}}>預覽確認</Button>:null}</div>;})}</details>}
    <Modal title={modes[mode]} open={!!mode} onCancel={()=>setMode(null)} onOk={start} okText="開始生成" cancelText="取消" destroyOnHidden>
      <Alert type="info" showIcon title="原型演示：使用固定示例，不會呼叫 AI 或上傳圖片至伺服器。" />
      <Form form={form} layout="vertical" initialValues={{grade:'P3',count:mode==='paper'?3:2,questionType:'choice'}}>
        <Form.Item name="prompt" label={mode==='paper'?'試卷名稱與要求':'主題與要求'} rules={[{required:true,whitespace:true,message:'請填寫要求'}]}><Input.TextArea rows={3} maxLength={300} placeholder="例如：P3 英語日常問候，難度適中" /></Form.Item>
        {['questions','papers'].includes(type)&&<Form.Item name="grade" label="年級"><Select options={grades} /></Form.Item>}
        {type==='questions'&&mode!=='paper'&&<Form.Item name="questionType" label="題型"><Select options={questionTypes} /></Form.Item>}
        <Form.Item name="count" label={mode==='paper'?'試題數量':'生成數量'} rules={[{required:true}]}><InputNumber min={1} max={20} precision={0} /></Form.Item>
        {mode==='extract'&&<><Upload beforeUpload={upload} showUploadList={false} accept="image/png,image/jpeg,image/webp"><Button icon={<UploadOutlined />}>選擇試卷圖片</Button></Upload>{image&&<figure className="ai-source"><img src={image} alt="上傳的試卷" /><figcaption>{fileName}</figcaption></figure>}</>}
      </Form>
    </Modal>
    <Modal width={960} title={task?`${modes[task.mode]} · ${task.prompt}`:''} open={!!task} onCancel={()=>setReviewId(null)} footer={<><Button onClick={()=>setReviewId(null)}>稍後處理</Button><Button type="primary" disabled={!selected.length} onClick={accept}>確認加入（{selected.length}）</Button></>} destroyOnHidden>
      {task&&<><Alert type="info" title={task.mode==='extract'?'以下為固定提取示例，並非圖片真實識別結果，請核對並編輯。':task.mode==='paper'?'按年級從題庫選取的模擬組卷，可調整順序；每小題預設 2 分，確認後加入試卷列表，可再編輯分數。':'固定示例內容，供預覽生成與入庫流程。'} />{task.image&&<details><summary>原始試卷圖片</summary><img className="ai-original" src={task.image} alt="原始試卷" /></details>}
      <Checkbox checked={selected.length===task.results.length} indeterminate={!!selected.length&&selected.length<task.results.length} onChange={e=>setSelected(e.target.checked?task.results.map(x=>x.id):[])}>全選</Checkbox>
      {task.results.map((result,index)=><section className="ai-result" key={result.id}><div className="ai-result-heading"><Checkbox checked={selected.includes(result.id)} onChange={e=>setSelected(e.target.checked?[...selected,result.id]:selected.filter(id=>id!==result.id))}>{index+1}. {result.title}</Checkbox><div className="actions">{task.mode==='paper'&&<><Button title="上移" aria-label="上移" icon={<ArrowUpOutlined />} disabled={!index} onClick={()=>move(index,-1)} /><Button title="下移" aria-label="下移" icon={<ArrowDownOutlined />} disabled={index===task.results.length-1} onClick={()=>move(index,1)} /></>}{result.type==='questions'&&<Button icon={<EditOutlined />} onClick={()=>setEditing(result)}>編輯</Button>}</div></div>
      {result.type==='questions'?<QuestionPreview question={result} audios={loadResources().filter(x=>x.type==='audio')} />:result.type==='audio'?<audio controls preload="metadata" src={assetUrl(result.url)} />:<video controls preload="metadata" src={assetUrl(result.url)} poster={assetUrl(result.cover)} />}</section>)}{!task.results.length&&<Empty />}</>}
    </Modal>
    {editing&&<QuestionEditor initial={editing} audios={loadResources().filter(x=>x.type==='audio')} onCancel={()=>setEditing(null)} onSave={draft=>{if(updateTask({...task,results:task.results.map(x=>x.id===editing.id?{...x,...draft,id:x.id}:x)}))setEditing(null);}} />}
  </section>;
}
