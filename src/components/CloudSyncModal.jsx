import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Download, 
  Upload, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCw,
  Sparkles,
  FileJson,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { exportBackupFile, importBackupFile, loadUserProgress, clearAllUserProgress } from '../services/storage';
import { gdriveService } from '../services/gdrive';

export default function CloudSyncModal({
  userProfile,
  isOpen,
  onClose,
  onProgressRestored,
  onProgressReset,
  onUpdateProfile
}) {
  if (!isOpen) return null;

  const [clientId, setClientId] = useState(
    localStorage.getItem('taiwan368_google_client_id') || ''
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [googleUserEmail, setGoogleUserEmail] = useState(userProfile?.googleEmail || '');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleExportJson = async () => {
    try {
      await exportBackupFile();
      setSyncStatus({ type: 'success', message: '已成功匯出完整足跡備份檔（.json）！' });
    } catch (e) {
      setSyncStatus({ type: 'error', message: `匯出失敗: ${e.message}` });
    }
  };

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const data = await importBackupFile(file);
      if (onProgressRestored) {
        onProgressRestored(data.progress, data.profile);
      }
      setSyncStatus({ type: 'success', message: '備份檔還原成功！已更新您的全台足跡紀錄。' });
    } catch (err) {
      setSyncStatus({ type: 'error', message: `還原失敗: ${err.message}` });
    } finally {
      setIsSyncing(false);
      e.target.value = '';
    }
  };

  const handleSaveClientId = () => {
    localStorage.setItem('taiwan368_google_client_id', clientId);
    setSyncStatus({ type: 'success', message: '已儲存 Google Client ID 設定！' });
  };

  const handleGoogleLoginAndBackup = async () => {
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      // Init GIS client
      const inited = gdriveService.init(clientId, async ({ token, email }) => {
        setGoogleUserEmail(email);
        onUpdateProfile({ ...userProfile, googleEmail: email, lastSyncTime: new Date().toISOString() });
        
        // Export current data and upload
        const progress = await loadUserProgress();
        const profile = userProfile;
        const backupObj = {
          appName: '愛台灣368行腳',
          version: '1.0',
          backupDate: new Date().toISOString(),
          profile,
          progress
        };

        try {
          await gdriveService.uploadBackupToDrive(backupObj);
          setSyncStatus({ type: 'success', message: `已成功將足跡備份至您的 Google 雲端硬碟 (${email})！` });
        } catch (uploadErr) {
          setSyncStatus({ type: 'error', message: `備份上傳失敗: ${uploadErr.message}` });
        } finally {
          setIsSyncing(false);
        }
      });

      if (!inited) {
        throw new Error('Google Identity Services 載入中，請稍候再試');
      }

      gdriveService.requestLogin();
    } catch (e) {
      setIsSyncing(false);
      setSyncStatus({ type: 'error', message: e.message });
    }
  };

  const handleExecuteReset = async () => {
    await clearAllUserProgress();
    if (onProgressReset) {
      onProgressReset();
    }
    setShowConfirmReset(false);
    setSyncStatus({ type: 'success', message: '✨ 已成功歸零！所有測試打卡紀錄、照片與筆記已全部清空。' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-black font-serif-tw tracking-wide">
              資料同步與備份設定
            </h2>
          </div>
          <p className="text-xs text-emerald-200 mt-1">
            管理您的打卡記錄、雲端備份與重置手帳
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          
          {/* Status Message */}
          {syncStatus && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
              syncStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-red-50 text-red-900 border-red-300'
            }`}>
              {syncStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* Section 1: Local Backup (JSON) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <FileJson className="w-4 h-4 text-amber-600" />
              <span>本機檔案備份 (免登入、100% 離線)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              將打卡資料、評分與壓縮照片匯出為單一備份檔案，換手機時可直接匯入還原。
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportJson}
                className="py-2.5 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>匯出足跡備份檔</span>
              </button>

              <label className="py-2.5 px-3 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>匯入備份檔還原</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Google Drive Cloud Sync */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Cloud className="w-4 h-4 text-sky-600" />
                <span>Google Drive 個人雲端硬碟同步</span>
              </div>
              {googleUserEmail && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                  已連結: {googleUserEmail}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              將備份檔案儲存於您個人的 Google 雲端硬碟（愛台灣368專屬資料夾），跨裝置一鍵同步。
            </p>

            {/* Google OAuth Client ID config */}
            <div className="pt-1">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Google OAuth Client ID (選填，若有自建 Client ID 可在此填入)：
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  onClick={handleSaveClientId}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  儲存
                </button>
              </div>
            </div>

            <button
              onClick={handleGoogleLoginAndBackup}
              disabled={isSyncing}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Google 雲端同步中...' : '登入 Google 並立即備份到雲端硬碟'}</span>
            </button>
          </div>

          {/* Section 3: Reset / Clear All (Danger Zone) */}
          <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>重置手帳 (清空所有測試資料)</span>
              </div>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              當您試用完畢、準備正式出發時，點擊此處可將所有打卡勾選、照片與筆記一鍵歸零，重回 0% 全新狀態。
            </p>

            {showConfirmReset ? (
              <div className="bg-white p-3.5 rounded-xl border border-red-300 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>確定要清空所有紀錄嗎？此動作將無法復原！</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecuteReset}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    確定清空歸零
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full py-2 px-3 bg-white hover:bg-red-100/60 text-red-700 border border-red-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>一鍵清空所有打卡進度 (歸零重置)</span>
              </button>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            完成並關閉
          </button>
        </div>

      </div>
    </div>
  );
}
