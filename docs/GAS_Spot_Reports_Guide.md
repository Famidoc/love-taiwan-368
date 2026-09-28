# 🇹🇼 愛台灣 368 行腳 - 社群回報 (店家歇業 / 找不到) 後端 Google Apps Script 升級指南

本文件提供 Google Apps Script (GAS) 的後端程式碼擴充範例。若您希望將使用者的「回報店家歇業 / 地圖找不到」資料自動儲存到 Google 試算表並提供雲端同步，請依照以下步驟更新您的 Google Apps Script。

---

## 🛠️ 設定步驟

1. 打開您的 Google 試算表（《愛台灣368行腳_社群榜》）。
2. 在試算表下方新增一個工作表分頁，名稱命名為：`回報記錄`。
3. 第一列（A1~H1）填入欄位標題：
   - A1: `時間`
   - B1: `鄉鎮編號`
   - C1: `地點代碼`
   - D1: `地點名稱`
   - E1: `類別`
   - F1: `回報原因`
   - G1: `備註`
   - H1: `回報者ID`
4. 點選試算表選單中的 **「擴充功能」 -> 「Apps Script」**。
5. 在現有的腳本代碼中，將下方的處理邏輯整合進 `doGet` 與 `doPost` 中。
6. 點選右上角 **「部署」 -> 「管理部署作業」 -> 編輯 -> 新版本 -> 部署** 即可！

---

## 💻 Apps Script 參考代碼片段

```javascript
/**
 * 處理 GET 請求 (擴充支援讀取社群回報名單)
 */
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';

  // 1. 讀取回報店家清單
  if (action === 'get_spot_reports') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('回報記錄');
    var reportsMap = {};

    if (sheet && sheet.getLastRow() > 1) {
      var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
      data.forEach(function(row) {
        var spotId = String(row[2]);
        var spotName = String(row[3]);
        var spotType = String(row[4]);
        var reason = String(row[5]);
        var note = String(row[6]);
        var userId = String(row[7]);
        var time = row[0];

        if (!reportsMap[spotId]) {
          reportsMap[spotId] = {
            spotId: spotId,
            spotName: spotName,
            spotType: spotType,
            reason: reason,
            count: 0,
            reporters: [],
            notes: [],
            updatedAt: time
          };
        }

        reportsMap[spotId].count += 1;
        if (userId && reportsMap[spotId].reporters.indexOf(userId) === -1) {
          reportsMap[spotId].reporters.push(userId);
        }
        if (note && reportsMap[spotId].notes.indexOf(note) === -1) {
          reportsMap[spotId].notes.push(note);
        }
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: reportsMap
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. 預設：回傳排行榜風雲榜資料
  return handleGetLeaderboard();
}

/**
 * 處理 POST 請求 (擴充支援店家狀態回報)
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);

    // 1. 若為店家狀態回報
    if (payload.action === 'report_spot') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('回報記錄');
      if (!sheet) {
        sheet = ss.insertSheet('回報記錄');
        sheet.appendRow(['時間', '鄉鎮編號', '地點代碼', '地點名稱', '類別', '回報原因', '備註', '回報者ID']);
      }

      sheet.appendRow([
        payload.reportedAt || new Date().toISOString(),
        payload.districtId || '',
        payload.spotId || '',
        payload.spotName || '',
        payload.spotType || '',
        payload.reason || '',
        payload.note || '',
        payload.userId || ''
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Report recorded'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 預設：處理排行榜資料寫入
    return handlePostLeaderboard(payload);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 💡 設計特點
- **無縫向下相容**：即使尚未部署此 GAS 代碼，App 前端亦已具備 LocalStorage 快取與預設容錯機制，使用者依然能正常回報、平反並即刻看到警示標籤！
- **平反與撤銷機制**：使用者若選擇「我確認現場正常營業中」，App 會主動清除錯誤的歇業警示，防止誤報或資料污染。
