'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ShieldCheck, Trash2, Loader2, AlertCircle, Clock,
  Table2, ChevronRight,
} from 'lucide-react';
import { datasetsApi, validationsApi, platformApi, validationsForDataset } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const statusChip: Record<string, { dot: string; label: string }> = {
  uploading: { dot: 'bg-amber-400', label: 'Uploading' },
  processing: { dot: 'bg-blue-400', label: 'Processing' },
  processed: { dot: 'bg-emerald-400', label: 'Processed' },
  ready: { dot: 'bg-emerald-400', label: 'Ready' },
  error: { dot: 'bg-rose-400', label: 'Error' },
};

const validationStatusChip: Record<string, string> = {
  pending: 'bg-amber-400',
  processing: 'bg-blue-400',
  completed: 'bg-emerald-400',
  failed: 'bg-rose-400',
  cancelled: 'bg-zinc-500',
};

export default function DatasetDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ['datasets', id],
    queryFn: () => datasetsApi.get(id),
    retry: 1,
  });

  const { data: validationsData } = useQuery({
    queryKey: ['validations', 'for-dataset', id],
    queryFn: () => validationsApi.list(1, 50),
    retry: 1,
  });

  // Optional backend capabilities — sections hide until the endpoints exist.
  const { data: preview } = useQuery({
    queryKey: ['datasets', id, 'preview'],
    queryFn: () => platformApi.getDatasetPreview(id),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const { data: scheduleData } = useQuery({
    queryKey: ['datasets', id, 'schedule'],
    queryFn: () => platformApi.getDatasetSchedule(id),
    retry: false,
    staleTime: 60_000,
  });

  const scheduleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) return platformApi.setDatasetSchedule(id, 'on_upload');
      return platformApi.deleteDatasetSchedule(id);
    },
    onSuccess: (_d, enable) => {
      queryClient.invalidateQueries({ queryKey: ['datasets', id, 'schedule'] });
      toast.success(enable ? 'Auto-validation enabled' : 'Auto-validation disabled');
    },
    onError: () => toast.error('Could not update schedule', 'Please try again.'),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await datasetsApi.delete(id);
      toast.success('Dataset deleted');
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      router.push('/dashboard/datasets');
    } catch {
      toast.error('Failed to delete dataset', 'Please try again.');
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="max-w-lg">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Dataset not found</p>
            <p className="text-sm text-rose-400/80 mt-0.5">It may have been deleted, or the link is wrong.</p>
          </div>
        </div>
        <Link href="/dashboard/datasets" className="inline-flex items-center gap-2 mt-6 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to datasets
        </Link>
      </div>
    );
  }

  const chip = statusChip[dataset.status] ?? statusChip.processing;
  const datasetValidations = validationsForDataset(validationsData?.validations ?? [], id);
  const canValidate = dataset.status === 'ready' || dataset.status === 'processed';

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Link href="/dashboard/datasets" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Datasets
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold text-zinc-100 tracking-tight truncate">{dataset.name}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-[13px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
                {chip.label}
              </span>
              <span>{formatBytes(dataset.file_size)}</span>
              {dataset.row_count > 0 && <span className="tabular-nums">{dataset.row_count.toLocaleString()} rows</span>}
              {dataset.column_count > 0 && <span className="tabular-nums">{dataset.column_count} columns</span>}
              <span>Uploaded {formatDate(dataset.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canValidate && (
              <Link
                href={`/dashboard/validations?dataset=${dataset.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 shadow-[0_0_28px_-10px_rgba(139,92,246,0.6)] transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                {datasetValidations.length > 0 ? 'Re-validate' : 'Validate'}
              </Link>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-rose-400 bg-rose-500/[0.08] ring-1 ring-rose-500/20 hover:bg-rose-500/[0.14] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Auto-validation schedule — renders only when the backend supports it */}
      {scheduleData?.supported && (
        <ScheduleSection
          schedule={scheduleData.schedule}
          pending={scheduleMutation.isPending}
          onToggle={(v) => scheduleMutation.mutate(v)}
        />
      )}

      {/* Schema explorer — renders only when the preview endpoint exists */}
      {preview && (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Table2 className="w-3.5 h-3.5" /> Schema
            {preview.row_count ? (
              <span className="normal-case tracking-normal text-zinc-600 font-normal">
                {preview.row_count.toLocaleString()} rows
              </span>
            ) : null}
          </p>
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="px-4 py-3">Column</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Null %</th>
                    <th className="px-4 py-3 text-right">Unique %</th>
                    <th className="px-4 py-3">Sample values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {preview.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[13px] text-zinc-200">{col.name}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{col.type}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">
                        {col.null_pct != null ? `${col.null_pct.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">
                        {col.unique_pct != null ? `${col.unique_pct.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 truncate max-w-[240px]">
                        {col.sample_values?.slice(0, 3).join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Validation history for this dataset */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Validations of this dataset</p>
          {datasetValidations.length > 0 && (
            <Link href="/dashboard/validations" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              All validations →
            </Link>
          )}
        </div>
        {datasetValidations.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-sm text-zinc-500">
              {canValidate
                ? 'No validations yet — run the first one to get a collapse-risk report.'
                : 'This dataset is not ready for validation yet.'}
            </p>
            {canValidate && (
              <Link
                href={`/dashboard/validations?dataset=${dataset.id}`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 transition-all"
              >
                <ShieldCheck className="w-4 h-4" /> Validate now
              </Link>
            )}
          </div>
        ) : (
          <div className="border-t border-white/[0.06]">
            {datasetValidations.map((v) => (
              <Link
                key={v.id}
                href={`/dashboard/validations/${v.id}`}
                className="flex items-center gap-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${validationStatusChip[v.status] ?? 'bg-zinc-500'}`} />
                <span className="flex-1 text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors capitalize">
                  {v.validation_type} validation
                </span>
                <span className="text-sm text-zinc-500 tabular-nums">
                  {(v.risk_score ?? v.results?.risk_score) != null ? `${v.risk_score ?? v.results?.risk_score}% risk` : '—'}
                </span>
                <span className="text-xs text-zinc-600 tabular-nums flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {formatDate(v.created_at)}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete dataset?"
        description={`"${dataset.name}" and its validation history will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
      />
    </div>
  );
}

function ScheduleSection({
  schedule,
  pending,
  onToggle,
}: {
  schedule: { cadence: string } | null;
  pending: boolean;
  onToggle: (enable: boolean) => void;
}) {
  return (
    <section className="panel p-5 flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-zinc-200">Auto-validate on upload</p>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          Run a standard validation automatically whenever this dataset is replaced or re-uploaded.
        </p>
      </div>
      <Switch
        checked={!!schedule}
        onChange={onToggle}
        disabled={pending}
        label="Auto-validate on upload"
      />
    </section>
  );
}
