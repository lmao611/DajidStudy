import { errorResponse } from '../lib/responseHelper.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err);
  const status = err.status || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';
  return errorResponse(res, message, status);
};
