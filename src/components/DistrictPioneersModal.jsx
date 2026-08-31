import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  MapPin, 
  Sparkles, 
  Flag, 
  Award, 
  Star, 
  CheckCircle2, 
  Camera, 
  Compass,
  Footprints,
  RefreshCw
} from 'lucide-react';
import { getDistrictPioneers, fetchCloudLeaderboard } from '../services/leaderboardApi';

export default function DistrictPioneersModal({
  district,
  progress,
  userProfile,
  progressMap,
  isOpen,
  onClose,
  onOpenCheckin
}) {
  if (!isOpen || !district) return null;

  const [cloudList, setCloudList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCloud = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCloudLeaderboard(userProfile, progressMap);
      setCloudList(data || []);
    } catch (err) {
      console.warn('Failed to fetch cloud pioneers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCloud();
    }
  }, [isOpen, district]);

  const pioneers = getDistrictPioneers(
    district, 
    cloudList, 
    userProfile, 
    progressMap
  );

  const myProgress = progressMap?.[district.id] || progressMap?.[Number(district.id)];
  const mySpotsCount = (myProgress?.attractionsChecked?.length || 0) + (myProgress?.foodsChecked?.length || 0);
  const isMyDistrictVisited = mySpotsCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-800 text-white p-4 sm:p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <Footprints className="w-6 h-6 text-amber-300" />
              <h2 className="text-lg sm:text-xl font-black font-serif-tw tracking-wide">
                {district.county} {district.township} • 先行者名錄
              </h2>
            </div>

            <button
              onClick={loadCloud}
              disabled={isLoading}
              className="p-1.5 bg-black/20 hover:bg-black/40 rounded-xl text-emerald-200 transition-all flex items-center gap-1 text-xs"
              title="重新整理雲端榜單"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">更新</span>
            </button>
          </div>

          <p className="text-xs text-emerald-200 mt-1">
            記錄踏訪【{district.county} {district.township}】的榮譽行腳勇者
          </p>

          {/* District Quick Tags */}
          <div className="flex items-center gap-2 mt-3 text-xs">
            <span className="bg-emerald-950/60 px-2.5 py-0.5 rounded-full text-emerald-200 border border-emerald-500/40 font-mono">
              #{district.id.toString().padStart(3, '0')}
            </span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-white font-medium">
              {district.region} • {district.districtType}
            </span>
            <span className="bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full font-bold">
              共 {pioneers.length} 位同好插旗
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* User's own status banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            isMyDistrictVisited
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{isMyDistrictVisited ? '🚩' : '⏳'}</span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm">
                  {isMyDistrictVisited ? '您已在該鄉鎮成功插旗！' : '您尚未造訪過這個鄉鎮'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isMyDistrictVisited 
                    ? `目前已完成 ${mySpotsCount}/6 個景點與美食`
                    : '踏訪此區並打卡，您的名字將出現在先行者名錄上！'}
                </p>
              </div>
            </div>

            {!isMyDistrictVisited && onOpenCheckin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckin(district);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
              >
                立即打卡
              </button>
            )}
          </div>

          {/* Pioneers List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>踏訪勇者名單 ({pioneers.length})</span>
            </h4>

            {isLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">正在同步雲端同好名錄...</p>
              </div>
            ) : pioneers.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {pioneers.map((traveler, idx) => (
                  <div
                    key={traveler.id || idx}
                    className={`p-3 sm:p-3.5 flex items-center justify-between transition-colors ${
                      traveler.isMe ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                        #{idx + 1}
                      </div>

                      <span className="text-2xl shrink-0">{traveler.avatar}</span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {traveler.nickname}
                          </span>
                          {traveler.isMe && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.2 rounded-full font-bold">
                              您
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${traveler.badgeColor}`}>
                            {traveler.badge}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="text-emerald-700 font-medium">
                            完成度 {traveler.spotsCount}/6
                          </span>
                          {traveler.rating > 0 && (
                            <span className="text-amber-500 font-bold">
                              {'★'.repeat(traveler.rating)}
                            </span>
                          )}
                          {traveler.notes && (
                            <span className="text-slate-400 truncate max-w-[120px] italic">
                              "{traveler.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        {traveler.lastActive}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 space-y-2">
                <Compass className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-700">
                  目前尚無行腳同好在此插旗！
                </p>
                <p className="text-[11px] text-slate-400">
                  成為第一位踏破【{district.county} {district.township}】的先鋒勇者吧！
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            關閉名錄
          </button>
        </div>

      </div>
    </div>
  );
}
