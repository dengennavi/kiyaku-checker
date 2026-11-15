"""LINEのリッチメニュー画像（2500x843、横3つ）を作る。

使い方: python3 tools/make_richmenu.py line/richmenu.png
LINE公式アカウントの管理画面で「小・3分割」のテンプレートを選び、この画像をアップロードする。
ボタンの動き（管理画面で設定）:
  左   テキスト「使い方」 → 規約チェックの使い方が返る
  中   テキスト「引き落とし」 → 毎月の引き落とし（サブスク）を調べる使い方が返る
  右   リンク https://dengennavi.github.io/kiyaku-checker/services/
"""
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 2500, 843
NOTO = "/mnt/c/Windows/Fonts/NotoSansJP-VF.ttf"
# (絵文字の代わりの記号, 見出し2行, 説明, 背景, 文字)
CELLS = [
    ("📄", ["規約を", "チェック"], "利用規約を貼って送る", "#117C7E", "#FFFFFF"),
    ("💳", ["毎月の引き落とし", "を調べる"], "カード明細を貼って送る", "#FFFFFF", "#1C1C1E"),
    ("🔍", ["解約で", "損しないために"], "サービス別のルール", "#FFFFFF", "#1C1C1E"),
]


def font(size, weight):
    f = ImageFont.truetype(NOTO, size)
    f.set_variation_by_axes([weight])
    return f


def main(out):
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    cw = W // 3
    for i, (_, title, sub, bg, fg) in enumerate(CELLS):
        x0 = i * cw
        d.rectangle((x0, 0, x0 + cw, H), fill=bg)
        if i:
            d.line((x0, 60, x0, H - 60), fill="#D0D5DB", width=6)
        size = 118
        while max(d.textlength(t, font=font(size, 800)) for t in title) > cw - 180:
            size -= 4
        big = font(size, 800)
        block = len(title) * (size + 30) + 40 + 62
        y = (H - block) / 2 - 10
        for line in title:
            w = d.textlength(line, font=big)
            d.text((x0 + (cw - w) / 2, y), line, font=big, fill=fg)
            y += big.size + 30
        small = font(62, 600)
        w = d.textlength(sub, font=small)
        sub_fg = "#D6EFEF" if bg != "#FFFFFF" else "#5A5A60"
        d.text((x0 + (cw - w) / 2, y + 40), sub, font=small, fill=sub_fg)
    img.save(out)


main(sys.argv[1])
