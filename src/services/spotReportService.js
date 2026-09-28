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
 * Load cached reports from localStorage
 */
export function loadCachedReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) return { ...DEFAULT_REPORTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_REPORTS, ...parsed };
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
        const local = loadCachedReports();
        const merged = { ...local, ...json.data };
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
  const currentReports = loadCachedReports();
  const nextReports = { ...currentReports };

  const now = new Date().toISOString();

  if (reason === 'normal') {
    // 平反：移除或解除異常警示
    delete nextReports[spotId];
  } else {
    const existing = nextReports[spotId] || {
      spotId,
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

    nextReports[spotId] = {
      ...existing,
      spotId,
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
          spotId,
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
export function getSpotReportInfo(reportsMap, spotId) {
  if (!reportsMap || !spotId || !reportsMap[spotId]) {
    return null;
  }
  const rep = reportsMap[spotId];
  if (!rep.reason) return null;

  return {
    isReported: true,
    reason: rep.reason,
    label: rep.reason === 'closed' ? '可能已歇業' : '地圖找不到',
    count: rep.count || 1,
    notes: rep.notes || [],
    updatedAt: rep.updatedAt
  };
}
