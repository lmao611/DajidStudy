/**
 * API Service Layer for DajidStudy
 * Configured for backend endpoint (default: http://localhost:5000/api)
 * When backend is not yet started, falls back gracefully without interrupting dev experience.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi API (${response.status})`);
  }
  return response.json();
};

export const apiService = {
  // Profile
  getProfile: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`);
      return await handleResponse(res);
    } catch (err) {
      console.info('[Dev Note] Backend API chưa kết nối, ứng dụng đang dùng local store.');
      return null;
    }
  },

  // Schedules
  getSchedules: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedules`);
      return await handleResponse(res);
    } catch (err) {
      return null;
    }
  },
  createSchedule: async (scheduleData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      return await handleResponse(res);
    } catch (err) {
      return null;
    }
  },

  // Vocabularies
  getVocabularies: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/vocabularies`);
      return await handleResponse(res);
    } catch (err) {
      return null;
    }
  },
  createVocabulary: async (vocabData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vocabularies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vocabData)
      });
      return await handleResponse(res);
    } catch (err) {
      return null;
    }
  }
};
