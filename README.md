# Emotion Rooms 情緒包廂

給課堂使用的手機互動 + 即時文字雲網站。

## 架構
- **GitHub / GitHub Pages**：原始碼、版本管理與網站部署
- **Firebase Realtime Database**：班員投稿與投影文字雲即時同步
- **Firebase Authentication**：所有頁面背景使用 Anonymous Authentication，不顯示登入介面

## 班員流程
班員不從首頁選擇包廂。

每間包廂都有獨立 QR Code：
- `student.html?room=room1`
- `student.html?room=room2`
- `student.html?room=room3`
- `student.html?room=room4`
- `student.html?room=room5`
- `student.html?room=room6`
- `student.html?room=room7`
- `student.html?room=room8`

班員完成一間體驗後，重新掃描該包廂 QR Code，直接進入該間填寫頁。

班員畫面刻意不顯示：
- 包廂名稱
- 情緒 emoji
- 情緒提示問題
- 預設情緒詞
- 其他包廂選單

目的為避免在體驗前後暗示答案，讓參與者自行辨識感受。

若直接開啟 `student.html` 而沒有合法 `room` 參數，只會看到「請掃描現場 QR Code」。

## 頁面
- `index.html`：公開入口，只提示掃描現場 QR Code，不顯示講師網址
- `student.html?room=roomN`：班員各包廂回填
- `display.html`：講師投影文字雲，活動中只顯示「第 N 間」
- `admin.html`：講師控制台
- `qrcodes.html`：講師 QR Code 產生與列印頁

`qrcodes.html` 畫面上會顯示講師內部對照名稱，但列印時會自動隱藏，只印「第 N 間 + QR Code + 網址」。

## Firebase
Firebase 專案：`emotion-rooms`

Realtime Database：`asia-southeast1`。

請確認：
1. Authentication → Sign-in method → **Anonymous** 已啟用。
2. Realtime Database → Rules 使用 repo 最新版 `database.rules.json` 並 Publish。
3. `js/firebase-config.js` 已填入 Firebase Web App 設定。

## GitHub Pages
Repository → Settings → Pages → Build and deployment：
- Source：Deploy from a branch
- Branch：`main`
- Folder：`/(root)`

預期網址：
- 公開入口：`https://staney41011.github.io/emotion-rooms/`
- 投影：`https://staney41011.github.io/emotion-rooms/display.html`
- 控制台：`https://staney41011.github.io/emotion-rooms/admin.html`
- QR 列印：`https://staney41011.github.io/emotion-rooms/qrcodes.html`

## 資料結構
- `emotionRooms/v1/publicWords`：文字雲需要的 1～3 個感受詞與時間
- `emotionRooms/v1/privateComments`：選填文字留言，目前禁止公開讀取
- `emotionRooms/v1/locked`：投稿開關

## 講師操作模式
依目前課堂需求，不建立 Google／Email 管理員登入頁。

講師主控頁與投影頁不從公開首頁提供連結；講師自行保存網址。主控操作在背景使用 Firebase Anonymous Authentication，不會出現登入畫面。

這種方式屬於「網址隔離／操作隔離」，不是嚴格的身分權限隔離。適合封閉課堂與可信任參與者；若未來公開對外使用，應改用真正的管理員 Authentication / custom claims。
