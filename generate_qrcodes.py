#!/usr/bin/env python3
"""Generate PNG + SVG QR codes for each work's official Pages URL.

Reads works.json, writes qrcodes/<id>-<slug-basename>.png and .svg,
and writes links.csv summarizing everything.

Run after the GitHub Pages URL is confirmed stable:
    python3 generate_qrcodes.py
"""
import csv
import json
import os

import qrcode
import qrcode.image.svg

BASE_URL = "https://zhesunxing.github.io/video-portfolio"
ROOT = os.path.dirname(os.path.abspath(__file__))
QR_DIR = os.path.join(ROOT, "qrcodes")


def slugify_title(title_en):
    return (
        title_en.lower()
        .replace(" ", "-")
        .replace(",", "")
        .replace("'", "")
        .replace("?", "")
    )


def main():
    os.makedirs(QR_DIR, exist_ok=True)
    with open(os.path.join(ROOT, "works.json"), "r", encoding="utf-8") as f:
        works = json.load(f)

    rows = []
    for w in works:
        url = f"{BASE_URL}/{w['slug']}.html"
        name_part = slugify_title(w["titleEn"])
        base_name = f"{w['id']}-{name_part}"
        png_path = os.path.join(QR_DIR, f"{base_name}.png")
        svg_path = os.path.join(QR_DIR, f"{base_name}.svg")

        # PNG: high error correction, generous quiet zone (border=4 modules
        # minimum per spec; using 4 explicitly, no decorative styling).
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(png_path)

        # SVG: same data/params, vector output for print use.
        factory = qrcode.image.svg.SvgPathImage
        svg_qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
            image_factory=factory,
        )
        svg_qr.add_data(url)
        svg_qr.make(fit=True)
        svg_img = svg_qr.make_image()
        svg_img.save(svg_path)

        rows.append(
            {
                "序号": w["id"],
                "作品名称": w["title"],
                "正式播放地址": url,
                "PNG二维码路径": os.path.relpath(png_path, ROOT),
                "SVG二维码路径": os.path.relpath(svg_path, ROOT),
            }
        )
        print(f"generated {base_name}.png / .svg -> {url}")

    csv_path = os.path.join(ROOT, "links.csv")
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["序号", "作品名称", "正式播放地址", "PNG二维码路径", "SVG二维码路径"],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nWrote {csv_path}")


if __name__ == "__main__":
    main()
