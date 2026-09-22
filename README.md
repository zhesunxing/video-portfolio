# video-portfolio

视频作品集网站，用于向招聘方与客户展示项目 demo。

- 在线地址：https://zhesunxing.github.io/video-portfolio/
- 托管：GitHub Pages（Deploy from a branch，main 分支，/root 目录）
- 内容：`index.html` 总览页 + `work-01.html`～`work-11.html` 11 个独立播放页

## 本地开发

1. 编辑 `works.json` 增删改作品
2. 运行 `node generate_site.mjs` 重新生成所有 HTML 页面
3. 提交并推送到 `main`，GitHub Pages 会自动重新部署

详细说明见 [DESIGN_RECORD.md](DESIGN_RECORD.md)。

## 二维码

`qrcodes/` 目录内含每个作品的 PNG + SVG 二维码，`links.csv` 是完整对照表。
