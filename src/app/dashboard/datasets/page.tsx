'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Database, Trash2, FileText, AlertCircle, Check, X,
  Loader2, ChevronLeft, ChevronRight, Search, MoreHorizontal,
  FolderOpen, ShieldCheck, Table2, Image as ImageIcon, AudioLines,
  Film, Binary, Archive, type LucideIcon
} from 'lucide-react';
import { datasetsApi, validationsApi, platformApi, type Dataset, type UploadProgress } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';

// Max file size: 500GB
const MAX_FILE_SIZE = 500 * 1024 * 1024 * 1024;

// The validation pipeline is multimodal: alongside tabular/structured data it
// ingests raw text corpora, images, audio, video, embedding arrays, and packed
// archives (e.g. WebDataset tars). Grouped so the UI can explain itself and
// show a per-modality icon.
const FORMAT_GROUPS = [
  { kind: 'tabular', label: 'Tabular & structured', extensions: ['.csv', '.tsv', '.json', '.jsonl', '.parquet', '.hdf5', '.h5', '.xlsx', '.xls', '.arrow', '.feather', '.orc', '.avro', '.pkl', '.pickle'] },
  { kind: 'text', label: 'Text corpora', extensions: ['.txt', '.md'] },
  { kind: 'image', label: 'Images', extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif'] },
  { kind: 'audio', label: 'Audio', extensions: ['.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac'] },
  { kind: 'video', label: 'Video', extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
  { kind: 'array', label: 'Arrays & embeddings', extensions: ['.npy', '.npz'] },
  { kind: 'archive', label: 'Packed archives', extensions: ['.zip', '.tar', '.gz', '.tgz'] },
] as const;

type FileKind = (typeof FORMAT_GROUPS)[number]['kind'];

const ALLOWED_EXTENSIONS: string[] = FORMAT_GROUPS.flatMap((g) => [...g.extensions]);

const EXTENSION_KIND = new Map<string, FileKind>(
  FORMAT_GROUPS.flatMap((g) => g.extensions.map((ext) => [ext, g.kind] as const))
);

const KIND_ICONS: Record<FileKind, { icon: LucideIcon; tint: string }> = {
  tabular: { icon: Table2, tint: 'text-violet-400' },
  text: { icon: FileText, tint: 'text-zinc-400' },
  image: { icon: ImageIcon, tint: 'text-emerald-400' },
  audio: { icon: AudioLines, tint: 'text-amber-400' },
  video: { icon: Film, tint: 'text-blue-400' },
  array: { icon: Binary, tint: 'text-cyan-400' },
  archive: { icon: Archive, tint: 'text-rose-400' },
};

function fileKind(filename: string): FileKind {
  return EXTENSION_KIND.get(getFileExtension(filename)) ?? 'tabular';
}

function FileKindIcon({ name, sizeClass = 'w-4 h-4' }: { name: string; sizeClass?: string }) {
  const { icon: Icon, tint } = KIND_ICONS[fileKind(name)];
  return <Icon className={`${sizeClass} ${tint} flex-shrink-0`} />;
}

// Datasets frequently ship as folders of many files (per-split CSVs, sharded
// parquet, etc.), so the uploader accepts multiple files and whole directories.
// Each file becomes its own dataset (the backend model is one dataset per file).
const MAX_BATCH_FILES = 300;
const UPLOAD_CONCURRENCY = 2;

interface QueuedFile {
  id: number;
  file: File;
  /** Path shown in the list; includes folder prefix for directory uploads */
  relativePath: string;
  status: 'queued' | 'uploading' | 'success' | 'error';
  progress: UploadProgress | null;
  error?: string;
}

interface IncomingFile {
  file: File;
  relativePath: string;
}

/**
 * Resolve dropped items into files, recursing into directories via the
 * FileSystem entry API. Entries must be captured synchronously before the
 * first await — the DataTransferItemList is invalidated once the drop
 * handler yields.
 */
function collectDroppedFiles(items: DataTransferItemList): Promise<IncomingFile[]> {
  const entries: FileSystemEntry[] = [];
  const plainFiles: File[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
    else {
      const file = item.getAsFile();
      if (file) plainFiles.push(file);
    }
  }

  async function walkEntry(entry: FileSystemEntry, prefix: string, out: IncomingFile[]): Promise<void> {
    if (out.length >= MAX_BATCH_FILES) return;
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject)
      );
      out.push({ file, relativePath: prefix + file.name });
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject)
        );
        for (const child of batch) {
          await walkEntry(child, `${prefix}${entry.name}/`, out);
        }
      } while (batch.length > 0 && out.length < MAX_BATCH_FILES);
    }
  }

  return (async () => {
    const out: IncomingFile[] = [];
    for (const entry of entries) await walkEntry(entry, '', out);
    for (const file of plainFiles) out.push({ file, relativePath: file.name });
    return out;
  })();
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

function DatasetRow({ dataset, onDelete }: { dataset: Dataset; onDelete: (dataset: Dataset) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusColors: Record<Dataset['status'], string> = {
    uploading: 'text-amber-400 bg-amber-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    processed: 'text-emerald-400 bg-emerald-400/10',
    ready: 'text-emerald-400 bg-emerald-400/10',
    error: 'text-rose-400 bg-rose-400/10',
  };

  const statusLabels: Record<Dataset['status'], string> = {
    uploading: 'Uploading',
    processing: 'Processing',
    processed: 'Processed',
    ready: 'Ready',
    error: 'Error',
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-0 group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
          <FileKindIcon name={dataset.file_name || dataset.name} sizeClass="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/datasets/${dataset.id}`}
            className="text-sm font-medium text-white truncate hover:text-violet-300 transition-colors block"
          >
            {dataset.name}
          </Link>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
            <span>{formatBytes(dataset.file_size)} • {formatDate(dataset.created_at)}</span>
            {dataset.group_name && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.04] ring-1 ring-white/[0.06] text-[10px] text-zinc-400">
                <FolderOpen className="w-2.5 h-2.5" />
                {dataset.group_name}
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[dataset.status]}`}>
          {statusLabels[dataset.status]}
        </span>

        {(dataset.status === 'ready' || dataset.status === 'processed') && (
          <Link
            href={`/dashboard/validations?dataset=${dataset.id}`}
            title="Validate this dataset"
            className="p-2 text-zinc-500 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        )}

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
              <div className="absolute right-0 top-full mt-1 w-36 py-1 surface !rounded-lg z-20">
                <button
                  onClick={() => {
                    onDelete(dataset);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-zinc-800 transition-colors flex items-center gap-2"
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

function MultiUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [phase, setPhase] = useState<'select' | 'uploading' | 'done'>('select');
  const [groupName, setGroupName] = useState('');
  const groupNameTouched = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(1);

  const addFiles = useCallback((incoming: IncomingFile[]) => {
    setQueue((prev) => {
      const existing = new Set(prev.map((q) => `${q.relativePath}:${q.file.size}`));
      const additions: QueuedFile[] = [];
      let skipped = 0;
      for (const { file, relativePath } of incoming) {
        const baseName = file.name;
        if (baseName.startsWith('.') || !validateFile(file).valid) {
          skipped++;
          continue;
        }
        const key = `${relativePath}:${file.size}`;
        if (existing.has(key)) continue;
        existing.add(key);
        additions.push({
          id: idRef.current++,
          file,
          relativePath,
          status: 'queued',
          progress: null,
        });
      }
      const merged = [...prev, ...additions];
      const capped = merged.slice(0, MAX_BATCH_FILES);
      setTruncated((t) => t || merged.length > MAX_BATCH_FILES);
      setSkippedCount((s) => s + skipped);
      // Default the group name to the top-level folder of a directory upload.
      if (!groupNameTouched.current) {
        const foldered = capped.find((q) => q.relativePath.includes('/'));
        if (foldered) setGroupName(foldered.relativePath.split('/')[0]);
      }
      return capped;
    });
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (phase === 'uploading') return;
      const incoming = await collectDroppedFiles(e.dataTransfer.items);
      addFiles(incoming);
    },
    [addFiles, phase]
  );

  const onInputFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const incoming: IncomingFile[] = Array.from(list).map((file) => ({
        file,
        relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
      }));
      addFiles(incoming);
    },
    [addFiles]
  );

  const removeFile = (id: number) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const startUpload = async () => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setPhase('uploading');

    const snapshot = queue;
    const pendingIds = snapshot
      .filter((q) => q.status === 'queued' || q.status === 'error')
      .map((q) => q.id);
    const byId = new Map(snapshot.map((q) => [q.id, q]));
    const update = (id: number, patch: Partial<QueuedFile>) =>
      setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

    let cursor = 0;
    let succeeded = 0;
    let failed = 0;

    const worker = async () => {
      while (!signal.aborted) {
        const index = cursor++;
        if (index >= pendingIds.length) return;
        const id = pendingIds[index];
        const item = byId.get(id);
        if (!item) continue;
        update(id, {
          status: 'uploading',
          error: undefined,
          progress: { phase: 'preparing', totalBytes: item.file.size, uploadedBytes: 0, percentage: 0 },
        });
        try {
          await datasetsApi.upload(item.file, (progress) => update(id, { progress }), signal, {
            groupName: groupName.trim() || undefined,
          });
          succeeded++;
          update(id, {
            status: 'success',
            progress: { phase: 'completing', totalBytes: item.file.size, uploadedBytes: item.file.size, percentage: 100 },
          });
        } catch (err) {
          if (signal.aborted) {
            update(id, { status: 'queued', progress: null });
            return;
          }
          failed++;
          update(id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Upload failed',
            progress: null,
          });
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, pendingIds.length) }, () => worker())
    );

    if (succeeded > 0) onSuccess();
    if (signal.aborted) {
      setPhase('select');
      if (succeeded > 0) toast.info('Upload paused', `${succeeded} of ${pendingIds.length} files uploaded before cancelling.`);
      return;
    }
    if (failed === 0) {
      toast.success(
        succeeded === 1 ? 'Dataset uploaded' : `${succeeded} datasets uploaded`,
        succeeded === 1 ? undefined : 'Each file was created as its own dataset.'
      );
      setPhase('done');
      setTimeout(onClose, 1200);
    } else {
      toast.error(
        `${failed} of ${pendingIds.length} uploads failed`,
        succeeded > 0 ? `${succeeded} succeeded. Retry the failed files below.` : 'Retry the failed files below.'
      );
      setPhase('select');
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const isUploading = phase === 'uploading';
  const totalBytes = queue.reduce((sum, q) => sum + q.file.size, 0);
  const uploadedBytes = queue.reduce((sum, q) => {
    if (q.status === 'success') return sum + q.file.size;
    if (q.status === 'uploading' && q.progress) return sum + q.progress.uploadedBytes;
    return sum;
  }, 0);
  const aggregatePct = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
  const failedCount = queue.filter((q) => q.status === 'error').length;
  const uploadableCount = queue.filter((q) => q.status === 'queued' || q.status === 'error').length;
  const activeItem = queue.find((q) => q.status === 'uploading');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isUploading ? undefined : onClose} />

      <div className="relative w-full max-w-xl surface flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload Datasets</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Add files or a whole folder — tabular, text, image, audio, video, arrays, and archives (max 500 GB per file)
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close"
            className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            onInputFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={(e) => {
            onInputFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          {queue.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-600 bg-zinc-800/30 rounded-xl p-10 text-center transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
              <p className="font-medium text-white">Drop files or a folder here</p>
              <p className="text-sm text-zinc-500 mt-1 mb-5">Multi-file datasets are uploaded as one dataset per file</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Browse files
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition-colors flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  Choose folder
                </button>
              </div>
              <div className="mt-7 pt-5 border-t border-white/[0.06] text-left max-w-md mx-auto space-y-1.5">
                {FORMAT_GROUPS.map((group) => (
                  <p key={group.kind} className="text-[11px] leading-relaxed text-zinc-600">
                    <span className="text-zinc-500 font-medium">{group.label}:</span>{' '}
                    {group.extensions.join('  ')}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Add-more bar */}
              {!isUploading && phase !== 'done' && (
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition-colors"
                  >
                    + Add files
                  </button>
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Add folder
                  </button>
                  <span className="text-xs text-zinc-600 ml-auto">or drop more here</span>
                </div>
              )}

              {/* Optional dataset group for multi-file uploads */}
              {queue.length > 1 && !isUploading && phase !== 'done' && (
                <div className="mb-4">
                  <label htmlFor="dataset-group" className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    Dataset group <span className="normal-case tracking-normal font-normal text-zinc-600">(optional)</span>
                  </label>
                  <input
                    id="dataset-group"
                    type="text"
                    value={groupName}
                    onChange={(e) => {
                      groupNameTouched.current = true;
                      setGroupName(e.target.value);
                    }}
                    placeholder="e.g. training-corpus-v2"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-violet-500/50 transition-all"
                  />
                  <p className="text-[11px] text-zinc-600 mt-1.5">
                    Files in a group can be validated together as one logical dataset.
                  </p>
                </div>
              )}

              {/* Aggregate progress */}
              {(isUploading || phase === 'done') && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-400">
                      {phase === 'done'
                        ? 'All uploads complete'
                        : activeItem
                        ? `Uploading ${activeItem.relativePath}`
                        : 'Uploading…'}
                    </span>
                    <span className="text-zinc-500 tabular-nums">{aggregatePct}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${phase === 'done' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                      style={{ width: `${aggregatePct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-1.5">
                    <span>
                      {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                    </span>
                    {activeItem?.progress?.speed ? (
                      <span className="flex items-center gap-3">
                        <span>{formatSpeed(activeItem.progress.speed)}</span>
                        {activeItem.progress.remainingTime !== undefined && (
                          <span>{formatTime(activeItem.progress.remainingTime)} left on current file</span>
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* File list */}
              <ul className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-lg overflow-hidden">
                {queue.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/40">
                    <FileKindIcon name={item.file.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate" title={item.relativePath}>
                        {item.relativePath}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {formatBytes(item.file.size)}
                        {item.status === 'error' && item.error ? (
                          <span className="text-rose-400 ml-2">{item.error}</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === 'queued' && !isUploading && (
                        <button
                          onClick={() => removeFile(item.id)}
                          aria-label={`Remove ${item.relativePath}`}
                          className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.status === 'queued' && isUploading && (
                        <span className="text-[11px] text-zinc-600">queued</span>
                      )}
                      {item.status === 'uploading' && (
                        <span className="flex items-center gap-2 text-[11px] text-violet-400 tabular-nums">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {item.progress?.percentage ?? 0}%
                        </span>
                      )}
                      {item.status === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
                      {item.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Notes */}
              {(skippedCount > 0 || truncated) && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 space-y-0.5">
                  {skippedCount > 0 && (
                    <p>{skippedCount} file{skippedCount === 1 ? ' was' : 's were'} skipped (unsupported type, hidden, empty, or over 500 GB).</p>
                  )}
                  {truncated && <p>Batch capped at {MAX_BATCH_FILES} files — upload the rest in a second batch.</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            {queue.length > 0 && (
              <>
                {queue.length} file{queue.length === 1 ? '' : 's'} • {formatBytes(totalBytes)}
                {failedCount > 0 && <span className="text-rose-400 ml-2">{failedCount} failed</span>}
              </>
            )}
          </p>
          <div className="flex items-center gap-3">
            {isUploading ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Cancel remaining
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                {phase === 'done' ? 'Close' : 'Cancel'}
              </button>
            )}
            {phase !== 'done' && (
              <button
                onClick={startUpload}
                disabled={uploadableCount === 0 || isUploading}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {failedCount > 0 && uploadableCount === failedCount
                      ? `Retry ${failedCount} failed`
                      : `Upload ${uploadableCount} file${uploadableCount === 1 ? '' : 's'}`}
                  </>
                )}
              </button>
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
  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['datasets', page],
    queryFn: () => datasetsApi.list(page, 10),
  });

  // Dataset groups — hidden until the backend ships the endpoint.
  const { data: groups } = useQuery({
    queryKey: ['dataset-groups'],
    queryFn: platformApi.listGroups,
    retry: false,
    staleTime: 60_000,
  });

  const validateGroupMutation = useMutation({
    mutationFn: (groupId: string) =>
      validationsApi.create({ group_id: groupId, validation_type: 'standard' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validations'] });
      toast.success('Group validation started', 'The whole group will be validated as one dataset.');
    },
    onError: (err: Error) => toast.error('Could not start group validation', err.message),
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await datasetsApi.delete(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      toast.success('Dataset deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete dataset', 'Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['datasets'] });
  };

  const datasets = data?.datasets || [];
  // The list endpoint does not support server-side search, so filter the
  // loaded page client-side by name / file name.
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredDatasets = normalizedQuery
    ? datasets.filter(
        (d) =>
          d.name?.toLowerCase().includes(normalizedQuery) ||
          d.file_name?.toLowerCase().includes(normalizedQuery)
      )
    : datasets;
  const pagination = data?.pagination;
  const totalPages = pagination?.total_pages || 1;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Datasets</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your uploaded datasets</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Datasets
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
          />
        </div>
      </div>

      {/* Dataset groups strip (backend ≥ groups) */}
      {groups && groups.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">Dataset Groups</p>
          <div className="flex flex-wrap gap-3">
            {groups.map((group) => (
              <div key={group.id} className="panel px-4 py-3 flex items-center gap-4">
                <FolderOpen className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{group.name}</p>
                  <p className="text-[11px] text-zinc-600 tabular-nums">
                    {group.dataset_count} file{group.dataset_count === 1 ? '' : 's'} • {formatBytes(group.total_size_bytes)}
                  </p>
                </div>
                <button
                  onClick={() => validateGroupMutation.mutate(group.id)}
                  disabled={validateGroupMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-violet-300 bg-violet-500/10 ring-1 ring-violet-500/20 hover:bg-violet-500/[0.18] disabled:opacity-50 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Validate group
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load datasets</p>
            <p className="text-sm text-rose-400/80 mt-0.5">Please try refreshing the page.</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="panel">
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
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Datasets
            </button>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No datasets match your search</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Try a different search term or clear the search to see all datasets on this page.
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <span>Dataset</span>
                <span className="mr-12">Status</span>
              </div>
            </div>
            <div className="px-5">
              {filteredDatasets.map((dataset) => (
                <DatasetRow
                  key={dataset.id}
                  dataset={dataset}
                  onDelete={setDeleteTarget}
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
        <MultiUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete dataset?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" and its validation history will be permanently removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
