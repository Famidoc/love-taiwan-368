import React from 'react';
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
  Sparkles
} from 'lucide-react';

export default function DistrictCard({
  district,
  progress,
  onToggleSpot,
  onOpenCheckin,
  onOpenShareCard
}) {
  const attractionsChecked = progress?.attractionsChecked || [];
  const foodsChecked = progress?.foodsChecked || [];
  const totalChecked = attractionsChecked.length + foodsChecked.length;
  const isAllCompleted = totalChecked === 6;
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

  return (
    <div className={`rounded-2xl transition-all duration-300 border bg-white flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
      isAllCompleted
        ? 'ring-2 ring-emerald-500/80 border-emerald-400 bg-gradient-to-b from-emerald-50/40 to-white'
        : totalChecked > 0
        ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-b from-amber-50/20 to-white'
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* Card Header */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${regionColors[district.region] || 'bg-slate-100 text-slate-700'}`}>
                {district.region}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                #{district.id.toString().padStart(3, '0')} • {district.postalCode}
              </span>
            </div>
            
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xs font-semibold text-slate-500">{district.county}</span>
              <h3 className="text-lg font-black text-slate-900 font-serif-tw tracking-wide">
                {district.township}
              </h3>
              <span className="text-[11px] text-slate-400">({district.districtType})</span>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isAllCompleted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>全制霸</span>
              </span>
            ) : totalChecked > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <span>{totalChecked}/6 完成</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-slate-400 bg-slate-100">
                未造訪
              </span>
            )}
          </div>

        </div>

        {/* Progress Bar inside card */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isAllCompleted ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            style={{ width: `${(totalChecked / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Spots List: Attractions & Foods */}
      <div className="p-4 space-y-4 flex-1">
        
        {/* Attractions */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5 text-sky-700">
              <Camera className="w-3.5 h-3.5" />
              <span>必訪 3 大景點</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {attractionsChecked.length}/3
            </span>
          </div>

          <div className="space-y-1.5">
            {district.attractions.map((att, idx) => {
              const isChecked = attractionsChecked.includes(att.id);
              return (
                <button
                  key={att.id}
                  onClick={() => onToggleSpot(district.id, 'attraction', att.id)}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all border ${
                    isChecked
                      ? 'bg-sky-50 text-sky-900 border-sky-200 font-medium'
                      : 'bg-slate-50/70 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">景點{idx + 1}</span>
                    <span className="truncate">{att.name}</span>
                  </div>
                  <div className="shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-sky-600 fill-sky-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Foods */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5 text-orange-700">
              <Utensils className="w-3.5 h-3.5" />
              <span>必吃 3 大美食</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {foodsChecked.length}/3
            </span>
          </div>

          <div className="space-y-1.5">
            {district.foods.map((food, idx) => {
              const isChecked = foodsChecked.includes(food.id);
              return (
                <button
                  key={food.id}
                  onClick={() => onToggleSpot(district.id, 'food', food.id)}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all border ${
                    isChecked
                      ? 'bg-orange-50 text-orange-950 border-orange-200 font-medium'
                      : 'bg-slate-50/70 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">美食{idx + 1}</span>
                    <span className="truncate">{food.name}</span>
                  </div>
                  <div className="shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-orange-600 fill-orange-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </button>
              );
            })}
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
                  <span className="text-[10px] text-slate-400">已附佐證照片</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenCheckin(district)}
          className="flex-1 py-1.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{totalChecked > 0 ? '編輯記錄/拍照' : '打卡與隨手記'}</span>
        </button>

        <button
          onClick={() => onOpenShareCard(district)}
          className="p-1.5 px-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs"
          title="生成足跡拍立得卡片"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">拍立得</span>
        </button>
      </div>

    </div>
  );
}
