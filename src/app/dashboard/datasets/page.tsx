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
  Loader2
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

  const statusColors = {
    uploading: 'bg-blue-500/10 text-blue-500',
    processing: 'bg-yellow-500/10 text-yellow-500',
    ready: 'bg-green-500/10 text-green-500',
    error: 'bg-red-500/10 text-red-500',
  };

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
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-medium">{dataset.name}</p>
            <p className="text-sm text-muted-foreground">{dataset.file_name}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {dataset.row_count?.toLocaleString() || '-'} rows
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatFileSize(dataset.file_size)}
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full capitalize",
          statusColors[dataset.status]
        )}>
          {dataset.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatDate(dataset.created_at)}
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md hover:bg-muted"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                <Link
                  href={`/dashboard/datasets/${dataset.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                >
                  <Eye size={14} />
                  View details
                </Link>
                <button
                  onClick={() => {
                    onDelete(dataset.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
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
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Upload Dataset</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-muted"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>

        {uploadProgress.state === 'error' && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {uploadProgress.error}
          </div>
        )}

        {!isUploading && uploadProgress.state !== 'done' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet size={40} className="mx-auto text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={40} className="mx-auto text-muted-foreground" />
                <p className="font-medium">Drop your file here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {uploadProgress.state === 'done' ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <Loader2 className="animate-spin text-primary" size={24} />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {uploadProgress.state === 'getting-url' && 'Preparing upload...'}
                  {uploadProgress.state === 'uploading' && 'Uploading to storage...'}
                  {uploadProgress.state === 'completing' && 'Finalizing...'}
                  {uploadProgress.state === 'done' && 'Upload complete!'}
                </p>
                <p className="text-sm text-muted-foreground">{file?.name}</p>
              </div>
            </div>
            <Progress value={uploadProgress.progress} />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading || uploadProgress.state === 'done'}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
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
          <h1 className="text-2xl font-bold">Datasets</h1>
          <p className="text-muted-foreground">
            Manage your training data files
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
          <Upload size={18} className="mr-2" />
          Upload Dataset
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            Loading datasets...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-destructive">
            Failed to load datasets
          </div>
        ) : !data?.datasets?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <Database size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No datasets yet</p>
            <p className="text-sm mt-1">Upload your first dataset to get started</p>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4"
            >
              <Upload size={18} className="mr-2" />
              Upload Dataset
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rows
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.datasets.map((dataset) => (
                    <DatasetRow
                      key={dataset.id}
                      dataset={dataset}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.pagination.total)} of {data.pagination.total} datasets
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= data.pagination.total_pages}
                  >
                    Next
                  </Button>
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
