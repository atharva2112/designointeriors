/*
  Shared helpers for the content scripts.

  Pages CMS only accepts image and file fields whose path starts with the media folder, and
  the live site should never depend on another host staying up. download() copies a remote
  image or PDF into media/ and returns the path to store in content ("/media/…").
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../..');
const TYPES = { 'image/webp': 'webp', 'image/avif': 'avif', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'application/pdf': 'pdf' };
const EXTS = ['webp', 'avif', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf'];

const slugify = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');

// "…/Sunlit%20window-side%20office-2.png/:/rs=w:1800,cg:true,m" → { name: "sunlit-window-side-office-2", ext: "png" }
// GoDaddy appends its resize options after "/:/", so everything from there on is ignored.
// A "#name" fragment, if present, names the file instead (stock photo links carry no useful name).
function nameFromUrl(url) {
  let p = '', hash = '';
  try { const u = new URL(url); p = u.pathname; hash = slugify(decodeURIComponent(u.hash.slice(1))); } catch (e) { return { name: 'file', ext: '' }; }
  p = p.split('/:/')[0].replace(/\/+$/, '');
  let last = p.slice(p.lastIndexOf('/') + 1);
  try { last = decodeURIComponent(last); } catch (e) { /* keep it encoded */ }
  const m = /\.([a-z0-9]{2,4})$/i.exec(last);
  const ext = m && EXTS.includes(m[1].toLowerCase()) ? m[1].toLowerCase().replace('jpeg', 'jpg') : '';
  return { name: hash || slugify(m ? last.slice(0, -m[0].length) : last) || 'file', ext: ext };
}

const sha = (buf) => crypto.createHash('sha1').update(buf).digest('hex');

// Fetches url, preferring WebP, which GoDaddy and most CDNs serve far smaller than the PNG originals.
async function fetchFile(url) {
  const res = await fetch(url, { redirect: 'follow', headers: { accept: 'image/webp,image/avif,image/*;q=0.9,application/pdf;q=0.8,*/*;q=0.5', 'user-agent': 'Mozilla/5.0 (designointeriors media import)' } });
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const guess = nameFromUrl(url);
  const ext = TYPES[type] || guess.ext;
  if (!ext) throw new Error('not an image or PDF (' + (type || 'no content type') + ')');
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error('empty file');
  return { buf: buf, ext: ext, name: guess.name };
}

// Writes media/<dir>/<name>.<ext> (adding -2, -3 … if a different file has that name) and returns "/media/…".
function save(file, dir, name) {
  const base = slugify(name || file.name) || 'file';
  for (let n = 1; ; n++) {
    const rel = path.posix.join('media', dir, (n === 1 ? base : base + '-' + n) + '.' + file.ext);
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs) && sha(fs.readFileSync(abs)) !== sha(file.buf)) continue;
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, file.buf);
    return '/' + rel;
  }
}

const download = async (url, dir, name) => save(await fetchFile(url), dir, name);

module.exports = { ROOT, slugify, nameFromUrl, fetchFile, save, download };
