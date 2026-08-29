import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon
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

  const [attractionsChecked, setAttractionsChecked] = useState([]);
  const [foodsChecked, setFoodsChecked] = useState([]);
  const [rating, setRating] = useState(5);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);

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
  }, [district, progress]);

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

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 3) {
      alert('每個鄉鎮最多支援上傳 3 張精選佐證照片！');
      return;
    }

    setIsCompressing(true);
    try {
      const compressedList = [];
      for (const file of files) {
        const dataUrl = await compressImage(file, 900, 0.82);
        compressedList.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          dataUrl,
          createdAt: new Date().toISOString()
        });
      }
      setPhotos(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Image compression failed:', err);
      alert('照片處理失敗，請重試');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
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
    onClose();
    if (onOpenShareCard) {
      setTimeout(() => {
        onOpenShareCard(district);
      }, 150);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
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

          <p className="text-xs text-emerald-100 mt-1.5">
            打卡紀錄、評分與心得筆記會即時保存在您的設備中
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 max-h-[72vh] overflow-y-auto space-y-4 sm:space-y-5">
          
          {/* Attractions Checklist */}
          <div>
            <label className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>必訪 3 大景點 ({attractionsChecked.length}/3)</span>
            </label>
            <div className="space-y-2">
              {district.attractions.map((att, idx) => {
                const isChecked = attractionsChecked.includes(att.id);
                return (
                  <button
                    key={att.id}
                    onClick={() => toggleAttraction(att.id)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl text-left text-xs sm:text-sm flex items-center justify-between transition-all border ${
                      isChecked
                        ? 'bg-sky-50 text-sky-950 border-sky-300 font-semibold ring-1 ring-sky-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{att.name}</span>
                    </div>
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-sky-600 fill-sky-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Foods Checklist */}
          <div>
            <label className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>必吃 3 大美食 ({foodsChecked.length}/3)</span>
            </label>
            <div className="space-y-2">
              {district.foods.map((food, idx) => {
                const isChecked = foodsChecked.includes(food.id);
                return (
                  <button
                    key={food.id}
                    onClick={() => toggleFood(food.id)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl text-left text-xs sm:text-sm flex items-center justify-between transition-all border ${
                      isChecked
                        ? 'bg-orange-50 text-orange-950 border-orange-300 font-semibold ring-1 ring-orange-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{food.name}</span>
                    </div>
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-orange-600 fill-orange-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visit Date & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>造訪日期</span>
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>鄉鎮行腳評分</span>
              </label>
              <div className="flex items-center gap-1 py-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Photo Upload & Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>佐證照片 (上限 3 張)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                自動壓縮為輕量高清格式
              </span>
            </div>

            {/* Existing Photos Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {photos.map((p, index) => (
                  <div key={p.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-xs">
                    <img
                      src={p.dataUrl}
                      alt={`照片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors shadow-sm"
                      title="刪除照片"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Two Dedicated Upload Buttons: Camera vs Photo Album */}
            {photos.length < 3 && (
              <div className="grid grid-cols-2 gap-2">
                
                {/* 1. Direct Camera Button */}
                <label className={`py-3 px-2 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/60 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isCompressing ? 'opacity-50 pointer-events-none' : ''
                }`}>
                  <Camera className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-xs font-bold text-emerald-900">
                    直接相機拍照
                  </span>
                  <span className="text-[10px] text-emerald-600">
                    即時開啟相機拍攝
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* 2. Photo Album Gallery Button */}
                <label className={`py-3 px-2 rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/60 hover:bg-sky-100/60 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isCompressing ? 'opacity-50 pointer-events-none' : ''
                }`}>
                  <ImageIcon className="w-5 h-5 text-sky-700 mb-1" />
                  <span className="text-xs font-bold text-sky-900">
                    從相簿選照片
                  </span>
                  <span className="text-[10px] text-sky-600">
                    選取手機現有照片
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

              </div>
            )}

            {isCompressing && (
              <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>正在快速優化照片中...</span>
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
              onClick={onClose}
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

      </div>
    </div>
  );
}
