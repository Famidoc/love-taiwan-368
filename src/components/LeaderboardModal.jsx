import React, { useState } from 'react';
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
  Save 
} from 'lucide-react';
import { getLeaderboard, calculateBadge } from '../services/leaderboardApi';

const AVATAR_OPTIONS = ['🇹🇼', '🚴‍♂️', '⛰️', '📸', '🍜', '🚂', '🎒', '🏕️', '🧗‍♂️', '🛵', '🧭', '🌟'];

export default function LeaderboardModal({
  userProfile,
  progressMap,
  isOpen,
  onClose,
  onUpdateProfile
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | 'profile' | 'badges'
  const [nickname, setNickname] = useState(userProfile?.nickname || '台灣行腳勇者');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '🇹🇼');
  const [bio, setBio] = useState(userProfile?.bio || '踏遍台灣368個鄉鎮市區！');
  const [isPublic, setIsPublic] = useState(userProfile?.isPublic ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const leaderboardData = getLeaderboard(userProfile, progressMap);
  const myEntry = leaderboardData.find(e => e.isMe);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      nickname,
      avatar,
      bio,
      isPublic
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-200" />
            <h2 className="text-xl font-black font-serif-tw tracking-wide">
              368 行腳同好榮譽榜
            </h2>
          </div>
          <p className="text-xs text-amber-100 mt-1">
            與全台行腳旅人互相激勵，點亮屬於我們的每一寸土地！
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ranking'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/20 text-amber-100 hover:bg-black/30'
              }`}
            >
              🏆 全台踏破榜
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'badges'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/20 text-amber-100 hover:bg-black/30'
              }`}
            >
              🎖️ 徽章稱號體系
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/20 text-amber-100 hover:bg-black/30'
              }`}
            >
              👤 我的名片設定
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
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500/80 rounded-2xl p-3.5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
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
              )}

              {/* Leaderboard List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {leaderboardData.map((traveler) => {
                  const isTop3 = traveler.rank <= 3;
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
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
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

            </div>
          )}

          {/* TAB 2: BADGES */}
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

          {/* TAB 3: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Nickname */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  同行者稱呼 / 暱稱
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：單車阿文、美食小護士..."
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
                    <Sparkles className="w-4 h-4" /> 名片已成功儲存！
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

        </div>

      </div>
    </div>
  );
}
