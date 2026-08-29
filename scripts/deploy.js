import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');
const repoUrl = 'https://github.com/Famidoc/love-taiwan-368.git';

console.log('🚀 開始執行【愛台灣368行腳】GitHub Pages 部署流程...');

// 1. 確保 dist 資料夾存在
if (!fs.existsSync(distPath)) {
  console.error('❌ 找不到 dist 資料夾，請先確認已編譯成功！');
  process.exit(1);
}

// 2. 在 dist 資料夾內執行 git 指令
try {
  const options = { cwd: distPath, stdio: 'inherit' };
  
  console.log('📦 初始化或讀取暫時的 Git 倉庫...');
  execSync('git init', options);
  
  // 嘗試切換到 gh-pages 分支，若不存在則建立它
  try {
    execSync('git checkout gh-pages', options);
  } catch (e) {
    execSync('git checkout -b gh-pages', options);
  }
  
  // 自動配置暫時倉庫的 Git 身分
  execSync('git config user.email "famidoc@gmail.com"', options);
  execSync('git config user.name "Famidoc Chang"', options);
  
  console.log('📝 比對並新增檔案中...');
  execSync('git add .', options);
  
  try {
    execSync('git commit -m "deploy: update love-taiwan-368 website"', options);
  } catch (e) {
    console.log('ℹ️ 沒有檢測到任何檔案變更，將直接進行推送。');
  }
  
  console.log(`🔗 連結遠端 GitHub 倉庫 (${repoUrl})...`);
  try {
    execSync(`git remote add origin ${repoUrl}`, options);
  } catch (e) {
    execSync(`git remote set-url origin ${repoUrl}`, options);
  }
  
  console.log('📤 增量推送至 GitHub gh-pages 分支...');
  execSync('git push origin gh-pages --force', options);
  
  console.log('🎉 【愛台灣368行腳】網頁發布成功！');
  console.log('🌐 您的正式網址為：https://famidoc.github.io/love-taiwan-368/');
} catch (err) {
  console.error('❌ 部署過程中發生錯誤：', err.message);
}
