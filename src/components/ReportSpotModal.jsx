import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  SearchX, 
  Store, 
  Send, 
  MapPin, 
  Info,
  ShieldCheck
} from 'lucide-react';

export default function ReportSpotModal({
  target,
  isOpen,
  onClose,
  onSubmitReport,
  existingReport
}) {
  if (!isOpen || !target) return null;

  const { district, spot, spotType } = target;
  const isAttraction = spotType === 'attraction';

  const [selectedReason, setSelectedReason] = useState(
    existingReport?.reason || 'closed'
  );
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmitReport({
        districtId: district.id,
        spotId: spot.id,
        spotName: spot.name,
        spotType,
        reason: selectedReason,
        note: note.trim()
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Report submission failed:', err);
      alert('回報送出時發生問題，請稍後再試！');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white p-4 sm:p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-amber-100 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-200" />
            <span>社群協同維護 • 店家狀態回報</span>
          </div>

          <div className="mt-2">
            <h3 className="text-lg sm:text-xl font-black font-serif-tw tracking-wide text-white">
              {spot.name}
            </h3>
            <p className="text-xs text-amber-100 flex items-center gap-1 mt-0.5">
              <span>{district.county} {district.township}</span>
              <span>•</span>
              <span>{isAttraction ? '必訪景點' : '在地美食'}</span>
            </p>
          </div>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">感謝您的熱心回報！</h4>
            <p className="text-xs text-slate-500">
              已為所有同好標註狀態，避免其他人撲空！
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            
            {/* Existing Notice if already reported */}
            {existingReport && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">目前此點已被標註：</span>
                  <span>
                    已有 {existingReport.count || 1} 位同好回報為「{existingReport.label}」。
                  </span>
                </div>
              </div>
            )}

            {/* Select Reason */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                請選擇目前實際狀況：
              </label>

              <div className="space-y-2">
                {/* 1. Closed */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedReason === 'closed'
                    ? 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Store className={`w-4 h-4 ${selectedReason === 'closed' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs sm:text-sm font-bold block">暫時或永久歇業</span>
                      <span className="text-[11px] text-slate-500">店家已結束營業、搬遷歇業或長期暫停營業</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="reason"
                    value="closed"
                    checked={selectedReason === 'closed'}
                    onChange={() => setSelectedReason('closed')}
                    className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                  />
                </label>

                {/* 2. Not Found */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedReason === 'not_found'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <SearchX className={`w-4 h-4 ${selectedReason === 'not_found' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs sm:text-sm font-bold block">Google 地圖找不到 / 查無此處</span>
                      <span className="text-[11px] text-slate-500">地圖搜尋無此店家、地標錯誤或現場查無此地點</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="reason"
                    value="not_found"
                    checked={selectedReason === 'not_found'}
                    onChange={() => setSelectedReason('not_found')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                </label>

                {/* 3. Normal / Active (Revoke Warning) */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedReason === 'normal'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-4 h-4 ${selectedReason === 'normal' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs sm:text-sm font-bold block">我確認現場「正常營業中」</span>
                      <span className="text-[11px] text-slate-500">協助平反與撤銷錯誤的歇業警示標籤</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="reason"
                    value="normal"
                    checked={selectedReason === 'normal'}
                    onChange={() => setSelectedReason('normal')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                補充說明（選填）：
              </label>
              <input
                type="text"
                placeholder="例如：現場看到已頂讓、或已搬遷至新址..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '送出中...' : '確認回報'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
