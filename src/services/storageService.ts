/**
 * Cloud Object Storage Service
 * Simulates enterprise Cloud Object Storage (e.g. Firebase Storage, AWS S3)
 * Storing large binary payloads outside the relational/document database
 * using structured storage paths: assignments/{courseId}/{assignmentId}/{studentId}/{submissionId}_{filename}
 */

import { StorageObject } from '../types';

const DB_NAME = 'CloudAssignmentStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'object_storage_bucket';

class CloudObjectStorageService {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Validate file against policies (size & MIME/extension)
   */
  validateFile(
    file: File,
    allowedTypes: string[] = ['application/pdf', '.pdf', '.docx', '.jpg', '.png'],
    maxSizeMB: number = 20
  ): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Please select a file before submitting.' };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed limit (${maxSizeMB} MB). Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      };
    }

    const fileNameLower = file.name.toLowerCase();
    const isExtensionAllowed = allowedTypes.some((ext) => {
      const cleanExt = ext.toLowerCase().trim();
      if (cleanExt.startsWith('.')) {
        return fileNameLower.endsWith(cleanExt);
      }
      return file.type === cleanExt || fileNameLower.endsWith(`.${cleanExt}`);
    });

    // Also support default recognized document types
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
      'image/webp'
    ];

    const hasAllowedMime = validMimes.includes(file.type) || isExtensionAllowed;

    if (!hasAllowedMime && !isExtensionAllowed) {
      return {
        valid: false,
        error: `File type "${file.type || file.name.split('.').pop()}" is not supported. Allowed formats: ${allowedTypes.join(', ')}.`
      };
    }

    return { valid: true };
  }

  /**
   * Upload binary object to Cloud Object Storage path
   * Simulates network upload latency and progress reporting
   */
  async uploadFile(
    file: File,
    metadata: {
      courseId: string;
      assignmentId: string;
      studentId: string;
      submissionId: string;
      version: number;
    },
    onProgress?: (percentage: number) => void
  ): Promise<{ path: string; downloadUrl: string; size: number }> {
    // Generate canonical Cloud Storage bucket path
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `assignments/${metadata.courseId}/${metadata.assignmentId}/${metadata.studentId}/v${metadata.version}_${metadata.submissionId}_${sanitizedFileName}`;

    // Read as Base64 Data URL for persistent storage & instant in-browser viewing
    const dataUrl = await this.readFileAsDataURL(file, onProgress);

    const storageObject: StorageObject = {
      path: storagePath,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      dataUrl,
      uploadedAt: new Date().toISOString(),
      metadata: {
        studentId: metadata.studentId,
        courseId: metadata.courseId,
        assignmentId: metadata.assignmentId,
        version: metadata.version
      }
    };

    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(storageObject);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return {
      path: storagePath,
      downloadUrl: dataUrl,
      size: file.size
    };
  }

  /**
   * Retrieve file from Cloud Object Storage
   */
  async getFile(storagePath: string): Promise<StorageObject | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(storagePath);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * List all objects in storage bucket (for Cloud Storage Inspector)
   */
  async listAllObjects(): Promise<StorageObject[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Download file to user computer
   */
  downloadObject(fileDataUrl: string, fileName: string) {
    const link = document.createElement('a');
    link.href = fileDataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private readFileAsDataURL(file: File, onProgress?: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (onProgress) {
        onProgress(15);
      }

      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const pct = Math.round((e.loaded / e.total) * 90);
          onProgress(pct);
        }
      };

      reader.onload = () => {
        if (onProgress) onProgress(100);
        resolve(reader.result as string);
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

export const cloudStorage = new CloudObjectStorageService();
