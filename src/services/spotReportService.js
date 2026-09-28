/**
 * Spot Status & Community Crowdsourced Reporting Service
 * Manages community-reported spot statuses (closed, not found on map, or verified active)
 */
import { GAS_LEADERBOARD_API_URL, getOrCreateUserId } from './leaderboardApi';

const STORAGE_KEY_REPORTS = 'taiwan368_spot_reports';

/**
 * Initial known reported spots seed
 */
const DEFAULT_REPORTS = {
  // 範例初始資料（可依社群回報擴充）
};

/**
 * 取得全台唯一的景點/美食複合識別碼（防止跨鄉鎮 ID 如 A1、F1 撞名）
 * 例如：第 73 區 (臺中市潭子區) 的 A1 -> "73_A1"
 */
export function getSpotCompositeId(districtId, spotId) {
  if (!spotId) return '';
  const strId = String(spotId);
  if (!districtId || strId.startsWith(`${districtId}_`)) {
    return strId;
  }
  return `${districtId}_${strId}`;
}

/**
 * Load cached reports from localStorage
 * 自動過濾並修復過去未加上鄉鎮編號的裸 key（如 A1、F1），杜絕跨區污染
 */
export function loadCachedReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) return { ...DEFAULT_REPORTS };
    const parsed = JSON.parse(raw);
    const cleaned = {};

    Object.keys(parsed).forEach(k => {
      const item = parsed[k];
      if (!item) return;

      // 若是裸 key（如 A1, F1, F2）
      if (/^[AF][1-3]$/.test(k)) {
        if (item.districtId) {
          const newKey = `${item.districtId}_${k}`;
          cleaned[newKey] = { ...item, spotId: newKey };
        }
        // 沒有 districtId 的裸 key 直接拋棄，徹底清理污染
      } else {
        cleaned[k] = item;
      }
    });

    return cleaned;
  } catch (e) {
    console.warn('Failed to load cached spot reports:', e);
    return { ...DEFAULT_REPORTS };
  }
}

/**
 * Save reports map to localStorage
 */
export function saveCachedReports(reportsMap) {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reportsMap));
  } catch (e) {
    console.warn('Failed to save spot reports to localStorage:', e);
  }
}

/**
 * Fetch community reports from Google Apps Script cloud
 */
export async function fetchCommunityReports() {
  if (!GAS_LEADERBOARD_API_URL) return loadCachedReports();

  try {
    const url = `${GAS_LEADERBOARD_API_URL}?action=get_spot_reports`;
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const cloudCleaned = {};
        Object.keys(json.data).forEach(k => {
          const item = json.data[k];
          if (!item) return;

          if (/^[AF][1-3]$/.test(k)) {
            if (item.districtId) {
              const newKey = `${item.districtId}_${k}`;
              cloudCleaned[newKey] = { ...item, spotId: newKey };
            }
          } else {
            cloudCleaned[k] = item;
          }
        });

        const local = loadCachedReports();
        const merged = { ...local, ...cloudCleaned };
        saveCachedReports(merged);
        return merged;
      }
    }
  } catch (e) {
    console.log('[SpotReport] Using local spot reports (cloud fetch fallback):', e.message);
  }
  return loadCachedReports();
}

/**
 * Submit a report for a spot (closed, not_found, or verified normal)
 */
export async function submitSpotReport({
  districtId,
  spotId,
  spotName,
  spotType,
  reason,
  note = '',
  userProfile = null
}) {
  const userId = getOrCreateUserId(userProfile);
  const compositeSpotId = getSpotCompositeId(districtId, spotId);
  const currentReports = loadCachedReports();
  const nextReports = { ...currentReports };

  const now = new Date().toISOString();

  // 清除舊有的未加區碼的裸 key（例如 "A1"、"F1"、"F2"）以防干擾
  delete nextReports[spotId];

  if (reason === 'normal') {
    // 平反：移除或解除異常警示
    delete nextReports[compositeSpotId];
  } else {
    const existing = nextReports[compositeSpotId] || {
      spotId: compositeSpotId,
      districtId,
      spotName,
      spotType,
      reason,
      count: 0,
      reporters: [],
      notes: []
    };

    const reporters = new Set(existing.reporters || []);
    reporters.add(userId);

    const notesList = [...(existing.notes || [])];
    if (note && !notesList.includes(note)) {
      notesList.push(note);
    }

    nextReports[compositeSpotId] = {
      ...existing,
      spotId: compositeSpotId,
      districtId,
      spotName,
      spotType,
      reason,
      count: reporters.size,
      reporters: Array.from(reporters),
      notes: notesList.slice(-5), // 保留最新 5 則備註
      updatedAt: now
    };
  }

  // 1. 本地即時生效
  saveCachedReports(nextReports);

  // 2. 背景非同步同步至 Google Apps Script 試算表
  if (GAS_LEADERBOARD_API_URL) {
    try {
      fetch(GAS_LEADERBOARD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_spot',
          districtId,
          spotId: compositeSpotId, // 傳遞包含鄉鎮編號的唯一複合ID
          spotName,
          spotType,
          reason,
          note,
          userId,
          reportedAt: now
        }),
        mode: 'no-cors'
      }).catch(err => {
        console.log('[SpotReport] Background cloud push queued:', err.message);
      });
    } catch (e) {
      console.warn('[SpotReport] Failed to trigger cloud report:', e);
    }
  }

  return nextReports;
}

/**
 * Helper to inspect single spot report status
 */
export function getSpotReportInfo(reportsMap, spotId, districtId = null) {
  if (!reportsMap || !spotId) {
    return null;
  }

  // 優先以複合 ID（如 73_A1）查找，若無 districtId 則退回 spotId
  const key = districtId ? getSpotCompositeId(districtId, spotId) : spotId;
  const rep = reportsMap[key];
  if (!rep || !rep.reason) return null;

  return {
    isReported: true,
    reason: rep.reason,
    label: rep.reason === 'closed' ? '可能已歇業' : '地圖找不到',
    count: rep.count || 1,
    notes: rep.notes || [],
    updatedAt: rep.updatedAt
  };
}
