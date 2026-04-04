import axios, { AxiosProgressEvent } from 'axios';
import apiClient from './client';
import type { Dataset, DatasetListResponse } from './types';

// Chunk size: 100MB (matches Data Service streaming chunks)
const CHUNK_SIZE = 100 * 1024 * 1024;
// Threshold for multipart upload: 500GB (disabled - backend doesn't support multipart yet)
// All uploads use simple signed URL upload directly to GCS
const MULTIPART_THRESHOLD = 500 * 1024 * 1024 * 1024;
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
  upload_method?: 'resumable' | 'direct';
  chunk_size?: number;
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
    const data = response.data;
    // Map backend field names to frontend types
    // Backend sends dataset_id (json tag) but frontend Dataset type expects id
    // Backend sends filename but frontend expects name
    if (data.datasets) {
      data.datasets = data.datasets.map((d: any) => ({
        ...d,
        id: d.id || d.dataset_id,
        name: d.name || d.filename || '',
        file_name: d.file_name || d.filename || '',
        row_count: d.row_count ?? 0,
        column_count: d.column_count ?? 0,
      }));
    }
    // Map backend pagination (page_size/total_count) to frontend (per_page/total)
    if (data.pagination) {
      const p = data.pagination as any;
      data.pagination = {
        page: p.page,
        per_page: p.per_page || p.page_size || perPage,
        total: p.total ?? p.total_count ?? 0,
        total_pages: p.total_pages,
      };
    }
    return data;
  },

  get: async (id: string): Promise<Dataset> => {
    const response = await apiClient.get<Dataset>(`/datasets/${id}`);
    const d = response.data as any;
    return {
      ...d,
      id: d.id || d.dataset_id,
      name: d.name || d.filename || '',
      file_name: d.file_name || d.filename || '',
      row_count: d.row_count ?? 0,
      column_count: d.column_count ?? 0,
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/datasets/${id}`);
  },

  // ============ Simple Upload (for files < 100MB) ============
  
  getUploadUrl: async (fileName: string, fileSize: number): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<UploadUrlResponse>('/datasets/upload', {
      filename: fileName,
      file_size: fileSize,
      file_type: fileName.split('.').pop() || 'csv',
    });
    return response.data;
  },

  uploadToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void,
    uploadMethod: 'resumable' | 'direct' = 'direct',
    chunkSize: number = 8 * 1024 * 1024
  ): Promise<string> => {
    const totalSize = file.size;
    const CHUNK_SIZE = chunkSize;

    // For small files (<chunkSize) or direct upload method, do a single PUT
    if (totalSize <= CHUNK_SIZE || uploadMethod === 'direct') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.timeout = 0; // No timeout for large uploads

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded * 100) / event.total);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 400) {
            const etag = xhr.getResponseHeader('etag')?.replace(/"/g, '') || 'uploaded';
            resolve(etag);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.send(file);
      });
    }

    // For large files with resumable upload, upload in chunks using Content-Range
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
    let uploadedBytes = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);
      const contentRange = `bytes ${start}-${end - 1}/${totalSize}`;

      // Retry each chunk up to 3 times
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Range': contentRange,
              'Content-Length': String(end - start),
            },
            body: chunk,
          });

          // GCS returns 308 for intermediate chunks, 200/201 for the last one
          if (response.status === 308 || response.status === 200 || response.status === 201) {
            uploadedBytes = end;
            if (onProgress) {
              onProgress(Math.round((uploadedBytes * 100) / totalSize));
            }
            lastError = null;
            break; // Success, move to next chunk
          } else {
            const body = await response.text();
            throw new Error(`Chunk upload failed (${response.status}): ${body}`);
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          if (attempt < 2) {
            // Exponential backoff
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          }
        }
      }

      if (lastError) {
        throw lastError;
      }
    }

    return 'uploaded';
  },

  completeUpload: async (datasetId: string, data: CompleteUploadRequest): Promise<Dataset> => {
    const response = await apiClient.post<Dataset>(`/datasets/${datasetId}/complete`, data);
    return response.data;
  },

  // ============ Multipart Upload (for files >= 100MB) ============

  initiateMultipartUpload: async (fileName: string, fileSize: number, contentType: string): Promise<InitiateMultipartResponse> => {
    const response = await apiClient.post<InitiateMultipartResponse>('/datasets/upload/multipart/initiate', {
      filename: fileName,
      file_size: fileSize,
      file_type: contentType,
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
      
      const uploadResponse = await datasetsApi.getUploadUrl(fileName, fileSize);
      const { upload_url, dataset_id } = uploadResponse;
      const uploadMethod = uploadResponse.upload_method || 'direct';
      const chunkSizeFromServer = uploadResponse.chunk_size || 8 * 1024 * 1024;

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
      }, uploadMethod, chunkSizeFromServer);

      onProgress?.({ phase: 'completing', totalBytes: fileSize, uploadedBytes: fileSize, percentage: 100 });

      return await datasetsApi.completeUpload(dataset_id, { etag: etag || 'uploaded' });
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
