// Render current invoice fields with the browser's Chinese font, then package as a PDF.
export function packPdfPages(pages) {
  const enc = new TextEncoder(), chunks = [], offsets = [0]; let size = 0;
  const add = value => { const bytes = typeof value === 'string' ? enc.encode(value) : value; chunks.push(bytes); size += bytes.length; };
  const obj = (id, body, stream) => { offsets[id] = size; add(`${id} 0 obj\n${body}`); if (stream) { add('\nstream\n'); add(stream); add('\nendstream'); } add('\nendobj\n'); };
  add('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
  pages.forEach((jpeg,i)=>{ const id=3+i*3, draw=enc.encode('q 595 0 0 842 0 0 cm /Img Do Q');
    obj(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Img ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
    obj(id+1, `<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,jpeg);
    obj(id+2, `<< /Length ${draw.length} >>`,draw);
  });
  const xref=size, count=3+pages.length*3;
  add(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for(let i=1;i<count;i++) add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  add(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks,{type:'application/pdf'});
}
export function renderInvoicePdf(invoice, student, kind = 'invoice') {
  const pages=[], previewPages=[], canvas=document.createElement('canvas'); canvas.width=1240;canvas.height=1754;
  const ctx=canvas.getContext('2d'); let y;
  const reset=()=>{ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#1d1d1f';ctx.font='28px -apple-system, sans-serif';y=96;};
  const flush=()=>{const dataUrl=canvas.toDataURL('image/jpeg',0.95);previewPages.push(dataUrl);const binary=atob(dataUrl.split(',')[1]);pages.push(Uint8Array.from(binary,c=>c.charCodeAt(0)));};
  const line=(text='',bold=false)=>{ctx.font=`${bold?'600 ':''}28px -apple-system, sans-serif`;let row='';for(const char of String(text)){if(ctx.measureText(row+char).width>1048){if(y>1610){flush();reset();}ctx.fillText(row,96,y);y+=44;row='';}row+=char;}if(y>1610){flush();reset();}ctx.fillText(row,96,y);y+=44;};
  const cash=value=>`HK$ ${Number(value||0).toFixed(2)}`;
  reset();line('AC EDUCATION',true);line(invoice.voided?'已作廢':kind==='receipt'?'收據 RECEIPT':'帳單 INVOICE',true);line(kind==='receipt'?invoice.receiptNo:invoice.no);line(`日期：${kind==='receipt'?(invoice.paidDate||invoice.date):invoice.date}`);line(`學生：${student.name} ${student.english||''}`);line(`家長：${student.parent||''}`);line();
  invoice.lines.forEach(l=>{line(l.description,true);if(l.duration)line(l.duration);if(l.lessonDate||l.time)line(`${l.lessonDate||''} ${l.time||''}`);line(`${l.quantity} × ${cash(l.unitPrice)} = ${cash(l.quantity*l.unitPrice)}`);line();});
  line(`小計：${cash(invoice.subtotal)}`);line(`附加費：${cash(invoice.surcharge)}`);line(`折扣：${cash(invoice.discount)}`);line(`合計：${cash(invoice.total)}`,true);if(invoice.paid)line(`已收款：${invoice.method||''} · ${invoice.paidDate||''}`);if(invoice.remarks)line(`備註：${invoice.remarks}`);if(invoice.issuer)line(`發行人：${invoice.issuer}`);line();line('DEMO · 示範單據，非正式收費憑證');flush();return {blob:packPdfPages(pages),previewPages};
}
export function invoiceDocuments(invoices) {
  return [...invoices].sort((a,b)=>b.date.localeCompare(a.date)).flatMap(i=>[{invoice:i,kind:'invoice',name:`${i.no}.pdf`,date:i.date},...(i.paid&&i.receiptNo?[{invoice:i,kind:'receipt',name:`${i.receiptNo}.pdf`,date:i.paidDate||i.date}]:[])]);
}

export function invoicePdf(invoice, student, kind = 'invoice') { return renderInvoicePdf(invoice, student, kind).blob; }
