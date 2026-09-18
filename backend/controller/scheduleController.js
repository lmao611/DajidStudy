import { ScheduleModel } from '../model/Schedule.js';
import { successResponse, errorResponse } from '../lib/responseHelper.js';

export const getSchedules = (req, res, next) => {
  try {
    const { dayOfWeek } = req.query;
    const schedules = ScheduleModel.getAll({ dayOfWeek });
    return successResponse(res, schedules, 'Lấy danh sách thời khóa biểu thành công');
  } catch (err) {
    next(err);
  }
};

export const createSchedule = (req, res, next) => {
  try {
    const newSchedule = ScheduleModel.create(req.body);
    return successResponse(res, newSchedule, 'Thêm ca học mới thành công', 201);
  } catch (err) {
    next(err);
  }
};

export const toggleScheduleComplete = (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = ScheduleModel.toggleComplete(id);
    if (!updated) {
      return errorResponse(res, 'Không tìm thấy ca học với ID tương ứng', 404);
    }
    return successResponse(res, updated, 'Cập nhật trạng thái hoàn thành thành công');
  } catch (err) {
    next(err);
  }
};

export const deleteSchedule = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = ScheduleModel.delete(id);
    if (!deleted) {
      return errorResponse(res, 'Không tìm thấy ca học với ID tương ứng để xóa', 404);
    }
    return successResponse(res, deleted, 'Đã xóa ca học thành công');
  } catch (err) {
    next(err);
  }
};
