# Emotion Rooms 情緒包廂

給課堂使用的手機互動 + 即時文字雲網站。

## 架構
- **GitHub**：原始碼與版本管理
- **Firebase Hosting**：正式網站部署
- **Firebase Realtime Database**：班員投稿與投影文字雲即時同步
- **Firebase Authentication**：下一階段用於講師管理權限

## 頁面
- `index.html`：入口
- `student.html`：班員選包廂與輸入情緒詞
- `display.html`：講師投影文字雲
- `admin.html`：講師控制台

## 資料模式
網站支援兩種模式：

1. **Demo 模式**：`js/firebase-config.js` 尚未填入 Firebase 設定時，自動使用 `localStorage + BroadcastChannel`。
2. **Firebase 模式**：填入 Firebase Web App 設定後，自動切換為 Firebase Realtime Database，即可跨手機／投影電腦即時同步。

## Firebase 專案設定
1. 在 Firebase Console 建立或選擇專案。
2. 建立 **Realtime Database**，台灣課堂建議選 `asia-southeast1`（Singapore）。
3. 在 Project settings → Your apps 新增 Web App，取得 `firebaseConfig`。
4. 把 `firebaseConfig` 的內容填入 `js/firebase-config.js`。
5. 到 Realtime Database → Rules，把 `database.rules.json` 內容貼上並 Publish；或使用 Firebase CLI 部署。
6. 啟用 Firebase Hosting。

## Firebase Hosting
本 repo 已經設定好 `firebase.json`：
- Hosting 直接部署目前專案根目錄
- `firebase.json`、`database.rules.json`、README、Git/GitHub 相關檔案不會公開部署
- 啟用 clean URLs，例如 `/student.html` 會導向 `/student`
- HTML 與 Firebase config 採低快取，方便更新後快速生效

第一次部署：

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only hosting,database
```

之後更新網站通常只需要：

```bash
firebase deploy --only hosting
```

正式網址會是：
- `https://<project-id>.web.app`
- `https://<project-id>.firebaseapp.com`

## 資料結構與隱私
- `emotionRooms/v1/publicWords`：只存文字雲需要的情緒詞與時間，可由投影端即時讀取。
- `emotionRooms/v1/privateComments`：存完整留言；目前規則禁止公開讀取，之後接講師管理員登入才開放。
- `emotionRooms/v1/locked`：投稿開關；之後由講師登入權限控制。

目前 Firebase 版先開放班員「新增投稿」，禁止修改／刪除既有投稿；講師的清空、暫停投稿與完整留言讀取會在下一階段加入 Firebase Authentication 管理員權限。
