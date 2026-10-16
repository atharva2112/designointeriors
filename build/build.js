/* Designo Interiors — static site generator.
   Reads content/*.json (edited in Pages CMS) and writes the finished site to dist/.
   Run: node build/build.js   (no dependencies)  */
'use strict';

const NAV = [['services', 'Services'], ['sectors', 'Sectors'], ['projects', 'Projects'], ['clientele', 'Clientele'], ['about', 'About'], ['journal', 'Journal'], ['contact', 'Contact']];
const MENU = [['', 'Home'], ['services/', 'Services'], ['sectors/', 'Sectors'], ['projects/', 'Projects'], ['why-designo/', 'Why Designo'], ['fit-out-process/', 'Fit-out process'], ['clientele/', 'Clientele'], ['about/', 'About'], ['sustainability/', 'Sustainability'], ['vastu/', 'Vastu Shastra'], ['journal/', 'Journal'], ['faq/', 'FAQ'], ['contact/', 'Contact']];
const PROCESS = [
  ['Consult', 'A free first conversation, online or at our office, about your brief, budget and references.'],
  ['Estimate', 'An approximate estimate after the first call, then site measurements and a detailed requirement study.'],
  ['Design', 'Space planning, a Vastu review where wanted, and 3D views of the proposed interior.'],
  ['Build', 'Civil work, joinery, electrical, finishes and installation, run under ISO 9001 and 45001 practices.'],
  ['Handover', 'Delivered on agreed timelines and backed by a 10-year warranty.']
];
const AUTOMATION = ['Smart lighting and scenes', 'Voice control through Alexa', 'Device and appliance control', 'Energy-efficient systems'];
const CERTS = [
  ['ISO 9001', 'Quality Management', 'Consistent, efficient delivery, with processes we review and improve on every project.', 'The most widely recognised quality standard in the world. It sets out how we plan, run and continually improve project delivery, so the result is consistent from one site to the next.', 'iso-9001-white.png', 269, 269],
  ['ISO 14001', 'Environmental Management', 'Less waste, fewer resources used and pollution prevented on site and in what we specify.', 'A framework for identifying and controlling the environmental impact of our work. It guides how we cut waste, conserve resources and prevent pollution, and how we choose eco-friendly, energy-efficient materials.', 'iso-14001-white.png', 260, 251],
  ['ISO 45001', 'Occupational Health & Safety', 'Safe, hygienic sites for our team, our contractors and the people already using the building.', 'The global standard for occupational health and safety. It governs how we manage risk on site to protect employees, contractors and clients, and the hygiene we keep in occupied buildings.', 'iso-45001-white.png', 260, 253]
];
// The quote form's project types follow the visible sectors, so a hidden sector drops out of the list too.
const projectTypes = (D) => D.sectors.map((s) => s.name).concat('Office refurbishment', 'Other');
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const REDIRECTS = [['/gallery', '/projects/'], ['/about-us', '/about/'], ['/certifications', '/about/#certifications'], ['/clientele', '/clientele/'], ['/contact-us', '/contact/'], ['/online-consultation', '/contact/#consult'], ['/designo-ecovisions', '/sustainability/'], ['/blog-1', '/journal/'], ['/career-with-designo', '/careers/'], ['/referral-program', '/referral/'], ['/vastu-shastra', '/vastu/']];

/* The brush-stroke S of the Designo lockup, traced from static/assets/s-mark-green.png
   (viewBox 0 0 492 837). It is the monogram: the home cover's aperture, the outline that
   draws itself on every page, the back-to-top meter and the footer watermark. */
const S_PATH = 'M25.1 832.5 C28.0 831.1 34.2 826.9 38.9 823.1 C50.1 814.3 95.8 781.3 122.5 762.8 C155.9 739.7 172.1 730.1 180.8 728.4 C183.7 727.8 184.0 728.0 184.0 730.1 C184.0 731.4 182.0 736.8 179.5 742.0 C174.3 753.0 173.6 758.0 177.4 758.0 C181.0 758.0 184.6 756.4 188.8 753.0 C193.5 749.3 198.8 747.4 209.0 745.9 L217.2 744.7 L226.3 736.2 C231.4 731.5 244.3 719.8 255.0 710.2 C278.1 689.5 319.5 648.2 340.4 625.0 C375.2 586.3 395.3 557.9 414.5 519.9 C434.2 481.0 442.2 453.9 442.3 426.0 C442.4 406.9 439.3 391.2 429.4 359.1 C423.6 340.7 419.4 331.4 414.8 327.4 C408.3 321.7 406.5 321.5 373.7 321.8 C356.1 321.9 344.0 321.6 344.0 321.1 C344.0 317.6 347.3 304.0 349.6 298.3 C355.2 284.1 363.2 272.4 385.0 247.0 C402.0 227.0 411.9 217.0 420.4 210.9 C426.9 206.3 437.7 201.3 438.8 202.4 C439.1 202.7 439.7 205.3 440.1 208.1 C440.9 213.3 440.5 216.4 437.4 228.3 C436.1 233.5 435.9 236.2 436.6 239.8 C437.4 244.1 437.8 244.5 440.6 244.8 C447.4 245.5 457.0 235.0 465.4 217.5 C482.2 182.8 490.3 138.0 490.4 79.0 C490.5 33.6 485.9 12.9 474.1 4.5 C470.3 1.8 469.1 1.5 462.7 1.6 C451.6 1.7 437.1 7.6 420.2 18.8 C394.6 35.8 341.7 87.5 318.8 117.8 C301.7 140.5 282.9 174.2 271.6 202.5 C253.8 247.3 243.6 309.3 246.8 352.9 C250.6 403.8 264.3 439.9 290.9 469.3 C302.4 482.0 302.6 485.2 292.8 497.1 C289.5 501.2 278.6 514.6 268.7 527.0 C219.6 588.2 194.2 615.1 127.5 676.9 C89.5 712.1 55.7 745.4 41.3 762.0 C22.7 783.5 6.8 803.7 3.8 809.8 C-0.8 819.0 -0.2 827.9 5.4 834.9 C7.1 837.1 18.9 835.7 25.1 832.5 Z';
const sUse = (cls) => `<svg class="${cls}" viewBox="0 0 492 837" aria-hidden="true" focusable="false"><use href="#s-sym"/></svg>`;
const sMark = (cls, extra) => `<svg class="${cls}" viewBox="0 0 492 837" aria-hidden="true" focusable="false"${extra || ''}><path d="${S_PATH}" pathLength="1"/></svg>`;

/* The brand faces carry no arrow glyphs, so arrows in copy become hairline SVGs. */
const ARROWS = {
  '→': '<svg class="ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  '↗': '<svg class="ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17L17 7M8.5 7H17v8.5"/></svg>',
  '←': '<svg class="ar ar--w" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>'
};
const arrows = (html) => html.replace(/>([^<]*)</g, (m, t) => '>' + t.replace(/ ?(→|↗)/g, (x, a) => ARROWS[a]).replace(/← ?/g, ARROWS['←']) + '<');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const inr = (n) => Number(n).toLocaleString('en-IN');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : (d || ''); };
const map = (arr, fn) => (arr || []).map(fn).join('');

/* Pixel size of a PNG, GIF, JPEG, WebP, AVIF or SVG, so every client logo can be given the same visual weight. */
function imageSize(b) {
  if (!b || b.length < 30) return null;
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('ascii', 0, 3) === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (t === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
    return null;
  }
  if (b.toString('ascii', 4, 8) === 'ftyp') { const i = b.indexOf('ispe'); return i > 0 && i + 16 <= b.length ? [b.readUInt32BE(i + 8), b.readUInt32BE(i + 12)] : null; }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  }
  const svg = /<svg\b[^>]*>/i.exec(b.toString('utf8', 0, Math.min(b.length, 6000)));
  if (!svg) return null;
  const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(svg[0]);
  const w = /\swidth\s*=\s*["']([\d.]+)/i.exec(svg[0]), h = /\sheight\s*=\s*["']([\d.]+)/i.exec(svg[0]);
  return vb ? [+vb[1], +vb[2]] : w && h ? [+w[1], +h[1]] : null;
}
/* Logo box in em: a square mark and a long wordmark come out with roughly the same presence. */
const logoBox = (size) => { const r = size && size[0] > 0 && size[1] > 0 ? Math.min(Math.max(size[0] / size[1], 0.5), 8) : 2.5; return [Math.pow(r, 0.6), Math.pow(r, -0.4)]; };

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
  // Hidden sectors (Residential, for now) drop out of every list, filter and form on the site.
  const sectors = (await json('content/sectors.json')).filter((s) => s && !s.hidden);
  const clients = await json('content/clients.json');
  // "Trusted by" entries are { name, logo }; plain names from older content still work.
  clients.wall = (clients.wall || []).map((w) => (typeof w === 'string' ? { name: w } : w)).filter((w) => w && w.name);
  clients.groups = (clients.groups || []).filter((g) => g && !g.hidden);
  clients.wall.forEach((w) => { let size = null; if (w.logo && io.bytes) { try { size = imageSize(io.bytes(String(w.logo).replace(/^\//, ''))); } catch (e) { /* missing file: default box */ } } w.box = logoBox(size); });
  const byOrder = (a, b) => ((a.order == null ? 999 : a.order) - (b.order == null ? 999 : b.order)) || String(a.name || a.title).localeCompare(String(b.name || b.title));
  const projects = (await collection('content/projects')).sort(byOrder);
  const posts = (await collection('content/journal')).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const jobs = (await collection('content/jobs')).sort(byOrder);
  const services = (await collection('content/services')).sort(byOrder);
  const faqs = (await json('content/faqs.json', [])).filter((f) => f && f.question && f.answer && !f.hidden);
  const testimonials = (await json('content/testimonials.json', [])).filter((t) => t && t.quote && !t.hidden);

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
  sectors.forEach((s) => { s.countLabel = s.count ? s.count + (s.count === 1 ? ' project' : ' projects') : 'Explore'; });
  posts.forEach((p) => { p.dateLabel = fmtDate(p.date); });
  const featured = (projects.filter((p) => p.featured).length ? projects.filter((p) => p.featured) : projects).slice(0, 5);
  const D = { site, sectors, sectorById, clients, projects, posts, jobs, featured, services, faqs, testimonials };

  const pages = [];
  const page = (path, fn) => pages.push([path, fn]);
  page('', (c) => pageHome(c, D));
  page('projects/', (c) => pageProjects(c, D));
  projects.forEach((p, i) => page('projects/' + p.slug + '/', (c) => pageProject(c, D, p, projects[(i + 1) % projects.length])));
  page('services/', (c) => pageServices(c, D));
  services.forEach((x, i) => page('services/' + x.slug + '/', (c) => pageService(c, D, x, services[(i + 1) % services.length])));
  page('sectors/', (c) => pageSectors(c, D));
  sectors.forEach((x) => page('sectors/' + x.id + '/', (c) => pageSector(c, D, x)));
  page('why-designo/', (c) => pageWhy(c, D));
  page('fit-out-process/', (c) => pageProcess(c, D));
  page('faq/', (c) => pageFaq(c, D));
  page('project-brief/', (c) => pageBrief(c, D));
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
    pretty: pretty,
    u: (p, hash) => (pretty ? '/' + p : rel + p + (p === '' || p.endsWith('/') ? 'index.html' : '')) + (hash || ''),
    a: (p) => (pretty ? '/' : rel) + p,
    m: (src) => !src ? '' : /^(https?:)?\/\//.test(src) ? src : (pretty ? src : rel + String(src).replace(/^\//, ''))
  };
}

/* ---------- shared pieces ---------- */
const btn = (href, text, cls, extra) => `<a class="btn ${cls}" href="${esc(href)}"${extra || ''}>${text}</a>`;
const head2 = (eyebrow, title, link, extra) => `<div class="headrow"><div><p class="eyebrow">${eyebrow}</p><h2 class="d h2"${extra || ''}>${title}</h2></div>${link || ''}</div>`;
// eager: the marquee moves logos into view sideways, which lazy loading can miss, leaving gaps.
const logo = (c, w, eager) => `<img class="logo" src="${esc(c.m(w.logo))}" alt="${esc(w.name)}" ${eager ? 'fetchpriority="low"' : 'loading="lazy"'} decoding="async" style="width:${w.box[0].toFixed(2)}em;height:${w.box[1].toFixed(2)}em">`;
const img = (c, src, alt, extra) => src ? `<img src="${esc(c.m(src))}" alt="${esc(alt)}"${/loading=/.test(extra || '') ? '' : ' loading="lazy"'} decoding="async"${extra || ''}>` : '';
const field = (label, name, o) => { o = o || {}; const req = o.required ? ' required' : ''; const star = o.required ? ' *' : '';
  const input = o.rows ? `<textarea name="${name}" rows="${o.rows}"${req}></textarea>` : `<input name="${name}" type="${o.type || 'text'}"${req}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ''}${o.type === 'tel' ? ' autocomplete="tel"' : ''}${o.type === 'email' ? ' autocomplete="email"' : ''}${name === 'name' ? ' autocomplete="name"' : ''}>`;
  return `<label class="field${o.full ? ' full' : ''}"><span>${label}${star}</span>${input}</label>`; };
const select = (label, name, options, o) => `<label class="field${o && o.full ? ' full' : ''}"><span>${label}</span><select name="${name}">${map(options, (x) => `<option>${esc(x)}</option>`)}</select></label>`;
const hp = '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">';
const done = (label, title, text) => `<div class="done" hidden><span class="eyebrow">${label}</span><span class="d">${title}</span><span class="muted">${text || 'For anything urgent, call +91 98201 11353 or message us on WhatsApp.'}</span><button type="button" class="link" data-again>Send another</button></div>`;
const card = (c, p, size) => `<a class="card card--${size}" href="${c.u('projects/' + p.slug + '/')}" data-cursor="View project"><div class="img">${img(c, p.cover, p.name, ' data-parallax="10"')}</div><div class="card__meta"><span class="card__title">${esc(p.name)}</span><span class="label muted">${esc([p.sectorName, p.areaLabel].filter(Boolean).join(' · '))}</span></div></a>`;
const crumbs = (c, list) => `<nav class="crumbs" aria-label="Breadcrumb">${list.map(([p, label]) => p == null ? `<span>${esc(label)}</span>` : `<a href="${c.u(p)}">${esc(label)}</a>`).join('<span>/</span>')}</nav>`;
const svcCard = (c, x, i) => `<a class="card" href="${c.u('services/' + x.slug + '/')}" data-cursor="Explore"><div class="img r75">${x.image ? img(c, x.image, x.title, ' data-parallax="8"') : `<div class="ph label" style="height:100%">${esc(x.title)}</div>`}</div><div class="card__meta card__idx"><span class="num">${pad(i + 1)}</span><span class="card__title">${esc(x.title)}</span></div><span class="p small">${esc(x.summary)}</span></a>`;
const sectorCard = (c, x) => `<a class="card" href="${c.u('sectors/' + x.id + '/')}" data-cursor="Explore">${x.image ? `<div class="img r75">${img(c, x.image, x.name, ' data-parallax="8"')}</div>` : `<div class="img r75 ph label">${esc(x.name)}</div>`}<div class="card__meta"><span class="card__title">${esc(x.name)}</span><span class="label green">${x.countLabel} →</span></div><span class="p small">${esc(x.blurb)}</span></a>`;
const promises = (c) => `<div class="wrap cells" style="--min:240px"><div><span class="d" style="font-size:68px;line-height:1">45</span><span class="label green">Day timelines</span><span class="muted small">Efficient, dependable delivery.</span></div><div><span class="d" style="font-size:68px;line-height:1">10</span><span class="label green">Year warranty</span><span class="muted small">Built to last, backed by guarantee.</span></div><div><span class="d" style="font-size:68px;line-height:1">3×</span><span class="label green">ISO certified</span><span class="muted small">9001 · 14001 · 45001.</span></div><a href="${c.u('vastu/')}"><span class="d" style="font-size:68px;line-height:1">Vastu</span><span class="label green">Compliant layouts →</span><span class="muted small">Built for balance and business success.</span></a></div>`;
const processSteps = () => `<div class="process" data-process><div class="process__bar"><i></i></div><div class="grid" style="--min:200px;gap:0 32px">${map(PROCESS, (s, i) => `<div class="col" data-step><span class="bignum">${pad(i + 1)}</span><h3 class="d h4">${s[0]}</h3><p class="p small">${s[1]}</p></div>`)}</div></div>`;

function quoteForm(c, D, extended) {
  return `<form class="form" data-form="quote">${hp}
  ${field('Name', 'name', { required: true })}${field('Company', 'company')}${field('Email', 'email', { type: 'email', required: true })}${field('Phone', 'phone', { type: 'tel', required: true })}
  ${select('Project type', 'type', projectTypes(D))}${extended ? field('Site location', 'location', { placeholder: 'e.g. Kurla, Mumbai' }) : ''}${field('Area (sq ft)', 'area')}
  ${extended ? select('Budget', 'budget', ['Not sure yet', 'Under ₹25 lakh', '₹25 lakh – ₹1 crore', '₹1 – 5 crore', 'Above ₹5 crore']) + select('Start date', 'timeline', ['As soon as possible', 'In 1–3 months', 'In 3–6 months', 'Later']) : ''}
  ${field('Tell us about the project', 'message', { rows: 4, full: true })}
  <div class="form__end">${extended ? '<label class="check"><input type="checkbox" name="updates" value="Yes">Send me occasional updates and offers.</label>' : '<span class="muted" style="font-size:13px">We use your details only to respond to this enquiry.</span>'}<button class="btn btn--dark" type="submit">${extended ? 'Request a quote' : 'Send enquiry'} <span>→</span></button></div>
</form>${done('Enquiry received', 'Thank you. We’ll be in touch.')}`;
}

function shell(c, D, o) {
  const s = D.site;
  const nav = map(NAV, ([id, label]) => `<a href="${c.u(id + '/')}"${o.active === id ? ' aria-current="page"' : ''}>${label}</a>`);
  const ogImage = o.image ? (/^https?:/.test(o.image) ? o.image : (s.url || '') + o.image) : '';
  const tone = o.tone || 'solid';
  const head = `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="theme-color" content="${tone === 'cover' ? '#F5F2ED' : '#FFFFFF'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<link rel="icon" type="image/svg+xml" href="${c.a('assets/s-mark.svg')}">
<link rel="icon" type="image/png" href="${c.a('assets/s-mark.png')}">
<link rel="preload" href="${c.a('assets/fonts/cormorant-garamond-300.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${c.a('assets/fonts/inter-400.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${c.a('assets/fonts/inter-500.woff2')}" as="font" type="font/woff2" crossorigin>
${o.preconnect ? `<link rel="preconnect" href="${esc(o.preconnect)}">\n` : ''}<link rel="stylesheet" href="${c.a('styles.css')}">
<script>(function(d){d.classList.add('js');try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion');setTimeout(function(){if(!window.__designoReady)d.classList.remove('motion')},4000)}}catch(e){}})(document.documentElement)</script>
${c.pretty ? '<script type="speculationrules">{"prefetch":[{"source":"document","where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>\n' : ''}</head>
`;
  const body = `<body data-forms="${esc(s.formsEndpoint || '')}">
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="s-sym" viewBox="0 0 492 837"><path d="${S_PATH}"/></symbol></svg>
<a class="skip" href="#main">Skip to content</a>
<header class="hdr hdr--${tone}" data-header>
  <div class="hdr__bar">
    <a class="hdr__logo" href="${c.u('')}" aria-label="Designo Interiors — home"><img class="lg-dark" src="${c.a('assets/logo-sm.png')}" alt="Designo Interiors" width="480" height="290"><img class="lg-light" src="${c.a('assets/logo-light-sm.png')}" alt="" width="480" height="290"></a>
    <nav class="hdr__nav" aria-label="Main">${nav}</nav>
    <div class="hdr__end">${btn(c.u('contact/', '#quote'), 'Get a quote <span>→</span>', 'btn--dark')}<button class="burger hdr__menu" type="button" data-menu-open aria-expanded="false" aria-controls="site-menu"><span>Menu</span><i></i></button></div>
  </div>
</header>
<div class="menu" id="site-menu" data-menu role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden="true" inert>
  ${sMark('menu__s')}
  <div class="menu__top"><img src="${c.a('assets/logo-light-sm.png')}" alt="Designo Interiors" width="480" height="290"><button class="burger" type="button" data-menu-close><span>Close</span><i></i></button></div>
  <nav aria-label="Site">${map(MENU, ([p, label], i) => `<a href="${c.u(p)}" style="--i:${i}"${o.page === p ? ' aria-current="page"' : ''}><span>${pad(i + 1)}</span><b>${label}</b></a>`)}</nav>
  <div class="menu__contact"><a href="tel:${esc(s.phoneLink)}">${esc(s.phone)}</a><a href="mailto:${esc(s.email)}">${esc(s.email)}</a><a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></div>
</div>
<main id="main">
${o.body}
</main>
${footer(c, D, o.cta !== false)}
<button class="s-top" type="button" data-top aria-label="Back to top"><svg viewBox="0 0 492 837" aria-hidden="true" focusable="false"><defs><clipPath id="s-top-clip"><path d="${S_PATH}"/></clipPath></defs><rect class="f" width="492" height="837" clip-path="url(#s-top-clip)"/><path class="o" d="${S_PATH}"/></svg></button>
<div class="cursor" data-cursor-el aria-hidden="true"></div>
<script src="${c.a('site.js')}" defer></script>
</body>
</html>
`;
  return head + arrows(body);
}

function footer(c, D, cta) {
  const s = D.site;
  return `<footer class="ftr">
  ${sMark('ftr__s')}
  ${cta ? `<div class="ftr__cta"><div class="wrap"><div><p class="eyebrow">Free first consultation · Online or in person</p><h2 class="d">Start a project.</h2></div><div class="btns">${btn(c.u('contact/', '#quote'), 'Get a quote <span>→</span>', 'btn--light')}${btn('https://wa.me/' + s.whatsapp, 'WhatsApp', 'btn--line-light', ' target="_blank" rel="noopener"')}${btn('tel:' + s.phoneLink, esc(s.phone), 'btn--line-light')}</div></div></div>` : ''}
  <div class="ftr__cols"><div class="wrap">
    <div class="ftr__grid">
      <div><img class="ftr__logo" src="${c.a('assets/logo-light-sm.png')}" alt="Designo Interiors" width="480" height="290"><p style="margin:8px 0 0;max-width:260px;font-size:14px;color:var(--pale)">Turnkey corporate and commercial interiors in Mumbai since 1991.</p></div>
      <div><span class="label">Services</span>${map(D.services, (x) => `<a href="${c.u('services/' + x.slug + '/')}">${esc(x.title)}</a>`)}</div>
      <div><span class="label">Sectors</span>${map(D.sectors, (x) => `<a href="${c.u('sectors/' + x.id + '/')}">${esc(x.name)}</a>`)}</div>
      <div><span class="label">Company</span><a href="${c.u('projects/')}">Projects</a><a href="${c.u('about/')}">About &amp; certifications</a><a href="${c.u('clientele/')}">Clientele</a><a href="${c.u('sustainability/')}">EcoVisions</a><a href="${c.u('vastu/')}">Vastu Shastra</a><a href="${c.u('journal/')}">Journal</a><a href="${c.u('careers/')}">Careers</a><a href="${c.u('referral/')}">Referral programme</a></div>
      <div><span class="label">Resources</span><a href="${c.u('why-designo/')}">Why Designo</a><a href="${c.u('fit-out-process/')}">Fit-out process</a><a href="${c.u('faq/')}">FAQ</a><a href="${c.u('project-brief/')}">Send a brief</a><a href="${c.u('contact/')}">Contact</a></div>
      ${map(s.offices, (o) => `<div><span class="label">${esc(o.name)}</span><span>${esc(o.address)}</span><a class="dir" href="https://maps.google.com/?q=${encodeURIComponent(o.mapQuery || o.address)}" target="_blank" rel="noopener">Directions ↗</a></div>`)}
      <div><span class="label">Contact</span><a href="tel:${esc(s.phoneLink)}">${esc(s.phone)}</a><a href="mailto:${esc(s.email)}" style="word-break:break-all">${esc(s.email)}</a><span style="color:var(--pale);font-size:14px">${esc(s.hours)}</span></div>
    </div>
    <div class="ftr__base"><span>© ${new Date().getFullYear()} Designo Interiors · ISO 9001 · 14001 · 45001</span><nav aria-label="Social">${map(s.social, (x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`)}</nav></div>
  </div></div>
</footer>
<a class="wa" href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.1A8.5 8.5 0 1 1 21 11.5z"/></svg><b>WhatsApp us</b></a>`;
}

const introS = () => sMark('intro__s s-draw');
const intro = (eyebrow, title, text, lede) => `<section class="intro">${introS()}<div class="wrap"><div><p class="eyebrow">${eyebrow}</p><h1 class="d h-xl">${title}</h1></div><p class="${lede ? 'lede' : 'p p-lg'}">${text}</p></div></section>`;

/* ---------- pages ---------- */
function pageHome(c, D) {
  const s = D.site, f = D.featured, sizes = ['l', 's', 's', 'l', 'w'];
  const reel = s.showreel || {};
  // Once there are enough logos the marquee shows only those; the Clientele page lists everyone.
  const logos = D.clients.wall.filter((w) => w.logo), wall = logos.length >= 6 ? logos : D.clients.wall, half = Math.ceil(wall.length / 2);
  const names = (list) => map(list, (w) => w.logo ? `<span class="mq-logo">${logo(c, w, true)}</span>` : `<span>${esc(w.name)}${sUse('')}</span>`);
  const row = (list) => `<div class="marquee__row" tabindex="0"><div class="marquee__set">${names(list)}</div><div class="marquee__set" aria-hidden="true">${names(list)}</div></div>`;
  const body = `
<section class="cover" data-hero>
  <div class="cover__stick">
    <div class="cover__media" data-hero-media>
      <div class="cover__frame">${img(c, reel.poster, '', ' loading="eager" fetchpriority="high"')}${reel.video ? `<iframe src="${esc(reel.video)}" title="Designo Interiors showreel" allow="autoplay; fullscreen; picture-in-picture" tabindex="-1"></iframe>` : ''}</div>
      <div class="cover__scrim"></div>
    </div>
    ${sMark('cover__line', ' data-hero-line')}
    <div class="cover__copy px" data-hero-copy>
      <div class="cover__top"><p class="eyebrow">Corporate interiors · Turnkey fit-outs · Since 1991</p><h1 class="d h-hero">Workplaces<br>built to perform.</h1></div>
      <div class="cover__row"><p>Designo plans, designs and builds offices, showrooms and hospitality spaces across Mumbai, Navi Mumbai, Thane, Pune and Goa, to ISO-certified standards.</p><div class="btns">${btn(c.u('contact/', '#quote'), 'Get a quote <span>→</span>', 'btn--dark')}${btn(c.u('contact/', '#consult'), 'Book a consultation', 'btn--line')}</div></div>
    </div>
    <div class="cover__after px" data-hero-after><p class="eyebrow eyebrow--light">Design · Build · Handover</p><p class="d">One contract.<br>Every trade.</p></div>
    <div class="cover__cue" data-hero-cue aria-hidden="true"><span>Scroll</span><i></i></div>
  </div>
</section>
<section class="px sec-sm"><div class="wrap stats">${map(s.stats, (x) => `<div class="stat rule rule--soft"><b data-count>${esc(x.value)}</b><span class="label">${esc(x.label)}</span><span class="muted small">${esc(x.note)}</span></div>`)}</div></section>
<section class="px sec"><div class="wrap practice"><p class="eyebrow">01 — Practice</p><div><p class="statement" data-words>We are a turnkey interior firm. One team carries your project from the first site visit through design, procurement, civil work, joinery and installation to handover, so there is one point of accountability and one timeline.</p><div class="btns" style="gap:12px 40px"><a class="link" href="${c.u('why-designo/')}">Why Designo →</a><a class="link" href="${c.u('about/')}">About Designo →</a></div></div></div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap">${head2('02 — Services', 'One firm, every stage', `<a class="link" href="${c.u('services/')}">All services →</a>`)}<div class="grid" style="--min:300px;gap:0 32px">${map(D.services, (x, i) => `<a class="col rule svc" href="${c.u('services/' + x.slug + '/')}"><span class="num">${pad(i + 1)}</span><h3 class="d h4">${esc(x.title)}</h3><p class="p small">${esc(x.summary)}</p><span class="label green">More →</span></a>`)}</div></div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap">${head2('03 — Selected work', 'Recent workplaces', `<a class="link" href="${c.u('projects/')}">All projects →</a>`)}<div class="work">${map(f, (p, i) => card(c, p, sizes[i] || 's'))}</div></div></section>
<section class="px sec dark relative">${sMark('bigs s-draw', ' data-parallax="8"')}<div class="wrap">${head2('04 — Sectors', (WORDS[D.sectors.length] || D.sectors.length) + ' sectors, one standard', `<a class="link" href="${c.u('sectors/')}">All sectors →</a>`)}<div class="sx-list">${map(D.sectors, (x) => `<a class="sx" href="${c.u('sectors/' + x.id + '/')}"${x.image ? ` data-peek="${esc(c.m(x.image))}"` : ''}><span class="num">${x.index}</span><span class="d">${esc(x.name)}</span><span class="small">${esc(x.blurb)}</span><span class="label">${x.countLabel} →</span></a>`)}</div></div></section>
<section class="px sec"><div class="wrap">${head2('05 — How we work', 'Design to handover, under one contract', `<a class="link" href="${c.u('fit-out-process/')}">The process in detail →</a>`)}${processSteps()}</div></section>
<section class="px sec bg2"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:center;gap:48px clamp(40px,6vw,104px)"><div class="img r45" style="flex:5 1 360px">${img(c, s.images && s.images.automation, 'Conference room with integrated lighting', ' data-parallax="10"')}</div><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:26px"><p class="eyebrow">06 — Smart workplaces</p><h2 class="d h2">Workplaces that respond</h2><p class="p" style="max-width:520px">We plan automation into the interiors we build, so lighting scenes, appliances and devices are controlled from one place or by voice through Alexa, and energy-efficient systems keep running costs down.</p><div class="ticks rule" style="max-width:560px">${map(AUTOMATION, (a, i) => `<div><span>${a}</span><span class="num">${pad(i + 1)}</span></div>`)}</div><a class="link" href="${c.u('services/smart-workplace/')}">Smart workplace services →</a></div></div></section>
${testimonials(c, D, 'Clients')}
<section class="px sec-top"><div class="wrap" style="display:flex;flex-wrap:wrap;gap:24px">
  <a class="feat" href="${c.u('sustainability/')}" data-cursor="Explore">${img(c, s.images && s.images.sustainability, 'Conference room among tropical planting', ' data-parallax="8"')}<div><span class="eyebrow eyebrow--light">Designo EcoVisions</span><span class="d">Greener by specification</span><span style="max-width:460px">Low-VOC finishes, energy-efficient lighting, local sourcing and water-saving fixtures.</span><span class="label">Our sustainability work →</span></div></a>
  <a class="feat" href="${c.u('vastu/')}" data-cursor="Explore">${img(c, s.images && s.images.vastu, 'Sunlit window-side office', ' data-parallax="8"')}<div><span class="eyebrow eyebrow--light">Vastu Shastra</span><span class="d">Planned for balance</span><span style="max-width:460px">Our in-house Vastu consultant reviews orientation, light, colour and placement before a layout is final.</span><span class="label">Vastu consultancy →</span></div></a>
</div></section>
<section class="sec"><div class="wrap px" style="box-sizing:content-box">${head2('Clientele', 'Trusted by', `<a class="link" href="${c.u('clientele/')}">Full client list →</a>`)}</div><div class="marquee" role="region" aria-label="Selected clients">${row(wall.slice(0, half))}${row(wall.slice(half))}</div></section>
<section class="px sec dark relative"><div class="wrap">${head2('Certified', 'Three ISO standards on every project', `<a class="link" href="${c.u('about/', '#certifications')}">Certifications →</a>`, ' style="max-width:900px"')}<div class="iso">${map(CERTS, (x) => `<div class="iso__item rule"><img src="${c.a('assets/' + x[4])}" alt="${x[0]} certification mark" width="${x[5]}" height="${x[6]}" loading="lazy"><span class="d">${x[0]}</span><span class="label">${x[1]}</span><span class="small" style="color:var(--pale)">${x[2]}</span></div>`)}</div>${brochures(c, D, true)}</div></section>
${planning(c)}
<section class="px sec bg2" id="quote"><div class="wrap split"><div class="l" style="flex:5 1 360px"><p class="eyebrow">Get a quote</p><h2 class="d h2">Tell us about your space</h2><p class="p" style="max-width:440px">A few details are enough to start. We’ll get back to you with next steps and a time for a free consultation.</p>${contactRows(D)}</div><div class="r">${quoteForm(c, D, false)}</div></div></section>`;
  return shell(c, D, { title: 'Designo Interiors — Office & Commercial Interior Designers in Mumbai', desc: 'Turnkey office and commercial interiors in Mumbai since 1991: design, build and handover under one contract. ISO 9001, 14001 and 45001 certified.', tone: 'cover', page: '', body: body, image: reel.poster, preconnect: reel.video ? 'https://player.vimeo.com' : '' });
}

const contactRows = (D) => { const s = D.site; return `<div class="ticks rule" style="max-width:440px"><a href="tel:${esc(s.phoneLink)}"><span>${esc(s.phone)}</span><span class="label green">Call</span></a><a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener"><span>Message us on WhatsApp</span><span class="label green">Chat</span></a><a href="mailto:${esc(s.email)}"><span>${esc(s.email)}</span><span class="label green">Email</span></a></div>`; };
const brochures = (c, D) => !(D.site.brochures || []).length ? '' : `<div class="rule" style="display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:32px;padding-top:30px"><span class="label" style="margin-right:8px;color:var(--pale)">Download our credentials</span>${map(D.site.brochures, (b) => btn(c.m(b.file), esc(b.name) + ' <span>PDF ↓</span>', 'btn--line-light', ' target="_blank" rel="noopener"'))}</div>`;

function pageProjects(c, D) {
  const chips = [{ id: 'all', name: 'All', count: D.projects.length }].concat(D.sectors.filter((s) => s.count));
  const body = `
<section class="intro intro--tight">${introS()}<div class="wrap"><div><p class="eyebrow">Projects · ${D.projects.length} entries</p><h1 class="d h-xl">Our work</h1></div><p class="p p-lg" style="max-width:460px">Offices, showrooms, restaurants and studios, designed and built by Designo across Mumbai, Pune and Goa.</p></div></section>
<div class="filterbar"><div class="wrap"><div class="chips" data-static>${map(chips, (x, i) => `<button type="button" class="chip" data-filter="${x.id}" aria-pressed="${i ? 'false' : 'true'}">${esc(x.name)}<small>${x.count}</small></button>`)}</div><div class="toggle" data-static><button type="button" data-view="grid" aria-pressed="true">Grid</button><button type="button" data-view="list" aria-pressed="false">Index</button></div></div></div>
<section class="px" style="padding-top:48px;padding-bottom:var(--sy)" data-projects><div class="wrap">
  <div class="grid-fill" style="--min:380px;gap:64px 24px" data-grid>${map(D.projects, (p) => `<a class="card" data-sector="${esc(p.sector)}" href="${c.u('projects/' + p.slug + '/')}" data-cursor="View project"><div class="img r75">${img(c, p.cover, p.name, ' data-parallax="8"')}<span class="tag">${esc(p.sectorName)}</span></div><div class="card__meta card__idx"><span class="num">${p.index}</span><span class="card__title">${esc(p.name)}</span><span class="label muted">${esc(p.meta)} · ${p.photos.length} photo${p.photos.length === 1 ? '' : 's'}</span></div></a>`)}</div>
  <div class="table t-projects rule" data-list hidden><div class="th"><span>No.</span><span>Project</span><span>Client</span><span>Sector</span><span class="right">Area</span></div>${map(D.projects, (p) => `<a data-sector="${esc(p.sector)}" href="${c.u('projects/' + p.slug + '/')}"${p.cover ? ` data-peek="${esc(c.m(p.cover))}"` : ''}><span class="img r75" style="width:96px">${img(c, p.cover, '')}</span><span class="d" style="font-size:clamp(26px,2.5vw,36px);line-height:1.05">${esc(p.name)}</span><span class="muted" style="font-size:15px">${esc(p.client)}</span><span class="label green">${esc(p.sectorName)}</span><span class="right" style="font-size:14px;font-variant-numeric:tabular-nums">${esc(p.areaLabel)}</span></a>`)}</div>
  <p data-empty hidden class="muted" style="padding:80px 0;text-align:center">No projects in this sector yet. <a href="${c.u('contact/')}">Ask us about our work in it →</a></p>
</div></section>`;
  return shell(c, D, { title: 'Projects — Designo Interiors', desc: 'Corporate offices, showrooms, hospitality and studio interiors designed and built by Designo Interiors.', active: 'projects', page: 'projects/', body: body });
}

function pageProject(c, D, p, next) {
  const story = [['The challenge', p.challenge], ['Our approach', p.solution], ['The outcome', p.outcome]].filter((x) => x[1]);
  const body = `
<section class="intro" style="padding-top:clamp(36px,4vw,60px)">${introS()}<div class="wrap wrap--free">
  ${crumbs(c, [['projects/', 'Projects']].concat(D.sectorById[p.sector] ? [['sectors/' + p.sector + '/', p.sectorName]] : []).concat([[null, p.name]]))}
  <div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:40px clamp(40px,6vw,104px);margin-top:clamp(32px,4vw,56px)"><h1 class="d" style="flex:7 1 560px;font-size:clamp(60px,9vw,156px);line-height:.96;letter-spacing:-.012em">${esc(p.name)}</h1><div style="flex:4 1 320px;display:flex;flex-direction:column;gap:24px"><p class="lede" style="font-size:19px">${esc(p.summary)}</p><dl class="rule">${p.client ? `<div class="kv"><dt>Client</dt><dd>${esc(p.client)}</dd></div>` : ''}<div class="kv"><dt>Sector</dt><dd>${esc(p.sectorName)}</dd></div>${p.areaLabel ? `<div class="kv"><dt>Area</dt><dd>${esc(p.areaLabel)}</dd></div>` : ''}${map([['Location', p.location], ['Year', p.year], ['Duration', p.duration], ['Scope', (p.scope || []).filter(Boolean).join(', ')]], (x) => x[1] ? `<div class="kv"><dt>${x[0]}</dt><dd>${esc(x[1])}</dd></div>` : '')}</dl></div></div>
</div></section>
<section class="px"><div class="wrap">${p.photos[0] ? `<button type="button" class="zoom r169" data-shot="${esc(c.m(p.photos[0]))}" aria-label="Enlarge photo 1" data-cursor="Enlarge">${img(c, p.photos[0], p.name, ' loading="eager" data-parallax="8"')}</button>` : ''}${p.photos.length > 1 ? `<div class="gallery">${map(p.photos.slice(1), (src, i) => `<button type="button" class="zoom r75" data-shot="${esc(c.m(src))}" aria-label="Enlarge photo ${i + 2}" data-cursor="Enlarge">${img(c, src, p.name + ' — photo ' + (i + 2))}</button>`)}</div>` : ''}</div></section>
<section class="px" style="padding-top:clamp(40px,5vw,64px)"><div class="wrap rule rule--soft" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;padding-top:26px"><span class="label muted">${p.photos.length} photo${p.photos.length === 1 ? '' : 's'} · Click any photo to enlarge</span>${btn(c.u('project-brief/') + '?type=' + encodeURIComponent(p.sectorName), 'Plan a similar project <span>→</span>', 'btn--dark')}</div></section>
${story.length ? `<section class="px sec-top"><div class="wrap">${head2('The project', 'Brief, approach, result')}<div class="grid" style="--min:280px;gap:0 32px">${map(story, (x) => `<div class="col rule"><span class="label green">${x[0]}</span><p class="p p-lg" style="color:var(--ink)">${esc(x[1])}</p></div>`)}</div></div></section>` : ''}
${testimonials(c, D, 'Client', D.testimonials.filter((t) => t.project === p.slug))}
${next && next !== p ? `<section class="px sec"><a class="wrap next" href="${c.u('projects/' + next.slug + '/')}" data-cursor="Next project"><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:22px"><span class="eyebrow">Next project · ${esc(next.sectorName)}</span><span class="d">${esc(next.name)} →</span></div><div class="img r75" style="flex:5 1 360px">${img(c, next.cover, next.name, ' data-parallax="8"')}</div></a></section>` : '<div class="sec-top"></div>'}`;
  return shell(c, D, { title: p.name + ' — Designo Interiors', desc: p.summary, active: 'projects', body: body, image: p.cover });
}

function pageServices(c, D) {
  const cols = [['Design', ['Space planning and layouts', '3D visualisation', 'Vastu review', 'Lighting and acoustic design', 'Materials, finishes and furniture']], ['Build', ['Civil work', 'Carpentry and joinery', 'Partitions and aluminium sliding windows', 'Electrical, lighting and acoustics', 'Painting, carpets and vertical blinds']], ['Manage', ['Budgeting and estimates', 'Procurement', 'Installation and site management', 'Office automation and smart controls', 'Maintenance after handover']]];
  const body = `
${intro('Services', 'Turnkey<br>interiors', 'Design, planning, budgeting, procurement, execution and maintenance under one contract, for offices and every commercial space our clients run.', true)}
${D.services.length ? `<section class="px" style="padding-bottom:var(--sy)"><div class="wrap grid-fill" style="--min:340px;gap:64px 24px">${map(D.services, (x, i) => svcCard(c, x, i))}</div></section>` : ''}
<section class="px sec bg2"><div class="wrap">${head2('Capabilities', 'Design, build, manage')}<div class="grid" style="--min:300px">${map(cols, ([h, items], i) => `<div class="rule" style="padding-top:28px"><span class="num">${pad(i + 1)}</span><h2 class="d" style="font-size:52px;line-height:1.05;margin:14px 0 20px">${h}</h2><div class="plain">${map(items, (x) => `<span style="display:block">${x}</span>`)}</div></div>`)}</div></div></section>
<section class="px sec"><div class="wrap">${head2('How a project runs', 'Five stages, one team', `<a class="link" href="${c.u('fit-out-process/')}">The process in detail →</a>`)}${processSteps()}</div></section>
<section class="px sec dark relative">${sMark('bigs s-draw', ' data-parallax="8" style="left:auto;right:-8%"')}<div class="wrap">${head2('Sectors', 'Who we design for', `<a class="link" href="${c.u('sectors/')}">All sectors →</a>`)}<div class="sx-list">${map(D.sectors, (x) => `<a class="sx" href="${c.u('sectors/' + x.id + '/')}"${x.image ? ` data-peek="${esc(c.m(x.image))}"` : ''}><span class="num">${x.index}</span><span class="d">${esc(x.name)}</span><span class="small">${esc(x.blurb)}</span><span class="label">${x.countLabel} →</span></a>`)}</div></div></section>
<section class="px sec-top">${promises(c)}</section>
<section class="px sec"><div class="wrap bg2" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:32px 64px;padding:clamp(32px,4vw,64px)"><div style="flex:1 1 480px;display:flex;flex-direction:column;gap:20px"><p class="eyebrow">Free online consultation</p><h2 class="d" style="font-size:clamp(40px,4.8vw,76px);line-height:1.02">Talk to us before you commit</h2><p class="p" style="max-width:600px">Share your ideas, budget and references during working hours. After the first call we can give you an approximate estimate, then measure the site and prepare a detailed one, with 3D views of the project.*</p><span style="font-size:13px">*Terms and conditions apply.</span></div>${btn(c.u('contact/', '#consult'), 'Book a consultation <span>→</span>', 'btn--dark')}</div></section>`;
  return shell(c, D, { title: 'Services — Turnkey Office & Commercial Interiors — Designo Interiors', desc: 'Turnkey office fit-outs, workplace design, refurbishment, project management, smart workplaces and maintenance for commercial interiors in Mumbai.', active: 'services', page: 'services/', body: body });
}

function pageSectors(c, D) {
  const body = `
${intro('Sectors', 'Who we<br>design for', 'Offices first, and every commercial space our clients run: showrooms, hotels and restaurants, clinics, campuses, studios and gyms.', true)}
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap grid-fill" style="--min:340px;gap:64px 24px">${map(D.sectors, (x) => sectorCard(c, x))}</div></section>
<section class="px sec bg2"><div class="wrap">${head2('In every sector', 'One contract, one standard', `<a class="link" href="${c.u('services/')}">Our services →</a>`)}${processSteps()}</div></section>
<section class="px sec">${promises(c)}</section>`;
  return shell(c, D, { title: 'Sectors — Office, Retail, Hospitality & Healthcare Interiors — Designo Interiors', desc: 'Interior design and turnkey fit-outs for corporate offices, retail and showrooms, hospitality, healthcare, education, studios and fitness centres.', active: 'sectors', page: 'sectors/', body: body });
}

/* Sector, service and location pages share one layout. Every section is optional and is left out
   when its content is empty, so a page never shows a placeholder or an empty heading. */
function pageLanding(c, D, o) {
  let n = 0;
  const no = () => pad(++n) + ' — ';
  const points = (o.points || []).filter((x) => x && x.title);
  const items = (o.items || []).filter(Boolean);
  const clients = (o.clients || []).filter(Boolean);
  const related = (o.related || []).filter(Boolean);
  const faqs = (o.faqs || []).filter((f) => f && f.question && f.answer);
  // Consecutive sections on the same ground share one gap instead of stacking two.
  let prev = o.image ? '' : 'white';
  const sec = (ground, inner) => { const top = ground !== prev; prev = ground; return `<section class="px${top ? ' sec-top' : ''}${ground === 'white' ? '' : ' ' + ground}" style="padding-bottom:var(--sy)">${inner}</section>`; };
  const parts = [
    points.length && sec('white', `<div class="wrap">${head2(no() + (o.pointsEyebrow || 'What matters'), esc(o.pointsTitle || 'What you can expect'))}<div class="cells" style="--min:250px">${map(points, (x, i) => `<div><span class="num">${pad(i + 1)}</span><h3 class="d h4">${esc(x.title)}</h3><p class="p small">${esc(x.text)}</p></div>`)}</div></div>`),
    items.length && sec('bg2', `<div class="wrap split"><div class="l"><p class="eyebrow">${no()}Scope</p><h2 class="d h2">${esc(o.itemsTitle || 'What we deliver')}</h2></div><div class="r ticks rule">${map(items, (x, i) => `<div><span>${esc(x)}</span><span class="num">${pad(i + 1)}</span></div>`)}</div></div>`),
    (o.projects || []).length && sec('white', `<div class="wrap">${head2(no() + 'Selected work', esc(o.projectsTitle || 'Projects'), o.projectsLink || '')}<div class="grid-fill" style="--min:380px;gap:64px 24px">${map(o.projects, (p) => card(c, p, 'l'))}</div></div>`),
    clients.length && sec('dark relative', `${sMark('bigs s-draw', ' data-parallax="8" style="left:auto;right:-6%"')}<div class="wrap">${head2(no() + 'Clients', esc(o.clientsTitle || 'Who we’ve built for'), `<a class="link" href="${c.u('clientele/')}">Full client list →</a>`)}<ul class="names">${map(clients, (x) => `<li>${esc(x)}</li>`)}</ul></div>`),
    related.length && sec('white', `<div class="wrap split"><div class="l"><p class="eyebrow">${no()}${esc(o.relatedEyebrow)}</p><h2 class="d h2">${esc(o.relatedTitle)}</h2></div><div class="r ticks rule">${map(related, ([href, label]) => `<a href="${href}"><span>${esc(label)}</span><span class="green">→</span></a>`)}</div></div>`),
    faqs.length && sec('white', `<div class="wrap split"><div class="l"><p class="eyebrow">${no()}Questions</p><h2 class="d h2">Asked and answered</h2></div><div class="r rule">${map(faqs, (f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`)}</div></div>`),
    o.next && `<section class="px${prev === 'white' ? '' : ' sec-top'}" style="padding-bottom:var(--sy)">${o.next}</section>`
  ];
  const body = `
<section class="intro" style="padding-top:clamp(36px,4vw,60px)">${introS()}<div class="wrap wrap--free">
  ${crumbs(c, o.crumbs)}
  <div class="lhead"><div class="lhead__t"><p class="eyebrow">${o.eyebrow}</p><h1 class="d">${esc(o.h1)}</h1></div><div class="lhead__r"><p class="lede">${esc(o.lede)}</p><div class="btns">${btn(c.u('project-brief/') + (o.briefType ? '?type=' + encodeURIComponent(o.briefType) : ''), 'Send a brief <span>→</span>', 'btn--dark')}${btn(c.u('contact/', '#consult'), 'Book a consultation', 'btn--line')}</div></div></div>
</div></section>
${o.image ? `<section class="px"><div class="wrap img lhero">${img(c, o.image, o.h1, ' loading="eager" data-parallax="10"')}</div></section>` : ''}
${parts.filter(Boolean).join('\n')}`;
  return shell(c, D, { title: o.title, desc: o.desc, active: o.active, page: o.page, body: body, image: o.image });
}

function pageSector(c, D, x) {
  const projects = D.projects.filter((p) => p.sector === x.id);
  const services = D.services.filter((v) => (v.sectors || []).indexOf(x.id) !== -1);
  return pageLanding(c, D, {
    page: 'sectors/' + x.id + '/', active: 'sectors',
    title: (x.title || x.name) + ' in Mumbai — Designo Interiors', desc: x.metaDescription || x.intro || x.blurb,
    crumbs: [['sectors/', 'Sectors'], [null, x.name]],
    eyebrow: 'Sector · ' + x.index, h1: x.title || x.name, lede: x.intro || x.blurb, image: x.image,
    points: x.points, pointsEyebrow: 'What matters', pointsTitle: 'What we focus on',
    items: x.deliverables, itemsTitle: 'What we design and build', briefType: x.name,
    projects: projects, projectsTitle: 'Recent work', projectsLink: `<a class="link" href="${c.u('projects/')}?sector=${esc(x.id)}">All ${projects.length} in the index →</a>`,
    clients: x.clients,
    related: services.map((v) => [c.u('services/' + v.slug + '/'), v.title]), relatedEyebrow: 'Services', relatedTitle: 'How we can help',
    faqs: x.faqs
  });
}

function pageService(c, D, x, next) {
  const projects = (x.projects || []).map((slug) => D.projects.find((p) => p.slug === slug)).filter(Boolean);
  const sectors = (x.sectors || []).map((id) => D.sectorById[id]).filter((s) => s && D.sectors.indexOf(s) !== -1);
  const i = D.services.indexOf(x);
  return pageLanding(c, D, {
    page: 'services/' + x.slug + '/', active: 'services',
    title: x.title + ' in Mumbai — Designo Interiors', desc: x.metaDescription || x.summary,
    crumbs: [['services/', 'Services'], [null, x.title]],
    eyebrow: 'Services · ' + pad(i + 1), h1: x.title, lede: x.intro || x.summary, image: x.image,
    points: x.points, pointsEyebrow: 'Why it matters', pointsTitle: 'What you get',
    items: x.includes, itemsTitle: 'What’s included',
    projects: projects, projectsTitle: 'Where we’ve done it',
    related: sectors.map((s) => [c.u('sectors/' + s.id + '/'), s.name]), relatedEyebrow: 'Sectors', relatedTitle: 'Where we deliver it',
    faqs: x.faqs,
    next: next && next !== x ? `<a class="wrap next rule rule--soft" style="padding-top:clamp(40px,5vw,64px)" href="${c.u('services/' + next.slug + '/')}" data-cursor="Next service"><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:22px"><span class="eyebrow">Next service</span><span class="d">${esc(next.title)} →</span></div>${next.image ? `<div class="img r75" style="flex:5 1 360px">${img(c, next.image, next.title, ' data-parallax="8"')}</div>` : ''}</a>` : ''
  });
}

function pageProcess(c, D) {
  const stages = [
    ['Consult', 'A free first conversation about your brief, team, budget, references and timeline.', ['Online, at our office or on site', 'Your brief, budget and references', 'Free of charge']],
    ['Estimate', 'An approximate estimate after the first call, then site measurements and a detailed requirement study.', ['Approximate estimate after the first call', 'Site survey and measurements', 'Detailed requirement study', 'Detailed estimate']],
    ['Design', 'Space planning, a Vastu review where wanted, and 3D views of the proposed interior for you to review.', ['Space planning and layouts', '3D views of the proposed interior', 'Vastu review, where wanted', 'Lighting and acoustic design', 'Materials, finishes and furniture']],
    ['Build', 'Civil work, joinery, electrical, finishes and installation, run under ISO 9001 and 45001 practices.', ['Procurement of materials and furniture', 'Civil work', 'Carpentry and joinery', 'Partitions, electrical, lighting and acoustics', 'Painting, carpets and blinds', 'Quality and safety checks on site']],
    ['Handover', 'Delivered on the agreed timeline and backed by a 10-year warranty.', ['Handover on the agreed timeline', '10-year warranty', 'Maintenance after handover']]
  ];
  const asks = ['Your brief: teams, headcount and the spaces you need', 'A budget range and a target move-in date', 'Floor plans or building drawings, if you have them', 'Access to the site for measurements', 'Your building’s fit-out rules, where the landlord or society sets them'];
  const pay = [['50%', 'Advance', 'Before work starts.'], ['40%', 'Second stage', 'Fifteen days after work begins.'], ['10%', 'Balance', 'Seven days after completion.']];
  const body = `
${intro('The fit-out process', 'From brief<br>to handover', 'How a Designo project runs, stage by stage: what happens, what you receive and what we’ll ask of you. One team carries it from the first conversation to the keys.', true)}
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap">${processSteps()}</div></section>
<section class="px sec bg2"><div class="wrap">${head2('Stage by stage', 'What happens, and what you get')}<ol class="rule" style="list-style:none;margin:0;padding:0">${map(stages, (x, i) => `<li class="row" style="align-items:flex-start;gap:20px clamp(32px,5vw,80px);padding:clamp(28px,3vw,40px) 0"><span class="bignum" style="flex:0 0 90px;font-size:60px">${pad(i + 1)}</span><div style="flex:3 1 340px;display:flex;flex-direction:column;gap:12px"><h3 class="d h3">${x[0]}</h3><p class="p">${x[1]}</p></div><div class="ticks" style="flex:4 1 340px">${map(x[2], (t) => `<div><span>${t}</span></div>`)}</div></li>`)}</ol></div></section>
<section class="px sec"><div class="wrap split"><div class="l"><p class="eyebrow">Before we start</p><h2 class="d h2">What we’ll ask you for</h2><p class="p" style="max-width:420px">The more of this we have early, the sooner we can give you a firm estimate and timeline.</p></div><div class="r ticks rule">${map(asks, (x, i) => `<div><span>${x}</span><span class="num">${pad(i + 1)}</span></div>`)}</div></div></section>
<section class="px sec dark relative">${sMark('bigs s-draw', ' data-parallax="8" style="left:auto;right:-6%"')}<div class="wrap">${head2('Payments', 'Paid in three stages', '', '')}<div class="grid" style="--min:240px;gap:0 32px">${map(pay, (x) => `<div class="col rule"><span class="d" style="font-size:clamp(72px,7vw,112px);line-height:.95">${x[0]}</span><span class="label">${x[1]}</span><p class="p small">${x[2]}</p></div>`)}</div><p class="p small" style="margin-top:36px;max-width:620px">This is how payments are usually staged. The schedule for your project is confirmed in your contract.</p></div></section>
<section class="px sec"><div class="wrap split"><div class="l"><p class="eyebrow">Occupied buildings</p><h2 class="d h2">Working around your team</h2></div><div class="r" style="display:flex;flex-direction:column;gap:22px"><p class="p p-lg">Many fit-outs happen in buildings that are already in use. Our ISO 45001 system governs how we manage risk on site to protect your employees, our contractors and visitors, and the hygiene we keep while work goes on around them.</p><p class="p p-lg">We plan the order of work with you, so the business keeps running while the space changes.</p><a class="link" href="${c.u('faq/')}">More questions answered →</a></div></div></section>
<section class="px" style="padding-bottom:var(--sy)">${promises(c)}</section>`;
  return shell(c, D, { title: 'Office Fit-out Process: Brief to Handover — Designo Interiors', desc: 'How a Designo office fit-out runs: consultation, estimate, design, build and handover, what you receive at each stage, and how payments are staged.', page: 'fit-out-process/', body: body });
}

function pageWhy(c, D) {
  const s = D.site;
  const reasons = [
    ['One point of accountability', 'Design, procurement and every trade on site under one contract and one timeline.'],
    ['Certified three times over', 'ISO 9001, 14001 and 45001: one of very few interior design firms in India certified to all three.'],
    ['Trusted since 1991', 'Offices for Castrol India, Visible Alpha, Wincor Nixdorf, Essel Group and Laerdal, and buildings for Goa University.'],
    ['Dependable delivery', '45-day timelines, agreed with you before work starts.'],
    ['Backed for a decade', 'A 10-year warranty, and maintenance from the team that built the space.'],
    ['Vastu in-house', 'Our Vastu consultant reviews each layout before it is final.'],
    ['Greener by specification', 'Low-VOC finishes, energy-efficient lighting and local sourcing, under ISO 14001.'],
    ['Three decades of supply', 'Suppliers, contractors, craftsmen and artisans who share our standards.']
  ];
  const compare = [['Contracts to manage', 'One', 'One per designer and contractor'], ['Accountability', 'One team, start to finish', 'Split between firms'], ['Budget', 'One estimate for design and build', 'Separate quotes, with gaps between them'], ['Timeline', 'One schedule across every trade', 'Each trade on its own schedule'], ['Quality and safety', 'ISO 9001 and 45001 practices on site', 'Depends on each contractor'], ['After handover', '10-year warranty and maintenance', 'Varies by contractor']];
  const wall = D.clients.wall.filter((w) => w.logo).slice(0, 12);
  const body = `
${intro('Why Designo', 'One firm.<br>One contract.', 'For admin heads, facility managers and leadership teams who need a space delivered on time and on budget, without coordinating a dozen contractors.', true)}
<section class="px sec-sm" style="padding-top:0"><div class="wrap stats">${map(s.stats, (x) => `<div class="stat rule rule--soft"><b data-count>${esc(x.value)}</b><span class="label">${esc(x.label)}</span><span class="muted small">${esc(x.note)}</span></div>`)}</div></section>
<section class="px sec"><div class="wrap">${head2('01 — Reasons', 'What you get with Designo')}<div class="cells" style="--min:280px">${map(reasons, (x, i) => `<div><span class="num">${pad(i + 1)}</span><h3 class="d h4">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec bg2"><div class="wrap">${head2('02 — Turnkey', 'One contract, compared')}<div class="table t-compare rule"><div class="th"><span></span><span>Turnkey with Designo</span><span>Separate designer and contractors</span></div>${map(compare, (x) => `<div><span class="label muted">${x[0]}</span><span style="font-size:17px">${x[1]}</span><span class="muted" style="font-size:16px">${x[2]}</span></div>`)}</div></div></section>
${testimonials(c, D, '03 — In their words')}
${wall.length ? `<section class="px sec"><div class="wrap">${head2('Clientele', 'Trusted by', `<a class="link" href="${c.u('clientele/')}">Full client list →</a>`)}<div class="wall rule">${map(wall, (w) => `<div><span class="wall__mark">${logo(c, w)}</span><span class="label muted">${esc(w.name)}</span></div>`)}</div></div></section>` : ''}
<section class="px sec dark relative" id="procurement">${sMark('bigs s-draw', ' data-parallax="8"')}<div class="wrap"><div class="headrow"><div><p class="eyebrow">For procurement teams</p><h2 class="d h2" style="max-width:900px">Ready for vendor registration</h2></div><p class="p" style="max-width:440px">Download our credentials below. ISO certificates, client references and company documents are available on request.</p></div><div class="iso">${map(CERTS, (x) => `<div class="iso__item rule"><img src="${c.a('assets/' + x[4])}" alt="${x[0]} certification mark" width="${x[5]}" height="${x[6]}" loading="lazy"><span class="d">${x[0]}</span><span class="label">${x[1]}</span><span class="small" style="color:var(--pale)">${x[2]}</span></div>`)}</div>${brochures(c, D)}<div style="margin-top:28px">${btn('mailto:' + s.email + '?subject=' + encodeURIComponent('Vendor registration documents'), 'Request documents <span>→</span>', 'btn--light')}</div></div></section>`;
  return shell(c, D, { title: 'Why Designo — Turnkey Office Interiors, ISO Certified — Designo Interiors', desc: 'One contract and one team for your office fit-out: ISO 9001, 14001 and 45001 certified, 45-day timelines, a 10-year warranty and clients like Castrol and Wincor Nixdorf.', page: 'why-designo/', body: body });
}

function pageFaq(c, D) {
  const topics = D.faqs.map((f) => f.topic || 'General').filter((t, i, a) => a.indexOf(t) === i);
  const body = `
${intro('FAQ', 'Questions,<br>answered', 'What clients usually ask before an office or commercial fit-out: cost, timelines, standards, working in occupied buildings and what happens after handover.', true)}
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap" style="display:flex;flex-direction:column;gap:clamp(48px,6vw,88px)">${map(topics, (t, i) => `<div class="split"><div class="l"><span class="num">${pad(i + 1)}</span><h2 class="d h3">${esc(t)}</h2></div><div class="r rule">${map(D.faqs.filter((f) => (f.topic || 'General') === t), (f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`)}</div></div>`)}</div></section>
<section class="px sec bg2"><div class="wrap split"><div class="l"><p class="eyebrow">Still wondering?</p><h2 class="d h2">Ask us directly</h2><p class="p" style="max-width:420px">Call, message or email during working hours (${esc(D.site.hours)}).</p></div><div class="r">${contactRows(D)}</div></div></section>`;
  return shell(c, D, { title: 'FAQ — Office & Commercial Fit-outs — Designo Interiors', desc: 'Answers on fit-out cost, payment stages, timelines, ISO certifications, Vastu, working in occupied offices and the 10-year warranty.', page: 'faq/', body: body });
}

// Client quotes from content/testimonials.json. Nothing renders until a real quote is added.
function testimonials(c, D, eyebrow, list) {
  list = (list || D.testimonials).filter((t) => t && t.quote);
  if (!list.length) return '';
  return `<section class="px sec"><div class="wrap">${head2(eyebrow || 'Clients', 'In their words')}<div class="grid" style="--min:340px;gap:48px 40px">${map(list, (t) => `<figure class="quote rule"><blockquote class="d">“${esc(t.quote)}”</blockquote><figcaption><b>${esc(t.name)}</b><span class="muted">${esc([t.role, t.company].filter(Boolean).join(', '))}</span></figcaption></figure>`)}</div></div></section>`;
}

function pageBrief(c, D) {
  const scope = ['Design and 3D views', 'Civil and interior works', 'Furniture and joinery', 'Electrical and lighting', 'Office automation', 'Vastu review', 'Maintenance after handover'];
  const part = (label) => `<span class="full label green" style="padding-bottom:12px;border-bottom:1px solid var(--ink);margin-top:8px">${label}</span>`;
  const body = `
${intro('Project brief · RFP', 'Send us<br>your brief', 'For new offices, relocations, refurbishments and RFPs. Share the site, the spaces you need and your timeline, and attach a floor plan or tender document if you have one.', true)}
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap split">
  <div class="l" style="flex:4 1 300px"><p class="eyebrow">What happens next</p><div class="ticks rule">${map(['We review your brief and drawings', 'We call you to talk it through', 'An approximate estimate, then a site visit', 'A detailed estimate and 3D views'], (x, i) => `<div><span>${x}</span><span class="num">${pad(i + 1)}</span></div>`)}</div><p class="p small">Prefer to talk first? <a href="${c.u('contact/', '#consult')}">Book a free consultation →</a></p>${contactRows(D)}</div>
  <div class="r"><form class="form" data-form="brief" data-max-mb="10">${hp}
    ${part('About you')}${field('Name', 'name', { required: true })}${field('Company', 'company', { required: true })}${field('Designation', 'designation')}${field('Email', 'email', { type: 'email', required: true })}${field('Phone', 'phone', { type: 'tel', required: true })}
    ${part('The site')}${field('Site location', 'location', { placeholder: 'e.g. Kohinoor City, Kurla' })}${field('Building', 'building')}${field('Area (sq ft)', 'area', { required: true })}${field('Floors', 'floors', { placeholder: 'e.g. 3rd and 4th' })}${select('Current state of the site', 'state', ['Not sure', 'Bare shell', 'Warm shell', 'Existing fit-out to refurbish'])}${select('Project type', 'type', projectTypes(D))}
    ${part('What you need')}${field('Headcount', 'headcount', { placeholder: 'People using the space' })}${select('Budget', 'budget', ['Not sure yet', 'Under ₹25 lakh', '₹25 lakh – ₹1 crore', '₹1 – 5 crore', 'Above ₹5 crore'])}${field('Key spaces', 'spaces', { rows: 3, full: true, placeholder: 'e.g. 60 workstations, 6 cabins, 2 meeting rooms, a boardroom and a pantry' })}
    <fieldset class="full scope"><legend class="label muted">Scope</legend>${map(scope, (x) => `<label class="check"><input type="checkbox" name="scope" value="${esc(x)}">${esc(x)}</label>`)}</fieldset>
    ${part('Timeline')}${select('Possession of the site', 'possession', ['Not sure yet', 'Already have it', 'In 1–3 months', 'In 3–6 months', 'Later'])}${field('Target move-in', 'movein', { placeholder: 'e.g. March 2027' })}
    <label class="upload full"><span style="display:flex;flex-direction:column;gap:6px"><span class="label">Floor plan or RFP</span><span data-file-label>PDF, image, DWG, Word or Excel, up to 10 MB</span></span><span class="label green">Choose file ↑</span><input type="file" name="plan" accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx"></label>
    ${field('Anything else we should know', 'message', { rows: 4, full: true })}
    <div class="form__end"><label class="check"><input type="checkbox" name="updates" value="Yes">Send me occasional updates.</label><button class="btn btn--dark" type="submit">Send brief <span>→</span></button></div>
  </form>${done('Brief received', 'Thank you. We’ll review it and call you.')}</div>
</div></section>`;
  return shell(c, D, { title: 'Send a Project Brief or RFP — Designo Interiors', desc: 'Send Designo Interiors your office or commercial fit-out brief or RFP, with floor plans, and get an estimate and a free consultation.', page: 'project-brief/', body: body, cta: false });
}

// "Planning a fit-out?" links on the home page, for visitors who aren't ready to ask for a quote.
const planning = (c) => `<section class="px sec"><div class="wrap">${head2('Planning a fit-out?', 'Start here')}<div class="cells" style="--min:240px">${map([['fit-out-process/', 'The fit-out process', 'Every stage from brief to handover, and what you receive at each.', 'Read the guide'], ['why-designo/', 'Why Designo', 'One contract, three ISO certifications and a 10-year warranty.', 'See why'], ['faq/', 'FAQ', 'Cost, timelines, standards and working in occupied offices.', 'Read answers'], ['project-brief/', 'Send a brief', 'Share your site, spaces and timeline, with drawings or an RFP.', 'Send a brief']], (x) => `<a href="${c.u(x[0])}" class="svc"><span class="label green">${x[3]} →</span><h3 class="d h4">${x[1]}</h3><span class="p small">${x[2]}</span></a>`)}</div></div></section>`;

function pageAbout(c, D) {
  const s = D.site;
  const body = `
${intro('About Designo', 'Since 1991', 'Designo Interiors is a corporate interior design and turnkey fit-out firm based in Mumbai. We plan, design and build offices, showrooms, hospitality and institutional interiors, and manage every trade on site under one contract.', true)}
<section class="px"><div class="wrap img r219">${img(c, s.images && s.images.about, 'Townhall and conference room interior', ' data-parallax="10"')}</div></section>
<section class="px sec"><div class="wrap"><p class="eyebrow" style="margin-bottom:44px">01 — How we work</p><div class="grid" style="--min:300px">${map([['Our style', 'Contemporary design that respects the building it sits in. We keep original features and character where they matter, and shape each space around how the client works.'], ['Our approach', 'A personal service from brief to handover. We listen, advise and develop a concept that meets your expectations and your budget, then manage every detail of delivery.'], ['Our network', 'Three decades of suppliers, contractors, craftsmen and artisans who share our standards, with materials and furniture sourced from local and international brands.']], (x) => `<div class="col rule" style="gap:18px"><h2 class="d" style="font-size:46px;line-height:1.05">${x[0]}</h2><p class="p">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec bg2"><div class="wrap split"><div class="l" style="flex:5 1 360px"><p class="eyebrow">02 — Where we work</p><p class="d" data-split style="font-size:clamp(50px,6.4vw,108px);line-height:1">Mumbai<br>Navi Mumbai<br>Thane<br>Pune<br><span class="green">Goa</span></p></div><div class="r grid" style="flex:6 1 420px;--min:240px;align-content:end">${map(s.offices, (o) => `<div class="rule" style="display:flex;flex-direction:column;gap:12px;padding-top:22px"><span class="label green">${esc(o.name)} office</span><span style="font-size:17px;line-height:1.55">${esc(o.address)}</span><a class="link" href="https://maps.google.com/?q=${encodeURIComponent(o.mapQuery || o.address)}" target="_blank" rel="noopener">Directions ↗</a></div>`)}</div></div></section>
<section class="px sec"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:48px clamp(40px,6vw,104px)"><div class="img r45" style="flex:4 1 320px">${s.images && s.images.founder ? img(c, s.images.founder, 'Sanjeev M. Haldankar', ' data-parallax="8"') : '<div class="ph label" style="height:100%">Portrait — Sanjeev M. Haldankar</div>'}</div><div style="flex:6 1 420px;display:flex;flex-direction:column;gap:24px"><p class="eyebrow">03 — Leadership</p><h2 class="d h2">Sanjeev M. Haldankar</h2><p class="p p-lg" style="max-width:600px">Sanjeev Haldankar leads Designo’s design practice. Over more than 25 years he has led 300+ projects across commercial, retail, hospitality, studio and healthcare work.</p><p class="p p-lg" style="max-width:600px">His focus is calm, low-stress spaces, delivered with close control of quality, time and cost.</p></div></div></section>
<section class="px sec dark relative" id="certifications">${sMark('bigs s-draw', ' data-parallax="8"')}<div class="wrap"><div class="headrow"><div><p class="eyebrow">04 — Certifications</p><h2 class="d h2" style="max-width:900px">Certified three times over</h2></div><p class="p" style="max-width:420px">Designo is one of very few interior design firms in India certified for quality, environmental, and occupational health and safety management.</p></div><div class="iso">${map(CERTS, (x) => `<div class="iso__item rule"><img src="${c.a('assets/' + x[4])}" alt="${x[0]} certification mark" width="${x[5]}" height="${x[6]}" loading="lazy"><span class="d">${x[0]}</span><span class="label">${x[1]} System</span><p class="p" style="font-size:16px">${x[3]}</p></div>`)}</div></div></section>
${(s.brochures || []).length ? `<section class="px sec"><div class="wrap split"><div class="l"><p class="eyebrow">05 — Credentials</p><h2 class="d h2">Download our brochures</h2></div><div class="r rule">${map(s.brochures, (b) => `<a class="row" href="${esc(c.m(b.file))}" target="_blank" rel="noopener" style="justify-content:space-between;padding:26px 0;color:var(--ink)"><span class="d" style="font-size:clamp(30px,3vw,46px);line-height:1.05">${esc(b.name)}</span><span class="label green">PDF ↓</span></a>`)}</div></div></section>` : ''}`;
  return shell(c, D, { title: 'About & Certifications — Designo Interiors', desc: 'Designo Interiors is a corporate interior design and turnkey project firm in Mumbai, certified to ISO 9001, 14001 and 45001.', active: 'about', page: 'about/', body: body });
}

function pageSustainability(c, D) {
  const s = D.site;
  const why = [['Environmental preservation', 'Materials and methods that use fewer finite resources, create less waste and do less harm to habitats.'], ['Healthier indoor air', 'Low-VOC materials reduce respiratory irritation, allergies and headaches for the people inside.'], ['Resource conservation', 'Designs that save water and energy every day the space is in use.'], ['Lower carbon footprint', 'Energy-efficient appliances, local sourcing and natural light all cut emissions.'], ['Long-term savings', 'Efficient systems and durable materials lower running and maintenance costs.'], ['Well-being', 'Natural elements and healthy materials make spaces more comfortable to live and work in.']];
  const init = [['Low-VOC paints and finishes', 'Finishes that don’t release harmful chemicals into the air, safer for occupants, our team and the planet.'], ['Energy-efficient lighting and appliances', 'Fittings that use less electricity and water, plus natural light and ventilation wherever possible to reduce cooling loads.'], ['Local sourcing', 'We work with local artisans and suppliers, which cuts transport emissions.'], ['Waste reduction', 'Usable materials from demolition are donated to local charities and recycling centres.'], ['Eco-tech integration', 'Smart lighting, renewable energy and efficient appliances that save or generate electricity.'], ['Water conservation', 'Water-saving fixtures, rainwater harvesting and water management systems.']];
  const gains = [['Lower energy costs', 'Renewable sources, low-energy appliances and durable materials reduce utility and repair bills.'], ['Higher property value', 'Green buildings tend to command better occupancy, rents and resale values.'], ['Tax incentives', 'Depending on the project, green building measures such as rooftop solar can qualify for subsidies or rebates.'], ['Built for Mumbai’s climate', 'Comfortable, resilient spaces in a hot, humid city, with less heat stress and lower emissions.']];
  const body = `
<section class="hero"><div class="hero__media">${img(c, s.images && s.images.sustainability, 'Conference room among tropical planting', ' loading="eager" data-parallax="6"')}</div><div class="hero__shade"></div>${sMark('hero__s s-draw')}<div class="hero__inner wrap-wide px"><p class="eyebrow">Designo EcoVisions · ISO 14001</p><h1 class="d" style="font-size:clamp(60px,10vw,172px);line-height:.96;letter-spacing:-.012em">A greener<br>tomorrow</h1><p style="margin:32px 0 0;max-width:620px;font:300 clamp(18px,1.6vw,22px)/1.55 var(--sans)">Sustainability runs through how we specify, source and build. Every client who works with us contributes to a cleaner, safer environment as well as a better space.</p></div></section>
<section class="px sec"><div class="wrap">${head2('01 — Why it matters', 'Better for people and place')}<div class="grid rule" style="--min:300px;gap:0 40px">${map(why, (x) => `<div style="padding:30px 0;border-bottom:1px solid var(--hair);display:flex;flex-direction:column;gap:12px"><h3 class="d" style="font-size:34px;line-height:1.08">${x[0]}</h3><p class="p" style="font-size:16px">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec dark"><div class="wrap split"><div class="l"><p class="eyebrow">02 — Our initiatives</p><h2 class="d h2">What we do on every project</h2><div class="img r75" style="margin-top:20px">${img(c, s.images && s.images.vastu, 'Sunlit window-side office', ' data-parallax="10"')}</div></div><ol class="r rule" style="list-style:none;margin:0;padding:0">${map(init, (x, i) => `<li class="row" style="padding:28px 0"><span class="num" style="flex:0 0 40px">${pad(i + 1)}</span><div style="flex:1 1 360px;display:flex;flex-direction:column;gap:10px"><h3 class="d" style="font-size:38px;line-height:1.05">${x[0]}</h3><p class="p" style="font-size:16px">${x[1]}</p></div></li>`)}</ol></div></section>
<section class="px sec"><div class="wrap">${head2('03 — What you gain', 'Your benefits')}<div class="cells" style="--min:260px">${map(gains, (x, i) => `<div><span class="num">${pad(i + 1)}</span><h3 class="d" style="font-size:36px;line-height:1.05">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec bg2"><div class="wrap split"><div class="l" style="flex:5 1 360px"><p class="eyebrow">Join our green mission</p><h2 class="d h2">Got an idea for a greener space?</h2><p class="p" style="max-width:460px">We want to hear about sustainable products, ideas and initiatives, and to explore them with you on your next project.</p><a class="link" href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">Message us on WhatsApp →</a></div><div class="r" style="flex:6 1 420px"><form class="form" data-form="ecovisions">${hp}${field('Name', 'name', { required: true })}${field('Email', 'email', { type: 'email', required: true })}${field('Your idea', 'message', { rows: 3, full: true })}<label class="check full"><input type="checkbox" name="updates" value="Yes">Send me occasional updates on sustainable design.</label><div class="form__end"><span></span><button class="btn btn--dark" type="submit">Send <span>→</span></button></div></form>${done('Thank you', 'We’ll be in touch.')}</div></div></section>`;
  return shell(c, D, { title: 'Designo EcoVisions — Sustainable Interiors — Designo Interiors', desc: 'Low-VOC finishes, energy-efficient lighting, local sourcing, waste reduction and water conservation in every Designo interior.', active: 'sustainability', page: 'sustainability/', tone: 'overlay', body: body });
}

function pageVastu(c, D) {
  const s = D.site;
  const steps4 = [['Consultation', 'He begins by understanding your business, your team and what you need from the space.'], ['Site study', 'Orientation, natural and artificial light, room colours and shapes, materials, and where furniture, objects and technology sit.'], ['Recommendations', 'Advice for a balanced, healthy, supportive space, with personal recommendations where they help.'], ['Into the design', 'We build his recommendations into the drawings, so the finished space is harmonious and efficient.']];
  const vastuPost = D.posts.find((p) => p.category === 'Vastu');
  const body = `
<section class="intro" style="padding-bottom:var(--sy)">${introS()}<div class="wrap" style="align-items:stretch;gap:48px clamp(40px,6vw,104px)"><div style="flex:6 1 480px;justify-content:space-between;gap:44px"><div style="display:flex;flex-direction:column;gap:22px"><p class="eyebrow">Vastu Shastra</p><h1 class="d" style="font-size:clamp(66px,10vw,172px);line-height:.96;letter-spacing:-.012em">Planned<br>for balance</h1></div><div style="display:flex;flex-direction:column;gap:20px;max-width:580px"><p class="lede" style="font-size:19px">Vastu Shastra is the traditional Indian system of architecture. Its principles cover layout, measurement, orientation and spatial geometry, with the aim of bringing a building into harmony with nature.</p><p class="p p-lg">The arrangement of an interior affects the people who use it. In dense city buildings a fully Vastu-planned layout isn’t always possible, so careful choices of furniture, colour and accessories can bring a space into compliance.</p></div></div><div class="img" style="flex:5 1 380px;min-height:540px">${img(c, s.images && s.images.vastu, 'Sunlit window-side office', ' loading="eager" data-parallax="10"')}</div></div></section>
<section class="px sec dark relative">${sMark('bigs s-draw', ' data-parallax="8" style="left:auto;right:-6%"')}<div class="wrap"><div class="headrow"><div><p class="eyebrow">Designo &amp; Vastu</p><h2 class="d h2">Our in-house consultant</h2></div><p class="p" style="max-width:440px">Our Vastu consultant has worked with Designo since the firm’s early years, and reviews each project before the layout is final.</p></div><div class="grid" style="--min:260px;gap:0 32px">${map(steps4, (x, i) => `<div class="col rule"><span class="bignum" style="font-size:68px">${pad(i + 1)}</span><h3 class="d" style="font-size:34px;line-height:1.05">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div></div></section>
<section class="px sec"><div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:32px 64px"><div style="flex:1 1 560px;display:flex;flex-direction:column;gap:22px"><p class="eyebrow">For workplaces</p><p class="d" data-split style="font-size:clamp(40px,5.2vw,86px);line-height:1.04">Vastu-compliant layouts, built for balance and business success.</p></div><div class="btns">${btn(c.u('contact/', '#consult'), 'Book a Vastu consultation <span>→</span>', 'btn--dark')}${vastuPost ? btn(c.u('journal/' + vastuPost.slug + '/'), 'Read: ' + esc(vastuPost.title), 'btn--line') : ''}</div></div></section>`;
  return shell(c, D, { title: 'Vastu Shastra Consultancy — Designo Interiors', desc: 'Vastu-compliant office and commercial interiors, reviewed by Designo’s in-house Vastu consultant.', active: 'services', page: 'vastu/', body: body });
}

function pageClientele(c, D) {
  const C = D.clients;
  // Only clients with a logo appear in the wall; everyone is still listed in the tables below.
  const wall = C.wall.some((w) => w.logo) ? C.wall.filter((w) => w.logo) : C.wall;
  const body = `
${intro('Clientele', 'Who we’ve<br>built for', 'Multinational offices, R&amp;D floors, a university, municipal buildings, hotels, retail chains and a recording studio.')}
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap wall rule">${map(wall, (w) => w.logo ? `<div><span class="wall__mark">${logo(c, w)}</span><span class="label muted">${esc(w.name)}</span></div>` : `<div><span class="wall__mark wall__mark--name">${esc(w.name)}</span></div>`)}</div></section>
<section class="px sec bg2"><div class="wrap">${head2('Offices &amp; institutions · designed and executed', 'Workplaces', `<span class="label">${(C.offices || []).length} listed</span>`)}<div class="table t-clients rule"><div class="th"><span>No.</span><span>Client</span><span>Location</span><span class="right">Sq ft</span></div>${map(C.offices, (o, i) => `<div><span class="num">${pad(i + 1)}</span><span style="font-size:17px;font-weight:500">${esc(o.name)}</span><span style="font-size:15px">${esc(o.place)}</span><span class="right" style="font-size:14px;font-variant-numeric:tabular-nums">${o.area ? inr(o.area) : '—'}</span></div>`)}</div></div></section>
<section class="px sec"><div class="wrap">${head2('Beyond the office', 'Hospitality, retail, buildings')}<div class="grid" style="--min:300px;gap:48px 40px">${map(C.groups, (g) => `<div class="rule" style="padding-top:22px"><h3 class="d" style="font-size:34px;line-height:1.05;margin-bottom:12px">${esc(g.name)}</h3>${map(g.items, (it) => `<div style="padding:11px 0;border-bottom:1px solid var(--hair);font-size:16px;line-height:1.45">${esc(it)}</div>`)}</div>`)}</div></div></section>
${C.showHomes ? `<section class="px sec dark relative">${sMark('bigs s-draw', ' data-parallax="8" style="left:auto;right:-6%"')}<div class="wrap" style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:32px clamp(40px,6vw,104px)"><div style="display:flex;flex-direction:column;gap:12px"><p class="eyebrow">Residential</p><span class="d" style="font-size:clamp(110px,15vw,250px);line-height:.9" data-count>${esc(C.homes)}</span><span class="label" style="color:var(--pale)">Private homes</span></div><p class="lede" style="flex:1 1 380px;max-width:560px">Apartments and bungalows in ${esc(C.homeAreas)}. We keep residential client names private.</p></div></section>` : ''}`;
  return shell(c, D, { title: 'Clientele — Designo Interiors', desc: 'Offices, institutions, hotels, retail chains and studios designed and built by Designo Interiors since 1991.', active: 'clientele', page: 'clientele/', body: body });
}

function pageContact(c, D) {
  const s = D.site;
  const chip = (k, v, label) => `<button type="button" class="chip" data-pick="${k}" data-val="${esc(v)}" aria-pressed="false">${label || esc(v)}</button>`;
  const body = `
<section class="intro" style="padding-bottom:clamp(44px,5vw,72px)">${introS()}<div class="wrap"><div><p class="eyebrow">Contact</p><h1 class="d h-xl">Let’s talk</h1></div><div class="grid rule" style="--min:220px;gap:0 32px;flex:0 1 620px">${[['Call', `<a href="tel:${esc(s.phoneLink)}">${esc(s.phone)}</a>`], ['WhatsApp', `<a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">Message us →</a>`], ['Email', `<a href="mailto:${esc(s.email)}" style="word-break:break-all">${esc(s.email)}</a>`], ['Hours', esc(s.hours)]].map((x) => `<div style="display:flex;flex-direction:column;gap:8px;padding:20px 0;border-bottom:1px solid var(--hair)"><span class="label green">${x[0]}</span><span style="font-size:18px">${x[1].replace(/<a /, '<a style="color:var(--ink)" ')}</span></div>`).join('')}</div></div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap box" data-tabs-box>
  <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="quote" aria-selected="true"><span class="label">01</span><span class="d">Get a quote</span></button><button type="button" role="tab" data-tab="consult" aria-selected="false"><span class="label">02 · Free</span><span class="d">Book a consultation</span></button></div>
  <div class="box__body">
    <div data-panel="quote">${quoteForm(c, D, true)}</div>
    <div data-panel="consult" hidden><form class="form" data-form="consultation" data-picker style="display:flex;flex-direction:column;gap:38px">${hp}<input type="hidden" name="mode"><input type="hidden" name="day"><input type="hidden" name="time">
      <div style="display:flex;flex-direction:column;gap:14px"><span class="label muted">How would you like to meet?</span><div class="chips">${chip('mode', 'Online')}${chip('mode', 'At our office')}${chip('mode', 'Site visit')}</div></div>
      <div style="display:flex;flex-direction:column;gap:14px"><span class="label muted">Pick a day</span><div class="days" data-days></div></div>
      <div style="display:flex;flex-direction:column;gap:14px"><span class="label muted">Time</span><div class="chips">${map(['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'], (t) => chip('time', t))}</div></div>
      <div class="form">${field('Name', 'name', { required: true })}${field('Phone', 'phone', { type: 'tel', required: true })}${field('Email', 'email', { type: 'email' })}</div>
      <div class="form__end rule rule--soft" style="padding-top:26px"><span class="label green" data-summary></span><button class="btn btn--dark" type="submit">Confirm booking <span>→</span></button></div>
    </form>${done('Consultation requested', 'Thank you. We’ll confirm by phone.')}</div>
  </div>
</div><p class="wrap small" style="margin-top:22px">Larger project, or an RFP to share? <a href="${c.u('project-brief/')}">Send a detailed brief with drawings →</a></p></section>
<section class="px sec bg2"><div class="wrap">${head2('Offices', 'See us in person')}<div class="grid" style="--min:420px;gap:24px">${map(s.offices, (o) => `<div style="background:#fff;display:flex;flex-direction:column"><iframe class="map" title="Map — ${esc(o.name)} office" src="https://www.google.com/maps?q=${encodeURIComponent(o.mapQuery || o.address)}&amp;output=embed" loading="lazy"></iframe><div style="padding:30px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px"><div style="display:flex;flex-direction:column;gap:10px"><span class="d" style="font-size:38px;line-height:1.05">${esc(o.name)}</span><span class="muted" style="font-size:16px;line-height:1.55;max-width:320px">${esc(o.address)}</span></div><a class="link" href="https://maps.google.com/?q=${encodeURIComponent(o.mapQuery || o.address)}" target="_blank" rel="noopener">Directions ↗</a></div></div>`)}</div></div></section>`;
  return shell(c, D, { title: 'Contact & Quote — Designo Interiors', desc: 'Get a quote or book a free consultation with Designo Interiors. Offices in Bhandup West and Powai, Mumbai.', active: 'contact', page: 'contact/', body: body, cta: false });
}

function pageCareers(c, D) {
  const roles = D.jobs.map((j) => j.title).concat('General application');
  const body = `
${intro('Careers · We’re hiring', 'Build<br>with us', 'We’re looking for designers, site teams and visualisers who care about detail and delivery. Apply for an open role, or send your CV for future openings.')}
${D.jobs.length ? `<section class="px" style="padding-bottom:var(--sy)"><div class="wrap rule">${map(D.jobs, (j, i) => `<div class="row" style="align-items:center;gap:16px 40px;padding:30px 0"><span class="num" style="flex:0 0 40px">${pad(i + 1)}</span><div style="flex:3 1 360px;display:flex;flex-direction:column;gap:10px"><span class="d h3">${esc(j.title)}</span><span class="p" style="font-size:16px">${esc(j.summary)}</span></div><span class="label green" style="flex:1 1 180px">${esc([j.type, j.place].filter(Boolean).join(' · '))}</span><button type="button" class="btn btn--line" data-apply="${esc(j.title)}">Apply →</button></div>`)}</div></section>` : ''}
<section class="px sec bg2" id="apply"><div class="wrap split"><div class="l"><p class="eyebrow">Apply now</p><h2 class="d h2">Send us your CV</h2><p class="p" style="max-width:400px">Attach your resume and a link to your portfolio if you have one.</p></div><div class="r"><form class="form" data-form="careers">${hp}${field('Name', 'name', { required: true })}${field('Phone', 'phone', { type: 'tel' })}${field('Email', 'email', { type: 'email', required: true })}${select('Role', 'role', roles)}${field('Portfolio link', 'portfolio', { type: 'url', placeholder: 'https://', full: true })}<label class="upload full"><span style="display:flex;flex-direction:column;gap:6px"><span class="label">Resume *</span><span data-file-label>PDF or Word, up to 5 MB</span></span><span class="label green">Choose file ↑</span><input type="file" name="resume" accept=".pdf,.doc,.docx" required></label><div class="form__end"><span></span><button class="btn btn--dark" type="submit">Submit application <span>→</span></button></div></form>${done('Application received', 'Thank you for applying.', 'We’ll contact you if your profile matches a current or upcoming role.')}</div></div></section>`;
  return shell(c, D, { title: 'Careers — Designo Interiors', desc: 'Join Designo Interiors: interior designers, site supervisors and 3D visualisers in Mumbai.', page: 'careers/', body: body });
}

function pageJournal(c, D) {
  const cats = ['all'].concat(D.posts.map((p) => p.category).filter((x, i, a) => x && a.indexOf(x) === i));
  const lead = D.posts[0], rest = D.posts.slice(1);
  const body = `
<section class="intro intro--tight">${introS()}<div class="wrap"><div><p class="eyebrow">Journal</p><h1 class="d h-xl">Notes<br>from site</h1></div>${cats.length > 2 ? `<div class="chips">${map(cats, (k, i) => `<button type="button" class="chip" data-cat="${esc(k)}" aria-pressed="${i ? 'false' : 'true'}">${k === 'all' ? 'All' : esc(k)}</button>`)}</div>` : ''}</div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap" style="display:flex;flex-direction:column;gap:64px">
${lead ? `<a class="card rule" data-post-cat="${esc(lead.category)}" href="${c.u('journal/' + lead.slug + '/')}" data-cursor="Read" style="flex-direction:row;flex-wrap:wrap;align-items:flex-end;gap:32px clamp(32px,5vw,72px);padding-top:28px"><div class="img r1610" style="flex:7 1 520px">${img(c, lead.cover, lead.title, ' data-parallax="8"')}</div><div style="flex:4 1 320px;display:flex;flex-direction:column;gap:18px"><span class="label green">${esc(lead.category)} · ${lead.dateLabel}</span><span class="card__title" style="font-size:clamp(40px,4.4vw,70px);line-height:1.02;text-wrap:balance">${esc(lead.title)}</span><span class="p">${esc(lead.excerpt)}</span><span class="link">Read →</span></div></a>` : '<p class="muted">No posts yet.</p>'}
<div class="grid-fill" style="gap:64px 24px">${map(rest, (p) => `<a data-post-cat="${esc(p.category)}" class="card rule rule--soft" href="${c.u('journal/' + p.slug + '/')}" data-cursor="Read" style="padding-top:22px"><span class="label green">${esc(p.category)} · ${p.dateLabel}</span><div class="img r75">${img(c, p.cover, p.title, ' data-parallax="8"')}</div><span class="card__title">${esc(p.title)}</span><span class="p small">${esc(p.excerpt)}</span></a>`)}</div>
</div></section>`;
  return shell(c, D, { title: 'Journal — Designo Interiors', desc: 'Notes on workplace design, Vastu, sustainability and automation from Designo Interiors.', active: 'journal', page: 'journal/', body: body });
}

function pagePost(c, D, p, next) {
  const body = `
<article class="intro" style="padding-top:clamp(36px,4vw,60px);padding-bottom:var(--sy)">${introS()}<div class="wrap wrap--free">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${c.u('journal/')}">Journal</a><span>/</span><span>${esc(p.category)}</span></nav>
  <h1 class="d" style="margin-top:clamp(28px,4vw,48px);max-width:1100px;font-size:clamp(52px,7.5vw,124px);line-height:.98;letter-spacing:-.01em">${esc(p.title)}</h1>
  <p class="label green" style="margin:26px 0 0">${p.dateLabel} · ${esc(p.category)}</p>
  ${p.cover ? `<div class="img r219" style="margin-top:clamp(32px,4vw,56px)">${img(c, p.cover, p.title, ' loading="eager" data-parallax="10"')}</div>` : ''}
  <div class="article"><p class="lede">${esc(p.excerpt)}</p><div class="body">${p.body || ''}</div>
  <div class="rule rule--soft" style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;margin-top:24px;padding-top:26px"><a class="link" href="${c.u('journal/')}">← All notes</a>${next && next !== p ? `<a class="link" href="${c.u('journal/' + next.slug + '/')}">Next: ${esc(next.title)} →</a>` : ''}</div></div>
</div></article>`;
  return shell(c, D, { title: p.title + ' — Designo Interiors', desc: p.excerpt, active: 'journal', body: body, image: p.cover });
}

function pageReferral(c, D) {
  const terms = [['Eligibility', 'Participants must be 18 or older, with a valid email address and ID proof.'], ['Referral validity', 'The referred client must sign a contract for a project above the minimum qualifying size of ₹5,00,000.'], ['Reward distribution', 'Rewards are paid in line with the client’s payment phases.'], ['Payment method', 'Rewards are paid by bank transfer or in cash.'], ['One-time use', 'A reward applies once per project and can’t be combined with other discounts or promotions.'], ['Fraud prevention', 'Designo may investigate suspicious, fraudulent or abusive activity and may withhold or cancel rewards, end a participant’s involvement or pursue legal remedies. Participants agree to cooperate with any investigation.'], ['Changes to the programme', 'Designo may modify, suspend or end the programme at any time without notice, and may offer a grace period to redeem outstanding rewards.'], ['Dispute resolution', 'Disputes go first to Designo’s designated representative. If unresolved, both parties use a mutually agreed mediator and bear their own costs unless agreed otherwise.'], ['Privacy and data protection', 'Personal information is used only to run the programme, in line with our Privacy Policy. You can ask to access, update or delete it, subject to legal or contractual obligations.']];
  const phase = (n, text, key) => `<div class="row" style="padding:22px 0"><span class="label green" style="flex:0 0 100px">Phase ${n}</span><span class="p" style="flex:1 1 260px;font-size:16px">${text}</span><span style="font-size:17px;font-variant-numeric:tabular-nums" ${key}></span></div>`;
  const body = `
${intro('Designo referral programme', 'Refer a project,<br><span class="green">earn 5%</span>', 'Introduce a friend, colleague or company to Designo. When they sign, you earn 5% of the project value, paid as they pay us.')}
<section class="px"><div class="wrap cells" style="--min:280px"><div style="background:var(--forest);color:#fff;padding:38px 32px"><span class="d" style="font-size:clamp(72px,7vw,116px);line-height:.95">5%</span><span class="label" style="color:var(--pale)">Of project value · every referral</span></div><div style="padding:38px 32px"><span class="d" style="font-size:clamp(72px,7vw,116px);line-height:.95">₹10,000</span><span class="label green">Bonus at 3 successful referrals</span></div><div style="padding:38px 32px"><span class="d" style="font-size:clamp(72px,7vw,116px);line-height:.95">₹20,000</span><span class="label green">Bonus at 5 successful referrals</span></div></div></section>
<section class="px sec"><div class="wrap split" data-calc><div class="l"><p class="eyebrow">How rewards are paid</p><h2 class="d h2">In three phases</h2><p class="p" style="max-width:400px">Your 5% is released as the client pays each stage of the project. Move the slider to see an example.</p></div><div class="r" style="display:flex;flex-direction:column;gap:28px"><div class="box" style="padding:30px;display:flex;flex-direction:column;gap:16px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px"><span class="label muted">Project value</span><span class="d" style="font-size:48px;line-height:1" data-v></span></div><input class="range" type="range" min="500000" max="20000000" step="100000" value="4000000" aria-label="Project value"><div style="display:flex;justify-content:space-between;font:500 11px/1 var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)"><span>₹5 lakh minimum</span><span>₹2 crore</span></div></div><div class="rule">${phase(1, 'Client pays the 50% advance before work starts.', 'data-p1')}${phase(2, 'Client pays the next 40%, 15 days after work begins.', 'data-p2')}${phase(3, 'Client pays the final 10%, 7 days after completion.', 'data-p3')}<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:16px;padding:24px 0"><span class="label">Your total reward</span><span class="d" style="font-size:60px;line-height:1;color:var(--green)" data-total></span></div></div></div></div></section>
<section class="px sec bg2"><div class="wrap">${head2('How to enrol', 'Three steps')}<div class="grid" style="--min:280px;gap:0 32px">${map([['Check eligibility', 'You must be 18 or older with a valid email address and ID proof. Referred projects must be worth at least ₹5,00,000.'], ['Apply online', 'Fill in the form below with your details, the project and the person you’re referring. Accurate details avoid delays.'], ['Get approved', 'We confirm eligibility within 1–2 business days. Once your referral signs up, you qualify for the reward.']], (x, i) => `<div class="col rule"><span class="bignum" style="font-size:68px">${pad(i + 1)}</span><h3 class="d" style="font-size:34px;line-height:1.05">${x[0]}</h3><p class="p small">${x[1]}</p></div>`)}</div><p data-fade style="margin:44px 0 0;padding:22px 26px;background:#fff;font-size:16px;line-height:1.6"><strong style="font-weight:600">Referring a company?</strong> Corporate referrals earn appreciation rewards too. Choose “Commercial project” as the project type.</p></div></section>
<section class="px sec"><div class="wrap split"><div class="l"><p class="eyebrow">Application</p><h2 class="d h2">Refer now</h2></div><div class="r"><form class="form" data-form="referral">${hp}<span class="full label green" style="padding-bottom:12px;border-bottom:1px solid var(--ink)">Your details</span>${field('Name', 'name', { required: true })}${field('Email', 'email', { type: 'email', required: true })}${field('Phone', 'phone', { type: 'tel', required: true })}<span class="full label green" style="padding-bottom:12px;border-bottom:1px solid var(--ink);margin-top:8px">Who are you referring?</span>${field('Name or company', 'referred_name', { required: true })}${field('Their phone or email', 'referred_contact', { required: true })}${select('Project type', 'type', ['Commercial project', 'Residential project'])}${field('Approx. project value', 'value', { placeholder: 'e.g. ₹40 lakh' })}<label class="check full"><input type="checkbox" name="terms" value="Agreed" required>I agree to the programme terms and conditions below.</label><div class="form__end"><span></span><button class="btn btn--dark" type="submit">Submit referral <span>→</span></button></div></form>${done('Referral received', 'Thank you. We’ll confirm within 1–2 business days.')}</div></div></section>
<section class="px" style="padding-bottom:var(--sy)"><div class="wrap split"><p class="eyebrow l" style="flex:4 1 320px">Terms &amp; conditions</p><div class="r rule">${map(terms, (t, i) => `<details><summary>${i + 1}. ${t[0]}</summary><p>${t[1]}</p></details>`)}</div></div></section>`;
  return shell(c, D, { title: 'Referral Programme — Designo Interiors', desc: 'Refer a project to Designo Interiors and earn 5% of the project value, plus bonus rewards.', page: 'referral/', body: body });
}

function page404(c, D) {
  return shell(c, D, { title: 'Page not found — Designo Interiors', desc: '', body: `<section class="intro" style="min-height:64vh;display:flex;align-items:flex-end">${introS()}<div class="wrap" style="width:100%"><div><p class="eyebrow">404</p><h1 class="d h-xl">Page not found</h1><p class="p p-lg">The page may have moved when the site was rebuilt.</p></div><div class="btns">${btn(c.u(''), 'Home <span>→</span>', 'btn--dark')}${btn(c.u('projects/'), 'Projects', 'btn--line')}</div></div></section>` });
}

if (typeof module !== 'undefined') module.exports = { buildSite: buildSite };

if (typeof require !== 'undefined' && typeof process !== 'undefined' && require.main === module) {
  const fs = require('fs'), path = require('path');
  const root = path.resolve(__dirname, '..');
  // Cloudflare won't publish a file over 25 MiB, and one such file fails the whole deploy. Leave it
  // out (only its own link breaks) and say so, rather than stop every other change going live.
  const LIMIT = 25 * 1024 * 1024;
  const copy = (from, to) => { if (!fs.existsSync(from)) return; for (const n of fs.readdirSync(from)) { const a = path.join(from, n), b = path.join(to, n), st = fs.statSync(a); if (st.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copy(a, b); } else if (st.size > LIMIT) console.warn('WARNING: ' + path.relative(root, a) + ' is ' + (st.size / 1048576).toFixed(1) + ' MiB, over the 25 MiB limit for one file, so it was left out of the site. Compress it and upload it again.'); else fs.copyFileSync(a, b); } };
  fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  copy(path.join(root, 'static'), path.join(root, 'dist'));
  fs.mkdirSync(path.join(root, 'dist/media'), { recursive: true });
  copy(path.join(root, 'media'), path.join(root, 'dist/media'));
  buildSite({
    read: (p) => fs.readFileSync(path.join(root, p), 'utf8'),
    bytes: (p) => fs.readFileSync(path.join(root, p)),
    list: (d) => fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d)) : [],
    write: (p, s) => { const f = path.join(root, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); }
  }, { pretty: process.argv.indexOf('--preview') === -1 }).then((n) => console.log('Built ' + n + ' pages into dist/'), (e) => { console.error(e.message); process.exit(1); });
}
