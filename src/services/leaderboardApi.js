/**
 * Leaderboard & Community Service
 * Manages community progress, badges, and user rankings
 */

// Simulated realistic active 368 travelers in the community
const MOCK_COMMUNITY_TRAVELERS = [
  {
    id: 'user_001',
    nickname: '單車老張',
    avatar: '🚴‍♂️',
    bio: '騎單車環島踏破全台！',
    unlockedTownships: 284,
    totalSpots: 1420,
    completionRate: 77.2,
    badge: '行腳大師',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',
    lastActive: '10分鐘前',
    lastDistrict: '花蓮縣 豐濱鄉'
  },
  {
    id: 'user_002',
    nickname: '山海行者 阿哲',
    avatar: '⛰️',
    bio: '專注踏破東部與山岳鄉鎮。',
    unlockedTownships: 198,
    totalSpots: 990,
    completionRate: 53.8,
    badge: '百岳行者',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    lastActive: '1小時前',
    lastDistrict: '南投縣 仁愛鄉'
  },
  {
    id: 'user_003',
    nickname: '美食獵人 小涵',
    avatar: '🍜',
    bio: '吃遍全台 1,104 種必吃美食！',
    unlockedTownships: 165,
    totalSpots: 880,
    completionRate: 44.8,
    badge: '美食達人',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-300',
    lastActive: '3小時前',
    lastDistrict: '台南市 國華街'
  },
  {
    id: 'user_004',
    nickname: '慢漫行 怡君',
    avatar: '📸',
    bio: '用拍立得記錄每一個鄉鎮的微笑。',
    unlockedTownships: 112,
    totalSpots: 560,
    completionRate: 30.4,
    badge: '行腳先鋒',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    lastActive: '昨天',
    lastDistrict: '宜蘭縣 礁溪鄉'
  },
  {
    id: 'user_005',
    nickname: '鐵道旅人 Ken',
    avatar: '🚂',
    bio: '坐著火車慢遊各個小鎮。',
    unlockedTownships: 89,
    totalSpots: 430,
    completionRate: 24.1,
    badge: '尋幽探勝',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    lastActive: '2天前',
    lastDistrict: '彰化縣 二水鄉'
  }
];

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
