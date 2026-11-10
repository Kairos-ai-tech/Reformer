import csv
import datetime as dt
import json
import os
import sys

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from platformdirs import user_config_dir

SITE = "https://reform.kairosaitech.com/"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 90
OUT = sys.argv[2] if len(sys.argv) > 2 else "seo/gsc"


def service():
    token = os.path.join(user_config_dir("mcp-gsc"), "token.json")
    return build("searchconsole", "v1", credentials=Credentials.from_authorized_user_file(token, SCOPES))


def analytics(svc, dims, start, end, limit=1000):
    body = {"startDate": start, "endDate": end, "dimensions": dims, "rowLimit": limit, "dataState": "all"}
    return svc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])


def write(name, header, rows):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def main():
    svc = service()
    end = dt.date.today() - dt.timedelta(days=2)
    start = end - dt.timedelta(days=DAYS)
    s, e = start.isoformat(), end.isoformat()
    cfg = json.load(open("seo/keywords.json"))
    paths = {v["path"] for v in cfg["locales"].values()}
    urls = [cfg["site"].rstrip("/") + p for p in sorted(paths)]

    sm = svc.sitemaps().list(siteUrl=SITE).execute().get("sitemap", [])
    print("SITEMAPS", json.dumps(sm, ensure_ascii=False))

    for u in urls:
        r = svc.urlInspection().index().inspect(body={"inspectionUrl": u, "siteUrl": SITE}).execute()
        ix = r["inspectionResult"]["indexStatusResult"]
        print("INSPECT", u, ix.get("verdict"), ix.get("coverageState"), ix.get("lastCrawlTime"), ix.get("googleCanonical"))

    total = analytics(svc, [], s, e)
    print("TOTAL", s, e, json.dumps(total))

    q = analytics(svc, ["query"], s, e)
    write("queries.csv", ["query", "clicks", "impressions", "ctr", "position"],
          [[r["keys"][0], r["clicks"], r["impressions"], round(r["ctr"], 4), round(r["position"], 1)] for r in q])
    p = analytics(svc, ["page"], s, e)
    write("pages.csv", ["page", "clicks", "impressions", "ctr", "position"],
          [[r["keys"][0], r["clicks"], r["impressions"], round(r["ctr"], 4), round(r["position"], 1)] for r in p])
    print("ROWS queries", len(q), "pages", len(p), "->", OUT)


main()
