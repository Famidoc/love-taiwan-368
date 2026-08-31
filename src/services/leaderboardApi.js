/**
 * Leaderboard & Community Service
 * Manages live community rankings and district pioneers via Google Sheets
 */

export const GAS_LEADERBOARD_API_URL = 'https://script.google.com/macros/s/AKfycbymOQQJXZ1mD4O0cErkPNz8Neo8p3gmGW8mU7yvwc6ceja8SxaYtypL4VhWK1798dO1/exec';

const STORAGE_KEY_USER_ID = 'taiwan368_unique_user_id';

export function getOrCreateUserId(userProfile) {
  if (userProfile?.userId) {
    localStorage.setItem(STORAGE_KEY_USER_ID, userProfile.userId);
    return userProfile.userId;
  }
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
 * Calculate user stats summary and visited districts list
 */
export function calculateUserSummary(currentUserProfile, currentUserProgress) {
  let userUnlockedCount = 0;
  let userTotalSpots = 0;
  let lastDistrictName = '尚無紀錄';
  const visitedDistrictIds = [];
  const visitedDistrictsMap = {};

  const progressKeys = Object.keys(currentUserProgress || {});
  progressKeys.forEach((key) => {
    const item = currentUserProgress[key];
    const attractionsCount = item.attractionsChecked?.length || 0;
    const foodsCount = item.foodsChecked?.length || 0;
    const spotsCount = attractionsCount + foodsCount;

    if (spotsCount > 0) {
      const numId = Number(key);
      userTotalSpots += spotsCount;
      userUnlockedCount += 1;
      visitedDistrictIds.push(numId);
      visitedDistrictsMap[numId] = {
        spotsCount,
        rating: item.rating || 0,
        notes: item.notes ? (item.notes.length > 30 ? item.notes.substring(0, 30) + '...' : item.notes) : '',
        updatedAt: item.updatedAt || new Date().toISOString()
      };
      if (item.township) {
        lastDistrictName = `${item.county || ''} ${item.township}`;
      }
    }
  });

  const userCompletionRate = parseFloat(((userUnlockedCount / 368) * 100).toFixed(1));
  const userBadge = calculateBadge(userUnlockedCount);

  return {
    userId: getOrCreateUserId(currentUserProfile),
    nickname: currentUserProfile.nickname || '台灣行腳勇者',
    avatar: currentUserProfile.avatar || '🇹🇼',
    bio: currentUserProfile.bio || '踏遍台灣368個鄉鎮市區！',
    unlockedTownships: userUnlockedCount,
    totalSpots: userTotalSpots,
    completionRate: userCompletionRate,
    badge: userBadge.name,
    badgeColor: userBadge.color,
    lastDistrict: lastDistrictName,
    visitedDistrictIds,
    visitedDistrictsMap,
    isPublic: currentUserProfile.isPublic !== false
  };
}

/**
 * Fetch all travelers from Google Sheets cloud and deduplicate
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

  // Merge current user with cloud list and deduplicate by user ID / Nickname
  let hasMe = false;
  const seenUsers = new Set();
  const merged = [];

  cloudList.forEach(entry => {
    const isThisMe = 
      String(entry.id) === String(myUserId) || 
      (mySummary.nickname && entry.nickname === mySummary.nickname);

    if (isThisMe) {
      if (!hasMe) {
        hasMe = true;
        // Keep consistent user ID
        if (entry.id && entry.id !== myUserId) {
          localStorage.setItem(STORAGE_KEY_USER_ID, entry.id);
        }
        seenUsers.add(mySummary.nickname);
        seenUsers.add(String(entry.id));
        merged.push({
          ...entry,
          id: entry.id || myUserId,
          isMe: true,
          nickname: mySummary.nickname,
          avatar: mySummary.avatar,
          bio: mySummary.bio,
          unlockedTownships: Math.max(Number(entry.unlockedTownships || 0), mySummary.unlockedTownships),
          totalSpots: Math.max(Number(entry.totalSpots || 0), mySummary.totalSpots),
          completionRate: Math.max(Number(entry.completionRate || 0), mySummary.completionRate),
          badge: mySummary.badge,
          badgeColor: mySummary.badgeColor,
          lastDistrict: mySummary.lastDistrict !== '尚無紀錄' ? mySummary.lastDistrict : (entry.lastDistrict || '尚無紀錄'),
          visitedDistrictIds: mySummary.visitedDistrictIds,
          lastActive: '剛才'
        });
      }
      // If already added, skip duplicate
    } else {
      if (!seenUsers.has(entry.nickname)) {
        seenUsers.add(entry.nickname);
        seenUsers.add(String(entry.id));
        merged.push({ ...entry, isMe: false });
      }
    }
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
      visitedDistrictIds: mySummary.visitedDistrictIds,
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

/**
 * Get Pioneers for a specific district (matches by ID, county/township name, and visited list)
 */
export function getDistrictPioneers(district, cloudData, currentUserProfile, currentUserProgress) {
  if (!district) return [];
  const districtId = typeof district === 'object' ? district.id : district;
  const numId = Number(districtId);
  const myProgress = currentUserProgress?.[districtId] || currentUserProgress?.[numId];
  const mySummary = calculateUserSummary(currentUserProfile, currentUserProgress);
  
  const mySpots = (myProgress?.attractionsChecked?.length || 0) + (myProgress?.foodsChecked?.length || 0);
  const pioneers = [];
  const seenUsers = new Set();

  const districtFullName = typeof district === 'object' ? `${district.county || ''} ${district.township || ''}`.trim() : '';
  const districtTownship = typeof district === 'object' ? (district.township || '').trim() : '';

  // 1. Check if current user visited
  if (mySpots > 0) {
    seenUsers.add(mySummary.nickname);
    seenUsers.add(String(mySummary.userId));
    pioneers.push({
      id: mySummary.userId,
      isMe: true,
      nickname: mySummary.nickname,
      avatar: mySummary.avatar,
      bio: mySummary.bio,
      badge: mySummary.badge,
      badgeColor: mySummary.badgeColor,
      spotsCount: mySpots,
      rating: myProgress?.rating || 0,
      notes: myProgress?.notes || '',
      updatedAt: myProgress?.updatedAt || '最近',
      lastActive: '已在此插旗'
    });
  }

  // 2. Check other cloud travelers from Google Sheets
  if (cloudData && Array.isArray(cloudData)) {
    cloudData.forEach(traveler => {
      // If already seen this user (e.g. current user on another device or duplicate entry), skip
      if (seenUsers.has(traveler.nickname) || seenUsers.has(String(traveler.id))) {
        return;
      }
      
      const visitedList = traveler.visitedDistrictIds || [];
      const lastDist = traveler.lastDistrict || '';

      const hasVisited = 
        visitedList.includes(numId) || 
        (districtFullName && lastDist.includes(districtFullName)) ||
        (districtTownship && lastDist.includes(districtTownship));

      if (hasVisited) {
        seenUsers.add(traveler.nickname);
        seenUsers.add(String(traveler.id));
        pioneers.push({
          id: traveler.id,
          isMe: false,
          nickname: traveler.nickname || '同好行腳者',
          avatar: traveler.avatar || '🇹🇼',
          bio: traveler.bio || '',
          badge: traveler.badge || '行腳啟程',
          badgeColor: traveler.badgeColor || 'bg-slate-100 text-slate-700 border-slate-300',
          spotsCount: traveler.totalSpots || traveler.spotsCount || 4,
          rating: 5,
          notes: '',
          updatedAt: traveler.lastActive || '最近',
          lastActive: traveler.lastActive || '曾到訪此地'
        });
      }
    });
  }

  return pioneers;
}
