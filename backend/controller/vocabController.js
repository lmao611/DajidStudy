import { VocabModel } from '../model/Vocab.js';
import { successResponse, errorResponse } from '../lib/responseHelper.js';

export const getVocabularies = (req, res, next) => {
  try {
    const { topic, search } = req.query;
    const vocabs = VocabModel.getAll({ topic, search });
    return successResponse(res, vocabs, 'Lấy danh sách từ vựng thành công');
  } catch (err) {
    next(err);
  }
};

export const createVocabulary = (req, res, next) => {
  try {
    const newVocab = VocabModel.create(req.body);
    return successResponse(res, newVocab, 'Thêm từ vựng mới thành công', 201);
  } catch (err) {
    next(err);
  }
};

export const toggleMasteredVocab = (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = VocabModel.toggleMastered(id);
    if (!updated) {
      return errorResponse(res, 'Không tìm thấy từ vựng với ID tương ứng', 404);
    }
    return successResponse(res, updated, 'Cập nhật trạng thái thành thạo thành công');
  } catch (err) {
    next(err);
  }
};

export const deleteVocabulary = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = VocabModel.delete(id);
    if (!deleted) {
      return errorResponse(res, 'Không tìm thấy từ vựng với ID tương ứng để xóa', 404);
    }
    return successResponse(res, deleted, 'Đã xóa từ vựng thành công');
  } catch (err) {
    next(err);
  }
};
