/* Designo Interiors — static site generator.
   Reads content/*.json (edited in Pages CMS) and writes the finished site to dist/.
   Run: node build/build.js   (no dependencies)  */
'use strict';

const NAV = [['projects', 'Projects'], ['services', 'Services'], ['about', 'About'], ['clientele', 'Clientele'], ['sustainability', 'Sustainability'], ['journal', 'Journal'], ['contact', 'Contact']];
const MENU = [['', 'Home'], ['projects/', 'Projects'], ['services/', 'Services'], ['about/', 'About'], ['clientele/', 'Clientele'], ['sustainability/', 'Sustainability'], ['vastu/', 'Vastu Shastra'], ['journal/', 'Journal'], ['careers/', 'Careers'], ['referral/', 'Referral programme'], ['contact/', 'Contact']];
const PROCESS = [
  ['Consult', 'A free first conversation, online or at our office, about your brief, budget and references.'],
  ['Estimate', 'An approximate estimate after the first call, then site measurements and a detailed requirement study.'],
  ['Design', 'Space planning, a Vastu review where wanted, and 3D views of the proposed interior.'],
  ['Build', 'Civil work, joinery, electrical, finishes and installation, run under ISO 9001 and 45001 practices.'],
  ['Handover', 'Delivered on agreed timelines and backed by a 10-year warranty.']
];
const AUTOMATION = ['Voice control through Alexa', 'Smart lighting and scenes', 'Appliance and device control', 'Energy-efficient systems'];
const CERTS = [
  ['ISO 9001', 'Quality Management', 'Consistent, efficient delivery, with processes we review and improve on every project.', 'The most widely recognised quality standard in the world. It sets out how we plan, run and continually improve project delivery, so the result is consistent from one site to the next.'],
  ['ISO 14001', 'Environmental Management', 'Less waste, fewer resources used and pollution prevented on site and in what we specify.', 'A framework for identifying and controlling the environmental impact of our work. It guides how we cut waste, conserve resources and prevent pollution, and how we choose eco-friendly, energy-efficient materials.'],
  ['ISO 45001', 'Occupational Health & Safety', 'Safe, hygienic sites for our team, our contractors and the people already using the building.', 'The global standard for occupational health and safety. It governs how we manage risk on site to protect employees, contractors and clients, and the hygiene we keep in occupied buildings.']
];
const PROJECT_TYPES = ['Corporate office', 'Retail / showroom', 'Hospitality', 'Education', 'Healthcare', 'Studio', 'Residential', 'Other'];
const REDIRECTS = [['/gallery', '/projects/'], ['/about-us', '/about/'], ['/certifications', '/about/#certifications'], ['/clientele', '/clientele/'], ['/contact-us', '/contact/'], ['/online-consultation', '/contact/#consult'], ['/designo-ecovisions', '/sustainability/'], ['/blog-1', '/journal/'], ['/career-with-designo', '/careers/'], ['/referral-program', '/referral/'], ['/vastu-shastra', '/vastu/']];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const inr = (n) => Number(n).toLocaleString('en-IN');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : (d || ''); };
const map = (arr, fn) => (arr || []).map(fn).join('');

async function buildSite(io, opts) {
  opts = opts || {};
  const pretty = opts.pretty !== false;
  const json = async (p, fb) => { try { return JSON.parse(await io.read(p)); } catch (e) { if (fb !== undefined) return fb; throw new Error('Could not read ' + p + ': ' + e.message); } };
  const collection = async (dir) => {
    const names = (await io.list(dir)).filter((n) => n.endsWith('.json')).sort();
    const out = [];
    for (const n of names) { const item = await json(dir + '/' + n); item.slug = n.replace(/\.json$/, ''); if (!item.hidden) out.push(item); }
    return out;
  };

  const site = await json('content/settings/site.json');
  const notifications = await json('content/settings/notifications.json', { forms: [] });
  const sectors = await json('content/sectors.json');
  const clients = await json('content/clients.json');
  const byOrder = (a, b) => ((a.order == null ? 999 : a.order) - (b.order == null ? 999 : b.order)) || String(a.name || a.title).localeCompare(String(b.name || b.title));
  const projects = (await collection('content/projects')).sort(byOrder);
  const posts = (await collection('content/journal')).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const jobs = (await collection('content/jobs')).sort(byOrder);

  const sectorById = {};
  sectors.forEach((s, i) => { s.index = pad(i + 1); s.count = 0; sectorById[s.id] = s; });
  projects.forEach((p, i) => {
    const s = sectorById[p.sector] || { name: p.sector || '', id: p.sector };
    if (sectorById[p.sector]) s.count++;
    p.index = pad(i + 1); p.sectorName = s.name;
    p.gallery = (p.gallery || []).filter(Boolean);
    p.cover = p.cover || p.gallery[0] || '';
    p.photos = [p.cover].concat(p.gallery.filter((g) => g !== p.cover)).filter(Boolean);
    p.areaLabel = p.area ? inr(p.area) + ' sq ft' : '';
    p.meta = [p.client, p.areaLabel].filter(Boolean).join(' · ');
  });
  sectors.forEach((s) => { s.countLabel = s.count ? s.count + (s.count === 1 ? ' project' : ' projects') : 'Enquire'; });
  posts.forEach((p) => { p.dateLabel = fmtDate(p.date); });
  const featured = (projects.filter((p) => p.featured).length ? projects.filter((p) => p.featured) : projects).slice(0, 5);
  const D = { site, sectors, sectorById, clients, projects, posts, jobs, featured };

  const pages = [];
  const page = (path, fn) => pages.push([path, fn]);
  page('', (c) => pageHome(c, D));
  page('projects/', (c) => pageProjects(c, D));
  projects.forEach((p, i) => page('projects/' + p.slug + '/', (c) => pageProject(c, D, p, projects[(i + 1) % projects.length])));
  page('services/', (c) => pageServices(c, D));
  page('about/', (c) => pageAbout(c, D));
  page('sustainability/', (c) => pageSustainability(c, D));
  page('vastu/', (c) => pageVastu(c, D));
  page('clientele/', (c) => pageClientele(c, D));
  page('contact/', (c) => pageContact(c, D));
  page('careers/', (c) => pageCareers(c, D));
  page('journal/', (c) => pageJournal(c, D));
  posts.forEach((p, i) => page('journal/' + p.slug + '/', (c) => pagePost(c, D, p, posts[(i + 1) % posts.length])));
  page('referral/', (c) => pageReferral(c, D));

  for (const [path, fn] of pages) {
    const depth = path ? path.split('/').filter(Boolean).length : 0;
    await io.write('dist/' + path + 'index.html', fn(ctx(depth, pretty, site)));
  }
  await io.write('dist/404.html', page404(ctx(0, pretty, site), D));
  const forms = {};
  (notifications.forms || []).forEach((f) => { if (f && f.form) forms[f.form] = { emails: (f.emails || []).filter(Boolean), whatsapp: (f.whatsapp || []).map((n) => String(n).replace(/\D/g, '')).filter(Boolean) }; });
  await io.write('dist/settings/notifications.json', JSON.stringify({ updated: new Date().toISOString(), forms: forms }, null, 2));
  const origin = (site.url || 'https://designointeriors.com').replace(/\/$/, '');
  await io.write('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pages.map(([p]) => '  <url><loc>' + origin + '/' + p + '</loc></url>').join('\n') + '\n</urlset>\n');
  await io.write('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
  await io.write('dist/_redirects', REDIRECTS.map(([a, b]) => a + ' ' + b + ' 301').join('\n') + '\n');
  return pages.length + 1;
}

function ctx(depth, pretty, site) {
  const rel = depth ? '../'.repeat(depth) : './';
  return {
    site: site,
    u: (p, hash) => (pretty ? '/' + p : rel + p + (p === '' || p.endsWith('/') ? 'index.html' : '')) + (hash || ''),
    a: (p) => (pretty ? '/' : rel) + p,
    m: (src) => !src ? '' : /^(https?:)?\/\//.test(src) ? src : (pretty ? src : rel + String(src).replace(/^\//, ''))
  };
}

/* ---------- shared pieces ---------- */
const btn = (href, text, cls, extra) => `<a class="btn ${cls}" href="${esc(href)}"${extra || ''}>${text}</a>`;
const head2 = (eyebrow, title, link, extra) => `<div class="headrow"><div><p class="eyebrow">${eyebrow}</p><h2 class="d h2"${extra || ''}>${title}</h2></div>${link || ''}</div>`;
const img = (c, src, alt, extra) => src ? `<img src="${esc(c.m(src))}" alt="${esc(alt)}" loading="lazy"${extra || ''}>` : '';
const field = (label, name, o) => { o = o || {}; const req = o.required ? ' required' : ''; const star = o.required ? ' *' : '';
  const input = o.rows ? `<textarea name="${name}" rows="${o.rows}"${req}></textarea>` : `<input name="${name}" type="${o.type || 'text'}"${req}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ''}${o.type === 'tel' ? ' autocomplete="tel"' : ''}${o.type === 'email' ? ' autocomplete="email"' : ''}>`;
  return `<label class="field${o.full ? ' full' : ''}"><span>${label}${star}</span>${input}</label>`; };
const select = (label, name, options, o) => `<label class="field${o && o.full ? ' full' : ''}"><span>${label}</span><select name="${name}">${map(options, (x) => `<option>${esc(x)}</option>`)}</select></label>`;
const hp = '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">';
const done = (label, title, text) => `<div class="done" hidden><span class="eyebrow">${label}</span><span class="d">${title}</span><span class="muted">${text || 'For anything urgent, call +91 98201 11353 or message us on WhatsApp.'}</span><button type="button" class="link" data-again style="background:none;border:0;border-bottom:1px solid currentColor;cursor:pointer">Send another</button></div>`;
const card = (c, p, size) => `<a class="card card--${size}" href="${c.u('projects/' + p.slug + '/')}"><div class="img">${img(c, p.cover, p.name)}</div><div class="card__meta"><span class="card__title">${esc(p.name)}</span><span class="mono muted">${esc([p.sectorName, p.areaLabel].filter(Boolean).join(' · '))}</span></div></a>`;
const steps = (dark) => `<div class="grid rule" style="--min:220px;gap:0 32px">${map(PROCESS, (s, i) => `<div class="col"><span class="num">${pad(i + 1)}</span><h3 class="d h4">${s[0]}</h3><p class="p small">${s[1]}</p></div>`)}</div>`;

function quoteForm(c, extended) {
  return `<form class="form" data-form="quote">${hp}
  ${field('Name', 'name', { required: true })}${field('Company', 'company')}${field('Email', 'email', { type: 'email', required: true })}${field('Phone', 'phone', { type: 'tel', required: true })}
  ${select('Project type', 'type', PROJECT_TYPES)}${extended ? field('Site location', 'location', { placeholder: 'e.g. Kurla, Mumbai' }) : ''}${field('Area (sq ft)', 'area')}
  ${extended ? select('Budget', 'budget', ['Not sure yet', 'Under ₹25 lakh', '₹25 lakh – ₹1 crore', '₹1 – 5 crore', 'Above ₹5 crore']) + select('Start date', 'timeline', ['As soon as possible', 'In 1–3 months', 'In 3–6 months', 'Later']) : ''}
  ${field('Tell us about the project', 'message', { rows: 4, full: true })}
  <div class="form__end">${extended ? '<label class="check"><input type="checkbox" name="updates" value="Yes">Send me occasional updates and offers.</label>' : '<span class="muted" style="font-size:13px">We use your details only to respond to this enquiry.</span>'}<button class="btn btn--dark" type="submit">${extended ? 'Request a quote' : 'Send enquiry'} <span>→</span></button></div>
</form>${done('Enquiry received', 'Thank you. We’ll be in touch.')}`;
}

function shell(c, D, o) {
  const s = D.site;
  const nav = map(NAV, ([id, label]) => `<a href="${c.u(id + '/')}"${o.active === id ? ' aria-current="page"' : ''}>${label}</a>`);
  const ogImage = o.image ? (/^https?:/.test(o.image) ? o.image : (s.url || '') + o.image) : '';
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<link rel="icon" type="image/png" href="${c.a('assets/s-mark.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${c.a('styles.css')}">
</head>
<body data-forms="${esc(s.formsEndpoint || '')}">
<header class="hdr hdr--${o.tone || 'solid'}" data-header>
  <div class="hdr__bar">
    <a class="hdr__logo" href="${c.u('')}" aria-label="Designo Interiors — home"><img class="lg-dark" src="${c.a('assets/logo.png')}" alt="Designo Interiors"><img class="lg-light" src="${c.a('assets/logo-light.png')}" alt="Designo Interiors"></a>
    <nav class="hdr__nav" aria-label="Main">${nav}</nav>
    <div class="hdr__end">${btn(c.u('contact/', '#quote'), 'Get a quote <span>→</span>', 'btn--dark')}<button class="hdr__menu" type="button" data-menu-open>Menu</button></div>
  </div>
</header>
<div class="menu" data-menu hidden>
  <div class="menu__top"><img src="${c.a('assets/logo-light.png')}" alt="Designo Interiors"><button type="button" data-menu-close>Close</button></div>
  <nav>${map(MENU, ([p, label], i) => `<a href="${c.u(p)}"><span>${pad(i + 1)}</span>${label}</a>`)}</nav>
  <div class="menu__contact"><a href="tel:${esc(s.phoneLink)}">${esc(s.phone)}</a><a href="mailto:${esc(s.email)}">${esc(s.email)}</a><a href="https://wa.me/${esc(s.whatsapp)}">WhatsApp</a></div>
</div>
<main>
${o.body}
</main>
${footer(c, D, o.cta !== false)}
<script src="${c.a('site.js')}" defer></script>
</body>
</html>
`;
}

function footer(c, D, cta) {
  const s = D.site;
  return `<footer class="ftr">
  <img class="mark" src="${c.a('assets/s-mark-green.png')}" alt="">
  ${cta ? `<div class="ftr__cta"><div class="wrap"><div><p class="eyebrow">Free first consultation · Online or in person</p><h2 class="d">Start a project</h2></div><div class="btns">${btn(c.u('contact/', '#quote'), 'Get a quote <span>→</span>', 'btn--light')}${btn('https://wa.me/' + s.whatsapp, 'WhatsApp', 'btn--line-light', ' target="_blank" rel="noopener"')}${btn('tel:' + s.phoneLink, esc(s.phone), 'btn--line-light')}</div></div></div>` : ''}
  <div class="ftr__cols"><div class="wrap">
    <div class="ftr__grid">
      <div><img src="${c.a('assets/logo-light.png')}" alt="Designo Interiors" style="height:76px;width:auto"><p class="muted" style="margin:8px 0 0;max-width:260px;font-size:14px;color:var(--mist)">Turnkey corporate and residential interiors in Mumbai since 1991.</p></div>
      <div><span class="mono">Studio</span><a href="${c.u('projects/')}">Projects</a><a href="${c.u('services/')}">Services</a><a href="${c.u('about/')}">About &amp; certifications</a><a href="${c.u('clientele/')}">Clientele</a><a href="${c.u('journal/')}">Journal</a></div>
      <div><span class="mono">More</span><a href="${c.u('sustainability/')}">EcoVisions</a><a href="${c.u('vastu/')}">Vastu Shastra</a><a href="${c.u('referral/')}">Referral programme</a><a href="${c.u('careers/')}">Careers</a><a href="${c.u('contact/')}">Contact</a></div>
      ${map(s.offices, (o) => `<div><span class="mono">${esc(o.name)}</span><span>${esc(o.address)}</span><a class="dir" href="https://maps.google.com/?q=${encodeURIComponent(o.mapQuery || o.address)}" target="_blank" rel="noopener">Directions ↗</a></div>`)}
      <div><span class="mono">Contact</span><a href="tel:${esc(s.phoneLink)}">${esc(s.phone)}</a><a href="mailto:${esc(s.email)}" style="word-break:break-all">${esc(s.email)}</a><span style="color:var(--mist);font-size:14px">${esc(s.hours)}</span></div>
    </div>
    <div class="ftr__base"><span>© ${new Date().getFullYear()} Designo Interiors · ISO 9001 · 14001 · 45001</span><nav>${map(s.social, (x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`)}</nav></div>
  </div></div>
</footer>
<a class="wa" href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#35795D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.1A8.5 8.5 0 1 1 21 11.5z"/></svg></span>WhatsApp us</a>`;
}

const intro = (eyebrow, title, text, lede) => `<section class="intro"><div class="wrap"><div><p class="eyebrow">${eyebrow}</p><h1 class="d h-xl">${title}</h1></div><p class="${lede ? 'lede' : 'p'}"${lede ? '' : ' style="font-size:18px"'}>${text}</p></div></section>`;

/* ---------- pages ---------- */
function pageHome(c, D) {
  const s = D.site, f = D.featured, sizes = ['l', 's', 's', 'l', 'w'];
  const body = `
<section class="hero">
  <div class="hero__media">${img(c, s.showreel && s.showreel.poster, '')}${s.showreel && s.showreel.video ? `<iframe src="${esc(s.showreel.video)}" title="Designo Interiors showreel" allow="autoplay; fullscreen; picture-in-picture" tabindex="-1"></iframe>` : ''}</div>
  <div class="hero__shade"></div>
  <div class="hero__inner wrap-wide px">
    <p class="eyebrow">Corporate interiors · Turnkey fit-outs · Since 1991</p>
    <h1 class="d h-hero">Workplaces<br>built to perform</h1>
    <div class="hero__row"><p>Designo plans, designs and builds offices, showrooms and hospitality spaces across Mumbai, Navi Mumbai, Thane, Pune and Goa, to ISO-certified standards.</p><div class="btns">${btn(c.u('contact/', '#quote'), 'Get a quote <span>→</span>', 'btn--light')}${btn(c.u('contact/', '#consult'), 'Book a consultation', 'btn--line-light')}</div></div>
  </div>
</section>
<section class="px"><div class="wrap stats">${map(s.stats, (x) => `<div class="stat"><b>${esc(x.value)}</b><span class="mono" style="color:var(--deep)">${esc(x.label)}</span><span class="muted" style="font-size:14px">${esc(x.note)}</span></div>`)}</div></section>
<section class="px sec-top"><div class="wrap" style="display:flex;flex-wrap:wrap;gap:32px 64px"><p class="eyebrow" style="flex:1 1 220px">01 — Practice</p><div style="flex:4 1 560px;display:flex;flex-direction:column;gap:32px"><p class="lede" style="font-size:clamp(26px,2.7vw,40px);line-height:1.3">We are a turnkey interior firm. One team carries your project from the first site visit through design, procurement, civil work, joinery and installation to handover, so there is one point of accountability and one timeline.</p><a class="link" href="${c.u('about/')}">About Designo →</a></div></div></section>
<section class="px sec"><div class="wrap">${head2('02 — Selected work', 'Recent workplaces', `<a class="link" href="${c.u('projects/')}">All projects →</a>`)}<div class="work">${map(f, (p, i) => card(c, p, sizes[i] || 's'))}</div></div></section>
<section class="px sec dark relative"><img class="mark" src="${c.a('assets/s-mark-green.png')}" alt="" style="left:-6%;top:-10%"><div class="wrap" style="position:relative">${head2('03 — Sectors', 'Eight sectors, one standard', `<a class="link" href="${c.u('services/')}">Services →</a>`)}<div style="border-top:1px solid var(--lineD)">${map(D.sectors, (x) => `<a class="sx" href="${x.count ? c.u('projects/') + '?sector=' + x.id : c.u('services/', '#' + x.id)}"><span class="num">${x.index}</span><span class="d">${esc(x.name)}</span><span class="small">${esc(x.blurb)}</span><span class="mono">${x.countLabel} →</span></a>`)}</div></div></section>
<section class="px sec"><div class="wrap">${head2('04 — How we work', 'Design to handover, under one contract')}${steps()}</div></section>
<section class="px sec bg2"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:center;gap:48px clamp(40px,6vw,96px)"><div class="img r45" style="flex:5 1 360px">${img(c, s.images && s.images.automation, 'Conference room with integrated lighting')}</div><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:24px"><p class="eyebrow">05 — Intelligent Living</p><h2 class="d h2">Interiors that respond</h2><p class="p" style="max-width:520px">We integrate automation into the interiors we design, so lights, appliances and devices respond to your voice through Alexa.</p><div class="ticks" style="max-width:560px;border-top:1px solid var(--line)">${map(AUTOMATION, (a, i) => `<div><span>${a}</span><span class="num">${pad(i + 1)}</span></div>`)}</div><a class="link" href="${c.u('services/', '#automation')}">How we integrate automation →</a></div></div></section>
<section class="px sec-top"><div class="wrap" style="display:flex;flex-wrap:wrap;gap:24px">
  <a class="feat" href="${c.u('sustainability/')}">${img(c, s.images && s.images.sustainability, 'Conference room among tropical planting')}<div><span class="eyebrow eyebrow--light">Designo EcoVisions</span><span class="d">Greener by specification</span><span style="max-width:460px">Low-VOC finishes, energy-efficient lighting, local sourcing and water-saving fixtures.</span><span class="mono" style="margin-top:8px">Our sustainability work →</span></div></a>
  <a class="feat" href="${c.u('vastu/')}">${img(c, s.images && s.images.vastu, 'Sunlit window-side office')}<div><span class="eyebrow eyebrow--light">Vastu Shastra</span><span class="d">Planned for balance</span><span style="max-width:460px">Our in-house Vastu consultant reviews orientation, light, colour and placement before a layout is final.</span><span class="mono" style="margin-top:8px">Vastu consultancy →</span></div></a>
</div></section>
<section class="px sec"><div class="wrap">${head2('Clientele', 'Trusted by', `<a class="link" href="${c.u('clientele/')}">Full client list →</a>`)}<div class="wall">${map(D.clients.wall, (n) => `<div>${esc(n)}</div>`)}</div></div></section>
<section class="px sec dark"><div class="wrap">${head2('Certified', 'Three ISO standards on every project', `<a class="link" href="${c.u('about/', '#certifications')}">Certifications →</a>`, ' style="max-width:900px"')}<div class="grid" style="--min:280px;gap:0 32px;border-top:1px solid var(--lineD)">${map(CERTS, (x) => `<div class="col" style="padding-bottom:28px"><span class="d" style="font-size:clamp(48px,4.6vw,72px);line-height:1">${x[0]}</span><span class="mono" style="color:var(--mist)">${x[1]}</span><span class="small" style="color:var(--onDark)">${x[2]}</span></div>`)}</div>${brochures(c, D, true)}</div></section>
<section class="px sec" id="quote"><div class="wrap split"><div class="l" style="flex:5 1 360px"><p class="eyebrow">Get a quote</p><h2 class="d h2">Tell us about your space</h2><p class="p" style="max-width:440px">A few details are enough to start. We’ll get back to you with next steps and a time for a free consultation.</p>${contactRows(D)}</div><div class="r">${quoteForm(c, false)}</div></div></section>`;
  return shell(c, D, { title: 'Designo Interiors — Corporate & Commercial Interior Designers in Mumbai', desc: 'Turnkey corporate, commercial and residential interiors in Mumbai since 1991. ISO 9001, 14001 and 45001 certified.', tone: 'overlay', body: body, image: s.showreel && s.showreel.poster });
}

const contactRows = (D) => { const s = D.site; return `<div class="ticks" style="max-width:440px;border-top:1px solid var(--line)"><a href="tel:${esc(s.phoneLink)}" style="color:var(--ink);text-decoration:none"><span>${esc(s.phone)}</span><span class="mono" style="color:var(--deep)">Call</span></a><a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener" style="color:var(--ink);text-decoration:none"><span>Message us on WhatsApp</span><span class="mono" style="color:var(--deep)">Chat</span></a><a href="mailto:${esc(s.email)}" style="color:var(--ink);text-decoration:none"><span>${esc(s.email)}</span><span class="mono" style="color:var(--deep)">Email</span></a></div>`; };
const brochures = (c, D, dark) => !(D.site.brochures || []).length ? '' : `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:24px;padding-top:28px;border-top:1px solid var(--lineD)"><span class="mono" style="margin-right:8px;color:var(--mist)">Download our credentials</span>${map(D.site.brochures, (b) => btn(c.m(b.file), esc(b.name) + ' <span>PDF ↓</span>', 'btn--line-light', ' target="_blank" rel="noopener"'))}</div>`;

function pageProjects(c, D) {
  const chips = [{ id: 'all', name: 'All', count: D.projects.length }].concat(D.sectors.filter((s) => s.count));
  const body = `
<section class="intro" style="padding-bottom:40px"><div class="wrap"><div><p class="eyebrow">Projects · ${D.projects.length} entries</p><h1 class="d h-xl">Our work</h1></div><p class="p" style="font-size:18px;max-width:460px">Offices, showrooms, restaurants, studios and homes, designed and built by Designo across Mumbai, Pune and Goa.</p></div></section>
<div class="filterbar"><div class="wrap"><div class="chips">${map(chips, (x, i) => `<button type="button" class="chip" data-filter="${x.id}" aria-pressed="${i ? 'false' : 'true'}">${esc(x.name)}<small>${x.count}</small></button>`)}</div><div class="toggle"><button type="button" data-view="grid" aria-pressed="true">Grid</button><button type="button" data-view="list" aria-pressed="false">Index</button></div></div></div>
<section class="px" style="padding-top:40px;padding-bottom:clamp(80px,10vw,144px)" data-projects><div class="wrap">
  <div class="grid-fill" style="--min:380px;gap:56px 24px" data-grid>${map(D.projects, (p) => `<a class="card" data-sector="${esc(p.sector)}" href="${c.u('projects/' + p.slug + '/')}"><div class="img r75">${img(c, p.cover, p.name)}<span class="tag">${esc(p.sectorName)}</span></div><div style="display:flex;gap:16px;align-items:baseline"><span class="num" style="font-size:11px">${p.index}</span><div style="display:flex;flex-direction:column;gap:8px;min-width:0"><span class="card__title" style="font-size:36px;line-height:.95">${esc(p.name)}</span><span class="mono muted">${esc(p.meta)} · ${p.photos.length} photo${p.photos.length === 1 ? '' : 's'}</span></div></div></a>`)}</div>
  <div class="table t-projects" data-list hidden><div class="th"><span>No.</span><span>Project</span><span>Client</span><span>Sector</span><span class="right">Area</span></div>${map(D.projects, (p) => `<a data-sector="${esc(p.sector)}" href="${c.u('projects/' + p.slug + '/')}"><span class="img r75" style="width:96px">${img(c, p.cover, '')}</span><span class="d" style="font-size:clamp(24px,2.4vw,34px);line-height:1">${esc(p.name)}</span><span class="muted" style="font-size:15px">${esc(p.client)}</span><span class="mono" style="color:var(--deep)">${esc(p.sectorName)}</span><span class="right" style="font:500 13px/1 var(--mono)">${esc(p.areaLabel)}</span></a>`)}</div>
  <p data-empty hidden class="muted" style="padding:80px 0;text-align:center">No projects in this sector yet. <a href="${c.u('contact/')}">Ask us about our work in it →</a></p>
</div></section>`;
  return shell(c, D, { title: 'Projects — Designo Interiors', desc: 'Corporate offices, showrooms, hospitality, studios and homes designed and built by Designo Interiors.', active: 'projects', body: body });
}

function pageProject(c, D, p, next) {
  const body = `
<section class="px" style="padding-top:clamp(32px,4vw,56px);padding-bottom:clamp(40px,5vw,72px)"><div class="wrap">
  <nav class="crumbs"><a href="${c.u('projects/')}">Projects</a><span>/</span><a href="${c.u('projects/')}?sector=${esc(p.sector)}">${esc(p.sectorName)}</a><span>/</span><span>${esc(p.name)}</span></nav>
  <div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:40px clamp(40px,6vw,96px);margin-top:clamp(32px,4vw,56px)"><h1 class="d" style="flex:7 1 560px;font-size:clamp(64px,9vw,152px);line-height:.84;text-wrap:balance">${esc(p.name)}</h1><div style="flex:4 1 320px;display:flex;flex-direction:column;gap:24px"><p style="margin:0;font-size:19px;line-height:1.55">${esc(p.summary)}</p><dl class="rule"><div class="kv"><dt>Client</dt><dd>${esc(p.client)}</dd></div><div class="kv"><dt>Sector</dt><dd>${esc(p.sectorName)}</dd></div>${p.areaLabel ? `<div class="kv"><dt>Area</dt><dd>${esc(p.areaLabel)}</dd></div>` : ''}</dl></div></div>
</div></section>
<section class="px"><div class="wrap">${p.photos[0] ? `<button type="button" class="zoom r169" data-shot="${esc(c.m(p.photos[0]))}" aria-label="Enlarge photo 1">${img(c, p.photos[0], p.name)}</button>` : ''}${p.photos.length > 1 ? `<div class="gallery">${map(p.photos.slice(1), (src, i) => `<button type="button" class="zoom r75" data-shot="${esc(c.m(src))}" aria-label="Enlarge photo ${i + 2}">${img(c, src, p.name + ' — photo ' + (i + 2))}</button>`)}</div>` : ''}</div></section>
<section class="px" style="padding-top:clamp(40px,5vw,64px)"><div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;padding-top:24px;border-top:1px solid var(--line)"><span class="mono muted">${p.photos.length} photo${p.photos.length === 1 ? '' : 's'} · Click any photo to enlarge</span>${btn(c.u('contact/', '#quote'), 'Plan a similar project <span>→</span>', 'btn--dark')}</div></section>
${next && next !== p ? `<section class="px sec"><a class="wrap" href="${c.u('projects/' + next.slug + '/')}" style="display:flex;flex-wrap:wrap;align-items:center;gap:32px clamp(32px,5vw,80px);color:var(--ink);text-decoration:none"><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:20px"><span class="eyebrow">Next project · ${esc(next.sectorName)}</span><span class="d" style="font-size:clamp(56px,7.5vw,120px);line-height:.86">${esc(next.name)} →</span></div><div class="img r75" style="flex:5 1 360px">${img(c, next.cover, next.name)}</div></a></section>` : '<div class="sec-top"></div>'}`;
  return shell(c, D, { title: p.name + ' — Designo Interiors', desc: p.summary, active: 'projects', body: body, image: p.cover });
}

function pageServices(c, D) {
  const cols = [['Design', ['Space planning and layouts', '3D visualisation', 'Vastu review', 'Lighting and acoustic design', 'Materials, finishes and furniture']], ['Build', ['Civil work', 'Carpentry and joinery', 'Partitions and aluminium sliding windows', 'Electrical, lighting and acoustics', 'Painting, carpets and vertical blinds']], ['Manage', ['Budgeting and estimates', 'Procurement', 'Installation and site management', 'Home and office automation', 'Maintenance after handover']]];
  const s = D.site;
  const body = `
${intro('Services', 'Turnkey<br>interiors', 'Design, planning, budgeting, procurement, execution and maintenance under one contract. Offices first, and every other sector our clients work in.', true)}
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap grid" style="--min:300px">${map(cols, ([h, items]) => `<div class="rule" style="padding-top:24px"><h2 class="d" style="font-size:48px;line-height:.95;margin-bottom:20px">${h}</h2><div class="plain">${map(items, (x) => `<span style="display:block">${x}</span>`)}</div></div>`)}</div></section>
<section class="px sec bg2"><div class="wrap">${head2('How a project runs', 'Five stages, one team')}<div class="grid rule" style="--min:220px;gap:0 32px">${map(PROCESS, (x, i) => `<div class="col" style="padding-top:24px"><span class="bignum">${pad(i + 1)}</span><h3 class="d" style="font-size:32px;line-height:1">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec"><div class="wrap">${head2('Sectors', 'Who we design for')}<div class="grid-fill" style="--min:320px">${map(D.sectors, (x) => `<a class="card" id="${esc(x.id)}" href="${x.count ? c.u('projects/') + '?sector=' + x.id : c.u('contact/', '#quote')}" style="scroll-margin-top:120px">${x.image ? `<div class="img r75">${img(c, x.image, x.name)}</div>` : `<div class="img r75 ph mono">Photo — ${esc(x.name)}</div>`}<div class="card__meta"><span class="card__title" style="font-size:36px;line-height:.95">${esc(x.name)}</span><span class="mono" style="color:var(--deep)">${x.countLabel} →</span></div><span class="p small">${esc(x.blurb)}</span></a>`)}</div></div></section>
<section class="px sec dark" id="automation"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:center;gap:48px clamp(40px,6vw,96px)"><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:24px"><p class="eyebrow">Intelligent Living by Designo</p><h2 class="d h2">Automation, built in</h2><p class="p" style="max-width:540px">We plan automation alongside the interior, so lights, appliances and devices respond to your voice through Alexa and blend into the design rather than being added later.</p><div class="ticks" style="max-width:560px;border-top:1px solid var(--lineD)">${map(AUTOMATION, (a, i) => `<div><span>${a}</span><span class="num">${pad(i + 1)}</span></div>`)}</div></div><div class="img r45" style="flex:5 1 360px;background:#0B1C15">${img(c, s.images && s.images.automation, 'Conference room with integrated lighting')}</div></div></section>
<section class="px sec-top"><div class="wrap cells" style="--min:240px"><div><span class="d" style="font-size:64px;line-height:1">45</span><span class="mono" style="color:var(--deep)">Day timelines</span><span class="muted small">Efficient, dependable delivery.</span></div><div><span class="d" style="font-size:64px;line-height:1">10</span><span class="mono" style="color:var(--deep)">Year warranty</span><span class="muted small">Built to last, backed by guarantee.</span></div><div><span class="d" style="font-size:64px;line-height:1">3×</span><span class="mono" style="color:var(--deep)">ISO certified</span><span class="muted small">9001 · 14001 · 45001.</span></div><a href="${c.u('vastu/')}" style="color:var(--ink);text-decoration:none"><span class="d" style="font-size:64px;line-height:1">Vastu</span><span class="mono" style="color:var(--deep)">Compliant layouts →</span><span class="muted small">Built for balance and business success.</span></a></div></section>
<section class="px sec"><div class="wrap bg2" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:32px 64px;padding:clamp(32px,4vw,56px)"><div style="flex:1 1 480px;display:flex;flex-direction:column;gap:18px"><p class="eyebrow">Free online consultation</p><h2 class="d" style="font-size:clamp(40px,4.8vw,72px);line-height:.92">Talk to us before you commit</h2><p class="p" style="max-width:600px">Share your ideas, budget and references during working hours. After the first call we can give you an approximate estimate, then measure the site and prepare a detailed one, with 3D views of the project.*</p><span class="muted" style="font-size:13px">*Terms and conditions apply.</span></div>${btn(c.u('contact/', '#consult'), 'Book a consultation <span>→</span>', 'btn--dark')}</div></section>`;
  return shell(c, D, { title: 'Services — Turnkey Interiors — Designo Interiors', desc: 'Turnkey interior design and build for corporate offices, retail, hospitality, education, healthcare, studios and homes.', active: 'services', body: body });
}

function pageAbout(c, D) {
  const s = D.site;
  const body = `
${intro('About Designo', 'Since 1991', 'Designo Interiors is a corporate interior design and turnkey project firm based in Mumbai. We plan, design and build workplaces, retail, hospitality and residential interiors, and manage every trade on site under one contract.', true)}
<section class="px"><div class="wrap img r219">${img(c, s.images && s.images.about, 'Townhall and conference room interior')}</div></section>
<section class="px sec"><div class="wrap"><p class="eyebrow" style="margin-bottom:40px">01 — How we work</p><div class="grid rule" style="--min:300px">${map([['Our style', 'Contemporary design that respects the building it sits in. We keep original features and character where they matter, and shape each space around how the client works.'], ['Our approach', 'A personal service from brief to handover. We listen, advise and develop a concept that meets your expectations and your budget, then manage every detail of delivery.'], ['Our network', 'Three decades of suppliers, contractors, craftsmen and artisans who share our standards, with materials and furniture sourced from local and international brands.']], (x) => `<div class="col" style="gap:16px"><h2 class="d" style="font-size:44px;line-height:.95">${x[0]}</h2><p class="p">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec bg2"><div class="wrap split"><div class="l" style="flex:5 1 360px"><p class="eyebrow">02 — Where we work</p><p class="d" style="font-size:clamp(48px,6.4vw,104px);line-height:.9">Mumbai<br>Navi Mumbai<br>Thane<br>Pune<br><span class="green">Goa</span></p></div><div class="r grid" style="flex:6 1 420px;--min:240px;align-content:end">${map(s.offices, (o) => `<div class="rule" style="display:flex;flex-direction:column;gap:12px;padding-top:20px"><span class="mono" style="color:var(--deep)">${esc(o.name)} office</span><span style="font-size:17px;line-height:1.55">${esc(o.address)}</span><a class="link" href="https://maps.google.com/?q=${encodeURIComponent(o.mapQuery || o.address)}" target="_blank" rel="noopener">Directions ↗</a></div>`)}</div></div></section>
<section class="px sec"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:48px clamp(40px,6vw,96px)"><div class="img r45" style="flex:4 1 320px">${s.images && s.images.founder ? img(c, s.images.founder, 'Sanjeev M. Haldankar') : '<div class="ph mono" style="height:100%">Portrait — Sanjeev M. Haldankar</div>'}</div><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:24px"><p class="eyebrow">03 — Leadership</p><h2 class="d h2">Sanjeev M. Haldankar</h2><p class="p" style="max-width:600px;font-size:18px">Sanjeev Haldankar leads Designo’s design practice. Over more than 25 years he has led 300+ projects across commercial, residential, retail, studio and healthcare work.</p><p class="p" style="max-width:600px;font-size:18px">His focus is calm, low-stress spaces, delivered with close control of quality, time and cost.</p></div></div></section>
<section class="px sec dark" id="certifications"><div class="wrap"><div class="headrow" style="margin-bottom:56px"><div><p class="eyebrow">04 — Certifications</p><h2 class="d h2" style="max-width:900px">Certified three times over</h2></div><p class="p" style="max-width:420px">Designo is one of very few interior design firms in India certified for quality, environmental, and occupational health and safety management.</p></div><div class="grid" style="--min:320px;gap:24px">${map(CERTS, (x) => `<div style="display:flex;flex-direction:column;gap:16px;padding:32px;border:1px solid var(--lineD)"><span class="d" style="font-size:clamp(56px,5vw,80px);line-height:1">${x[0]}</span><span class="mono" style="color:var(--mist)">${x[1]} System</span><p class="p" style="font-size:16px">${x[3]}</p></div>`)}</div></div></section>
${(s.brochures || []).length ? `<section class="px sec"><div class="wrap split"><div class="l"><p class="eyebrow">05 — Credentials</p><h2 class="d h2">Download our brochures</h2></div><div class="r rule">${map(s.brochures, (b) => `<a href="${esc(c.m(b.file))}" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;align-items:center;gap:24px;padding:24px 0;border-bottom:1px solid var(--line);color:var(--ink);text-decoration:none"><span class="d" style="font-size:clamp(28px,3vw,44px);line-height:1">${esc(b.name)}</span><span class="mono" style="color:var(--deep)">PDF ↓</span></a>`)}</div></div></section>` : ''}`;
  return shell(c, D, { title: 'About & Certifications — Designo Interiors', desc: 'Designo Interiors is a corporate interior design and turnkey project firm in Mumbai, certified to ISO 9001, 14001 and 45001.', active: 'about', body: body });
}

function pageSustainability(c, D) {
  const s = D.site;
  const why = [['Environmental preservation', 'Materials and methods that use fewer finite resources, create less waste and do less harm to habitats.'], ['Healthier indoor air', 'Low-VOC materials reduce respiratory irritation, allergies and headaches for the people inside.'], ['Resource conservation', 'Designs that save water and energy every day the space is in use.'], ['Lower carbon footprint', 'Energy-efficient appliances, local sourcing and natural light all cut emissions.'], ['Long-term savings', 'Efficient systems and durable materials lower running and maintenance costs.'], ['Well-being', 'Natural elements and healthy materials make spaces more comfortable to live and work in.']];
  const init = [['Low-VOC paints and finishes', 'Finishes that don’t release harmful chemicals into the air, safer for occupants, our team and the planet.'], ['Energy-efficient lighting and appliances', 'Fittings that use less electricity and water, plus natural light and ventilation wherever possible to reduce cooling loads.'], ['Local sourcing', 'We work with local artisans and suppliers, which cuts transport emissions.'], ['Waste reduction', 'Usable materials from demolition are donated to local charities and recycling centres.'], ['Eco-tech integration', 'Smart lighting, renewable energy and efficient appliances that save or generate electricity.'], ['Water conservation', 'Water-saving fixtures, rainwater harvesting and water management systems.']];
  const gains = [['Lower energy costs', 'Renewable sources, low-energy appliances and durable materials reduce utility and repair bills.'], ['Higher property value', 'Green buildings tend to command better occupancy, rents and resale values.'], ['Tax incentives', 'Depending on the project, green building measures such as rooftop solar can qualify for subsidies or rebates.'], ['Built for Mumbai’s climate', 'Comfortable, resilient spaces in a hot, humid city, with less heat stress and lower emissions.']];
  const body = `
<section class="hero hero--short"><div class="hero__media">${img(c, s.images && s.images.sustainability, 'Conference room among tropical planting')}</div><div class="hero__shade"></div><div class="hero__inner wrap-wide px"><p class="eyebrow">Designo EcoVisions · ISO 14001</p><h1 class="d" style="font-size:clamp(64px,10vw,168px);line-height:.84">A greener<br>tomorrow</h1><p style="margin:32px 0 0;max-width:620px;font:300 clamp(18px,1.6vw,22px)/1.5 var(--sans)">Sustainability runs through how we specify, source and build. Every client who works with us contributes to a cleaner, safer environment as well as a better space.</p></div></section>
<section class="px sec"><div class="wrap">${head2('01 — Why it matters', 'Better for people and place')}<div class="grid rule" style="--min:300px;gap:0 40px">${map(why, (x) => `<div style="padding:28px 0;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:12px"><h3 class="d" style="font-size:32px;line-height:1">${x[0]}</h3><p class="p" style="font-size:16px">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec dark"><div class="wrap split"><div class="l"><p class="eyebrow">02 — Our initiatives</p><h2 class="d h2">What we do on every project</h2><div class="img r75" style="margin-top:16px">${img(c, s.images && s.images.vastu, 'Sunlit window-side office')}</div></div><ol class="r" style="list-style:none;margin:0;padding:0;border-top:1px solid var(--lineD)">${map(init, (x, i) => `<li class="row" style="padding:26px 0"><span class="num" style="flex:0 0 40px">${pad(i + 1)}</span><div style="flex:1 1 360px;display:flex;flex-direction:column;gap:10px"><h3 class="d" style="font-size:36px;line-height:1">${x[0]}</h3><p class="p" style="font-size:16px">${x[1]}</p></div></li>`)}</ol></div></section>
<section class="px sec"><div class="wrap">${head2('03 — What you gain', 'Your benefits')}<div class="cells" style="--min:260px">${map(gains, (x, i) => `<div><span class="num" style="font-size:11px">${pad(i + 1)}</span><h3 class="d" style="font-size:34px;line-height:1">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec bg2"><div class="wrap split"><div class="l" style="flex:5 1 360px"><p class="eyebrow">Join our green mission</p><h2 class="d h2">Got an idea for a greener space?</h2><p class="p" style="max-width:460px">We want to hear about sustainable products, ideas and initiatives, and to explore them with you on your next project.</p><a class="link" href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">Message us on WhatsApp →</a></div><div class="r" style="flex:6 1 420px"><form class="form" data-form="ecovisions">${hp}${field('Name', 'name', { required: true })}${field('Email', 'email', { type: 'email', required: true })}${field('Your idea', 'message', { rows: 3, full: true })}<label class="check full"><input type="checkbox" name="updates" value="Yes">Send me occasional updates on sustainable design.</label><div class="form__end"><span></span><button class="btn btn--dark" type="submit">Send <span>→</span></button></div></form>${done('Thank you', 'We’ll be in touch.')}</div></div></section>`;
  return shell(c, D, { title: 'Designo EcoVisions — Sustainable Interiors — Designo Interiors', desc: 'Low-VOC finishes, energy-efficient lighting, local sourcing, waste reduction and water conservation in every Designo interior.', active: 'sustainability', tone: 'overlay', body: body });
}

function pageVastu(c, D) {
  const s = D.site;
  const steps4 = [['Consultation', 'He begins by understanding your life, your work and what you need from the space.'], ['Site study', 'Orientation, natural and artificial light, room colours and shapes, materials, and where furniture, objects and technology sit.'], ['Recommendations', 'Advice for a balanced, healthy, supportive space, with personal recommendations where they help.'], ['Into the design', 'We build his recommendations into the drawings, so the finished space is harmonious and efficient.']];
  const vastuPost = D.posts.find((p) => p.category === 'Vastu');
  const body = `
<section class="px" style="padding-top:clamp(48px,6vw,96px);padding-bottom:var(--sy)"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:stretch;gap:48px clamp(40px,6vw,96px)"><div style="flex:6 1 480px;display:flex;flex-direction:column;justify-content:space-between;gap:40px"><div style="display:flex;flex-direction:column;gap:20px"><p class="eyebrow">Vastu Shastra</p><h1 class="d" style="font-size:clamp(72px,10vw,168px);line-height:.82">Planned<br>for balance</h1></div><div style="display:flex;flex-direction:column;gap:20px;max-width:580px"><p style="margin:0;font-size:18px;line-height:1.6">Vastu Shastra is the traditional Indian system of architecture. Its principles cover layout, measurement, orientation and spatial geometry, with the aim of bringing a building into harmony with nature.</p><p class="p" style="font-size:18px">The arrangement of an interior affects the people who use it. In dense city buildings a fully Vastu-planned layout isn’t always possible, so careful choices of furniture, colour and accessories can bring a space into compliance.</p></div></div><div class="img" style="flex:5 1 380px;min-height:520px">${img(c, s.images && s.images.vastu, 'Sunlit window-side office')}</div></div></section>
<section class="px sec dark"><div class="wrap"><div class="headrow" style="margin-bottom:56px"><div><p class="eyebrow">Designo &amp; Vastu</p><h2 class="d h2">Our in-house consultant</h2></div><p class="p" style="max-width:440px">Our Vastu consultant has worked with Designo since the firm’s early years, and reviews each project before the layout is final.</p></div><div class="grid rule" style="--min:260px;gap:0 32px">${map(steps4, (x, i) => `<div class="col"><span class="bignum" style="font-size:64px">${pad(i + 1)}</span><h3 class="d" style="font-size:32px;line-height:1">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec"><div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:32px 64px"><div style="flex:1 1 560px;display:flex;flex-direction:column;gap:20px"><p class="eyebrow">For workplaces and homes</p><p class="d" style="font-size:clamp(40px,5.2vw,84px);line-height:.95;text-wrap:balance">Vastu-compliant layouts, built for balance and business success.</p></div><div class="btns">${btn(c.u('contact/', '#consult'), 'Book a Vastu consultation <span>→</span>', 'btn--dark')}${vastuPost ? btn(c.u('journal/' + vastuPost.slug + '/'), 'Read: ' + esc(vastuPost.title), 'btn--line') : ''}</div></div></section>`;
  return shell(c, D, { title: 'Vastu Shastra Consultancy — Designo Interiors', desc: 'Vastu-compliant interiors for offices and homes, reviewed by Designo’s in-house Vastu consultant.', active: 'services', body: body });
}

function pageClientele(c, D) {
  const C = D.clients;
  const body = `
${intro('Clientele', 'Who we’ve<br>built for', 'Multinational offices, a university, municipal buildings, hotels, retail chains, a recording studio and more than 65 private homes.')}
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap wall">${map(C.wall, (n) => `<div>${esc(n)}</div>`)}</div></section>
<section class="px sec bg2"><div class="wrap">${head2('Offices &amp; institutions · designed and executed', 'Workplaces', `<span class="mono muted">${(C.offices || []).length} listed</span>`)}<div class="table t-clients"><div class="th"><span>No.</span><span>Client</span><span>Location</span><span class="right">Sq ft</span></div>${map(C.offices, (o, i) => `<div><span class="num" style="font-size:11px">${pad(i + 1)}</span><span style="font-size:17px;font-weight:500">${esc(o.name)}</span><span class="muted" style="font-size:15px">${esc(o.place)}</span><span class="right" style="font:500 13px/1 var(--mono)">${o.area ? inr(o.area) : '—'}</span></div>`)}</div></div></section>
<section class="px sec"><div class="wrap">${head2('Beyond the office', 'Hospitality, retail, buildings')}<div class="grid" style="--min:300px;gap:48px 40px">${map(C.groups, (g) => `<div class="rule" style="padding-top:20px"><h3 class="d" style="font-size:32px;line-height:1;margin-bottom:12px">${esc(g.name)}</h3>${map(g.items, (it) => `<div style="padding:10px 0;border-bottom:1px solid rgba(20,32,27,.14);font-size:16px;line-height:1.45">${esc(it)}</div>`)}</div>`)}</div></div></section>
<section class="px sec dark"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:32px clamp(40px,6vw,96px)"><div style="display:flex;flex-direction:column;gap:12px"><p class="eyebrow">Residential</p><span class="d" style="font-size:clamp(96px,14vw,232px);line-height:.8">${esc(C.homes)}</span><span class="mono" style="color:var(--mist)">Private homes</span></div><p class="lede" style="flex:1 1 380px;max-width:560px">Apartments and bungalows in ${esc(C.homeAreas)}. We keep residential client names private.</p></div></section>`;
  return shell(c, D, { title: 'Clientele — Designo Interiors', desc: 'Offices, institutions, hotels, retail chains, studios and homes designed and built by Designo Interiors since 1991.', active: 'clientele', body: body });
}

function pageContact(c, D) {
  const s = D.site;
  const chip = (k, v, label) => `<button type="button" class="chip" data-pick="${k}" data-val="${esc(v)}" aria-pressed="false">${label || esc(v)}</button>`;
  const body = `
<section class="intro" style="padding-bottom:clamp(40px,5vw,64px)"><div class="wrap"><div><p class="eyebrow">Contact</p><h1 class="d h-xl">Let’s talk</h1></div><div class="grid rule" style="--min:220px;gap:0 32px;flex:0 1 620px">${[['Call', `<a href="tel:${esc(s.phoneLink)}">${esc(s.phone)}</a>`], ['WhatsApp', `<a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">Message us →</a>`], ['Email', `<a href="mailto:${esc(s.email)}" style="word-break:break-all">${esc(s.email)}</a>`], ['Hours', esc(s.hours)]].map((x) => `<div style="display:flex;flex-direction:column;gap:8px;padding:18px 0;border-bottom:1px solid var(--line)"><span class="mono" style="color:var(--deep)">${x[0]}</span><span style="font-size:18px">${x[1].replace(/<a /, '<a style="color:var(--ink);text-decoration:none" ')}</span></div>`).join('')}</div></div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap box" data-tabs-box>
  <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="quote" aria-selected="true"><span class="mono">01</span><span class="d">Get a quote</span></button><button type="button" role="tab" data-tab="consult" aria-selected="false"><span class="mono">02 · Free</span><span class="d">Book a consultation</span></button></div>
  <div class="box__body">
    <div data-panel="quote">${quoteForm(c, true)}</div>
    <div data-panel="consult" hidden><form class="form" data-form="consultation" data-picker style="display:flex;flex-direction:column;gap:36px">${hp}<input type="hidden" name="mode"><input type="hidden" name="day"><input type="hidden" name="time">
      <div style="display:flex;flex-direction:column;gap:14px"><span class="mono muted">How would you like to meet?</span><div class="chips">${chip('mode', 'Online')}${chip('mode', 'At our office')}${chip('mode', 'Site visit')}</div></div>
      <div style="display:flex;flex-direction:column;gap:14px"><span class="mono muted">Pick a day</span><div class="days" data-days></div></div>
      <div style="display:flex;flex-direction:column;gap:14px"><span class="mono muted">Time</span><div class="chips">${map(['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'], (t) => chip('time', t))}</div></div>
      <div class="form">${field('Name', 'name', { required: true })}${field('Phone', 'phone', { type: 'tel', required: true })}${field('Email', 'email', { type: 'email' })}</div>
      <div class="form__end" style="padding-top:24px;border-top:1px solid var(--line)"><span class="mono" style="color:var(--deep)" data-summary></span><button class="btn btn--dark" type="submit">Confirm booking <span>→</span></button></div>
    </form>${done('Consultation requested', 'Thank you. We’ll confirm by phone.')}</div>
  </div>
</div></section>
<section class="px sec bg2"><div class="wrap">${head2('Offices', 'See us in person')}<div class="grid" style="--min:420px;gap:24px">${map(s.offices, (o) => `<div style="background:var(--paper);display:flex;flex-direction:column"><iframe class="map" title="Map — ${esc(o.name)} office" src="https://www.google.com/maps?q=${encodeURIComponent(o.mapQuery || o.address)}&amp;output=embed" loading="lazy"></iframe><div style="padding:28px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px"><div style="display:flex;flex-direction:column;gap:10px"><span class="d" style="font-size:36px;line-height:1">${esc(o.name)}</span><span class="muted" style="font-size:16px;line-height:1.55;max-width:320px">${esc(o.address)}</span></div><a class="link" href="https://maps.google.com/?q=${encodeURIComponent(o.mapQuery || o.address)}" target="_blank" rel="noopener">Directions ↗</a></div></div>`)}</div></div></section>`;
  return shell(c, D, { title: 'Contact & Quote — Designo Interiors', desc: 'Get a quote or book a free consultation with Designo Interiors. Offices in Bhandup West and Powai, Mumbai.', active: 'contact', body: body, cta: false });
}

function pageCareers(c, D) {
  const roles = D.jobs.map((j) => j.title).concat('General application');
  const body = `
${intro('Careers · We’re hiring', 'Build<br>with us', 'We’re looking for designers, site teams and visualisers who care about detail and delivery. Apply for an open role, or send your CV for future openings.')}
${D.jobs.length ? `<section class="px" style="padding-bottom:var(--sy)"><div class="wrap rule">${map(D.jobs, (j, i) => `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:16px 40px;padding:28px 0;border-bottom:1px solid var(--line)"><span class="num" style="flex:0 0 40px">${pad(i + 1)}</span><div style="flex:3 1 360px;display:flex;flex-direction:column;gap:10px"><span class="d h3">${esc(j.title)}</span><span class="p" style="font-size:16px">${esc(j.summary)}</span></div><span class="mono" style="flex:1 1 180px;color:var(--deep)">${esc([j.type, j.place].filter(Boolean).join(' · '))}</span><button type="button" class="btn btn--line" data-apply="${esc(j.title)}">Apply →</button></div>`)}</div></section>` : ''}
<section class="px sec bg2" id="apply"><div class="wrap split"><div class="l"><p class="eyebrow">Apply now</p><h2 class="d h2">Send us your CV</h2><p class="p" style="max-width:400px">Attach your resume and a link to your portfolio if you have one.</p></div><div class="r"><form class="form" data-form="careers">${hp}${field('Name', 'name', { required: true })}${field('Phone', 'phone', { type: 'tel' })}${field('Email', 'email', { type: 'email', required: true })}${select('Role', 'role', roles)}${field('Portfolio link', 'portfolio', { type: 'url', placeholder: 'https://', full: true })}<label class="upload full"><span style="display:flex;flex-direction:column;gap:6px"><span class="mono muted">Resume *</span><span data-file-label>PDF or Word, up to 5 MB</span></span><span class="mono" style="color:var(--deep)">Choose file ↑</span><input type="file" name="resume" accept=".pdf,.doc,.docx" required></label><div class="form__end"><span></span><button class="btn btn--dark" type="submit">Submit application <span>→</span></button></div></form>${done('Application received', 'Thank you for applying.', 'We’ll contact you if your profile matches a current or upcoming role.')}</div></div></section>`;
  return shell(c, D, { title: 'Careers — Designo Interiors', desc: 'Join Designo Interiors: interior designers, site supervisors and 3D visualisers in Mumbai.', body: body });
}

function pageJournal(c, D) {
  const cats = ['all'].concat(D.posts.map((p) => p.category).filter((x, i, a) => x && a.indexOf(x) === i));
  const lead = D.posts[0], rest = D.posts.slice(1);
  const body = `
<section class="intro" style="padding-bottom:40px"><div class="wrap"><div><p class="eyebrow">Journal</p><h1 class="d h-xl">Notes<br>from site</h1></div>${cats.length > 2 ? `<div class="chips">${map(cats, (k, i) => `<button type="button" class="chip" data-cat="${esc(k)}" aria-pressed="${i ? 'false' : 'true'}">${k === 'all' ? 'All' : esc(k)}</button>`)}</div>` : ''}</div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap" style="display:flex;flex-direction:column;gap:56px">
${lead ? `<a data-post-cat="${esc(lead.category)}" href="${c.u('journal/' + lead.slug + '/')}" style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:32px clamp(32px,5vw,72px);padding-top:24px;border-top:1px solid var(--ink);color:var(--ink);text-decoration:none"><div class="img r1610" style="flex:7 1 520px">${img(c, lead.cover, lead.title)}</div><div style="flex:4 1 320px;display:flex;flex-direction:column;gap:18px"><span class="mono" style="color:var(--deep)">${esc(lead.category)} · ${lead.dateLabel}</span><span class="d" style="font-size:clamp(40px,4.4vw,68px);line-height:.92;text-wrap:balance">${esc(lead.title)}</span><span class="p">${esc(lead.excerpt)}</span><span class="link">Read →</span></div></a>` : '<p class="muted">No posts yet.</p>'}
<div class="grid-fill">${map(rest, (p) => `<a data-post-cat="${esc(p.category)}" class="card" href="${c.u('journal/' + p.slug + '/')}" style="padding-top:20px;border-top:1px solid rgba(20,32,27,.25)"><span class="mono" style="color:var(--deep)">${esc(p.category)} · ${p.dateLabel}</span><div class="img r75">${img(c, p.cover, p.title)}</div><span class="d" style="font-size:32px;line-height:.95">${esc(p.title)}</span><span class="p small">${esc(p.excerpt)}</span></a>`)}</div>
</div></section>`;
  return shell(c, D, { title: 'Journal — Designo Interiors', desc: 'Notes on workplace design, Vastu, sustainability and automation from Designo Interiors.', active: 'journal', body: body });
}

function pagePost(c, D, p, next) {
  const body = `
<article class="px" style="padding-top:clamp(32px,4vw,56px);padding-bottom:var(--sy)"><div class="wrap">
  <nav class="crumbs"><a href="${c.u('journal/')}">Journal</a><span>/</span><span>${esc(p.category)}</span></nav>
  <h1 class="d" style="margin-top:clamp(28px,4vw,48px);max-width:1100px;font-size:clamp(56px,7.5vw,120px);line-height:.86;text-wrap:balance">${esc(p.title)}</h1>
  <p class="mono" style="margin:24px 0 0;color:var(--deep)">${p.dateLabel} · ${esc(p.category)}</p>
  ${p.cover ? `<div class="img r219" style="margin-top:clamp(32px,4vw,56px)">${img(c, p.cover, p.title)}</div>` : ''}
  <div class="article"><p class="lede">${esc(p.excerpt)}</p><div class="body">${p.body || ''}</div>
  <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid var(--line)"><a class="link" href="${c.u('journal/')}">← All notes</a>${next && next !== p ? `<a class="link" href="${c.u('journal/' + next.slug + '/')}">Next: ${esc(next.title)} →</a>` : ''}</div></div>
</div></article>`;
  return shell(c, D, { title: p.title + ' — Designo Interiors', desc: p.excerpt, active: 'journal', body: body, image: p.cover });
}

function pageReferral(c, D) {
  const terms = [['Eligibility', 'Participants must be 18 or older, with a valid email address and ID proof.'], ['Referral validity', 'The referred client must sign a contract for a project above the minimum qualifying size of ₹5,00,000.'], ['Reward distribution', 'Rewards are paid in line with the client’s payment phases.'], ['Payment method', 'Rewards are paid by bank transfer or in cash.'], ['One-time use', 'A reward applies once per project and can’t be combined with other discounts or promotions.'], ['Fraud prevention', 'Designo may investigate suspicious, fraudulent or abusive activity and may withhold or cancel rewards, end a participant’s involvement or pursue legal remedies. Participants agree to cooperate with any investigation.'], ['Changes to the programme', 'Designo may modify, suspend or end the programme at any time without notice, and may offer a grace period to redeem outstanding rewards.'], ['Dispute resolution', 'Disputes go first to Designo’s designated representative. If unresolved, both parties use a mutually agreed mediator and bear their own costs unless agreed otherwise.'], ['Privacy and data protection', 'Personal information is used only to run the programme, in line with our Privacy Policy. You can ask to access, update or delete it, subject to legal or contractual obligations.']];
  const phase = (n, text, key) => `<div class="row" style="padding:20px 0"><span class="mono" style="flex:0 0 100px;color:var(--green)">Phase ${n}</span><span class="p" style="flex:1 1 260px;font-size:16px">${text}</span><span style="font:500 16px/1 var(--mono)" ${key}></span></div>`;
  const body = `
${intro('Designo referral programme', 'Refer a project,<br><span class="green">earn 5%</span>', 'Introduce a friend, colleague or company to Designo. When they sign, you earn 5% of the project value, paid as they pay us.')}
<section class="px"><div class="wrap cells" style="--min:280px"><div style="background:var(--dark);color:var(--paper);padding:36px 32px"><span class="d" style="font-size:clamp(72px,7vw,112px);line-height:.9">5%</span><span class="mono" style="color:var(--mist)">Of project value · every referral</span></div><div style="padding:36px 32px"><span class="d" style="font-size:clamp(72px,7vw,112px);line-height:.9">₹10,000</span><span class="mono" style="color:var(--deep)">Bonus at 3 successful referrals</span></div><div style="padding:36px 32px"><span class="d" style="font-size:clamp(72px,7vw,112px);line-height:.9">₹20,000</span><span class="mono" style="color:var(--deep)">Bonus at 5 successful referrals</span></div></div></section>
<section class="px sec"><div class="wrap split" data-calc><div class="l"><p class="eyebrow">How rewards are paid</p><h2 class="d h2">In three phases</h2><p class="p" style="max-width:400px">Your 5% is released as the client pays each stage of the project. Move the slider to see an example.</p></div><div class="r" style="display:flex;flex-direction:column;gap:28px"><div class="box" style="padding:28px;display:flex;flex-direction:column;gap:14px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px"><span class="mono muted">Project value</span><span class="d" style="font-size:44px;line-height:1" data-v></span></div><input class="range" type="range" min="500000" max="20000000" step="100000" value="4000000" aria-label="Project value"><div style="display:flex;justify-content:space-between;font:500 11px/1 var(--mono);color:var(--ink2)"><span>₹5 lakh minimum</span><span>₹2 crore</span></div></div><div class="rule">${phase(1, 'Client pays the 50% advance before work starts.', 'data-p1')}${phase(2, 'Client pays the next 40%, 15 days after work begins.', 'data-p2')}${phase(3, 'Client pays the final 10%, 7 days after completion.', 'data-p3')}<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:16px;padding:22px 0"><span class="mono">Your total reward</span><span class="d" style="font-size:56px;line-height:1;color:var(--deep)" data-total></span></div></div></div></div></section>
<section class="px sec bg2"><div class="wrap">${head2('How to enrol', 'Three steps')}<div class="grid rule" style="--min:280px;gap:0 32px">${map([['Check eligibility', 'You must be 18 or older with a valid email address and ID proof. Referred projects must be worth at least ₹5,00,000.'], ['Apply online', 'Fill in the form below with your details, the project and the person you’re referring. Accurate details avoid delays.'], ['Get approved', 'We confirm eligibility within 1–2 business days. Once your referral signs up, you qualify for the reward.']], (x, i) => `<div class="col" style="padding-top:24px"><span class="bignum" style="font-size:64px">${pad(i + 1)}</span><h3 class="d" style="font-size:32px;line-height:1">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div><p style="margin:40px 0 0;padding:20px 24px;background:var(--paper);font-size:16px;line-height:1.55"><strong style="font-weight:600">Referring a company?</strong> Corporate referrals earn appreciation rewards too. Choose “Commercial project” as the project type.</p></div></section>
<section class="px sec"><div class="wrap split"><div class="l"><p class="eyebrow">Application</p><h2 class="d h2">Refer now</h2></div><div class="r"><form class="form" data-form="referral">${hp}<span class="full mono" style="color:var(--deep);padding-bottom:12px;border-bottom:1px solid var(--ink)">Your details</span>${field('Name', 'name', { required: true })}${field('Email', 'email', { type: 'email', required: true })}${field('Phone', 'phone', { type: 'tel', required: true })}<span class="full mono" style="color:var(--deep);padding-bottom:12px;border-bottom:1px solid var(--ink);margin-top:8px">Who are you referring?</span>${field('Name or company', 'referred_name', { required: true })}${field('Their phone or email', 'referred_contact', { required: true })}${select('Project type', 'type', ['Residential project', 'Commercial project'])}${field('Approx. project value', 'value', { placeholder: 'e.g. ₹40 lakh' })}<label class="check full"><input type="checkbox" name="terms" value="Agreed" required>I agree to the programme terms and conditions below.</label><div class="form__end"><span></span><button class="btn btn--dark" type="submit">Submit referral <span>→</span></button></div></form>${done('Referral received', 'Thank you. We’ll confirm within 1–2 business days.')}</div></div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap split"><p class="eyebrow l" style="flex:4 1 320px">Terms &amp; conditions</p><div class="r rule">${map(terms, (t, i) => `<details><summary>${i + 1}. ${t[0]}</summary><p>${t[1]}</p></details>`)}</div></div></section>`;
  return shell(c, D, { title: 'Referral Programme — Designo Interiors', desc: 'Refer a project to Designo Interiors and earn 5% of the project value, plus bonus rewards.', body: body });
}

function page404(c, D) {
  return shell(c, D, { title: 'Page not found — Designo Interiors', desc: '', body: `<section class="intro" style="min-height:60vh"><div class="wrap"><div><p class="eyebrow">404</p><h1 class="d h-xl">Page not found</h1></div><div class="btns">${btn(c.u(''), 'Home <span>→</span>', 'btn--dark')}${btn(c.u('projects/'), 'Projects', 'btn--line')}</div></div></section>` });
}

if (typeof module !== 'undefined') module.exports = { buildSite: buildSite };

if (typeof require !== 'undefined' && typeof process !== 'undefined' && require.main === module) {
  const fs = require('fs'), path = require('path');
  const root = path.resolve(__dirname, '..');
  const copy = (from, to) => { if (!fs.existsSync(from)) return; for (const n of fs.readdirSync(from)) { const a = path.join(from, n), b = path.join(to, n); if (fs.statSync(a).isDirectory()) { fs.mkdirSync(b, { recursive: true }); copy(a, b); } else fs.copyFileSync(a, b); } };
  fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  copy(path.join(root, 'static'), path.join(root, 'dist'));
  fs.mkdirSync(path.join(root, 'dist/media'), { recursive: true });
  copy(path.join(root, 'media'), path.join(root, 'dist/media'));
  buildSite({
    read: (p) => fs.readFileSync(path.join(root, p), 'utf8'),
    list: (d) => fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d)) : [],
    write: (p, s) => { const f = path.join(root, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); }
  }, { pretty: process.argv.indexOf('--preview') === -1 }).then((n) => console.log('Built ' + n + ' pages into dist/'), (e) => { console.error(e.message); process.exit(1); });
}
