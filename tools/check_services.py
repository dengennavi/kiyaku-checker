"""まとめページの引用が、今も公式の規約にそのまま残っているかを確かめる。

使い方: python3 tools/check_services.py
  環境変数 CHROME に Chrome の実行ファイルを指定できる（既定は google-chrome）。

結果:
  - 引用が1か所でも見つからない → 終了コード 1（GitHub Actions が失敗としてメールで知らせる）
  - ページが読めなかっただけ（ロボット除けなど） → 「確認できず」と表示するが、失敗にはしない
  - 結果は check-result.md にも書く（Actions の画面とメールで読める）
"""
import html
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
CHROME = os.environ.get("CHROME", "google-chrome")


def fetch(url, how):
    if how == "chrome":
        cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--lang=ja",
               "--virtual-time-budget=20000", f"--user-agent={UA}", "--dump-dom", url]
    else:
        cmd = ["curl", "-sL", "-m", "40", "--compressed", "-A", UA, "-H", "Accept-Language: ja", url]
    try:
        out = subprocess.run(cmd, capture_output=True, timeout=90, stdin=subprocess.DEVNULL).stdout
    except subprocess.TimeoutExpired:
        return ""
    t = out.decode("utf-8", errors="ignore")
    t = re.sub(r"(?s)<(script|style|noscript)[^>]*>.*?</\1>", "", t)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    return re.sub(r"\s+", " ", t)


def squash(s):
    return re.sub(r"\s+", "", s)


def main():
    services = json.load(open(os.path.join(ROOT, "data/services.json"), encoding="utf-8"))
    changed, unreadable, ok = [], [], []
    for s in services:
        text = fetch(s["url"], s.get("fetch", "curl"))
        if len(text) < 3000:
            unreadable.append(s)
            print(f"確認できず {s['name']}（ページを読めなかった）")
            continue
        flat = squash(text)
        missing = [it for it in s["items"] if squash(it["quote"]) not in flat]
        if missing:
            changed.append((s, missing))
            print(f"変更あり   {s['name']}：{len(missing)}か所")
        else:
            ok.append(s)
            print(f"OK         {s['name']}")

    lines = ["# 規約まとめページの確認結果", ""]
    if changed:
        lines.append("## 引用が見つからなくなった（規約が変わった可能性）")
        for s, missing in changed:
            lines.append(f"- **{s['name']}**（{s['url']}）")
            for it in missing:
                lines.append(f"  - {it['label']}：「{it['quote'][:60]}…」")
        lines.append("")
    if unreadable:
        lines.append("## ページを読めなかった（今日は確認できず）")
        lines += [f"- {s['name']}（{s['url']}）" for s in unreadable]
        lines.append("")
    lines.append(f"OK {len(ok)}件／変更あり {len(changed)}件／確認できず {len(unreadable)}件")
    report = "\n".join(lines)
    with open(os.path.join(ROOT, "check-result.md"), "w", encoding="utf-8") as f:
        f.write(report + "\n")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report + "\n")
    sys.exit(1 if changed else 0)


main()
