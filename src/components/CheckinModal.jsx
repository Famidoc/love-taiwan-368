import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Star, 
  Calendar, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Utensils, 
  Upload, 
  Loader2, 
  Share2, 
  Image as ImageIcon,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressImage } from '../services/storage';

export default function CheckinModal({
  district,
  progress,
  isOpen,
  onClose,
  onSaveProgress,
  onOpenShareCard
}) {
  if (!isOpen || !district) return null;

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [attractionsChecked, setAttractionsChecked] = useState([]);
  const [foodsChecked, setFoodsChecked] = useState([]);
  const [rating, setRating] = useState(5);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  useEffect(() => {
    if (progress) {
      setAttractionsChecked(progress.attractionsChecked || []);
      setFoodsChecked(progress.foodsChecked || []);
      setRating(progress.rating || 5);
      setVisitDate(progress.completedDate || new Date().toISOString().split('T')[0]);
      setNotes(progress.notes || '');
      setPhotos(progress.photos || []);
    } else {
      setAttractionsChecked([]);
      setFoodsChecked([]);
      setRating(5);
      setVisitDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPhotos([]);
    }
    setShowUnsavedConfirm(false);
  }, [district, progress, isOpen]);

  const toggleAttraction = (id) => {
    setAttractionsChecked(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      checkCelebration(next.length, foodsChecked.length);
      return next;
    });
  };

  const toggleFood = (id) => {
    setFoodsChecked(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      checkCelebration(attractionsChecked.length, next.length);
      return next;
    });
  };

  const checkCelebration = (attCount, foodCount) => {
    if (attCount === 3 && foodCount === 3) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#0284c7', '#ec4899']
      });
    }
  };

  const getGoogleMapsUrl = (spotName) => {
    const query = `${district.county}${district.township} ${spotName}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handlePhotoFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 6) {
      alert(`每個鄉鎮最多支援上傳 6 張照片（3景點+3美食）！目前已有 ${photos.length} 張。`);
      return;
    }

    setIsCompressing(true);
    try {
      const compressedList = [];
      for (const file of files) {
        const dataUrl = await compressImage(file, 1000, 0.82);
        compressedList.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          dataUrl,
          createdAt: new Date().toISOString()
        });
      }
      setPhotos(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Image compression failed:', err);
      alert('照片處理失敗：' + (err.message || '請重新選取'));
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Check if user has unsaved modifications
  const checkHasUnsavedChanges = () => {
    const initialAtts = progress?.attractionsChecked || [];
    const initialFoods = progress?.foodsChecked || [];
    const initialRating = progress?.rating || 5;
    const initialNotes = progress?.notes || '';
    const initialPhotos = progress?.photos || [];
    const initialDate = progress?.completedDate || new Date().toISOString().split('T')[0];

    const attsChanged = JSON.stringify([...attractionsChecked].sort()) !== JSON.stringify([...initialAtts].sort());
    const foodsChanged = JSON.stringify([...foodsChecked].sort()) !== JSON.stringify([...initialFoods].sort());
    const ratingChanged = rating !== initialRating;
    const notesChanged = (notes || '').trim() !== initialNotes.trim();
    const photosChanged = photos.length !== initialPhotos.length || JSON.stringify(photos.map(p => p.id)) !== JSON.stringify(initialPhotos.map(p => p.id));
    const dateChanged = visitDate !== initialDate;

    return attsChanged || foodsChanged || ratingChanged || notesChanged || photosChanged || dateChanged;
  };

  // Guard when closing
  const handleAttemptClose = () => {
    if (checkHasUnsavedChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    const total = attractionsChecked.length + foodsChecked.length;
    const isCompleted = total === 6;

    const data = {
      districtId: district.id,
      county: district.county,
      township: district.township,
      visited: total > 0,
      isCompleted,
      completedDate: visitDate,
      attractionsChecked,
      foodsChecked,
      rating,
      notes,
      photos,
      updatedAt: new Date().toISOString()
    };

    onSaveProgress(district.id, data);
    setShowUnsavedConfirm(false);
    onClose();
  };

  const handleSaveAndShare = () => {
    const total = attractionsChecked.length + foodsChecked.length;
    const isCompleted = total === 6;

    const data = {
      districtId: district.id,
      county: district.county,
      township: district.township,
      visited: total > 0,
      isCompleted,
      completedDate: visitDate,
      attractionsChecked,
      foodsChecked,
      rating,
      notes,
      photos,
      updatedAt: new Date().toISOString()
    };

    onSaveProgress(district.id, data);
    setShowUnsavedConfirm(false);
    onClose();
    if (onOpenShareCard) {
      setTimeout(() => {
        onOpenShareCard(district);
      }, 150);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 relative">
          <button
            onClick={handleAttemptClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold">
            <span>{district.region}分區</span>
            <span>•</span>
            <span>郵遞區號 {district.postalCode}</span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-emerald-100 font-medium">{district.county}</span>
            <h2 className="text-xl sm:text-2xl font-black font-serif-tw tracking-wide text-amber-300">
              {district.township}
            </h2>
            <span className="text-xs bg-emerald-950/60 px-2 py-0.5 rounded-md text-emerald-200">
              {district.districtType}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[68vh] space-y-5">
          
          {/* Attractions */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5 text-sky-700">
                <Camera className="w-4 h-4" />
                <span>必訪 3 大景點打卡</span>
              </span>
              <span className="text-slate-400 font-mono">
                {attractionsChecked.length}/3
              </span>
            </div>

            <div className="space-y-2">
              {district.attractions.map((att, idx) => {
                const isChecked = attractionsChecked.includes(att.id);
                return (
                  <div
                    key={att.id}
                    onClick={() => toggleAttraction(att.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-sky-50 border-sky-300 text-sky-950 font-medium shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-mono flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold truncate">
                        {att.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getGoogleMapsUrl(att.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded-xl transition-colors"
                        title="開啟 Google 地圖定位導航"
                      >
                        <MapPin className="w-4 h-4 text-sky-500" />
                      </a>

                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-sky-600 fill-sky-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Foods */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5 text-orange-700">
                <Utensils className="w-4 h-4" />
                <span>必吃 3 大在地美食打卡</span>
              </span>
              <span className="text-slate-400 font-mono">
                {foodsChecked.length}/3
              </span>
            </div>

            <div className="space-y-2">
              {district.foods.map((food, idx) => {
                const isChecked = foodsChecked.includes(food.id);
                return (
                  <div
                    key={food.id}
                    onClick={() => toggleFood(food.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-orange-50 border-orange-300 text-orange-950 font-medium shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-mono flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold truncate">
                        {food.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getGoogleMapsUrl(food.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-xl transition-colors"
                        title="開啟 Google 地圖定位導航"
                      >
                        <MapPin className="w-4 h-4 text-orange-500" />
                      </a>

                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-orange-600 fill-orange-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visit Date & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>踩點日期</span>
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>鄉鎮體驗評分 ({rating} 星)</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Photo Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>佐證相片手帳 (支援 3 景點 + 3 美食，最多 6 張)</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {photos.length}/6
              </span>
            </div>

            {/* Hidden native file inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoFiles(e.target.files)}
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoFiles(e.target.files)}
            />

            {/* Photo Thumbnails Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2.5">
              {photos.map((p, idx) => (
                <div
                  key={p.id}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-2xs"
                >
                  <img
                    src={p.dataUrl}
                    alt={`足跡照片 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                    title="刪除此照片"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload trigger buttons if not full */}
              {photos.length < 6 && (
                <>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className="aspect-square rounded-2xl border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center text-emerald-700 gap-1 transition-all cursor-pointer"
                    title="開啟手機相機立即拍照"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[10px] font-bold">相機拍照</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isCompressing}
                    className="aspect-square rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-600 gap-1 transition-all cursor-pointer"
                    title="從相簿選取照片"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[10px] font-bold">選取相簿</span>
                  </button>
                </>
              )}
            </div>

            {isCompressing && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 text-xs text-emerald-800 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>正在以高畫質智慧壓縮照片...</span>
              </div>
            )}
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              旅行隨手筆記 / 私房心得
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="記錄沿途風景、店家營業時段、特別推薦的隱藏版吃法或溫暖人情味..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSaveAndShare}
            className="w-full sm:w-auto px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-700" />
            <span>儲存並生成拍立得</span>
          </button>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>儲存紀錄</span>
            </button>
          </div>
        </div>

        {/* Unsaved Changes Confirmation Guard */}
        {showUnsavedConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl shadow-2xs">
                ⚠️
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  您有尚未儲存的打卡內容！
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  包含您剛剛勾選的景點/美食、撰寫的心得或拍攝的照片。是否要立即為您儲存？
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>儲存紀錄並關閉</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    onClose();
                  }}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                >
                  放棄本次修改
                </button>

                <button
                  type="button"
                  onClick={() => setShowUnsavedConfirm(false)}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  返回繼續編輯
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
