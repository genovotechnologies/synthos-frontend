import axios, { AxiosProgressEvent } from 'axios';
import apiClient from './client';
import type { Dataset, DatasetListResponse } from './types';

// Chunk size: 100MB (matches Data Service streaming chunks)
const CHUNK_SIZE = 100 * 1024 * 1024;
// Threshold for multipart upload: 100MB (use multipart for files larger than this)
const MULTIPART_THRESHOLD = 100 * 1024 * 1024;
// Maximum concurrent chunk uploads
const MAX_CONCURRENT_UPLOADS = 3;

// Types for multipart upload
export interface InitiateMultipartResponse {
  upload_id: string;
  dataset_id: string;
  key: string;
}

export interface PartUploadUrl {
  part_number: number;
  upload_url: string;
}

export interface GetPartUrlsResponse {
  parts: PartUploadUrl[];
}

export interface CompletedPart {
  part_number: number;
  etag: string;
}

export interface CompleteMultipartRequest {
  upload_id: string;
  parts: CompletedPart[];
}

export interface UploadProgress {
  phase: 'preparing' | 'uploading' | 'completing';
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  currentChunk?: number;
  totalChunks?: number;
  speed?: number; // bytes per second
  remainingTime?: number; // seconds
}

export interface UploadUrlResponse {
  upload_url: string;
  dataset_id: string;
}

export interface CompleteUploadRequest {
  etag: string;
}

// Upload state for resume capability
interface UploadState {
  datasetId: string;
  uploadId: string;
  key: string;
  fileName: string;
  fileSize: number;
  completedParts: CompletedPart[];
  lastModified: number;
}

// IndexedDB for storing upload state (for resume capability)
const DB_NAME = 'synthos_uploads';
const STORE_NAME = 'upload_states';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileName' });
      }
    };
  });
}

async function saveUploadState(state: UploadState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(state);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
  });
}

async function getUploadState(fileName: string): Promise<UploadState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(fileName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
    tx.oncomplete = () => db.close();
  });
}

async function deleteUploadState(fileName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(fileName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
  });
}

// Helper to upload a single chunk with retry
async function uploadChunkWithRetry(
  url: string,
  chunk: Blob,
  contentType: string,
  maxRetries = 3,
  onProgress?: (loaded: number) => void
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.put(url, chunk, {
        headers: {
          'Content-Type': contentType,
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.loaded) {
            onProgress(progressEvent.loaded);
          }
        },
        timeout: 300000, // 5 minute timeout per chunk
      });
      
      const etag = response.headers.etag?.replace(/"/g, '') || '';
      if (!etag) {
        throw new Error('No ETag received from S3');
      }
      return etag;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');
      
      // Don't retry on 4xx errors (client errors)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Upload failed after retries');
}

export const datasetsApi = {
  list: async (page = 1, perPage = 10): Promise<DatasetListResponse> => {
    const response = await apiClient.get<DatasetListResponse>('/datasets', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  get: async (id: string): Promise<Dataset> => {
    const response = await apiClient.get<Dataset>(`/datasets/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/datasets/${id}`);
  },

  // ============ Simple Upload (for files < 100MB) ============
  
  getUploadUrl: async (fileName: string, fileSize: number): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<UploadUrlResponse>('/datasets/upload', {
      file_name: fileName,
      file_size: fileSize,
    });
    return response.data;
  },

  uploadToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const response = await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.headers.etag?.replace(/"/g, '') || '';
  },

  completeUpload: async (datasetId: string, data: CompleteUploadRequest): Promise<Dataset> => {
    const response = await apiClient.post<Dataset>(`/datasets/${datasetId}/complete`, data);
    return response.data;
  },

  // ============ Multipart Upload (for files >= 100MB) ============

  initiateMultipartUpload: async (fileName: string, fileSize: number, contentType: string): Promise<InitiateMultipartResponse> => {
    const response = await apiClient.post<InitiateMultipartResponse>('/datasets/upload/multipart/initiate', {
      file_name: fileName,
      file_size: fileSize,
      content_type: contentType,
    });
    return response.data;
  },

  getPartUploadUrls: async (datasetId: string, uploadId: string, partNumbers: number[]): Promise<GetPartUrlsResponse> => {
    const response = await apiClient.post<GetPartUrlsResponse>(`/datasets/${datasetId}/upload/parts`, {
      upload_id: uploadId,
      part_numbers: partNumbers,
    });
    return response.data;
  },

  completeMultipartUpload: async (datasetId: string, data: CompleteMultipartRequest): Promise<Dataset> => {
    const response = await apiClient.post<Dataset>(`/datasets/${datasetId}/upload/multipart/complete`, data);
    return response.data;
  },

  abortMultipartUpload: async (datasetId: string, uploadId: string): Promise<void> => {
    await apiClient.post(`/datasets/${datasetId}/upload/multipart/abort`, {
      upload_id: uploadId,
    });
  },

  // ============ Smart Upload (auto-selects simple or multipart) ============

  upload: async (
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<Dataset> => {
    const fileSize = file.size;
    const fileName = file.name;
    const contentType = file.type || 'application/octet-stream';

    // Check for existing upload state (resume capability)
    let existingState: UploadState | null = null;
    try {
      existingState = await getUploadState(fileName);
      // Validate that the file hasn't changed
      if (existingState && existingState.fileSize !== fileSize) {
        await deleteUploadState(fileName);
        existingState = null;
      }
    } catch {
      // IndexedDB not available, proceed without resume
    }

    // Use simple upload for small files
    if (fileSize < MULTIPART_THRESHOLD && !existingState) {
      onProgress?.({ phase: 'preparing', totalBytes: fileSize, uploadedBytes: 0, percentage: 0 });
      
      const { upload_url, dataset_id } = await datasetsApi.getUploadUrl(fileName, fileSize);
      
      onProgress?.({ phase: 'uploading', totalBytes: fileSize, uploadedBytes: 0, percentage: 0 });
      
      const startTime = Date.now();
      let lastLoaded = 0;
      
      const etag = await datasetsApi.uploadToS3(upload_url, file, (progress) => {
        const uploadedBytes = Math.round((progress / 100) * fileSize);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
        const remaining = speed > 0 ? (fileSize - uploadedBytes) / speed : 0;
        
        onProgress?.({
          phase: 'uploading',
          totalBytes: fileSize,
          uploadedBytes,
          percentage: progress,
          speed,
          remainingTime: remaining,
        });
        lastLoaded = uploadedBytes;
      });
      
      onProgress?.({ phase: 'completing', totalBytes: fileSize, uploadedBytes: fileSize, percentage: 100 });
      
      return await datasetsApi.completeUpload(dataset_id, { etag });
    }

    // Multipart upload for large files
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    let datasetId: string;
    let uploadId: string;
    let key: string;
    let completedParts: CompletedPart[] = [];

    // Resume or start new upload
    if (existingState) {
      datasetId = existingState.datasetId;
      uploadId = existingState.uploadId;
      key = existingState.key;
      completedParts = existingState.completedParts;
    } else {
      onProgress?.({ phase: 'preparing', totalBytes: fileSize, uploadedBytes: 0, percentage: 0 });
      
      const initResponse = await datasetsApi.initiateMultipartUpload(fileName, fileSize, contentType);
      datasetId = initResponse.dataset_id;
      uploadId = initResponse.upload_id;
      key = initResponse.key;
    }

    // Track progress
    const chunkProgress: Map<number, number> = new Map();
    completedParts.forEach(p => chunkProgress.set(p.part_number, CHUNK_SIZE));
    
    const startTime = Date.now();
    let lastProgressUpdate = Date.now();

    const updateProgress = () => {
      let uploadedBytes = 0;
      chunkProgress.forEach(bytes => uploadedBytes += bytes);
      uploadedBytes = Math.min(uploadedBytes, fileSize);
      
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
      const remaining = speed > 0 ? (fileSize - uploadedBytes) / speed : 0;
      
      onProgress?.({
        phase: 'uploading',
        totalBytes: fileSize,
        uploadedBytes,
        percentage: Math.round((uploadedBytes / fileSize) * 100),
        currentChunk: completedParts.length,
        totalChunks,
        speed,
        remainingTime: remaining,
      });
    };

    // Get remaining parts to upload
    const completedPartNumbers = new Set(completedParts.map(p => p.part_number));
    const remainingParts: number[] = [];
    for (let i = 1; i <= totalChunks; i++) {
      if (!completedPartNumbers.has(i)) {
        remainingParts.push(i);
      }
    }

    // Upload chunks in parallel batches
    try {
      for (let i = 0; i < remainingParts.length; i += MAX_CONCURRENT_UPLOADS) {
        if (abortSignal?.aborted) {
          throw new Error('Upload cancelled');
        }

        const batch = remainingParts.slice(i, i + MAX_CONCURRENT_UPLOADS);
        
        // Get pre-signed URLs for this batch
        const { parts: partUrls } = await datasetsApi.getPartUploadUrls(datasetId, uploadId, batch);
        
        // Upload batch in parallel
        const uploadPromises = partUrls.map(async ({ part_number, upload_url }) => {
          const start = (part_number - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, fileSize);
          const chunk = file.slice(start, end);
          
          const etag = await uploadChunkWithRetry(
            upload_url,
            chunk,
            contentType,
            3,
            (loaded) => {
              chunkProgress.set(part_number, loaded);
              // Throttle progress updates to every 100ms
              if (Date.now() - lastProgressUpdate > 100) {
                updateProgress();
                lastProgressUpdate = Date.now();
              }
            }
          );
          
          chunkProgress.set(part_number, end - start);
          completedParts.push({ part_number, etag });
          
          // Save state for resume capability
          try {
            await saveUploadState({
              datasetId,
              uploadId,
              key,
              fileName,
              fileSize,
              completedParts: [...completedParts],
              lastModified: Date.now(),
            });
          } catch {
            // Continue even if state save fails
          }
          
          updateProgress();
        });
        
        await Promise.all(uploadPromises);
      }

      // Complete multipart upload
      onProgress?.({ phase: 'completing', totalBytes: fileSize, uploadedBytes: fileSize, percentage: 100 });
      
      // Sort parts by part number (required by S3)
      completedParts.sort((a, b) => a.part_number - b.part_number);
      
      const dataset = await datasetsApi.completeMultipartUpload(datasetId, {
        upload_id: uploadId,
        parts: completedParts,
      });

      // Clean up saved state
      try {
        await deleteUploadState(fileName);
      } catch {
        // Ignore cleanup errors
      }

      return dataset;
      
    } catch (error) {
      // Don't abort the multipart upload on error - allow resume
      // Only delete state if explicitly cancelled
      if (abortSignal?.aborted) {
        try {
          await datasetsApi.abortMultipartUpload(datasetId, uploadId);
          await deleteUploadState(fileName);
        } catch {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  },

  // Check if there's a resumable upload for a file
  getResumableUpload: async (fileName: string, fileSize: number): Promise<UploadState | null> => {
    try {
      const state = await getUploadState(fileName);
      if (state && state.fileSize === fileSize) {
        return state;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Cancel and clean up a resumable upload
  cancelResumableUpload: async (fileName: string): Promise<void> => {
    try {
      const state = await getUploadState(fileName);
      if (state) {
        await datasetsApi.abortMultipartUpload(state.datasetId, state.uploadId);
        await deleteUploadState(fileName);
      }
    } catch {
      // Ignore errors
    }
  },
};
