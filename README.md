# Emotion Rooms 情緒包廂

給課堂使用的手機互動 + 即時文字雲網站。

## 頁面
- `index.html`：入口
- `student.html`：班員選包廂與輸入情緒詞
- `display.html`：講師投影文字雲
- `admin.html`：講師控制台

## 資料模式
網站現在支援兩種模式：

1. **Demo 模式**：`js/firebase-config.js` 尚未填入 Firebase 設定時，自動使用 `localStorage + BroadcastChannel`。
2. **Firebase 模式**：填入 Firebase Web App 設定後，自動切換為 Firebase Realtime Database，即可跨手機／投影電腦即時同步。

Firebase Web SDK 使用官方 CDN 模組版本 `12.18.0`。

## Firebase 設定
1. 在 Firebase Console 建立或選擇專案。
2. 建立 **Realtime Database**，台灣課堂建議選 `asia-southeast1`（Singapore）。
3. 在 Project settings → Your apps 新增 Web App，取得 `firebaseConfig`。
4. 把 `firebaseConfig` 的內容填入 `js/firebase-config.js`。
5. 到 Realtime Database → Rules，把 `database.rules.json` 內容貼上並 Publish；或使用 Firebase CLI 部署。

### 資料結構與隱私
- `emotionRooms/v1/publicWords`：只存文字雲需要的情緒詞與時間，可由投影端即時讀取。
- `emotionRooms/v1/privateComments`：存完整留言；目前規則禁止公開讀取，之後接講師管理員登入才開放。
- `emotionRooms/v1/locked`：投稿開關；之後由講師登入權限控制。

目前 Firebase 版先開放班員「新增投稿」，禁止修改／刪除既有投稿；講師的清空、暫停投稿與完整留言讀取會在下一階段加入 Firebase Authentication 管理員權限。

## GitHub Pages
Repository → Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`。

預期網址：`https://staney41011.github.io/emotion-rooms/`
