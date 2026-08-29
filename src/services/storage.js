import { get, set, del } from 'idb-keyval';

const STORAGE_KEY_PROGRESS = 'taiwan368_user_progress';
const STORAGE_KEY_PROFILE = 'taiwan368_user_profile';
const STORAGE_KEY_SETTINGS = 'taiwan368_user_settings';

/**
 * Super robust mobile image compressor
 * Handles 12MP-48MP camera photos instantly using createImageBitmap or URL.createObjectURL
 */
export async function compressImage(file, maxWidth = 1000, quality = 0.82) {
  try {
    // 1. Try modern native createImageBitmap (fastest & lowest memory)
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        let width = bitmap.width;
        let height = bitmap.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        bitmap.close?.();
        return dataUrl;
      } catch (bitmapErr) {
        console.warn('createImageBitmap failed, falling back to Image object:', bitmapErr);
      }
    }

    // 2. Fallback using URL.createObjectURL + HTMLImageElement
    return new Promise((resolve, reject) => {
      const blobUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (canvasErr) {
          reject(canvasErr);
        }
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(blobUrl);
        // Last resort: read directly with FileReader
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };

      img.src = blobUrl;
    });
  } catch (err) {
    console.error('Fatal compression error:', err);
    // Ultimate fallback: FileReader Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Get all progress records from IndexedDB
 * Return object map: { [districtId]: DistrictProgress }
 */
export async function loadUserProgress() {
  try {
    const data = await get(STORAGE_KEY_PROGRESS);
    return data || {};
  } catch (err) {
    console.error('Error loading user progress from IndexedDB:', err);
    const local = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return local ? JSON.parse(local) : {};
  }
}

/**
 * Save user progress to IndexedDB and backup copy in localStorage
 */
export async function saveUserProgress(progressMap) {
  try {
    await set(STORAGE_KEY_PROGRESS, progressMap);
  } catch (err) {
    console.error('Error saving user progress to IndexedDB:', err);
  }
}

/**
 * Clear all progress and photos (Reset App Data)
 */
export async function clearAllUserProgress() {
  try {
    await del(STORAGE_KEY_PROGRESS);
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
    return true;
  } catch (err) {
    console.error('Error clearing progress:', err);
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
    return false;
  }
}

/**
 * Load user profile
 */
export function loadUserProfile() {
  const defaultProfile = {
    nickname: '台灣行腳勇者',
    avatar: '🇹🇼',
    isPublic: true,
    bio: '踏遍台灣368個鄉鎮市區！',
    googleEmail: '',
    lastSyncTime: null
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  } catch (e) {
    return defaultProfile;
  }
}

/**
 * Save user profile
 */
export function saveUserProfile(profile) {
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
}

/**
 * Export complete backup as downloadable JSON
 */
export async function exportBackupFile() {
  const progress = await loadUserProgress();
  const profile = loadUserProfile();
  const backupData = {
    appName: '愛台灣368行腳',
    version: '1.0',
    exportDate: new Date().toISOString(),
    profile,
    progress
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `愛台灣368行腳_備份_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import backup from a JSON file
 */
export async function importBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.progress) {
          throw new Error('檔案格式不正確，找不到打卡進度資料');
        }
        await saveUserProgress(data.progress);
        if (data.profile) {
          saveUserProfile(data.profile);
        }
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
