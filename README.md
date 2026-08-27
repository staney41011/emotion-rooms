# Emotion Rooms 情緒包廂

給課堂使用的手機互動 + 即時文字雲網站。

## 架構
- **GitHub**：原始碼與版本管理
- **Firebase Hosting**：正式網站部署
- **Firebase Realtime Database**：班員投稿、講師主控與投影即時同步
- **Firebase Authentication**：所有頁面背景使用 Anonymous Authentication，不顯示登入介面

## 正式網址
Firebase 專案 ID：`emotion-rooms`

- 公開入口：`https://emotion-rooms.web.app/`
- 講師主控：`https://emotion-rooms.web.app/admin`
- 投影畫面：`https://emotion-rooms.web.app/display`
- QR Code 列印：`https://emotion-rooms.web.app/qrcodes`
- 第 1 間：`https://emotion-rooms.web.app/student?room=room1`
- 第 2 間：`https://emotion-rooms.web.app/student?room=room2`
- 第 3 間：`https://emotion-rooms.web.app/student?room=room3`
- 第 4 間：`https://emotion-rooms.web.app/student?room=room4`
- 第 5 間：`https://emotion-rooms.web.app/student?room=room5`
- 第 6 間：`https://emotion-rooms.web.app/student?room=room6`
- 第 7 間：`https://emotion-rooms.web.app/student?room=room7`
- 第 8 間：`https://emotion-rooms.web.app/student?room=room8`

`firebase.json` 已啟用 `cleanUrls`，所以正式網址不需要 `.html`。

## 班員流程
班員不從首頁選擇包廂。每間包廂都有自己的 QR Code，完成體驗後重新掃描該包廂 QR Code，直接進入該間填寫頁。

班員畫面刻意不顯示：
- 包廂名稱
- 情緒 emoji
- 情緒提示問題
- 預設情緒詞
- 其他包廂選單

目的為避免暗示答案，讓參與者自行辨識感受。

## 講師與投影
`/admin` 是獨立講師主控頁；`/display` 是純投影頁。

講師在主控選擇「待機／第 1 間～第 8 間」後，Firebase 的 `emotionRooms/v1/currentRoom` 會即時更新，投影頁自動跟著切換，不需要操作投影電腦。

## Firebase 設定
- Realtime Database：`asia-southeast1`
- Authentication → Anonymous：已要求啟用
- Realtime Database Rules：使用 repo 根目錄 `database.rules.json`
- Web App 設定：`js/firebase-config.js`
- Firebase project alias：`.firebaserc` 指向 `emotion-rooms`

## Firebase Hosting 部署
repo 根目錄已包含 `firebase.json` 與 `.firebaserc`。

從已登入 Google 帳號的 Firebase CLI / Cloud Shell 執行：

```bash
git clone https://github.com/staney41011/emotion-rooms.git
cd emotion-rooms
firebase use emotion-rooms
firebase deploy --only hosting
```

若也要同步部署資料庫 Rules：

```bash
firebase deploy --only hosting,database
```

## QR Code
`/qrcodes` 會產生固定指向 `https://emotion-rooms.web.app/student?room=roomN` 的 8 張 QR Code。

畫面上顯示講師內部對照名稱，但列印時會自動隱藏，只印「第 N 間 + QR Code + 網址」。

## 資料結構
- `emotionRooms/v1/currentRoom`：投影目前顯示待機或哪一間
- `emotionRooms/v1/publicWords`：文字雲需要的 1～3 個感受詞與時間
- `emotionRooms/v1/privateComments`：選填文字留言，目前禁止公開讀取
- `emotionRooms/v1/locked`：投稿開關

## 講師操作模式
依目前課堂需求，不建立 Google／Email 管理員登入頁。

講師主控頁與投影頁不從公開首頁提供連結；講師自行保存網址。主控操作在背景使用 Firebase Anonymous Authentication，不會出現登入畫面。

這種方式屬於「網址隔離／操作隔離」，不是嚴格的身分權限隔離。若未來公開對外使用，應改用真正的管理員 Authentication / custom claims。
