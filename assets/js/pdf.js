/* Friendship Court — tiny dependency-free PDF writer: one A4 page containing a JPEG of the agreement */
(function () {
  'use strict';
  function b64ToBytes(b64) { var bin = atob(b64), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function ascii(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; }
  function pdfStr(s) { return String(s).replace(/[^\x20-\x7E]/g, '').replace(/([\\()])/g, '\\$1'); }

  function fromCanvas(canvas, title) {
    var url = canvas.toDataURL('image/jpeg', 0.92);
    if (url.indexOf('data:image/jpeg') !== 0) throw new Error('JPEG encoding not supported');
    var img = b64ToBytes(url.split(',')[1]);
    var W = '595.28', H = '841.89', chunks = [], len = 0, offs = [];
    function add(x) { var b = typeof x === 'string' ? ascii(x) : x; chunks.push(b); len += b.length; }
    function obj(n, parts) { offs[n] = len; add(n + ' 0 obj\n'); (Array.isArray(parts) ? parts : [parts]).forEach(add); add('\nendobj\n'); }
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    obj(4, ['<< /Type /XObject /Subtype /Image /Width ' + canvas.width + ' /Height ' + canvas.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.length + ' >>\nstream\n', img, '\nendstream']);
    var cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q';
    obj(5, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
    obj(6, '<< /Title (' + pdfStr(title || 'Friendship Misconduct Agreement') + ') /Producer (Friendship Court) /Creator (Friendship Court) >>');
    var xref = len, x = 'xref\n0 7\n0000000000 65535 f \n';
    for (var i = 1; i <= 6; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    add(x + 'trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(chunks, { type: 'application/pdf' });
  }
  window.FC = window.FC || {};
  window.FC.pdfFromCanvas = fromCanvas;
})();
