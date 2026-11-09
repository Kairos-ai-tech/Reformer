# SEO and GEO tracking routine

Runs weekly. It measures how the Kairos reform site is doing for its target keywords and for AI-search questions, writes a report, and proposes edits. It never edits site copy and never merges.

Inputs: `seo/keywords.json` (target keywords and the questions people ask AI search), `seo/reports/*.json` (earlier audits), `seo/rankings.csv` (earlier search checks).

## Steps

1. `npm ci`, then `node scripts/seo-geo-audit.mjs --live --write`. It checks title, description, h1, canonical, hreflang, JSON-LD, FAQ coverage of the target questions, keyword placement, robots.txt, sitemap and og-image on the live site, and diffs against the previous report. If the live site does not answer 200, say so and fall back to the local audit.
2. Search check. For each locale's `primary` keywords, and for each `questions[].q` in zh and en, run WebSearch (standard mode). Record whether `reform.kairosaitech.com` appears, its rough position, and the top three other domains. Append one row per query to `seo/rankings.csv`: `date,locale,type,query,found,position,top_domains`. Use `type` `seo` for keywords and `geo` for questions. WebSearch is US-based and not Taiwan-localized, so treat zh results as approximate and say so in the report; never present them as exact rankings.
3. If `seo/gsc/*.csv` exists (a manual Search Console export), add clicks, impressions, CTR and average position per query, and the change since the previous export. Do not invent numbers when it does not exist; recommend connecting Search Console and setting `GA4_ID` in `index.html` instead.
4. Write `seo/reports/<date>.md`: what changed since the last report; open audit issues; the search table; the five most useful suggestions. Each suggestion gives the file, the current text, the proposed text, the keyword or question it serves, and the reason. Mark anything that makes a new public claim (prices, guarantees, results) as needing the owner's approval.
5. Suggest new target keywords or questions only when the search check or the Search Console export shows demand; put them in the report, not in `seo/keywords.json`.
6. Open a pull request on branch `seo/report-<date>` containing only files under `seo/`. Do not touch `index.html`, `en/`, `ja/`, `ko/` or `scripts/`. Do not merge.

## Limits

Search results are one sample from one location. The audit measures on-page signals, which are inputs to ranking and AI citation, not the results themselves. Real results need Search Console data and an AI-visibility check done by hand in ChatGPT, Gemini and Perplexity.
