export const grades = [...Array.from({length:6},(_,i)=>({value:`P${i+1}`,label:`小學 ${i+1} 年級（P${i+1}）`})), ...Array.from({length:6},(_,i)=>({value:`S${i+1}`,label:`中學 ${i+1} 年級（S${i+1}）`}))];
export const questionTypes = [
  {value:'choice',label:'選擇題 · Multiple choice',hint:'輸入題目、選項，選擇唯一正確答案。'},
  {value:'fill',label:'填空題 · Gap fill',hint:'用 {{1}}、{{2}} 標記空格，每個空格設定答案；可填多個可接受答案，以 | 分隔。'},
  {value:'cloze',label:'完形填空 · Cloze',hint:'在文章中用 {{1}}、{{2}} 標記空格，為每格設定選項與答案。'},
  {value:'reading',label:'閱讀理解 · Reading',hint:'輸入閱讀材料，加入選擇、簡答或判斷子題。'},
  {value:'matching',label:'配對題 · Matching',hint:'每列輸入一組正確配對，預覽中右欄會以打亂順序呈現。'},
  {value:'ordering',label:'排序題 · Sequencing',hint:'按正確順序輸入句子或詞語，預覽會以打亂順序呈現。'},
  {value:'trueFalse',label:'判斷題 · True / False / Not given',hint:'可設定 True、False 或 Not given，並補充答案依據。'},
  {value:'short',label:'簡答／句子改寫 · Short answer',hint:'輸入題目、可接受答案及評分說明。'},
  {value:'listening',label:'聆聽理解 · Listening',hint:'關聯音頻資源或輸入音頻網址，加入選擇、簡答或判斷子題。'},
  {value:'writing',label:'寫作題 · Writing',hint:'設定文體、字數範圍、寫作任務、參考範文及評分標準。'},
  {value:'integrated',label:'綜合能力 · Integrated skills',hint:'輸入情境、資料文件及聆聽材料，設定輸出文體與評分標準。'},
  {value:'speaking',label:'口語題 · Speaking',hint:'設定朗讀、個人短講或小組討論任務，以及準備／作答時間。'},
];
export const typeLabel = type => questionTypes.find(x=>x.value===type)?.label.split(' · ')[0] || '未分類';
export const textTypes = ['writing','integrated','speaking'];
export function blankSubquestion(kind='choice') { return {kind,prompt:'',options:['','','',''],answer:''}; }
export function blankDetails(type) {
  const base={explanation:''};
  if(type==='choice') return {...base,options:['','','',''],answer:''};
  if(type==='fill') return {...base,answers:[''],wordBank:''};
  if(type==='cloze') return {...base,gaps:[{options:['','','',''],answer:''}]};
  if(['reading','listening'].includes(type)) return {passage:'',audioId:'',audioUrl:'',transcript:'',questions:[blankSubquestion()]};
  if(type==='matching') return {...base,pairs:[{left:'',right:''},{left:'',right:''}]};
  if(type==='ordering') return {...base,parts:['','']};
  if(type==='trueFalse') return {...base,answer:''};
  if(type==='short') return {...base,answer:''};
  return {genre:'email',minWords:80,maxWords:120,modelAnswer:'',rubric:[{criterion:'內容與任務完成',description:'涵蓋任務要求，內容具體'},{criterion:'語言運用',description:'詞彙、語法準確，表達清楚'},{criterion:'組織與連貫',description:'結構清晰，銜接自然'}],dataFile:'',audioId:'',audioUrl:'',transcript:'',speakingMode:'presentation',prepMinutes:2,responseMinutes:3};
}
export function blankQuestion() { return {title:'',grade:'',questionType:'',stem:'',details:{}}; }
// Resource-bank questions contain content only; marks belong to paper entries.
export function withoutQuestionScores(question) {
  const copy=structuredClone(question);
  delete copy.score;
  if(copy.details){delete copy.details.score;
    copy.details.questions?.forEach(row=>delete row.score);
    copy.details.rubric?.forEach(row=>{delete row.marks;});
  }
  return copy;
}
const filled = v => typeof v === 'string' && !!v.trim();
const positive = v => Number.isFinite(Number(v)) && Number(v)>0;
export function validateQuestion(q) {
  const errors=[]; const requireText=(value,label)=>{if(!filled(value))errors.push(`請填寫${label}`);};
  requireText(q.title,'名稱'); if(!grades.some(x=>x.value===q.grade))errors.push('請選擇年級');
  if(!questionTypes.some(x=>x.value===q.questionType)) { errors.push('請選擇題型'); return errors; }
  requireText(q.stem,'題幹／作答指示'); const d=q.details||{}; const kind=q.questionType;
  const choice=(row,label)=>{
    if(!Array.isArray(row.options)||row.options.length<2||row.options.some(x=>!filled(x)))errors.push(`${label}請填寫所有選項（至少 2 個）`);
    else if(new Set(row.options.map(x=>x.trim().toLowerCase())).size!==row.options.length)errors.push(`${label}選項不可重複`);
    if(!Number.isInteger(row.answer)||row.answer<0||row.answer>=(row.options?.length||0))errors.push(`${label}請選擇正確答案`);
  };
  if(kind==='choice')choice(d,'');
  if(['fill','cloze'].includes(kind)) {
    const rows=kind==='fill'?d.answers:d.gaps;
    if(!rows?.length) errors.push('至少設定一個空格');
    const markers=[...q.stem.matchAll(/\{\{(\d+)\}\}/g)].map(x=>Number(x[1]));
    if(!rows || markers.length!==rows.length || rows.some((_,i)=>!markers.includes(i+1)))errors.push('空格標記必須與答案一一對應：{{1}}、{{2}}…');
    rows?.forEach((row,i)=>kind==='fill'?requireText(row,`空格 ${i+1} 答案`):choice(row,`空格 ${i+1}：`));
  }
  if(kind==='matching') { if((d.pairs?.length||0)<2)errors.push('至少設定兩組配對');d.pairs?.forEach((row,i)=>{requireText(row.left,`配對 ${i+1} 左欄`);requireText(row.right,`配對 ${i+1} 右欄`);}); if(d.pairs && new Set(d.pairs.map(x=>x.right.trim())).size!==d.pairs.length)errors.push('配對右欄不可重複'); }
  if(kind==='ordering') {if((d.parts?.length||0)<2)errors.push('至少設定兩個排序項目');d.parts?.forEach((x,i)=>requireText(x,`排序項目 ${i+1}`));}
  if(kind==='trueFalse'&&!['True','False','Not given'].includes(d.answer))errors.push('請選擇判斷答案');
  if(kind==='short')requireText(d.answer,'參考答案');
  if(kind==='reading')requireText(d.passage,'閱讀材料');
  if(['listening','integrated'].includes(kind)) {
    if(!filled(d.audioId)&&!filled(d.audioUrl))errors.push('請關聯音頻或填寫音頻網址');
    if(d.audioUrl&&!/^https?:\/\//i.test(d.audioUrl))errors.push('音頻網址須以 http:// 或 https:// 開頭');
  }
  if(['reading','listening'].includes(kind)) {
    if(!d.questions?.length)errors.push('至少加入一道子題');
    d.questions?.forEach((row,i)=>{requireText(row.prompt,`子題 ${i+1} 題目`);if(row.kind==='choice')choice(row,`子題 ${i+1}：`);else if(row.kind==='trueFalse'){if(!['True','False','Not given'].includes(row.answer))errors.push(`子題 ${i+1} 請選擇答案`);}else if(row.kind==='short')requireText(row.answer,`子題 ${i+1} 參考答案`);else errors.push(`子題 ${i+1} 題型無效`);});
  }
  if(textTypes.includes(kind)) {
    requireText(d.modelAnswer,'參考答案／範文');
    if(!d.rubric?.length)errors.push('至少加入一項評分標準');
    d.rubric?.forEach((row,i)=>{requireText(row.criterion,`評分項目 ${i+1}`);});
    if(kind==='speaking'){if(!positive(d.prepMinutes)||!positive(d.responseMinutes))errors.push('準備和作答時間必須大於 0');}
    else if(!Number.isInteger(d.minWords)||!Number.isInteger(d.maxWords)||d.minWords<1||d.maxWords<d.minWords)errors.push('請設定有效字數範圍');
    if(kind==='integrated')requireText(d.dataFile,'資料文件');
  }
  return errors;
}
export function sampleQuestion(type='choice',grade='P3') {
  const details=blankDetails(type);
  let stem='Choose the correct answer. My sister ___ to school every day.';
  if(type==='choice')Object.assign(details,{options:['go','goes','going','gone'],answer:1,explanation:'A singular subject takes goes in the present simple.'});
  if(type==='fill'){stem='Tom {{1}} a book. His friends {{2}} football.';Object.assign(details,{answers:['reads','play'],wordBank:'reads, play, reading, plays'});}
  if(type==='cloze'){stem='I {{1}} to the park yesterday. It {{2}} sunny.';Object.assign(details,{gaps:[{options:['go','went','going','goes'],answer:1},{options:['is','are','was','were'],answer:2}]});}
  if(['reading','listening'].includes(type)){stem=type==='reading'?'Read the passage and answer the questions.':'Listen to the recording and answer the questions.';Object.assign(details,{passage:'Alex is a new student. He greets his classmates and tells them his name.',audioUrl:'/resources/greetings.wav',questions:[{kind:'choice',prompt:'What is the speaker’s name?',options:['Alex','Ben','Chris','David'],answer:0},{kind:'short',prompt:'Write one greeting.',answer:'Hello | Good morning | Good afternoon | Good evening'}]}); if(type==='reading'){details.audioUrl='';details.questions[0].prompt='What is the new student’s name?';details.questions[1].prompt='Who does Alex greet?';details.questions[1].answer='His classmates | classmates';} else {details.audioId='demo-greetings';details.audioUrl='';details.transcript='Hello! My name is Alex. Nice to meet you. Good morning. Good afternoon. Good evening.';}}
  if(type==='matching'){stem='Match the words with their meanings.';details.pairs=[{left:'happy',right:'feeling good'},{left:'tired',right:'needing rest'},{left:'hungry',right:'wanting food'}];}
  if(type==='ordering'){stem='Put the words in the correct order to make a sentence.';details.parts=['She','reads','a book','every day.'];}
  if(type==='trueFalse'){stem='Alex says “Good morning” in the recording.';details.answer='True';details.explanation='The speaker uses “Good morning”.';}
  if(type==='short'){stem='Rewrite using the past tense: I go to school.';details.answer='I went to school.';}
  if(textTypes.includes(type)){stem=type==='speaking'?'Talk about your favourite school activity. Explain why you enjoy it.':'Write an email to your friend about a school activity. Describe what happened and how you felt.';details.modelAnswer='Dear Sam,\nOur class visited a park last Friday. We watched birds and learned about trees. I enjoyed working with my friends. It was a wonderful day.\nBest wishes,\nAlex';if(type==='integrated'){details.dataFile='School notice: A park visit will take place on Friday. Students should bring water and a notebook.';details.audioId='demo-greetings';}if(type==='speaking')details.modelAnswer='My favourite school activity is reading club. We share stories and learn new words together.';}
  return withoutQuestionScores({title:`${typeLabel(type)}示例`,grade,questionType:type,stem,details});
}
export function upgradeDemoQuestions(items) {
  return items.map(item=>{
    if(item.type!=='questions'||item.kind!=='resource'||item.questionType||!/^questions-(\d+|nested)$/.test(item.id))return item;
    const kind=item.id==='questions-0'?'reading':item.id==='questions-1'?'choice':item.id==='questions-2'?'writing':'fill';
    return {...item,...sampleQuestion(kind),demo:true};
  });
}
