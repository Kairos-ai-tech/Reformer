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
