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
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', animate: false },
    processing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', animate: true },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', animate: false },
    failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', animate: false },
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
      className="block bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg", config.bg)}>
            <Icon 
              size={20} 
              className={cn(config.color, config.animate && "animate-spin")} 
            />
          </div>
          <div>
            <p className="font-medium group-hover:text-primary transition-colors">
              {validation.dataset_name || 'Dataset Validation'}
            </p>
            <p className="text-sm text-muted-foreground">{validation.validation_type}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className={cn(
          "px-2.5 py-1 text-xs font-medium rounded-full capitalize",
          config.bg,
          config.color
        )}>
          {validation.status}
        </span>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {validation.results?.risk_score !== undefined && (
            <span className={cn(
              "font-medium",
              validation.results.risk_score < 30 ? "text-green-500" :
              validation.results.risk_score < 60 ? "text-yellow-500" : "text-red-500"
            )}>
              Risk: {validation.results.risk_score}%
            </span>
          )}
          <span>{formatDate(validation.created_at)}</span>
        </div>
      </div>

      {validation.status === 'processing' && validation.progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{validation.progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
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
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">New Validation</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {createMutation.isError && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
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
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!datasetId || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Start Validation'}
            </Button>
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
          <h1 className="text-2xl font-bold">Validations</h1>
          <p className="text-muted-foreground">
            Monitor and manage your data validation jobs
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          New Validation
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-2" size={24} />
          Loading validations...
        </div>
      ) : error ? (
        <div className="p-12 text-center text-destructive">
          Failed to load validations
        </div>
      ) : !data?.validations?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No validations yet</p>
          <p className="text-sm mt-1">Create your first validation to get started</p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4"
          >
            <Plus size={18} className="mr-2" />
            New Validation
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {activeValidations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-primary" />
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
              <h2 className="text-lg font-semibold mb-4">
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
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {data.pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.total_pages}
              >
                Next
              </Button>
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
