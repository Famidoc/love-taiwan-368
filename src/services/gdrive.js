/**
 * Google Drive Sync Service
 * Allows users to backup and restore their 368 footprint to their personal Google Drive folder
 */

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

  async uploadBackupToDrive(backupData) {
    if (!this.accessToken) {
      throw new Error('尚未取得 Google 授權，請先登入 Google 帳號');
    }

    const fileContent = JSON.stringify(backupData, null, 2);
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: '【愛台灣368行腳】個人足跡與相片備份檔案'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      },
      body: form
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`上傳 Google Drive 失敗: ${errText}`);
    }

    return await res.json();
  }

  async fetchBackupFromDrive() {
    if (!this.accessToken) {
      throw new Error('尚未取得 Google 授權，請先登入 Google 帳號');
    }

    // Search for backup file in user's Drive
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
