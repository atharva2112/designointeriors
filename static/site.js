/* Designo Interiors — site behaviour and motion (no dependencies).
   Motion is progressive: the head script adds html.motion only when the visitor has not
   asked for reduced motion, and every motion state in styles.css hangs off that class.
   Without it the same markup renders in its final, still state. */
(function () {
  'use strict';
  window.__designoReady = true;
  var root = document.documentElement;
  var motion = root.classList.contains('motion');
  var fine = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var press = function (group, btn) { group.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); }); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var vh = window.innerHeight;
  var fontsReady = new Promise(function (done) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(done, done); else done();
    setTimeout(done, 1500);
  });

  // One animation-frame loop for everything tied to scroll position
  var onFrame = [], queued = false;
  var run = function () { queued = false; var y = window.scrollY; for (var i = 0; i < onFrame.length; i++) onFrame[i](y); };
  var schedule = function () { if (!queued) { queued = true; requestAnimationFrame(run); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; schedule(); });

  // Header: solid once scrolled, tucks away on the way down, returns on the way up
  var hdr = $('[data-header]'), menuOpen = false, lastY = window.scrollY;
  var hideHeader = function (v) { hdr.classList.toggle('is-hidden', v); root.style.setProperty('--hdr-vis', v ? '0' : '1'); };
  if (hdr) onFrame.push(function (y) {
    hdr.classList.toggle('is-scrolled', y > 24);
    if (menuOpen || y < 200 || y < lastY - 4) hideHeader(false);
    else if (y > lastY + 4 && !hdr.contains(document.activeElement)) hideHeader(true);
    lastY = y;
  });

  // Menu: a deep-green sheet drops in and the S draws itself behind the links
  var menu = $('[data-menu]'), opener = $('[data-menu-open]');
  var setMenu = function (open) {
    if (!menu || open === menuOpen) return;
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (opener) opener.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(function () { var b = $('[data-menu-close]', menu); if (b) b.focus({ preventScroll: true }); }, 80);
    else if (opener && menu.contains(document.activeElement)) opener.focus({ preventScroll: true });
  };
  $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { setMenu(true); }); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });

  // Back to top: the S fills with green as the page is read
  var topBtn = $('[data-top]');
  if (topBtn) {
    onFrame.push(function (y) {
      var max = document.documentElement.scrollHeight - vh;
      topBtn.style.setProperty('--p', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : '0');
      topBtn.classList.toggle('is-on', y > vh * 0.9);
    });
    topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' }); });
  }

  // Home cover: the S is a window onto the showreel; scrolling walks through it
  var hero = $('[data-hero]');
  if (hero) {
    var stick = hero.firstElementChild, hm = $('[data-hero-media]', hero), hl = $('[data-hero-line]', hero);
    var hc = $('[data-hero-copy]', hero), ha = $('[data-hero-after]', hero), hq = $('[data-hero-cue]', hero);
    var SW = 492, SH = 837, AX = 357, AY = 402, SAFE_W = 115, SAFE_H = 125; // anchor + an opaque rect inside the S body
    var g = null, heroTop = 0;
    var layoutHero = function () {
      var w = stick.clientWidth, h = stick.clientHeight, h0, x0, y0;
      var pad = parseFloat(getComputedStyle(hc).paddingLeft) || 20;
      if (w < 760 || (h > w * 1.1 && w <= 1100)) {
        var topEl = $('.cover__top', hero), rowEl = $('.cover__row', hero);
        var a = topEl.offsetTop + topEl.offsetHeight + 18, b = rowEl.offsetTop - 18;
        h0 = clamp(b - a, 160, h * 0.62);
        y0 = a + Math.max(0, (b - a - h0) / 2);
        x0 = w - pad * 0.8 - h0 * SW / SH;
      } else {
        h0 = Math.min(h * 0.8, w * 0.34 * SH / SW);
        y0 = (h - h0) / 2 + h * 0.035;
        x0 = w - pad * 0.75 - h0 * SW / SH;
      }
      var k0 = h0 / SH;
      g = { w: w, h: h, k0: k0, k1: Math.max(w / SAFE_W, h / SAFE_H) * 1.08, ax: x0 + AX * k0, ay: y0 + AY * k0 };
      heroTop = hero.getBoundingClientRect().top + window.scrollY;
      hero.classList.add('is-ready');
    };
    var heroFrame = function (y) {
      if (!g) return;
      var total = hero.offsetHeight - g.h;
      var p = motion && total > 0 ? clamp((y - heroTop) / total, 0, 1) : 0;
      if (motion && p >= 1 && hero.__done) return;
      hero.__done = p >= 1;
      var t = clamp((p - 0.03) / 0.8, 0, 1), z = t * t * (3 - 2 * t);
      var k = g.k0 * Math.pow(g.k1 / g.k0, z);
      var ax = g.ax + (g.w / 2 - g.ax) * z, ay = g.ay + (g.h / 2 - g.ay) * z;
      var X = ax - AX * k, Y = ay - AY * k, ms = hm.style;
      ms.setProperty('--mw', (SW * k).toFixed(1) + 'px'); ms.setProperty('--mh', (SH * k).toFixed(1) + 'px');
      ms.setProperty('--mx', X.toFixed(1) + 'px'); ms.setProperty('--my', Y.toFixed(1) + 'px');
      ms.setProperty('--fs', (1.1 - 0.1 * z).toFixed(4));
      ms.setProperty('--scrim-o', clamp((p - 0.45) / 0.35, 0, 1).toFixed(3));
      hm.classList.toggle('is-open', z >= 1);
      hl.style.transform = 'translate(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
      hl.style.opacity = clamp(1 - z * 5, 0, 1).toFixed(3);
      if (!motion) return;
      var co = clamp(1 - p / 0.15, 0, 1);
      hc.style.opacity = co.toFixed(3); hc.style.translate = '0 ' + (-p * 140).toFixed(1) + 'px';
      hc.style.visibility = co === 0 ? 'hidden' : '';
      var ao = clamp((p - 0.7) / 0.2, 0, 1);
      ha.style.opacity = ao.toFixed(3); ha.style.translate = '0 ' + ((1 - ao) * 36).toFixed(1) + 'px';
      if (hq) hq.style.opacity = clamp(1 - p / 0.04, 0, 1).toFixed(3);
    };
    layoutHero(); heroFrame(window.scrollY);
    onFrame.push(heroFrame);
    var relayout = function () { hero.__done = false; layoutHero(); heroFrame(window.scrollY); };
    fontsReady.then(relayout);
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(stick); else window.addEventListener('resize', relayout);
  }

  // Split a heading into words; each word rises out of its own mask, a line at a time
  var wrapWords = function (el, cls, masked) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = cls;
            if (masked) { var i = document.createElement('span'); i.textContent = part; w.appendChild(i); } else w.textContent = part;
            frag.appendChild(w); words.push(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !/^(BR|SVG|IMG)$/i.test(n.tagName)) walk(n);
      });
    })(el);
    return words;
  };

  // Reveal: fades, image apertures, self-drawing rules and line-by-line headings
  var SPLIT = 'main h1.d, main h2.d, .ftr__cta h2, [data-split]';
  var FADE = ['.eyebrow', '.lede', '.p', '.statement', '.btns', '.link', '.card__meta', '.ticks > *', '.kv', '.col', '.stat', '.sx', '.row', '.wall > div', '.table > *', '.plain > *', 'details', '.form', '.chips', '.cells > *', '.crumbs', '.iso__item', '.tabs', '.feat > div', '.box', '.toggle', '[data-fade]']
    .map(function (s) { return 'main ' + s; }).concat(['.ftr__grid > div', '.ftr__base', '.ftr__cta .btns', '.ftr__cta .eyebrow']).join(',');
  var IMG = 'main .img, main .zoom, main .feat, main .map';
  var SKIP = '.cover, .menu, .marquee, [data-static]', SPLIT_SKIP = '.menu, .marquee, [data-static]';

  if (motion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var ins = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      ins.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); });
      ins.forEach(function (el, i) {
        io.unobserve(el);
        el.style.setProperty('--d', (Math.min(i, 8) * 0.075 + (el.__d || 0)).toFixed(3) + 's');
        el.classList.add('is-in');
        if (el.__onIn) el.__onIn();
        setTimeout(function () { el.style.removeProperty('--d'); }, 2600);
      });
    }, { rootMargin: '0px 0px -30px 0px' });
    // anything still waiting when the page bottoms out is shown at once
    onFrame.push(function (y) {
      if (y + vh < document.documentElement.scrollHeight - 4) return;
      $$('[data-r]:not(.is-in), .rule:not(.is-in), .s-draw:not(.is-in), .ftr:not(.is-in)').forEach(function (el) { if (!el.closest('[hidden]')) { io.unobserve(el); el.classList.add('is-in'); } });
    });

    var marked = [];
    var taken = function (el) { for (var i = 0; i < marked.length; i++) if (marked[i] !== el && marked[i].contains(el)) return true; return false; };
    $$(IMG).forEach(function (el) { if (!el.closest(SKIP)) { el.setAttribute('data-r', 'img'); marked.push(el); } });
    $$(FADE).forEach(function (el) { if (!el.closest(SKIP) && !taken(el) && !el.matches(SPLIT)) { el.setAttribute('data-r', 'fade'); marked.push(el); } });
    marked.forEach(function (el) { io.observe(el); });
    $$('.rule, .s-draw, .ftr').forEach(function (el) { if (!el.closest('.cover, .menu')) io.observe(el); });

    // Count stats up from zero when they arrive
    $$('[data-count]').forEach(function (el) {
      var host = el.closest('[data-r]') || el;
      var raw = el.textContent, m = /^(\D*)([\d,.]+)(.*)$/.exec(raw);
      if (!m) return;
      var digits = m[2].replace(/,/g, ''), target = parseFloat(digits), dec = (digits.split('.')[1] || '').length;
      var grouped = m[2].indexOf(',') > -1, indian = /^\d{1,2}(,\d\d)+,\d{3}$/.test(m[2]);
      var fmt = function (v) { var n = Number(v.toFixed(dec)); return m[1] + (grouped ? n.toLocaleString(indian ? 'en-IN' : 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec)) + m[3]; };
      host.__onIn = function () {
        var t0 = 0, dur = 1900;
        el.textContent = fmt(0);
        var step = function (t) { if (!t0) t0 = t; var q = clamp((t - t0) / dur, 0, 1); el.textContent = q < 1 ? fmt(target * (1 - Math.pow(1 - q, 4))) : raw; if (q < 1) requestAnimationFrame(step); };
        setTimeout(function () { requestAnimationFrame(step); }, 120);
      };
      if (host === el) io.observe(el);
    });

    fontsReady.then(function () {
      $$(SPLIT).forEach(function (el) {
        if (!el.closest(SPLIT_SKIP) && !taken(el)) {
          var words = wrapWords(el, 'w', true), line = -1, last = -1e9, nth = 0;
          words.forEach(function (w) {
            var top = Math.round(w.getBoundingClientRect().top);
            if (top > last + 4) { line++; last = top; nth = 0; }
            w.style.setProperty('--wd', (line * 0.11 + nth++ * 0.025).toFixed(3) + 's');
          });
          io.observe(el);
        }
        el.classList.add('is-split');
      });
    });
  }

  else $$(SPLIT).forEach(function (el) { el.classList.add('is-split'); });

  // Practice statement: words come into ink as the paragraph is read
  if (motion) $$('[data-words]').forEach(function (el) {
    var words = wrapWords(el, 'wd', false);
    el.classList.add('is-split');
    onFrame.push(function () {
      var r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var n = Math.round(clamp((vh * 0.9 - r.top) / (r.height + vh * 0.32), 0, 1) * words.length * 1.12);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    });
  });

  // Process: a green rule runs along the five stages as they scroll past
  $$('[data-process]').forEach(function (el) {
    var bar = $('.process__bar i', el), steps = $$('[data-step]', el);
    onFrame.push(function () {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = motion ? clamp((vh * 0.82 - r.top) / (vh * 0.5), 0, 1) : 1;
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      steps.forEach(function (s, i) { s.classList.toggle('is-on', p >= Math.min(0.999, i / steps.length + 0.04)); });
    });
  });

  // Parallax: photographs drift slower than the page around them
  var drift = $$('[data-parallax]');
  if (motion && drift.length) onFrame.push(function () {
    drift.forEach(function (el) {
      var box = el.parentNode.getBoundingClientRect();
      if (box.bottom < -120 || box.top > vh + 120) return;
      var c = (box.top + box.height / 2 - vh / 2) / (vh + box.height);
      el.style.translate = '0 ' + (c * -(parseFloat(el.getAttribute('data-parallax')) || 10)).toFixed(2) + '%';
    });
  });

  // Pointer companions: a "View" label over projects, a photo peek over sectors
  if (fine) {
    var cur = $('[data-cursor-el]'), peek = null, mx = -999, my = -999, cx = mx, cy = my, raf = 0;
    var follow = function () {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      if (cur) cur.style.transform = 'translate3d(' + (cx + 18).toFixed(1) + 'px,' + (cy + 18).toFixed(1) + 'px,0)';
      if (peek) peek.style.transform = 'translate3d(' + (cx + 36).toFixed(1) + 'px,' + (cy - peek.offsetHeight / 2).toFixed(1) + 'px,0)';
      raf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.3 ? requestAnimationFrame(follow) : 0;
    };
    document.addEventListener('pointermove', function (e) {
      if (cx < -900) { cx = e.clientX; cy = e.clientY; }
      mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(follow);
    }, { passive: true });
    if (cur) $$('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cur.textContent = el.getAttribute('data-cursor'); cur.classList.add('is-on'); });
      el.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
    });
    var peeks = $$('[data-peek]');
    if (peeks.length) {
      peek = document.createElement('div'); peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
      var pimg = document.createElement('img'); pimg.alt = ''; peek.appendChild(pimg); document.body.appendChild(peek);
      peeks.forEach(function (el) {
        el.addEventListener('pointerenter', function () { pimg.src = el.getAttribute('data-peek'); peek.classList.add('is-on'); });
        el.addEventListener('pointerleave', function () { peek.classList.remove('is-on'); });
      });
      window.addEventListener('scroll', function () { peek.classList.remove('is-on'); }, { passive: true });
    }
  }

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
    var swap = function (fn) {
      if (!motion) return fn();
      plist.classList.add('is-swapping');
      setTimeout(function () { fn(); plist.classList.remove('is-swapping'); schedule(); }, 280);
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { var s = c.getAttribute('data-filter'); press(chips, c); swap(function () { apply(s); }); history.replaceState(null, '', s === 'all' ? location.pathname : '?sector=' + s); }); });
    views.forEach(function (v) { v.addEventListener('click', function () { press(views, v); swap(function () { var list = v.getAttribute('data-view') === 'list'; $('[data-grid]').hidden = list; $('[data-list]').hidden = !list; }); }); });
    apply(new URLSearchParams(location.search).get('sector') || 'all');
  }

  // Journal category filter
  var cats = $$('[data-cat]');
  cats.forEach(function (c) { c.addEventListener('click', function () { var k = c.getAttribute('data-cat'); press(cats, c); $$('[data-post-cat]').forEach(function (p) { p.hidden = !(k === 'all' || p.getAttribute('data-post-cat') === k); }); }); });

  // Lightbox
  var shots = $$('[data-shot]');
  if (shots.length) {
    var srcs = shots.map(function (s) { return s.getAttribute('data-shot'); }), idx = 0, box = null, back = null, tx = null;
    var arrow = function (d) { return '<svg class="ar" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (d < 0 ? 'M20 12H5M11 6l-6 6 6 6' : 'M4 12h15M13 6l6 6-6 6') + '"/></svg>'; };
    var render = function () {
      var im = $('img', box); im.classList.remove('is-ready');
      im.onload = function () { im.classList.add('is-ready'); };
      im.src = srcs[idx]; if (im.complete) im.classList.add('is-ready');
      $('[data-count]', box).textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(srcs.length).padStart(2, '0');
    };
    var close = function () {
      if (!box) return;
      var b = box; box = null; b.classList.remove('is-open'); document.body.style.overflow = '';
      setTimeout(function () { b.remove(); }, motion ? 450 : 0);
      if (back) back.focus({ preventScroll: true });
    };
    var step = function (d) { idx = (idx + d + srcs.length) % srcs.length; render(); };
    var open = function (i) {
      idx = i; back = document.activeElement;
      box = document.createElement('div'); box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Photo viewer');
      box.innerHTML = '<div class="lb__top label"><span data-count></span><button type="button" data-x>Close</button></div><div class="lb__stage"><img alt=""><button type="button" class="lb__nav lb__prev" aria-label="Previous photo">' + arrow(-1) + '</button><button type="button" class="lb__nav lb__next" aria-label="Next photo">' + arrow(1) + '</button></div>';
      box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb__stage') || e.target.hasAttribute('data-x')) close(); });
      box.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1); });
      $('.lb__prev', box).addEventListener('click', function () { step(-1); });
      $('.lb__next', box).addEventListener('click', function () { step(1); });
      document.body.appendChild(box); document.body.style.overflow = 'hidden'; render();
      requestAnimationFrame(function () { if (box) box.classList.add('is-open'); });
      $('[data-x]', box).focus({ preventScroll: true });
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
    var fromHash = function () { var h = location.hash.slice(1); if (h === 'quote' || h === 'consult') { show(h); var tb = $('[data-tabs-box]'); if (tb) window.scrollTo({ top: tb.getBoundingClientRect().top + window.scrollY - 110, behavior: motion ? 'smooth' : 'auto' }); } };
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
    var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
    var r = $('input[type=range]', calc);
    var upd = function () { var v = +r.value; $('[data-v]', calc).textContent = inr(v); $('[data-p1]', calc).textContent = inr(v * .5 * .05); $('[data-p2]', calc).textContent = inr(v * .4 * .05); $('[data-p3]', calc).textContent = inr(v * .1 * .05); $('[data-total]', calc).textContent = inr(v * .05); };
    r.addEventListener('input', upd); upd();
  }

  // Careers: apply buttons + file label
  $$('[data-apply]').forEach(function (b) { b.addEventListener('click', function () { var s = $('select[name="role"]'); if (s) s.value = b.getAttribute('data-apply'); var f = $('#apply'); if (f) window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 100, behavior: motion ? 'smooth' : 'auto' }); }); });
  $$('input[type=file]').forEach(function (inp) { inp.addEventListener('change', function () { var l = inp.parentNode.querySelector('[data-file-label]'); if (l && inp.files[0]) l.textContent = inp.files[0].name; }); });

  // Prefill: links such as /project-brief/?type=Hospitality&area=4000 fill in matching fields
  if (location.search) {
    var params = new URLSearchParams(location.search);
    $$('form[data-form]').forEach(function (form) {
      params.forEach(function (v, k) {
        if (k === 'website' || k === 'form') return;
        $$('[name="' + k.replace(/[^\w-]/g, '') + '"]', form).forEach(function (el) {
          if (el.type === 'checkbox' || el.type === 'radio') { if (el.value === v) el.checked = true; }
          else if (el.tagName === 'SELECT') { Array.prototype.forEach.call(el.options, function (o) { if (o.value === v || o.text === v) el.value = o.value; }); }
          else if (el.type !== 'file' && el.type !== 'hidden') el.value = v;
        });
      });
    });
  }

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
      var maxMb = +(form.getAttribute('data-max-mb') || 5);
      if (file && file.size > maxMb * 1024 * 1024) return fail('That file is larger than ' + maxMb + ' MB.');
      if (!endpoint) return fail('The form isn’t connected yet.');
      (file ? readFile(file) : Promise.resolve(null)).then(function (f) {
        if (f) data.file = f;
        return fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
      }).then(function (res) { return res.json(); }).then(function (res) {
        if (!res.ok) throw new Error(res.error || 'error');
        form.hidden = true; var done = form.nextElementSibling; if (done) done.hidden = false;
      }).catch(function () { fail('Sorry, that didn’t send.'); });
    });
  });
  $$('[data-again]').forEach(function (b) { b.addEventListener('click', function () { var done = b.closest('.done'); var f = done.previousElementSibling; f.reset(); f.hidden = false; done.hidden = true; $('button[type=submit]', f).disabled = false; }); });

  // Client marquee: each row is a real scroller that drifts on its own and can be swiped, dragged
  // or scrolled by hand. It holds still under the pointer, while dragged or focused, and for a
  // moment after a hand scroll, then carries on from wherever it was left.
  if (motion) (function () {
    var rows = $$('.marquee__row').map(function (el, n) {
      var set = $('.marquee__set', el);
      return set && { el: el, set: set, dir: n % 2 ? -1 : 1, speed: n % 2 ? 34 : 42, pos: 0, w: 0, mine: -1, hold: 0, hover: false, focus: false, touch: false, drag: null, seen: false };
    }).filter(Boolean);
    if (!rows.length) return;
    // The content repeats every set width, so the position is kept between one and two sets in:
    // a full set of room either way for hand scrolling, and every wrap lands on identical logos.
    var norm = function (r, p) { while (p < r.w) p += r.w; while (p >= r.w * 2) p -= r.w; return p; };
    var put = function (r, p) { r.pos = p; r.el.scrollLeft = p; r.mine = r.el.scrollLeft; };
    var measure = function (r) {
      r.w = r.set.offsetWidth;
      if (!r.w) return;
      while (r.el.scrollWidth < r.w * 3 + r.el.clientWidth) { var c = r.set.cloneNode(true); c.setAttribute('aria-hidden', 'true'); r.el.appendChild(c); }
      put(r, norm(r, r.pos || r.w));
    };
    var running = false, last = 0;
    var tick = function (t) {
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0, live = false;
      last = t;
      rows.forEach(function (r) {
        if (!r.seen || !r.w) return;
        live = true;
        if (r.hover || r.focus || r.touch || r.drag || t < r.hold || document.hidden) return;
        put(r, norm(r, r.pos + r.dir * r.speed * dt));
      });
      if (live) requestAnimationFrame(tick); else { running = false; last = 0; }
    };
    var start = function () { if (!running) { running = true; requestAnimationFrame(tick); } };

    rows.forEach(function (r) {
      var el = r.el;
      el.addEventListener('scroll', function () {
        if (Math.abs(el.scrollLeft - r.mine) < 1.5) return; // our own move
        r.hold = performance.now() + 2200;
        r.pos = el.scrollLeft;
        if (r.pos < r.w * 0.5 || r.pos > r.w * 2.5) put(r, norm(r, r.pos)); // only when far out, so a swipe's momentum isn't cut short
        else r.mine = el.scrollLeft;
      }, { passive: true });
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') r.hover = true; });
      el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') r.hover = false; });
      el.addEventListener('focus', function () { r.focus = true; });
      el.addEventListener('blur', function () { r.focus = false; r.hold = performance.now() + 1200; });
      // Fingers use the browser's own scrolling; moving the row underneath one would cancel the swipe.
      el.addEventListener('touchstart', function () { r.touch = true; }, { passive: true });
      var lift = function () { r.touch = false; r.hold = performance.now() + 2200; };
      el.addEventListener('touchend', lift, { passive: true });
      el.addEventListener('touchcancel', lift, { passive: true });
      // Mouse drag.
      el.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        r.drag = { x: e.clientX, p: r.pos };
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-dragging');
        e.preventDefault();
      });
      el.addEventListener('pointermove', function (e) { if (r.drag) put(r, norm(r, r.drag.p - (e.clientX - r.drag.x))); });
      var end = function () { if (!r.drag) return; r.drag = null; el.classList.remove('is-dragging'); r.hold = performance.now() + 1200; };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      if ('ResizeObserver' in window) new ResizeObserver(function () { measure(r); }).observe(r.set);
      else window.addEventListener('resize', function () { measure(r); });
      measure(r);
    });
    fontsReady.then(function () { rows.forEach(measure); });
    // Only animate rows that are on screen.
    if ('IntersectionObserver' in window) {
      var watch = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { rows.forEach(function (r) { if (r.el === e.target) r.seen = e.isIntersecting; }); });
        start();
      }, { rootMargin: '100px 0px' });
      rows.forEach(function (r) { watch.observe(r.el); });
    } else { rows.forEach(function (r) { r.seen = true; }); start(); }
  })();

  run();
})();
