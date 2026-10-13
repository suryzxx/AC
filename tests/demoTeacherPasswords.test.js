import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pbkdf2Sync} from 'node:crypto';
import {upgradeDemoTeacherPasswords} from '../src/demoTeacherPasswords.js';
test('all demo teachers use the requested password, custom teachers are preserved and later edits survive',()=>{
 const custom={id:'custom',name:'自建老師',passwordHash:'custom-hash'};
 const db={teachers:[...['t1','t2','t3','demo-teacher-kk'].map(id=>({id,name:id})),custom]};
 const next=upgradeDemoTeacherPasswords(db);
 for(const teacher of next.teachers.slice(0,4)) assert.equal(teacher.passwordHash,pbkdf2Sync('123456',teacher.passwordSalt,100000,32,'sha256').toString('hex'));
 assert.equal(next.teachers[4],custom);assert.equal(db.teachers[0].passwordHash,undefined);
 next.teachers[0].passwordHash='edited';assert.equal(upgradeDemoTeacherPasswords(next),next);assert.equal(next.teachers[0].passwordHash,'edited');
});
