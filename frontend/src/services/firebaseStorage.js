import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  getMetadata 
} from 'firebase/storage';
import app, { isFirebaseConfigured } from './firebase';

export const storage = app ? getStorage(app) : null;
export const isStorageConfigured = Boolean(storage && isFirebaseConfigured);

/**
 * Tính mã băm SHA-256 của file để nhận diện trùng lặp nội dung
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {Promise<string>} Chuỗi hash 16 ký tự
 */
export const calculateFileHash = async (arrayBuffer) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

/**
 * Kiểm tra xem file đã tồn tại trên Firebase Storage chưa
 * @param {string} path 
 * @returns {Promise<boolean>}
 */
export const checkObjectExists = async (path) => {
  if (!storage) return false;
  try {
    const fileRef = ref(storage, path);
    await getMetadata(fileRef);
    return true;
  } catch (err) {
    return false;
  }
};

export const storageService = {
  /**
   * Upload riêng cho avatar người dùng có kiểm tra trùng lặp thông minh
   * @param {File|Blob} file 
   * @param {string} currentAvatarUrl Link avatar hiện tại của người dùng
   * @returns {Promise<{url: string, key: string, isDuplicate: boolean, isCurrent: boolean, message: string}>}
   */
  async uploadAvatar(file, currentAvatarUrl = null) {
    if (!storage) {
      throw new Error('Firebase Storage chưa được cấu hình hoặc khởi tạo.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const contentHash = await calculateFileHash(arrayBuffer);
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
    const path = `avatars/avatar_${contentHash}.${ext}`;
    const fileRef = ref(storage, path);

    // 1. Kiểm tra nếu file đã có trên Firebase Storage
    const exists = await checkObjectExists(path);
    if (exists) {
      const downloadUrl = await getDownloadURL(fileRef);
      const isCurrent = currentAvatarUrl === downloadUrl;
      return {
        url: downloadUrl,
        key: path,
        isDuplicate: true,
        isCurrent,
        message: isCurrent 
          ? 'Ảnh này đã là ảnh đại diện hiện tại của bạn!' 
          : 'Ảnh đã có sẵn trên Firebase Storage, áp dụng ngay lập tức!'
      };
    }

    // 2. Upload file mới an toàn không lộ secret key
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type || 'image/jpeg'
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      url: downloadUrl,
      key: path,
      isDuplicate: false,
      isCurrent: false,
      message: 'Tải ảnh đại diện lên Firebase Storage thành công!'
    };
  },

  /**
   * Upload bất kỳ file nào lên Firebase Storage (có kiểm tra trùng lặp)
   * @param {File|Blob} file 
   * @param {string} folder 'avatars' | 'daily' | 'documents'
   * @param {string} customFileName 
   * @returns {Promise<{url: string, key: string, name: string, isDuplicate: boolean}>}
   */
  async uploadFile(file, folder = 'documents', customFileName = null) {
    if (!storage) {
      throw new Error('Firebase Storage chưa được cấu hình.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const contentHash = await calculateFileHash(arrayBuffer);
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'bin';
    const fileName = customFileName || `${folder}_${contentHash}.${ext}`;
    const path = `${folder}/${fileName}`;
    const fileRef = ref(storage, path);

    const exists = await checkObjectExists(path);
    if (exists) {
      const downloadUrl = await getDownloadURL(fileRef);
      return {
        url: downloadUrl,
        key: path,
        name: file.name || fileName,
        isDuplicate: true
      };
    }

    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type || 'application/octet-stream'
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      url: downloadUrl,
      key: path,
      name: file.name || fileName,
      isDuplicate: false
    };
  },

  /**
   * Xóa file khỏi Firebase Storage nếu cần
   * @param {string} path 
   */
  async deleteFile(path) {
    if (!storage || !path) return false;
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      return true;
    } catch (err) {
      console.error('Lỗi khi xóa file trên Firebase Storage:', err);
      return false;
    }
  }
};

// Aliases cho tương thích ngược hoàn toàn
export const r2StorageService = storageService;
export const isR2Configured = isStorageConfigured;

export default storageService;
