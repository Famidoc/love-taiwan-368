import React, { useState } from 'react';
import { 
  MapPin, 
  Utensils, 
  Camera, 
  CheckCircle2, 
  Circle, 
  Share2, 
  Edit3, 
  Star, 
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Users,
  Plus,
  Trash2,
  Flag,
  AlertTriangle
} from 'lucide-react';
import { getSpotReportInfo } from '../services/spotReportService';


export default function DistrictCard({
  district,
  progress,
  onToggleSpot,
  onOpenCheckin,
  onOpenShareCard,
  onOpenPioneers,
  onAddCustomSpot,
  onRemoveCustomSpot,
  spotReports,
  onOpenReport
}) {
  const [isAddingAttraction, setIsAddingAttraction] = useState(false);
  const [newAttractionName, setNewAttractionName] = useState('');
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');

  const attractionsChecked = progress?.attractionsChecked || [];
  const foodsChecked = progress?.foodsChecked || [];
  const customAttractions = progress?.customAttractions || [];
  const customFoods = progress?.customFoods || [];

  const totalChecked = attractionsChecked.length + foodsChecked.length;
  // 新全制霸規則：打卡景點 >= 3 且 打卡美食 >= 3
  const isAllCompleted = attractionsChecked.length >= 3 && foodsChecked.length >= 3;
  const completedAttractionsCount = Math.min(attractionsChecked.length, 3);
  const completedFoodsCount = Math.min(foodsChecked.length, 3);
  const progressPercent = Math.min(100, Math.round(((completedAttractionsCount + completedFoodsCount) / 6) * 100));

  const hasPhotos = progress?.photos && progress.photos.length > 0;
  const hasNotes = Boolean(progress?.notes);
  const rating = progress?.rating || 0;

  // Region colors
  const regionColors = {
    '北部': 'bg-sky-100 text-sky-800 border-sky-200',
    '中部': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    '南部': 'bg-amber-100 text-amber-800 border-amber-200',
    '東部': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    '離島': 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const getGoogleMapsUrl = (spotName) => {
    const query = `${district.county}${district.township} ${spotName}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  return (
    <div className={`rounded-2xl transition-all duration-300 border bg-white flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
      isAllCompleted
        ? 'ring-2 ring-emerald-500/80 border-emerald-400 bg-gradient-to-b from-emerald-50/40 to-white'
        : totalChecked > 0
        ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-b from-amber-50/20 to-white'
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* Card Header */}
      <div className="p-3.5 sm:p-4 pb-2.5 sm:pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border ${regionColors[district.region] || 'bg-slate-100 text-slate-700'}`}>
                {district.region}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                #{district.id.toString().padStart(3, '0')} • {district.postalCode}
              </span>
            </div>
            
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xs font-semibold text-slate-500">{district.county}</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-serif-tw tracking-wide">
                {district.township}
              </h3>
              <span className="text-[10px] sm:text-[11px] text-slate-400">({district.districtType})</span>
            </div>
          </div>

          {/* Status Badge & Pioneers Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pioneers Button */}
            <button
              onClick={() => onOpenPioneers && onOpenPioneers(district)}
              className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer"
              title="查看踏訪本區的先行者同好名冊"
            >
              <Users className="w-3 h-3 text-emerald-600" />
              <span>先行者</span>
            </button>

            {/* Status Badge */}
            {isAllCompleted ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>全制霸</span>
              </span>
            ) : totalChecked > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <span>景點{attractionsChecked.length}/3 • 美食{foodsChecked.length}/3</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs text-slate-400 bg-slate-100 border border-slate-200">
                未造訪
              </span>
            )}
          </div>


        </div>

        {/* Progress Bar inside card */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isAllCompleted ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Spots List: Attractions & Foods */}
      <div className="p-3.5 sm:p-4 space-y-3.5 flex-1">
        
        {/* Attractions */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5 text-sky-700">
              <Camera className="w-3.5 h-3.5" />
              <span>景點打卡（滿 3 點即達標）</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              attractionsChecked.length >= 3 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-400 bg-slate-100'
            }`}>
              {attractionsChecked.length}/3
            </span>
          </div>

          <div className="space-y-1.5">
            {/* 官方推薦景點 */}
            {district.attractions.map((att, idx) => {
              const isChecked = attractionsChecked.includes(att.id);
              const repInfo = getSpotReportInfo(spotReports, att.id);

              return (
                <div
                  key={att.id}
                  onClick={() => onToggleSpot(district.id, 'attraction', att.id)}
                  className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-all border cursor-pointer select-none ${
                    isChecked
                      ? 'bg-sky-50 text-sky-900 border-sky-200 font-medium'
                      : repInfo
                      ? 'bg-rose-50/40 text-slate-700 border-rose-200 hover:bg-rose-50/70'
                      : 'bg-slate-50/70 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">推薦{idx + 1}</span>
                    <span className={`truncate ${repInfo?.reason === 'closed' ? 'line-through text-slate-400' : ''}`}>
                      {att.name}
                    </span>
                    {repInfo && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 flex items-center gap-0.5 ${
                          repInfo.reason === 'closed'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                        title={`已有 ${repInfo.count} 位同好回報「${repInfo.label}」`}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{repInfo.label}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={getGoogleMapsUrl(att.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded-lg transition-colors"
                      title="開啟 Google 地圖定位導航"
                    >
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    </a>

                    {/* 回報狀態按鈕 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReport?.(district, att, 'attraction');
                      }}
                      className={`p-1 rounded-lg transition-colors ${
                        repInfo
                          ? 'text-rose-500 hover:bg-rose-100'
                          : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={repInfo ? `已被標註為「${repInfo.label}」，點此查看或平反` : '回報店家狀態（已歇業 / 找不到）'}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-sky-600 fill-sky-100" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 使用者自訂私房景點 */}
            {customAttractions.map((cAtt) => {
              const isChecked = attractionsChecked.includes(cAtt.id);
              return (
                <div
                  key={cAtt.id}
                  onClick={() => onToggleSpot(district.id, 'attraction', cAtt.id)}
                  className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-all border cursor-pointer select-none ${
                    isChecked
                      ? 'bg-sky-50 text-sky-900 border-sky-300 font-medium ring-1 ring-sky-200'
                      : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-50/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-200/80 text-sky-900 shrink-0">私房</span>
                    <span className="truncate">{cAtt.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={getGoogleMapsUrl(cAtt.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded-lg transition-colors"
                      title="開啟 Google 地圖定位導航"
                    >
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCustomSpot?.(district.id, 'attraction', cAtt.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="刪除此自訂景點"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-sky-600 fill-sky-100" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 新增私房景點按鈕與表單 */}
            {isAddingAttraction ? (
              <div className="flex items-center gap-1.5 mt-1.5 p-1.5 bg-sky-50/80 rounded-xl border border-sky-200">
                <input
                  type="text"
                  placeholder="輸入私房景點名稱..."
                  value={newAttractionName}
                  onChange={(e) => setNewAttractionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!newAttractionName.trim()) return;
                      onAddCustomSpot?.(district.id, 'attraction', newAttractionName.trim());
                      setNewAttractionName('');
                      setIsAddingAttraction(false);
                    }
                  }}
                  className="flex-1 text-xs px-2.5 py-1 bg-white border border-sky-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newAttractionName.trim()) return;
                    onAddCustomSpot?.(district.id, 'attraction', newAttractionName.trim());
                    setNewAttractionName('');
                    setIsAddingAttraction(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
                >
                  新增
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAttraction(false);
                    setNewAttractionName('');
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingAttraction(true)}
                className="w-full mt-1 py-1 px-2 text-[11px] font-medium text-sky-700 hover:text-sky-900 bg-sky-50/40 hover:bg-sky-100/60 border border-dashed border-sky-300 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>＋ 新增私房景點</span>
              </button>
            )}
          </div>
        </div>

        {/* Foods */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5 text-orange-700">
              <Utensils className="w-3.5 h-3.5" />
              <span>美食打卡（滿 3 點即達標）</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              foodsChecked.length >= 3 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-400 bg-slate-100'
            }`}>
              {foodsChecked.length}/3
            </span>
          </div>

          <div className="space-y-1.5">
            {/* 官方推薦美食 */}
            {district.foods.map((food, idx) => {
              const isChecked = foodsChecked.includes(food.id);
              const repInfo = getSpotReportInfo(spotReports, food.id);

              return (
                <div
                  key={food.id}
                  onClick={() => onToggleSpot(district.id, 'food', food.id)}
                  className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-all border cursor-pointer select-none ${
                    isChecked
                      ? 'bg-orange-50 text-orange-950 border-orange-200 font-medium'
                      : repInfo
                      ? 'bg-rose-50/40 text-slate-700 border-rose-200 hover:bg-rose-50/70'
                      : 'bg-slate-50/70 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">推薦{idx + 1}</span>
                    <span className={`truncate ${repInfo?.reason === 'closed' ? 'line-through text-slate-400' : ''}`}>
                      {food.name}
                    </span>
                    {repInfo && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 flex items-center gap-0.5 ${
                          repInfo.reason === 'closed'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                        title={`已有 ${repInfo.count} 位同好回報「${repInfo.label}」`}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{repInfo.label}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={getGoogleMapsUrl(food.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                      title="開啟 Google 地圖定位導航"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    </a>

                    {/* 回報狀態按鈕 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReport?.(district, food, 'food');
                      }}
                      className={`p-1 rounded-lg transition-colors ${
                        repInfo
                          ? 'text-rose-500 hover:bg-rose-100'
                          : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={repInfo ? `已被標註為「${repInfo.label}」，點此查看或平反` : '回報店家狀態（已歇業 / 找不到）'}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-orange-600 fill-orange-100" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 使用者自訂私房美食 */}
            {customFoods.map((cFood) => {
              const isChecked = foodsChecked.includes(cFood.id);
              return (
                <div
                  key={cFood.id}
                  onClick={() => onToggleSpot(district.id, 'food', cFood.id)}
                  className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-all border cursor-pointer select-none ${
                    isChecked
                      ? 'bg-orange-50 text-orange-950 border-orange-300 font-medium ring-1 ring-orange-200'
                      : 'bg-white text-slate-700 border-orange-200 hover:bg-orange-50/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-200/80 text-orange-900 shrink-0">私房</span>
                    <span className="truncate">{cFood.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={getGoogleMapsUrl(cFood.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                      title="開啟 Google 地圖定位導航"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCustomSpot?.(district.id, 'food', cFood.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="刪除此自訂美食"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-orange-600 fill-orange-100" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 新增私房美食按鈕與表單 */}
            {isAddingFood ? (
              <div className="flex items-center gap-1.5 mt-1.5 p-1.5 bg-orange-50/80 rounded-xl border border-orange-200">
                <input
                  type="text"
                  placeholder="輸入私房美食名稱..."
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!newFoodName.trim()) return;
                      onAddCustomSpot?.(district.id, 'food', newFoodName.trim());
                      setNewFoodName('');
                      setIsAddingFood(false);
                    }
                  }}
                  className="flex-1 text-xs px-2.5 py-1 bg-white border border-orange-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newFoodName.trim()) return;
                    onAddCustomSpot?.(district.id, 'food', newFoodName.trim());
                    setNewFoodName('');
                    setIsAddingFood(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  新增
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFood(false);
                    setNewFoodName('');
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingFood(true)}
                className="w-full mt-1 py-1 px-2 text-[11px] font-medium text-orange-700 hover:text-orange-900 bg-orange-50/40 hover:bg-orange-100/60 border border-dashed border-orange-300 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>＋ 新增私房美食</span>
              </button>
            )}
          </div>
        </div>

        {/* User Attached Photo Preview & Notes Snippet */}
        {(hasPhotos || hasNotes || rating > 0) && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/80 p-2.5 rounded-xl">
            <div className="flex items-center gap-2 truncate">
              {hasPhotos && (
                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                  <img
                    src={progress.photos[0].dataUrl}
                    alt="佐證照片"
                    className="w-full h-full object-cover"
                  />
                  {progress.photos.length > 1 && (
                    <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-0.5 rounded-tl font-bold">
                      +{progress.photos.length - 1}
                    </span>
                  )}
                </div>
              )}
              <div className="truncate">
                {rating > 0 && (
                  <div className="flex items-center text-amber-500 text-[10px] mb-0.5">
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </div>
                )}
                {hasNotes ? (
                  <p className="text-[11px] text-slate-600 truncate italic">
                    "{progress.notes}"
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400">已附 {progress.photos.length} 張佐證照片</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Card Footer Actions */}
      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenCheckin(district)}
          className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{totalChecked > 0 ? '記錄 / 拍照' : '打卡 / 隨手記'}</span>
        </button>

        <button
          onClick={() => onOpenShareCard(district)}
          className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-xs"
          title="生成足跡拍立得卡片"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>📸 拍立得</span>
        </button>
      </div>

    </div>
  );
}
