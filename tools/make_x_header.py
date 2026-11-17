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
d.text((LEFT, 70), "毎月の引き落とし、", font=big, fill=WHITE)
d.text((LEFT, 155), "何に払っているか分かりますか？", font=big, fill=WHITE)

d.text((LEFT, 265), "カード明細を貼るだけで、払っている先と解約先が分かる", font=font(34, 600), fill=SUB)

# 安心ポイント（白い帯の中に3つ。帯の幅は中身に合わせる）
y = 335
lab = font(30, 800)
items = ["無料", "明細は送信されません", "LINEでも使える"]
width = 40 + sum(36 + d.textlength(t, font=lab) for t in items) + 44 * 2 + 40
d.rounded_rectangle((LEFT, y, LEFT + width, y + 76), radius=38, fill=WHITE)
x = LEFT + 40
for text in items:
    d.ellipse((x, y + 26, x + 24, y + 50), fill=GREEN)
    d.line((x + 6, y + 38, x + 11, y + 43, x + 19, y + 32), fill=WHITE, width=4)
    d.text((x + 36, y + 17), text, font=lab, fill=BG)
    x += 36 + d.textlength(text, font=lab) + 44

img.save(sys.argv[1])
