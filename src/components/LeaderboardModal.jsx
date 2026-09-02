import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Trophy, 
  Award, 
  Medal, 
  Flame, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  Smile, 
  Save,
  RefreshCw,
  MapPin,
  Camera,
  Utensils,
  ChevronRight,
  Compass,
  Footprints
} from 'lucide-react';
import { getLeaderboard, fetchCloudLeaderboard, calculateBadge, submitProgressToCloudLeaderboard } from '../services/leaderboardApi';

const AVATAR_OPTIONS = ['🇹🇼', '🚴‍♂️', '⛰️', '📸', '🍜', '🚂', '🎒', '🏕️', '🧗‍♂️', '🛵', '🧭', '🌟'];

export default function LeaderboardModal({
  userProfile,
  progressMap,
  districts = [],
  isOpen,
  onClose,
  onUpdateProfile,
  onSelectDistrict
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | 'footprint' | 'badges' | 'profile'
  const [nickname, setNickname] = useState(userProfile?.nickname || '台灣行腳勇者');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '🇹🇼');
  const [bio, setBio] = useState(userProfile?.bio || '踏遍台灣368個鄉鎮市區！');
  const [isPublic, setIsPublic] = useState(userProfile?.isPublic ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cloudList, setCloudList] = useState(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  const loadCloud = async () => {
    setIsLoadingCloud(true);
    try {
      const data = await fetchCloudLeaderboard(userProfile, progressMap);
      setCloudList(data);
    } catch (e) {
      console.warn('Failed to load cloud leaderboard:', e);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCloud();
    }
  }, [isOpen]);

  const leaderboardData = getLeaderboard(userProfile, progressMap, cloudList);
  const myEntry = leaderboardData.find(e => e.isMe);

  // Compute My Visited Districts Footprint List
  const myVisitedList = useMemo(() => {
    if (!districts || !progressMap) return [];
    const list = [];
    districts.forEach(d => {
      const p = progressMap[d.id] || progressMap[String(d.id)];
      const attsCount = p?.attractionsChecked?.length || 0;
      const foodsCount = p?.foodsChecked?.length || 0;
      const totalCount = attsCount + foodsCount;
      if (totalCount > 0) {
        list.push({
          district: d,
          progress: p,
          attsCount,
          foodsCount,
          totalCount,
          isCompleted: totalCount === 6,
          rating: p.rating || 0,
          notes: p.notes || '',
          photosCount: p.photos?.length || 0,
          photoUrl: p.photos?.[0]?.dataUrl || null,
          updatedAt: p.updatedAt || ''
        });
      }
    });
    // Sort by updatedAt desc (most recent first)
    list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return list;
  }, [districts, progressMap]);

  const totalCompletedDistricts = useMemo(() => {
    return myVisitedList.filter(item => item.isCompleted).length;
  }, [myVisitedList]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updated = {
      ...userProfile,
      nickname,
      avatar,
      bio,
      isPublic
    };
    onUpdateProfile(updated);
    submitProgressToCloudLeaderboard(updated, progressMap);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    setTimeout(() => loadCloud(), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 text-white p-4 sm:p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-200" />
              <h2 className="text-lg sm:text-xl font-black font-serif-tw tracking-wide">
                368 行腳同好榮譽榜
              </h2>
            </div>
            {activeTab === 'ranking' && (
              <button
                onClick={loadCloud}
                disabled={isLoadingCloud}
                className="p-1.5 bg-black/20 hover:bg-black/40 rounded-xl text-amber-200 transition-all flex items-center gap-1 text-xs"
                title="重新整理雲端榜單"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">即時更新</span>
              </button>
            )}
          </div>
          <p className="text-xs text-amber-100 mt-1">
            與全台行腳旅人互相激勵，點亮屬於我們的每一寸土地！
          </p>

          {/* Navigation Tabs (Horizontal Scrollable for Mobile) */}
          <div className="flex items-center gap-1 sm:gap-2 mt-3.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'ranking'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/20 text-amber-100 hover:bg-black/30'
              }`}
            >
              🏆 全台踏破榜
            </button>
            <button
              onClick={() => setActiveTab('footprint')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === 'footprint'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/20 text-amber-100 hover:bg-black/30'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>我的踏破清單 ({myVisitedList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/20 text-amber-100 hover:bg-black/30'
              }`}
            >
              <span>👤 我的名片</span>
              {(userProfile?.nickname === '台灣行腳勇者' || !userProfile?.nickname) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-300 rounded-full animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'badges'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/20 text-amber-100 hover:bg-black/30'
              }`}
            >
              🎖️ 徽章體系
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: RANKING */}
          {activeTab === 'ranking' && (
            <div className="space-y-3">
              
              {/* My Sticky Rank Card */}
              {myEntry && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500/80 rounded-2xl p-3.5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs font-mono">
                        #{myEntry.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{myEntry.avatar}</span>
                          <span className="font-black text-slate-900 text-sm">{myEntry.nickname}</span>
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                            您
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          目前踏破 <b className="text-emerald-700">{myEntry.unlockedTownships}</b> 個鄉鎮 ({myEntry.completionRate}%)
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${myEntry.badgeColor}`}>
                      {myEntry.badge}
                    </span>
                  </div>

                  {/* Nickname prompt banner if using default name */}
                  {(userProfile?.nickname === '台灣行腳勇者' || !userProfile?.nickname) && (
                    <div className="bg-amber-100/90 border border-amber-300/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-950">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>您目前使用預設暱稱，建議設定專屬稱呼！</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors shrink-0 ml-2"
                      >
                        去設定名片
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {leaderboardData.map((traveler) => {
                  const rankColors = {
                    1: 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300',
                    2: 'bg-slate-300 text-slate-900 font-bold',
                    3: 'bg-amber-700 text-white font-bold'
                  };

                  return (
                    <div
                      key={traveler.id}
                      className={`p-3 sm:p-3.5 flex items-center justify-between transition-colors ${
                        traveler.isMe ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono ${
                          rankColors[traveler.rank] || 'bg-slate-100 text-slate-600 font-semibold'
                        }`}>
                          {traveler.rank}
                        </span>

                        <span className="text-2xl shrink-0">{traveler.avatar}</span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{traveler.nickname}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${traveler.badgeColor}`}>
                              {traveler.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>踏破 <b>{traveler.unlockedTownships}</b> 鄉鎮</span>
                            <span>•</span>
                            <span>{traveler.lastDistrict}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-700">
                          {traveler.completionRate}%
                        </div>
                        <span className="text-[10px] text-slate-400">{traveler.lastActive}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {leaderboardData.length <= 1 && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                    <span>🌟</span> 您是目前榜上的先鋒行腳勇者！
                  </p>
                  <p className="text-[11px] text-slate-500">
                    邀請好友一起加入 368 行腳之旅，在排行榜上一同切磋踏破進度吧！
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: MY FOOTPRINT LIST */}
          {activeTab === 'footprint' && (
            <div className="space-y-4">
              
              {/* Summary Stats Card */}
              <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{userProfile?.avatar || '🇹🇼'}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {userProfile?.nickname || '台灣行腳勇者'} 的踏破手帳
                      </h4>
                      <p className="text-xs text-emerald-200">
                        {myEntry?.badge || '行腳啟程'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-300">
                      {((myVisitedList.length / 368) * 100).toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-emerald-200">全台踏破率</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-700/60 text-center text-xs">
                  <div className="bg-emerald-950/40 p-2 rounded-xl">
                    <span className="text-base font-black text-emerald-300 block">{myVisitedList.length}</span>
                    <span className="text-[10px] text-emerald-200">踏破鄉鎮 (368)</span>
                  </div>
                  <div className="bg-emerald-950/40 p-2 rounded-xl">
                    <span className="text-base font-black text-amber-300 block">{totalCompletedDistricts}</span>
                    <span className="text-[10px] text-emerald-200">全制霸鄉鎮 (6/6)</span>
                  </div>
                  <div className="bg-emerald-950/40 p-2 rounded-xl">
                    <span className="text-base font-black text-sky-300 block">
                      {myVisitedList.reduce((acc, cur) => acc + cur.totalCount, 0)}
                    </span>
                    <span className="text-[10px] text-emerald-200">景點與美食總數</span>
                  </div>
                </div>
              </div>

              {/* Visited Districts List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-700">
                  <span>已踩點鄉鎮明細 ({myVisitedList.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">點擊項目可跳轉至該區卡片</span>
                </div>

                {myVisitedList.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {myVisitedList.map(({ district, progress, totalCount, isCompleted, rating, notes, photosCount, photoUrl }) => (
                      <div
                        key={district.id}
                        onClick={() => {
                          if (onSelectDistrict) {
                            onClose();
                            onSelectDistrict(district);
                          }
                        }}
                        className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          {/* Photo Thumbnail or Region Tag */}
                          {photoUrl ? (
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-xs relative">
                              <img
                                src={photoUrl}
                                alt="足跡照片"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {photosCount > 1 && (
                                <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-1 rounded-tl font-bold">
                                  +{photosCount - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                              <span>#{district.id.toString().padStart(3, '0')}</span>
                              <span className="text-[9px] text-emerald-700">{district.region}</span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500">{district.county}</span>
                              <h4 className="font-bold text-slate-900 text-sm font-serif-tw">
                                {district.township}
                              </h4>
                              {isCompleted ? (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                                  全制霸
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-full font-semibold">
                                  {totalCount}/6
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              {rating > 0 && (
                                <span className="text-amber-500 text-[11px] font-bold shrink-0">
                                  {'★'.repeat(rating)}
                                </span>
                              )}
                              {notes ? (
                                <p className="truncate text-slate-600 italic text-[11px]">
                                  "{notes}"
                                </p>
                              ) : (
                                <span className="text-[10px] text-slate-400">已打卡完成</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-700 shrink-0 transition-colors">
                          <span className="text-xs font-semibold hidden sm:inline">查看</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 space-y-2">
                    <Compass className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-slate-700">
                      目前尚未有踏破足跡！
                    </p>
                    <p className="text-[11px] text-slate-400">
                      出門旅行打卡、品嚐美食，點亮屬於您的第一個鄉鎮吧！
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Nickname Hint Banner */}
              {isPublic && (nickname === '台灣行腳勇者' || !nickname) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">設定專屬暱稱，讓同好認識您！</span>
                    <span className="text-[11px] text-amber-800">您目前開啟了「公開參與同好排行榜」，建議為自己取一個響亮的稱呼。若使用預設稱呼，排行榜將依規則合併顯示。</span>
                  </div>
                </div>
              )}

              {/* Nickname */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  同行者稱呼 / 暱稱 <span className="text-emerald-600 font-normal">(風雲榜公開顯示)</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：單車阿文、台大林醫師、美食小護士..."
                  maxLength={15}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  選擇代表頭像
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`text-2xl p-2 rounded-2xl border transition-all ${
                        avatar === emoji
                          ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-300 scale-105'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  行腳宣言 / 自我介紹
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="例如：趁著週末，一步一步走遍全台灣！"
                  maxLength={30}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Privacy switch */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">公開參與同好排行榜</span>
                  <span className="text-[11px] text-slate-500">關閉後僅保留在本機記錄，不列入公開排行</span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> 名片已成功儲存並同步至全台風雲榜！
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>儲存名片設定</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 4: BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                踏破全台 368 鄉鎮是條不平凡的壯舉旅程！隨著您的足跡擴展，將逐步解鎖榮譽徽章稱號：
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: '環島傳奇', count: '368 鄉鎮 (100% 全制霸)', desc: '台灣行腳界的至高傳奇！', color: 'bg-yellow-500 text-white border-yellow-600' },
                  { name: '行腳大師', count: '200+ 鄉鎮', desc: '走過超過半個台灣，見證島嶼山海！', color: 'bg-purple-100 text-purple-700 border-purple-300' },
                  { name: '百岳行者', count: '100+ 鄉鎮', desc: '踏破破百鄉鎮，行腳熱血燃燒！', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                  { name: '行腳先鋒', count: '50+ 鄉鎮', desc: '走出生活圈，深度探索台灣！', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                  { name: '探路新星', count: '10+ 鄉鎮', desc: '行腳啟航，邁出精彩第一步！', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                  { name: '行腳啟程', count: '1+ 鄉鎮', desc: '千里之行，始於足下。', color: 'bg-slate-100 text-slate-700 border-slate-300' }
                ].map((b, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.color}`}>
                        {b.name}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">{b.count}</span>
                    </div>
                    <p className="text-xs text-slate-600">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
