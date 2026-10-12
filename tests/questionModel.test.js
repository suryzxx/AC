import {test} from 'node:test';
import assert from 'node:assert/strict';
import {questionTypes,sampleQuestion,blankQuestion,validateQuestion,withoutQuestionScores,upgradeDemoQuestions} from '../src/questionModel.js';
test('every English question template is valid and survives JSON persistence',()=>{
 for(const type of questionTypes){const q=sampleQuestion(type.value);assert.deepEqual(validateQuestion(q),[],type.value);assert.deepEqual(JSON.parse(JSON.stringify(q)),q);assert.equal(q.details.score,undefined);}
});
test('grade, question type, and task are required',()=>{
 assert.ok(validateQuestion(blankQuestion()).includes('請選擇年級'));
 const q=sampleQuestion();q.grade='P7';assert.ok(validateQuestion(q).includes('請選擇年級'));
});
test('choice requires unique options and an answer that exists',()=>{
 const q=sampleQuestion();q.details.answer=4;assert.ok(validateQuestion(q).length);
 q.details.answer=1;q.details.options[0]=' GOES ';assert.ok(validateQuestion(q).some(x=>x.includes('不可重複')));
});
test('gap markers must correspond to each answer exactly once',()=>{
 const q=sampleQuestion('fill');q.stem='{{1}} and {{1}}';assert.ok(validateQuestion(q).some(x=>x.includes('一一對應')));
 q.stem='{{1}} and {{2}}';q.details.answers[1]='';assert.ok(validateQuestion(q).some(x=>x.includes('空格 2 答案')));
});
test('reading validates each child question without requiring marks',()=>{
 const q=sampleQuestion('reading');assert.deepEqual(validateQuestion(q),[]);assert.equal(q.details.questions[1].score,undefined);
 q.details.questions[1].answer='';assert.ok(validateQuestion(q).some(x=>x.includes('子題 2 參考答案')));
 q.details.questions=[];assert.ok(validateQuestion(q).some(x=>x.includes('至少加入一道子題')));
});
test('listening and integrated tasks require playable media association',()=>{
 for(const type of ['listening','integrated']){const q=sampleQuestion(type);q.details.audioId='';assert.ok(validateQuestion(q).some(x=>x.includes('關聯音頻')));q.details.audioUrl='wrong';assert.ok(validateQuestion(q).some(x=>x.includes('網址須')));}
});
test('writing criteria have no marks and word limits must be valid',()=>{
 const q=sampleQuestion('writing');assert.deepEqual(validateQuestion(q),[]);assert.equal(q.details.rubric[0].marks,undefined);
 q.details.maxWords=20;assert.ok(validateQuestion(q).some(x=>x.includes('字數範圍')));
});
test('upgrade only untouched demo records and preserve user and media records',()=>{
 const records=[{id:'questions-0',type:'questions',kind:'resource',parent:'f',date:'2026-10-12'},{id:'mine',type:'questions',kind:'resource',stem:'User text'},{id:'audio-0',type:'audio',kind:'resource'},{...sampleQuestion('short'),id:'questions-1',type:'questions',kind:'resource'}];
 const result=upgradeDemoQuestions(records);assert.equal(result[0].questionType,'reading');assert.equal(result[0].parent,'f');assert.deepEqual(result.slice(1),records.slice(1));
});
