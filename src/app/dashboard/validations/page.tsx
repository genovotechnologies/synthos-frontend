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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import Link from 'next/link';

function ValidationCard({ validation }: { validation: Validation }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', dot: 'bg-yellow-400', animate: false },
    processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-400', animate: true },
    completed: { icon: CheckCircle, color: 'text-mint', bg: 'bg-mint/20', dot: 'bg-mint', animate: false },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-400', animate: false },
  };

  const config = statusConfig[validation.status];
  const Icon = config.icon;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link
      href={`/dashboard/validations/${validation.id}`}
      className="block glass-dark rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", config.bg)}>
            <Icon 
              size={20} 
              className={cn(config.color, config.animate && "animate-spin")} 
            />
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-violet transition-colors">
              {validation.dataset_name || 'Dataset Validation'}
            </p>
            <p className="text-sm text-white/50">{validation.validation_type}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-white/40 group-hover:text-violet transition-colors" />
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full capitalize",
          config.bg,
          config.color
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
          {validation.status}
        </span>
        
        <div className="flex items-center gap-4 text-sm text-white/50">
          {validation.results?.risk_score !== undefined && (
            <span className={cn(
              "font-medium",
              validation.results.risk_score < 30 ? "text-mint" :
              validation.results.risk_score < 60 ? "text-yellow-400" : "text-red-400"
            )}>
              Risk: {validation.results.risk_score}%
            </span>
          )}
          <span>{formatDate(validation.created_at)}</span>
        </div>
      </div>

      {validation.status === 'processing' && validation.progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>Progress</span>
            <span>{validation.progress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet to-mint rounded-full transition-all duration-300"
              style={{ width: `${validation.progress}%` }}
            />
          </div>
        </div>
      )}
    </Link>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative glass-dark rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">New Validation</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {createMutation.isError && (
          <div className="mb-4 p-4 bg-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            Failed to create validation. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="dataset">Dataset</Label>
            <Select
              id="dataset"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              disabled={datasetsLoading}
            >
              <option value="">Select a dataset</option>
              {readyDatasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.row_count?.toLocaleString()} rows)
                </option>
              ))}
            </Select>
            {!datasetsLoading && readyDatasets.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No datasets available. Upload a dataset first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Validation Type</Label>
            <Select
              id="type"
              value={validationType}
              onChange={(e) => setValidationType(e.target.value)}
            >
              <option value="comprehensive">Comprehensive Analysis</option>
              <option value="distribution">Distribution Check</option>
              <option value="correlation">Feature Correlation</option>
              <option value="temporal">Temporal Consistency</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model Size</Label>
              <Select
                id="model"
                value={modelSize}
                onChange={(e) => setModelSize(e.target.value as 'small' | 'medium' | 'large')}
              >
                <option value="small">Small (Fastest)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="large">Large (Most Accurate)</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!datasetId || createMutation.isPending}
              className={cn(
                "px-5 py-2.5 rounded-xl font-medium transition-all duration-300",
                "bg-gradient-to-r from-violet to-violet/80 text-white",
                "hover:shadow-lg hover:shadow-violet/30",
                "active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              )}
            >
              {createMutation.isPending ? 'Creating...' : 'Start Validation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ValidationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['validations', page],
    queryFn: () => validationsApi.list(page, 12),
    refetchInterval: 10000, // Poll for updates
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['validations'] });
  };

  // Group validations by status
  const activeValidations = data?.validations?.filter(v => 
    v.status === 'pending' || v.status === 'processing'
  ) || [];
  
  const completedValidations = data?.validations?.filter(v => 
    v.status === 'completed' || v.status === 'failed'
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Validations</h1>
          <p className="text-white/50">
            Monitor and manage your data validation jobs
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
            "bg-gradient-to-r from-violet to-violet/80 text-white",
            "shadow-lg shadow-violet/30",
            "hover:shadow-xl hover:shadow-violet/40 hover:scale-[1.02]",
            "active:scale-95 active:shadow-inner"
          )}
        >
          <Plus size={18} />
          New Validation
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-violet" size={32} />
          <p className="text-white/50">Loading validations...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-red-400">
          Failed to load validations
        </div>
      ) : !data?.validations?.length ? (
        <div className="glass-dark rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <CheckCircle size={40} className="text-white/30" />
          </div>
          <p className="font-medium text-white mb-1">No validations yet</p>
          <p className="text-sm text-white/50 mb-6">Create your first validation to get started</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
              "bg-gradient-to-r from-violet to-violet/80 text-white",
              "shadow-lg shadow-violet/30",
              "hover:shadow-xl hover:shadow-violet/40"
            )}
          >
            <Plus size={18} />
            New Validation
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {activeValidations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Loader2 size={18} className="animate-spin text-violet" />
                Active Jobs ({activeValidations.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeValidations.map((validation) => (
                  <ValidationCard key={validation.id} validation={validation} />
                ))}
              </div>
            </div>
          )}

          {completedValidations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-white">
                Completed ({completedValidations.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedValidations.map((validation) => (
                  <ValidationCard key={validation.id} validation={validation} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-white/50 px-4">
                Page {page} of {data.pagination.total_pages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.total_pages}
                className="px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
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
