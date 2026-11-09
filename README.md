# 優時數位改造 — Product Page

Static product page for 優時科技 (Kairos.ai) web rebuild + SEO/GEO services. `index.html` plus a small motion layer (`motion.js` and vendored libraries in `vendor/`) — no build step, and no script CDN: every JS library, including html2pdf for the PDF report, is served from `vendor/`. The only third-party requests are the Google Fonts stylesheet and, once a real GA4 ID is set, Google Analytics.

The English, Japanese and Korean pages (`en/`, `ja/`, `ko/`) are generated from `index.html`; see **Languages** below.

## Deploy to GitHub Pages (about 2 minutes)

1. Create a new **public** repository on GitHub (e.g. `kairos-web`). To publish at `https://<username>.github.io/` directly, name it `<username>.github.io` instead.
2. Upload `index.html` (and this README) to the repository root — via git push, or GitHub's web UI: **Add file → Upload files**.
3. In the repo: **Settings → Pages → Build and deployment** — Source: `Deploy from a branch`, Branch: `main` / `/ (root)` → **Save**.
4. Wait ~1 minute. The page is live at `https://<username>.github.io/kairos-web/`.

## Custom domain (optional, recommended for client trust)

1. Buy a domain (e.g. `kairos-web.tw`).
2. In **Settings → Pages → Custom domain**, enter the domain and save (this creates a `CNAME` file).
3. At your DNS provider, add a `CNAME` record pointing `www` (or the subdomain you chose) to `<username>.github.io`.
4. Tick **Enforce HTTPS** once the certificate is issued.

## Editing

Everything lives in `index.html`:

- **Prices** — search for `NT$ 59,800`, `NT$ 99,800`, `NT$14,800`. If you change the 快速官網 price, also update every `59800` (and `99800` for the B2B plan) — search for `59800`, `59,800`, `99800` and `99,800` (both `NT$ 59,800` and `NT$59,800` spellings exist): `data-twd` on the pricing cards, `build` in each `IND` entry, the payback calculator (`var pb=`), the JSON-LD `minPrice` and `priceRange`, the zh payback copy (`rPayback`, `calc.payback`), the zh `plan` strings in `IND_TXT`, and the `{{mb:59800}}` / `{{mb:99800}}` tokens in `DYN` and `IND_TXT`. The retainer `14800` likewise appears as `FEE`, in the pricing text and in `{{mb:14800}}` tokens (including `I18N_ALL`).
- **Contact email** — search for `kairos.ai.tech@gmail.com` (mailto CTAs, the contact block, form notes in all languages, the lead-mail helper `leadMailto()` and the JSON-LD). Re-run `node scripts/build-locales.mjs` afterwards.
- **Post-reform demos & projection** — search for `id="results"` (HTML) and `var IND=` (script). Per-industry funnel assumptions live in the `IND` object: monthly searches `q`, reach `r0→r1` (before→after: share of searches that land on the site), visitor conversion `c0→c1`, close rate, ticket, margin, build price. Customers won = `q × reach × conversion × close`; "new" = after − before. Conversion improves at launch, reach ramps with `RAMP` (≈8 months); `FEE` is the SEO/GEO retainer. All businesses and numbers are fictional.
- **Currency & market localisation** — prices are always authored and billed in NT$. In en/ja/ko the page shows an indicative local conversion (US$ / ¥ / ₩), rounded to 2 significant digits: the exchange rates are the `MARKETS` table (`rate` = local units per NT$1) near the top of the main `<script>` — update them when they drift. In translated strings write amounts as tokens: `{{m:N}}` (local only), `{{mb:N}}` (local + original NT$), `{{r:A-B}}` (range). Pricing cards get an `≈` line from `data-twd` on `.p-num`. The projection panel's reach/conversion are scaled per market by the `MKT` table in the demos script (reach `r`, visitor conversion `c`, Taiwan = 1.0); the factors are assumptions (Japan: portals such as Tabelog/EPARK; Korea: Naver dominance; US/international: Yelp/Zocdoc-style directories), not measured data, and the panel says so. The notes shown to visitors are the `ind.why.*` / `ind.mkt.*` / `ind.fx` keys in `DYN`.
- **Languages (中文 / English / 日本語 / 한국어)** — the header `<select id="langSelect">` switches `window.CURRENT_LANG`. Traditional Chinese is the text in the HTML itself (`data-i18n="key"`); the other languages live in the block starting at `var I18N_ALL=` near the top of the main `<script>`: `I18N_ALL` (static `data-i18n` keys for en/ja/ko), `DYN` (scan tool, PDF report, projection labels, read with `tr('key')`) and `IND_TXT` (demo-site copy per industry). When you add a `data-i18n` key, add it to all three languages in `I18N_ALL` (missing ja/ko falls back to English, then Chinese). Japanese and Korean copy was machine-translated — have a native speaker review it before using it with customers.
- **Pre-rendered language pages (`/en/`, `/ja/`, `/ko/`)** — each language has its own indexable URL with translated body copy, `<title>`, meta/OG tags, canonical and JSON-LD; the language picker navigates between them. They are generated, never edited by hand: after any change to `index.html` run `node scripts/build-locales.mjs` (Node 18+, no dependencies) and commit the regenerated `en/ja/ko/index.html`. `node scripts/build-locales.mjs --check` fails if they are stale or if the zh `FAQPage` JSON-LD no longer matches the visible FAQ. Body copy comes from `I18N_ALL` / `I18N_PH` / `I18N_ARIA`; the per-language title, description, link-preview text and JSON-LD wording are the `META` table at the top of the script. Every page carries the same hreflang block (zh-Hant-TW, en, ja, ko, x-default → `/`), and `sitemap.xml` lists all four URLs with the same alternates.
- **Scroll-driven before/after demo** — `#story` is a tall track (`--story-h`, 300vh) holding a sticky stage; the script block `getElementById('story')` maps scroll progress to the compare `--split`, the health-score ring and the 5 checklist steps (`story-s1`…`story-s5`, all four languages). With `prefers-reduced-motion` the track collapses and the final state is shown.
- **Hero reform loop** — `.hero-reform` in the hero is a pure CSS/SVG loop (10 s, `--hr-t`): an old site with a "not secure" URL, a scan beam that wipes in the rebuilt site, the health score counting 38 → 96, then a search result and an AI answer chip. It has no words, so it works in every language. `motion.js` pauses it while off-screen; `prefers-reduced-motion` freezes it on the finished frame; retro mode hides it. Under 1000px it sits below the buttons instead of beside the text.
- **Demo site templates** — `demos/b2b/` (Hongda Precision, a machining supplier) and `demos/retail/` (Jin Yi Feng Foods, a food retailer) are static multi-page sites: hash-routed pages in one file each, shared `demos/demo.js` (router, zh/EN switch via `?lang=`, demo form handler, scroll reveals) and `demos/demo.css` (demo bar). All names and numbers are fictional, pages are `noindex`, forms send nothing. Japanese and Korean visitors get the English demos. The `#templates` section on the main page links to them (language is passed with `?lang=`, and `?embed=1` hides the demo bar in the live preview iframes). The two templates deliberately differ: B2B is dark navy and orange with a full-bleed drill photo, a scan line, a shop-floor stats band and a live quote estimator; retail is red, gold and cream with an arch photo collage and a cart drawer. Photos are Unsplash images in each template's `img/` folder (Unsplash License); the retail product cards, cart thumbnails and story panel use stand-in product photos (`img/p-*.jpg`), so swap in the client's own product shots; `demo.js` adds the scroll progress bar, `data-par` parallax and `data-tilt` hover tilt, and all of it is off under `prefers-reduced-motion`. To add a third template, copy a folder, keep `data-page` / `data-go` / `data-en` attributes, and add a card in `#templates` with the `tpl*` keys in `I18N_ALL`.
- **Service promise (`#promise`)** — the two ways of working (design from scratch, or rework the client's existing page) and the promise that the client owns the finished site 100% and we keep no ownership. The same wording is in the hero, the delivery step, the ownership FAQ (and its FAQPage JSON-LD) and the meta descriptions in `scripts/build-locales.mjs`. The AI-search term is GEO (Generative Engine Optimization); the scan code still uses `aeo` internally for variable and element ids only.
- **Demo shop** — the before/after mockup uses the fictional 「金益豐食品行」; swap in a real client case once you have one.
- **SEO metadata** — `<meta name="description">`, OG/Twitter tags, canonical URL, hreflang block, and the JSON-LD `ProfessionalService` + `FAQPage` blocks are at the top of `<head>` (zh). The en/ja/ko equivalents are produced by `scripts/build-locales.mjs`.
- **Lead capture & analytics** — config is the first `<script>` in `<head>`: `FORM_ENDPOINT` and `GA4_ID`. Both ship as placeholders (`TODO_FORMSPREE_OR_APPS_SCRIPT_URL`, `G-XXXXXXXXXX`). While `FORM_ENDPOINT` is not an `https://` URL, the health-check form and the contact form open the visitor's mail app (the old behaviour) and the header/hero/sticky CTAs stay plain mailto links. Once it is set (Formspree `https://formspree.io/f/…` or FormSubmit `https://formsubmit.co/ajax/<inbox>`; both accept a `FormData` POST with `Accept: application/json`), the forms POST there, show a confirmation, fall back to mailto if the POST fails, and the CTAs scroll to the contact form. While `GA4_ID` is the placeholder, gtag.js is never loaded; once set it loads and `kTrack()` sends `scan_start`, `lead_submit` (`method`: api / mailto / mailto_fallback), `mailto_click`, `cta_click` and `pdf_download`. Verify the site in Google Search Console separately. Run `node scripts/build-locales.mjs` after changing either value.
- **Images** — the logo is `assets/logo.svg` (the original 320×320 PNG embedded in an SVG wrapper so it can be committed as text); it used to be inlined four times as base64 (~100 KB of the HTML). The favicon is still an inline data URI.
- **FAQ section** — search for `id="faq"`. Keep the visible `<details>` text and the `FAQPage` JSON-LD in sync if you edit either (AI/Google search engines expect structured data to match visible content).
- **Business address/phone** (LEO) — in the `ProfessionalService` JSON-LD block, under `address` and `telephone`.

## Development checks

`npm install` once (it also installs the git hooks through husky). Then:

- `npm run lint` — ESLint on `motion.js`, `demos/` and the inline scripts of every HTML page, zero warnings allowed.
- `npm run format:check` / `npm run format` — Prettier. `index.html`, the generated `en/ja/ko` pages, `vendor/`, Markdown and `scripts/build-locales.mjs` are in `.prettierignore` (the generator reads `index.html` by pattern, so it is formatted by hand).
- `npm run check:locales` — fails if the generated language pages are stale.
- `npm run verify` — all three. The `pre-push` hook and the GitHub Actions workflow (`.github/workflows/ci.yml`) run exactly this. The `pre-commit` hook runs ESLint `--fix` and Prettier on staged files only.

## Domain / deployment checklist

The site is currently configured for `https://reform.kairosaitech.com/`. If you deploy to a different domain, update it in all of these places:

- `robots.txt` — the `Sitemap:` line
- `sitemap.xml` — the `<loc>` value
- `index.html` — `<link rel="canonical">`, the hreflang block, `og:url`, `og:image` / `twitter:image` (and re-upload `og-image.png` if the domain changes), and the `"url"`/`"image"` fields in the `ProfessionalService` JSON-LD block
- `sitemap.xml` — the `<loc>` and `xhtml:link` alternates for all four language URLs
- `scripts/build-locales.mjs` — the `SITE` constant; then re-run it

`og-image.png` (1200×630, generated from the real logo on brand blue) ships alongside `index.html` — used for Facebook/LINE/Twitter link previews. Regenerate it if the logo changes.

## Motion layer

`motion.js` adds scroll/animation polish on top of the static page. (`vendor/html2pdf.bundle.min.js` is html2pdf.js 0.10.2, copied from cdnjs and checked against its published sha512 SRI; it is only loaded when someone downloads the quick-scan PDF. MIT, see `vendor/LICENSE.html2pdf`.) The libraries are vendored in `vendor/` (served same-origin, so no CDN dependency):

- **Lenis** — smooth scrolling and eased anchor navigation (offset for the sticky header). Scrollable inner panels carry `data-lenis-prevent`.
- **GSAP + ScrollTrigger** — hero entrance, scroll-reveal for sections/cards/steps/prices (replaces the CSS-only reveal), hero parallax, top scroll-progress bar.
- **Vanta (NET) + three.js r134** — animated network background in the hero. Lazy-loaded after `load`, desktop only, paused when the hero is off-screen or retro mode is on. Vanta 0.5.x requires three ≤ r134, so don't bump `three.min.js`.
- **React Bits** — it's a React library and this site has no build step, so three of its effects are ported to vanilla JS/CSS: SpotlightCard (cursor glow on cards/prices), ShinyText (trust pill), Magnet (hero buttons).

Everything is skipped under `prefers-reduced-motion`, and the page falls back to the original CSS behaviour if any script fails to load. To disable a piece, remove its block in `motion.js`; to remove the layer entirely, delete the four `<script defer>` tags before `</body>`.

## SEO and GEO tracking

- Target keywords and the questions people ask AI search live in `seo/keywords.json`. The zh title, description and FAQ are in `index.html`; the en/ja/ko head metadata is in `scripts/build-locales.mjs`.
- `npm run seo:audit` checks the local pages (add `-- --live --write` for the live site and a dated snapshot in `seo/reports/`). It reports missing primary keywords, title and description length, FAQ coverage of the target questions, JSON-LD validity, sitemap and robots, and what is new or resolved since the last snapshot.
- `seo/ROUTINE.md` is the weekly routine: audit, search check, report and a pull request with suggested edits under `seo/` only.
