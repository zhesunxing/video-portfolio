#!/usr/bin/env python3
"""Rebuild the portfolio reader images from a PDF.

Two tiers are produced so phones stay light while retina desktops stay sharp:

  1x  page-XX-part-YY.jpg        1080px wide JPEG   (phones)
  2x  page-XX-part-YY@2x.webp    2160px wide WebP    (retina desktops)

Usage:
  python3 tools/build_portfolio_pages.py "/path/to/portfolio.pdf"

Pillow is only needed for the 2x WebP tier. Without it the 2x tier stays JPEG
and everything still works, just with larger files.
"""

import json
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO, "assets", "portfolio-pages-mobile")
RENDERER = os.path.join(REPO, "tools", "render_portfolio_pages.swift")

ONE_X = {"width": 1080, "chunk": 1800, "quality": 0.82, "format": "jpeg", "suffix": ""}
TWO_X = {"width": 2160, "chunk": 3600, "quality": 0.95, "format": "jpeg", "suffix": "@2x"}
WEBP_QUALITY = 84


def render(pdf_path, opts, manifest_name):
    cmd = [
        "swift",
        RENDERER,
        pdf_path,
        OUT_DIR,
        "--width", str(opts["width"]),
        "--chunk", str(opts["chunk"]),
        "--quality", str(opts["quality"]),
        "--format", opts["format"],
        "--suffix", opts["suffix"],
        "--manifest", manifest_name,
    ]
    subprocess.run(cmd, check=True)
    with open(os.path.join(OUT_DIR, manifest_name), encoding="utf-8") as handle:
        return json.load(handle)


def convert_to_webp(manifest_name):
    try:
        from PIL import Image
    except ImportError:
        print("Pillow 不可用，2x 图保持 JPEG（体积更大，页面仍可正常显示）。")
        print("需要 WebP 请先运行：pip3 install Pillow")
        return

    manifest_path = os.path.join(OUT_DIR, manifest_name)
    with open(manifest_path, encoding="utf-8") as handle:
        manifest = json.load(handle)

    converted = {}
    for name, size in manifest["images"].items():
        source = os.path.join(OUT_DIR, name)
        target_name = name[: -len(".jpg")] + ".webp"
        target = os.path.join(OUT_DIR, target_name)
        with Image.open(source) as image:
            image.convert("RGB").save(target, quality=WEBP_QUALITY, method=6)
        os.remove(source)
        converted[target_name] = size

    manifest["images"] = converted
    manifest["format"] = "webp"
    manifest["webpQuality"] = WEBP_QUALITY
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    print(f"2x 图已转为 WebP（quality={WEBP_QUALITY}）：{len(converted)} 张")


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    pdf_path = os.path.abspath(sys.argv[1])
    if not os.path.exists(pdf_path):
        print(f"找不到 PDF：{pdf_path}")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    render(pdf_path, ONE_X, "manifest.json")
    render(pdf_path, TWO_X, "manifest@2x.json")
    convert_to_webp("manifest@2x.json")

    print("完成。接着运行：node generate_site.mjs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
