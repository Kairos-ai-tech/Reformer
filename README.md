# 優時數位改造 — Product Page

Static product page for 優時科技 (Kairos.ai) web rebuild + SEO/AEO services. Single self-contained `index.html` — no build step, no dependencies.

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

- **Prices** — search for `NT$ 59,800`, `NT$ 99,800`, `NT$14,800`. If you change the 快速官網 price, also update `59800` in the `<script>` block (payback calculator, 2 places).
- **Contact email** — search for `kairos.ai.tech@gmail.com` (3 places: two mailto links, one footer/schema).
- **Post-reform demos & projection** — search for `id="results"` (HTML) and `post-reform industry demos` (script). Per-industry funnel assumptions live in the `IND` object: monthly searches `q`, reach `r0→r1` (share of searches that land on the site, before→after), visitor conversion `c0→c1`, close rate, ticket, margin, build price. Customers won = `q × reach × conversion × close`; "new" = after − before. Conversion improves at launch, reach ramps with `RAMP` (≈8 months); `FEE` is the SEO/AEO retainer. All businesses and numbers are fictional.
- **Currency & market localisation** — prices are always authored and billed in NT$. In en/ja/ko the page shows an indicative local conversion (US$ / ¥ / ₩), rounded to 2 significant digits: the exchange rates are the `MARKETS` table (`rate` = local units per NT$1) near the top of the main `<script>` — update them when they drift. In translated strings write amounts as tokens: `{{m:N}}` (local only), `{{mb:N}}` (local + original NT$), `{{r:A-B}}` (range). Pricing cards get an `≈` line from `data-twd` on `.p-num`. The projection panel's reach/conversion are scaled per market by the `MKT` table in the demos script (reach `r`, visitor conversion `c`, Taiwan = 1.0); the factors are assumptions (Japan: portals such as Tabelog/EPARK; Korea: Naver dominance; US/international: Yelp/Zocdoc-style directories), not measured data, and the panel says so. The notes shown to visitors are the `ind.why.*` / `ind.mkt.*` / `ind.fx` keys in `DYN`.
- **Languages (中文 / English / 日本語 / 한국어)** — the header `<select id="langSelect">` switches `window.CURRENT_LANG`. Traditional Chinese is the text in the HTML itself (`data-i18n="key"`); the other languages live in the generated-looking block between `/*I18N-BEGIN*/` and `/*I18N-END*/` near the top of the main `<script>`: `I18N_ALL` (static `data-i18n` keys for en/ja/ko), `DYN` (scan tool, PDF report, projection labels, read with `tr('key')`) and `IND_TXT` (demo-site copy per industry). When you add a `data-i18n` key, add it to all three languages in `I18N_ALL` (missing ja/ko falls back to English, then Chinese). Japanese and Korean copy was machine-translated — have a native speaker review it before using it with customers. `<title>`, meta tags and JSON-LD stay Chinese.
- **Demo shop** — the before/after mockup uses the fictional 「金益豐食品行」; swap in a real client case once you have one.
- **SEO metadata** — `<meta name="description">`, OG/Twitter tags, canonical URL, and the JSON-LD `ProfessionalService` + `FAQPage` blocks are at the top of `<head>`.
- **FAQ section** — search for `id="faq"`. Keep the visible `<details>` text and the `FAQPage` JSON-LD in sync if you edit either (AI/Google search engines expect structured data to match visible content).
- **Business address/phone** (LEO) — in the `ProfessionalService` JSON-LD block, under `address` and `telephone`.

## Domain / deployment checklist

The site is currently configured for `https://reform.kairosaitech.com/`. If you deploy to a different domain, update it in all of these places:

- `robots.txt` — the `Sitemap:` line
- `sitemap.xml` — the `<loc>` value
- `index.html` — `<link rel="canonical">`, `og:url`, `og:image` / `twitter:image` (and re-upload `og-image.png` if the domain changes), and the `"url"`/`"image"` fields in the `ProfessionalService` JSON-LD block

`og-image.png` (1200×630, generated from the real logo on brand blue) ships alongside `index.html` — used for Facebook/LINE/Twitter link previews. Regenerate it if the logo changes.
