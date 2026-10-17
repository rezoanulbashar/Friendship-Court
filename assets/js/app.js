/* Friendship Court — app logic. Everything runs in the browser; nothing is sent to a server. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var VIOLATIONS = [
    { id: 'disrespect', label: 'Disrespectful behavior', hint: 'Eye-rolling, sighing, general attitude.', legal: 'Disrespectful behavior of a frankly theatrical nature, including eye-rolling with intent.', short: 'disrespectful behavior' },
    { id: 'insult', label: 'Insulting the user', hint: 'Unlicensed roasting.', legal: 'Insulting the Complainant without prior written authorization.', short: 'insulting me without authorization' },
    { id: 'ignore', label: 'Ignoring messages', hint: 'Left on seen. Left on delivered.', legal: 'Ignoring messages, including but not limited to leaving them on \u201Cseen\u201D.', short: 'ignoring my messages' },
    { id: 'food', label: 'Stealing food', hint: 'Or refusing to share snacks.', legal: 'Stealing food and/or refusing to share snacks in a time of need.', short: 'stealing my food' },
    { id: 'promises', label: 'Breaking promises', hint: '"I\'m five minutes away."', legal: 'Breaking promises, including the classic \u201CI\u2019m five minutes away.\u201D', short: 'breaking promises' },
    { id: 'annoying', label: 'Being unnecessarily annoying', hint: 'Persistently. Creatively.', legal: 'Being unnecessarily, persistently and creatively annoying.', short: 'being unnecessarily annoying' },
    { id: 'other', label: 'Other funny misconduct', hint: 'Too embarrassing to list.', legal: 'Other funny misconduct too embarrassing to describe in an official document.', short: 'other funny misconduct' }
  ];
  var PUNISHMENTS = [
    { id: 'fine', label: 'Pay the \u20AC100 joke fine', hint: 'Payable in snacks or compliments.', legal: 'The Accused shall pay the **\u20AC100 joke fine,** payable in snacks, compliments or imaginary currency.', short: 'pay the \u20AC100 joke fine' },
    { id: 'dinner', label: 'Buy the user dinner', hint: 'Dessert included.', legal: 'The Accused shall **buy the Complainant dinner,** dessert included, no negotiations.', short: 'buy me dinner' },
    { id: 'snacks', label: 'Buy snacks for the entire friend group', hint: 'Yes, everyone.', legal: 'The Accused shall **buy snacks for the entire friend group,** including the friends who did nothing.', short: 'buy snacks for the entire friend group' },
    { id: 'right', label: 'Publicly admit that the user is always right', hint: 'In front of witnesses.', legal: 'The Accused shall **publicly admit that the Complainant is always right,** in front of at least one witness.', short: 'publicly admit that I am always right' },
    { id: 'apology', label: 'Perform a dramatic apology', hint: 'Kneeling optional. Tears encouraged.', legal: 'The Accused shall **perform a dramatic apology,** with kneeling, a trembling voice and at least one single tear.', short: 'perform a dramatic apology' }
  ];
  var TOTAL = 7, MAX_NAME = 40, MAX_CUSTOM = 120, MAX_FILE = 10 * 1024 * 1024, MAX_DIM = 1000;
  var TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  var state = { complainant: '', accused: '', photo: null, photoPreview: '', noPhoto: false, violations: [], custom: '', punishment: '', number: '', date: null };
  var step = 1, docCanvas = null, docJpeg = '';

  function clean(v) { return String(v || '').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\*+/g, '*').replace(/\s+/g, ' ').trim(); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  /* ---------- views ---------- */
  function showView(name, push) {
    $$('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + name; });
    document.body.classList.toggle('has-print', name === 'result' && !!docJpeg);
    window.scrollTo(0, 0);
    if (push !== false && location.hash !== '#' + name) { try { history.pushState(null, '', '#' + name); } catch (e) { } }
  }
  function route() {
    var h = (location.hash || '#home').slice(1);
    if (h === 'result') { if (docJpeg) showView('result', false); else showView('home', false); }
    else if (h === 'create') { showView('create', false); setStep(step); }
    else showView('home', false);
  }

  /* ---------- options ---------- */
  function buildOptions() {
    function make(wrap, list, type, name) {
      list.forEach(function (o) {
        var label = document.createElement('label'); label.className = 'option' + (type === 'radio' ? ' radio' : '');
        var input = document.createElement('input'); input.type = type; input.name = name; input.value = o.id;
        var box = document.createElement('span'); box.className = 'box'; box.setAttribute('aria-hidden', 'true');
        var text = document.createElement('span'); text.className = 'option-text';
        var st = document.createElement('strong'); st.textContent = o.label;
        var sm = document.createElement('small'); sm.textContent = o.hint;
        text.appendChild(st); text.appendChild(sm);
        label.appendChild(input); label.appendChild(box); label.appendChild(text);
        input.addEventListener('change', function () { $$('input[name="' + name + '"]').forEach(function (i) { i.parentNode.classList.toggle('checked', i.checked); }); clearError(); });
        wrap.appendChild(label);
      });
    }
    make($('#violation-options'), VIOLATIONS, 'checkbox', 'violation');
    make($('#punishment-options'), PUNISHMENTS, 'radio', 'punishment');
  }

  /* ---------- steps ---------- */
  function setStep(n) {
    step = n;
    $$('.step').forEach(function (s) { s.hidden = +s.dataset.step !== n; });
    $$('#progress span').forEach(function (s, i) { s.className = i + 1 < n ? 'done' : i + 1 === n ? 'current' : ''; });
    $('#step-num').textContent = n;
    $('#btn-back').textContent = n === 1 ? 'Cancel' : 'Back';
    $('#btn-next').textContent = n === TOTAL ? 'Generate the agreement' : (n === 5 && !$('#custom').value.trim() ? 'Skip' : 'Next');
    clearError();
    if (n === TOTAL) renderReview();
    var cur = $('.step[data-step="' + n + '"]');
    var focusEl = $('input.line-input, textarea', cur) || $('h2', cur);
    if (!$('#view-create').hidden && focusEl) setTimeout(function () { try { focusEl.focus({ preventScroll: true }); } catch (e) { focusEl.focus(); } }, 30);
  }

  function nameCheck(v, who) {
    if (!v) return who === 1 ? 'The Court requires your name. A nickname is acceptable.' : 'The Court requires the name of the accused.';
    if (v.length > MAX_NAME) return 'That name is longer than the Court\u2019s patience (' + MAX_NAME + ' characters max).';
    if (!/[A-Za-z0-9\u00C0-\uFFFF]/.test(v)) return 'That doesn\u2019t look like a name. Please include at least one letter.';
    return '';
  }

  function readStep(n) {
    var err = '';
    if (n === 1) { state.complainant = clean($('#complainant').value); err = nameCheck(state.complainant, 1); }
    if (n === 2) {
      state.accused = clean($('#accused').value); err = nameCheck(state.accused, 2);
      if (!err && state.accused.toLowerCase() === state.complainant.toLowerCase()) err = 'You cannot accuse yourself. Self-reflection is handled by a different court.';
    }
    if (n === 3 && !state.photo && !state.noPhoto) err = 'Please upload a photo of the accused, or choose \u201CContinue without a photo\u201D.';
    if (n === 4) {
      state.violations = $$('input[name="violation"]:checked').map(function (i) { return i.value; });
      if (!state.violations.length) err = 'Select at least one offense. Surely they did something.';
    }
    if (n === 5) { state.custom = clean($('#custom').value); if (state.custom.length > MAX_CUSTOM) err = 'Keep it under ' + MAX_CUSTOM + ' characters. The Court has a short attention span.'; }
    if (n === 6) { var p = $('input[name="punishment"]:checked'); state.punishment = p ? p.value : ''; if (!state.punishment) err = 'Choose a punishment. The Court insists on consequences.'; }
    var field = { 1: '#complainant', 2: '#accused', 5: '#custom' }[n];
    if (field) $(field).setAttribute('aria-invalid', err ? 'true' : 'false');
    return err;
  }

  function showError(msg) {
    $('#form-error').textContent = 'Objection! ' + msg;
    var p = $('#complaint-form'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake');
  }
  function clearError() { $('#form-error').textContent = ''; }

  function renderReview() {
    var dl = $('#review'); dl.textContent = '';
    function row(label, content, goto) {
      var d = document.createElement('div'); d.className = 'review-row';
      var dt = document.createElement('dt'); dt.textContent = label;
      var dd = document.createElement('dd');
      if (typeof content === 'string') dd.textContent = content; else dd.appendChild(content);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn-link'; b.textContent = 'Edit';
      b.setAttribute('aria-label', 'Edit ' + label); b.addEventListener('click', function () { setStep(goto); });
      d.appendChild(dt); d.appendChild(dd); d.appendChild(b); dl.appendChild(d);
    }
    row('The Complainant', state.complainant, 1);
    row('The Accused', state.accused, 2);
    if (state.photo) { var im = document.createElement('img'); im.className = 'review-thumb'; im.alt = 'Photo of the accused'; im.src = state.photoPreview; row('Photo', im, 3); }
    else row('Photo', 'No photo (identity withheld)', 3);
    var ul = document.createElement('ul');
    state.violations.forEach(function (id) { var li = document.createElement('li'); li.textContent = byId(VIOLATIONS, id).label; ul.appendChild(li); });
    row('Offenses', ul, 4);
    row('Additional misconduct', state.custom || 'None reported', 5);
    row('Punishment', byId(PUNISHMENTS, state.punishment).label + ' (plus the \u20AC100 joke fine)', 6);
  }

  /* ---------- photo ---------- */
  function isImageSig(b) {
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
    return '';
  }
  function readHead(file) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(new Uint8Array(fr.result)); }; fr.onerror = rej; fr.readAsArrayBuffer(file.slice(0, 16)); });
  }
  function loadImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); res(img); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      img.src = url;
    });
  }
  function handleFile(file) {
    clearError();
    if (!file) return;
    var name = file.name || '';
    if (!/\.(jpe?g|png|webp)$/i.test(name) || (file.type && TYPES.indexOf(file.type) < 0)) return showError('Only JPG, JPEG, PNG or WebP images are accepted as evidence.');
    if (file.size > MAX_FILE) return showError('That photo is larger than 10 MB. Please choose a smaller one.');
    if (file.size < 64) return showError('That file appears to be empty.');
    var dz = $('#dropzone'); dz.classList.add('busy'); $('#dz-title').textContent = 'Examining evidence\u2026';
    readHead(file).then(function (head) {
      if (!isImageSig(head)) throw new Error('sig');
      return loadImage(file);
    }).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (w < 32 || h < 32) throw new Error('small');
      var k = Math.min(1, MAX_DIM / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      state.photo = c; state.photoPreview = c.toDataURL('image/jpeg', 0.85); state.noPhoto = false;
      renderPhoto();
    }).catch(function (e) {
      showError(e && e.message === 'sig' ? 'That file claims to be an image but isn\u2019t. Nice try.' : e && e.message === 'small' ? 'That image is too small to identify the accused.' : 'The Court couldn\u2019t open that image. Try another JPG, PNG or WebP.');
    }).then(function () { dz.classList.remove('busy'); $('#dz-title').textContent = 'Tap to choose a photo'; $('#photo-input').value = ''; });
  }
  function renderPhoto() {
    var has = !!state.photo;
    $('#dropzone').hidden = has; $('#photo-preview').hidden = !has; $('#no-photo').hidden = has;
    if (has) $('#photo-thumb').src = state.photoPreview; else $('#photo-thumb').removeAttribute('src');
  }

  /* ---------- generate ---------- */
  function makeNumber() {
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', a = new Uint8Array(7), s = '';
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < 4; i++) s += abc[a[i] % abc.length];
    return 'FC-' + new Date().getFullYear() + '-' + s + '-' + String((a[4] * 7 + a[5] * 3 + a[6]) % 1000).padStart(3, '0');
  }
  function fmtDate(d) { try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { return d.toDateString(); } }
  function certData() {
    var off = state.violations.map(function (id) { return byId(VIOLATIONS, id).legal; });
    if (state.custom) off.push('Additional misconduct as reported by the Complainant: \u201C' + state.custom + '\u201D');
    return { complainant: state.complainant, accused: state.accused, photo: state.photo, offenses: off, punishment: byId(PUNISHMENTS, state.punishment).legal, number: state.number, date: fmtDate(state.date) };
  }
  function buildMessage() {
    var list = state.violations.map(function (id) { return byId(VIOLATIONS, id).short; });
    if (state.custom) list.push(state.custom.replace(/[.!?]+$/, '').toLowerCase());
    var listTxt = list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0];
    return 'Dear ' + state.accused + ',\n\nThe Friendship Court has reviewed the evidence and found you GUILTY of ' + listTxt + '.\n\nYou are hereby sentenced to a \u20AC100 friendship fine and must ' + byId(PUNISHMENTS, state.punishment).short + '.\n\nAgreement No. ' + state.number + '. You may appeal, complain dramatically or deny everything.\n\n(For entertainment only. Not a legally binding contract.)\n\u2014 ' + state.complainant;
  }
  function generate() {
    state.number = makeNumber(); state.date = new Date(); docJpeg = ''; docCanvas = null;
    $('#doc-img').hidden = true; $('#doc-status').hidden = false; $('#doc-status-text').textContent = 'The Court is deliberating\u2026';
    $('#result-number').textContent = state.number;
    $('#message').textContent = buildMessage();
    showView('result');
    window.FC.renderCertificate(certData(), 2).then(function (canvas) {
      docCanvas = canvas; docJpeg = canvas.toDataURL('image/jpeg', 0.92);
      var img = $('#doc-img'); img.src = docJpeg; img.hidden = false;
      $('#doc-status').hidden = true; $('#print-sheet').src = docJpeg;
      document.body.classList.add('has-print');
    }).catch(function () {
      $('#doc-status-text').textContent = 'The Court tripped over its robe. Please tap \u201CEdit agreement\u201D and try again.';
    });
  }

  /* ---------- actions ---------- */
  var toastTimer;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200); }
  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }
  function fileBase() { return 'friendship-agreement-' + state.number; }
  function needDoc() { if (!docCanvas) { toast('The agreement is still being prepared. One moment.'); return false; } return true; }

  function onPdf() {
    if (!needDoc()) return;
    try { download(window.FC.pdfFromCanvas(docCanvas, 'Friendship Misconduct Agreement ' + state.number), fileBase() + '.pdf'); toast('PDF downloaded. Deliver with maximum drama.'); }
    catch (e) { toast('PDF download failed. Opening print instead: choose \u201CSave as PDF\u201D.'); setTimeout(function () { window.print(); }, 600); }
  }
  function onPng() {
    if (!needDoc()) return;
    if (docCanvas.toBlob) docCanvas.toBlob(function (b) { if (b) download(b, fileBase() + '.png'); else toast('Image download failed. Try printing instead.'); }, 'image/png');
    else { var a = document.createElement('a'); a.href = docJpeg; a.download = fileBase() + '.jpg'; a.click(); }
  }
  function onPrint() { if (!needDoc()) return; window.print(); }
  function onCopy() {
    var text = $('#message').textContent;
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove();
      toast(ok ? 'Message copied. Send it with confidence.' : 'Copy failed. Select the message and copy it manually.');
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast('Message copied. Send it with confidence.'); }, fallback);
    else fallback();
  }
  function onShare() { navigator.share({ title: 'Friendship Court verdict', text: $('#message').textContent }).catch(function () { }); }
  function resetAll() {
    $('#complaint-form').reset();
    $$('.option').forEach(function (o) { o.classList.remove('checked'); });
    $$('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
    state = { complainant: '', accused: '', photo: null, photoPreview: '', noPhoto: false, violations: [], custom: '', punishment: '', number: '', date: null };
    docCanvas = null; docJpeg = ''; $('#print-sheet').removeAttribute('src'); $('#doc-img').removeAttribute('src');
    $('#custom-count').textContent = '0'; renderPhoto();
  }

  function startFlow() { showView('create'); setStep(step); }

  /* ---------- init ---------- */
  function init() {
    buildOptions();
    $('#year').textContent = new Date().getFullYear();
    $$('[data-action="start"]').forEach(function (b) { b.addEventListener('click', startFlow); });
    $$('[data-nav="home"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); showView('home'); }); });

    $('#complaint-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = readStep(step);
      if (err) return showError(err);
      if (step < TOTAL) setStep(step + 1); else generate();
    });
    $('#btn-back').addEventListener('click', function () { if (step > 1) setStep(step - 1); else showView('home'); });
    $('#custom').addEventListener('input', function () {
      $('#custom-count').textContent = this.value.length;
      if (step === 5) $('#btn-next').textContent = this.value.trim() ? 'Next' : 'Skip';
    });
    ['#complainant', '#accused'].forEach(function (s) { $(s).addEventListener('input', clearError); });

    var input = $('#photo-input'), dz = $('#dropzone');
    input.addEventListener('change', function () { handleFile(input.files && input.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('drag'); }); });
    dz.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files; if (f && f.length) handleFile(f[0]); });
    $('#photo-replace').addEventListener('click', function () { input.click(); });
    $('#photo-remove').addEventListener('click', function () { state.photo = null; state.photoPreview = ''; renderPhoto(); });
    $('#no-photo').addEventListener('click', function () { state.noPhoto = true; state.photo = null; renderPhoto(); setStep(4); });

    $('#act-pdf').addEventListener('click', onPdf);
    $('#act-print').addEventListener('click', onPrint);
    $('#act-png').addEventListener('click', onPng);
    $('#act-copy').addEventListener('click', onCopy);
    if (navigator.share) { $('#act-share').hidden = false; $('#act-share').addEventListener('click', onShare); }
    $('#act-edit').addEventListener('click', function () { showView('create'); setStep(TOTAL); });
    $('#act-reset').addEventListener('click', function () {
      if (!window.confirm('Start over? This clears the current agreement and photo.')) return;
      resetAll(); showView('create'); setStep(1);
    });
    window.addEventListener('popstate', route);

    route();

    window.FC.renderCertificate({
      sample: true, complainant: 'Alex Morgan', accused: 'Jamie \u201CSnack Thief\u201D Doyle', photo: null,
      offenses: [VIOLATIONS[2].legal, VIOLATIONS[1].legal, VIOLATIONS[3].legal],
      punishment: PUNISHMENTS[1].legal, number: 'FC-' + new Date().getFullYear() + '-SMPL-001', date: fmtDate(new Date())
    }, 1).then(function (c) { $('#sample-img').src = c.toDataURL('image/jpeg', 0.9); }).catch(function () { });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
