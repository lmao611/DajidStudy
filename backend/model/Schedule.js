import { db } from '../lib/db.js';

export class ScheduleModel {
  static getAll(filters = {}) {
    let result = [...db.schedules];
    if (filters.dayOfWeek && filters.dayOfWeek !== 'Tất cả') {
      result = result.filter(s => s.dayOfWeek === filters.dayOfWeek);
    }
    return result;
  }

  static getById(id) {
    return db.schedules.find(s => s.id === id) || null;
  }

  static create(data) {
    const newSchedule = {
      id: "sch-" + Date.now(),
      subject: data.subject,
      dayOfWeek: data.dayOfWeek || "Thứ 2",
      timeStart: data.timeStart || "08:00",
      timeEnd: data.timeEnd || "09:30",
      location: data.location || "Bàn học cá nhân",
      type: data.type || "Coding",
      completed: false,
      notes: data.notes || ""
    };
    db.schedules.unshift(newSchedule);
    return newSchedule;
  }

  static toggleComplete(id) {
    const item = db.schedules.find(s => s.id === id);
    if (item) {
      item.completed = !item.completed;
      return item;
    }
    return null;
  }

  static delete(id) {
    const index = db.schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      const removed = db.schedules.splice(index, 1);
      return removed[0];
    }
    return null;
  }
}
