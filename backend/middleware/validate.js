import { errorResponse } from '../lib/responseHelper.js';

export const validateSchedule = (req, res, next) => {
  const { subject } = req.body;
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return errorResponse(res, 'Tên môn học/chủ đề là bắt buộc', 400);
  }
  next();
};

export const validateVocab = (req, res, next) => {
  const { word, meaning } = req.body;
  if (!word || !meaning) {
    return errorResponse(res, 'Từ vựng và nghĩa tiếng Việt là bắt buộc', 400);
  }
  next();
};
