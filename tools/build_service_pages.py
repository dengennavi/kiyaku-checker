"""サービス別「解約・返金・自動更新」まとめページを作る。

使い方: python3 tools/build_service_pages.py
data/services.json から services/<slug>.html と services/index.html を作り、sitemap.xml も書き直す。

守ること（名指しのルール）:
- 書くのは、公式の規約の条文の引用・その平たい言い換え・公式ページのリンクだけ
- 「違法」「危ない」「悪質」とは書かない。🔴🟡の判定も付けない
- 引用は短く、出典（規約名・条・URL・確認日）を必ず付ける
"""
import html
import json
import os

BASE = "https://dengennavi.github.io/kiyaku-checker/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_VER = "20261115"
e = html.escape


def head(title, desc, path):
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{BASE}{path}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{BASE}{path}">
<meta property="og:image" content="{BASE}og.png">
<meta property="og:site_name" content="規約チェッカー">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@kiyaku_checker">
<link rel="icon" href="../icon.png">
<link rel="stylesheet" href="../style.css?v={CSS_VER}">
</head>
<body>
<header class="crumb"><a href="../">規約チェッカー</a> › <a href="./">サービス別 規約まとめ</a></header>
<main class="article">
"""


CTA = """<section class="card cta">
  <p><b>ほかのサービスの規約も、貼るだけでチェックできます</b></p>
  <p class="muted">規約チェッカーは、利用規約を貼ると、解約・返金・免責などの気になる条項を色分けして表示する無料ツールです。規約はサーバーに送信されません。</p>
  <a class="btn primary block" href="../">規約チェッカーを使う（無料・登録不要）</a>
  <a class="btn line block" href="https://line.me/R/ti/p/@823qtyqg" target="_blank" rel="noopener">LINEで使う（友だち追加）</a>
</section>
"""

FOOT = """</main>
<footer><p>このページは、各社が公開している利用規約の一部を引用し、内容をわかりやすく言い換えたものです。法的助言ではありません。規約は変わることがあるため、必ず公式ページで最新の内容を確認してください。契約のトラブルは消費生活センター（188）に相談できます。</p><p><a href="../legal.html">利用規約・プライバシーポリシー</a>｜運営：ノードワークス｜<a href="https://x.com/kiyaku_checker" target="_blank" rel="noopener">X @kiyaku_checker</a></p></footer>
</body>
</html>
"""


def service_page(s):
    path = f"services/{s['slug']}.html"
    short = s["name"].split("（")[0]
    title = f"{short}の解約・返金・自動更新｜利用規約に書いてあること"
    desc = f"{short}の利用規約（{s['doc']}）から、解約・返金・自動更新・料金や規約の変更について書かれた部分を引用し、わかりやすくまとめました。"
    out = [head(title, desc, path)]
    out.append(f"<h1>{e(short)}の解約・返金・自動更新<br><small>利用規約に書いてあること</small></h1>\n")
    out.append(f'<p class="muted">出典：<a href="{e(s["url"])}" target="_blank" rel="noopener">{e(s["doc"])}</a>{("（最終更新 " + e(s["updated"]) + "）") if s["updated"] else ""}。{e(s["checked"])} に確認。</p>\n')
    out.append('<section class="card"><p class="label">ポイント</p><ul>\n')
    out += [f"  <li>{e(x)}</li>\n" for x in s["summary"]]
    out.append("</ul></section>\n")
    for it in s["items"]:
        out.append(f'<section class="clause"><h2>{e(it["label"])}</h2>\n')
        out.append(f'<blockquote>{e(it["quote"])}<cite>{e(s["doc"])} {e(it["section"])}</cite></blockquote>\n')
        out.append(f"<p>{e(it['plain'])}</p></section>\n")
    out.append(CTA)
    out.append(FOOT)
    return path, "".join(out)


def index_page(services):
    path = "services/"
    title = "サブスクの解約・返金・自動更新｜サービス別 利用規約まとめ"
    desc = "Netflix・Spotify・YouTube Premium など、人気サービスの利用規約から、解約・返金・自動更新・規約変更について書かれた部分をまとめました。"
    out = [head(title, desc, path)]
    out.append("<h1>サービス別 利用規約まとめ<br><small>解約・返金・自動更新</small></h1>\n")
    out.append('<p>人気サービスの利用規約から、解約・返金・自動更新・料金や規約の変更について書かれた部分を、条文の引用つきでまとめました。</p>\n<ul class="svc">\n')
    for s in services:
        out.append(f'  <li><a href="{s["slug"]}.html"><b>{e(s["name"])}</b><span class="muted">{e(s["summary"][0])}</span></a></li>\n')
    out.append("</ul>\n")
    out.append('<p class="card">💳 何に入っているか分からないときは <a href="../sub-finder/">サブスク発見（カード明細を貼るだけ）</a> で探せます。</p>\n')
    out.append('<p class="card">📦 ネット通販の「お試しのつもりが定期購入」は <a href="../teiki/">申し込む前に見る5か所</a> へ。</p>\n')
    out.append(CTA)
    out.append(FOOT)
    return "services/index.html", "".join(out)


def head2(title, desc, path, crumb):
    return head(title, desc, path).replace(
        '<header class="crumb"><a href="../">規約チェッカー</a> › <a href="./">サービス別 規約まとめ</a></header>',
        f'<header class="crumb"><a href="../">規約チェッカー</a> › <a href="./">明細の請求名</a>{(" › " + e(crumb)) if crumb else ""}</header>')


FINDER = """<section class="card cta">
  <p><b>ほかにも払い続けているサブスクがないか、まとめて探す</b></p>
  <p class="muted">カードの明細を貼るだけで、入っているサブスクと解約する場所が分かります。明細はどこにも送信しません。</p>
  <a class="btn primary block" href="../sub-finder/">サブスク発見（明細を貼るだけ・無料）</a>
  <a class="btn ghost block" href="../services/">サービス別 解約・返金のルール</a>
</section>
"""


FOOT_BILL = FOOT.replace("このページは、各社が公開している利用規約の一部を引用し、内容をわかりやすく言い換えたものです。法的助言ではありません。規約は変わることがあるため、必ず公式ページで最新の内容を確認してください。",
    "このページは、各社の公式ヘルプをもとに、カード明細の請求名をわかりやすくまとめたものです。手順や金額は変わることがあるため、必ず公式の案内で確認してください。不正利用が心配なときは、すぐにカード会社に連絡してください。")


def billing_page(b, names):
    path = f"billing/{b['slug']}.html"
    out = [head2(b["title"], b["desc"], path, b["label"])]
    out.append(f"<h1>{e(b['h1'])}</h1>\n<p>{e(b['lead'])}</p>\n")
    for sec in b["sections"]:
        out.append(f"<section class=\"clause\"><h2>{e(sec['h2'])}</h2>\n")
        if "table" in sec:
            out.append('<table class="desc-table"><tr><th>明細の名前</th><th>サービス</th></tr>\n')
            out += [f"<tr><td><code>{e(a)}</code></td><td>{e(c)}</td></tr>\n" for a, c in sec["table"]]
            out.append("</table>\n")
        if "list" in sec:
            # list の項目は手で書いた文。<b> だけ許す
            out.append("<ul>\n" + "".join("  <li>" + e(x).replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>") + "</li>\n" for x in sec["list"]) + "</ul>\n")
        out.append("</section>\n")
    if b["related"]:
        out.append('<section class="card"><p class="label">解約・返金のルール（規約の条文つき）</p><ul>\n')
        out += [f'  <li><a href="../services/{r}.html">{e(names.get(r, r))}</a></li>\n' for r in b["related"]]
        out.append("</ul></section>\n")
    out.append('<p class="muted small">出典：' + "／".join(f'<a href="{e(x["url"])}" target="_blank" rel="noopener">{e(x["name"])}</a>' for x in b["sources"]) + "（2026-11-15 に確認）。手順や金額は変わることがあるため、最新の内容は公式の案内で確認してください。</p>\n")
    out.append(FINDER)
    out.append(FOOT_BILL)
    return path, "".join(out)


def billing_index(items):
    title = "カード明細の請求名 辞典｜身に覚えのない請求は何？"
    desc = "カード明細の「APPLE.COM/BILL」「GOOGLE *」「PAYPAL *」など、分かりにくい請求名が何の請求かを、各社の公式ヘルプをもとにまとめました。"
    out = [head2(title, desc, "billing/", "")]
    out.append("<h1>カード明細の請求名 辞典<br><small>身に覚えのない請求は何？</small></h1>\n")
    out.append("<p>カードの明細には、サービス名ではなく会社名や決済の名前が出ることがあります。分かりにくい請求名が何の請求かを、各社の公式ヘルプをもとにまとめました。</p>\n<ul class=\"svc\">\n")
    out += [f'  <li><a href="{b["slug"]}.html"><b>{e(b["label"])}</b><span class="muted">{e(b["h1"])}</span></a></li>\n' for b in items]
    out.append("</ul>\n")
    out.append(FINDER)
    out.append(FOOT_BILL)
    return "billing/index.html", "".join(out)


def main():
    services = json.load(open(os.path.join(ROOT, "data/services.json"), encoding="utf-8"))
    os.makedirs(os.path.join(ROOT, "services"), exist_ok=True)
    billing = json.load(open(os.path.join(ROOT, "data/billing.json"), encoding="utf-8"))
    names = {s["slug"]: s["name"] for s in services}
    os.makedirs(os.path.join(ROOT, "billing"), exist_ok=True)
    pages = [service_page(s) for s in services] + [index_page(services)]
    pages += [billing_page(b, names) for b in billing] + [billing_index(billing)]
    for path, body in pages:
        with open(os.path.join(ROOT, path if path.endswith(".html") else path + "index.html"), "w", encoding="utf-8") as f:
            f.write(body)
    urls = ["", "legal.html", "sub-finder/", "teiki/", "billing/", "services/"] + [f"billing/{b['slug']}.html" for b in billing] + [f"services/{s['slug']}.html" for s in services]
    lastmod = max(s["checked"] for s in services)
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in urls:
            f.write(f"  <url><loc>{BASE}{u}</loc><lastmod>{lastmod}</lastmod></url>\n")
        f.write("</urlset>\n")
    print("pages:", len(pages))


main()
