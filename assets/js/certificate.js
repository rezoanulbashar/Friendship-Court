/* Friendship Court — certificate renderer (draws the agreement on a canvas, A4 proportions) */
(function () {
  'use strict';
  var C = { paper: '#F7F0DF', navy: '#18223B', burg: '#7B1E2B', gold: '#B4873A', goldD: '#8C6526', goldL: '#D9B76A', red: '#C1272D', ink: '#272A3A' };
  var F = {
    display: '"DM Serif Display", Georgia, "Times New Roman", serif',
    body: '"EB Garamond", Georgia, "Times New Roman", serif',
    type: '"Special Elite", "Courier New", Courier, monospace',
    script: 'Caveat, "Segoe Script", "Brush Script MT", cursive'
  };
  var DW = 1000, DH = 1414;

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var fontsReady = null;
  function ensureFonts() {
    if (fontsReady) return fontsReady;
    if (!document.fonts || !document.fonts.load) { fontsReady = Promise.resolve(); return fontsReady; }
    var list = ['400 30px "DM Serif Display"', '400 20px "EB Garamond"', '600 20px "EB Garamond"', '700 20px "EB Garamond"', 'italic 400 20px "EB Garamond"', '400 20px "Special Elite"', '700 30px Caveat'];
    var all = Promise.all(list.map(function (f) { return document.fonts.load(f, 'AaBb€§').catch(function () {}); }));
    fontsReady = Promise.race([all, new Promise(function (r) { setTimeout(r, 3000); })]);
    return fontsReady;
  }

  function spaced(ctx, text, x, y, sp, align) {
    var chars = Array.from(text), widths = chars.map(function (c) { return ctx.measureText(c).width; });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + sp * (chars.length - 1);
    var cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    var prev = ctx.textAlign; ctx.textAlign = 'left';
    chars.forEach(function (c, i) { ctx.fillText(c, cx, y); cx += widths[i] + sp; });
    ctx.textAlign = prev; return total;
  }
  function fit(ctx, text, maxW, size, weight, fam, min) {
    var s = size; ctx.font = weight + ' ' + s + 'px ' + fam;
    while (ctx.measureText(text).width > maxW && s > min) { s -= 1; ctx.font = weight + ' ' + s + 'px ' + fam; }
    return s;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function diamond(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill(); }

  // rich text: **bold** segments
  function layout(ctx, text, maxW, fs, italic) {
    var words = [];
    text.split(/(\*\*[^*]+\*\*)/).forEach(function (p) {
      if (!p) return; var b = /^\*\*[\s\S]*\*\*$/.test(p);
      (b ? p.slice(2, -2) : p).split(/\s+/).forEach(function (t) { if (t) words.push({ t: t, b: b }); });
    });
    var f = function (b) { return (italic ? 'italic ' : '') + (b ? '700 ' : '400 ') + fs + 'px ' + F.body; };
    ctx.font = f(false); var sp = ctx.measureText(' ').width;
    var lines = [[]], w = 0;
    function push(o) { var cur = lines[lines.length - 1]; var add = (cur.length ? sp : 0) + o.w; if (cur.length && w + add > maxW) { lines.push([o]); w = o.w; } else { cur.push(o); w += add; } }
    words.forEach(function (wd) {
      ctx.font = f(wd.b); var t = wd.t, ww = ctx.measureText(t).width;
      if (ww > maxW) { var chunk = ''; Array.from(t).forEach(function (ch) { if (ctx.measureText(chunk + ch).width > maxW) { push({ t: chunk, b: wd.b, w: ctx.measureText(chunk).width }); chunk = ch; } else chunk += ch; }); t = chunk; ww = ctx.measureText(t).width; }
      push({ t: t, b: wd.b, w: ww });
    });
    return { lines: lines, sp: sp, f: f };
  }
  function drawLayout(ctx, L, x, y, lh) {
    L.lines.forEach(function (line, i) {
      var cx = x;
      line.forEach(function (o) { ctx.font = L.f(o.b); ctx.fillStyle = o.b ? C.burg : C.ink; ctx.fillText(o.t, cx, y + i * lh); cx += o.w + L.sp; });
    });
    return L.lines.length * lh;
  }

  function drawPhoto(ctx, img, x, y, w, h, sample) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (img) {
      var sw = img.width, sh = img.height, r = Math.max(w / sw, h / sh), cw = w / r, ch = h / r;
      var sx = (sw - cw) / 2, sy = Math.max(0, (sh - ch) * 0.3);
      ctx.drawImage(img, sx, sy, cw, ch, x, y, w, h);
    } else {
      ctx.fillStyle = C.navy; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 8;
      for (var i = -h; i < w + h; i += 22) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i - h, y + h); ctx.stroke(); }
      ctx.fillStyle = C.goldL; ctx.textAlign = 'center';
      ctx.font = '400 120px ' + F.display; ctx.fillText('?', x + w / 2, y + h / 2 + 30);
      ctx.font = '400 13px ' + F.type; spaced(ctx, sample ? 'PHOTO OF THE ACCUSED' : 'IDENTITY WITHHELD', x + w / 2, y + h - 26, 1.5, 'center');
    }
    ctx.restore();
  }

  function drawStamp(ctx, cx, cy, rot, sc) {
    var w = 400, h = 150, k = 2, s = document.createElement('canvas');
    s.width = w * k; s.height = h * k; var g = s.getContext('2d'); g.scale(k, k);
    g.fillStyle = 'rgba(247,240,223,0.8)'; rr(g, 6, 6, w - 12, h - 12, 12); g.fill();
    g.strokeStyle = C.red; g.fillStyle = C.red;    g.lineWidth = 7; rr(g, 6, 6, w - 12, h - 12, 12); g.stroke();
    g.lineWidth = 2; rr(g, 18, 18, w - 36, h - 36, 6); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    var gs = fit(g, 'GUILTY', w - 70, 74, '400', F.display, 40);
    g.font = '400 ' + gs + 'px ' + F.display; spaced(g, 'GUILTY', w / 2, 88, 4, 'center');
    g.font = '400 20px ' + F.type; spaced(g, 'OF BEING ANNOYING', w / 2, 121, 3, 'center');
    g.globalCompositeOperation = 'destination-out'; var r = rng(11);
    for (var i = 0; i < 650; i++) { g.globalAlpha = 0.25 + r() * 0.75; g.beginPath(); g.arc(r() * w, r() * h, r() * 1.7 + 0.3, 0, 7); g.fill(); }
    g.globalAlpha = 0.5; g.lineWidth = 1.2;
    for (var j = 0; j < 7; j++) { g.beginPath(); var sx = r() * w, sy = r() * h; g.moveTo(sx, sy); g.lineTo(sx + 40 + r() * 80, sy + (r() - .5) * 14); g.stroke(); }
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc || 1, sc || 1); ctx.globalAlpha = 0.9; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(s, -w / 2, -h / 2, w, h); ctx.restore();
  }

  function circleText(ctx, text, cx, cy, r) {
    var chars = Array.from(text), ws = chars.map(function (c) { return ctx.measureText(c).width; });
    var total = ws.reduce(function (a, b) { return a + b; }, 0), extra = (2 * Math.PI * r - total) / chars.length;
    var a = -Math.PI / 2 - 0; ctx.save(); ctx.translate(cx, cy); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    chars.forEach(function (c, i) { var ang = (ws[i] + extra) / r; ctx.save(); ctx.rotate(a + ang / 2 + Math.PI / 2); ctx.fillText(c, 0, -r); ctx.restore(); a += ang; });
    ctx.restore(); ctx.textBaseline = 'alphabetic';
  }

  function drawSeal(ctx, cx, cy) {
    // ribbons
    ctx.fillStyle = C.burg;
    [[-1, -0.35], [1, 0.35]].forEach(function (d) {
      ctx.save(); ctx.translate(cx + d[0] * 18, cy + 40); ctx.rotate(d[1]);
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(16, 70); ctx.lineTo(0, 58); ctx.lineTo(-16, 70); ctx.closePath(); ctx.fill(); ctx.restore();
    });
    var n = 44, R = 78, r = 71;
    var grad = ctx.createRadialGradient(cx - 25, cy - 30, 5, cx, cy, R);
    grad.addColorStop(0, '#F3DDA2'); grad.addColorStop(0.6, C.goldL); grad.addColorStop(1, C.gold);
    ctx.fillStyle = grad; ctx.beginPath();
    for (var i = 0; i < n * 2; i++) { var a = i / (n * 2) * Math.PI * 2, rad = i % 2 ? r : R; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.burg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 64, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, 45, 0, 7); ctx.stroke();
    ctx.fillStyle = C.burg; ctx.font = '700 11.5px ' + F.body;
    circleText(ctx, 'FRIENDSHIP COURT \u2726 OFFICIAL SEAL \u2726 ', cx, cy, 54.5);
    ctx.textAlign = 'center'; ctx.font = '400 34px ' + F.display; ctx.fillText('FC', cx, cy + 8);
    ctx.font = '600 8px ' + F.body; spaced(ctx, 'EST. FOREVER', cx, cy + 25, 1.5, 'center');
    diamond(ctx, cx, cy - 26, 4);
  }

  function render(d, scale) {
    scale = scale || 2;
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(DW * scale); canvas.height = Math.round(DH * scale);
    var ctx = canvas.getContext('2d'); ctx.scale(scale, scale); ctx.textBaseline = 'alphabetic';

    // paper
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, DW, DH);
    var vg = ctx.createRadialGradient(DW / 2, DH / 2, DH * 0.25, DW / 2, DH / 2, DH * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0.25)'); vg.addColorStop(1, 'rgba(150,110,50,0.16)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, DW, DH);
    var r = rng(42); ctx.fillStyle = 'rgba(120,90,40,0.05)';
    for (var i = 0; i < 2600; i++) ctx.fillRect(r() * DW, r() * DH, 1 + r() * 1.5, 1 + r() * 1.5);

    if (d.sample) {
      ctx.save(); ctx.translate(DW / 2, DH / 2); ctx.rotate(-0.6); ctx.fillStyle = 'rgba(123,30,43,0.06)';
      ctx.font = '400 230px ' + F.display; ctx.textAlign = 'center'; ctx.fillText('SAMPLE', 0, 80); ctx.restore();
    }

    // border
    ctx.strokeStyle = C.burg; ctx.lineWidth = 12; ctx.strokeRect(22, 22, DW - 44, DH - 44);
    ctx.fillStyle = C.goldL;
    for (var bx = 34; bx < DW - 22; bx += 14) { ctx.fillRect(bx - 1, 21, 2, 2); ctx.fillRect(bx - 1, DH - 23, 2, 2); }
    for (var by = 34; by < DH - 22; by += 14) { ctx.fillRect(21, by - 1, 2, 2); ctx.fillRect(DW - 23, by - 1, 2, 2); }
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5; ctx.strokeRect(36, 36, DW - 72, DH - 72);
    ctx.lineWidth = 1; ctx.strokeRect(42, 42, DW - 84, DH - 84);
    ctx.fillStyle = C.gold;
    [[42, 42], [DW - 42, 42], [42, DH - 42], [DW - 42, DH - 42]].forEach(function (p) {
      ctx.fillStyle = C.paper; ctx.fillRect(p[0] - 13, p[1] - 13, 26, 26);
      ctx.fillStyle = C.gold; diamond(ctx, p[0], p[1], 11); ctx.fillStyle = C.paper; diamond(ctx, p[0], p[1], 5); ctx.fillStyle = C.burg; diamond(ctx, p[0], p[1], 2.5);
    });

    // header
    ctx.textAlign = 'center'; ctx.fillStyle = C.navy; ctx.font = '600 13px ' + F.body;
    spaced(ctx, 'IN THE SUPREME FRIENDSHIP COURT OF MUTUAL TOLERANCE', DW / 2, 92, 3, 'center');
    ctx.fillStyle = C.burg; ctx.font = '400 46px ' + F.display;
    ctx.fillText('THE OFFICIAL FRIENDSHIP', DW / 2, 150); ctx.fillText('MISCONDUCT AGREEMENT', DW / 2, 198);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(300, 222); ctx.lineTo(480, 222); ctx.moveTo(520, 222); ctx.lineTo(700, 222); ctx.stroke();
    ctx.fillStyle = C.gold; diamond(ctx, 500, 222, 6); diamond(ctx, 300, 222, 3); diamond(ctx, 700, 222, 3);

    ctx.fillStyle = C.navy; ctx.font = '400 14px ' + F.type; ctx.textAlign = 'left';
    ctx.fillText('AGREEMENT NO. ' + d.number, 80, 258);
    ctx.textAlign = 'right'; ctx.fillText('DATE: ' + d.date.toUpperCase(), 920, 258);
    ctx.strokeStyle = 'rgba(24,34,59,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(80, 272); ctx.lineTo(920, 272); ctx.stroke();

    // parties
    ctx.textAlign = 'left';
    ctx.fillStyle = C.burg; ctx.font = '700 14px ' + F.body; spaced(ctx, 'BETWEEN:', 80, 314, 3);
    ctx.fillStyle = C.goldD; ctx.font = 'italic 400 18px ' + F.body; ctx.fillText('The Complainant', 80, 342);
    ctx.fillStyle = C.navy; var s1 = fit(ctx, d.complainant, 560, 34, '400', F.display, 18); ctx.fillText(d.complainant, 80, 380);
    ctx.strokeStyle = 'rgba(24,34,59,0.35)'; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(80, 392); ctx.lineTo(640, 392); ctx.stroke();
    ctx.fillStyle = C.burg; ctx.font = '700 14px ' + F.body; spaced(ctx, 'AND', 80, 426, 3);
    ctx.fillStyle = C.goldD; ctx.font = 'italic 400 18px ' + F.body; ctx.fillText('The Accused Friend', 80, 454);
    ctx.fillStyle = C.navy; fit(ctx, d.accused, 560, 34, '400', F.display, 18); ctx.fillText(d.accused, 80, 492);
    ctx.beginPath(); ctx.moveTo(80, 504); ctx.lineTo(640, 504); ctx.stroke(); ctx.setLineDash([]);

    // portrait
    var px = 692, py = 296, pw = 226, ph = 272;
    ctx.save(); ctx.shadowColor = 'rgba(24,34,59,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.fillStyle = C.gold; ctx.fillRect(px - 12, py - 12, pw + 24, ph + 24); ctx.restore();
    var fg = ctx.createLinearGradient(px - 12, py - 12, px + pw + 12, py + ph + 12);
    fg.addColorStop(0, '#E7C97F'); fg.addColorStop(0.5, C.gold); fg.addColorStop(1, '#9C7330');
    ctx.fillStyle = fg; ctx.fillRect(px - 12, py - 12, pw + 24, ph + 24);
    ctx.strokeStyle = C.navy; ctx.lineWidth = 2; ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
    drawPhoto(ctx, d.photo, px, py, pw, ph, d.sample);
    ctx.fillStyle = C.burg; ctx.fillRect(px + 8, py + ph - 4, pw - 16, 36);
    ctx.strokeStyle = C.goldL; ctx.lineWidth = 1.5; ctx.strokeRect(px + 12, py + ph, pw - 24, 28);
    ctx.fillStyle = C.goldL; ctx.font = '700 15px ' + F.body; spaced(ctx, 'THE ACCUSED', px + pw / 2, py + ph + 20, 4, 'center');

    // notice
    ctx.fillStyle = C.burg; ctx.font = '700 14px ' + F.body; spaced(ctx, 'FRIENDSHIP COURT NOTICE', 80, 548, 3);
    var notice = layout(ctx, 'Whereas the accused friend has allegedly committed one or more acts of friendship misconduct, the Friendship Court hereby issues this highly dramatic notice.', 560, 16.5, false);
    drawLayout(ctx, notice, 80, 574, 22);

    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(80, 650); ctx.lineTo(920, 650); ctx.stroke();
    ctx.fillStyle = C.gold; diamond(ctx, 500, 650, 4);

    // articles
    var blocks = [
      { h: 'ARTICLE I \u2014 THE OFFENSES', list: d.offenses },
      { h: 'ARTICLE II \u2014 THE FINE', p: 'The accused friend is hereby sentenced to a **\u20AC100 FRIENDSHIP FINE,** purely for comedic purposes.' },
      { h: 'ARTICLE III \u2014 ADDITIONAL PUNISHMENT', p: d.punishment },
      { h: 'ARTICLE IV \u2014 FRIENDSHIP RIGHTS', p: 'The accused retains the right to appeal, complain dramatically, and deny all allegations.' },
      { h: 'ARTICLE V \u2014 FINAL DECLARATION', p: '\u201CBy continuing to be friends, both parties acknowledge that friendship is a serious business, but this agreement is a joke and does not create a legally enforceable financial obligation.\u201D', italic: true }
    ];
    var top = 688, bottom = 1158;
    function pass(fs, draw) {
      var lh = fs * 1.36, hs = Math.max(12, fs * 0.84), y = top;
      blocks.forEach(function (b, bi) {
        if (draw) { ctx.fillStyle = C.burg; ctx.font = '700 ' + hs + 'px ' + F.body; spaced(ctx, b.h, 80, y, 2.2); }
        y += fs * 0.55 + lh * 0.9;
        if (b.list) {
          b.list.forEach(function (item, ii) {
            var L = layout(ctx, item, 790, fs, false);
            if (draw) { ctx.fillStyle = C.burg; ctx.font = '700 ' + fs + 'px ' + F.body; ctx.fillText('\u00A7 ' + (ii + 1), 88, y); drawLayout(ctx, L, 130, y, lh); }
            y += L.lines.length * lh + fs * 0.1;
          });
        } else {
          var L2 = layout(ctx, b.p, 840, fs, b.italic);
          if (draw) drawLayout(ctx, L2, 80, y, lh);
          y += L2.lines.length * lh;
        }
        if (bi < blocks.length - 1) y += fs * 0.75;
      });
      return y - lh;
    }
    var fs = 17.5; while (fs > 11 && pass(fs, false) > bottom) fs -= 0.5;
    pass(fs, true);

    // bottom
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(80, 1176); ctx.lineTo(920, 1176); ctx.stroke();
    ctx.strokeStyle = C.navy; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(80, 1236); ctx.lineTo(330, 1236); ctx.moveTo(370, 1236); ctx.lineTo(620, 1236); ctx.moveTo(80, 1318); ctx.lineTo(330, 1318); ctx.stroke();
    ctx.fillStyle = C.burg; ctx.font = '400 20px ' + F.script; ctx.fillText('x', 84, 1230); ctx.fillText('x', 374, 1230);
    ctx.fillStyle = C.ink; ctx.font = 'italic 400 14px ' + F.body;
    ctx.fillText('Signature of the Complainant', 80, 1255); ctx.fillText('Signature of the Accused (under protest)', 370, 1255);
    ctx.fillStyle = C.navy; ctx.font = '400 12px ' + F.type;
    fit(ctx, d.complainant.toUpperCase(), 250, 12, '400', F.type, 8); ctx.fillText(d.complainant.toUpperCase(), 80, 1273);
    fit(ctx, d.accused.toUpperCase(), 250, 12, '400', F.type, 8); ctx.fillText(d.accused.toUpperCase(), 370, 1273);
    ctx.save(); ctx.translate(92, 1310); ctx.rotate(-0.06); ctx.fillStyle = C.navy; ctx.font = '700 36px ' + F.script; ctx.fillText('J. Grudgeworth', 0, 0); ctx.restore();
    ctx.fillStyle = C.ink; ctx.font = 'italic 400 14px ' + F.body; ctx.fillText('Hon. Judge Grudgeworth, Presiding', 80, 1337);
    ctx.fillStyle = '#5E5A54'; ctx.font = 'italic 400 13.5px ' + F.body;
    ctx.fillText('Case status: OPEN. Appeals accepted', 370, 1300); ctx.fillText('only when accompanied by snacks.', 370, 1318);
    drawSeal(ctx, 810, 1252);
    drawStamp(ctx, 772, 474, -0.2, 0.74);

    ctx.fillStyle = C.burg; ctx.font = '400 11px ' + F.type; ctx.textAlign = 'center';
    spaced(ctx, 'FOR ENTERTAINMENT ONLY \u00B7 NOT A LEGALLY BINDING CONTRACT \u00B7 NO REAL MONEY IS OWED', DW / 2, 1360, 0.8, 'center');
    return canvas;
  }

  window.FC = window.FC || {};
  window.FC.renderCertificate = function (data, scale) { return ensureFonts().then(function () { return render(data, scale); }); };
})();
