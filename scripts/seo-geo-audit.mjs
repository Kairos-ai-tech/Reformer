#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const live = args.includes('--live');
const write = args.includes('--write');
const kw = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo/keywords.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const CJK = /[぀-ヿ㐀-鿿가-힯＀-￯]/;
const width = (s) => [...s].reduce((n, c) => n + (CJK.test(c) ? 2 : 1), 0);
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const strip = (s) =>
  decode(
    s
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
const count = (hay, needle) => hay.toLowerCase().split(needle.toLowerCase()).length - 1;

async function load(rel) {
  if (live) {
    try {
      const res = await fetch(kw.site + rel, { signal: AbortSignal.timeout(20000) });
      return { status: res.status, text: res.ok ? await res.text() : '' };
    } catch {
      return { status: 0, text: '' };
    }
  }
  const file = rel.endsWith('/') ? rel + 'index.html' : rel;
  const p = path.join(ROOT, file);
  return fs.existsSync(p)
    ? { status: 200, text: fs.readFileSync(p, 'utf8') }
    : { status: 404, text: '' };
}

function jsonLd(html) {
  const out = [];
  let valid = true;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      valid = false;
    }
  }
  return { blocks: out, valid };
}

async function auditLocale(code, cfg) {
  const { status, text } = await load(cfg.path);
  const issues = [];
  const suggestions = [];
  if (status !== 200) {
    issues.push(`page returned ${status}`);
    return { code, status, issues, suggestions };
  }
  const title = decode((/<title>([^<]*)<\/title>/.exec(text) || [])[1] || '');
  const description = decode(
    (/<meta name="description" content="([^"]*)"/.exec(text) || [])[1] || '',
  );
  const h1 = strip((/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(text) || [])[1] || '');
  const body = strip(text.slice(Math.max(text.indexOf('<body'), 0)));
  const ld = jsonLd(text);
  const faq = ld.blocks.find((b) => b['@type'] === 'FAQPage');
  const org = ld.blocks.find((b) => b['@type'] === 'ProfessionalService');
  const faqQs = faq ? faq.mainEntity.map((q) => q.name) : [];
  if (!title) issues.push('missing <title>');
  if (!description) issues.push('missing meta description');
  if (width(title) > 70)
    suggestions.push(
      `title is ${width(title)} wide (over 70), search may cut it; keep the primary keyword first`,
    );
  if (description && (width(description) > 320 || width(description) < 100))
    suggestions.push(`description width ${width(description)} is outside 100-320`);
  if (!/<link rel="canonical"/.test(text)) issues.push('missing canonical');
  if ((text.match(/hreflang=/g) || []).length < 5) issues.push('hreflang block incomplete');
  if (!ld.valid) issues.push('a JSON-LD block does not parse');
  if (!faq) issues.push('no FAQPage JSON-LD');
  if (!org || !org.knowsAbout || org.knowsAbout.length < 5)
    issues.push('ProfessionalService.knowsAbout missing or short');
  const keywords = {};
  for (const term of [...cfg.primary, ...cfg.secondary]) {
    const row = {
      title: count(title, term),
      description: count(description, term),
      h1: count(h1, term),
      body: count(body, term),
    };
    keywords[term] = row;
  }
  for (const term of cfg.primary) {
    const k = keywords[term];
    if (!k.title && !k.description)
      suggestions.push(`primary keyword "${term}" is in neither title nor description`);
    if (!k.body) issues.push(`primary keyword "${term}" never appears in the page body`);
  }
  for (const term of cfg.secondary)
    if (!keywords[term].body)
      suggestions.push(`secondary keyword "${term}" never appears in the page body`);
  const questions = cfg.questions.map((x) => ({
    q: x.q,
    covered: faqQs.some((f) => f.includes(x.match)),
  }));
  for (const x of questions)
    if (!x.covered) suggestions.push(`GEO question not answered in the FAQ: "${x.q}"`);
  return {
    code,
    status,
    title,
    description,
    titleWidth: width(title),
    descriptionWidth: width(description),
    h1,
    faqCount: faqQs.length,
    keywords,
    questions,
    issues,
    suggestions,
  };
}

async function auditSite() {
  const issues = [];
  const robots = await load('/robots.txt');
  if (robots.status !== 200 || !/Sitemap:/i.test(robots.text))
    issues.push('robots.txt missing or has no Sitemap line');
  const sitemap = await load('/sitemap.xml');
  if (sitemap.status !== 200) issues.push('sitemap.xml missing');
  else {
    for (const cfg of Object.values(kw.locales)) {
      if (!sitemap.text.includes(`<loc>${kw.site}${cfg.path}</loc>`))
        issues.push(`sitemap.xml has no entry for ${cfg.path}`);
    }
    const dates = [...sitemap.text.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)]
      .map((m) => m[1])
      .sort();
    const newest = dates[dates.length - 1];
    if (newest && (Date.parse(today) - Date.parse(newest)) / 864e5 > 60)
      issues.push(`sitemap lastmod is ${newest}, older than 60 days`);
  }
  const og = await load('/og-image.png');
  if (og.status !== 200) issues.push('og-image.png missing');
  return issues;
}

const locales = [];
for (const [code, cfg] of Object.entries(kw.locales)) locales.push(await auditLocale(code, cfg));
const siteIssues = await auditSite();
const report = { date: today, mode: live ? 'live' : 'local', siteIssues, locales };

const dir = path.join(ROOT, 'seo/reports');
fs.mkdirSync(dir, { recursive: true });
const prevFile = fs
  .readdirSync(dir)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f !== `${today}.json`)
  .filter((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).mode === report.mode)
  .sort()
  .pop();
const prev = prevFile ? JSON.parse(fs.readFileSync(path.join(dir, prevFile), 'utf8')) : null;
const flat = (r) =>
  new Set([
    ...r.siteIssues.map((i) => `site: ${i}`),
    ...r.locales.flatMap((l) => [...l.issues, ...l.suggestions].map((i) => `${l.code}: ${i}`)),
  ]);
const now = flat(report);
const before = prev ? flat(prev) : new Set();
report.newSince = prev ? [...now].filter((x) => !before.has(x)) : [];
report.resolvedSince = prev ? [...before].filter((x) => !now.has(x)) : [];
report.comparedTo = prevFile || null;

console.log(
  `SEO/GEO audit ${today} (${report.mode})${prevFile ? `, compared with ${prevFile}` : ''}`,
);
for (const i of siteIssues) console.log(`  site issue: ${i}`);
for (const l of locales) {
  console.log(
    `${l.code}: status ${l.status}, title ${l.titleWidth ?? '-'}w, description ${l.descriptionWidth ?? '-'}w, FAQ ${l.faqCount ?? '-'}`,
  );
  for (const i of l.issues) console.log(`  issue: ${i}`);
  for (const s of l.suggestions) console.log(`  suggest: ${s}`);
}
if (prev) {
  console.log(
    `new since ${prevFile}: ${report.newSince.length}, resolved: ${report.resolvedSince.length}`,
  );
  for (const x of report.newSince) console.log(`  + ${x}`);
}
const down = locales.every((l) => l.status !== 200);
if (down) console.log('every page failed to load, nothing to report');
if (write && down) process.exitCode = 1;
if (write && !down) {
  fs.writeFileSync(path.join(dir, `${today}.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(`wrote seo/reports/${today}.json`);
}
