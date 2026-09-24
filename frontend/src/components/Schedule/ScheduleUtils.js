// Utility functions for Schedule and Calendar

export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
export const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday

export const getWeekDates = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust so week starts on Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(nextDay);
  }
  return week;
};

export const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
};

export const IMPORTANCE_LEVELS = {
  1: { id: 1, label: 'Tạp vụ', color: 'slate', bgColor: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-700 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
  2: { id: 2, label: 'Bình thường', color: 'blue', bgColor: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-700/40' },
  3: { id: 3, label: 'Ưu tiên', color: 'emerald', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-700/40' },
  4: { id: 4, label: 'Quan trọng', color: 'amber', bgColor: 'bg-amber-50 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-200 dark:border-amber-700/40' },
  5: { id: 5, label: 'Bắt buộc', color: 'rose', bgColor: 'bg-rose-50 dark:bg-rose-900/30', textColor: 'text-rose-700 dark:text-rose-300', borderColor: 'border-rose-200 dark:border-rose-700/40' }
};

export const getImportanceStyles = (levelId) => {
  const level = IMPORTANCE_LEVELS[levelId] || IMPORTANCE_LEVELS[2];
  return `${level.bgColor} ${level.textColor} ${level.borderColor}`;
};

export const calculateOverlaps = (schedules) => {
  // schedules must be sorted by timeStart
  const sorted = [...schedules].sort((a, b) => parseTime(a.timeStart) - parseTime(b.timeStart));
  const result = [];
  
  sorted.forEach(sch => {
    // Find groups of overlapping schedules
    const start = parseTime(sch.timeStart);
    const end = parseTime(sch.timeEnd);
    
    // Check if it overlaps with an existing group
    let placed = false;
    for (let group of result) {
      // Group overlaps if the start time is strictly less than the group's max end time
      if (start < group.maxEnd) {
        group.items.push(sch);
        group.maxEnd = Math.max(group.maxEnd, end);
        placed = true;
        break;
      }
    }
    
    if (!placed) {
      result.push({
        maxEnd: end,
        items: [sch]
      });
    }
  });
  
  // Flatten and attach layout info
  const laidOutSchedules = [];
  result.forEach(group => {
    const totalCols = group.items.length;
    group.items.forEach((item, index) => {
      laidOutSchedules.push({
        ...item,
        layout: {
          overlapCount: totalCols,
          colIndex: index
        }
      });
    });
  });
  
  return laidOutSchedules;
};
