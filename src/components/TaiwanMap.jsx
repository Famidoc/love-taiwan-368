import React, { useState } from 'react';
import { MapPin, CheckCircle2, ChevronRight, Award, Compass } from 'lucide-react';

// County coordinate nodes for visual layout and responsive interactive map
const COUNTIES_LAYOUT = [
  // Northern Taiwan
  { id: '基隆市', name: '基隆市', region: '北部', x: 74, y: 12, size: 'sm', townshipsCount: 7 },
  { id: '臺北市', name: '臺北市', region: '北部', x: 67, y: 17, size: 'md', townshipsCount: 12 },
  { id: '新北市', name: '新北市', region: '北部', x: 62, y: 22, size: 'lg', townshipsCount: 29 },
  { id: '桃園市', name: '桃園市', region: '北部', x: 50, y: 24, size: 'md', townshipsCount: 13 },
  { id: '新竹市', name: '新竹市', region: '北部', x: 44, y: 30, size: 'sm', townshipsCount: 3 },
  { id: '新竹縣', name: '新竹縣', region: '北部', x: 52, y: 33, size: 'md', townshipsCount: 13 },
  { id: '宜蘭縣', name: '宜蘭縣', region: '東部', x: 73, y: 31, size: 'md', townshipsCount: 12 },

  // Central Taiwan
  { id: '苗栗縣', name: '苗栗縣', region: '中部', x: 44, y: 39, size: 'md', townshipsCount: 18 },
  { id: '臺中市', name: '臺中市', region: '中部', x: 42, y: 46, size: 'lg', townshipsCount: 29 },
  { id: '彰化縣', name: '彰化縣', region: '中部', x: 33, y: 52, size: 'md', townshipsCount: 26 },
  { id: '南投縣', name: '南投縣', region: '中部', x: 53, y: 52, size: 'lg', townshipsCount: 13 },
  { id: '雲林縣', name: '雲林縣', region: '中部', x: 32, y: 60, size: 'md', townshipsCount: 20 },

  // Southern Taiwan
  { id: '嘉義市', name: '嘉義市', region: '南部', x: 34, y: 66, size: 'sm', townshipsCount: 2 },
  { id: '嘉義縣', name: '嘉義縣', region: '南部', x: 42, y: 68, size: 'lg', townshipsCount: 18 },
  { id: '臺南市', name: '臺南市', region: '南部', x: 31, y: 75, size: 'lg', townshipsCount: 37 },
  { id: '高雄市', name: '高雄市', region: '南部', x: 42, y: 80, size: 'lg', townshipsCount: 38 },
  { id: '屏東縣', name: '屏東縣', region: '南部', x: 46, y: 90, size: 'lg', townshipsCount: 33 },

  // Eastern Taiwan
  { id: '花蓮縣', name: '花蓮縣', region: '東部', x: 68, y: 50, size: 'lg', townshipsCount: 13 },
  { id: '臺東縣', name: '臺東縣', region: '東部', x: 62, y: 77, size: 'lg', townshipsCount: 16 },

  // Islands
  { id: '澎湖縣', name: '澎湖縣', region: '離島', x: 14, y: 55, size: 'md', townshipsCount: 6 },
  { id: '金門縣', name: '金門縣', region: '離島', x: 12, y: 25, size: 'md', townshipsCount: 6 },
  { id: '連江縣', name: '連江縣', region: '離島', x: 22, y: 10, size: 'md', townshipsCount: 4 },
];

export default function TaiwanMap({
  districts,
  progressMap,
  selectedCounty,
  onSelectCounty,
  onSelectDistrict
}) {
  const [hoveredCounty, setHoveredCounty] = useState(null);

  // Compute county stats
  const countyStats = {};
  COUNTIES_LAYOUT.forEach(c => {
    countyStats[c.id] = {
      total: 0,
      unlocked: 0,
      totalSpots: 0,
      checkedSpots: 0,
      districts: []
    };
  });

  districts.forEach(d => {
    if (!countyStats[d.county]) {
      countyStats[d.county] = { total: 0, unlocked: 0, totalSpots: 0, checkedSpots: 0, districts: [] };
    }
    const stat = countyStats[d.county];
    stat.total += 1;
    stat.districts.push(d);
    
    const userProg = progressMap[d.id];
    if (userProg) {
      const checked = (userProg.attractionsChecked?.length || 0) + (userProg.foodsChecked?.length || 0);
      stat.checkedSpots += checked;
      if (checked > 0) {
        stat.unlocked += 1;
      }
    }
    stat.totalSpots += (d.attractions.length + d.foods.length);
  });

  const activeCounty = selectedCounty || hoveredCounty;
  const activeCountyData = activeCounty ? countyStats[activeCounty] : null;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>台灣 22 縣市足跡點亮地圖</span>
          </h2>
          <p className="text-xs text-slate-500">
            點擊任一縣市可查看各鄉鎮完成度與快速定位
          </p>
        </div>

        {selectedCounty && (
          <button
            onClick={() => onSelectCounty('')}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg self-start sm:self-auto transition-colors"
          >
            ✕ 清除縣市篩選 (顯示全台)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual Map Matrix */}
        <div className="lg:col-span-7 relative min-h-[420px] sm:min-h-[480px] bg-gradient-to-b from-sky-50/50 via-emerald-50/30 to-amber-50/30 rounded-2xl p-4 border border-slate-200/80 overflow-hidden flex items-center justify-center">
          
          {/* Subtle Taiwan Outline Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="text-9xl font-black text-emerald-950 font-serif-tw">368</span>
          </div>

          <div className="relative w-full max-w-[420px] h-[440px]">
            {COUNTIES_LAYOUT.map(county => {
              const stat = countyStats[county.id] || { total: county.townshipsCount, unlocked: 0 };
              const percent = stat.total > 0 ? Math.round((stat.unlocked / stat.total) * 100) : 0;
              const isSelected = selectedCounty === county.id;
              const isCompleted = percent === 100;
              const isPartiallyDone = percent > 0;

              let bgClass = 'bg-white/90 text-slate-700 border-slate-300 shadow-sm';
              if (isSelected) {
                bgClass = 'bg-amber-400 text-emerald-950 font-bold border-amber-600 ring-4 ring-amber-200 shadow-lg scale-110 z-20';
              } else if (isCompleted) {
                bgClass = 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-md ring-2 ring-emerald-300';
              } else if (isPartiallyDone) {
                bgClass = 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold shadow-sm';
              }

              return (
                <button
                  key={county.id}
                  onClick={() => onSelectCounty(selectedCounty === county.id ? '' : county.id)}
                  onMouseEnter={() => setHoveredCounty(county.id)}
                  onMouseLeave={() => setHoveredCounty(null)}
                  style={{
                    position: 'absolute',
                    left: `${county.x}%`,
                    top: `${county.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`px-2 py-1 rounded-xl text-xs flex flex-col items-center justify-center transition-all duration-200 border cursor-pointer ${bgClass}`}
                  title={`${county.name}：已踩破 ${stat.unlocked}/${stat.total} 鄉鎮 (${percent}%)`}
                >
                  <div className="flex items-center gap-0.5 whitespace-nowrap leading-none">
                    <span>{county.name.replace('市', '').replace('縣', '')}</span>
                    {isCompleted && <Award className="w-3 h-3 text-amber-300 shrink-0" />}
                  </div>
                  <span className="text-[10px] opacity-80 font-mono mt-0.5 leading-none">
                    {stat.unlocked}/{stat.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200 text-[10px] text-slate-600 flex flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600 border border-emerald-700" />
              100% 制霸
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400" />
              踏破中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300" />
              未造訪
            </span>
          </div>

        </div>

        {/* Selected County Township Breakdown Panel */}
        <div className="lg:col-span-5 flex flex-col">
          {activeCounty && activeCountyData ? (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 h-full flex flex-col">
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {activeCounty.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{activeCounty}</h3>
                    <p className="text-xs text-slate-500">
                      轄下共 {activeCountyData.total} 個鄉鎮市區
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500">踏破進度</span>
                  <div className="text-base font-black text-emerald-700">
                    {activeCountyData.unlocked} / {activeCountyData.total}
                    <span className="text-xs text-slate-600 ml-1">
                      ({activeCountyData.total > 0 ? Math.round((activeCountyData.unlocked / activeCountyData.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar for county */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${activeCountyData.total > 0 ? (activeCountyData.unlocked / activeCountyData.total) * 100 : 0}%`
                  }}
                />
              </div>

              {/* Township Chips */}
              <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-1.5">
                {activeCountyData.districts.map(d => {
                  const userProg = progressMap[d.id];
                  const attractionsChecked = userProg?.attractionsChecked?.length || 0;
                  const foodsChecked = userProg?.foodsChecked?.length || 0;
                  const totalChecked = attractionsChecked + foodsChecked;
                  const isDone = totalChecked === 6;
                  const isPartial = totalChecked > 0 && !isDone;

                  return (
                    <div
                      key={d.id}
                      onClick={() => onSelectDistrict(d)}
                      className={`p-2 rounded-xl text-xs flex items-center justify-between border cursor-pointer transition-all ${
                        isDone
                          ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          : isPartial
                          ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone 
                            ? 'bg-emerald-600 text-white' 
                            : isPartial 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {d.id}
                        </span>
                        <span className="font-bold text-slate-800">{d.township}</span>
                        <span className="text-[10px] text-slate-400">{d.postalCode}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${
                          isDone ? 'text-emerald-700' : isPartial ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          {totalChecked}/6 點完成
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full flex flex-col items-center justify-center text-center text-slate-400">
              <MapPin className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-bold text-slate-600 text-sm">請點擊左側地圖任一縣市</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                查看該縣市轄下的鄉鎮市區、打卡完成狀況與快速開箱景點美食
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
