import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  Smartphone, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function QrCodeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const appUrl = 'https://famidoc.github.io/love-taiwan-368/';
  
  // High-resolution standard QR code generator via Google Chart / QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}&margin=10&color=064e3b`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '【愛台灣 368 行腳】踏破全台鄉鎮市區手帳',
          text: '跟我一起踏遍台灣 368 個鄉鎮市區，點亮每一寸土地的美景與美食！',
          url: appUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center mx-auto mb-2 text-amber-300">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-black font-serif-tw tracking-wide">
            【愛台灣 368 行腳】
          </h3>
          <p className="text-xs text-emerald-200 mt-0.5">
            掃碼立即開啟或安裝到手機桌面
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-5 flex flex-col items-center space-y-4">
          
          <div className="p-3 bg-white border-2 border-emerald-500/30 rounded-3xl shadow-lg relative group">
            <img
              src={qrCodeUrl}
              alt="愛台灣 368 行腳 QR Code"
              className="w-52 h-52 object-contain rounded-xl"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-emerald-200">
                <img src="./logo.png" alt="logo" className="w-full h-full object-cover rounded-lg" />
              </div>
            </div>
          </div>

          {/* URL Box */}
          <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-600 font-mono select-all">
              {appUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-1 shrink-0 transition-colors"
              title="複製網址"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製' : '複製'}</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="w-full p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-950 space-y-1">
            <p className="font-bold flex items-center gap-1 text-emerald-900">
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>手機相機掃描即可使用：</span>
            </p>
            <p className="text-slate-600">
              • <b>iPhone</b>：Safari 開啟後點「分享」$\to$「加入主畫面」
            </p>
            <p className="text-slate-600">
              • <b>Android</b>：Chrome 開啟後點「加到主畫面 / 安裝」
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-2 pt-1">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>分享給同好好友</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
