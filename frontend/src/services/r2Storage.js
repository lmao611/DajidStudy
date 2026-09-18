import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const accountId = import.meta.env.VITE_R2_ACCOUNT_ID || '';
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '';
const bucketName = import.meta.env.VITE_R2_BUCKET_NAME || '';
const publicUrl = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');

export const isR2Configured = Boolean(
  accountId &&
  accessKeyId &&
  secretAccessKey &&
  bucketName &&
  publicUrl &&
  !accessKeyId.includes('your_')
);

// Khởi tạo S3 Client cho Cloudflare R2
export const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

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
 * Kiểm tra xem file đã tồn tại trên Cloudflare R2 chưa
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
export const checkObjectExists = async (key) => {
  if (!r2Client) return false;
  try {
    const headCmd = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await r2Client.send(headCmd);
    return true;
  } catch (err) {
    // Nếu lỗi 404 / NotFound tức là file chưa tồn tại trên R2
    return false;
  }
};

export const r2StorageService = {
  /**
   * Upload riêng cho avatar người dùng có kiểm tra trùng lặp thông minh
   * - Nếu file đã có trên R2 -> tái sử dụng link, không tải lại
   * - Nếu chưa có -> tải lên R2 và trả về URL
   * @param {File|Blob} file 
   * @param {string} currentAvatarUrl Link avatar hiện tại của người dùng
   * @returns {Promise<{url: string, key: string, isDuplicate: boolean, message: string}>}
   */
  async uploadAvatar(file, currentAvatarUrl = null) {
    if (!r2Client) {
      throw new Error('Cloudflare R2 chưa được cấu hình đầy đủ trong file .env.local.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const contentHash = await calculateFileHash(arrayBuffer);
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
    const key = `avatars/avatar_${contentHash}.${ext}`;
    const downloadUrl = `${publicUrl}/${key}`;

    // 1. Kiểm tra nếu avatar hiện tại của user đã trùng với link này
    if (currentAvatarUrl === downloadUrl) {
      return {
        url: downloadUrl,
        key,
        isDuplicate: true,
        isCurrent: true,
        message: 'Ảnh này đã là ảnh đại diện hiện tại của bạn!'
      };
    }

    // 2. Kiểm tra xem trên R2 đã có ảnh mang mã băm (hash) này chưa
    const exists = await checkObjectExists(key);
    if (exists) {
      console.log(`[R2 Storage] Phát hiện avatar đã có sẵn trên Cloudflare R2 (${key}). Tái sử dụng link, tránh tải trùng lặp.`);
      return {
        url: downloadUrl,
        key,
        isDuplicate: true,
        isCurrent: false,
        message: 'Ảnh đã có sẵn trên Cloud, áp dụng ngay lập tức!'
      };
    }

    // 3. Nếu chưa có trên R2, tải file mới lên
    const fileBytes = new Uint8Array(arrayBuffer);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBytes,
      ContentType: file.type || 'image/jpeg',
    });

    await r2Client.send(command);

    console.log(`[R2 Storage] Đã tải avatar mới lên Cloudflare R2: ${key}`);
    return {
      url: downloadUrl,
      key,
      isDuplicate: false,
      isCurrent: false,
      message: 'Tải ảnh mới lên Cloudflare R2 thành công!'
    };
  },

  /**
   * Upload bất kỳ file nào lên Cloudflare R2 (có kiểm tra trùng lặp)
   * @param {File|Blob} file 
   * @param {string} folder 'avatars' | 'documents' | 'audio'
   * @param {string} customFileName 
   * @returns {Promise<{url: string, key: string, name: string, isDuplicate: boolean}>}
   */
  async uploadFile(file, folder = 'documents', customFileName = null) {
    if (!r2Client) {
      throw new Error('Cloudflare R2 chưa được cấu hình đầy đủ trong file .env.local.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const contentHash = await calculateFileHash(arrayBuffer);
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'bin';
    const fileName = customFileName || `${folder}_${contentHash}.${ext}`;
    const key = `${folder}/${fileName}`;
    const downloadUrl = `${publicUrl}/${key}`;

    // Kiểm tra xem file đã tồn tại trên Cloudflare R2 chưa
    const exists = await checkObjectExists(key);
    if (exists) {
      console.log(`[R2 Storage] File đã tồn tại trên Cloudflare R2 (${key}). Tái sử dụng.`);
      return {
        url: downloadUrl,
        key,
        name: file.name || fileName,
        isDuplicate: true,
      };
    }

    const fileBytes = new Uint8Array(arrayBuffer);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBytes,
      ContentType: file.type || 'application/octet-stream',
    });

    await r2Client.send(command);

    return {
      url: downloadUrl,
      key,
      name: file.name || fileName,
      isDuplicate: false,
    };
  },

  /**
   * Xóa file khỏi R2 nếu cần
   * @param {string} key 
   */
  async deleteFile(key) {
    if (!r2Client) return false;
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await r2Client.send(command);
      return true;
    } catch (err) {
      console.error('Lỗi khi xóa file trên R2:', err);
      return false;
    }
  }
};

export default r2StorageService;
