import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Smartphone, 
  Camera, 
  Cloud, 
  Trophy, 
  HelpCircle, 
  Sparkles, 
  ExternalLink,
  Download,
  Share2,
  FileText
} from 'lucide-react';

export default function UserGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('install'); // 'install' | 'checkin' | 'cloud' | 'leaderboard' | 'faq'

  const handleDownloadTxt = () => {
    // Direct link to download the txt guide in docs
    const link = document.createElement('a');
    link.href = './docs/愛台灣368行腳_完整使用說明手冊.txt';
    link.download = '愛台灣368行腳_完整使用說明手冊.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-300" />
            <h2 className="text-lg sm:text-xl font-black font-serif-tw tracking-wide">
              【愛台灣 368 行腳】使用說明手冊
            </h2>
          </div>
          <p className="text-xs text-emerald-200 mt-1">
            踏破全台 368 鄉鎮市區 • 1,104 必訪景點 • 1,104 必吃美食 操作全攻略
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'install', label: '📱 快速安裝 PWA', icon: Smartphone },
              { id: 'checkin', label: '📸 打卡與拍照', icon: Camera },
              { id: 'cloud', label: '☁️ 雲端無感備份', icon: Cloud },
              { id: 'leaderboard', label: '🏆 排行榜與先行者', icon: Trophy },
              { id: 'faq', label: '❓ 常見問題 FAQ', icon: HelpCircle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-black/20 text-emerald-100 hover:bg-black/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
          
          {/* TAB 1: INSTALL */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <h4 className="font-bold text-emerald-950 text-sm mb-1">
                  🌟 免下載商店！直接安裝至手機與電腦桌面
                </h4>
                <p className="text-xs text-emerald-800">
                  本 App 採用漸進式 Web App (PWA) 技術，安裝後享有全螢幕、離線使用與極速啟動體驗。
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>🍎 iPhone / iPad (Safari)</span>
                  </h5>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                    <li>使用 <b>Safari</b> 開啟 App 網址。</li>
                    <li>點擊下方工具列的 <b>「分享按鈕」</b>（向上箭頭）。</li>
                    <li>向下滑動，選擇 <b>「加入主畫面」</b> (Add to Home Screen)。</li>
                    <li>點擊右上角「新增」，桌面即出現 368 綠金專屬圖示！</li>
                  </ol>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>🤖 Android 手機 (Chrome)</span>
                  </h5>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                    <li>使用 <b>Chrome</b> 開啟 App 網址。</li>
                    <li>點擊右上角「⋮」選單，或點擊瀏覽器底部的 <b>「加到主畫面 / 安裝應用程式」</b> 提示。</li>
                    <li>確認安裝，即可在桌面以獨立 App 開啟。</li>
                  </ol>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>💻 Windows / Mac 電腦 (Edge / Chrome)</span>
                  </h5>
                  <p className="text-xs text-slate-600">
                    點擊網址列右側的 <b>「安裝圖示」</b>（或在右上角選單選擇「應用程式」$\to$「安裝此網站為應用程式」），即可建立桌面捷徑！
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHECKIN */}
          {activeTab === 'checkin' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  1. 景點與美食打卡 & 一鍵導航
                </h5>
                <p className="text-xs text-slate-600">
                  每個鄉鎮精選「3 大必訪景點」與「3 大必吃美食」，點擊即可勾選完成。各項目旁附有 <b>Google Maps 圖標</b>，點擊會直接開啟地圖為您導航定位！
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  2. 拍攝佐證照片（極速高畫質壓縮）
                </h5>
                <p className="text-xs text-slate-600">
                  點擊卡片底部【記錄 / 拍照】可開啟相機拍照或自相簿選取（每個鄉鎮上限 6 張）。系統會在 0.1 秒內自動完成畫質保真壓縮，避免佔用手機記憶體與空間。
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>🛡️ 未儲存智慧防呆保護</span>
                </h5>
                <p className="text-xs text-amber-900 leading-relaxed">
                  若您在拍照、撰寫心得或勾選後，不小心誤觸右上角 [X] 或取消，系統會自動攔截並彈出提醒視窗，提供【儲存紀錄並關閉】選項，確保您的照片與心得絕不遺失！
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  3. 📸 拍立得足跡卡生成
                </h5>
                <p className="text-xs text-slate-600">
                  點擊卡片底部的【📸 拍立得】按鈕，可一鍵生成帶有照片、星級評分、徽章與打卡日期的復古拍立得卡片，直接下載或分享至 LINE、FB 社群！
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl">
                <h4 className="font-bold text-sky-950 text-sm mb-1">
                  ☁️ 個人 Google Drive 無感背景同步
                </h4>
                <p className="text-xs text-sky-800 leading-relaxed">
                  讓您在「電腦」與「手機」之間無縫同步私人日記與照片，不需任何手動繁瑣操作！
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  <b>1. 授權登入：</b> 點擊頂部【☁️ 同步】$\to$ 點擊【登入 Google 帳號授權備份】。
                </p>
                <p>
                  <b>2. 自動背景推播：</b> 只要您在 App 裡打卡、拍照或修改筆記，系統會在 2 秒後於背景自動上傳備份至您個人的 Google Drive（右上角顯示「同步中」$\to$「已同步」）。
                </p>
                <p>
                  <b>3. 跨裝置無縫復原：</b> 在另一台手機或電腦打開 App 登入同一個 Google 帳號，系統會自動比對時間戳記，智慧載入最新進度！
                </p>
                <p>
                  <b>4. 本地手動備份：</b> 亦可點擊【匯出本地 JSON 備份檔】將備份檔儲存在電腦硬碟中。
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  1. 🏆 全台同好排行榜（免登入、零門檻）
                </h5>
                <p className="text-xs text-slate-600">
                  全台旅人共同切磋踏破進度！完全不用綁定帳號，系統會自動配發匿名 ID，在名片設定中儲存暱稱後即可直接入榜。
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  2. 👥 各鄉鎮「先行者」名冊
                </h5>
                <p className="text-xs text-slate-600">
                  每張鄉鎮卡片右上角設有【先行者】按鈕，可即時查看有哪些同好曾在此鄉鎮打卡插旗與完成狀況！
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  3. 🗺️ 我的踏破清單
                </h5>
                <p className="text-xs text-slate-600">
                  在排行榜切換至「我的踏破清單」分頁，可完整查看您個人所有已踩點的鄉鎮明細與照片縮圖，點擊任一鄉鎮可一鍵跳轉定位！
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {[
                {
                  q: '在沒有網路的地方（深山、離島）可以使用嗎？',
                  a: '完全可以！本 App 為離線優先架構，打卡與照片會先保存在手機內部，等回到有網路環境時會自動補行同步。'
                },
                {
                  q: '換新手機時，打卡紀錄要怎麼轉移？',
                  a: '只要在舊手機點擊【☁️ 同步】綁定 Google 帳號備份；在新手機登入同一 Google 帳號，所有進度與照片就會自動秒還原！'
                },
                {
                  q: '個人隱私照片會被公開嗎？',
                  a: '不會！您的打卡照片與隨手筆記只會保存在您的設備與您個人的 Google Drive 中，排行榜僅會公開您的暱稱、頭像與踏破數字。'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm text-emerald-800">
                    Q: {item.q}
                  </h5>
                  <p className="text-xs text-slate-600">
                    A: {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handleDownloadTxt}
            className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="下載純文字說明書"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>下載說明書 (.txt)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
          >
            關閉說明
          </button>
        </div>

      </div>
    </div>
  );
}
