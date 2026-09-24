import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, CalendarDays, Plus } from 'lucide-react';
import { useStudyStore } from '../../stores/studyStore';
import { getDaysInMonth, getFirstDayOfMonth, getWeekDates, formatDate, IMPORTANCE_LEVELS, getImportanceStyles, parseTime, calculateOverlaps } from './ScheduleUtils';

export const ScheduleBoard = ({ onAddSchedule }) => {
  const { schedules, toggleScheduleComplete } = useStudyStore();
  
  // States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterImportance, setFilterImportance] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Month navigation
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

  // Grid dates (Weekly)
  const weekDates = getWeekDates(selectedDate);
  const weekDaysVN = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  
  // Time slots (06:00 to 23:00)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    let filtered = schedules;
    if (filterImportance !== 'all') {
      filtered = filtered.filter(s => s.importance === Number(filterImportance));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.subject.toLowerCase().includes(q));
    }
    return filtered;
  }, [schedules, filterImportance, searchQuery]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 mt-8 animate-in fade-in">
      
      {/* LEFT BOARD: Mini Calendar & Filters */}
      <div className="w-full xl:w-80 space-y-6 flex-shrink-0">
        
        {/* Filters */}
        <div className="glass-card p-5 rounded-3xl shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100 font-bold">
            <Filter className="w-4 h-4" />
            <h3>Bộ Lọc Lịch</h3>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tìm tên ca học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none dark:text-slate-200"
            />
            <select 
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none dark:text-slate-200"
            >
              <option value="all">Tất cả độ quan trọng</option>
              {Object.values(IMPORTANCE_LEVELS).map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="glass-card p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 capitalize">{monthName}</h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(year, month, day);
              const dateStr = formatDate(dateObj);
              const isSelected = formatDate(selectedDate) === dateStr;
              
              // Find highest importance schedule for this day
              const daySchedules = schedules.filter(s => s.date === dateStr);
              let dotColor = null;
              if (daySchedules.length > 0) {
                const maxImp = Math.max(...daySchedules.map(s => s.importance || 2));
                const level = IMPORTANCE_LEVELS[maxImp];
                dotColor = level ? `bg-${level.color}-500` : 'bg-slate-400';
              }

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`h-8 w-full rounded-lg text-xs font-medium flex flex-col items-center justify-center relative transition-colors ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{day}</span>
                  {dotColor && (
                    <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : dotColor}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        <button 
          onClick={() => onAddSchedule(formatDate(selectedDate))}
          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm ca học ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
        </button>

      </div>

      {/* RIGHT BOARD: Weekly Time Grid */}
      <div className="flex-1 glass-card p-1 sm:p-5 rounded-3xl shadow-xs overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-4 px-4 pt-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Bảng Lịch Tuần</h2>
        </div>
        
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          <div className="min-w-[700px] relative">
            
            {/* Header: Days */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20">
              <div className="w-16 flex-shrink-0" /> {/* Time column spacer */}
              {weekDates.map((date, idx) => {
                const dateStr = formatDate(date);
                const isToday = dateStr === formatDate(new Date());
                return (
                  <div key={idx} className="flex-1 text-center py-3 border-l border-slate-100 dark:border-slate-800/50">
                    <div className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                      {weekDaysVN[idx]}
                    </div>
                    <div className={`text-sm mt-0.5 ${isToday ? 'font-extrabold text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="relative">
              {/* Background grid lines */}
              {hours.map(hour => (
                <div key={hour} className="flex border-b border-slate-100 dark:border-slate-800/50 relative h-16">
                  <div className="w-16 flex-shrink-0 text-[10px] font-medium text-slate-400 text-right pr-2 pt-1 sticky left-0 bg-white dark:bg-slate-900 z-10">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDates.map((_, idx) => (
                    <div key={idx} className="flex-1 border-l border-slate-100 dark:border-slate-800/50" />
                  ))}
                </div>
              ))}

              {/* Render Schedule Blocks */}
              {weekDates.map((date, dayIdx) => {
                const dateStr = formatDate(date);
                const daySchedules = filteredSchedules.filter(s => s.date === dateStr || (!s.date && s.dayOfWeek === weekDaysVN[dayIdx]));
                const laidOut = calculateOverlaps(daySchedules);

                return laidOut.map(sch => {
                  const startH = parseTime(sch.timeStart);
                  const endH = parseTime(sch.timeEnd);
                  if (startH < 6 || startH >= 24) return null; // Out of bounds for this view

                  const top = (startH - 6) * 64; // 64px per hour
                  const height = (endH - startH) * 64;
                  
                  // Width and Left based on overlap
                  const widthPct = 100 / sch.layout.overlapCount;
                  const leftPct = widthPct * sch.layout.colIndex;
                  const hasOverlap = sch.layout.overlapCount > 1;

                  const importanceStyles = getImportanceStyles(sch.importance || 2);

                  return (
                    <div
                      key={sch.id}
                      className={`absolute rounded-lg p-1.5 overflow-hidden transition-all hover:z-30 cursor-pointer shadow-sm hover:shadow-md ${importanceStyles} ${sch.completed ? 'opacity-60' : ''}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(4rem + ${dayIdx} * ((100% - 4rem) / 7) + ${leftPct}% * ((100% - 4rem) / 7) / 100 + 2px)`,
                        width: `calc(((100% - 4rem) / 7) * ${widthPct / 100} - 4px)`,
                        // Overlap Warning Pattern if overlapCount > 1
                        backgroundImage: hasOverlap ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px)' : 'none'
                      }}
                      onClick={() => toggleScheduleComplete(sch.id)}
                      title={`${sch.subject}\n${sch.timeStart} - ${sch.timeEnd}${hasOverlap ? '\n⚠️ Trùng lịch' : ''}`}
                    >
                      <div className="text-[10px] font-bold truncate leading-tight mb-0.5">{sch.subject}</div>
                      <div className="text-[9px] opacity-80">{sch.timeStart}-{sch.timeEnd}</div>
                    </div>
                  );
                });
              })}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
