#!/usr/bin/env node
/*
  Writes one Journal post to content/journal/<slug>.json, in the same shape Pages CMS saves.

  Run by .github/workflows/publish-post.yml, which commits the result. The post comes from the
  POST environment variable (JSON) or a JSON file given as the first argument:

    {
      "title":    "Required",
      "category": "Workplace | Vastu | Sustainability | Technology | News",
      "date":     "2026-10-16 (optional, defaults to today in India)",
      "excerpt":  "One sentence (optional, taken from the first paragraph if left out)",
      "body":     "Markdown or HTML",
      "cover":    "https://… image to download, or a /media/… path already in the repo (optional)",
      "slug":     "page-address (optional, made from the title if left out)",
      "replace":  false   (true to overwrite a post that already has this slug)
    }

  Remote images (the cover and any <img> in the body) are downloaded into media/journal/<slug>/
  so the post never depends on another site.
*/
const fs = require('fs');
const path = require('path');
const { ROOT, slugify, download } = require('./lib/media');

const FALLBACK_CATEGORIES = ['Workplace', 'Vastu', 'Sustainability', 'Technology', 'News'];

// Reads the category list from .pages.yml so a category added in the admin config is accepted here too.
function categories() {
  try {
    const yml = fs.readFileSync(path.join(ROOT, '.pages.yml'), 'utf8');
    const m = /name:\s*journal[\s\S]*?name:\s*category[\s\S]*?values:\s*\[([^\]]*)\]/.exec(yml);
    const list = m ? m[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : [];
    return list.length ? list : FALLBACK_CATEGORIES;
  } catch (e) { return FALLBACK_CATEGORIES; }
}

const truthy = (v) => v === true || /^(true|yes|1)$/i.test(String(v || '').trim());
const stripTags = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

async function toHtml(body) {
  body = String(body || '').trim();
  if (!body) return '';
  if (/^\s*<(p|h[1-6]|ul|ol|div|figure|blockquote|section|img|table)\b/i.test(body)) return body;
  try {
    const { marked } = await import('marked');
    return marked.parse(body, { gfm: true, breaks: false }).trim();
  } catch (e) {
    console.log('::warning::The "marked" package is not installed, so the body was treated as plain paragraphs.');
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return body.split(/\n\s*\n/).map((p) => '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>').join('\n');
  }
}

// The page already has the title as its <h1>: drop a leading heading that repeats it and
// demote any other <h1>. Also removes scripts and inline event handlers.
function tidy(html, title) {
  html = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
  const first = /^\s*<h1[^>]*>([\s\S]*?)<\/h1>\s*/i.exec(html);
  if (first && stripTags(first[1]).toLowerCase() === String(title).trim().toLowerCase()) html = html.slice(first[0].length);
  return html.replace(/<(\/?)h1\b/gi, '<$1h2').trim();
}

function excerptFrom(html) {
  const p = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(html);
  const text = stripTags(p ? p[1] : html);
  if (text.length <= 180) return text;
  const cut = text.slice(0, 180);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '') + '…';
}

async function localImages(html, dir) {
  const srcs = new Set();
  html.replace(/<img\b[^>]*?\ssrc\s*=\s*(["'])(https?:\/\/[^"']+)\1/gi, (m, q, src) => { srcs.add(src); return m; });
  let i = 0;
  for (const src of srcs) {
    const local = await download(src.replace(/&amp;/g, '&'), dir, 'image-' + String(++i).padStart(2, '0'))
      .catch((e) => { throw new Error('Could not download body image ' + src + ': ' + e.message); });
    html = html.split(src).join(local);
  }
  return html;
}

async function main() {
  const raw = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : process.env.POST;
  if (!raw) throw new Error('No post given. Set POST to a JSON object or pass a JSON file.');
  const input = JSON.parse(raw);
  const s = (k) => (input[k] == null ? '' : String(input[k])).trim();

  const title = s('title');
  if (!title) throw new Error('"title" is required.');

  const cats = categories();
  const category = cats.find((c) => c.toLowerCase() === s('category').toLowerCase());
  if (!category) throw new Error('"category" must be one of: ' + cats.join(', ') + ' (got "' + s('category') + '").');

  const date = s('date') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) throw new Error('"date" must look like 2026-10-16 (got "' + date + '").');

  const slug = slugify(s('slug') || title);
  if (!slug) throw new Error('Could not make a page address from the title. Pass "slug".');
  const file = path.join(ROOT, 'content/journal', slug + '.json');
  if (fs.existsSync(file) && !truthy(input.replace)) throw new Error('A post called "' + slug + '" already exists. Pass a different "slug", or "replace": true to overwrite it.');

  const media = 'journal/' + slug;
  let body = tidy(await toHtml(input.body), title);
  body = await localImages(body, media);
  const excerpt = s('excerpt') || excerptFrom(body);
  if (!excerpt) throw new Error('"excerpt" is required when the body is empty.');

  let cover = s('cover');
  if (/^https?:\/\//i.test(cover)) cover = await download(cover, media, 'cover').catch((e) => { throw new Error('Could not download the cover image: ' + e.message); });
  else if (cover) {
    cover = '/' + cover.replace(/^\/+/, '');
    if (!cover.startsWith('/media/') || !fs.existsSync(path.join(ROOT, cover))) throw new Error('"cover" must be an https:// image link or a file already in media/ (got "' + s('cover') + '").');
  }

  const post = { title, category, date };
  if (cover) post.cover = cover;
  Object.assign(post, { excerpt, body, hidden: false });
  fs.writeFileSync(file, JSON.stringify(post, null, 2) + '\n');

  const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/settings/site.json'), 'utf8'));
  const url = (site.url || 'https://designointeriors.com').replace(/\/$/, '') + '/journal/' + slug + '/';
  console.log('Wrote content/journal/' + slug + '.json → ' + url);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'slug=' + slug + '\nurl=' + url + '\n');
}

main().catch((e) => { console.error('::error::' + e.message); process.exit(1); });
