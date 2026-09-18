import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Filter, 
  BookOpen, 
  X,
  CalendarDays,
  FileText
} from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import { CountUp } from '../components/CountUp';

export const Schedule = () => {
  const { schedules, addSchedule, toggleScheduleComplete, deleteSchedule } = useStudyStore();
  
  const [selectedDay, setSelectedDay] = useState('Tất cả');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    dayOfWeek: 'Thứ 2',
    timeStart: '08:00',
    timeEnd: '09:30',
    location: 'Bàn học cá nhân',
    type: 'Coding',
    notes: ''
  });

  const daysOfWeek = ['Tất cả', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  // Filtered schedules
  const filteredSchedules = selectedDay === 'Tất cả' 
    ? schedules 
    : schedules.filter(s => s.dayOfWeek === selectedDay);

  const completedCount = schedules.filter(s => s.completed).length;
  const totalCount = schedules.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) return;

    addSchedule(formData);
    setFormData({
      subject: '',
      dayOfWeek: 'Thứ 2',
      timeStart: '08:00',
      timeEnd: '09:30',
      location: 'Bàn học cá nhân',
      type: 'Coding',
      notes: ''
    });
    setIsModalOpen(false);
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'Coding':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40';
      case 'Ngoại ngữ':
        return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40';
      case 'Project':
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/40';
      case 'Nghiên cứu':
        return 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/40';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Thời khóa biểu & Kế hoạch học</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Lịch Học Cá Nhân
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Theo dõi, quản lý các ca học trong tuần để luôn giữ vững kỷ luật và năng suất.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl text-left">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Tiến độ tuần</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                <CountUp end={completedCount} duration={800} />/{totalCount}
              </span>
              <span className="text-xs text-blue-600 font-semibold">
                (<CountUp end={progressPercent} duration={1000} suffix="%" />)
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ca học mới</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Day */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Lọc ngày:</span>
        </div>
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md shadow-slate-900/10'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      {filteredSchedules.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl border-dashed border-2 border-slate-200 dark:border-slate-600 p-8 space-y-3">
          <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Chưa có ca học nào cho {selectedDay}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Hãy bắt đầu thêm ca học để quản lý thời gian học tập hiệu quả hơn nhé!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ca học ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`relative group rounded-3xl p-5 border transition-all duration-200 ${
                schedule.completed
                  ? 'bg-slate-50/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-xs hover:shadow-md'
              }`}
            >
              {/* Header card: Day & Category */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {schedule.dayOfWeek}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getTypeBadgeColor(schedule.type)}`}>
                  {schedule.type}
                </span>
              </div>

              {/* Subject Title */}
              <h3 className={`text-base font-bold mb-2 leading-snug ${
                schedule.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
              }`}>
                {schedule.subject}
              </h3>

              {/* Time & Location */}
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{schedule.timeStart} - {schedule.timeEnd}</span>
                </div>
                {schedule.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{schedule.location}</span>
                  </div>
                )}
                {schedule.notes && (
                  <div className="flex items-start gap-2 pt-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">{schedule.notes}</span>
                  </div>
                )}
              </div>

              {/* Footer actions: Toggle complete & Delete */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <button
                  onClick={() => toggleScheduleComplete(schedule.id)}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                    schedule.completed
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                  }`}
                >
                  {schedule.completed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã hoàn thành</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-blue-400" />
                      <span>Đánh dấu xong</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  title="Xóa ca học"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Ca Học */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Thêm Ca Học Mới</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              
              {/* Tên môn học */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Tên môn học / Chủ đề *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình React, Ôn từ vựng IELTS, Thuật toán..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Thứ & Thể loại */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Ngày trong tuần</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white"
                  >
                    {daysOfWeek.filter(d => d !== 'Tất cả').map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Phân loại</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white"
                  >
                    <option value="Coding">Coding</option>
                    <option value="Ngoại ngữ">Ngoại ngữ</option>
                    <option value="Project">Project</option>
                    <option value="Nghiên cứu">Nghiên cứu</option>
                    <option value="Ôn tập">Ôn tập</option>
                  </select>
                </div>
              </div>

              {/* Giờ bắt đầu & Giờ kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={formData.timeStart}
                    onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={formData.timeEnd}
                    onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Địa điểm */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Địa điểm / Link học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bàn học, Thư viện, Google Meet, Zoom..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Ghi chú mục tiêu buổi học</label>
                <textarea
                  rows={2}
                  placeholder="Nội dung cần hoàn thành trong ca này..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Lưu ca học
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
