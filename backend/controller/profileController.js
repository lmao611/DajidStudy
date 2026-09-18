import { ProfileModel } from '../model/Profile.js';
import { successResponse, errorResponse } from '../lib/responseHelper.js';

export const getProfile = (req, res, next) => {
  try {
    const profile = ProfileModel.getProfile();
    return successResponse(res, profile, 'Lấy thông tin hồ sơ thành công');
  } catch (err) {
    next(err);
  }
};

export const updateProfile = (req, res, next) => {
  try {
    const updated = ProfileModel.updateProfile(req.body);
    return successResponse(res, updated, 'Cập nhật thông tin thành công');
  } catch (err) {
    next(err);
  }
};

export const toggleGoal = (req, res, next) => {
  try {
    const { id } = req.params;
    const goal = ProfileModel.toggleGoal(id);
    if (!goal) {
      return errorResponse(res, 'Không tìm thấy mục tiêu với ID tương ứng', 404);
    }
    return successResponse(res, goal, 'Cập nhật trạng thái mục tiêu thành công');
  } catch (err) {
    next(err);
  }
};
