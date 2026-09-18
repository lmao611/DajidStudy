/**
 * Storage Service - Redirected to Firebase Storage
 * Đảm bảo an toàn 100%, không để lộ Secret Key của Cloudflare R2 phía Client-side.
 */
export * from './firebaseStorage';
import { storageService } from './firebaseStorage';
export default storageService;
