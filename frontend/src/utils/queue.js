// src/utils/queue.js - Pure functions for SRS Queue Management & Prioritized Study

export function getLocalDateString(dateMs = Date.now()) {
    const d = new Date(dateMs);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Phân loại từ vựng thành các nhóm:
 * - mastered: Thẻ đã thuộc (độ khó <= 3 hoặc isMastered = true)
 * - new: Thẻ mới tinh chưa từng học
 * - due: Thẻ đến hạn ôn tập
 * - learning: Thẻ đang trong chu trình ghi nhớ
 */
export function categorizeVocabs(vocabularies = [], topicFilter = 'Tất cả') {
    const now = Date.now();
    const buckets = { due: [], learning: [], new: [], mastered: [] };
    
    for (let i = 0; i < vocabularies.length; i++) {
        const word = vocabularies[i];
        if (!word || word.isDeleted) continue;
        
        const topicMatch = topicFilter === 'Tất cả' || word.topic === topicFilter;
        if (!topicMatch) continue;

        const isMastered = word.isMastered || (typeof word.difficulty === 'number' && word.difficulty <= 3.0);
        
        if (isMastered) {
            buckets.mastered.push(word);
            continue;
        }

        const isNew = word.srsStatus === 'New' || (!word.reps && !word.lastReviewDate && !word.srsDueDate);
        if (isNew) {
            buckets.new.push(word);
            continue;
        }

        if (word.srsStatus === 'Learning') {
            buckets.learning.push(word);
            continue;
        }

        // Đã qua giai đoạn mới, kiểm tra ngày đến hạn ôn
        const isDue = !word.srsDueDate || word.srsDueDate <= now;
        if (isDue) {
            buckets.due.push(word);
        } else {
            // Chưa đến hạn ôn nhưng chưa đạt mức thuộc
            buckets.learning.push(word);
        }
    }
    
    return buckets;
}

/**
 * Xây dựng hàng đợi học tập thông minh (Smart Prioritized Queue):
 * 1. Ưu tiên từ mới (New)
 * 2. Ưu tiên từ mang độ khó tiệm cận đã thuộc (3.0 < difficulty <= 4.5) để mau chóng thành thạo
 * 3. Ưu tiên từ có độ khó cao (nhưng dùng weighted jitter để ưu tiên tự nhiên, không đẩy hẳn cứng nhắc lên đầu)
 * 4. Thỉnh thoảng đem các từ đã thuộc lâu ngày (hoặc xác suất 15%) lên để kiểm tra xem có quên hay chưa
 */
export function buildStudyQueue(vocabularies = [], options = {}) {
    const {
        topicFilter = 'Tất cả',
        searchQuery = '',
        statusFilter = 'all'
    } = options;

    const now = Date.now();
    const candidates = [];

    for (let i = 0; i < vocabularies.length; i++) {
        const item = vocabularies[i];
        if (!item || item.isDeleted) continue;

        // Lọc chủ đề
        if (topicFilter !== 'Tất cả' && item.topic !== topicFilter) continue;

        // Lọc tìm kiếm
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const match = (item.word || '').toLowerCase().includes(q) ||
                          (item.meaning || '').toLowerCase().includes(q);
            if (!match) continue;
        }

        const difficulty = typeof item.difficulty === 'number' ? item.difficulty : 5.0;
        const isMastered = item.isMastered || difficulty <= 3.0;

        // Lọc trạng thái nếu người dùng bấm tab filter cụ thể
        if (statusFilter === 'mastered' && !isMastered) continue;
        if (statusFilter === 'learning' && isMastered) continue;

        // TÍNH ĐIỂM ƯU TIÊN THEO ĐƯỜNG CONG TRÍ NHỚ (SPACED REPETITION PRIORITY):
        // 1. Từ đến hạn ôn tập (Due): Ưu tiên cao nhất
        // 2. Từ chưa ôn sâu (Độ khó cao, cây trí nhớ chưa lên lại, stability thấp): Ưu tiên đẩy lên kéo trí nhớ lại
        // 3. Từ mới (New): Ưu tiên tiếp theo để nạp từ vựng mới
        // 4. Từ đã học nhưng CHƯA đến hạn (Not Due): Tự động nhường chỗ, dời về sau theo số ngày hẹn xa dần
        let priority = 40;

        const isNew = item.srsStatus === 'New' || (!item.reps && !item.lastReviewDate && !item.srsDueDate);
        const isDue = !item.srsDueDate || item.srsDueDate <= now;

        if (isMastered) {
            // Logic cho từ đã thuộc:
            // "Những từ đã thuộc lâu lâu vẫn sẽ đem lên để xem thử có quên hay chưa nhé"
            const daysSinceLastReview = item.lastReviewDate ? (now - item.lastReviewDate) / 86400000 : 999;
            const isRetentionCheck = daysSinceLastReview >= 4.0 || Math.random() < 0.15;

            if (statusFilter === 'mastered') {
                // Đang xem riêng tab Đã thuộc: hiện toàn bộ
                priority = 50;
            } else if (isRetentionCheck) {
                // Đem lên ngẫu nhiên hoặc quá 4 ngày chưa ôn để check trí nhớ
                priority = 35 + (daysSinceLastReview >= 7 ? 15 : 0);
            } else {
                // Đã thuộc và vừa mới ôn gần đây -> nhường chỗ ở cuối hàng đợi
                priority = 8;
            }
        } else if (isDue) {
            // THẺ ĐẾN HẠN ÔN TẬP THEO ĐƯỜNG CONG TRÍ NHỚ:
            // Đẩy lên ưu tiên hàng đầu!
            priority = 90;

            const overdueDays = item.srsDueDate ? Math.max(0, (now - item.srsDueDate) / 86400000) : 1;
            priority += Math.min(20, overdueDays * 3.5);

            // Ưu tiên từ chưa ôn sâu (cây trí nhớ chưa lên lại, stability thấp, reps còn ít):
            const stability = typeof item.stability === 'number' ? item.stability : 1.0;
            const reps = item.reps || 0;
            if (stability < 3.0 || reps <= 2) {
                priority += 18; // Kéo cây trí nhớ lên lại!
            }

            // Ưu tiên từ mang độ khó cao:
            const difficultyBias = (difficulty - 5.0) * 4.0;
            priority += difficultyBias;

            // Ưu tiên từ tiệm cận đã thuộc (3.0 < difficulty <= 4.5):
            if (difficulty > 3.0 && difficulty <= 4.5) {
                priority += 14;
            }
        } else if (isNew) {
            // TỪ MỚI TINH:
            // Vẫn ưu tiên xuất hiện học xen kẽ
            priority = 75;

            // Ưu tiên nhẹ theo độ khó
            priority += (difficulty - 5.0) * 2.0;
        } else {
            // TỪ ĐÃ HỌC NHƯNG CHƯA ĐẾN HẠN ÔN TẬP:
            // "cứ thế xa dần xa dần nhường chỗ cho những từ chưa ôn sâu tức độ khó cao hay cây trí nhớ chưa lên lại và những từ mới"
            // Hẹn ngày càng xa trong tương lai -> điểm ưu tiên càng thấp, tự động lui về cuối hàng đợi
            const futureDays = item.srsDueDate ? Math.max(0.1, (item.srsDueDate - now) / 86400000) : 1;
            priority = Math.max(5, 30 - futureDays * 6);
        }

        // Nhiễu ngẫu nhiên nhẹ (Jitter +-8 điểm):
        // Giúp các từ trong cùng nhóm không bị sắp xếp quá cứng nhắc
        const jitter = (Math.random() - 0.5) * 16;
        priority += jitter;

        candidates.push({
            item,
            priority
        });
    }

    // Sắp xếp theo thứ tự ưu tiên giảm dần
    candidates.sort((a, b) => b.priority - a.priority);

    return candidates.map(c => c.item);
}
