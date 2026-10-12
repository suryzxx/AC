import { grades, withoutQuestionScores } from './questionModel.js';
export const EXAM_STORE='ac-exam-papers-v1';
export function blankExam(){return {title:'',grade:'',subject:'English',academicYear:'2026/2027',term:'first',duration:45,instructions:'Answer all questions.',description:'',entries:[]};}
export function questionUnits(question){return ['reading','listening'].includes(question.questionType)?(question.details?.questions||[]).map((row,i)=>({label:`Q${i+1} · ${row.prompt}`})):[{label:'試題分數'}];}
export function examEntry(question,id){return {id,questionId:question.id,question:withoutQuestionScores(question),marks:questionUnits(question).map(()=>null)};}
export function entryMarks(entry){return (entry.marks||[]).reduce((sum,value)=>sum+Number(value||0),0);}
export function examMarks(exam){return exam.entries.reduce((sum,row)=>sum+entryMarks(row),0);}
export function validateExam(exam,basicOnly=false){
 const errors=[];
 if(!exam.title?.trim())errors.push('請填寫試卷名稱');
 if(!grades.some(x=>x.value===exam.grade))errors.push('請選擇年級');
 if(!/^\d{4}\/\d{4}$/.test(exam.academicYear||'') || Number(exam.academicYear.slice(5))!==Number(exam.academicYear.slice(0,4))+1)errors.push('學年格式應為連續兩年，例如 2026/2027');
 if(!['first','second','annual'].includes(exam.term))errors.push('請選擇學期');
 if(!Number.isInteger(exam.duration)||exam.duration<=0)errors.push('考試時長須為正整數');
 if(basicOnly)return errors;
 if(!exam.entries.length)errors.push('請至少添加一道試題');
 if(new Set(exam.entries.map(x=>x.questionId)).size!==exam.entries.length)errors.push('試題不可重複添加');
 exam.entries.forEach((entry,i)=>{
   const units=questionUnits(entry.question);
   if(!units.length||entry.marks?.length!==units.length||entry.marks.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<=0))errors.push(`第 ${i+1} 題請填寫所有分數，且分數須大於 0`);
 });
 return errors;
}
export function moveEntry(entries,index,direction){const target=index+direction;if(target<0||target>=entries.length)return entries;const next=[...entries];[next[index],next[target]]=[next[target],next[index]];return next;}
