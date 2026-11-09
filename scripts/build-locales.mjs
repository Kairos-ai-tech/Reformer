#!/usr/bin/env node
// Pre-renders /en/, /ja/ and /ko/ from index.html (the Traditional Chinese source of truth).
//
//   node scripts/build-locales.mjs          # (re)write en/index.html, ja/index.html, ko/index.html
//   node scripts/build-locales.mjs --check  # exit 1 if those files are stale, or if the zh FAQ JSON-LD
//                                           # no longer matches the visible FAQ text
//
// No dependencies (Node 18+). Visible copy comes from the I18N_ALL / I18N_PH / I18N_ARIA tables already in
// index.html, so editing a string there and re-running this script keeps every language page in sync.
// Only the <head> metadata below (title, description, link-preview text, JSON-LD wording) lives here.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://reform.kairosaitech.com/';
const LANGS = ['en', 'ja', 'ko'];
const OG_LOCALE = { zh: 'zh_TW', en: 'en_US', ja: 'ja_JP', ko: 'ko_KR' };
const HTML_LANG = { en: 'en', ja: 'ja', ko: 'ko' };

// Head metadata per language. Keep claims identical to the visible page (no new numbers or prices).
const META = {
  en: {
    title: 'Website Redesign for Taiwan SMBs | SEO + GEO – Kairos.ai',
    description: 'Kairos.ai handles website redesign and new website design for Taiwanese small businesses, and improves their visibility in Google search (SEO) and AI search (GEO, generative engine optimization). Free website health check; Quick Site live in 14 days; you own the finished site 100%.',
    ogDescription: 'Your customers are searching for you, but finding someone else. Free website health check, Quick Site live in 14 days, at half the market price.',
    ogImageAlt: 'Kairos.ai — hourglass and wave logo',
    orgDescription: 'Website redesign and new website design for Taiwanese small businesses, with SEO and AI search (GEO, generative engine optimization) visibility. The client owns the finished site 100%.',
    priceRange: 'From NT$59,800',
    catalogName: 'Website rebuild plans',
    knowsAbout: ['Website redesign', 'Business website design', 'Web design', 'SEO', 'GEO', 'Generative engine optimization', 'AI search optimization', 'LEO', 'Local search optimization'],
    join: '; ',
  },
  ja: {
    title: '台湾中小企業のサイトリニューアル|SEO × GEO(AI 検索)対策 – 優時科技',
    description: '優時科技 Kairos.ai は、台湾の中小企業のサイトリニューアルと新規サイト制作を行い、Google 検索(SEO)と AI 検索(GEO、生成エンジン最適化)での見つかりやすさを高めます。無料サイト診断、クイックサイトは 14 日で公開。完成したサイトは 100% お客様のもの。',
    ogDescription: 'お客様は今、あなたを探しています。でも見つかるのは他社のサイトです。無料サイト診断、クイックサイトは 14 日で公開、相場の半額。',
    ogImageAlt: '優時科技 Kairos.ai — 砂時計と波のロゴ',
    orgDescription: '台湾の中小企業向けに、サイトリニューアルと新規サイト制作、SEO・AI 検索(GEO、生成エンジン最適化)対策を提供します。完成したサイトは 100% お客様のものです。',
    priceRange: 'NT$59,800〜',
    catalogName: 'サイト再構築プラン',
    knowsAbout: ['サイトリニューアル', '企業サイト制作', 'Web デザイン', 'SEO', 'GEO', '生成エンジン最適化', 'AI 検索対策', 'LEO', 'ローカル検索対策'],
    join: '、',
  },
  ko: {
    title: '대만 중소기업 홈페이지 리뉴얼 | SEO × GEO(AI 검색) 최적화 – 優時科技',
    description: '優時科技 Kairos.ai는 대만 중소기업의 홈페이지 리뉴얼과 신규 제작을 맡고 Google 검색(SEO)과 AI 검색(GEO, 생성형 엔진 최적화) 노출을 높입니다. 무료 홈페이지 진단, 빠른 홈페이지 14일 만에 오픈. 완성된 홈페이지는 100% 고객님의 것.',
    ogDescription: '손님은 지금 당신을 검색하고 있는데, 찾아가는 곳은 다른 가게입니다. 무료 홈페이지 진단, 빠른 홈페이지 14일 만에 오픈, 시세의 절반 가격.',
    ogImageAlt: '優時科技 Kairos.ai — 모래시계와 파도 로고',
    orgDescription: '대만 중소기업을 위한 홈페이지 리뉴얼·신규 제작과 SEO·AI 검색(GEO, 생성형 엔진 최적화). 완성된 홈페이지는 100% 고객님의 것입니다.',
    priceRange: 'NT$59,800부터',
    catalogName: '홈페이지 재구축 플랜',
    knowsAbout: ['홈페이지 리뉴얼', '기업 홈페이지 제작', '웹 디자인', 'SEO', 'GEO', '생성형 엔진 최적화', 'AI 검색 최적화', 'LEO', '지역 검색 최적화'],
    join: ', ',
  },
};

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function slice(src, start, end) {
  const a = src.indexOf(start);
  const b = src.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`cannot find ${start} … ${end} in index.html`);
  return src.slice(a, b);
}

function loadTables(src) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(slice(src, 'var I18N_ALL=', '\nvar DYN='), ctx);
  vm.runInContext(slice(src, 'var MARKETS=', '\nfunction tr('), ctx);
  vm.runInContext(slice(src, 'var I18N_PH=', '\n  var I18N_ARIA='), ctx);
  vm.runInContext(slice(src, 'var I18N_ARIA=', '\n\n  var i18nEls='), ctx);
  return ctx;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripTags = (h) => String(h).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// Split into [kind, text] chunks so we never touch <script>/<style> bodies or comments.
function chunks(html) {
  const out = [];
  const re = /<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi;
  let last = 0, m;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push(['markup', html.slice(last, m.index)]);
    out.push([m[0].startsWith('<!--') ? 'comment' : m[0].slice(0, 6).toLowerCase() === '<style' ? 'style' : 'script', m[0]]);
    last = re.lastIndex;
  }
  out.push(['markup', html.slice(last)]);
  return out;
}

// Replace the inner HTML of every [data-i18n] element, mirroring applyLang()/staticText() in index.html.
function translateMarkup(html, text, attrFix) {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let out = '', pos = 0, m;
  while ((m = tagRe.exec(html))) {
    const [whole, close, name, attrs] = m;
    out += html.slice(pos, m.index);
    pos = tagRe.lastIndex;
    if (close) { out += whole; continue; }
    const open = attrFix(whole);
    const key = /\sdata-i18n="([^"]+)"/.exec(attrs);
    if (!key || VOID.has(name.toLowerCase())) { out += open; continue; }
    // find the matching close tag
    const inner = new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi');
    inner.lastIndex = pos;
    let depth = 1, mm, end = -1;
    while ((mm = inner.exec(html))) {
      if (mm[1]) { if (--depth === 0) { end = mm.index; break; } } else if (!/\/>$/.test(mm[0])) depth++;
    }
    if (end < 0) throw new Error(`unclosed <${name} data-i18n="${key[1]}">`);
    const orig = html.slice(pos, end);
    const val = text(key[1]);
    out += open + (val === undefined ? orig : val) + `</${name}>`;
    pos = end + `</${name}>`.length;
    tagRe.lastIndex = pos;
  }
  return out + html.slice(pos);
}

function relUrl(u) { return !/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(u); }

function render(src, lang, ctx) {
  ctx.window.CURRENT_LANG = lang;
  const I = ctx.I18N_ALL;
  const t = (k) => (I[lang][k] !== undefined ? ctx.expandMoney(I[lang][k]) : I.en[k] !== undefined ? ctx.expandMoney(I.en[k]) : undefined);
  const M = META[lang];
  const url = `${SITE}${lang}/`;

  const attrFix = (tag) => {
    tag = tag.replace(/\s(src|href)="([^"]*)"/g, (all, a, u) => (relUrl(u) ? ` ${a}="../${u}"` : all));
    tag = tag.replace(/\sdata-i18n-ph="([^"]+)"([^>]*?)\splaceholder="[^"]*"/, (all, k, mid) =>
      ctx.I18N_PH[lang] && ctx.I18N_PH[lang][k] !== undefined ? ` data-i18n-ph="${k}"${mid} placeholder="${esc(ctx.I18N_PH[lang][k])}"` : all);
    tag = tag.replace(/\sdata-i18n-aria="([^"]+)"([^>]*?)\saria-label="[^"]*"/, (all, k, mid) =>
      ctx.I18N_ARIA[lang] && ctx.I18N_ARIA[lang][k] !== undefined ? ` data-i18n-aria="${k}"${mid} aria-label="${esc(ctx.I18N_ARIA[lang][k])}"` : all);
    if (/^<option value="/.test(tag)) tag = tag.replace(/\sselected(?=[\s>])/, '');
    if (tag === `<option value="${lang}">`) tag = `<option value="${lang}" selected>`;
    return tag;
  };

  let html = chunks(src).map(([kind, text]) => {
    if (kind === 'markup') return translateMarkup(text, t, attrFix);
    if (kind === 'style') return text.replace(/url\(([^)'"]+)\)/g, (all, u) => (relUrl(u) ? `url(../${u})` : all));
    if (kind === 'script') return text.replace(/^<script\b[^>]*>/i, (open) => attrFix(open)).replace("window.ASSET_BASE='';", "window.ASSET_BASE='../';");
    return text;
  }).join('');

  const set = (re, val, label) => {
    if (!re.test(html)) throw new Error(`head field not found: ${label}`);
    html = html.replace(re, val);
  };
  set(/<html lang="[^"]*" data-page-lang="[^"]*">/, `<html lang="${HTML_LANG[lang]}" data-page-lang="${lang}">`, 'html');
  set(/<title>[^<]*<\/title>/, `<title>${esc(M.title)}</title>`, 'title');
  set(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(M.description)}">`, 'description');
  set(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
  set(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(M.title)}">`, 'og:title');
  set(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(M.ogDescription)}">`, 'og:description');
  set(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, 'og:url');
  set(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${esc(M.ogImageAlt)}">`, 'og:image:alt');
  set(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(M.title)}">`, 'twitter:title');
  set(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(M.ogDescription)}">`, 'twitter:description');
  set(/<meta property="og:locale" content="[^"]*">(\n<meta property="og:locale:alternate" content="[^"]*">)*/,
    [`<meta property="og:locale" content="${OG_LOCALE[lang]}">`, ...Object.keys(OG_LOCALE).filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`)].join('\n'), 'og:locale');

  // JSON-LD: same structure as the zh page, with wording taken from the visible translated copy.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 2) throw new Error('expected 2 JSON-LD blocks');
  const biz = JSON.parse(blocks[0][1]);
  const plain = (k) => stripTags(t(k));
  const plan = (n, items) => items.map((i) => plain(`price${n}-li${i}`)).join(M.join);
  biz.description = M.orgDescription;
  biz.url = url;
  biz.priceRange = M.priceRange;
  biz.knowsAbout = M.knowsAbout;
  biz.hasOfferCatalog.name = M.catalogName;
  const offers = biz.hasOfferCatalog.itemListElement;
  [[1, [1, 2, 3]], [2, [1, 2, 3, 4, 5]], [3, [1, 2, 3, 4, 5]]].forEach(([n, items], i) => {
    offers[i].itemOffered.name = plain(`price${n}-h3`);
    offers[i].itemOffered.description = plan(n, items);
  });
  const faq = JSON.parse(blocks[1][1]);
  faq.mainEntity.forEach((q, i) => {
    q.name = plain(`faq${i + 1}-q`);
    q.acceptedAnswer.text = plain(`faq${i + 1}-a`);
  });
  html = html.replace(blocks[0][0], `<script type="application/ld+json">\n${JSON.stringify(biz, null, 2)}\n</script>`)
             .replace(blocks[1][0], `<script type="application/ld+json">\n${JSON.stringify(faq, null, 2)}\n</script>`);
  return html.replace(/^<!DOCTYPE html>\n/i, (d) => `${d}<!-- GENERATED by scripts/build-locales.mjs from index.html. Do not edit by hand. -->\n`);
}

// The zh page keeps hand-written JSON-LD; make sure its FAQ still matches the visible FAQ.
function checkZhFaq(src) {
  const faq = JSON.parse([...src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)][1][1]);
  const problems = [];
  faq.mainEntity.forEach((q, i) => {
    const vq = new RegExp(`<summary data-i18n="faq${i + 1}-q">([\\s\\S]*?)</summary>`).exec(src);
    const va = new RegExp(`<p data-i18n="faq${i + 1}-a">([\\s\\S]*?)</p>`).exec(src);
    if (!vq || stripTags(vq[1]) !== q.name) problems.push(`faq${i + 1}-q differs from FAQPage JSON-LD`);
    if (!va || stripTags(va[1]) !== q.acceptedAnswer.text) problems.push(`faq${i + 1}-a differs from FAQPage JSON-LD`);
  });
  return problems;
}

const check = process.argv.includes('--check');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ctx = loadTables(src);
let stale = checkZhFaq(src);
for (const lang of LANGS) {
  const file = path.join(ROOT, lang, 'index.html');
  const out = render(src, lang, ctx);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) stale.push(`${lang}/index.html is stale`);
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, out);
    console.log(`wrote ${lang}/index.html (${out.length} chars)`);
  }
}
if (stale.length) {
  console.error(stale.join('\n') + (check ? '\nRun: node scripts/build-locales.mjs' : ''));
  process.exit(1);
}
if (check) console.log('locale pages up to date; zh FAQ JSON-LD matches visible FAQ');
