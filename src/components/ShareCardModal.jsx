import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Share2, Copy, Check, Sparkles, Camera, AlertCircle, LayoutGrid, Image as ImageIcon } from 'lucide-react';

/**
 * Universal compatible rounded rectangle drawer for HTML5 Canvas
 */
function drawRoundRectPath(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Helper to draw image with aspect ratio fit/cover
 */
function drawImageCover(ctx, img, dx, dy, dw, dh, radius = 0) {
  ctx.save();
  if (radius > 0) {
    drawRoundRectPath(ctx, dx, dy, dw, dh, radius);
    ctx.clip();
  }

  const imgRatio = img.width / img.height;
  const targetRatio = dw / dh;
  let sx, sy, sWidth, sHeight;

  if (imgRatio > targetRatio) {
    sHeight = img.height;
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = img.width;
    sHeight = img.width / targetRatio;
    sx = 0;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
  ctx.restore();
}

export default function ShareCardModal({
  district,
  progress,
  stats,
  userProfile,
  isOpen,
  onClose
}) {
  if (!isOpen || !district) return null;

  const canvasRef = useRef(null);
  const [cardImgUrl, setCardImgUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Photo mode: 0..5 (index of single photo) or 'collage' (all photos stitched)
  const photos = progress?.photos || [];
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const attractionsChecked = progress?.attractionsChecked || [];
  const foodsChecked = progress?.foodsChecked || [];
  const totalChecked = attractionsChecked.length + foodsChecked.length;
  const visitDate = progress?.completedDate || new Date().toISOString().split('T')[0];
  const rating = progress?.rating || 5;
  const notes = progress?.notes || '';

  useEffect(() => {
    setIsGenerating(true);
    setHasError(false);
    const timer = setTimeout(() => {
      generateCard();
    }, 50);
    return () => clearTimeout(timer);
  }, [district, progress, stats, userProfile, selectedPhotoIndex]);

  const loadAllImages = async (urls) => {
    const promises = urls.map(url => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    });
    return Promise.all(promises);
  };

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      // Resolution: 1080 x 1440 (Aspect 3:4 High-Res Story/Post card)
      const W = 1080;
      const H = 1440;
      canvas.width = W;
      canvas.height = H;

      // Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, W, H);
      bgGradient.addColorStop(0, '#fafaf9');
      bgGradient.addColorStop(0.5, '#f5f5f4');
      bgGradient.addColorStop(1, '#e7e5e4');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

      // Decorative Borders
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 12;
      ctx.strokeRect(30, 30, W - 60, H - 60);

      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 4;
      ctx.strokeRect(46, 46, W - 92, H - 92);

      // Header Stamp & Logo
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 36px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🇹🇼【 愛台灣 368 行腳 】足跡認證卡', W / 2, 110);

      ctx.fillStyle = '#78716c';
      ctx.font = '22px "Noto Sans TC", sans-serif';
      ctx.fillText(`368 鄉鎮市區踏破計劃 • 第 ${district.id.toString().padStart(3, '0')} 站`, W / 2, 150);

      // Polaroid Photo Frame
      const photoFrameX = 80;
      const photoFrameY = 180;
      const photoFrameW = W - 160;
      const photoFrameH = 680;

      // White photo card frame
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(photoFrameX, photoFrameY, photoFrameW, photoFrameH);

      // Inner photo area
      const photoInnerX = photoFrameX + 24;
      const photoInnerY = photoFrameY + 24;
      const photoInnerW = photoFrameW - 48;
      const photoInnerH = photoFrameH - 120;

      // Render Photo(s)
      if (photos.length > 0) {
        if (selectedPhotoIndex === 'collage' && photos.length > 1) {
          // COLLAGE MODE (Supports 2 to 6 photos!)
          const loadedImages = await loadAllImages(photos.map(p => p.dataUrl));
          const validImgs = loadedImages.filter(Boolean);
          const count = validImgs.length;
          const gap = 10;

          if (count === 2) {
            // 2 Photos: Side-by-side Split
            const singleW = (photoInnerW - gap) / 2;
            drawImageCover(ctx, validImgs[0], photoInnerX, photoInnerY, singleW, photoInnerH, 8);
            drawImageCover(ctx, validImgs[1], photoInnerX + singleW + gap, photoInnerY, singleW, photoInnerH, 8);
          } else if (count === 3) {
            // 3 Photos: 1 Main Left + 2 Stacked Right
            const leftW = (photoInnerW - gap) * 0.58;
            const rightW = photoInnerW - gap - leftW;
            const rightH = (photoInnerH - gap) / 2;

            drawImageCover(ctx, validImgs[0], photoInnerX, photoInnerY, leftW, photoInnerH, 8);
            drawImageCover(ctx, validImgs[1], photoInnerX + leftW + gap, photoInnerY, rightW, rightH, 8);
            drawImageCover(ctx, validImgs[2], photoInnerX + leftW + gap, photoInnerY + rightH + gap, rightW, rightH, 8);
          } else if (count === 4) {
            // 4 Photos: 2x2 Grid
            const itemW = (photoInnerW - gap) / 2;
            const itemH = (photoInnerH - gap) / 2;
            drawImageCover(ctx, validImgs[0], photoInnerX, photoInnerY, itemW, itemH, 8);
            drawImageCover(ctx, validImgs[1], photoInnerX + itemW + gap, photoInnerY, itemW, itemH, 8);
            drawImageCover(ctx, validImgs[2], photoInnerX, photoInnerY + itemH + gap, itemW, itemH, 8);
            drawImageCover(ctx, validImgs[3], photoInnerX + itemW + gap, photoInnerY + itemH + gap, itemW, itemH, 8);
          } else if (count === 5) {
            // 5 Photos: 2 Top + 3 Bottom
            const topW = (photoInnerW - gap) / 2;
            const topH = (photoInnerH - gap) * 0.52;
            const btmW = (photoInnerW - gap * 2) / 3;
            const btmH = photoInnerH - gap - topH;

            drawImageCover(ctx, validImgs[0], photoInnerX, photoInnerY, topW, topH, 8);
            drawImageCover(ctx, validImgs[1], photoInnerX + topW + gap, photoInnerY, topW, topH, 8);
            drawImageCover(ctx, validImgs[2], photoInnerX, photoInnerY + topH + gap, btmW, btmH, 8);
            drawImageCover(ctx, validImgs[3], photoInnerX + btmW + gap, photoInnerY + topH + gap, btmW, btmH, 8);
            drawImageCover(ctx, validImgs[4], photoInnerX + (btmW + gap) * 2, photoInnerY + topH + gap, btmW, btmH, 8);
          } else if (count >= 6) {
            // 6 Photos: 2 Rows x 3 Columns (3 Attractions + 3 Foods!)
            const colW = (photoInnerW - gap * 2) / 3;
            const rowH = (photoInnerH - gap) / 2;

            for (let r = 0; r < 2; r++) {
              for (let c = 0; c < 3; c++) {
                const idx = r * 3 + c;
                if (validImgs[idx]) {
                  const ix = photoInnerX + c * (colW + gap);
                  const iy = photoInnerY + r * (rowH + gap);
                  drawImageCover(ctx, validImgs[idx], ix, iy, colW, rowH, 8);
                }
              }
            }
          } else {
            drawImageCover(ctx, validImgs[0], photoInnerX, photoInnerY, photoInnerW, photoInnerH, 12);
          }
        } else {
          // SINGLE PHOTO MODE
          const photoIdx = typeof selectedPhotoIndex === 'number' ? selectedPhotoIndex : 0;
          const targetPhotoUrl = photos[photoIdx]?.dataUrl || photos[0]?.dataUrl;
          if (targetPhotoUrl) {
            const loadedImages = await loadAllImages([targetPhotoUrl]);
            if (loadedImages[0]) {
              drawImageCover(ctx, loadedImages[0], photoInnerX, photoInnerY, photoInnerW, photoInnerH, 12);
            } else {
              drawFallbackPhoto(ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, W);
            }
          } else {
            drawFallbackPhoto(ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, W);
          }
        }
      } else {
        drawFallbackPhoto(ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, W);
      }

      // Finish rest of card elements
      finishCard(ctx, canvas, W, H, photoFrameX, photoFrameY, photoFrameW, photoFrameH);

    } catch (err) {
      console.error('Card generation failed:', err);
      setIsGenerating(false);
      setHasError(true);
    }
  };

  const drawFallbackPhoto = (ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, W) => {
    const grad = ctx.createLinearGradient(photoInnerX, photoInnerY, photoInnerX + photoInnerW, photoInnerY + photoInnerH);
    grad.addColorStop(0, '#065f46');
    grad.addColorStop(0.5, '#0d9488');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    drawRoundRectPath(ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Noto Serif TC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${district.county} ${district.township}`, W / 2, photoInnerY + photoInnerH / 2 - 20);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
    ctx.fillText('踏破台灣 • 探索鄉鎮之美', W / 2, photoInnerY + photoInnerH / 2 + 40);
  };

  const finishCard = (ctx, canvas, W, H, photoFrameX, photoFrameY, photoFrameW, photoFrameH) => {
    try {
      // Polaroid Bottom Caption
      ctx.fillStyle = '#1c1917';
      ctx.font = '900 44px "Noto Serif TC", serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${district.county} ${district.township}`, photoFrameX + 40, photoFrameY + photoFrameH - 45);

      // Postal code tag
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
      ctx.fillText(`郵遞區號 ${district.postalCode}`, photoFrameX + 40 + ctx.measureText(`${district.county} ${district.township}`).width + 20, photoFrameY + photoFrameH - 45);

      // Stars on the right of photo frame
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('★'.repeat(rating) + '☆'.repeat(5 - rating), photoFrameX + photoFrameW - 40, photoFrameY + photoFrameH - 45);

      // Circular Stamp (Vintage Red Stamp)
      drawRedStamp(ctx, W - 180, photoFrameY + photoFrameH - 30, '踏破認證', visitDate);

      // Footprint stats card at bottom
      const infoY = 900;

      // Spot tags
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 26px "Noto Sans TC", sans-serif';
      ctx.fillText('📍 已解鎖景點與必吃美食：', 80, infoY);

      // Render 3 attractions & 3 foods
      const items = [
        ...district.attractions.map((a) => ({ name: a.name, checked: attractionsChecked.includes(a.id), type: '景點' })),
        ...district.foods.map((f) => ({ name: f.name, checked: foodsChecked.includes(f.id), type: '美食' }))
      ];

      let startX = 80;
      let startY = infoY + 45;
      items.forEach((it, idx) => {
        if (idx === 3) {
          startX = 80;
          startY += 55;
        }
        ctx.fillStyle = it.checked ? (it.type === '景點' ? '#0284c7' : '#ea580c') : '#a8a29e';
        ctx.font = it.checked ? 'bold 22px "Noto Sans TC", sans-serif' : '22px "Noto Sans TC", sans-serif';
        const symbol = it.checked ? '✔' : '○';
        ctx.fillText(`${symbol} ${it.name}`, startX, startY);
        startX += 310;
      });

      // Notes Quote (if any)
      if (notes) {
        ctx.fillStyle = '#44403c';
        ctx.font = 'italic 24px "Noto Sans TC", sans-serif';
        const displayNotes = notes.length > 38 ? notes.slice(0, 38) + '...' : notes;
        ctx.fillText(`“ ${displayNotes} ”`, 80, 1100);
      }

      // Bottom Summary Banner
      const bannerY = 1200;
      ctx.fillStyle = '#064e3b';
      drawRoundRectPath(ctx, 80, bannerY, W - 160, 130, 20);
      ctx.fill();

      // Inside banner
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
      ctx.fillText(`行腳者：${userProfile?.nickname || '台灣行腳勇者'}`, 120, bannerY + 55);

      ctx.fillStyle = '#ffffff';
      ctx.font = '22px "Noto Sans TC", sans-serif';
      ctx.fillText(`全台已踏破 ${stats.unlockedTownships}/368 鄉鎮 (${stats.percent}%)`, 120, bannerY + 95);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
      ctx.fillText(visitDate, W - 120, bannerY + 55);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px "Noto Sans TC", sans-serif';
      ctx.fillText('愛台灣368行腳社群', W - 120, bannerY + 95);

      // Footer copyright
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a8a29e';
      ctx.font = '18px "Noto Sans TC", sans-serif';
      ctx.fillText('愛台灣368行腳 • 走遍台灣每一寸土地', W / 2, 1390);

      const dataUrl = canvas.toDataURL('image/png');
      setCardImgUrl(dataUrl);
      setIsGenerating(false);
    } catch (err) {
      console.error('Error finalizing card:', err);
      setIsGenerating(false);
      setHasError(true);
    }
  };

  const drawRedStamp = (ctx, cx, cy, text, date) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.15); // slightly tilted stamp

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.font = '900 22px "Noto Serif TC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, -8);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(date, 0, 16);

    ctx.font = '10px sans-serif';
    ctx.fillText('★ 368 PASSPORT ★', 0, 34);

    ctx.restore();
  };

  const handleDownload = () => {
    if (!cardImgUrl) return;
    const a = document.createElement('a');
    a.href = cardImgUrl;
    a.download = `368行腳認證_${district.county}_${district.township}_${visitDate}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleWebShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (navigator.share) {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `368_${district.township}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `【愛台灣368行腳】我在 ${district.county}${district.township} 打卡！`,
              text: `我在【愛台灣368行腳】踏破了第 ${district.id} 站：${district.county}${district.township}！目前全台解鎖進度 ${stats.percent}%！`,
              files: [file]
            });
          } else {
            await navigator.share({
              title: `【愛台灣368行腳】我在 ${district.county}${district.township} 打卡！`,
              text: `我在【愛台灣368行腳】踏破了第 ${district.id} 站：${district.county}${district.township}！目前全台解鎖進度 ${stats.percent}%！`
            });
          }
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      console.log('Share dismissed or failed:', e);
    }
  };

  const handleCopyText = () => {
    const shareText = `🇹🇼【愛台灣368行腳】足跡打卡紀錄\n📍 踏破第 ${district.id} 站：${district.county} ${district.township}\n📸 必訪景點：${district.attractions.map(a => a.name).join('、')}\n🍜 必吃美食：${district.foods.map(f => f.name).join('、')}\n⭐ 踏破評分：${'★'.repeat(rating)}\n📊 目前全台累積進度：${stats.unlockedTownships}/368 鄉鎮 (${stats.percent}%)\n\n#愛台灣368行腳 #台灣旅遊 #鄉鎮踏破`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 border border-slate-200">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">成就拍立得卡片</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Photo Selector Toolbar (when user has multiple photos) */}
        {photos.length > 1 && (
          <div className="px-3 py-2 bg-slate-200/90 border-b border-slate-300 flex items-center justify-between gap-1.5 text-xs overflow-x-auto">
            <span className="font-bold text-slate-700 shrink-0">
              版型：
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                    selectedPhotoIndex === idx
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>圖 {idx + 1}</span>
                </button>
              ))}

              {/* Collage Button */}
              <button
                onClick={() => setSelectedPhotoIndex('collage')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 ${
                  selectedPhotoIndex === 'collage'
                    ? 'bg-amber-500 text-emerald-950 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{photos.length}圖拼貼</span>
              </button>
            </div>
          </div>
        )}

        {/* Card Preview */}
        <div className="p-3 sm:p-4 bg-slate-100 flex flex-col items-center justify-center min-h-[300px]">
          <canvas ref={canvasRef} className="hidden" />
          
          {isGenerating ? (
            <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>正在為您合成高畫質拍立得卡片...</span>
            </div>
          ) : hasError ? (
            <div className="py-16 text-center text-red-500 text-sm flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span>卡片合成出現問題，請嘗試重新開啟</span>
            </div>
          ) : cardImgUrl ? (
            <img
              src={cardImgUrl}
              alt="拍立得足跡卡"
              className="max-h-[50vh] sm:max-h-[55vh] rounded-xl shadow-xl border border-slate-300 object-contain animate-in fade-in zoom-in-95 duration-200"
            />
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="p-3.5 sm:p-4 bg-white space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating || !cardImgUrl}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>下載卡片圖檔</span>
            </button>

            <button
              onClick={handleWebShare}
              disabled={isGenerating || !cardImgUrl}
              className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-emerald-950 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>一鍵發到 LINE / FB</span>
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">已複製社群打卡貼文！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>複製社群貼文範本 (FB / LINE 群組)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
