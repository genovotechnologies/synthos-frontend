'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { validationsApi, datasetsApi, type Validation, type CreateValidationRequest } from '@/lib/api';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
  GitCompare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500',
    processing: 'bg-blue-500 animate-pulse',
    completed: 'bg-emerald-500',
    failed: 'bg-rose-500',
  };
  return <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors[status] || colors.pending)} />;
}

function ValidationRow({
  validation,
  isSelected,
  onToggleSelect,
}: {
  validation: Validation;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompleted = validation.status === 'completed';

  return (
    <div className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors group items-center">
      <div className="col-span-1 flex items-center justify-center">
        {isCompleted ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleSelect(validation.id);
            }}
            className={cn(
              'w-4 h-4 rounded border flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-violet-600 border-violet-500'
                : 'border-zinc-700 hover:border-zinc-500'
            )}
          >
            {isSelected && (
              <CheckCircle size={10} className="text-white" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4" />
        )}
      </div>
      <Link
        href={`/dashboard/validations/${validation.id}`}
        className="col-span-11 grid grid-cols-11 gap-4 items-center"
      >
        <div className="col-span-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center text-xs font-medium text-zinc-400 group-hover:bg-zinc-800 transition-colors">
            {validation.dataset_name?.charAt(0).toUpperCase() || 'D'}
          </div>
          <div className="min-w-0">
            <span className="text-sm text-zinc-300 truncate block group-hover:text-zinc-100 transition-colors">
              {validation.dataset_name || 'Untitled validation'}
            </span>
          </div>
        </div>
        <div className="col-span-2 flex items-center">
          <span className="text-sm text-zinc-500">{validation.validation_type}</span>
        </div>
        <div className="col-span-2 flex items-center justify-end">
          <span className="text-sm text-zinc-400 tabular-nums">
            {validation.results?.risk_score !== undefined ? `${validation.results.risk_score}%` : '\u2014'}
          </span>
        </div>
        <div className="col-span-2 flex items-center justify-end">
          <span className="text-sm text-zinc-500 tabular-nums">{formatDate(validation.created_at)}</span>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2">
          <StatusDot status={validation.status} />
          <span className="text-sm text-zinc-500 capitalize">{validation.status}</span>
        </div>
      </Link>
    </div>
  );
}

function CreateValidationModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [datasetId, setDatasetId] = useState('');
  const [validationType, setValidationType] = useState('comprehensive');
  const [modelSize, setModelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  const { data: datasetsData, isLoading: datasetsLoading } = useQuery({
    queryKey: ['datasets', 'all'],
    queryFn: () => datasetsApi.list(1, 100),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateValidationRequest) => validationsApi.create(data),
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetId) return;

    createMutation.mutate({
      dataset_id: datasetId,
      validation_type: validationType,
      options: {
        model_size: modelSize,
        priority,
      },
    });
  };

  const handleClose = () => {
    setDatasetId('');
    setValidationType('comprehensive');
    setModelSize('medium');
    setPriority('normal');
    onClose();
  };

  if (!isOpen) return null;

  const readyDatasets = datasetsData?.datasets?.filter(d => d.status === 'ready') || [];
  const selectClasses = cn(
    "w-full px-4 py-2.5 rounded-lg appearance-none",
    "bg-zinc-950 border border-zinc-800",
    "text-white text-sm",
    "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
    "transition-colors duration-200"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">New Validation</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Run a validation job on your dataset</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {createMutation.isError && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              Failed to create validation. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                disabled={datasetsLoading}
                className={selectClasses}
              >
                <option value="">Select a dataset</option>
                {readyDatasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.row_count?.toLocaleString()} rows)
                  </option>
                ))}
              </select>
              {!datasetsLoading && readyDatasets.length === 0 && (
                <p className="text-xs text-zinc-600">No datasets available. Upload a dataset first.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Validation Type</label>
              <select
                value={validationType}
                onChange={(e) => setValidationType(e.target.value)}
                className={selectClasses}
              >
                <option value="comprehensive">Comprehensive Analysis</option>
                <option value="distribution">Distribution Check</option>
                <option value="correlation">Feature Correlation</option>
                <option value="temporal">Temporal Consistency</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Model Size</label>
                <select
                  value={modelSize}
                  onChange={(e) => setModelSize(e.target.value as 'small' | 'medium' | 'large')}
                  className={selectClasses}
                >
                  <option value="small">Small (Fastest)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="large">Large (Most Accurate)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                  className={selectClasses}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!datasetId || createMutation.isPending}
                className={cn(
                  "px-5 py-2.5 rounded-lg font-medium text-sm",
                  "bg-gradient-to-r from-violet-600 to-violet-500 text-white",
                  "hover:from-violet-500 hover:to-violet-400",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-200 flex items-center gap-2"
                )}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Start Validation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ValidationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['validations', page],
    queryFn: () => validationsApi.list(page, 12),
    refetchInterval: 10000,
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['validations'] });
  };

  const activeValidations = data?.validations?.filter(v =>
    v.status === 'pending' || v.status === 'processing'
  ) || [];

  const completedValidations = data?.validations?.filter(v =>
    v.status === 'completed' || v.status === 'failed'
  ) || [];

  const totalPages = data?.pagination?.total_pages || 1;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Validations</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor and manage your data validation jobs</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedForCompare.length === 2 && (
            <Link
              href={`/dashboard/validations/compare?id1=${selectedForCompare[0]}&id2=${selectedForCompare[1]}`}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm",
                "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white",
                "hover:from-indigo-500 hover:to-indigo-400",
                "transition-all duration-200"
              )}
            >
              <GitCompare size={16} />
              Compare Selected
            </Link>
          )}
          {selectedForCompare.length > 0 && selectedForCompare.length < 2 && (
            <span className="text-xs text-zinc-500">Select 1 more to compare</span>
          )}
          <button
            onClick={() => setCreateModalOpen(true)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm",
              "bg-gradient-to-r from-violet-600 to-violet-500 text-white",
              "hover:from-violet-500 hover:to-violet-400",
              "transition-all duration-200"
            )}
          >
            <Plus size={16} />
            New Validation
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-amber-500/80">
          <AlertCircle size={14} />
          <span>Failed to load validations</span>
        </div>
      ) : !data?.validations?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-200 mb-1">No validations yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm">
            Create your first validation to start analyzing your datasets
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm",
              "bg-gradient-to-r from-violet-600 to-violet-500 text-white",
              "hover:from-violet-500 hover:to-violet-400",
              "transition-all duration-200"
            )}
          >
            <Plus size={16} />
            New Validation
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active jobs indicator */}
          {activeValidations.length > 0 && (
            <section className="flex items-center gap-3 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-zinc-400">
                {activeValidations.length} active {activeValidations.length === 1 ? 'job' : 'jobs'} running
              </span>
            </section>
          )}

          {/* Validation table */}
          <section>
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
                <div className="col-span-1"></div>
                <div className="col-span-3">Dataset</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2 text-right">Risk Score</div>
                <div className="col-span-2 text-right">Date</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              <div className="px-5">
                {data.validations.map((v) => (
                  <ValidationRow
                    key={v.id}
                    validation={v}
                    isSelected={selectedForCompare.includes(v.id)}
                    onToggleSelect={toggleCompareSelection}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateValidationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
