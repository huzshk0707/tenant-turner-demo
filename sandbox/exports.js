'use strict';

window.LeasingExports = (() => {
  const mime = {
    csv:'text/csv;charset=utf-8',
    xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf:'application/pdf',
  };
  const encoder = new TextEncoder();
  const sheetCell = cell => {
    const value = String(cell ?? '');
    return typeof cell !== 'number' && /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  };
  const csv = rows => rows.map(row => row.map(cell => `"${sheetCell(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const tsv = rows => rows.map(row => row.map(cell => sheetCell(cell).replace(/[\r\n\t]+/g,' ')).join('\t')).join('\n');
  const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'')
    .replace(/[&<>]/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);

  function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i=0; i<8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  }

  function zip(files) {
    const body = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;
    for (const [filename,contents] of Object.entries(files)) {
      const name = encoder.encode(filename);
      const data = encoder.encode(contents);
      const checksum = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0,0x04034b50,true);
      local.setUint16(4,20,true);
      local.setUint16(12,33,true);
      local.setUint32(14,checksum,true);
      local.setUint32(18,data.length,true);
      local.setUint32(22,data.length,true);
      local.setUint16(26,name.length,true);
      body.push(local.buffer,name,data);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0,0x02014b50,true);
      entry.setUint16(4,20,true);
      entry.setUint16(6,20,true);
      entry.setUint16(14,33,true);
      entry.setUint32(16,checksum,true);
      entry.setUint32(20,data.length,true);
      entry.setUint32(24,data.length,true);
      entry.setUint16(28,name.length,true);
      entry.setUint32(42,offset,true);
      directory.push(entry.buffer,name);
      offset += local.byteLength + name.length + data.length;
      directorySize += entry.byteLength + name.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0,0x06054b50,true);
    end.setUint16(8,directory.length/2,true);
    end.setUint16(10,directory.length/2,true);
    end.setUint32(12,directorySize,true);
    end.setUint32(16,offset,true);
    return [...body,...directory,end.buffer];
  }

  function workbook(rows) {
    const packageNs = 'http://schemas.openxmlformats.org/package/2006';
    const officeNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const spreadsheetNs = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const columns = rows[0].map((heading,index) => {
      const width = rows.reduce((largest,row) => Math.max(largest,String(row[index] ?? '').length),heading.length);
      return `<col min="${index+1}" max="${index+1}" width="${Math.min(48,width+4)}" customWidth="1"/>`;
    }).join('');
    const cells = rows.map((row,index) => `<row r="${index+1}">${row.map(cell => typeof cell === 'number' && Number.isFinite(cell)
      ? `<c><v>${cell}</v></c>` : `<c t="inlineStr"><is><t xml:space="preserve">${xml(cell)}</t></is></c>`).join('')}</row>`).join('');
    return zip({
      '[Content_Types].xml':`<Types xmlns="${packageNs}/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      '_rels/.rels':`<Relationships xmlns="${packageNs}/relationships"><Relationship Id="rId1" Type="${officeNs}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      'xl/workbook.xml':`<workbook xmlns="${spreadsheetNs}" xmlns:r="${officeNs}"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels':`<Relationships xmlns="${packageNs}/relationships"><Relationship Id="rId1" Type="${officeNs}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      'xl/worksheets/sheet1.xml':`<worksheet xmlns="${spreadsheetNs}"><cols>${columns}</cols><sheetData>${cells}</sheetData></worksheet>`,
    });
  }

  function wrapLines(ctx,value,maxWidth) {
    const lines = [''];
    for (const word of String(value ?? '').trim().split(/\s+/)) {
      const line = lines.at(-1);
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) lines[lines.length-1] = candidate;
      else {
        if (line) lines.push('');
        for (const char of word) {
          const next = lines.at(-1) + char;
          if (ctx.measureText(next).width <= maxWidth) lines[lines.length-1] = next;
          else lines.push(char);
        }
      }
    }
    return lines;
  }

  function pdfPages(title,rows) {
    const width = 792, height = 612, margin = 32, spacing = 13, cellPadding = 6;
    const canvas = document.createElement('canvas');
    canvas.width = width*2;
    canvas.height = height*2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2,2);
    const tableWidth = width-margin*2;
    const weight = heading => /activity|feedback|channels|instructions|email/i.test(heading) ? 1.65 : 1;
    const weights = rows[0].map(weight);
    const totalWeight = weights.reduce((total,w) => total+w,0);
    const colWidths = weights.map(w => tableWidth*w/totalWeight);
    const pages = [];
    let y = 0;

    function drawRow(lines,count,background,color) {
      const rowHeight = count*spacing + cellPadding*2;
      ctx.fillStyle = background;
      ctx.fillRect(margin,y,tableWidth,rowHeight);
      ctx.fillStyle = color;
      let x = margin;
      lines.forEach((items,index) => {
        items.forEach((item,i) => ctx.fillText(item,x+cellPadding,y+cellPadding+i*spacing));
        x += colWidths[index];
      });
      y += rowHeight;
    }

    function beginPage() {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,width,height);
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#201b36';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(title,margin,margin);
      y = margin+36;
      ctx.font = 'bold 10px sans-serif';
      const header = rows[0].map((cell,i) => wrapLines(ctx,cell,colWidths[i]-cellPadding*2));
      drawRow(header,Math.max(...header.map(cell => cell.length)),'#302553','#fff');
      ctx.font = '10px sans-serif';
    }

    function endPage() {
      ctx.fillStyle = '#524967';
      ctx.font = '9px sans-serif';
      ctx.fillText(`Leasing Lab  •  Page ${pages.length+1}`,margin,height-margin+8);
      const base64 = canvas.toDataURL('image/jpeg',0.92).split(',')[1];
      pages.push(Uint8Array.from(atob(base64),char => char.charCodeAt(0)));
    }

    beginPage();
    if (rows.length === 1) ctx.fillText('No results match these filters.',margin,y+14);
    rows.slice(1).forEach((row,index) => {
      const lines = row.map((cell,i) => wrapLines(ctx,cell,colWidths[i]-cellPadding*2));
      const lineCount = Math.max(...lines.map(cell => cell.length));
      const linesLeft = () => Math.floor((height-margin-y-cellPadding*2)/spacing);
      if (lineCount > linesLeft() && y > margin+84) { endPage(); beginPage(); }
      for (let start=0; start<lineCount;) {
        const count = Math.min(lineCount-start,linesLeft());
        drawRow(lines.map(cell => cell.slice(start,start+count)),count,index%2 ? '#f0edf6' : '#fff','#211e32');
        start += count;
        if (start < lineCount) { endPage(); beginPage(); }
      }
    });
    endPage();
    return {pages,width,height};
  }

  function pdf(title,rows) {
    const {pages,width,height} = pdfPages(title,rows);
    const output = [];
    const offsets = [0];
    let length = 0;
    function append(part) {
      const bytes = typeof part === 'string' ? encoder.encode(part) : part;
      output.push(bytes);
      length += bytes.length;
    }
    function object(...parts) {
      append(`${offsets.length} 0 obj\n`);
      offsets.push(length-output.at(-1).length);
      parts.forEach(append);
      append('\nendobj\n');
    }
    append('%PDF-1.4\n');
    object('<< /Type /Catalog /Pages 2 0 R >>');
    object(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i) => `${3+i*3} 0 R`).join(' ')}] >>`);
    pages.forEach((bytes,index) => {
      const page = 3+index*3;
      const draw = `q ${width} 0 0 ${height} 0 0 cm /Table Do Q\n`;
      object(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Table ${page+1} 0 R >> >> /Contents ${page+2} 0 R >>`);
      object(`<< /Type /XObject /Subtype /Image /Width ${width*2} /Height ${height*2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,bytes,'\nendstream');
      object(`<< /Length ${draw.length} >>\nstream\n${draw}endstream`);
    });
    const xref = length;
    append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
    for (const offset of offsets.slice(1)) append(`${String(offset).padStart(10,'0')} 00000 n \n`);
    append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return output;
  }

  async function copy(rows) {
    const value = tsv(rows);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const selection = document.activeElement;
      const input = document.createElement('textarea');
      input.className = 'sr-only';
      input.value = value;
      document.body.append(input);
      input.select();
      try {
        if (!document.execCommand('copy')) throw new Error('Clipboard access is unavailable.');
      } finally {
        input.remove();
        selection?.focus({preventScroll:true});
      }
    }
  }

  function download(format,id,title,rows) {
    const data = format === 'xlsx' ? workbook(rows) : format === 'pdf' ? pdf(title,rows) : [csv(rows)];
    const url = URL.createObjectURL(new Blob(data,{type:mime[format]}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `leasing-lab-${id}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  return {copy,download};
})();
