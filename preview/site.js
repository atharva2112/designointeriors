/* Designo Interiors — site behaviour (no dependencies) */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var press = function (group, btn) { group.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); }); };

  // Header: overlay → solid on scroll
  var hdr = $('[data-header]');
  if (hdr && hdr.classList.contains('hdr--overlay')) {
    var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 140); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  // Mobile menu
  var menu = $('[data-menu]');
  $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { menu.hidden = false; document.body.style.overflow = 'hidden'; }); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { menu.hidden = true; document.body.style.overflow = ''; }); });

  // Projects filter + view toggle
  var plist = $('[data-projects]');
  if (plist) {
    var chips = $$('[data-filter]'), views = $$('[data-view]');
    var apply = function (sector) {
      var shown = 0;
      $$('[data-sector]').forEach(function (el) { var ok = sector === 'all' || el.getAttribute('data-sector') === sector; el.hidden = !ok; if (ok && el.closest('[data-grid]')) shown++; });
      $('[data-empty]').hidden = shown > 0;
      press(chips, chips.filter(function (c) { return c.getAttribute('data-filter') === sector; })[0] || chips[0]);
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { var s = c.getAttribute('data-filter'); apply(s); history.replaceState(null, '', s === 'all' ? location.pathname : '?sector=' + s); }); });
    views.forEach(function (v) { v.addEventListener('click', function () { press(views, v); var list = v.getAttribute('data-view') === 'list'; $('[data-grid]').hidden = list; $('[data-list]').hidden = !list; }); });
    apply(new URLSearchParams(location.search).get('sector') || 'all');
  }

  // Journal category filter
  var cats = $$('[data-cat]');
  cats.forEach(function (c) { c.addEventListener('click', function () { var k = c.getAttribute('data-cat'); press(cats, c); $$('[data-post-cat]').forEach(function (p) { p.hidden = !(k === 'all' || p.getAttribute('data-post-cat') === k); }); }); });

  // Lightbox
  var shots = $$('[data-shot]');
  if (shots.length) {
    var srcs = shots.map(function (s) { return s.getAttribute('data-shot'); }), idx = 0, box = null;
    var render = function () { $('img', box).src = srcs[idx]; $('[data-count]', box).textContent = (idx + 1) + ' / ' + srcs.length; };
    var close = function () { if (box) { box.remove(); box = null; document.body.style.overflow = ''; } };
    var step = function (d) { idx = (idx + d + srcs.length) % srcs.length; render(); };
    var open = function (i) {
      idx = i;
      box = document.createElement('div'); box.className = 'lb';
      box.innerHTML = '<div class="lb__top mono"><span data-count></span><button type="button" data-x>Close</button></div><div class="lb__stage"><img alt=""><button type="button" class="lb__nav lb__prev" aria-label="Previous photo">&larr;</button><button type="button" class="lb__nav lb__next" aria-label="Next photo">&rarr;</button></div>';
      box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb__stage') || e.target.hasAttribute('data-x')) close(); });
      $('.lb__prev', box).addEventListener('click', function () { step(-1); });
      $('.lb__next', box).addEventListener('click', function () { step(1); });
      document.body.appendChild(box); document.body.style.overflow = 'hidden'; render();
    };
    shots.forEach(function (s, i) { s.addEventListener('click', function () { open(i); }); });
    document.addEventListener('keydown', function (e) { if (!box) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  }

  // Contact tabs
  var tabs = $$('[data-tab]');
  if (tabs.length) {
    var show = function (name) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-tab') === name ? 'true' : 'false'); });
      $$('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== name; });
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-tab')); }); });
    var fromHash = function () { var h = location.hash.slice(1); if (h === 'quote' || h === 'consult') { show(h); var box = $('[data-tabs-box]'); if (box) window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' }); } };
    window.addEventListener('hashchange', fromHash); fromHash();
  }

  // Consultation picker
  var picker = $('[data-picker]');
  if (picker) {
    var daysEl = $('[data-days]', picker), d = new Date(), list = [];
    d.setHours(12, 0, 0, 0);
    while (list.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) list.push(new Date(d)); }
    daysEl.innerHTML = list.map(function (x) {
      var iso = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      return '<button type="button" class="chip chip--day" data-pick="day" data-val="' + iso + '" aria-pressed="false"><span>' + x.toLocaleDateString('en-IN', { weekday: 'short' }) + '</span><b>' + x.getDate() + ' ' + x.toLocaleDateString('en-IN', { month: 'short' }) + '</b></button>';
    }).join('');
    var summary = function () {
      var dayBtn = $('[data-pick="day"][aria-pressed="true"]', picker);
      $('[data-summary]', picker).textContent = [$('input[name="mode"]', picker).value, dayBtn ? dayBtn.textContent.replace(/(\D+)(\d)/, '$1 $2') : '', $('input[name="time"]', picker).value].filter(Boolean).join(' · ');
    };
    ['mode', 'day', 'time'].forEach(function (k) {
      var group = $$('[data-pick="' + k + '"]', picker);
      group.forEach(function (b) { b.addEventListener('click', function () { press(group, b); $('input[name="' + k + '"]', picker).value = b.getAttribute('data-val'); summary(); }); });
      if (group[0] && !$('input[name="' + k + '"]', picker).value) group[k === 'time' ? 1 : 0].click();
    });
  }

  // Referral calculator
  var calc = $('[data-calc]');
  if (calc) {
    var inr = function (n) { return '\u20B9' + Math.round(n).toLocaleString('en-IN'); };
    var r = $('input[type=range]', calc);
    var upd = function () { var v = +r.value; $('[data-v]', calc).textContent = inr(v); $('[data-p1]', calc).textContent = inr(v * .5 * .05); $('[data-p2]', calc).textContent = inr(v * .4 * .05); $('[data-p3]', calc).textContent = inr(v * .1 * .05); $('[data-total]', calc).textContent = inr(v * .05); };
    r.addEventListener('input', upd); upd();
  }

  // Careers: apply buttons + file label
  $$('[data-apply]').forEach(function (b) { b.addEventListener('click', function () { var s = $('select[name="role"]'); if (s) s.value = b.getAttribute('data-apply'); var f = $('#apply'); if (f) window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }); });
  $$('input[type=file]').forEach(function (inp) { inp.addEventListener('change', function () { var l = inp.parentNode.querySelector('[data-file-label]'); if (l && inp.files[0]) l.textContent = inp.files[0].name; }); });

  // Forms → Google Apps Script
  var endpoint = document.body.getAttribute('data-forms');
  var readFile = function (file) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res({ name: file.name, type: file.type, data: String(fr.result).split(',')[1] }); }; fr.onerror = rej; fr.readAsDataURL(file); }); };
  $$('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('.form-error', form); if (err) err.remove();
      var fail = function (msg) { var p = document.createElement('p'); p.className = 'form-error'; p.innerHTML = msg + ' You can also <a href="https://wa.me/919820111353">message us on WhatsApp</a>.'; form.appendChild(p); btn.disabled = false; };
      var btn = $('button[type=submit]', form); btn.disabled = true;
      var data = { form: form.getAttribute('data-form'), page: location.pathname };
      var file = null;
      new FormData(form).forEach(function (v, k) {
        if (v instanceof File) { if (v.size) file = v; return; }
        data[k] = data[k] ? data[k] + ', ' + v : v;
      });
      if (data.website) return; // honeypot
      if (file && file.size > 5 * 1024 * 1024) return fail('That file is larger than 5 MB.');
      if (!endpoint) return fail('The form isn\u2019t connected yet.');
      (file ? readFile(file) : Promise.resolve(null)).then(function (f) {
        if (f) data.file = f;
        return fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (!res.ok) throw new Error(res.error || 'error');
        form.hidden = true; var done = form.nextElementSibling; if (done) done.hidden = false;
      }).catch(function () { fail('Sorry, that didn\u2019t send.'); });
    });
  });
  $$('[data-again]').forEach(function (b) { b.addEventListener('click', function () { var done = b.closest('.done'); var f = done.previousElementSibling; f.reset(); f.hidden = false; done.hidden = true; $('button[type=submit]', f).disabled = false; }); });
})();
