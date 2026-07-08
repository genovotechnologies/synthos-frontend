'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, X, Minus, ChevronLeft, ChevronRight, AlertTriangle, Pencil } from 'lucide-react';
import { platformApi, validationsApi, type Validation, type ValidationStage, type ValidationFinding } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

/** Display name for a validation: user-set name, else a dataset-based fallback. */
export function validationDisplayName(
  v: Pick<Validation, 'name' | 'dataset_name'>,
  fallback = 'Untitled validation'
): string {
  return v.name?.trim() || v.dataset_name?.trim() || fallback;
}

const NAME_MAX = 120;

/**
 * Inline click-to-edit validation name. Enter saves, Esc cancels. Optimistic
 * across every cached validations query, with rollback + toast on failure.
 * Safe inside row <Link>s: all interactions stop propagation.
 */
export function EditableValidationName({
  validation,
  fallback = 'Untitled validation',
  textClassName,
  inputClassName,
}: {
  validation: Pick<Validation, 'id' | 'name' | 'dataset_name'>;
  fallback?: string;
  textClassName?: string;
  inputClassName?: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState('');
  const display = validationDisplayName(validation, fallback);

  const trimmed = value.trim();
  const invalid = trimmed.length === 0 || trimmed.length > NAME_MAX;

  const renameMutation = useMutation({
    mutationFn: (name: string) => validationsApi.rename(validation.id, name),
    onMutate: async (name: string) => {
      await queryClient.cancelQueries({ queryKey: ['validations'] });
      await queryClient.cancelQueries({ queryKey: ['validation', validation.id] });
      const listSnapshots = queryClient.getQueriesData({ queryKey: ['validations'] });
      const detailSnapshot = queryClient.getQueryData(['validation', validation.id]);
      queryClient.setQueriesData({ queryKey: ['validations'] }, (old: unknown) => {
        const o = old as { validations?: Validation[] } | undefined;
        if (!o?.validations) return old;
        return {
          ...o,
          validations: o.validations.map((v) => (v.id === validation.id ? { ...v, name } : v)),
        };
      });
      queryClient.setQueryData(['validation', validation.id], (old: Validation | undefined) =>
        old ? { ...old, name } : old
      );
      return { listSnapshots, detailSnapshot };
    },
    onSuccess: () => toast.success('Validation renamed'),
    onError: (err: Error & { status?: number }, _name, ctx) => {
      ctx?.listSnapshots?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (ctx && ctx.detailSnapshot !== undefined) {
        queryClient.setQueryData(['validation', validation.id], ctx.detailSnapshot);
      }
      const unavailable = err.status === 404 || err.status === 405;
      toast.error(
        unavailable ? 'Rename not available yet' : 'Could not rename validation',
        unavailable ? 'The rename endpoint has not shipped on this backend.' : err.message
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['validations'] });
      queryClient.invalidateQueries({ queryKey: ['validation', validation.id] });
    },
  });

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const beginEdit = (e: React.SyntheticEvent) => {
    stop(e);
    setValue(validation.name?.trim() || display);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (invalid || trimmed === display) return;
    renameMutation.mutate(trimmed);
  };

  if (editing) {
    return (
      <span className="inline-flex flex-col min-w-0" onClick={stop}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClick={stop}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !invalid) commit();
            else if (e.key === 'Escape') setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          maxLength={NAME_MAX + 20}
          aria-label="Validation name"
          className={cn(
            'bg-white/[0.05] ring-1 rounded-lg px-2 py-1 text-zinc-100 focus:outline-none min-w-0 w-full',
            invalid ? 'ring-rose-500/50' : 'ring-violet-500/50',
            inputClassName
          )}
        />
        {trimmed.length > NAME_MAX && (
          <span className="text-[10px] text-rose-400 mt-0.5">Max {NAME_MAX} characters</span>
        )}
      </span>
    );
  }

  return (
    <span className="group/name inline-flex items-center gap-1.5 min-w-0">
      <span className={cn('truncate', textClassName)}>{display}</span>
      {renameMutation.isPending ? (
        <Loader2 className="w-3 h-3 animate-spin text-zinc-500 flex-shrink-0" />
      ) : (
        <button
          type="button"
          onClick={beginEdit}
          aria-label={`Rename ${display}`}
          title="Rename"
          className="p-0.5 rounded text-zinc-600 opacity-0 group-hover/name:opacity-100 focus-visible:opacity-100 hover:text-zinc-300 transition-all flex-shrink-0"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/**
 * Live pipeline view for a running validation. Polls /validations/:id/progress;
 * when the backend doesn't support the endpoint yet, renders the provided
 * fallback (the classic percentage bar) instead.
 */
export function ValidationPipeline({
  validationId,
  active,
  fallback,
}: {
  validationId: string;
  active: boolean;
  fallback: React.ReactNode;
}) {
  const { data: progress } = useQuery({
    queryKey: ['validation', validationId, 'progress'],
    queryFn: () => platformApi.getValidationProgress(validationId),
    refetchInterval: active ? 4000 : false,
    enabled: active,
    retry: false,
  });

  if (!progress) return <>{fallback}</>;

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-medium text-zinc-200">Validation pipeline</p>
        <div className="flex items-center gap-3 text-[13px] text-zinc-500 tabular-nums">
          <span>{Math.round(progress.percentage)}%</span>
          {progress.eta_seconds != null && progress.eta_seconds > 0 && (
            <span>~{formatEta(progress.eta_seconds)} remaining</span>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
        />
      </div>

      <ol className="space-y-0">
        {progress.stages.map((stage, index) => (
          <PipelineStage
            key={stage.key}
            stage={stage}
            isLast={index === progress.stages.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

function formatEta(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function PipelineStage({ stage, isLast }: { stage: ValidationStage; isLast: boolean }) {
  const iconFor: Record<ValidationStage['status'], React.ReactNode> = {
    completed: <Check className="w-3 h-3 text-emerald-400" />,
    running: <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />,
    failed: <X className="w-3 h-3 text-rose-400" />,
    skipped: <Minus className="w-3 h-3 text-zinc-600" />,
    pending: <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />,
  };
  const ringFor: Record<ValidationStage['status'], string> = {
    completed: 'ring-emerald-500/30 bg-emerald-500/10',
    running: 'ring-violet-500/40 bg-violet-500/10',
    failed: 'ring-rose-500/30 bg-rose-500/10',
    skipped: 'ring-white/[0.06] bg-white/[0.02]',
    pending: 'ring-white/[0.06] bg-white/[0.02]',
  };

  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full ring-1 flex-shrink-0',
            ringFor[stage.status]
          )}
        >
          {iconFor[stage.status]}
        </span>
        {!isLast && <span className="w-px flex-1 bg-white/[0.06] my-1" />}
      </div>
      <div className={cn('pb-6 min-w-0', isLast && 'pb-0')}>
        <p
          className={cn(
            'text-sm leading-6',
            stage.status === 'running'
              ? 'text-zinc-100 font-medium'
              : stage.status === 'completed'
              ? 'text-zinc-300'
              : 'text-zinc-500'
          )}
        >
          {stage.label}
        </p>
        {stage.status === 'running' && (
          <p className="text-[11px] text-zinc-600 mt-0.5">In progress…</p>
        )}
      </div>
    </li>
  );
}

/**
 * Row-level findings for a completed validation. Hidden entirely until the
 * backend exposes /validations/:id/findings.
 */
export function FindingsSection({ validationId }: { validationId: string }) {
  const [page, setPage] = React.useState(1);

  const { data } = useQuery({
    queryKey: ['validation', validationId, 'findings', page],
    queryFn: () => platformApi.getValidationFindings(validationId, page, 25),
    retry: false,
    staleTime: 5 * 60_000,
  });

  // Endpoint not shipped yet — hide entirely.
  if (!data) return null;

  // Endpoint live but no findings: either a clean sample, or a columnar format
  // (parquet/arrow/…) that the sampling pipeline doesn't inspect yet.
  if (data.findings.length === 0) {
    return (
      <div className="panel p-6">
        <h3 className="font-medium text-zinc-300 text-sm flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-zinc-500" />
          Problematic Rows
        </h3>
        <p className="text-sm text-zinc-500 leading-relaxed">
          No row-level findings. Findings are computed from a sample of up to 5,000 rows of
          CSV, TSV, or JSONL data — columnar formats aren&apos;t sampled yet. Full-file ML
          findings are coming with the GPU pipeline.
        </p>
      </div>
    );
  }

  const totalPages = data.pagination?.total_pages ?? 1;

  const severityStyle: Record<ValidationFinding['severity'], string> = {
    critical: 'text-rose-300 bg-rose-500/10 ring-rose-500/25',
    high: 'text-rose-400 bg-rose-500/[0.07] ring-rose-500/20',
    medium: 'text-amber-400 bg-amber-500/[0.08] ring-amber-500/20',
    low: 'text-zinc-400 bg-white/[0.04] ring-white/[0.08]',
  };

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-zinc-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Problematic Rows
        </h3>
        <span className="text-xs text-zinc-600 tabular-nums">
          {data.total.toLocaleString()} findings · sampled from up to 5,000 rows
        </span>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="py-2.5 pr-4">Row</th>
              <th className="py-2.5 pr-4">Column</th>
              <th className="py-2.5 pr-4">Severity</th>
              <th className="py-2.5 pr-4">Issue</th>
              <th className="py-2.5">Sample</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {data.findings.map((finding, index) => (
              <tr key={`${finding.row_index}-${index}`} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-4 font-mono text-[13px] text-zinc-400 tabular-nums">{finding.row_index.toLocaleString()}</td>
                <td className="py-2.5 pr-4 font-mono text-[13px] text-zinc-400">{finding.column || '—'}</td>
                <td className="py-2.5 pr-4">
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 capitalize', severityStyle[finding.severity])}>
                    {finding.severity}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-zinc-300">
                  {finding.issue}
                  {finding.detail && <span className="block text-[12px] text-zinc-600 mt-0.5">{finding.detail}</span>}
                </td>
                <td className="py-2.5 text-zinc-500 font-mono text-[12px] truncate max-w-[200px]">{finding.sample || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="p-1.5 text-zinc-500 hover:text-zinc-200 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-500 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            className="p-1.5 text-zinc-500 hover:text-zinc-200 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
