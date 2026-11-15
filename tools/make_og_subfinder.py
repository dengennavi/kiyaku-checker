"""「毎月の引き落としを調べる」ページのカード画像（1200x630）を作る。
使い方: python3 tools/make_og_subfinder.py sub-finder/og.png
"""
import sys
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG, WHITE, SUB, INK, MUTED = "#117C7E", "#FFFFFF", "#D6EFEF", "#1C1C1E", "#5A5A60"
NOTO = "/mnt/c/Windows/Fonts/NotoSansJP-VF.ttf"


def font(size, weight):
    f = ImageFont.truetype(NOTO, size)
    f.set_variation_by_axes([weight])
    return f


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
d.text((60, 52), "規約チェッカー", font=font(30, 600), fill=SUB)
big = font(58, 800)
d.text((60, 100), "毎月の引き落とし、", font=big, fill=WHITE)
d.text((60, 178), "何に払っている？", font=big, fill=WHITE)
d.text((60, 280), "カード明細を貼るだけで、", font=font(34, 600), fill=SUB)
d.text((60, 326), "サブスクと解約する場所がわかる", font=font(34, 600), fill=SUB)
d.text((60, 540), "無料・登録不要・明細は送信しません", font=font(28, 500), fill=SUB)

# 右：明細 → 見つかったサブスクの見本
x0, y0, x1, y1 = 700, 70, 1140, 560
d.rounded_rectangle((x0, y0, x1, y1), radius=24, fill=WHITE)
d.text((x0 + 30, y0 + 26), "カード明細", font=font(26, 700), fill=MUTED)
mono = font(24, 500)
rows = [("NETFLIX.COM", "1,590"), ("APPLE.COM/BILL", "400"), ("ｱﾄﾞﾋﾞ", "2,380")]
y = y0 + 72
for name, yen in rows:
    d.text((x0 + 30, y), name, font=mono, fill=INK)
    w = d.textlength(yen, font=mono)
    d.text((x1 - 30 - w, y), yen, font=mono, fill=INK)
    y += 40
d.line((x0 + 30, y + 10, x1 - 30, y + 10), fill="#E5E5EA", width=3)
d.text((x0 + 30, y + 30), "見つかったサブスク", font=font(26, 700), fill=BG)
y += 76
for label in ["Netflix", "Apple（iCloud+ など）", "Adobe"]:
    d.ellipse((x0 + 32, y + 12, x0 + 50, y + 30), fill=BG)
    d.text((x0 + 64, y), label, font=font(28, 700), fill=INK)
    y += 48
img.save(sys.argv[1])
