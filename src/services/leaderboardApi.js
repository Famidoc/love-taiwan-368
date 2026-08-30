/**
 * Leaderboard & Community Service
 * Manages community progress, badges, and user rankings
 */

// Real-time community travelers list (initially empty for fresh official launch)
const MOCK_COMMUNITY_TRAVELERS = [];

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
 * Get unified leaderboard including current user's live progress
 */
export function getLeaderboard(currentUserProfile, currentUserProgress) {
  // Compute current user stats
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

  const currentUserEntry = {
    id: 'current_user',
    isMe: true,
    nickname: currentUserProfile.nickname || '我 (您)',
    avatar: currentUserProfile.avatar || '🇹🇼',
    bio: currentUserProfile.bio || '踏遍台灣368個鄉鎮市區！',
    unlockedTownships: userUnlockedCount,
    totalSpots: userTotalSpots,
    completionRate: userCompletionRate,
    badge: userBadge.name,
    badgeColor: userBadge.color,
    lastActive: '剛才',
    lastDistrict: lastDistrictName
  };

  // Combine and sort by unlockedTownships desc
  const allEntries = [...MOCK_COMMUNITY_TRAVELERS, currentUserEntry];
  allEntries.sort((a, b) => b.unlockedTownships - a.unlockedTownships);

  // Assign ranks
  return allEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}
