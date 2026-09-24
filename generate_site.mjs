#!/usr/bin/env node
// Generates index.html and work-XX.html from works.json + templates below.
// Run: node generate_site.mjs
// This keeps the site reproducible after editing works.json (add/remove/
// rename works) without hand-editing every HTML file.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const works = JSON.parse(readFileSync(path.join(__dirname, "works.json"), "utf8"));

const PORTFOLIO_IMAGE_DIMENSIONS = {
  "page-01-part-01.jpg": [1080, 607],
  "page-02-part-01.jpg": [1080, 607],
  "page-03-part-01.jpg": [1080, 607],
  "page-04-part-01.jpg": [1079, 357],
  "page-05-part-01.jpg": [1079, 1800],
  "page-05-part-02.jpg": [1079, 1800],
  "page-05-part-03.jpg": [1079, 1800],
  "page-05-part-04.jpg": [1079, 1560],
  "page-06-part-01.jpg": [1079, 1800],
  "page-06-part-02.jpg": [1079, 1800],
  "page-06-part-03.jpg": [1079, 1800],
  "page-06-part-04.jpg": [1079, 1800],
  "page-06-part-05.jpg": [1079, 322],
  "page-07-part-01.jpg": [1079, 1800],
  "page-07-part-02.jpg": [1079, 1800],
  "page-07-part-03.jpg": [1079, 1800],
  "page-07-part-04.jpg": [1079, 1466],
  "page-08-part-01.jpg": [1079, 1800],
  "page-08-part-02.jpg": [1079, 1800],
  "page-08-part-03.jpg": [1079, 1742],
  "page-09-part-01.jpg": [1079, 357],
  "page-10-part-01.jpg": [1079, 1800],
  "page-10-part-02.jpg": [1079, 1800],
  "page-10-part-03.jpg": [1079, 1703],
  "page-11-part-01.jpg": [1080, 1800],
  "page-11-part-02.jpg": [1080, 1680],
  "page-12-part-01.jpg": [1079, 357],
  "page-13-part-01.jpg": [1080, 1800],
  "page-13-part-02.jpg": [1080, 1800],
  "page-13-part-03.jpg": [1080, 1517],
  "page-14-part-01.jpg": [1079, 1800],
  "page-14-part-02.jpg": [1079, 1800],
  "page-14-part-03.jpg": [1079, 1800],
  "page-14-part-04.jpg": [1079, 1800],
  "page-14-part-05.jpg": [1079, 302],
  "page-15-part-01.jpg": [1079, 1800],
  "page-15-part-02.jpg": [1079, 1800],
  "page-15-part-03.jpg": [1079, 1800],
  "page-15-part-04.jpg": [1079, 1800],
  "page-15-part-05.jpg": [1079, 1091],
  "page-16-part-01.jpg": [1080, 1800],
  "page-16-part-02.jpg": [1080, 574],
  "page-17-part-01.jpg": [1080, 594],
};

const SITE_TITLE = "作品集 · Video Portfolio";
const SITE_LEDE = "一组用于招聘方与客户预览的产品动效与运营视觉演示，按发布顺序呈现，点击任意作品进入独立播放页。";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderIndex() {
  const cards = works
    .map(
      (w) => `      <a class="work-card" href="${w.slug}.html">
        <div class="thumb">
          <span class="index-no">${w.id}</span>
          <video src="${w.video}#t=0.5" muted playsinline preload="metadata"></video>
        </div>
        <div class="meta">
          <h2>${escapeHtml(w.title)}</h2>
          <p class="title-en">${escapeHtml(w.titleEn)}</p>
        </div>
      </a>`
    )
    .join("\n");

  const resumeCard = `      <a class="work-card" href="portfolio-pdf.html">
        <div class="thumb">
          <span class="index-no">PDF</span>
          <div class="thumb-placeholder">视觉设计作品集</div>
        </div>
        <div class="meta">
          <h2>视觉设计作品集</h2>
          <p class="title-en">Visual Design Portfolio</p>
        </div>
      </a>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${SITE_TITLE}</title>
<meta name="description" content="${SITE_LEDE}">
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <p class="eyebrow">Selected Works · 2026</p>
      <h1>作品集</h1>
      <p class="lede">${SITE_LEDE}</p>
    </div>
  </header>

  <main class="wrap">
    <div class="works-grid">
${cards}
${resumeCard}
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>&copy; 2026. 内容仅用于作品展示，禁止未经许可转载或商用。</p>
    </div>
  </footer>
</body>
</html>
`;
}

function renderWorkPage(work, index) {
  const prev = works[index - 1];
  const next = works[index + 1];
  const prevLink = prev
    ? `<a href="${prev.slug}.html">&larr; ${escapeHtml(prev.title)}</a>`
    : `<span></span>`;
  const nextLink = next
    ? `<a href="${next.slug}.html">${escapeHtml(next.title)} &rarr;</a>`
    : `<span></span>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(work.title)} · ${SITE_TITLE}</title>
<meta name="description" content="${escapeHtml(work.title)} — ${escapeHtml(work.titleEn)}">
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="wrap work-header">
    <a class="back-link" href="index.html">&larr; 返回作品集</a>
    <p class="eyebrow">Work ${work.id}</p>
    <h1>${escapeHtml(work.title)}</h1>
    <p class="title-en">${escapeHtml(work.titleEn)}</p>
  </div>

  <main class="player-frame">
    <video src="${work.video}" controls playsinline preload="metadata"></video>
  </main>

  <nav class="player-nav wrap">
    ${prevLink}
    ${nextLink}
  </nav>

  <footer class="site-footer">
    <div class="wrap">
      <p>&copy; 2026. 内容仅用于作品展示，禁止未经许可转载或商用。</p>
    </div>
  </footer>
</body>
</html>
`;
}

function renderPortfolioPage() {
  const imageDir = path.join(__dirname, "assets", "portfolio-pages-mobile");
  const images = readdirSync(imageDir)
    .filter((name) => /^page-\d{2}-part-\d{2}\.jpg$/.test(name))
    .sort();

  const pages = Array.from({ length: 17 }, (_, pageIndex) => {
    const pageNo = String(pageIndex + 1).padStart(2, "0");
    const pageImages = images.filter((name) => name.startsWith(`page-${pageNo}-`));
    const chunks = pageImages
      .map((name, chunkIndex) => {
        const eager = pageIndex === 0 && chunkIndex === 0;
        const chunkLabel = pageImages.length > 1 ? `，第 ${chunkIndex + 1} 部分` : "";
        const [width, height] = PORTFOLIO_IMAGE_DIMENSIONS[name];
        return `        <img src="assets/portfolio-pages-mobile/${name}" alt="视觉设计作品集第 ${pageIndex + 1} 页${chunkLabel}" width="${width}" height="${height}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>`;
      })
      .join("\n");

    return `      <section class="portfolio-page" aria-label="作品集第 ${pageIndex + 1} 页">
        <p class="page-marker">${pageNo} / 17</p>
${chunks}
      </section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>视觉设计作品集 · 侯吉昌</title>
<meta name="description" content="侯吉昌视觉设计作品集，针对手机浏览优化的在线阅读版本。">
<link rel="stylesheet" href="styles.css">
</head>
<body class="portfolio-reader">
  <header class="reader-header">
    <div class="reader-bar">
      <a class="back-link reader-back" href="index.html">&larr; 返回作品集</a>
      <div class="reader-title">
        <p class="eyebrow">Visual Design Portfolio · 2026</p>
        <h1>侯吉昌 · 视觉设计作品集</h1>
      </div>
    </div>
  </header>

  <main class="portfolio-pages">
${pages}
  </main>

  <footer class="site-footer reader-footer">
    <div class="wrap">
      <p>&copy; 2026. 内容仅用于作品展示，禁止未经许可转载或商用。</p>
    </div>
  </footer>
</body>
</html>
`;
}

writeFileSync(path.join(__dirname, "index.html"), renderIndex());
works.forEach((w, i) => {
  writeFileSync(path.join(__dirname, `${w.slug}.html`), renderWorkPage(w, i));
});
writeFileSync(path.join(__dirname, "portfolio-pdf.html"), renderPortfolioPage());

console.log(`Generated index.html + ${works.length} work pages + portfolio-pdf.html.`);
