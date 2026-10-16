#!/usr/bin/env node
/*
  Copies every image and PDF that content/ hot-links from another site into media/, and points
  the content at the copy.

  Run by .github/workflows/import-media.yml. Why it matters:
    - Pages CMS refuses to save an image or file field that doesn't start with "media/", so
      entries holding a GoDaddy URL show broken previews and fail validation on save.
    - The GoDaddy URLs (img1.wsimg.com) stop working once the Website Builder plan is cancelled.

  Usage: node scripts/import-remote-media.js [extra.host.com …]
*/
const fs = require('fs');
const path = require('path');
const { ROOT, fetchFile, save } = require('./lib/media');

const HOSTS = ['img1.wsimg.com', 'i.vimeocdn.com'].concat(process.argv.slice(2));
const URL_RE = /https?:\/\/[^\s"'<>()]+/g;

const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? files(path.join(dir, d.name)) : d.name.endsWith('.json') ? [path.join(dir, d.name)] : []);
const isRemote = (u) => { try { return HOSTS.includes(new URL(u).hostname); } catch (e) { return false; } };

// content/projects/laerdal.json → media/projects/laerdal/, content/settings/site.json → media/site/
const folderFor = (file) => path.relative(path.join(ROOT, 'content'), file).replace(/\.json$/, '').split(path.sep).join('/').replace(/^settings\//, '');

async function main() {
  // Each entry gets its own copy, so deleting one entry's photos in the admin never breaks another
  // entry that used the same GoDaddy image. Each URL is still downloaded only once.
  const fetched = new Map();  // url → Promise of the downloaded file
  const failed = new Map();   // url → { file, url, error }
  let copied = 0, changedFiles = 0;

  for (const file of files(path.join(ROOT, 'content')).sort()) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const dir = folderFor(file);
    let changed = false;

    const localise = async (s, key) => {
      let out = s;
      for (const url of new Set(s.match(URL_RE) || [])) {
        if (!isRemote(url)) continue;
        if (!fetched.has(url)) fetched.set(url, fetchFile(url));
        let local;
        try { const f = await fetched.get(url); local = save(f, dir, /[0-9a-f]{16}/.test(f.name) ? key : f.name); }
        catch (e) { if (!failed.has(url)) failed.set(url, { file: path.relative(ROOT, file), url, error: e.message }); continue; }
        console.log('saved   ' + local + '  ←  ' + url);
        out = out.split(url).join(local); changed = true; copied++;
      }
      return out;
    };
    // key is the field name, used to name a file whose URL is only a hash (e.g. the Vimeo poster).
    const walk = async (v, key) => {
      if (typeof v === 'string') return localise(v, key);
      if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = await walk(v[i], key); return v; }
      if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = await walk(v[k], k); return v; }
      return v;
    };

    const result = await walk(data);
    if (changed) { fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n'); changedFiles++; }
  }

  console.log('\n' + copied + ' file(s) copied into media/, ' + changedFiles + ' content file(s) updated.');
  for (const f of failed.values()) console.log('::warning file=' + f.file + '::Could not copy ' + f.url + ' (' + f.error + '). The remote link was left in place.');

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = ['## Media import', '', copied + ' file(s) copied into `media/`, ' + changedFiles + ' content file(s) updated.'];
    if (failed.size) lines.push('', '### Not copied — the remote link was left in place', '', '| Content file | URL | Error |', '| --- | --- | --- |', ...[...failed.values()].map((f) => '| ' + f.file + ' | ' + f.url + ' | ' + f.error + ' |'));
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
