import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  ImagePlus,
  X,
  Upload,
  Check,
  Maximize2,
  Shuffle,
  Trash2,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { r2StorageService, isR2Configured } from '../services/r2Storage';

const STORAGE_KEY = 'dajid_image_of_day';

// Thời gian đổi ảnh ngẫu nhiên: 30 phút đến 5 tiếng
const MIN_SHUFFLE_MS = 30 * 60 * 1000;
const MAX_SHUFFLE_MS = 5 * 60 * 60 * 1000;

export const EMOTION_PRESETS = [
  { value: 95, label: "Hứng khởi & Sáng tạo", emoji: "⚡", tag: "#Breakthrough" },
  { value: 80, label: "Tập trung cao độ",      emoji: "🎯", tag: "#DeepWork" },
  { value: 55, label: "Điềm tĩnh & Kiên định", emoji: "☕", tag: "#CalmMind" },
  { value: 30, label: "Thư thái & Cân bằng",   emoji: "😌", tag: "#Peaceful" },
];

const EMPTY_EMOTION = { value: 0, label: "Chưa có cảm xúc", emoji: "—", tag: "" };

function getRandomShuffleInterval() {
  return Math.floor(Math.random() * (MAX_SHUFFLE_MS - MIN_SHUFFLE_MS + 1)) + MIN_SHUFFLE_MS;
}

function formatRemainingTime(ms) {
  if (!ms || ms <= 0) return 'ngay bây giờ';
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  if (totalMinutes < 60) return `sau ~${totalMinutes} phút`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `sau ~${hours}h ${mins}p` : `sau ~${hours} giờ`;
}

// Chuyển File ảnh thành Base64 nén nhẹ an toàn, không bao giờ bị mất link khi F5
const fileToCompressedDataUrl = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        if (!result) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1200;
            let w = img.width || 800;
            let h = img.height || 600;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } catch {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
};

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Migration nếu dữ liệu cũ chỉ lưu 1 ảnh { url, caption, emotion }
    if (parsed && !Array.isArray(parsed.photos) && parsed.url) {
      const initialId = 'photo-' + Date.now();
      return {
        currentId: initialId,
        photos: [{
          id: initialId,
          url: parsed.url,
          caption: parsed.caption || '',
          emotion: parsed.emotion || EMOTION_PRESETS[1],
          createdAt: Date.now()
        }],
        nextShuffleTime: Date.now() + getRandomShuffleInterval()
      };
    }

    if (parsed && Array.isArray(parsed.photos)) {
      // Loại bỏ những ảnh có blob URL đã hết hạn (chỉ giữ data: hoặc https://)
      const validPhotos = parsed.photos.filter(p => p.url && !p.url.startsWith('blob:'));
      return {
        ...parsed,
        photos: validPhotos,
        currentId: validPhotos.find(p => p.id === parsed.currentId) ? parsed.currentId : (validPhotos[0]?.id || null)
      };
    }

    return null;
  } catch {
    return null;
  }
}

/* ─── MODAL QUẢN LÝ ẢNH & KHO ẢNH ────────────────────────────────────────── */
const DayImageModal = ({
  currentPhoto,
  photos,
  nextShuffleTime,
  onClose,
  onSaveNewPhoto,
  onSelectPhoto,
  onShuffleNow,
  onDeletePhoto,
  onUpdateCaption,
  onUpdateEmotion,
  isUploading,
  uploadFeedback,
  initialPendingUpload = null
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  // Trạng thái đang thiết lập ảnh mới (khi vừa chọn file từ máy)
  const [pendingUpload, setPendingUpload] = useState(initialPendingUpload);

  useEffect(() => {
    if (initialPendingUpload) {
      setPendingUpload(initialPendingUpload);
    }
  }, [initialPendingUpload]);

  // Phím ESC đóng modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false);
        else if (pendingUpload) setPendingUpload(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, pendingUpload, onClose]);

  // Xử lý khi người dùng chọn file ảnh từ máy
  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64Url = await fileToCompressedDataUrl(file);
    if (base64Url) {
      setPendingUpload({
        file,
        url: base64Url,
        caption: '',
        emotion: EMOTION_PRESETS[1] // Mặc định 80% Tập trung cao độ
      });
    }

    e.target.value = '';
  };

  const remainingMs = Math.max(0, (nextShuffleTime || 0) - Date.now());

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto max-h-[94vh] flex flex-col border border-slate-100 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Image of the Day</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Kho ảnh khoảnh khắc & trạng thái cảm xúc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {/* TRƯỜNG HỢP 1: ĐANG TẢI ẢNH MỚI (FORM THIẾT LẬP CAPTION & EMOTION STATE)   */}
          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {pendingUpload ? (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-800/40 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Thiết lập Caption & Cảm xúc cho ảnh mới
                </span>
                <button
                  type="button"
                  onClick={() => setPendingUpload(null)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preview ảnh vừa chọn */}
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
                <img src={pendingUpload.url} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                  <span>{pendingUpload.emotion?.emoji}</span>
                  <span>{pendingUpload.emotion?.label}</span>
                  <span className="text-sky-300 font-bold">({pendingUpload.emotion?.value}%)</span>
                </div>
              </div>

              {/* Ô nhập Caption cho ảnh */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Caption / Chú thích cho ảnh:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Góc làm việc sáng nay, Đọc sách buổi tối..."
                  value={pendingUpload.caption}
                  onChange={e => setPendingUpload(prev => ({ ...prev, caption: e.target.value }))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-medium"
                  autoFocus
                />
              </div>

              {/* Chọn Emotion State cho ảnh này */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Trạng thái cảm xúc (Emotion State):</label>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{pendingUpload.emotion?.value}%</span>
                </div>

                {/* 4 thẻ cảm xúc preset */}
                <div className="grid grid-cols-4 gap-1.5">
                  {EMOTION_PRESETS.map(p => {
                    const active = Math.abs(pendingUpload.emotion.value - p.value) < 15;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPendingUpload(prev => ({ ...prev, emotion: p }))}
                        className={`py-2 px-1 rounded-xl text-center border transition-all text-xs flex flex-col items-center gap-0.5 cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold scale-[1.02]'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        <span className="text-lg">{p.emoji}</span>
                        <span className="text-[10px] truncate max-w-full font-medium">{p.label.split(' ')[0]}</span>
                        <span className={`text-[9px] ${active ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>{p.value}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nút Hủy & Nút Lưu vào kho */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingUpload(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveNewPhoto(pendingUpload);
                    setPendingUpload(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>✓ Lưu vào kho ảnh</span>
                </button>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════════════ */
            /* TRƯỜNG HỢP 2: XEM ẢNH HIỆN TẠI, CHỈNH SỬA CAPTION & EMOTION, QUẢN LÝ KHO  */
            /* ══════════════════════════════════════════════════════════════════════════ */
            <>
              {/* Khung ảnh chính (Phóng to 4:3) */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner group/preview">
                {currentPhoto?.url ? (
                  <>
                    <img
                      src={currentPhoto.url}
                      alt={currentPhoto.caption || "Image of the day"}
                      className="w-full h-full object-cover"
                    />

                    {/* Top-left: Huy hiệu Emotion State trên ảnh phóng to */}
                    {currentPhoto.emotion && currentPhoto.emotion.value > 0 && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-md pointer-events-none z-10">
                        <span className="text-sm">{currentPhoto.emotion.emoji}</span>
                        <span>{currentPhoto.emotion.label}</span>
                        <span className="text-sky-300 font-bold">({currentPhoto.emotion.value}%)</span>
                        {currentPhoto.emotion.tag && (
                          <span className="text-slate-300 text-[10px] hidden sm:inline">• {currentPhoto.emotion.tag}</span>
                        )}
                      </div>
                    )}

                    {/* Top-right: Các nút thao tác nhanh trên ảnh */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                      <button
                        onClick={() => setFullscreen(true)}
                        className="p-1.5 rounded-xl bg-black/40 hover:bg-black/65 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                        title="Xem toàn màn hình"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      {photos.length > 1 && (
                        <button
                          onClick={onShuffleNow}
                          className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white backdrop-blur-md transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold px-2.5 shadow-sm cursor-pointer"
                          title="Lấy ngẫu nhiên 1 ảnh khác ngay lập tức"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>Đổi ảnh</span>
                        </button>
                      )}
                      <button
                        onClick={() => onDeletePhoto(currentPhoto.id)}
                        className="p-1.5 rounded-xl bg-black/40 hover:bg-rose-600 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                        title="Xóa ảnh này khỏi kho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom: Caption Overlay trên ảnh phóng to */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none">
                      {currentPhoto.caption ? (
                        <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
                          {currentPhoto.caption}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-slate-300 italic">
                          Chưa có caption cho ảnh này (nhập bên dưới)
                        </p>
                      )}
                    </div>

                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                ) : (
                  /* Khi chưa có ảnh nào trong kho: Click vào khung để chọn ảnh */
                  <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group/btn cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFilePicked}
                    />
                    <div className="p-4 rounded-2xl bg-slate-200 dark:bg-slate-700 group-hover/btn:bg-blue-100 dark:group-hover/btn:bg-blue-900/40 transition-colors">
                      <ImagePlus className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tải ảnh đầu tiên của bạn</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Nhấn để chọn ảnh từ máy tính (kèm caption & cảm xúc)</span>
                  </label>
                )}
              </div>

              {/* Nút Tải thêm ảnh bằng Native Label & Nút ngẫu nhiên */}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800/40 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50/40 dark:bg-blue-900/20 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-all text-xs font-bold cursor-pointer shadow-2xs">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilePicked}
                  />
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Tải thêm ảnh vào kho</span>
                </label>

                {photos.length > 1 && (
                  <button
                    type="button"
                    onClick={onShuffleNow}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    title="Lấy ngẫu nhiên 1 ảnh từ kho ảnh của bạn (30p – 5h)"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Ngẫu nhiên (🎲)</span>
                  </button>
                )}
              </div>

              {uploadFeedback && (
                <p className="text-center text-xs text-blue-500 dark:text-blue-400 font-medium -mt-2">{uploadFeedback}</p>
              )}

              {/* Chỉnh sửa Caption trực tiếp cho ảnh hiện tại */}
              {currentPhoto && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Caption / Chú thích cho ảnh này:
                  </label>
                  <input
                    type="text"
                    value={currentPhoto.caption || ''}
                    onChange={e => onUpdateCaption(currentPhoto.id, e.target.value)}
                    placeholder="Nhập caption cho ảnh này (hiện trên widget)..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-medium"
                  />
                </div>
              )}

              {/* Chỉnh sửa Emotion State trực tiếp cho ảnh hiện tại */}
              {currentPhoto && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Emotion State của ảnh này:
                    </label>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{currentPhoto.emotion?.value || 0}%</span>
                  </div>

                  {/* 4 Thẻ cảm xúc preset */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {EMOTION_PRESETS.map(p => {
                      const active = Math.abs((currentPhoto.emotion?.value || 0) - p.value) < 15;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => onUpdateEmotion(currentPhoto.id, p)}
                          className={`py-1.5 px-1 rounded-xl text-center border transition-all text-xs flex flex-col items-center gap-0.5 cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold scale-[1.02]'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                          }`}
                        >
                          <span className="text-base">{p.emoji}</span>
                          <span className="text-[10px] truncate max-w-full font-medium">{p.label.split(' ')[0]}</span>
                          <span className={`text-[9px] ${active ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>{p.value}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dải Thumbnail Kho Ảnh (Gallery Strip) */}
              {photos.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Kho ảnh ({photos.length} ảnh)</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>Đổi ảnh: 30p – 5h ({formatRemainingTime(remainingMs)})</span>
                    </div>
                  </div>

                  {/* Dải thumbnail cuộn ngang có nút [+ Thêm] ở đầu */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                    {/* Nút + Thêm ảnh trực tiếp trong thumbnail strip */}
                    <label
                      className="relative shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700/60 hover:border-blue-500 dark:hover:border-blue-400 bg-blue-50/40 dark:bg-blue-900/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 flex flex-col items-center justify-center gap-0.5 text-blue-600 dark:text-blue-400 cursor-pointer transition-all group/add"
                      title="Tải thêm ảnh mới vào kho"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFilePicked}
                      />
                      <Plus className="w-4 h-4 group-hover/add:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold">Thêm</span>
                    </label>

                    {/* Danh sách các ảnh hiện có */}
                    {photos.map(p => {
                      const isCurrent = p.id === currentPhoto?.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => onSelectPhoto(p.id)}
                          className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 group/thumb ${
                            isCurrent
                              ? 'border-blue-600 ring-2 ring-blue-400/40 scale-105 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 opacity-70 hover:opacity-100'
                          }`}
                          title={p.caption || "Ảnh trong kho"}
                        >
                          <img src={p.url} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0.5 right-0.5 text-[10px] drop-shadow">
                            {p.emotion?.emoji}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Fullscreen Lightbox (Phóng to toàn màn hình khi bấm nút Maximize2) */}
      {fullscreen && currentPhoto?.url && (
        <div
          className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Top Emotion Badge trên ảnh phóng to toàn màn hình */}
          {currentPhoto.emotion && currentPhoto.emotion.value > 0 && (
            <div
              className="absolute top-4 left-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs sm:text-sm font-semibold border border-white/20 shadow-lg pointer-events-none z-10"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-base">{currentPhoto.emotion.emoji}</span>
              <span>{currentPhoto.emotion.label}</span>
              <span className="text-sky-300 font-bold">({currentPhoto.emotion.value}%)</span>
              {currentPhoto.emotion.tag && (
                <span className="text-slate-300 text-xs hidden sm:inline">• {currentPhoto.emotion.tag}</span>
              )}
            </div>
          )}

          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || "Fullscreen"}
            className="max-w-[92vw] max-h-[82vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Bottom Caption trên ảnh phóng to toàn màn hình */}
          {currentPhoto.caption && (
            <div
              className="mt-3 text-white text-xs sm:text-sm font-semibold bg-black/60 px-5 py-2.5 rounded-2xl backdrop-blur-md max-w-[85vw] text-center border border-white/10 shadow-lg"
              onClick={e => e.stopPropagation()}
            >
              <p>{currentPhoto.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
};

/* ─── MAIN WIDGET (ImageOfTheDay - Small Square trên Dashboard) ───────────── */
export const ImageOfTheDay = ({ emotion, onChangeEmotion }) => {
  const [store, setStore] = useState(() => {
    const saved = loadSavedState();
    if (saved && Array.isArray(saved.photos) && saved.photos.length > 0) {
      return {
        photos: saved.photos,
        currentId: saved.currentId || saved.photos[0].id,
        nextShuffleTime: saved.nextShuffleTime || Date.now() + getRandomShuffleInterval()
      };
    }
    return {
      photos: [],
      currentId: null,
      nextShuffleTime: null
    };
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingUploadFromWidget, setPendingUploadFromWidget] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState('');

  // Lưu giá trị emotion gần nhất gửi ra ngoài để chống ghi đè ngược
  const lastSentEmotionVal = useRef(null);

  // Lấy photo hiện tại
  const currentPhoto = store.photos.find(p => p.id === store.currentId) || store.photos[0] || null;

  // Lưu vào localStorage khi store thay đổi
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  // Đồng bộ emotion của ảnh hiện tại ra component cha (EmotionState widget)
  useEffect(() => {
    if (!onChangeEmotion) return;
    if (currentPhoto?.emotion) {
      lastSentEmotionVal.current = currentPhoto.emotion.value;
      onChangeEmotion(currentPhoto.emotion);
    } else {
      lastSentEmotionVal.current = 0;
      onChangeEmotion(EMPTY_EMOTION);
    }
  }, [currentPhoto?.id, currentPhoto?.emotion?.value]);

  // Hàm chọn ngẫu nhiên 1 ảnh từ kho (ưu tiên ảnh khác ảnh hiện tại)
  const shufflePhoto = useCallback(() => {
    setStore(prev => {
      if (!prev.photos || prev.photos.length <= 1) return prev;
      const candidates = prev.photos.filter(p => p.id !== prev.currentId);
      const pool = candidates.length > 0 ? candidates : prev.photos;
      const randomPhoto = pool[Math.floor(Math.random() * pool.length)];
      const nextTime = Date.now() + getRandomShuffleInterval();
      return {
        ...prev,
        currentId: randomPhoto.id,
        nextShuffleTime: nextTime
      };
    });
  }, []);

  // Timer: ngẫu nhiên từ 30 phút đến 5 tiếng tự động chọn 1 ảnh ngẫu nhiên
  useEffect(() => {
    if (!store.photos || store.photos.length <= 1) return;

    const now = Date.now();
    if (!store.nextShuffleTime || now >= store.nextShuffleTime) {
      shufflePhoto();
      return;
    }

    const delay = Math.max(1000, store.nextShuffleTime - now);
    const timer = setTimeout(() => {
      shufflePhoto();
    }, delay);

    return () => clearTimeout(timer);
  }, [store.photos.length, store.nextShuffleTime, shufflePhoto]);

  // Lưu ảnh mới kèm Caption & Emotion State
  const handleSaveNewPhoto = async ({ file, url, caption, emotion }) => {
    const newId = 'photo-' + Date.now();
    const newPhoto = {
      id: newId,
      url, // Lưu Base64 trước để ảnh hiển thị vĩnh viễn không bao giờ chết link
      caption: caption ? caption.trim() : '',
      emotion: emotion || EMOTION_PRESETS[1],
      createdAt: Date.now()
    };

    setStore(prev => ({
      ...prev,
      photos: [newPhoto, ...prev.photos],
      currentId: newId,
      nextShuffleTime: prev.nextShuffleTime || (Date.now() + getRandomShuffleInterval())
    }));

    // Tải lên R2 trong background nếu R2 đã cấu hình
    if (file && isR2Configured) {
      setIsUploading(true);
      setUploadFeedback('Đang tải lên Cloudflare R2...');
      try {
        const res = await r2StorageService.uploadFile(file, 'daily');
        if (res?.url) {
          setStore(prev => ({
            ...prev,
            photos: prev.photos.map(p => p.id === newId ? { ...p, url: res.url } : p)
          }));
          setUploadFeedback('✓ Đã đồng bộ lên Cloud R2');
        }
      } catch (err) {
        console.warn('R2 upload skipped/failed, keeping local Base64:', err);
        setUploadFeedback('Đã lưu vào bộ nhớ thiết bị');
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadFeedback(''), 3000);
      }
    } else {
      setUploadFeedback('Đã lưu vào bộ nhớ thiết bị');
      setTimeout(() => setUploadFeedback(''), 3000);
    }
  };

  // Chọn ảnh cụ thể từ thumbnail
  const handleSelectPhoto = (photoId) => {
    setStore(prev => ({ ...prev, currentId: photoId }));
  };

  // Xóa ảnh khỏi kho
  const handleDeletePhoto = (photoId) => {
    setStore(prev => {
      const remaining = prev.photos.filter(p => p.id !== photoId);
      const nextCurrentId = remaining.length > 0
        ? (prev.currentId === photoId ? remaining[0].id : prev.currentId)
        : null;

      return {
        ...prev,
        photos: remaining,
        currentId: nextCurrentId,
        nextShuffleTime: remaining.length > 1 ? prev.nextShuffleTime : null
      };
    });
  };

  // Cập nhật Caption cho ảnh cụ thể
  const handleUpdateCaption = (photoId, caption) => {
    setStore(prev => ({
      ...prev,
      photos: prev.photos.map(p => p.id === photoId ? { ...p, caption: caption } : p)
    }));
  };

  // Cập nhật Emotion cho ảnh cụ thể
  const handleUpdateEmotion = (photoId, preset) => {
    setStore(prev => ({
      ...prev,
      photos: prev.photos.map(p => p.id === photoId ? { ...p, emotion: preset } : p)
    }));
  };

  // Đồng bộ thay đổi nếu người dùng bấm chỉnh trên EmotionState widget bên cạnh
  useEffect(() => {
    if (!emotion || !currentPhoto) return;
    if (
      emotion.value > 0 &&
      emotion.value !== lastSentEmotionVal.current &&
      emotion.value !== currentPhoto.emotion?.value
    ) {
      lastSentEmotionVal.current = emotion.value;
      handleUpdateEmotion(currentPhoto.id, emotion);
    }
  }, [emotion?.value]);

  // Xử lý khi chọn file từ widget ngoài trang chủ
  const handleWidgetFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64Url = await fileToCompressedDataUrl(file);
    if (base64Url) {
      setPendingUploadFromWidget({
        file,
        url: base64Url,
        caption: '',
        emotion: EMOTION_PRESETS[1]
      });
      setModalOpen(true);
    }
    e.target.value = '';
  };

  return (
    <>
      {/* ── Small square widget (Thu nhỏ trên Dashboard) ── */}
      <div className="glass-card p-3 sm:p-3.5 rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group border border-slate-200 dark:border-slate-700 relative overflow-hidden select-none">

        {/* Widget Header */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
              Image of the Day
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {/* Nút + Thêm ảnh trực tiếp ngay trên header của widget */}
            <label
              className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              title="Tải thêm ảnh mới vào kho"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWidgetFilePicked}
              />
              <Plus className="w-3.5 h-3.5" />
            </label>

            {/* Nút đổi ngẫu nhiên nếu có > 1 ảnh */}
            {store.photos.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  shufflePhoto();
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                title="Lấy ngẫu nhiên 1 ảnh (30p – 5h)"
              >
                <Shuffle className="w-3 h-3" />
              </span>
            )}

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hôm nay
            </span>
          </div>
        </div>

        {/* Square image box */}
        <div
          onClick={() => setModalOpen(true)}
          className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner cursor-pointer group/img select-none"
        >
          {currentPhoto?.url ? (
            <>
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || "Image of the day"}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/img:scale-105"
              />

              {/* Hover overlay with zoom icon */}
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-all duration-300 flex items-center justify-center">
                <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover/img:opacity-100 transition-all duration-300 drop-shadow-lg" />
              </div>

              {/* Top-left: Huy hiệu Emotion State trên widget thu nhỏ */}
              {currentPhoto.emotion && currentPhoto.emotion.value > 0 && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-white text-[10px] font-semibold border border-white/20 shadow-xs pointer-events-none z-10">
                  <span className="text-xs">{currentPhoto.emotion.emoji}</span>
                  <span className="truncate max-w-[80px]">{currentPhoto.emotion.label}</span>
                  <span className="text-sky-300 font-bold">{currentPhoto.emotion.value}%</span>
                </div>
              )}

              {/* Bottom: Caption Overlay trên widget thu nhỏ */}
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none flex flex-col justify-end">
                {currentPhoto.caption ? (
                  <p className="text-xs font-bold text-white leading-tight drop-shadow-sm line-clamp-2">
                    {currentPhoto.caption}
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-slate-300 leading-tight italic">
                    {currentPhoto.emotion?.label || "Khoảnh khắc hôm nay"}
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Khi kho ảnh đang trống: bấm vào để chọn ảnh */
            <label
              className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500 group-hover/img:text-blue-500 dark:group-hover/img:text-blue-400 transition-colors group-hover/img:bg-blue-50/40 dark:group-hover/img:bg-blue-900/20 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWidgetFilePicked}
              />
              <div className="p-2.5 rounded-2xl bg-slate-200 dark:bg-slate-700 group-hover/img:bg-blue-100 dark:group-hover/img:bg-blue-900/40 transition-colors">
                <ImagePlus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Thêm ảnh hôm nay</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Bấm để tải ảnh, caption & cảm xúc</span>
            </label>
          )}
        </div>

      </div>

      {/* ── Modal Quản Lý & Xem Ảnh Chi Tiết (Phóng to) ── */}
      {modalOpen && (
        <DayImageModal
          currentPhoto={currentPhoto}
          photos={store.photos}
          nextShuffleTime={store.nextShuffleTime}
          initialPendingUpload={pendingUploadFromWidget}
          onClose={() => {
            setModalOpen(false);
            setPendingUploadFromWidget(null);
          }}
          onSaveNewPhoto={handleSaveNewPhoto}
          onSelectPhoto={handleSelectPhoto}
          onShuffleNow={shufflePhoto}
          onDeletePhoto={handleDeletePhoto}
          onUpdateCaption={handleUpdateCaption}
          onUpdateEmotion={handleUpdateEmotion}
          isUploading={isUploading}
          uploadFeedback={uploadFeedback}
        />
      )}
    </>
  );
};
