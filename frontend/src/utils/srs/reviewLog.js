// src/utils/srs/reviewLog.js
// Nén Dictionary Encoding cho SRS Review Logs (FSRS-7)

/**
 * Nén mảng log thô thành định dạng từ điển (Dictionary-compressed format).
 * Giúp giảm 70-80% dung lượng lưu trữ trên Firestore và LocalStorage.
 * 
 * @param {Array<Object>} rawArray - Danh sách log thô [{ cardId, rating, t, reviewTime, modality }, ...]
 * @returns {{ dict: string[], logs: Array<[number, number, number, number, number]> }}
 */
export function compressLogs(rawArray = []) {
  const dict = [];
  const logs = [];

  for (let i = 0; i < rawArray.length; i++) {
    const log = rawArray[i];
    if (!log || !log.cardId) continue;

    let dictIndex = dict.indexOf(log.cardId);
    if (dictIndex === -1) {
      dictIndex = dict.length;
      dict.push(log.cardId);
    }

    const t = typeof log.t === 'number' ? Number(log.t.toFixed(4)) : 0;
    const ts = log.reviewTime || log.ts || Date.now();
    const isTyping = log.modality === 'typing' || log.isTyping ? 1 : 0;

    logs.push([dictIndex, log.rating, t, ts, isTyping]);
  }

  return { dict, logs };
}

/**
 * Giải nén định dạng từ điển trở lại mảng log thô để hiển thị biểu đồ/thống kê.
 * 
 * @param {{ dict: string[], logs: Array<Array<number>> }} compressed 
 * @returns {Array<Object>}
 */
export function extractRawLogs(compressed) {
  if (!compressed || !Array.isArray(compressed.logs) || !Array.isArray(compressed.dict)) {
    return [];
  }

  return compressed.logs.map((log, idx) => ({
    cardId: compressed.dict[log[0]] || `card-${log[0]}`,
    rating: log[1],
    t: log[2],
    reviewTime: log[3] || (Date.now() - 1000000 + idx),
    isTyping: log[4] === 1,
    modality: log[4] === 1 ? 'typing' : 'en-vi'
  }));
}

/**
 * Thêm một log mới vào đối tượng đã nén (Append directly without full recompression)
 * 
 * @param {{ dict: string[], logs: Array<Array<number>> }} compressed 
 * @param {Object} newLog - { cardId, rating, t, reviewTime, modality }
 * @returns {{ dict: string[], logs: Array<Array<number>> }}
 */
export function appendCompressedLog(compressed = { dict: [], logs: [] }, newLog) {
  if (!newLog || !newLog.cardId) return compressed;

  const dict = Array.isArray(compressed.dict) ? [...compressed.dict] : [];
  const logs = Array.isArray(compressed.logs) ? [...compressed.logs] : [];

  let dictIndex = dict.indexOf(newLog.cardId);
  if (dictIndex === -1) {
    dictIndex = dict.length;
    dict.push(newLog.cardId);
  }

  const t = typeof newLog.t === 'number' ? Number(newLog.t.toFixed(4)) : 0;
  const ts = newLog.reviewTime || Date.now();
  const isTyping = newLog.modality === 'typing' || newLog.isTyping ? 1 : 0;

  logs.push([dictIndex, newLog.rating, t, ts, isTyping]);

  // Giới hạn 10,000 log gần nhất để giữ hiệu năng siêu mượt
  const maxLogs = 10000;
  const finalLogs = logs.length > maxLogs ? logs.slice(logs.length - maxLogs) : logs;

  return { dict, logs: finalLogs };
}
