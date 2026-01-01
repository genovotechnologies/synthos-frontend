'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, Database, Trash2, FileText, AlertCircle, Check, X, 
  Loader2, ChevronLeft, ChevronRight, Search, MoreHorizontal,
  Pause, Play, RefreshCw
} from 'lucide-react';
import { datasetsApi, type Dataset, type UploadProgress } from '@/lib/api';

// Max file size: 500GB
const MAX_FILE_SIZE = 500 * 1024 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.csv', '.json', '.parquet', '.hdf5', '.h5', '.xlsx', '.xls'];

interface UploadState {
  status: 'idle' | 'checking-resume' | 'preparing' | 'uploading' | 'completing' | 'paused' | 'success' | 'error';
  progress: UploadProgress | null;
  error: string | null;
  canResume: boolean;
  resumeInfo?: { completedChunks: number; totalChunks: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '--:--';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

function validateFile(file: File): { valid: boolean; error?: string } {
  const extension = getFileExtension(file.name);
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${formatBytes(MAX_FILE_SIZE)}` 
    };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  
  return { valid: true };
}

function DatasetRow({ dataset, onDelete }: { dataset: Dataset; onDelete: (id: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusColors: Record<Dataset['status'], string> = {
    uploading: 'text-amber-400 bg-amber-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    ready: 'text-emerald-400 bg-emerald-400/10',
    error: 'text-red-400 bg-red-400/10',
  };

  const statusLabels: Record<Dataset['status'], string> = {
    uploading: 'Uploading',
    processing: 'Processing',
    ready: 'Ready',
    error: 'Error',
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800/50 last:border-0 group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{dataset.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {formatBytes(dataset.file_size)} • {formatDate(dataset.created_at)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[dataset.status]}`}>
          {statusLabels[dataset.status]}
        </span>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-36 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20">
                <button
                  onClick={() => {
                    onDelete(dataset.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: null,
    error: null,
    canResume: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for resumable upload when file is selected
  useEffect(() => {
    if (file) {
      checkResumableUpload(file);
    }
  }, [file]);

  const checkResumableUpload = async (selectedFile: File) => {
    setUploadState(prev => ({ ...prev, status: 'checking-resume' }));
    try {
      const resumeState = await datasetsApi.getResumableUpload(selectedFile.name, selectedFile.size);
      if (resumeState) {
        const totalChunks = Math.ceil(selectedFile.size / (100 * 1024 * 1024));
        setUploadState({
          status: 'idle',
          progress: null,
          error: null,
          canResume: true,
          resumeInfo: {
            completedChunks: resumeState.completedParts.length,
            totalChunks,
          },
        });
      } else {
        setUploadState({
          status: 'idle',
          progress: null,
          error: null,
          canResume: false,
        });
      }
    } catch {
      setUploadState({
        status: 'idle',
        progress: null,
        error: null,
        canResume: false,
      });
    }
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setUploadState({ 
        status: 'error', 
        progress: null, 
        error: validation.error || 'Invalid file',
        canResume: false,
      });
      return;
    }
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    abortControllerRef.current = new AbortController();
    
    try {
      setUploadState(prev => ({ 
        ...prev, 
        status: 'preparing', 
        error: null,
        progress: { phase: 'preparing', totalBytes: file.size, uploadedBytes: 0, percentage: 0 },
      }));

      const dataset = await datasetsApi.upload(
        file,
        (progress) => {
          setUploadState(prev => ({
            ...prev,
            status: progress.phase === 'completing' ? 'completing' : 'uploading',
            progress,
          }));
        },
        abortControllerRef.current.signal
      );

      setUploadState({
        status: 'success',
        progress: { phase: 'completing', totalBytes: file.size, uploadedBytes: file.size, percentage: 100 },
        error: null,
        canResume: false,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        setUploadState(prev => ({
          ...prev,
          status: 'paused',
          error: 'Upload paused. You can resume later.',
          canResume: true,
        }));
      } else {
        const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
        setUploadState(prev => ({
          ...prev,
          status: 'error',
          error: message,
        }));
      }
    }
  };

  const handlePause = () => {
    abortControllerRef.current?.abort();
  };

  const handleCancelResume = async () => {
    if (file) {
      await datasetsApi.cancelResumableUpload(file.name);
      setUploadState({
        status: 'idle',
        progress: null,
        error: null,
        canResume: false,
      });
    }
  };

  const isUploading = ['preparing', 'uploading', 'completing'].includes(uploadState.status);
  const canPause = uploadState.status === 'uploading' && uploadState.progress?.totalChunks && uploadState.progress.totalChunks > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload Dataset</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              CSV, JSON, Parquet, HDF5, Excel (max {formatBytes(MAX_FILE_SIZE)})
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              uploadState.status === 'error'
                ? 'border-red-500/50 bg-red-500/5'
                : uploadState.status === 'success'
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : file
                ? 'border-blue-500/50 bg-blue-500/5'
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/30'
            } ${isUploading ? 'pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              disabled={isUploading}
            />

            {uploadState.status === 'success' ? (
              <div className="text-emerald-400">
                <Check className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">Upload Complete!</p>
              </div>
            ) : uploadState.status === 'error' && !file ? (
              <div className="text-red-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium mb-1">Upload Failed</p>
                <p className="text-sm text-red-400/80">{uploadState.error}</p>
              </div>
            ) : uploadState.status === 'checking-resume' ? (
              <div className="text-zinc-400">
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" />
                <p className="font-medium text-white">Checking for resumable upload...</p>
              </div>
            ) : file ? (
              <div>
                <FileText className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-zinc-500 mt-1">{formatBytes(file.size)}</p>
                {uploadState.canResume && uploadState.resumeInfo && (
                  <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3 h-3" />
                      Resumable: {uploadState.resumeInfo.completedChunks}/{uploadState.resumeInfo.totalChunks} chunks uploaded
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-zinc-400">
                <Upload className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium text-white">Drop your file here</p>
                <p className="text-sm text-zinc-500 mt-1">or click to browse</p>
              </div>
            )}
          </div>

          {/* Progress */}
          {(isUploading || uploadState.status === 'paused') && uploadState.progress && (
            <div className="mt-5 space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-400">
                    {uploadState.status === 'paused' ? 'Paused' : 
                     uploadState.progress.phase === 'preparing' ? 'Preparing...' :
                     uploadState.progress.phase === 'completing' ? 'Finalizing...' :
                     uploadState.progress.totalChunks ? `Uploading chunk ${uploadState.progress.currentChunk || 0}/${uploadState.progress.totalChunks}` :
                     'Uploading...'}
                  </span>
                  <span className="text-zinc-500">{uploadState.progress.percentage}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      uploadState.status === 'paused' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${uploadState.progress.percentage}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {formatBytes(uploadState.progress.uploadedBytes)} / {formatBytes(uploadState.progress.totalBytes)}
                </span>
                {uploadState.progress.speed && uploadState.progress.speed > 0 && (
                  <span className="flex items-center gap-3">
                    <span>{formatSpeed(uploadState.progress.speed)}</span>
                    {uploadState.progress.remainingTime !== undefined && (
                      <span>{formatTime(uploadState.progress.remainingTime)} remaining</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {uploadState.status === 'error' && file && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {uploadState.error}
              </p>
            </div>
          )}

          {/* Paused message */}
          {uploadState.status === 'paused' && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                Upload paused. Click &quot;Resume&quot; to continue or &quot;Cancel&quot; to start over.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-zinc-800">
          <div>
            {uploadState.canResume && !isUploading && uploadState.status !== 'paused' && (
              <button
                onClick={handleCancelResume}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear saved progress
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {uploadState.status === 'paused' ? (
              <>
                <button
                  onClick={handleCancelResume}
                  className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                {canPause && (
                  <button
                    onClick={handlePause}
                    className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading || uploadState.status === 'success'}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadState.progress?.phase === 'preparing' ? 'Preparing...' :
                       uploadState.progress?.phase === 'completing' ? 'Finalizing...' :
                       'Uploading...'}
                    </>
                  ) : uploadState.canResume ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resume Upload
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DatasetsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['datasets', page, searchQuery],
    queryFn: () => datasetsApi.list(page, 10),
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      try {
        await datasetsApi.delete(id);
        queryClient.invalidateQueries({ queryKey: ['datasets'] });
      } catch {
        alert('Failed to delete dataset. Please try again.');
      }
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['datasets'] });
  };

  const datasets = data?.datasets || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.total_pages || 1;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Datasets</h1>
          <p className="text-zinc-500 mt-1">Manage your uploaded datasets</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Dataset
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search datasets..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load datasets</p>
            <p className="text-sm text-red-400/80 mt-0.5">Please try refreshing the page.</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No datasets yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">
              Upload your first dataset to start validating and analyzing your data.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Dataset
            </button>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-zinc-800/50">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <span>Dataset</span>
                <span className="mr-12">Status</span>
              </div>
            </div>
            <div className="px-5">
              {datasets.map((dataset) => (
                <DatasetRow 
                  key={dataset.id} 
                  dataset={dataset} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > pagination.per_page && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-zinc-500">
            Showing {((page - 1) * pagination.per_page) + 1} to {Math.min(page * pagination.per_page, pagination.total)} of {pagination.total} datasets
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-zinc-400 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
