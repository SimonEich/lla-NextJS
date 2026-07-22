#!/usr/bin/env python3
"""One-off script to generate PWA icon PNGs + favicon.ico from scratch. Re-run if branding changes."""
import os
from PIL import Image, ImageDraw, ImageFont

GREEN = (15, 110, 86, 255)  # #0F6E56
WHITE = (255, 255, 255, 255)

FONT_CANDIDATES = [
    "/System/Library/Fonts/SFNSRounded.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]

def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_icon(size, padding_ratio):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=GREEN)

    text = "lla"
    inner = size * (1 - padding_ratio * 2)
    font_size = int(inner * 0.52)
    font = load_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # Shrink further if the wordmark would overflow the safe area
    while tw > inner and font_size > 10:
        font_size -= 2
        font = load_font(font_size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    pos = ((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1])
    draw.text(pos, text, font=font, fill=WHITE)
    return img

out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(out_dir, exist_ok=True)

icon_192 = draw_icon(192, 0.12)
icon_192.save(os.path.join(out_dir, "icon-192.png"))

icon_512 = draw_icon(512, 0.12)
icon_512.save(os.path.join(out_dir, "icon-512.png"))

maskable_512 = draw_icon(512, 0.20)
maskable_512.save(os.path.join(out_dir, "icon-maskable-512.png"))

apple_touch = draw_icon(180, 0.14)
apple_touch.save(os.path.join(out_dir, "apple-touch-icon.png"))

favicon_dir = os.path.join(os.path.dirname(__file__), "..", "src", "app")
favicon_sizes = [16, 32, 48, 64]
favicon_imgs = [draw_icon(s, 0.12) for s in favicon_sizes]
favicon_imgs[0].save(
    os.path.join(favicon_dir, "favicon.ico"),
    format="ICO",
    sizes=[(s, s) for s in favicon_sizes],
    append_images=favicon_imgs[1:],
)

print("Icons generated in", out_dir)
