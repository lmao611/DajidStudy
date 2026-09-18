import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

const firebaseConfig = {
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Kiểm tra xem Firebase đã được cấu hình đầy đủ chưa
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  !firebaseConfig.apiKey.includes("your_api_key")
);

// Khởi tạo Firebase App (tránh khởi tạo trùng lặp)
const app = !getApps().length 
  ? (isFirebaseConfigured ? initializeApp(firebaseConfig) : null)
  : getApp();

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

/* ==========================================================================
   STORAGE SERVICE (Firebase Storage - Lưu trữ Avatar & Tài liệu an toàn 100%)
   ========================================================================== */
export { storageService, isStorageConfigured, r2StorageService, isR2Configured } from './firebaseStorage';

/* ==========================================================================
   FIRESTORE DATABASE SERVICES (Vocabularies, Schedules, Profile, Tests)
   ========================================================================== */

export const profileService = {
  async getProfile(docId = 'main_profile') {
    if (!db) return null;
    try {
      const docRef = doc(db, 'profiles', docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (err) {
      console.warn('Firestore profileService.getProfile error:', err);
      return null;
    }
  },

  async saveProfile(profileData, docId = 'main_profile') {
    if (!db) return false;
    try {
      const docRef = doc(db, 'profiles', docId);
      await setDoc(docRef, { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore profileService.saveProfile error:', err);
      return false;
    }
  }
};

export const vocabService = {
  async getAll() {
    if (!db) return [];
    try {
      const colRef = collection(db, 'vocabularies');
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Firestore vocabService.getAll error:', err);
      return [];
    }
  },

  async add(vocab) {
    if (!db) return vocab;
    try {
      const id = vocab.id || `voc-${Date.now()}`;
      const docRef = doc(db, 'vocabularies', id);
      const data = { ...vocab, id, createdAt: vocab.createdAt || new Date().toISOString() };
      await setDoc(docRef, data, { merge: true });
      return data;
    } catch (err) {
      console.warn('Firestore vocabService.add error:', err);
      return vocab;
    }
  },

  async update(id, data) {
    if (!db || !id) return false;
    try {
      const docRef = doc(db, 'vocabularies', id);
      await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore vocabService.update error:', err);
      return false;
    }
  },

  async delete(id) {
    if (!db || !id) return false;
    try {
      const docRef = doc(db, 'vocabularies', id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore vocabService.delete error:', err);
      return false;
    }
  },

  async deleteAll() {
    if (!db) return false;
    try {
      const colRef = collection(db, 'vocabularies');
      const snapshot = await getDocs(colRef);
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      return true;
    } catch (err) {
      console.warn('Firestore vocabService.deleteAll error:', err);
      return false;
    }
  }
};

export const scheduleService = {
  async getAll() {
    if (!db) return [];
    try {
      const colRef = collection(db, 'schedules');
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Firestore scheduleService.getAll error:', err);
      return [];
    }
  },

  async add(item) {
    if (!db) return item;
    try {
      const id = item.id || `sch-${Date.now()}`;
      const docRef = doc(db, 'schedules', id);
      const data = { ...item, id, createdAt: item.createdAt || new Date().toISOString() };
      await setDoc(docRef, data, { merge: true });
      return data;
    } catch (err) {
      console.warn('Firestore scheduleService.add error:', err);
      return item;
    }
  },

  async update(id, data) {
    if (!db || !id) return false;
    try {
      const docRef = doc(db, 'schedules', id);
      await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
      return true;
    } catch (err) {
      console.warn('Firestore scheduleService.update error:', err);
      return false;
    }
  },

  async delete(id) {
    if (!db || !id) return false;
    try {
      const docRef = doc(db, 'schedules', id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore scheduleService.delete error:', err);
      return false;
    }
  }
};

export const testHistoryService = {
  async getAll() {
    if (!db) return [];
    try {
      const colRef = collection(db, 'test_history');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Firestore testHistoryService.getAll error:', err);
      return [];
    }
  },

  async add(testResult) {
    if (!db) return null;
    try {
      const colRef = collection(db, 'test_history');
      const docRef = await addDoc(colRef, {
        ...testResult,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...testResult };
    } catch (err) {
      console.warn('Firestore testHistoryService.add error:', err);
      return null;
    }
  }
};

export const reviewLogService = {
  async getCompressedLogs() {
    if (!db) return { dict: [], logs: [] };
    try {
      const docRef = doc(db, 'review_logs', 'compressed');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          dict: Array.isArray(data.dict) ? data.dict : [],
          logs: Array.isArray(data.logs) ? data.logs : []
        };
      }
      return { dict: [], logs: [] };
    } catch (err) {
      console.warn('Firestore reviewLogService.getCompressedLogs error:', err);
      return { dict: [], logs: [] };
    }
  },

  async saveCompressedLogs(compressedData) {
    if (!db || !compressedData) return false;
    try {
      const docRef = doc(db, 'review_logs', 'compressed');
      await setDoc(docRef, {
        dict: compressedData.dict || [],
        logs: compressedData.logs || [],
        totalCount: (compressedData.logs || []).length,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore reviewLogService.saveCompressedLogs error:', err);
      return false;
    }
  },

  async add(logEntry) {
    if (!db) return null;
    try {
      const colRef = collection(db, 'review_logs');
      const docRef = await addDoc(colRef, {
        ...logEntry,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...logEntry };
    } catch (err) {
      console.warn('Firestore reviewLogService.add error:', err);
      return null;
    }
  }
};

export default app;
