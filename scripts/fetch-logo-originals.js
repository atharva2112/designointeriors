#!/usr/bin/env node
/* TEMPORARY: downloads the full-size originals listed in scratch/logos/wanted.json into
   scratch/logos/hires/, and re-reads the old /clientele page (rate-limited on the first pass). */
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(__dirname, '../scratch/logos');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { 'image/webp': 'webp', 'image/avif': 'avif', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

async function get(url, accept) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: accept || '*/*' }, signal: AbortSignal.timeout(30000) });
      if (res.status === 429) { await sleep(5000 * attempt); continue; }
      return { ok: res.ok, status: res.status, type: (res.headers.get('content-type') || '').split(';')[0], buf: Buffer.from(await res.arrayBuffer()) };
    } catch (e) { if (attempt === 5) return { ok: false, status: 0, error: e.message }; await sleep(3000); }
  }
  return { ok: false, status: 429 };
}

(async () => {
  const out = { originals: [], clientele: null };
  fs.mkdirSync(path.join(DIR, 'hires'), { recursive: true });
  // Original upload first (keeps transparency); fall back to a large WebP rendition.
  for (const [name, url] of JSON.parse(fs.readFileSync(path.join(DIR, 'wanted.json'), 'utf8'))) {
    for (const [variant, u, accept] of [['original', url, 'image/png,image/svg+xml,image/*;q=0.8'], ['w1000', url + '/:/rs=w:1000', 'image/png,image/*;q=0.8']]) {
      const r = await get(u, accept);
      const ext = TYPES[r.type];
      const rec = { name, variant, url: u, status: r.status, type: r.type, bytes: r.buf ? r.buf.length : 0 };
      if (r.ok && ext) { rec.file = 'hires/' + name + '-' + variant + '.' + ext; fs.writeFileSync(path.join(DIR, rec.file), r.buf); }
      out.originals.push(rec);
      await sleep(700);
    }
  }
  // The clientele page, in case it shows logos the homepage doesn't.
  await sleep(10000);
  const page = await get('https://www.designointeriors.com/clientele', 'text/html');
  if (page.ok) {
    const html = page.buf.toString('utf8').replace(/\\u002F/gi, '/');
    fs.writeFileSync(path.join(DIR, 'clientele.html'), html);
    const urls = [...new Set((html.match(/(?:https?:)?\/\/img1\.wsimg\.com\/isteam\/ip\/[^"'\s)\\<>,]+/g) || []).map((u) => (u.startsWith('//') ? 'https:' + u : u).split('/:/')[0]))];
    out.clientele = { status: page.status, images: [] };
    let i = 0;
    for (const u of urls) {
      const r = await get(u + '/:/rs=w:360', 'image/webp,image/*');
      const rec = { url: u, status: r.status };
      if (r.ok && TYPES[r.type]) { rec.file = 'clientele/' + String(++i).padStart(3, '0') + '-' + decodeURIComponent(u.split('/').pop()).replace(/[^a-z0-9.]+/gi, '-').slice(0, 50) + '.' + TYPES[r.type]; fs.mkdirSync(path.join(DIR, 'clientele'), { recursive: true }); fs.writeFileSync(path.join(DIR, rec.file), r.buf); }
      out.clientele.images.push(rec);
      await sleep(500);
    }
  } else out.clientele = { status: page.status, error: page.error };
  fs.writeFileSync(path.join(DIR, 'hires.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(out.originals.filter((o) => o.file).length + ' file(s) saved; clientele page: ' + out.clientele.status + ', ' + ((out.clientele.images || []).length) + ' image(s)');
})().catch((e) => { console.error(e); process.exit(1); });
