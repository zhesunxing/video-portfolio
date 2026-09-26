#!/usr/bin/env node
// Generates the static pages from works.json.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const works = JSON.parse(readFileSync(path.join(__dirname, "works.json"), "utf8"));

const PORTFOLIO_IMAGE_DIR = "assets/portfolio-pages-mobile";
const PORTFOLIO_SIZES =
  "(max-width: 700px) 100vw, (max-width: 1112px) calc(100vw - 32px), 1080px";
const GROUP_ORDER = ["kuaishou", "qunar", "vibe-coding"];
const GROUPS = {
  kuaishou: {
    id: "kuaishou-demos",
    label: "快手视觉特效",
    intro: "短视频视觉特效与互动效果演示。",
  },
  qunar: {
    id: "qunar-demos",
    label: "去哪儿旅行 · 红包弹窗 Demo",
    intro: "去哪儿旅行场景中的红包、机票与活动弹窗动效演示。",
  },
  "vibe-coding": {
    id: "vibe-coding-demo",
    label: "Vibe Coding · Icon 平台演示",
    intro: "实习期间完成的 Icon 制作平台演示，展示从需求到可用工具的 Vibe Coding 实践。",
  },
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function groupFor(work) {
  return GROUPS[work.group] ?? GROUPS.kuaishou;
}

function readPortfolioManifest(fileName) {
  try {
    return JSON.parse(
      readFileSync(path.join(__dirname, PORTFOLIO_IMAGE_DIR, fileName), "utf8")
    );
  } catch {
    return null;
  }
}

function portfolioStem(name) {
  return name.replace(/@2x\.(jpg|webp)$/i, "").replace(/\.(jpg|webp)$/i, "");
}

function renderIndexVideoCard(work) {
  const group = groupFor(work);
  return `        <a class="work-card" href="${work.slug}.html">
          <div class="thumb">
            <span class="index-no">${escapeHtml(work.id)}</span>
            <video src="${work.video}#t=0.5" muted playsinline preload="metadata"></video>
          </div>
          <div class="meta">
            <p class="card-kicker">${escapeHtml(group.label)}</p>
            <h3>${escapeHtml(work.title)}</h3>
            <p class="card-action">打开播放页 <span aria-hidden="true">↗</span></p>
          </div>
        </a>`;
}

function renderDemoCard(work) {
  return `          <article class="demo-card">
            <div class="demo-media">
              <video src="${work.video}" controls playsinline preload="metadata"></video>
            </div>
            <div class="demo-meta">
              <div>
                <p class="card-kicker">Demo ${escapeHtml(work.id)}</p>
                <h3>${escapeHtml(work.title)}</h3>
              </div>
              <a class="text-link" href="${work.slug}.html">独立播放页 <span aria-hidden="true">↗</span></a>
            </div>
          </article>`;
}

function renderGroupIndex(groupKey) {
  const group = GROUPS[groupKey];
  const groupWorks = works.filter((work) => work.group === groupKey);
  return `      <section class="work-section" aria-labelledby="${group.id}">
        <div class="section-heading">
          <div>
            <p class="eyebrow">动态 Demo</p>
            <h2 id="${group.id}">${escapeHtml(group.label)}</h2>
          </div>
          <p>${escapeHtml(group.intro)}</p>
        </div>
        <div class="works-grid">
${groupWorks.map(renderIndexVideoCard).join("\n")}
        </div>
      </section>`;
}

function renderIndex() {
  const pdfCard = `      <section class="featured-portfolio" aria-labelledby="featured-portfolio-title">
        <a class="featured-link" href="portfolio-pdf.html">
          <div>
            <p class="eyebrow">主内容 · PDF 作品集</p>
            <h2 id="featured-portfolio-title">侯吉昌 · 视觉设计作品集</h2>
            <p>在线逐页阅读版本，作品集 PDF 为主内容，手机扫码即可打开。</p>
          </div>
          <span class="featured-action">打开作品集 <span aria-hidden="true">↗</span></span>
        </a>
      </section>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>作品集 · 侯吉昌</title>
<meta name="description" content="侯吉昌的视觉设计作品集与动态 Demo。">
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <p class="eyebrow">精选作品 · 2026</p>
      <h1>作品集</h1>
      <p class="lede">视觉设计作品集为主，附带按项目方向整理的动态 Demo。</p>
    </div>
  </header>

  <main class="wrap index-main">
${pdfCard}
    <div class="directory-heading">
      <p class="eyebrow">补充内容 · 动态 Demo</p>
      <h2>动态 Demo</h2>
      <p>点击卡片进入独立播放页，也可以直接在作品集阅读页向下浏览。</p>
    </div>
${GROUP_ORDER.map(renderGroupIndex).join("\n")}
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>© 2026. 内容仅用于作品展示，禁止未经许可转载或商用。</p>
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
    ? `<a href="${prev.slug}.html">← ${escapeHtml(prev.title)}</a>`
    : `<span></span>`;
  const nextLink = next
    ? `<a href="${next.slug}.html">${escapeHtml(next.title)} →</a>`
    : `<span></span>`;
  const group = groupFor(work);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(work.title)} · 作品集 · 侯吉昌</title>
<meta name="description" content="${escapeHtml(group.label)}：${escapeHtml(work.title)} 动态 Demo。">
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="wrap work-header">
    <a class="back-link" href="index.html">← 返回作品集总览</a>
    <p class="eyebrow">${escapeHtml(group.label)} · Demo ${escapeHtml(work.id)}</p>
    <h1>${escapeHtml(work.title)}</h1>
  </div>

  <main class="player-frame">
    <video src="${work.video}" controls playsinline preload="metadata"></video>
  </main>

  <nav class="player-nav wrap" aria-label="相邻作品">
    ${prevLink}
    ${nextLink}
  </nav>

  <footer class="site-footer">
    <div class="wrap">
      <p>© 2026. 内容仅用于作品展示，禁止未经许可转载或商用。</p>
    </div>
  </footer>
</body>
</html>
`;
}

function renderPortfolioPage() {
  const base = readPortfolioManifest("manifest.json");
  if (!base) {
    throw new Error(`缺少 ${PORTFOLIO_IMAGE_DIR}/manifest.json，请先运行图片构建脚本`);
  }

  const retina = readPortfolioManifest("manifest@2x.json");
  const retinaByStem = new Map(
    Object.entries(retina?.images ?? {}).map(([name, size]) => [portfolioStem(name), [name, size]])
  );
  const imageNames = Object.keys(base.images).sort();
  const pageCount = base.pageCount;
  const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
    const pageNo = String(pageIndex + 1).padStart(2, "0");
    const pageImages = imageNames.filter((name) => name.startsWith(`page-${pageNo}-`));
    const chunks = pageImages
      .map((name, chunkIndex) => {
        const eager = pageIndex === 0 && chunkIndex === 0;
        const chunkLabel = pageImages.length > 1 ? `，第 ${chunkIndex + 1} 部分` : "";
        const [width, height] = base.images[name];
        const retinaEntry = retinaByStem.get(portfolioStem(name));
        const srcset = retinaEntry
          ? ` srcset="${PORTFOLIO_IMAGE_DIR}/${name} ${width}w, ${PORTFOLIO_IMAGE_DIR}/${retinaEntry[0]} ${retinaEntry[1][0]}w" sizes="${PORTFOLIO_SIZES}"`
          : "";
        return `        <img src="${PORTFOLIO_IMAGE_DIR}/${name}"${srcset} alt="视觉设计作品集第 ${pageIndex + 1} 页${chunkLabel}" width="${width}" height="${height}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>`;
      })
      .join("\n");

    return `      <section class="portfolio-page" aria-label="作品集第 ${pageIndex + 1} 页">
        <div class="page-marker"><span>${pageNo}</span><span>/ ${pageCount}</span></div>
${chunks}
      </section>`;
  }).join("\n");

  const demoGroups = GROUP_ORDER.map((groupKey) => {
    const group = GROUPS[groupKey];
    const groupWorks = works.filter((work) => work.group === groupKey);
    return `        <section class="demo-group" aria-labelledby="${group.id}-reader">
          <div class="demo-group-heading">
            <p class="eyebrow">${groupWorks.length} 个视频 Demo</p>
            <h3 id="${group.id}-reader">${escapeHtml(group.label)}</h3>
            <p>${escapeHtml(group.intro)}</p>
          </div>
          <div class="demo-grid">
${groupWorks.map(renderDemoCard).join("\n")}
          </div>
        </section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>视觉设计作品集 · 侯吉昌</title>
<meta name="description" content="侯吉昌视觉设计作品集在线阅读页，附快手视觉特效与去哪儿旅行红包弹窗动态 Demo。">
<link rel="stylesheet" href="styles.css">
</head>
<body class="portfolio-reader">
  <header class="reader-header">
    <div class="reader-bar">
      <a class="back-link reader-back" href="index.html">← 返回作品集总览</a>
      <div class="reader-title">
        <p class="eyebrow">侯吉昌 · 视觉设计</p>
        <h1>作品集</h1>
      </div>
      <nav class="reader-toc" aria-label="页面导航">
        <a href="#pdf-portfolio">PDF 作品集</a>
        <a href="#motion-demos">动态 Demo</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="reader-section pdf-section" id="pdf-portfolio" aria-labelledby="pdf-title">
      <div class="reader-section-heading">
        <p class="eyebrow">主内容 · PDF 作品集</p>
        <h2 id="pdf-title">侯吉昌 · 视觉设计作品集</h2>
        <p>完整作品集在线阅读版，共 ${pageCount} 页。向下滚动查看全部内容。</p>
      </div>
      <div class="portfolio-pages">
${pages}
      </div>
    </section>

    <section class="reader-section demo-showcase" id="motion-demos" aria-labelledby="motion-demos-title">
      <div class="reader-section-heading">
        <p class="eyebrow">补充内容 · 动态 Demo</p>
        <h2 id="motion-demos-title">动态 Demo</h2>
        <p>以下内容是作品集中的动态补充展示。点击视频控件即可播放，也可进入对应独立播放页。</p>
      </div>
${demoGroups}
    </section>
  </main>

  <nav class="reader-end-nav" aria-label="作品集结束导航">
    <a class="back-link" href="index.html">← 返回作品集总览</a>
    <a class="text-link" href="#pdf-portfolio">回到 PDF 作品集 ↑</a>
  </nav>

  <footer class="site-footer reader-footer">
    <div class="wrap">
      <p>© 2026. 内容仅用于作品展示，禁止未经许可转载或商用。</p>
    </div>
  </footer>
</body>
</html>
`;
}

writeFileSync(path.join(__dirname, "index.html"), renderIndex());
works.forEach((work, index) => {
  writeFileSync(path.join(__dirname, `${work.slug}.html`), renderWorkPage(work, index));
});
writeFileSync(path.join(__dirname, "portfolio-pdf.html"), renderPortfolioPage());

console.log(`Generated index.html + ${works.length} work pages + portfolio-pdf.html.`);
