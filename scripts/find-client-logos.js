#!/usr/bin/env node
/*
  TEMPORARY discovery tool: collects candidate client logos into scratch/logos/ for review.
    1. Crawls the old GoDaddy site (live, or the Wayback Machine copy if the domain has moved)
       and saves a small preview of every image with its alt text and nearest heading.
    2. For each notable client, looks up Wikidata/Wikipedia logos and the logo on the client's
       own website.
  Writes scratch/logos/manifest.json. Not part of the site build.
*/
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../scratch/logos');
const UA = 'DesignoInteriorsLogoFinder/1.0 (https://github.com/atharva2112/designointeriors; designo371@gmail.com)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const MAX = 4 * 1024 * 1024;

const CLIENTS = [
  { name: 'Castrol India', q: ['Castrol'], sites: ['https://www.castrol.com/en_in/india/home.html', 'https://www.castrol.com/'] },
  { name: 'Wincor Nixdorf', q: ['Wincor Nixdorf', 'Diebold Nixdorf'], sites: ['https://www.dieboldnixdorf.com/'] },
  { name: 'Laerdal', q: ['Laerdal Medical'], sites: ['https://laerdal.com/'] },
  { name: 'Visible Alpha', q: ['Visible Alpha'], sites: ['https://visiblealpha.com/'] },
  { name: 'Essel Group', q: ['Essel Group'], sites: ['https://www.esselgroup.com/'] },
  { name: 'Practo', q: ['Practo'], sites: ['https://www.practo.com/'] },
  { name: 'Hansa Cequity', q: ['Hansa Cequity', 'Hansa Research'], sites: ['https://www.hansacequity.com/'] },
  { name: 'Edelweiss', q: ['Edelweiss Financial Services', 'Edelweiss Group'], sites: ['https://www.edelweissfin.com/', 'https://www.edelweiss.in/'] },
  { name: 'Geno Pharmaceuticals', q: ['Geno Pharmaceuticals'], sites: ['https://www.genopharma.com/', 'https://genopharma.in/'] },
  { name: 'Goa University', q: ['Goa University'], sites: ['https://www.unigoa.ac.in/'] },
  { name: 'Kuber Group', q: ['Kuber Group'], sites: ['https://www.kubergroup.com/', 'https://kubergroup.in/'] },
  { name: 'Royal Palms', q: ['Royal Palms Golf and Country Club', 'Royal Palms Mumbai'], sites: ['https://www.royalpalmsindia.com/'] },
  { name: 'Hotel Centaur', q: ['Centaur Hotel Juhu', 'Hotel Corporation of India'], sites: [] },
  { name: 'Aban Lloyd Chiles Offshore', q: ['Aban Offshore', 'Aban Lloyd Chiles Offshore'], sites: ['https://www.abanoffshore.com/'] },
  { name: 'S.S. Communication', q: [], sites: ['https://www.sscommunication.in/'] },
  { name: 'Mormugao Municipal Council', q: ['Mormugao Municipal Council'], sites: [] }
];

const slug = (s) => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'x';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const text = (html) => decode(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m = new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i').exec(tag); return m ? decode(m[2] != null ? m[2] : m[3]) : ''; };
const abs = (u, base) => { try { return new URL(u.startsWith('//') ? 'https:' + u : u, base).href; } catch (e) { return ''; } };
const TYPES = { 'image/webp': 'webp', 'image/avif': 'avif', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico' };

async function get(url, opts) {
  opts = opts || {};
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(opts.timeout || 25000), headers: { 'user-agent': opts.ua || BROWSER_UA, accept: opts.accept || '*/*', 'accept-language': 'en-IN,en;q=0.9' } });
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: res.ok, status: res.status, url: res.url || url, type: (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(), buf };
  } catch (e) { return { ok: false, status: 0, error: e.message, url }; }
}
const getText = async (url, opts) => { const r = await get(url, Object.assign({ accept: 'text/html,application/json;q=0.9,*/*;q=0.5' }, opts)); return r.ok ? Object.assign(r, { text: r.buf.toString('utf8') }) : r; };
const getJson = async (url) => { const r = await get(url, { ua: UA, accept: 'application/json' }); try { return r.ok ? JSON.parse(r.buf.toString('utf8')) : null; } catch (e) { return null; } };

async function saveImage(url, dir, name, opts) {
  const r = await get(url, Object.assign({ accept: 'image/webp,image/svg+xml,image/png,image/*;q=0.8,*/*;q=0.3' }, opts));
  if (!r.ok) return { url, error: r.error || ('HTTP ' + r.status) };
  let ext = TYPES[r.type];
  if (!ext && /<svg[\s>]/i.test(r.buf.slice(0, 2000).toString('utf8'))) ext = 'svg';
  if (!ext) { const m = /\.(png|jpe?g|gif|webp|svg|avif|ico)(\?|$)/i.exec(url); ext = m ? m[1].toLowerCase().replace('jpeg', 'jpg') : ''; }
  if (!ext) return { url, error: 'not an image (' + (r.type || 'unknown') + ')' };
  if (!r.buf.length || r.buf.length > MAX) return { url, error: 'size ' + r.buf.length };
  const rel = path.posix.join(dir, slug(name) + '.' + ext);
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  fs.writeFileSync(path.join(OUT, rel), r.buf);
  return { url, file: rel, bytes: r.buf.length, type: r.type };
}

/* ---------- 1. the old site ---------- */
const WSIMG = /(?:https?:)?\/\/img1\.wsimg\.com\/isteam\/[^"'\s)\\<>,]+/g;
const baseOf = (u) => (u.startsWith('//') ? 'https:' + u : u).split('/:/')[0];

async function crawlSite() {
  const result = { source: '', pages: [], images: [] };
  const images = new Map();
  const visit = async (pageUrl, fetchUrl, host) => {
    const r = await getText(fetchUrl);
    if (!r.ok || !r.text) { result.pages.push({ url: pageUrl, error: r.error || r.status }); return []; }
    const html = r.text.replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
    const heads = []; html.replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi, (m, t, i) => { heads.push([i, text(t).slice(0, 80)]); return m; });
    const headingAt = (i) => { let h = ''; for (const x of heads) { if (x[0] < i) h = x[1]; else break; } return h; };
    let order = 0;
    const note = (u, i, alt, ux) => {
      const b = baseOf(u);
      if (!/\/isteam\/ip\//.test(b) && !/\/isteam\/getty\//.test(b)) return;
      if (!images.has(b)) images.set(b, { base: b, seen: u.startsWith('//') ? 'https:' + u : u, pages: [], alts: [], ux: [], headings: [], order: [] });
      const e = images.get(b);
      if (!e.pages.includes(pageUrl)) e.pages.push(pageUrl);
      if (alt && !e.alts.includes(alt)) e.alts.push(alt);
      if (ux && !e.ux.includes(ux)) e.ux.push(ux);
      const h = headingAt(i); if (h && !e.headings.includes(h)) e.headings.push(h);
      e.order.push(pageUrl.replace(/^https?:\/\/[^/]+/, '') + '#' + (order++));
    };
    html.replace(/<img\b[^>]*>/gi, (tag, i) => { (tag.match(WSIMG) || []).forEach((u) => note(u, i, attr(tag, 'alt'), attr(tag, 'data-ux') || attr(tag, 'data-aid'))); return tag; });
    html.replace(WSIMG, (u, i) => { note(u, i, '', ''); return u; });
    result.pages.push({ url: pageUrl, title: text((/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1]), images: order });
    const links = new Set();
    html.replace(/href\s*=\s*"([^"#]*)"/gi, (m, h) => { const a = abs(decode(h), pageUrl); try { const u = new URL(a); if (u.hostname.replace(/^www\./, '') === host && !/\.(pdf|jpe?g|png|gif|webp|svg|ico|css|js|xml|txt)$/i.test(u.pathname)) links.add(u.origin + u.pathname.replace(/\/+$/, '') + (u.pathname === '/' ? '' : '')); } catch (e) {} return m; });
    return [...links];
  };

  // Live first; if it isn't the GoDaddy site any more, use the Wayback Machine.
  const live = await getText('https://www.designointeriors.com/');
  const isGoDaddy = live.ok && /img1\.wsimg\.com\/isteam/.test(live.text || '');
  if (isGoDaddy) {
    result.source = 'live';
    const host = new URL(live.url).hostname.replace(/^www\./, '');
    const queue = ['https://www.designointeriors.com/'], seen = new Set();
    while (queue.length && seen.size < 60) {
      const u = queue.shift().replace(/\/+$/, '') || 'https://www.designointeriors.com';
      if (seen.has(u)) continue; seen.add(u);
      for (const l of await visit(u, u, host)) if (!seen.has(l.replace(/\/+$/, ''))) queue.push(l);
    }
  } else {
    result.source = 'wayback';
    result.liveStatus = live.ok ? 'live site is no longer GoDaddy (' + live.url + ')' : 'live site unreachable: ' + (live.error || live.status);
    const cdx = await getJson('https://web.archive.org/cdx/search/cdx?url=designointeriors.com/*&output=json&fl=original,timestamp&filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey&limit=400');
    const pages = new Map();
    for (const row of (cdx || []).slice(1)) {
      const u = row[0].replace(/^http:/, 'https:').replace(/\?.*$/, '').replace(/\/+$/, '');
      if (/\.(pdf|jpe?g|png|gif|xml|txt)$/i.test(u) || /\/(m\/|cart|checkout|blog\/f\/)/.test(u)) continue;
      if (!pages.has(u) || pages.get(u) < row[1]) pages.set(u, row[1]);
    }
    if (!pages.size) pages.set('https://www.designointeriors.com', '2026');
    for (const [u] of [...pages].slice(0, 60)) { await visit(u, 'https://web.archive.org/web/2026id_/' + u, 'designointeriors.com'); await sleep(800); }
  }

  let n = 0;
  for (const e of images.values()) {
    n++;
    const name = String(n).padStart(3, '0') + '-' + slug(decodeURIComponent(e.base.split('/').pop()).replace(/\.[a-z0-9]+$/i, ''));
    let s = await saveImage(e.base + '/:/rs=w:360,cg:true,m', 'site', name);
    if (s.error) s = await saveImage('https://web.archive.org/web/2026im_/' + e.seen, 'site', name);
    result.images.push(Object.assign(e, { preview: s.file || null, error: s.error || undefined }));
  }
  return result;
}

/* ---------- 2. logos for named clients ---------- */
async function wikidata(q) {
  const s = await getJson('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=3&search=' + encodeURIComponent(q));
  const out = [];
  for (const hit of (s && s.search) || []) {
    const ent = await getJson('https://www.wikidata.org/wiki/Special:EntityData/' + hit.id + '.json');
    const e = ent && ent.entities && ent.entities[hit.id];
    if (!e) continue;
    const claim = (p) => ((e.claims || {})[p] || []).map((c) => c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value).filter(Boolean);
    out.push({ id: hit.id, label: hit.label, description: hit.description || '', logos: claim('P154'), websites: claim('P856'), enwiki: e.sitelinks && e.sitelinks.enwiki && e.sitelinks.enwiki.title });
    await sleep(300);
  }
  return out;
}

async function enwikiLogo(title) {
  const p = await getJson('https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&section=0&redirects=1&page=' + encodeURIComponent(title));
  const wt = p && p.parse && p.parse.wikitext && p.parse.wikitext['*'];
  if (!wt) return [];
  const files = [];
  wt.replace(/\|\s*(logo|image|seal|image_logo)\s*=\s*(?:\[\[)?(?:File:|Image:)?([^|\]\n{}]+?\.(?:svg|png|jpe?g|gif))/gi, (m, k, f) => { files.push(f.trim()); return m; });
  return files;
}

async function fileInfo(file, wiki) {
  const api = wiki === 'en' ? 'https://en.wikipedia.org/w/api.php' : 'https://commons.wikimedia.org/w/api.php';
  const j = await getJson(api + '?action=query&format=json&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=480&titles=' + encodeURIComponent('File:' + file));
  const page = j && j.query && Object.values(j.query.pages || {})[0];
  const ii = page && page.imageinfo && page.imageinfo[0];
  if (!ii) return null;
  const meta = ii.extmetadata || {};
  return { file, original: ii.url, thumb: ii.thumburl || ii.url, mime: ii.mime, license: meta.LicenseShortName && meta.LicenseShortName.value, nonfree: meta.NonFree ? meta.NonFree.value : undefined };
}

async function siteLogos(site) {
  const r = await getText(site);
  if (!r.ok || !r.text) return { site, error: r.error || ('HTTP ' + r.status) };
  const html = r.text, base = r.url, found = [];
  const add = (u, how) => { const a = abs(decode(u), base); if (a && !found.some((f) => f.url === a)) found.push({ url: a, how }); };
  html.replace(/<img\b[^>]*>/gi, (tag) => { if (/logo/i.test(tag)) { const src = attr(tag, 'src') || attr(tag, 'data-src') || (attr(tag, 'srcset').split(/\s+/)[0]); if (src && !/^data:/.test(src)) add(src, 'img[logo] alt="' + attr(tag, 'alt') + '"'); } return tag; });
  html.replace(/<link\b[^>]*>/gi, (tag) => { if (/rel\s*=\s*"[^"]*(apple-touch-icon|icon)/i.test(tag)) add(attr(tag, 'href'), 'link ' + attr(tag, 'rel') + ' ' + attr(tag, 'sizes')); return tag; });
  html.replace(/<meta\b[^>]*>/gi, (tag) => { if (/property\s*=\s*"og:image"/i.test(tag)) add(attr(tag, 'content'), 'og:image'); return tag; });
  const svgs = [];
  html.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svg) => { if (svgs.length < 2 && /logo/i.test(svg.slice(0, 400))) svgs.push(svg); return svg; });
  return { site, final: base, found: found.slice(0, 8), inlineSvg: svgs };
}

async function clientLogos() {
  const out = [];
  for (const c of CLIENTS) {
    const dir = 'clients/' + slug(c.name);
    const entry = { name: c.name, wikidata: [], files: [], sites: [] };
    const sites = new Set(c.sites);
    for (const q of c.q) {
      for (const w of await wikidata(q)) {
        entry.wikidata.push(w);
        w.websites.forEach((s) => sites.add(s));
        for (const f of w.logos) { const info = await fileInfo(f, 'commons'); if (info) { const s = await saveImage(info.thumb, dir, 'wd-' + w.id + '-' + f, { ua: UA }); const o = await saveImage(info.original, dir, 'wd-' + w.id + '-original-' + f, { ua: UA }); entry.files.push(Object.assign({ source: 'wikidata ' + w.id + ' P154', label: w.label, desc: w.description }, info, { preview: s.file, originalFile: o.file, error: s.error })); } }
        if (w.enwiki) for (const f of await enwikiLogo(w.enwiki)) { const info = (await fileInfo(f, 'en')); if (info) { const s = await saveImage(info.thumb, dir, 'enwiki-' + f, { ua: UA }); const o = await saveImage(info.original, dir, 'enwiki-original-' + f, { ua: UA }); entry.files.push(Object.assign({ source: 'enwiki infobox ' + w.enwiki }, info, { preview: s.file, originalFile: o.file, error: s.error })); } }
      }
    }
    let i = 0;
    for (const site of [...sites].slice(0, 4)) {
      const s = await siteLogos(site);
      entry.sites.push({ site, final: s.final, error: s.error, candidates: [] });
      const rec = entry.sites[entry.sites.length - 1];
      for (const f of s.found || []) { const saved = await saveImage(f.url, dir, 'site-' + (++i) + '-' + f.url.split('/').pop().split('?')[0], {}); rec.candidates.push(Object.assign(f, saved)); }
      (s.inlineSvg || []).forEach((svg, k) => { const rel = path.posix.join(dir, 'site-inline-' + (++i) + '.svg'); fs.mkdirSync(path.join(OUT, dir), { recursive: true }); fs.writeFileSync(path.join(OUT, rel), svg.includes('xmlns') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); rec.candidates.push({ how: 'inline svg', file: rel }); });
    }
    out.push(entry);
    console.log(c.name + ': ' + entry.files.length + ' wiki file(s), ' + entry.sites.reduce((n, s) => n + s.candidates.filter((x) => x.file).length, 0) + ' website candidate(s)');
  }
  return out;
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const site = await crawlSite();
  console.log('Old site (' + site.source + '): ' + site.pages.length + ' page(s), ' + site.images.length + ' image(s)');
  const clients = await clientLogos();
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ generated: new Date().toISOString(), site, clients }, null, 2) + '\n');
})().catch((e) => { console.error(e); process.exit(1); });
