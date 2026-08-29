/**
 * Google Drive Sync Service
 * Allows users to backup and restore their 368 footprint to their personal Google Drive folder
 */

const FOLDER_NAME = '愛台灣368行腳';
const BACKUP_FILE_NAME = 'taiwan368_backup.json';
export const DEFAULT_GOOGLE_CLIENT_ID = '948492589681-blall4lcdb0485ckr488274935ji7joa.apps.googleusercontent.com';

class GDriveSyncService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.userEmail = null;
  }

  init(clientId, onTokenReceived) {
    if (typeof window.google === 'undefined' || !window.google.accounts) {
      console.warn('Google Identity Services script not loaded yet.');
      return false;
    }

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId || DEFAULT_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('OAuth error:', tokenResponse.error);
            return;
          }
          this.accessToken = tokenResponse.access_token;
          
          // Fetch user info
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${this.accessToken}` }
            });
            const userInfo = await userInfoRes.json();
            this.userEmail = userInfo.email;
          } catch (e) {
            console.error('Failed to get user info:', e);
          }

          if (onTokenReceived) {
            onTokenReceived({ token: this.accessToken, email: this.userEmail });
          }
        },
      });
      return true;
    } catch (e) {
      console.error('Init token client failed:', e);
      return false;
    }
  }

  requestLogin() {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      throw new Error('Google 登入服務尚未初始化');
    }
  }

  /**
   * Find or create the dedicated '愛台灣368行腳' folder in user's Drive
   */
  async getOrCreateAppFolder() {
    try {
      const q = `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`;
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const data = await searchRes.json();

      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }

      // Create folder if not found
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
          description: '【愛台灣368行腳】專屬資料夾'
        })
      });

      const newFolder = await createRes.json();
      return newFolder.id;
    } catch (e) {
      console.warn('Could not create/find specific folder:', e);
      return null;
    }
  }

  /**
   * Upload, overwrite and move backup file directly into '愛台灣368行腳' folder
   */
  async uploadBackupToDrive(backupData) {
    if (!this.accessToken) {
      throw new Error('尚未取得 Google 授權，請先登入 Google 帳號');
    }

    const folderId = await this.getOrCreateAppFolder();
    const fileContent = JSON.stringify(backupData, null, 2);

    // Check if backup file already exists anywhere in user's Drive
    let existingFileId = null;
    let existingParents = [];
    try {
      const q = `name='${BACKUP_FILE_NAME}' and trashed=false`;
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&orderBy=modifiedTime desc`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        existingFileId = searchData.files[0].id;
        existingParents = searchData.files[0].parents || [];
      }
    } catch (e) {
      console.warn('Search existing file warning:', e);
    }

    if (existingFileId) {
      // Overwrite existing backup file AND move into target folder if not already inside
      const form = new FormData();
      const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json'
      };
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      let patchUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
      if (folderId && !existingParents.includes(folderId)) {
        patchUrl += `&addParents=${encodeURIComponent(folderId)}`;
        if (existingParents.length > 0) {
          patchUrl += `&removeParents=${encodeURIComponent(existingParents.join(','))}`;
        }
      }

      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        throw new Error(`更新雲端備份失敗: ${errText}`);
      }
      return await patchRes.json();
    } else {
      // Create new file directly inside folder
      const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json',
        description: '【愛台灣368行腳】個人足跡與相片備份檔案',
        ...(folderId ? { parents: [folderId] } : {})
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`上傳 Google Drive 失敗: ${errText}`);
      }
      return await res.json();
    }
  }

  async fetchBackupFromDrive() {
    if (!this.accessToken) {
      throw new Error('尚未取得 Google 授權，請先登入 Google 帳號');
    }

    // Search for backup file anywhere in user's Drive
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and trashed=false&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }
    );

    const data = await searchRes.json();
    if (!data.files || data.files.length === 0) {
      throw new Error('在您的 Google 雲端硬碟中找不到過去的備份檔 (taiwan368_backup.json)');
    }

    const fileId = data.files[0].id;
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }
    );

    if (!downloadRes.ok) {
      throw new Error('從 Google 雲端下載備份失敗');
    }

    return await downloadRes.json();
  }
}

export const gdriveService = new GDriveSyncService();
