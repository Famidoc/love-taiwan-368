import React from 'react';
import { Users, ExternalLink, MessageCircle, Share2, Sparkles, Heart } from 'lucide-react';

export default function CommunityBanner({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-300" />
            <h2 className="text-xl font-black font-serif-tw tracking-wide">
              愛台灣 368 同好交流社群
            </h2>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            結伴同行、分享在地隱藏版景點美食、發布踏破成就！
          </p>
        </div>

        {/* Community Links */}
        <div className="p-5 space-y-4">
          
          {/* LINE Group */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#06C755] text-white flex items-center justify-center font-black text-xl shadow-sm">
                LINE
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>愛台灣 368 行腳 LINE 官方社群</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.2 rounded-full font-bold">
                    熱烈交流中
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  隨時回報即時路況、詢問在地老饕美食與揪團行腳
                </p>
              </div>
            </div>
            <a
              href="https://line.me"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-[#06C755] hover:bg-[#05a847] text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
            >
              <span>加入</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Facebook Group / Fan Page */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center font-black text-xl shadow-sm">
                FB
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>愛台灣 368 行腳 粉絲團 & 交流社團</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  打卡成果展示、曬拍立得足跡卡、每月精選景點故事
                </p>
              </div>
            </div>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-[#1877F2] hover:bg-[#1565cc] text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
            >
              <span>前往</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Community Tips */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>行腳者社群分享小撇步</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              點擊鄉鎮卡片上的「📸 拍立得」按鈕，可以一鍵生成包含您踏破照片與戳章的專屬美圖，直接貼在 LINE 群組或 FB 粉專上打卡！
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
}
