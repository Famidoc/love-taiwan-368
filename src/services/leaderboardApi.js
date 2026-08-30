/**
 * Leaderboard & Community Service
 * Manages live community rankings via Google Sheets (Google Apps Script API)
 */

export const GAS_LEADERBOARD_API_URL = 'https://script.google.com/macros/s/AKfycbymOQQJXZ1mD4O0cErkPNz8Neo8p3gmGW8mU7yvwc6ceja8SxaYtypL4VhWK1798dO1/exec';

const STORAGE_KEY_USER_ID = 'taiwan368_unique_user_id';


export function getOrCreateUserId() {
  let uid = localStorage.getItem(STORAGE_KEY_USER_ID);
  if (!uid) {
    uid = 'u_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_USER_ID, uid);
  }
  return uid;
}

export function calculateBadge(unlockedCount) {
  if (unlockedCount >= 368) {
    return { name: '環島傳奇', color: 'bg-yellow-500 text-white font-bold shadow-sm' };
  } else if (unlockedCount >= 200) {
    return { name: '行腳大師', color: 'bg-purple-100 text-purple-700 border border-purple-300' };
  } else if (unlockedCount >= 100) {
    return { name: '百岳行者', color: 'bg-emerald-100 text-emerald-700 border border-emerald-300' };
  } else if (unlockedCount >= 50) {
    return { name: '行腳先鋒', color: 'bg-blue-100 text-blue-700 border border-blue-300' };
  } else if (unlockedCount >= 10) {
    return { name: '探路新星', color: 'bg-amber-100 text-amber-700 border border-amber-300' };
  }
  return { name: '行腳啟程', color: 'bg-slate-100 text-slate-600 border border-slate-200' };
}

/**
 * Calculate user stats summary
 */
export function calculateUserSummary(currentUserProfile, currentUserProgress) {
  let userUnlockedCount = 0;
  let userTotalSpots = 0;
  let lastDistrictName = '尚無紀錄';

  const progressKeys = Object.keys(currentUserProgress || {});
  progressKeys.forEach((key) => {
    const item = currentUserProgress[key];
    const attractionsCount = item.attractionsChecked?.length || 0;
    const foodsCount = item.foodsChecked?.length || 0;
    const spotsCount = attractionsCount + foodsCount;

    if (spotsCount > 0) {
      userTotalSpots += spotsCount;
      userUnlockedCount += 1;
      if (item.township) {
        lastDistrictName = `${item.county || ''} ${item.township}`;
      }
    }
  });

  const userCompletionRate = parseFloat(((userUnlockedCount / 368) * 100).toFixed(1));
  const userBadge = calculateBadge(userUnlockedCount);

  return {
    userId: getOrCreateUserId(),
    nickname: currentUserProfile.nickname || '台灣行腳勇者',
    avatar: currentUserProfile.avatar || '🇹🇼',
    bio: currentUserProfile.bio || '踏遍台灣368個鄉鎮市區！',
    unlockedTownships: userUnlockedCount,
    totalSpots: userTotalSpots,
    completionRate: userCompletionRate,
    badge: userBadge.name,
    badgeColor: userBadge.color,
    lastDistrict: lastDistrictName,
    isPublic: currentUserProfile.isPublic !== false
  };
}

/**
 * Fetch all travelers from Google Sheets cloud
 */
export async function fetchCloudLeaderboard(currentUserProfile, currentUserProgress) {
  const mySummary = calculateUserSummary(currentUserProfile, currentUserProgress);
  const myUserId = mySummary.userId;

  let cloudList = [];

  if (GAS_LEADERBOARD_API_URL) {
    try {
      const res = await fetch(GAS_LEADERBOARD_API_URL, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          cloudList = json.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud leaderboard, fallback to local:', e);
    }
  }

  // Merge current user with cloud list
  let hasMe = false;
  const merged = cloudList.map(entry => {
    if (String(entry.id) === String(myUserId)) {
      hasMe = true;
      return {
        ...entry,
        isMe: true,
        nickname: mySummary.nickname,
        avatar: mySummary.avatar,
        bio: mySummary.bio,
        unlockedTownships: mySummary.unlockedTownships,
        totalSpots: mySummary.totalSpots,
        completionRate: mySummary.completionRate,
        badge: mySummary.badge,
        badgeColor: mySummary.badgeColor,
        lastDistrict: mySummary.lastDistrict,
        lastActive: '剛才'
      };
    }
    return { ...entry, isMe: false };
  });

  if (!hasMe) {
    merged.push({
      id: myUserId,
      isMe: true,
      nickname: mySummary.nickname,
      avatar: mySummary.avatar,
      bio: mySummary.bio,
      unlockedTownships: mySummary.unlockedTownships,
      totalSpots: mySummary.totalSpots,
      completionRate: mySummary.completionRate,
      badge: mySummary.badge,
      badgeColor: mySummary.badgeColor,
      lastDistrict: mySummary.lastDistrict,
      lastActive: '剛才'
    });
  }

  merged.sort((a, b) => b.unlockedTownships - a.unlockedTownships);

  return merged.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

/**
 * Submit current user's score to Google Sheets in background
 */
export async function submitProgressToCloudLeaderboard(currentUserProfile, currentUserProgress) {
  if (!GAS_LEADERBOARD_API_URL) return;

  const payload = calculateUserSummary(currentUserProfile, currentUserProgress);

  try {
    await fetch(GAS_LEADERBOARD_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    console.log('⚡ [Leaderboard] Score pushed to cloud successfully');
  } catch (e) {
    console.warn('⚠️ [Leaderboard] Failed to push score to cloud:', e);
  }
}

/**
 * Sync helper for immediate local render
 */
export function getLeaderboard(currentUserProfile, currentUserProgress, cloudData = null) {
  if (cloudData && Array.isArray(cloudData)) {
    return cloudData;
  }
  const mySummary = calculateUserSummary(currentUserProfile, currentUserProgress);
  return [{
    ...mySummary,
    id: mySummary.userId,
    isMe: true,
    lastActive: '剛才',
    rank: 1
  }];
}
