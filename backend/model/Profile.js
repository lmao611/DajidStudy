import { db } from '../lib/db.js';

export class ProfileModel {
  static getProfile() {
    return db.profile;
  }

  static updateProfile(updatedData) {
    db.profile = {
      ...db.profile,
      ...updatedData
    };
    return db.profile;
  }

  static toggleGoal(goalId) {
    const goal = db.profile.goals.find(g => g.id === Number(goalId));
    if (goal) {
      goal.done = !goal.done;
      return goal;
    }
    return null;
  }
}
