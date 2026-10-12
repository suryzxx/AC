import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResourceTask,taskStatus,acceptResourceTask} from '../src/aiResourceModel.js';
import {questionTypes,validateQuestion,sampleQuestion} from '../src/questionModel.js';
const config={type:'questions',mode:'generate',prompt:'English practice',grade:'P3',count:2,parent:null};
test('all fixed question formats are valid and wait for review before insertion',()=>{
  for(const {value} of questionTypes){
    const job=createResourceTask({...config,questionType:value},[],100);
    assert.equal(taskStatus(job,101),'running');
    assert.throws(()=>acceptResourceTask(job,[job.results[0].id],[],101));
    job.results.forEach(q=>assert.deepEqual(validateQuestion(q),[]));
    const saved=acceptResourceTask(job,[job.results[0].id],[],12100);
    assert.equal(saved.length,1);
    assert.deepEqual(acceptResourceTask(job,[job.results[0].id],saved,12100),saved);
  }
});
test('paper uses matching bank questions and preserves order in its folder',()=>{
 const bank=[0,1,2].map(i=>({...sampleQuestion('choice','P3'),id:String(i),type:'questions',kind:'resource'}));
 assert.throws(()=>createResourceTask({...config,mode:'paper',grade:'P4'},bank));
 const job=createResourceTask({...config,mode:'paper'},bank,0);
 job.results.reverse();
 const saved=acceptResourceTask(job,job.results.map(q=>q.id),bank,12000);
 assert.equal(saved[3].kind,'folder');
 assert.equal(saved[4].parent,saved[3].id);
 assert.equal(saved[4].id,job.results[0].id);
 assert.equal(bank.length,3);
});
test('image import requires source and cancelled tasks cannot be accepted',()=>{
 assert.throws(()=>createResourceTask({...config,mode:'extract'},[]));
 const job=createResourceTask({...config,mode:'extract',image:'data:image/png;base64,example'},[],0);
 assert.equal(job.image,'data:image/png;base64,example');
 assert.throws(()=>acceptResourceTask({...job,status:'cancelled'},job.results.map(q=>q.id),[],20000));
});
