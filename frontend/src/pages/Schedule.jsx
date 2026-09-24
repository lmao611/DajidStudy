import React, { useState } from 'react';
import { CalendarDays, Plus, X, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import { PlanManager } from '../components/Schedule/PlanManager';
import { ScheduleBoard } from '../components/Schedule/ScheduleBoard';
import { IMPORTANCE_LEVELS, getImportanceStyles } from '../components/Schedule/ScheduleUtils';

export const Schedule = () => {
  const { addSchedule, updateSchedule, deleteSchedule, toggleScheduleComplete, plans } = useStudyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    date: '', 
    timeStart: '08:00',
    timeEnd: '09:30',
    importance: 2,
    planId: '',
    location: '',
    type: 'Coding',
    notes: ''
  });

  const openAddModal = (dateStr = '') => {
    setFormData({
      subject: '', date: dateStr || new Date().toISOString().split('T')[0], timeStart: '08:00', timeEnd: '09:30', 
      importance: 2, planId: '', location: '', type: 'Coding', notes: ''
    });
    setIsModalOpen(true);
  };

  const handleScheduleClick = (sch) => {
    setSelectedSchedule(sch);
    setIsViewModalOpen(true);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setFormData({
      subject: selectedSchedule.subject || '',
      date: selectedSchedule.date || '',
      timeStart: selectedSchedule.timeStart || '08:00',
      timeEnd: selectedSchedule.timeEnd || '09:30',
      importance: selectedSchedule.importance || 2,
      planId: selectedSchedule.planId || '',
      location: selectedSchedule.location || '',
      type: selectedSchedule.type || 'Coding',
      notes: selectedSchedule.notes || ''
    });
    setIsEditing(true);
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa ca học này?')) {
      deleteSchedule(selectedSchedule.id);
      setIsViewModalOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) return;

    const d = new Date(formData.date);
    const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    
    const dataToSave = {
      ...formData,
      importance: Number(formData.importance),
      dayOfWeek: dayNames[d.getDay()] || formData.dayOfWeek
    };

    if (isEditing && selectedSchedule) {
      updateSchedule(selectedSchedule.id, dataToSave);
    } else {
      addSchedule(dataToSave);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Kế Hoạch & Lịch Học V2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Quản Lý Thời Gian
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Lập kế hoạch mục tiêu và sắp xếp lịch trình chi tiết theo từng ngày, từng giờ.
          </p>
        </div>

        <button
          onClick={() => { setIsEditing(false); openAddModal(); }}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm ca học mới</span>
        </button>
      </div>

      {/* Plan Manager Section */}
      <PlanManager />

      {/* Dual Board Schedule Section */}
      <ScheduleBoard onAddSchedule={(d) => { setIsEditing(false); openAddModal(d); }} onScheduleClick={handleScheduleClick} />

      {/* Modal View Details */}
      {isViewModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 pr-4">{selectedSchedule.subject}</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold w-24">Thời gian:</span>
                <span>{selectedSchedule.timeStart} - {selectedSchedule.timeEnd}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-24">Ngày:</span>
                <span>{selectedSchedule.date || selectedSchedule.dayOfWeek}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-24">Quan trọng:</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getImportanceStyles(selectedSchedule.importance || 2)} border`}>
                  {IMPORTANCE_LEVELS[selectedSchedule.importance || 2]?.label}
                </span>
              </div>
              {selectedSchedule.planId && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-24">Thuộc KH:</span>
                  <span className="truncate flex-1">{plans.find(p => p.id === selectedSchedule.planId)?.title || 'Không rõ'}</span>
                </div>
              )}
              {selectedSchedule.notes && (
                <div className="flex flex-col gap-1 mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Ghi chú:</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{selectedSchedule.notes}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { toggleScheduleComplete(selectedSchedule.id); setIsViewModalOpen(false); }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${selectedSchedule.completed ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}
              >
                {selectedSchedule.completed ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {selectedSchedule.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
              </button>
              <div className="flex gap-2">
                <button onClick={handleEditClick} className="flex-1 flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                </button>
                <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50">
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa Ca Học */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? 'Sửa Ca Học' : 'Thêm Ca Học Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Tên ca học *</label>
                <input
                  type="text" required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Ngày học *</label>
                  <input
                    type="date" required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Độ quan trọng</label>
                  <select
                    value={formData.importance}
                    onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 outline-none"
                  >
                    {Object.values(IMPORTANCE_LEVELS).map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Giờ bắt đầu</label>
                  <input
                    type="time" required
                    value={formData.timeStart}
                    onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Giờ kết thúc</label>
                  <input
                    type="time" required
                    value={formData.timeEnd}
                    onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Thuộc Kế Hoạch (Tùy chọn)</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="">-- Không chọn --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Ghi chú</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm cho ca học này..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none custom-scrollbar resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">Hủy</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  {isEditing ? 'Cập nhật' : 'Lưu ca học'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
