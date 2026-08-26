# Emotion Rooms 情緒包廂

給課堂使用的手機互動 + 即時文字雲網站。

## 頁面
- `index.html`：入口
- `student.html`：班員選包廂與輸入情緒詞
- `display.html`：講師投影文字雲
- `admin.html`：講師控制台

## 目前版本
目前為 **Demo data mode**，使用 `localStorage + BroadcastChannel`：同一台電腦不同分頁可即時同步，適合先確認 UI 與課堂流程。

下一階段會把 `js/data-service.js` 替換為 Firebase Realtime Database 版本，讓不同手機與投影電腦真正跨裝置同步。

## GitHub Pages
Repository → Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`。

預期網址：`https://staney41011.github.io/emotion-rooms/`
