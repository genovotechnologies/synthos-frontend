import axios from 'axios';
import apiClient from './client';
import type { Dataset, DatasetListResponse, UploadUrlResponse, CompleteUploadRequest } from './types';

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

  // Step 1: Get signed upload URL
  getUploadUrl: async (fileName: string, fileSize: number): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<UploadUrlResponse>('/datasets/upload', {
      file_name: fileName,
      file_size: fileSize,
    });
    return response.data;
  },

  // Step 2: Upload file directly to S3
  uploadToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const response = await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    // Return the ETag from response headers
    return response.headers.etag?.replace(/"/g, '') || '';
  },

  // Step 3: Complete upload notification
  completeUpload: async (datasetId: string, data: CompleteUploadRequest): Promise<Dataset> => {
    const response = await apiClient.post<Dataset>(`/datasets/${datasetId}/complete`, data);
    return response.data;
  },
};
