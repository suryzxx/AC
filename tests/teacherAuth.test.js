import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const map = JSON.parse(await readFile(new URL('../src/zh-hans-map.json', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../src/teacherAuth.js', import.meta.url), 'utf8')).replace("import { simplify } from './language.js';", `const map = ${JSON.stringify(map)}; const simplify = text => text.replace(/[\\u3400-\\u9fff]/g, char => map[char] || char);`);
const {hashTeacherPassword, authenticateTeacher} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('full and part time teachers authenticate only with their own credentials', async () => {
  const credentials = await hashTeacherPassword('teacher-secret');
  assert.notEqual(credentials.hash, 'teacher-secret');
  for (const type of ['full','part']) {
    const teachers = [{id:type,name:'陳老師',type,passwordHash:credentials.hash,passwordSalt:credentials.salt}];
    assert.equal(await authenticateTeacher(teachers,' 陈老师 ', 'teacher-secret'),type);
    assert.equal(await authenticateTeacher(teachers,'陳老師', 'wrong'),null);
    assert.equal(await authenticateTeacher(teachers,'其他老師', 'teacher-secret'),null);
  }
});
test('unset passwords and ambiguous names cannot log in; random salts differ', async () => {
  assert.equal(await authenticateTeacher([{id:'t1',name:'李老師'}],'李老師',''),null);
  const a = await hashTeacherPassword('same-secret');
  const b = await hashTeacherPassword('same-secret');
  assert.notEqual(a.salt,b.salt); assert.notEqual(a.hash,b.hash);
  assert.equal(await authenticateTeacher([{name:'李老師'},{name:'李老师'}],'李老師','same-secret'),null);
});
