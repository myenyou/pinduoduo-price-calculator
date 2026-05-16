# 拼多多价格计算器 Chrome 扩展

这是一个本地 Chrome 扩展，点击浏览器工具栏图标后会在浏览器右侧打开价格计算器侧边栏。

## 本地安装

1. 打开 Chrome，进入 `chrome://extensions/`。
2. 打开右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择这个项目文件夹：`E:\pinduoduo-price-calculator`。
5. 在工具栏固定「拼多多价格计算器」后，点击图标即可打开右侧侧边栏。

如果扩展已经加载过，修改文件后需要在 `chrome://extensions/` 里点击该扩展卡片上的「重新加载」按钮。

## 文件说明

- `manifest.json`：Chrome 扩展配置。
- `background.js`：设置点击扩展图标时打开右侧侧边栏。
- `index.html`：普通 HTML 页面，可直接在浏览器里打开使用。
- `sidepanel.html`：扩展侧边栏页面。
- `sidepanel.css`：本地样式，替代扩展里不能直接使用的 Tailwind CDN。
- `sidepanel.js`：计算逻辑，替代扩展里不能使用的内联脚本。
