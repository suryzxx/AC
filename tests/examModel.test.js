import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleQuestion,withoutQuestionScores} from '../src/questionModel.js';
import {blankExam,examEntry,entryMarks,examMarks,validateExam,moveEntry} from '../src/examModel.js';
const paper=()=>({...blankExam(),title:'English test',grade:'P3'});
const question=type=>({...sampleQuestion(type),id:type});
test('a paper requires basic information and at least one question',()=>{
 assert.deepEqual(validateExam(paper(),true),[]);assert.ok(validateExam(paper()).includes('請至少添加一道試題'));
 assert.ok(validateExam({...paper(),academicYear:'2026/2026'},true).length);
});
test('adding a question requires marks in this paper, not in the resource bank',()=>{
 const q=question('choice');const p=paper();p.entries=[examEntry(q,'entry')];
 assert.ok(validateExam(p).some(x=>x.includes('分數')));p.entries[0].marks=[5];assert.deepEqual(validateExam(p),[]);assert.equal(examMarks(p),5);assert.equal(q.details.score,undefined);
 p.entries[0].marks=[0];assert.ok(validateExam(p).length);p.entries[0].marks=[NaN];assert.ok(validateExam(p).length);
});
test('reading child marks are required individually and sum to paper total',()=>{
 const p=paper();p.entries=[examEntry(question('reading'),'reading'),examEntry(question('choice'),'choice')];
 p.entries[0].marks=[2,null];p.entries[1].marks=[5];assert.ok(validateExam(p).length);
 p.entries[0].marks=[2,3];assert.deepEqual(validateExam(p),[]);assert.equal(entryMarks(p.entries[0]),5);assert.equal(examMarks(p),10);
 p.entries[0].marks=[2];assert.ok(validateExam(p).length);
});
test('papers use independent question snapshots and independent marks',()=>{
 const q=question('choice');const a=examEntry(q,'a');const b=examEntry(q,'b');a.marks=[2];b.marks=[8];q.details.options[0]='Changed';
 assert.equal(a.question.details.options[0],'go');assert.equal(b.question.details.options[0],'go');assert.equal(entryMarks(a),2);assert.equal(entryMarks(b),8);
 assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
});
test('reordering retains question identity and marks; duplicated questions are rejected',()=>{
 const a=examEntry(question('choice'),'a');a.marks=[2];const b=examEntry(question('reading'),'b');b.marks=[3,4];
 const moved=moveEntry([a,b],1,-1);assert.equal(moved[0],b);assert.equal(entryMarks(moved[0]),7);assert.deepEqual(moveEntry(moved,0,-1),moved);
 const p=paper();p.entries=[a,{...a,id:'copy'}];assert.ok(validateExam(p).includes('試題不可重複添加'));
});
test('legacy scores are removed while content, answers and marking criteria survive',()=>{
 const q=question('reading');q.details.score=10;q.details.questions[0].score=5;q.details.rubric=[{criterion:'Content',marks:4}];
 const clean=withoutQuestionScores(q);assert.equal(clean.details.score,undefined);assert.equal(clean.details.questions[0].score,undefined);assert.equal(clean.details.rubric[0].marks,undefined);assert.equal(clean.details.questions[0].answer,0);assert.equal(clean.details.rubric[0].criterion,'Content');assert.equal(q.details.score,10);
});
