'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetsApi, type Dataset } from '@/lib/api';
import { 
  Upload, 
  Database, 
  MoreVertical, 
  Trash2, 
  Eye,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

type UploadState = 'idle' | 'getting-url' | 'uploading' | 'completing' | 'done' | 'error';

interface UploadProgress {
  state: UploadState;
  progress: number;
  error?: string;
}

function DatasetRow({ dataset, onDelete }: { dataset: Dataset; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusConfig = {
    uploading: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    processing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    ready: { bg: 'bg-mint/20', text: 'text-mint', dot: 'bg-mint' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  };

  const status = statusConfig[dataset.status];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all duration-200 group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="p-3 rounded-xl bg-violet/20">
          <FileSpreadsheet size={20} className="text-violet" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white truncate group-hover:text-violet transition-colors">
            {dataset.name}
          </p>
          <p className="text-sm text-white/50 truncate">{dataset.file_name}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-white/50">Rows</p>
          <p className="font-medium text-white">{dataset.row_count?.toLocaleString() || '-'}</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-white/50">Size</p>
          <p className="font-medium text-white">{formatFileSize(dataset.file_size)}</p>
        </div>
        <div className="text-right hidden lg:block">
          <p className="text-sm text-white/50">Created</p>
          <p className="font-medium text-white">{formatDate(dataset.created_at)}</p>
        </div>
        
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full capitalize",
          status.bg, status.text
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
          {dataset.status}
        </span>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-20 glass-dark rounded-xl py-2 min-w-[160px] shadow-xl">
                <Link
                  href={`/dashboard/datasets/${dataset.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Eye size={16} />
                  View details
                </Link>
                <button
                  onClick={() => {
                    onDelete(dataset.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-colors"
                >
                  <Trash2 size={16} />
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

function UploadModal({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    state: 'idle',
    progress: 0,
  });

  const handleUpload = useCallback(async () => {
    if (!file) return;

    try {
      // Step 1: Get signed URL
      setUploadProgress({ state: 'getting-url', progress: 10 });
      const { upload_url, dataset_id } = await datasetsApi.getUploadUrl(
        file.name,
        file.size
      );

      // Step 2: Upload to S3
      setUploadProgress({ state: 'uploading', progress: 20 });
      const etag = await datasetsApi.uploadToS3(upload_url, file, (progress) => {
        setUploadProgress({ state: 'uploading', progress: 20 + progress * 0.7 });
      });

      // Step 3: Complete upload
      setUploadProgress({ state: 'completing', progress: 95 });
      await datasetsApi.completeUpload(dataset_id, { etag });

      setUploadProgress({ state: 'done', progress: 100 });
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1000);
    } catch (error) {
      setUploadProgress({
        state: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }, [file, onSuccess]);

  const handleClose = () => {
    setFile(null);
    setUploadProgress({ state: 'idle', progress: 0 });
    onClose();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.json') || droppedFile.name.endsWith('.parquet'))) {
      setFile(droppedFile);
    }
  }, []);

  if (!isOpen) return null;

  const isUploading = ['getting-url', 'uploading', 'completing'].includes(uploadProgress.state);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative glass-dark rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Upload Dataset</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>

        {uploadProgress.state === 'error' && (
          <div className="mb-4 p-4 bg-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            {uploadProgress.error}
          </div>
        )}

        {!isUploading && uploadProgress.state !== 'done' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300",
              file 
                ? "border-violet bg-violet/10" 
                : "border-white/20 hover:border-violet/50 hover:bg-white/5"
            )}
          >
            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet/20 flex items-center justify-center">
                  <FileSpreadsheet size={32} className="text-violet" />
                </div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-white/50">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
                  <Upload size={32} className="text-white/40" />
                </div>
                <p className="font-medium text-white">Drop your file here</p>
                <p className="text-sm text-white/50">
                  or click to browse
                </p>
                <p className="text-xs text-white/30">
                  Supports CSV, JSON, Parquet (max 500MB)
                </p>
              </div>
            )}
            <input
              type="file"
              accept=".csv,.json,.parquet"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}

        {(isUploading || uploadProgress.state === 'done') && (
          <div className="space-y-4 p-6 rounded-2xl bg-white/5">
            <div className="flex items-center gap-4">
              {uploadProgress.state === 'done' ? (
                <div className="p-3 rounded-xl bg-mint/20">
                  <CheckCircle className="text-mint" size={24} />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-violet/20">
                  <Loader2 className="animate-spin text-violet" size={24} />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-white">
                  {uploadProgress.state === 'getting-url' && 'Preparing upload...'}
                  {uploadProgress.state === 'uploading' && 'Uploading to storage...'}
                  {uploadProgress.state === 'completing' && 'Finalizing...'}
                  {uploadProgress.state === 'done' && 'Upload complete!'}
                </p>
                <p className="text-sm text-white/50">{file?.name}</p>
              </div>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet to-mint rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading || uploadProgress.state === 'done'}
            className={cn(
              "px-5 py-2.5 rounded-xl font-medium transition-all duration-300",
              "bg-gradient-to-r from-violet to-violet/80 text-white",
              "hover:shadow-lg hover:shadow-violet/30",
              "active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            )}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DatasetsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['datasets', page],
    queryFn: () => datasetsApi.list(page, 10),
  });

  const deleteMutation = useMutation({
    mutationFn: datasetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this dataset?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['datasets'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Datasets</h1>
          <p className="text-white/50">
            Manage your training data files
          </p>
        </div>
        {/* Neumorphic Upload Button */}
        <button
          onClick={() => setUploadModalOpen(true)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
            "bg-gradient-to-r from-violet to-violet/80 text-white",
            "shadow-lg shadow-violet/30",
            "hover:shadow-xl hover:shadow-violet/40 hover:scale-[1.02]",
            "active:scale-95 active:shadow-inner"
          )}
        >
          <Upload size={18} />
          Upload Dataset
        </button>
      </div>

      <div className="glass-dark rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-violet" size={32} />
            <p className="text-white/50">Loading datasets...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">
            Failed to load datasets
          </div>
        ) : !data?.datasets?.length ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <Database size={40} className="text-white/30" />
            </div>
            <p className="font-medium text-white mb-1">No datasets yet</p>
            <p className="text-sm text-white/50 mb-6">Upload your first dataset to get started</p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                "bg-gradient-to-r from-violet to-violet/80 text-white",
                "shadow-lg shadow-violet/30",
                "hover:shadow-xl hover:shadow-violet/40"
              )}
            >
              <Upload size={18} />
              Upload Dataset
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center text-xs font-medium text-white/40 uppercase tracking-wider">
                <span className="flex-1">Dataset</span>
                <span className="w-24 text-right hidden sm:block">Rows</span>
                <span className="w-24 text-right hidden md:block">Size</span>
                <span className="w-28 text-right hidden lg:block">Created</span>
                <span className="w-28 text-center">Status</span>
                <span className="w-12"></span>
              </div>
            </div>
            
            {/* Dataset Rows */}
            <div className="divide-y divide-white/5">
              {data.datasets.map((dataset) => (
                <DatasetRow
                  key={dataset.id}
                  dataset={dataset}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                <p className="text-sm text-white/50">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.pagination.total)} of {data.pagination.total} datasets
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-4 py-2 text-sm text-white/70">
                    Page {page} of {data.pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= data.pagination.total_pages}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
