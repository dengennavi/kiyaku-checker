"""Xのヘッダー画像(1500x500)を作る。

使い方: python3 tools/make_x_header.py marketing/x-header.png
左下はプロフィールのアイコンが重なるので、文字は x=470 より右に置く。
上下はスマホで少し切れるので、y=70〜430 の中に収める。
"""
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 1500, 500
BG = "#117C7E"
WHITE, SUB = "#FFFFFF", "#D6EFEF"
RED, YELLOW, GREEN = "#E5483F", "#F2B11B", "#34A853"
NOTO = "/mnt/c/Windows/Fonts/NotoSansJP-VF.ttf"
LEFT = 470


def font(size, weight):
    f = ImageFont.truetype(NOTO, size)
    f.set_variation_by_axes([weight])
    return f


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

big = font(66, 800)
d.text((LEFT, 70), "その「同意する」、", font=big, fill=WHITE)
d.text((LEFT, 155), "中身を知っていますか？", font=big, fill=WHITE)

d.text((LEFT, 265), "規約を貼るだけで、気になる条項を色分け", font=font(36, 600), fill=SUB)

# 色分けの見本（白い帯の中に3色。帯の幅は中身に合わせる）
y = 335
lab = font(32, 800)
items = [(RED, "要確認"), (YELLOW, "確認推奨"), (GREEN, "該当なし")]
width = 40 + sum(36 + d.textlength(t, font=lab) for _, t in items) + 50 * 2 + 40
d.rounded_rectangle((LEFT, y, LEFT + width, y + 76), radius=38, fill=WHITE)
x = LEFT + 40
for color, text in items:
    d.ellipse((x, y + 26, x + 24, y + 50), fill=color)
    d.text((x + 36, y + 15), text, font=lab, fill=color)
    x += 36 + d.textlength(text, font=lab) + 50

img.save(sys.argv[1])
