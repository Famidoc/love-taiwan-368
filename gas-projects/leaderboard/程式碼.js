/**
 * 【愛台灣368行腳】公開排行榜與社群回報後端 (GAS API)
 * v1.2.0 - 升級：支援社群店家歇業 / 地圖找不到回報與平反機制
 *
 * 功能清單：
 * 1. [風雲榜] 排行榜讀取與更新 (支援 visitedDistrictIds 先行者紀錄)
 * 2. [安全] 數值範圍驗證、字串清理、防刷榜速率限制 (同一 userId 每 60 秒限更新一次)
 * 3. [社群回報] 記錄店家歇業 / 地圖找不到 / 恢復營業平反
 * 4. [雙向支援] doGet 支援 action=get_spot_reports，doPost 支援 action=report_spot
 */

// ============================================================
// 常數設定
// ============================================================
var MAX_TOWNSHIPS = 368;
var MAX_SPOTS = 2208;           // 368 × 6（每鄉鎮最多 6 個打卡點）
var MAX_NICKNAME_LEN = 15;
var MAX_BIO_LEN = 30;
var MAX_LAST_DISTRICT_LEN = 20;
var MAX_LEADERBOARD_ROWS = 2000; // 試算表最多保留 2000 筆用戶
var RATE_LIMIT_SECONDS = 60;     // 同一 userId 最少間隔 60 秒才能更新

// badge 白名單（與前端 calculateBadge 完全一致）
var VALID_BADGES = ['環島傳奇', '行腳大師', '百岳行者', '行腳先鋒', '探路新星', '行腳啟程'];

// ============================================================
// GET：分流處理「排行榜」或「社群店家回報」
// ============================================================
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';

  // 1. 取得社群店家回報清單
  if (action === 'get_spot_reports') {
    return handleGetSpotReports();
  }

  // 2. 預設：取得排行榜資料
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();
  var result = [];

  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue; // 跳過空列

      // 解析 visitedDistrictIds（第 12 欄，JSON 陣列字串）
      var visitedIds = [];
      try {
        if (row[11]) visitedIds = JSON.parse(row[11]);
      } catch (parseErr) {
        visitedIds = [];
      }

      result.push({
        id: String(row[0]),
        nickname: String(row[1] || '台灣行腳勇者'),
        avatar: String(row[2] || '🇹🇼'),
        bio: String(row[3] || ''),
        unlockedTownships: Number(row[4]) || 0,
        totalSpots: Number(row[5]) || 0,
        completionRate: Number(row[6]) || 0,
        badge: String(row[7] || '行腳啟程'),
        badgeColor: String(row[8] || 'bg-slate-100 text-slate-600 border border-slate-200'),
        lastDistrict: String(row[9] || '尚無紀錄'),
        lastActive: formatTimeAgo(new Date(row[10] || new Date())),
        visitedDistrictIds: visitedIds  // ← 先行者功能所需
      });
    }
  }

  // 依踏破鄉鎮數降序排序
  result.sort(function (a, b) {
    return b.unlockedTownships - a.unlockedTownships;
  });

  return jsonResponse({ status: 'success', data: result });
}

// ============================================================
// POST：分流處理「排行榜更新」或「店家狀態回報」
// ============================================================
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    // ── 分流 1：社群店家歇業/找不到/平反回報 ──
    if (payload && payload.action === 'report_spot') {
      return handlePostSpotReport(payload);
    }

    // ── 分流 2：排行榜進度更新 ──
    var userId = String(payload.userId || '').trim();
    if (!userId || userId.length > 60) {
      return jsonResponse({ status: 'error', message: 'Invalid userId' });
    }

    var sheet = getOrCreateSheet();
    var data = sheet.getDataRange().getValues();

    // 步驟 2：若用戶設為不公開，從試算表移除
    if (payload.isPublic === false) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === userId) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return jsonResponse({ status: 'success', message: 'Removed private user' });
    }

    // 步驟 3：速率限制（同一 userId 每 60 秒只能更新一次）
    var props = PropertiesService.getScriptProperties();
    var rateLimitKey = 'rl_' + userId;
    var lastSubmitStr = props.getProperty(rateLimitKey);
    var nowMs = Date.now();
    if (lastSubmitStr) {
      var elapsed = nowMs - parseInt(lastSubmitStr, 10);
      if (elapsed < RATE_LIMIT_SECONDS * 1000) {
        return jsonResponse({ status: 'success', message: 'Rate limited' });
      }
    }
    props.setProperty(rateLimitKey, String(nowMs));

    // 步驟 4：數值範圍驗證
    var unlockedTownships = clamp(parseInt(payload.unlockedTownships) || 0, 0, MAX_TOWNSHIPS);
    var totalSpots = clamp(parseInt(payload.totalSpots) || 0, 0, MAX_SPOTS);
    var completionRate = parseFloat(((unlockedTownships / MAX_TOWNSHIPS) * 100).toFixed(1));

    // 步驟 5：字串清理
    var nickname = sanitizeString(payload.nickname || '台灣行腳勇者', MAX_NICKNAME_LEN) || '台灣行腳勇者';
    var bio = sanitizeString(payload.bio || '', MAX_BIO_LEN);
    var lastDistrict = sanitizeString(payload.lastDistrict || '尚無紀錄', MAX_LAST_DISTRICT_LEN);
    var avatar = String(payload.avatar || '🇹🇼').substring(0, 10);

    // 步驟 6：badge 白名單驗證
    var badge = VALID_BADGES.indexOf(payload.badge) !== -1 ? payload.badge : '行腳啟程';
    var badgeColor = getBadgeColor(badge);

    // 步驟 7：visitedDistrictIds 驗證
    var visitedIds = [];
    if (Array.isArray(payload.visitedDistrictIds)) {
      visitedIds = payload.visitedDistrictIds
        .map(function (id) { return parseInt(id); })
        .filter(function (id) { return !isNaN(id) && id >= 1 && id <= MAX_TOWNSHIPS; })
        .slice(0, unlockedTownships);
    }

    // 步驟 8：找到現有資料列，決定更新或新增
    var rowIndex = -1;
    for (var j = 1; j < data.length; j++) {
      if (String(data[j][0]) === userId) {
        rowIndex = j + 1;
        break;
      }
    }

    // 步驟 9：防止試算表無限擴張
    if (rowIndex < 0 && data.length > MAX_LEADERBOARD_ROWS) {
      return jsonResponse({ status: 'ok', message: 'Leaderboard full' });
    }

    var nowStr = new Date().toISOString();
    var rowValues = [
      userId,           // A：用戶唯一 ID
      nickname,         // B：暱稱
      avatar,           // C：頭像 emoji
      bio,              // D：行腳宣言
      unlockedTownships,// E：踏破鄉鎮數
      totalSpots,       // F：打卡景點美食總數
      completionRate,   // G：踏破率 %
      badge,            // H：稱號徽章
      badgeColor,       // I：徽章樣式（後端計算）
      lastDistrict,     // J：最後踏破鄉鎮
      nowStr,           // K：最後活躍時間
      JSON.stringify(visitedIds) // L：已踏破鄉鎮 ID 清單
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return jsonResponse({ status: 'success' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ============================================================
// 社群回報相關處理
// ============================================================

/**
 * 確保「回報記錄」工作表存在
 */
function getOrCreateReportsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('回報記錄');
  if (!sheet) {
    sheet = ss.insertSheet('回報記錄');
    sheet.appendRow([
      '時間',       // A
      '鄉鎮編號',   // B
      '地點代碼',   // C
      '地點名稱',   // D
      '類別',       // E
      '回報原因',   // F
      '備註',       // G
      '回報者ID'    // H
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 讀取並彙整社群回報清單
 */
function handleGetSpotReports() {
  var sheet = getOrCreateReportsSheet();
  var data = sheet.getDataRange().getValues();
  var reportsMap = {};

  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var districtId = row[1];
      var rawSpotId = String(row[2] || '').trim();
      if (!rawSpotId) continue;

      // 自動將裸 ID (如 A1, F1, F2) 結合 districtId 形成唯一識別碼 (如 73_A1)
      var spotId = rawSpotId;
      if (districtId && (/^[AF][1-3]$/.test(spotId) || !spotId.includes('_'))) {
        spotId = districtId + '_' + spotId;
      } else if (!districtId && /^[AF][1-3]$/.test(spotId)) {
        continue;
      }

      var reason = String(row[5] || '').trim();
      // 若最新回報為 normal，代表平反恢復正常
      if (reason === 'normal') {
        delete reportsMap[spotId];
        continue;
      }

      var time = row[0];
      var spotName = String(row[3] || '');
      var spotType = String(row[4] || '');
      var note = String(row[6] || '').trim();
      var userId = String(row[7] || '').trim();

      if (!reportsMap[spotId]) {
        reportsMap[spotId] = {
          spotId: spotId,
          districtId: districtId,
          spotName: spotName,
          spotType: spotType,
          reason: reason,
          count: 0,
          reporters: [],
          notes: [],
          updatedAt: time
        };
      }

      reportsMap[spotId].reason = reason;
      reportsMap[spotId].count += 1;
      if (userId && reportsMap[spotId].reporters.indexOf(userId) === -1) {
        reportsMap[spotId].reporters.push(userId);
      }
      if (note && reportsMap[spotId].notes.indexOf(note) === -1) {
        reportsMap[spotId].notes.push(note);
      }
      reportsMap[spotId].updatedAt = time;
    }
  }

  return jsonResponse({ status: 'success', data: reportsMap });
}

/**
 * 儲存單筆店家狀態回報
 */
function handlePostSpotReport(payload) {
  var rawSpotId = String(payload.spotId || '').trim();
  if (!rawSpotId || rawSpotId.length > 80) {
    return jsonResponse({ status: 'error', message: 'Invalid spotId' });
  }

  var districtId = parseInt(payload.districtId) || 0;
  var spotId = rawSpotId;
  if (districtId && (/^[AF][1-3]$/.test(spotId) || !spotId.includes('_'))) {
    spotId = districtId + '_' + spotId;
  }

  var spotName = sanitizeString(payload.spotName || '', 50);
  var spotType = sanitizeString(payload.spotType || '', 20);
  var reason = String(payload.reason || 'closed').trim();
  var note = sanitizeString(payload.note || '', 100);
  var userId = sanitizeString(payload.userId || '', 60);
  var nowStr = new Date().toISOString();

  var sheet = getOrCreateReportsSheet();
  sheet.appendRow([
    nowStr,
    districtId,
    spotId,
    spotName,
    spotType,
    reason,
    note,
    userId
  ]);

  return jsonResponse({ status: 'success' });
}

// ============================================================
// 工具函式
// ============================================================

/**
 * 統一回傳 JSON 格式
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 數值區間限制
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * 字串清理：移除 HTML 標籤與控制字元，並截斷至指定長度
 */
function sanitizeString(str, maxLen) {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')          // 移除 HTML 標籤
    .replace(/[\x00-\x1F\x7F]/g, '')  // 移除 ASCII 控制字元
    .trim()
    .substring(0, maxLen);
}

/**
 * 根據 badge 名稱回傳對應的 CSS 樣式
 */
function getBadgeColor(badge) {
  var colors = {
    '環島傳奇': 'bg-yellow-500 text-white font-bold shadow-sm',
    '行腳大師': 'bg-purple-100 text-purple-700 border border-purple-300',
    '百岳行者': 'bg-emerald-100 text-emerald-700 border border-emerald-300',
    '行腳先鋒': 'bg-blue-100 text-blue-700 border border-blue-300',
    '探路新星': 'bg-amber-100 text-amber-700 border border-amber-300',
    '行腳啟程': 'bg-slate-100 text-slate-600 border border-slate-200'
  };
  return colors[badge] || colors['行腳啟程'];
}

/**
 * 確保 Leaderboard 試算表存在（含欄位標頭）
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Leaderboard');
  if (!sheet) {
    sheet = ss.insertSheet('Leaderboard');
    sheet.appendRow([
      '用戶唯一ID',      // A
      '暱稱',           // B
      '頭像',           // C
      '自我介紹',        // D
      '踏破鄉鎮數',      // E
      '打卡總數',        // F
      '踏破率%',        // G
      '稱號徽章',        // H
      '徽章樣式',        // I
      '最後踏破鄉鎮',    // J
      '最後活躍時間',    // K
      '已踏破鄉鎮ID清單' // L（先行者功能）
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 將時間戳格式化為「X分鐘前」「X小時前」等相對時間
 */
function formatTimeAgo(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  if (isNaN(seconds) || seconds < 0) return '最近';
  if (seconds < 60) return '剛才';
  var minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + '分鐘前';
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + '小時前';
  var days = Math.floor(hours / 24);
  if (days < 30) return days + '天前';
  return '很久以前';
}