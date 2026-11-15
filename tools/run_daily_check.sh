#!/bin/bash
# 毎日の規約チェック（Windows のタスクスケジューラから呼ぶ）
# 結果（check/status.json）が前回と変わったときだけ GitHub に送る。
# 「変更あり」が入っていれば GitHub Actions が失敗し、メールで知らせる。
cd /var/www/html/kiyaku-checker || exit 1
LOG=check/last-run.log
mkdir -p check
{
  date
  git pull -q --rebase
  CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" python3 tools/check_services.py
  if ! git diff --quiet -- check/status.json check/report.md || [ -n "$(git ls-files --others -- check/status.json)" ]; then
    git add check/status.json check/report.md
    git commit -q -m "規約チェックの結果が変わった（$(date +%F)）"
    git push -q
    echo "pushed"
  else
    echo "no change"
  fi
} > "$LOG" 2>&1
