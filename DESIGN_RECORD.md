# 设计与实现记录

## PDF 手机阅读页设计记录（2026-09-24）

Mode: C-in-Existing

Scene: 内容站 / 文档站 — `references/website-design/scenes/content-doc.md`

Scene Rules Applied:

- 阅读体验优先，页面颜色密度低，版式服务于内容。
- 移动端采用单列，内容宽度随视口缩放，左右保留安全边距。
- 图片保持原始比例，不裁切；长页按滚动阅读方式呈现。

Theme: C — 编辑排版 — `references/website-design/themes/C-editorial.md`

Theme Tokens Applied:

- 暖白页面底色 `#f6f3ee` → 复用现有 `--color-bg`。
- 近黑正文 `#17140f` → 复用现有 `--color-ink`。
- 暖灰边框 `#ddd6c9` → 复用现有 `--color-hairline`。
- 克制赭石强调色 `#a34b32` → 仅用于链接与焦点状态。

Purpose: 让招聘方在微信或手机浏览器扫码后快速、稳定地阅读视觉设计作品集。

Tone: 编辑排版、克制、内容优先。

Differentiation: 作品页保留原设计比例，首张优先显示，其余页面原生懒加载；长项目页可连续纵向阅读，扫码不触发文件下载。

Loaded Files:

- `references/website-design/website-design.md`
- `references/website-design/scenes/content-doc.md`
- `references/website-design/themes/C-editorial.md`
- `references/website-design/core/responsive-spec.md`
- `references/website-design/core/accessibility.md`

New Structure Scope: 新增 `portfolio-pdf.html` 阅读页及首页作品集入口。

Protected Existing Scope: 12 个视频播放页、视频资源与播放逻辑不改动。

Self-Checks Required:

- 通用：无 Emoji、无内容裁切、对比度达到 WCAG AA、键盘焦点可见。
- 场景：移动端单列、图片保持比例、正文与控件可读。
- 主题：暖白底、近黑文字、无渐变装饰、强调色克制。
- 专项：320px 起可用，触控按钮高度不低于 44px，图片具备替代文本。

Self-Check Results:

- Source: 通用 P0（无 Emoji、无裁切、焦点可见）
  Result: pass
  Fix: none
  Recheck: pass
- Source: Content Doc（单列阅读、图片保持比例、移动端适配）
  Result: pass
  Fix: 将超长 PDF 页拆成最高 1800px 的连续图片分片
  Recheck: pass
- Source: Theme C（暖白底、近黑文字、无渐变装饰）
  Result: pass
  Fix: none
  Recheck: pass
- Source: Responsive / Accessibility（354px 实机视口、替代文本、44px 触控目标）
  Result: pass
  Fix: 补齐图片固有宽高，避免懒加载时布局跳动
  Recheck: pass
- Source: 浏览器回归（页面结构、图片请求、PDF 下载链接）
  Result: pass
  Fix: 二维码改指向 `portfolio-pdf.html`，阅读页移除 PDF 下载入口
  Recheck: pass

## 目标

面向外部招聘方与客户的视频作品集网站。免费 GitHub Pages 托管（个人账号 zhesunxing），无自定义域名，公开访问、无登录、无广告。11 个作品，每个有独立播放页与固定网址，并配二维码方便扫码直达。

## 风格取向

参考 Vimeo Showcase 的观看动线和 A24 式留白：暖白纸感背景（`#f6f3ee`）、近黑墨色文字、克制的赭石色点缀（`#a34b32`），衬线标题 + 无衬线正文，网格卡片展示，无渐变、无自动播放、无装饰动效。移动端断点：860px 切两栏，560px 切单栏。

## 视频处理

源文件位于 `~/Desktop/视频转二维码/`（中文文件名，约 220MB，含 HEVC/H.264 混合编码）。用便携版 ffmpeg（evermeet.cx 静态构建）统一转码：

- 视频：H.264 (libx264)，CRF 21，veryfast preset
- 音频：AAC 128kbps 44.1kHz（原 PCM 音轨一并转换）
- 容器：-movflags +faststart，moov atom 前置，支持边下边播
- 长边限制 1920px（原 4K/2.5K 源做等比缩放）
- 输出文件名改为英文 slug，避免 URL 编码问题

转码后总体积约 38MB（压缩前约 220MB），单文件最大约 7MB，远低于 GitHub 100MB 限制。

## 页面生成

works.json 是唯一数据源（id/slug/title/titleEn/video）。generate_site.mjs 用 Node 读取 works.json 渲染 index.html 和 work-XX.html。新增/修改/删除作品只需编辑 works.json 后重新运行：

node generate_site.mjs

不要手工编辑生成出的 HTML 文件，改动会在下次生成时被覆盖。

## 托管

- 仓库：zhesunxing/video-portfolio（个人账号，公开仓库）
- GitHub Pages：Deploy from a branch，Branch = main，Folder = /root
- 正式地址：https://zhesunxing.github.io/video-portfolio/
- 不使用自定义域名、不使用任何内部/公司托管

## 安全提醒

仓库是公开的，视频文件本身会被公开访问并可被任何人下载。发布前需确认 11 个视频里没有保密信息、未授权出镜人物或客户机密内容。

## 换电脑后如何继续修改

1. 克隆仓库：git clone https://github.com/zhesunxing/video-portfolio.git
2. 改动 works.json（增删作品）或替换 assets/videos/ 下的视频文件
3. 本机需要 Node.js（生成页面）和 ffmpeg（如需重新转码新视频）
4. 跑 node generate_site.mjs 重新生成页面
5. git add -A && git commit -m "update" && git push
6. GitHub Pages 会在推送后自动重新部署，通常 1-2 分钟生效

## 二维码

qrcodes/ 目录存放 11 个作品的 PNG + SVG 二维码，文件名格式 <序号>-<英文slug>.png / .svg，指向对应作品的正式播放地址。links.csv 记录序号、作品名称、正式播放地址、PNG 路径、SVG 路径的完整对照表。
