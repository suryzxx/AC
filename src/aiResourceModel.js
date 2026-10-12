import { sampleQuestion } from './questionModel.js';

export const AI_TASK_STORE = 'ac-ai-resource-tasks-v1';
export function createResourceTask(config, items, now = Date.now()) {
  const count = Number(config.count);
  if (!config.prompt?.trim()) throw Error('請填寫主題或要求');
  if (!Number.isInteger(count) || count < 1 || count > 20) throw Error('數量須為 1–20');
  if (config.mode === 'extract' && !config.image) throw Error('請上傳試卷圖片');
  const id = crypto.randomUUID();
  let results;
  if (config.mode === 'paper') {
    const bank = items.filter(x => x.type === 'questions' && x.kind === 'resource' && x.grade === config.grade);
    if (bank.length < count) throw Error(`此年級只有 ${bank.length} 道試題，請減少數量或先加入試題`);
    results = structuredClone(bank.slice(0, count));
  } else results = Array.from({length:count}, (_, index) => config.type === 'questions'
    ? {...sampleQuestion(config.questionType || 'choice', config.grade), title:`${config.prompt.trim()} · ${index + 1}`, type:'questions', kind:'resource'}
    : {type:config.type, kind:'resource', title:`${config.prompt.trim()} · ${index + 1}`, ar:'1.0', duration:config.type === 'audio' ? '00:14' : '00:12', url:config.type === 'audio' ? '/resources/greetings.wav' : '/resources/phonics.mp4', cover:`/resources/${config.type}-${index % 4}.svg`, demo:true});
  const audio = items.find(x=>x.type==='audio' && x.kind==='resource' && x.url);
  results = results.map(x => x.details?.audioId && audio ? {...x,details:{...x.details,audioId:audio.id}} : x);
  return {...config, id, count, createdAt:now, readyAt:now + 12000, status:'running', results:results.map((x,index)=>({...x,id:`${id}-${index}`,demo:true}))};
}
export function taskStatus(task, now = Date.now()) {
  return task.status === 'running' && now >= task.readyAt ? 'review' : task.status;
}
export function acceptResourceTask(task, selectedIds, items, now = Date.now()) {
  if (taskStatus(task,now) !== 'review') throw Error('此任務尚未完成或已處理');
  const selected = task.results.filter(x=>selectedIds.includes(x.id));
  if (!selected.length) throw Error('請至少選擇一個結果');
  const date = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(now);
  const folderId = `paper-${task.id}`;
  const additions = selected.map(x=>({...x,parent:task.mode === 'paper' ? folderId : task.parent,date}));
  if (task.mode === 'paper') additions.unshift({id:folderId,type:'questions',kind:'folder',parent:task.parent,title:task.prompt,date,demo:true});
  return [...items,...additions.filter(x=>!items.some(old=>old.id === x.id))];
}
