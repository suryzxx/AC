import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weekDates,calendarBounds,calendarState} from '../src/parentWeek.js';
import {invoiceDocuments,packPdfPages} from '../src/invoicePdf.js';
test('calendar starts Monday, includes Sunday and sizes to actual lesson hours',()=>{
 assert.deepEqual(weekDates('2026-10-18'),['2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16','2026-10-17','2026-10-18']);
 assert.deepEqual(calendarBounds([{start:'07:30',end:'21:30'}]),{start:420,end:1320});
});
test('calendar state uses attendance and time including ongoing and pending lessons',()=>{
 const s={date:'2026-10-13',start:'10:00',end:'11:00',status:'scheduled',attendance:{}};
 const at=t=>Date.parse(`2026-10-13T${t}:00+08:00`);
 assert.equal(calendarState(s,'s1',at('09:00')).key,'upcoming');
 assert.equal(calendarState(s,'s1',at('10:30')).key,'ongoing');
 assert.equal(calendarState(s,'s1',at('11:00')).key,'pending');
 assert.equal(calendarState({...s,status:'completed'},'s1').key,'completed');
 assert.equal(calendarState({...s,attendance:{s1:'absent'}},'s1').key,'absent');
 assert.equal(calendarState({...s,status:'cancelled'},'s1').key,'cancelled');
});
test('PDF list uses issued invoice numbers and receipts only when actually paid',()=>{
 const docs=invoiceDocuments([{id:'a',no:'INV1',date:'2026-10-13',paid:false,receiptNo:'REC1'},{id:'b',no:'INV2',date:'2026-10-12',paid:true,receiptNo:'REC2'}]);
 assert.deepEqual(docs.map(d=>d.name),['INV1.pdf','INV2.pdf','REC2.pdf']);
});
test('PDF package contains binary image streams and valid xref offsets',async()=>{
 const pdf=packPdfPages([new Uint8Array([255,216,255,217]),new Uint8Array([255,216,255,217])]);
 assert.equal(pdf.type,'application/pdf');
 const bytes=new Uint8Array(await pdf.arrayBuffer());const text=new TextDecoder('latin1').decode(bytes);
 assert.ok(text.startsWith('%PDF-1.4'));assert.ok(text.includes('/Count 2'));
 const offset=Number(text.match(/startxref\n(\d+)/)[1]);
 assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+4)),'xref');
});
