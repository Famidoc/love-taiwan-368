import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Sparkles, 
  RotateCcw, 
  Compass, 
  Trophy, 
  CheckCircle2, 
  Camera, 
  Utensils, 
  Share2, 
  SlidersHorizontal,
  ChevronDown,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

import Header from './components/Header';
import TaiwanMap from './components/TaiwanMap';
import DistrictCard from './components/DistrictCard';
import CheckinModal from './components/CheckinModal';
import ShareCardModal from './components/ShareCardModal';
import LeaderboardModal from './components/LeaderboardModal';
import CloudSyncModal from './components/CloudSyncModal';
import CommunityBanner from './components/CommunityBanner';

// Directly import raw 368 data for instant loading and 100% path safety on GitHub Pages & offline
import rawDistrictsData from '../public/data/taiwan368.json';

import { 
  loadUserProgress, 
  saveUserProgress, 
  loadUserProfile, 
  saveUserProfile 
} from './services/storage';

import { gdriveService, DEFAULT_GOOGLE_CLIENT_ID } from './services/gdrive';

export default function App() {
  const [districts, setDistricts] = useState(rawDistrictsData || []);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [userProfile, setUserProfile] = useState(loadUserProfile());
  const [cloudSyncState, setCloudSyncState] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // UI Views & Modals
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedRegion, setSelectedRegion] = useState('全部'); // '全部' | '北部' | '中部' | '南部' | '東部' | '離島'
  const [selectedCounty, setSelectedCounty] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'in_progress' | 'unvisited'
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modals
  const [activeCheckinDistrict, setActiveCheckinDistrict] = useState(null);
  const [activeShareDistrict, setActiveShareDistrict] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Auto Background Push Helper
  const triggerAutoCloudBackup = useCallback((currentProgress, currentProfile) => {
    if (!gdriveService.hasToken()) return;
    const backupObj = {
      appName: '愛台灣368行腳',
      version: '1.0',
      backupDate: new Date().toISOString(),
      profile: currentProfile || userProfile,
      progress: currentProgress || progressMap
    };
    gdriveService.scheduleAutoBackup(backupObj, setCloudSyncState);
  }, [userProfile, progressMap]);

  // Load user progress on mount and initialize Auto-Sync
  useEffect(() => {
    async function initApp() {
      try {
        const savedProgress = await loadUserProgress();
        setProgressMap(savedProgress || {});

        // Init Google Drive Auto Sync if user has previously authorized
        const activeClientId = localStorage.getItem('taiwan368_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;
        const hasLoggedIn = localStorage.getItem('taiwan368_has_logged_in') === 'true';

        gdriveService.init(activeClientId, async ({ token, email }) => {
          setCloudSyncState('syncing');
          try {
            // Check and pull cloud backup on launch
            const cloudData = await gdriveService.fetchBackupFromDrive();
            if (cloudData && cloudData.progress) {
              const cloudTimestamp = new Date(cloudData.backupDate || 0).getTime();
              
              // Find latest local timestamp
              let localLatestTime = 0;
              Object.values(savedProgress || {}).forEach(p => {
                const t = new Date(p?.updatedAt || 0).getTime();
                if (t > localLatestTime) localLatestTime = t;
              });

              if (cloudTimestamp >= localLatestTime) {
                console.log('⚡ [AutoSync] Loaded newer progress from Google Drive!');
                setProgressMap(cloudData.progress);
                await saveUserProgress(cloudData.progress);
                if (cloudData.profile) {
                  setUserProfile(cloudData.profile);
                  saveUserProfile(cloudData.profile);
                }
              }
            }
            setCloudSyncState('synced');
          } catch (e) {
            console.log('[AutoSync] Cloud pull check completed:', e.message);
            setCloudSyncState('synced');
          }
        });

        // Trigger silent token request if previously logged in
        if (hasLoggedIn) {
          try {
            gdriveService.requestLogin();
          } catch (e) {
            console.log('[AutoSync] Silent login waiting for user gesture');
          }
        }
      } catch (err) {
        console.error('Failed to load user progress:', err);
      }
    }
    initApp();
  }, []);

  // Compute live statistics
  const stats = useMemo(() => {
    let unlockedTownships = 0;
    let attractionsCount = 0;
    let foodsCount = 0;

    Object.values(progressMap).forEach((prog) => {
      const atts = prog?.attractionsChecked?.length || 0;
      const fds = prog?.foodsChecked?.length || 0;
      attractionsCount += atts;
      foodsCount += fds;
      if (atts > 0 || fds > 0) {
        unlockedTownships += 1;
      }
    });

    const percent = parseFloat(((unlockedTownships / 368) * 100).toFixed(1));
    return {
      unlockedTownships,
      totalTownships: 368,
      attractionsCount,
      totalAttractions: 1104,
      foodsCount,
      totalFoods: 1104,
      percent
    };
  }, [progressMap]);

  // Handle Quick Spot Toggle from card
  const handleToggleSpot = (districtId, type, spotId) => {
    const current = progressMap[districtId] || {
      districtId,
      attractionsChecked: [],
      foodsChecked: [],
      rating: 5,
      completedDate: new Date().toISOString().split('T')[0],
      notes: '',
      photos: []
    };

    let nextAttractions = [...(current.attractionsChecked || [])];
    let nextFoods = [...(current.foodsChecked || [])];

    if (type === 'attraction') {
      if (nextAttractions.includes(spotId)) {
        nextAttractions = nextAttractions.filter(id => id !== spotId);
      } else {
        nextAttractions.push(spotId);
      }
    } else if (type === 'food') {
      if (nextFoods.includes(spotId)) {
        nextFoods = nextFoods.filter(id => id !== spotId);
      } else {
        nextFoods.push(spotId);
      }
    }

    const total = nextAttractions.length + nextFoods.length;
    const isCompleted = total === 6;

    if (isCompleted) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#0284c7', '#ec4899']
      });
    }

    const updatedDistrict = {
      ...current,
      districtId,
      visited: total > 0,
      isCompleted,
      attractionsChecked: nextAttractions,
      foodsChecked: nextFoods,
      updatedAt: new Date().toISOString()
    };

    const nextProgress = {
      ...progressMap,
      [districtId]: updatedDistrict
    };

    setProgressMap(nextProgress);
    saveUserProgress(nextProgress);
    triggerAutoCloudBackup(nextProgress, userProfile);
  };

  // Handle Save from Checkin Modal
  const handleSaveProgress = (districtId, data) => {
    const nextProgress = {
      ...progressMap,
      [districtId]: data
    };
    setProgressMap(nextProgress);
    saveUserProgress(nextProgress);
    triggerAutoCloudBackup(nextProgress, userProfile);
  };

  // Handle Profile Update
  const handleUpdateProfile = (newProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
    triggerAutoCloudBackup(progressMap, newProfile);
  };

  // Handle Restore
  const handleProgressRestored = (restoredProgress, restoredProfile) => {
    if (restoredProgress) {
      setProgressMap(restoredProgress);
      saveUserProgress(restoredProgress);
    }
    if (restoredProfile) {
      setUserProfile(restoredProfile);
      saveUserProfile(restoredProfile);
    }
    setCloudSyncState('synced');
  };

  // Handle Reset All Progress to 0
  const handleProgressReset = () => {
    setProgressMap({});
    triggerAutoCloudBackup({}, userProfile);
  };

  // Filtered districts list
  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      // Region filter
      if (selectedRegion !== '全部' && d.region !== selectedRegion) {
        return false;
      }

      // County filter
      if (selectedCounty && d.county !== selectedCounty) {
        return false;
      }

      // Status filter
      const userProg = progressMap[d.id];
      const checkedCount = (userProg?.attractionsChecked?.length || 0) + (userProg?.foodsChecked?.length || 0);
      if (statusFilter === 'completed' && checkedCount !== 6) return false;
      if (statusFilter === 'in_progress' && (checkedCount === 0 || checkedCount === 6)) return false;
      if (statusFilter === 'unvisited' && checkedCount > 0) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTownship = d.township.toLowerCase().includes(query);
        const matchesCounty = d.county.toLowerCase().includes(query);
        const matchesPostal = d.postalCode.includes(query);
        const matchesAttraction = d.attractions.some(a => a.name.toLowerCase().includes(query));
        const matchesFood = d.foods.some(f => f.name.toLowerCase().includes(query));

        if (!matchesTownship && !matchesCounty && !matchesPostal && !matchesAttraction && !matchesFood) {
          return false;
        }
      }

      return true;
    });
  }, [districts, selectedRegion, selectedCounty, statusFilter, searchQuery, progressMap]);

  // List of unique counties for dropdown
  const countiesInRegion = useMemo(() => {
    const filtered = selectedRegion === '全部' ? districts : districts.filter(d => d.region === selectedRegion);
    return Array.from(new Set(filtered.map(d => d.county)));
  }, [districts, selectedRegion]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation Header */}
      <Header
        stats={stats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
        userProfile={userProfile}
        cloudSyncState={cloudSyncState}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        
        {/* Banner Hero */}
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-6 mb-5 overflow-hidden shadow-lg border border-emerald-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold mb-2">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>走遍台灣 368 鄉鎮市區 • 記錄每一步的感動</span>
            </div>
            
            {/* Single Line Hero Title on Mobile */}
            <h2 className="text-base sm:text-2xl md:text-3xl font-black font-serif-tw tracking-wide text-white flex items-center flex-wrap gap-1 leading-normal">
              <span>【愛台灣 368 行腳】</span>
              <span className="text-amber-300">踏破手帳</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed max-w-2xl">
              點亮您踏過的每一個鄉鎮，品嚐在地名吃、探索名勝古蹟，上傳照片記錄美好時光，並一鍵生成專屬紀念拍立得！
            </p>

            {/* Compact 3-Column Action Buttons in 1 Row */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mt-3.5 pt-1">
              
              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className="py-2 px-1.5 sm:px-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-[11px] sm:text-xs font-black rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 text-center"
              >
                <Compass className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
                <span className="truncate">{viewMode === 'map' ? '圖鑑清單' : '全台點亮地圖'}</span>
              </button>

              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="py-2 px-1.5 sm:px-3 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 text-center"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden xs:inline" />
                <span className="truncate">同好排行榜</span>
              </button>

              <button
                onClick={() => setIsCommunityOpen(true)}
                className="py-2 px-1.5 sm:px-3 bg-emerald-700/90 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 text-center"
              >
                <Users className="w-3.5 h-3.5 text-emerald-300 shrink-0 hidden xs:inline" />
                <span className="truncate">加入LINE/FB社群</span>
              </button>

            </div>
          </div>
        </div>

        {/* Interactive Map View */}
        {viewMode === 'map' && (
          <TaiwanMap
            districts={districts}
            progressMap={progressMap}
            selectedCounty={selectedCounty}
            onSelectCounty={(c) => setSelectedCounty(c)}
            onSelectDistrict={(d) => setActiveCheckinDistrict(d)}
          />
        )}

        {/* Filter and Search Toolbar */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-3.5 sm:p-4 mb-5 space-y-3">
          
          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['全部', '北部', '中部', '南部', '東部', '離島'].map((region) => {
              const isActive = selectedRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => {
                    setSelectedRegion(region);
                    setSelectedCounty('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>

          {/* Search bar & Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋鄉鎮、縣市、景點（如：九份、肉圓、溫泉）..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* County Filter Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium"
              >
                <option value="">全部縣市 ({countiesInRegion.length} 個縣市)</option>
                {countiesInRegion.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium"
              >
                <option value="all">全部打卡狀態</option>
                <option value="completed">🌟 6/6 全制霸</option>
                <option value="in_progress">👣 踏破進行中 (1~5點)</option>
                <option value="unvisited">⚪ 尚未造訪</option>
              </select>
            </div>

          </div>

          {/* Active Filter Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              顯示符合條件的 <b className="text-emerald-700">{filteredDistricts.length}</b> 個鄉鎮市區
            </span>

            {(selectedRegion !== '全部' || selectedCounty || statusFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedRegion('全部');
                  setSelectedCounty('');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置所有篩選</span>
              </button>
            )}
          </div>

        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">正在載入 368 鄉鎮資料庫...</p>
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600 text-base">找不到符合條件的鄉鎮市區</p>
            <p className="text-xs text-slate-400 mt-1">請嘗試更換關鍵字或清除篩選條件</p>
          </div>
        ) : (
          /* District Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDistricts.map((district) => (
              <DistrictCard
                key={district.id}
                district={district}
                progress={progressMap[district.id]}
                onToggleSpot={handleToggleSpot}
                onOpenCheckin={(d) => setActiveCheckinDistrict(d)}
                onOpenShareCard={(d) => setActiveShareDistrict(d)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-sm font-bold text-slate-200 font-serif-tw">
            【愛台灣 368 行腳】踏破全台鄉鎮市區計劃
          </p>
          <p className="text-xs text-slate-400">
            共 368 行政區 • 1,104 必訪景點 • 1,104 必吃美食 • 離線優先 PWA
          </p>
          <p className="text-xs text-amber-400 font-medium tracking-wide pt-2">
            @2026 by Famidoc Chang & Antigravity 2.0
          </p>
          <p className="text-[11px] text-slate-500">
            Made with ❤️ for Taiwan Explorers. 所有打卡資料均妥善保存在您的設備中。
          </p>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Check-in & Photo Modal */}
      <CheckinModal
        district={activeCheckinDistrict}
        progress={activeCheckinDistrict ? progressMap[activeCheckinDistrict.id] : null}
        isOpen={Boolean(activeCheckinDistrict)}
        onClose={() => setActiveCheckinDistrict(null)}
        onSaveProgress={handleSaveProgress}
        onOpenShareCard={(d) => setActiveShareDistrict(d)}
      />

      {/* 2. Share Polaroid Achievement Card Modal */}
      <ShareCardModal
        district={activeShareDistrict}
        progress={activeShareDistrict ? progressMap[activeShareDistrict.id] : null}
        stats={stats}
        userProfile={userProfile}
        isOpen={Boolean(activeShareDistrict)}
        onClose={() => setActiveShareDistrict(null)}
      />

      {/* 3. Leaderboard Modal */}
      <LeaderboardModal
        userProfile={userProfile}
        progressMap={progressMap}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* 4. Google Drive Sync & Local JSON Backup Modal */}
      <CloudSyncModal
        userProfile={userProfile}
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onProgressRestored={handleProgressRestored}
        onProgressReset={handleProgressReset}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* 5. FB & LINE Community Banner Modal */}
      <CommunityBanner
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
      />

    </div>
  );
}
