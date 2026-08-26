# Emotion Rooms 情緒包廂

給課堂使用的手機互動 + 即時文字雲網站。

## 架構
- **GitHub / GitHub Pages**：原始碼、版本管理與網站部署
- **Firebase Realtime Database**：班員投稿與投影文字雲即時同步
- **Firebase Authentication**：班員使用匿名登入；講師管理員登入之後再加入

## 頁面
- `index.html`：入口
- `student.html`：班員選包廂與輸入情緒詞
- `display.html`：講師投影文字雲
- `admin.html`：講師控制台

## 資料模式
網站支援兩種模式：

1. **Demo 模式**：`js/firebase-config.js` 尚未填入 Firebase 設定時，自動使用 `localStorage + BroadcastChannel`。
2. **Firebase 模式**：填入 Firebase Web App 設定後，自動切換為 Firebase Realtime Database，即可跨手機／投影電腦即時同步。

目前 `emotion-rooms` 已填入 Firebase Web App 設定，因此正式頁面會使用 Firebase 模式。

## Firebase 專案設定
1. 建立 **Realtime Database**，位置使用 `asia-southeast1`（Singapore）。
2. Authentication → Sign-in method → **Anonymous** → Enable → Save。
3. Realtime Database → Rules，把 repo 根目錄的 `database.rules.json` 全部貼上並 Publish。
4. Project settings → Your apps 的 Web App 設定已放入 `js/firebase-config.js`。

## GitHub Pages
Repository → Settings → Pages → Build and deployment：
- Source：Deploy from a branch
- Branch：`main`
- Folder：`/(root)`

預期網址：
- `https://staney41011.github.io/emotion-rooms/`
- 班員：`https://staney41011.github.io/emotion-rooms/student.html`
- 投影：`https://staney41011.github.io/emotion-rooms/display.html`
- 控制台：`https://staney41011.github.io/emotion-rooms/admin.html`

## 資料結構與隱私
- `emotionRooms/v1/publicWords`：只存文字雲需要的情緒詞與時間，可由投影端即時讀取。
- `emotionRooms/v1/privateComments`：存完整留言；目前規則禁止公開讀取，之後接講師管理員登入才開放。
- `emotionRooms/v1/locked`：投稿開關；之後由講師登入權限控制。

### 班員權限
班員不需要建立帳號。網頁會透過 Firebase Anonymous Authentication 自動取得匿名身分後投稿。

目前規則允許已驗證的匿名使用者「新增」投稿，但禁止修改或刪除既有投稿。

### 講師權限
目前講師端可公開讀取情緒詞以呈現文字雲；完整留言、暫停投稿、清空資料等高權限操作，下一階段會加上講師 Firebase Authentication 與專屬管理權限。
