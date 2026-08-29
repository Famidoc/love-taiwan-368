import React from 'react';
import { 
  Compass, 
  Trophy, 
  Cloud, 
  Share2, 
  Map, 
  List, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Utensils, 
  Camera,
  RefreshCw
} from 'lucide-react';

export default function Header({
  stats,
  viewMode,
  setViewMode,
  onOpenLeaderboard,
  onOpenSync,
  onOpenCommunity,
  userProfile,
  cloudSyncState
}) {
  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-lg backdrop-blur-md bg-opacity-95 border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo and App Title */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-emerald-950 rounded-2xl flex items-center justify-center text-lg sm:text-2xl">
                🇹🇼
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                {/* Mobile: Clean 2-line break (愛台灣 / 368 行腳) | Desktop: Single Line */}
                <h1 className="font-black font-serif-tw tracking-wider text-amber-300">
                  <span className="sm:hidden text-xs text-amber-200/90 block leading-tight font-sans font-bold">
                    愛台灣
                  </span>
                  <span className="text-base sm:text-2xl whitespace-nowrap block sm:inline leading-tight">
                    <span className="hidden sm:inline">愛台灣 </span>368 行腳
                  </span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold bg-emerald-700/80 text-emerald-100 rounded-full border border-emerald-600">
                  PWA 踏破手帳
                </span>
              </div>
              <p className="text-xs text-emerald-200 hidden sm:block">
                368 鄉鎮市區 • 1,104 必訪景點 • 1,104 必吃美食
              </p>
            </div>
          </div>

          {/* Quick Stats Bar (Desktop) */}
          <div className="hidden md:flex items-center space-x-4 bg-emerald-950/60 py-1.5 px-4 rounded-xl border border-emerald-700/40">
            <div className="text-center">
              <div className="text-xs text-emerald-300 flex items-center justify-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>鄉鎮踏破</span>
              </div>
              <div className="text-sm font-bold text-white">
                <span className="text-amber-400 font-black text-base">{stats.unlockedTownships}</span>
                <span className="text-xs text-emerald-400 font-normal"> / 368</span>
                <span className="ml-1 text-xs text-emerald-300 font-semibold">({stats.percent}%)</span>
              </div>
            </div>

            <div className="w-px h-6 bg-emerald-800" />

            <div className="text-center">
              <div className="text-xs text-emerald-300 flex items-center justify-center gap-1">
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>必訪景點</span>
              </div>
              <div className="text-sm font-bold text-white">
                <span className="text-sky-300">{stats.attractionsCount}</span>
                <span className="text-xs text-emerald-400 font-normal"> / 1104</span>
              </div>
            </div>

            <div className="w-px h-6 bg-emerald-800" />

            <div className="text-center">
              <div className="text-xs text-emerald-300 flex items-center justify-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-orange-400" />
                <span>必吃美食</span>
              </div>
              <div className="text-sm font-bold text-white">
                <span className="text-orange-300">{stats.foodsCount}</span>
                <span className="text-xs text-emerald-400 font-normal"> / 1104</span>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            
            {/* View Mode Toggle: Map vs List */}
            <div className="bg-emerald-950/80 p-0.5 sm:p-1 rounded-xl flex items-center border border-emerald-700/50">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'list'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm font-bold'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="圖鑑清單"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">圖鑑</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'map'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm font-bold'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="全台地圖"
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">地圖</span>
              </button>
            </div>

            {/* Leaderboard Button */}
            <button
              onClick={onOpenLeaderboard}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="同好排行榜"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">排行榜</span>
            </button>

            {/* Google Drive / Cloud Sync with Live Status Indicator */}
            <button
              onClick={onOpenSync}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                cloudSyncState === 'syncing'
                  ? 'bg-sky-700/80 text-sky-100 border-sky-400/60 animate-pulse'
                  : cloudSyncState === 'synced'
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-400/60'
                  : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-600/60'
              }`}
              title="資料備份與自動同步"
            >
              {cloudSyncState === 'syncing' ? (
                <RefreshCw className="w-4 h-4 text-sky-300 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4 text-emerald-300" />
              )}
              <span className="hidden sm:inline">
                {cloudSyncState === 'syncing' ? '同步中' : cloudSyncState === 'synced' ? '已同步' : '同步'}
              </span>
            </button>

            {/* Community / FB & LINE */}
            <button
              onClick={onOpenCommunity}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="社群交流"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">社群</span>
            </button>

          </div>

        </div>

        {/* Mobile Mini Progress Bar */}
        <div className="md:hidden pb-2.5 pt-0.5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-emerald-200">
              踏破: <b className="text-amber-300">{stats.unlockedTownships}</b>/368
            </span>
            <span className="text-emerald-200">
              景點: <b className="text-sky-300">{stats.attractionsCount}</b> | 美食: <b className="text-orange-300">{stats.foodsCount}</b>
            </span>
            <span className="font-bold text-amber-400">{stats.percent}%</span>
          </div>
          <div className="w-full bg-emerald-950/80 rounded-full h-2 overflow-hidden border border-emerald-700/50">
            <div 
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(stats.percent, 1)}%` }}
            />
          </div>
        </div>

      </div>
    </header>
  );
}
