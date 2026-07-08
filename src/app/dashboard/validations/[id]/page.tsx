'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { validationsApi, warrantiesApi, type ValidationDimensions } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ValidationPipeline, FindingsSection, EditableValidationName } from '@/components/dashboard/validation-extras';
import { toast } from '@/components/ui/toast';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Shield,
  GitCompare,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

function RiskScoreGauge({ score }: { score: number }) {
  const getColor = (value: number) => {
    if (value < 30) return '#10b981';
    if (value < 60) return '#f59e0b';
    return '#f43f5e';
  };

  const getRiskLevel = (value: number) => {
    if (value < 30) return 'Low Risk';
    if (value < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-135">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-zinc-800"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-zinc-100" style={{ color }}>{score}</span>
          <span className="text-xs text-zinc-600">/ 100</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="font-semibold" style={{ color }}>{getRiskLevel(score)}</p>
        <p className="text-sm text-zinc-500">Model Collapse Risk</p>
      </div>
    </div>
  );
}

function DimensionsChart({ dimensions }: { dimensions: ValidationDimensions }) {
  const data = [
    { name: 'Distribution', value: dimensions.distribution_fidelity, fullMark: 100 },
    { name: 'Correlation', value: dimensions.feature_correlation, fullMark: 100 },
    { name: 'Temporal', value: dimensions.temporal_consistency, fullMark: 100 },
    { name: 'Outliers', value: dimensions.outlier_detection, fullMark: 100 },
    { name: 'Schema', value: dimensions.schema_compliance, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#27272a" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fill: '#71717a', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#52525b', fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#a78bfa"
          fill="#a78bfa"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function DimensionsBarChart({ dimensions }: { dimensions: ValidationDimensions }) {
  const data = [
    { name: 'Distribution Fidelity', value: dimensions.distribution_fidelity },
    { name: 'Feature Correlation', value: dimensions.feature_correlation },
    { name: 'Temporal Consistency', value: dimensions.temporal_consistency },
    { name: 'Outlier Detection', value: dimensions.outlier_detection },
    { name: 'Schema Compliance', value: dimensions.schema_compliance },
  ];

  const getBarColor = (value: number) => {
    if (value >= 80) return '#10b981';
    if (value >= 60) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#71717a', fontSize: 11 }}
          width={130}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: '#e4e4e7',
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ProcessingView({ progress }: { progress?: number }) {
  return (
    <div className="panel p-8 text-center">
      <Loader2 size={48} className="animate-spin mx-auto text-violet-400 mb-4" />
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">Validation in Progress</h2>
      <p className="text-zinc-500 mb-6">
        Analyzing your dataset for model collapse risks...
      </p>
      {progress !== undefined && (
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-zinc-500 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function ValidationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const queryClient = useQueryClient();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [warrantyDialogOpen, setWarrantyDialogOpen] = useState(false);
  const [requestingWarranty, setRequestingWarranty] = useState(false);
  const [warrantyRequested, setWarrantyRequested] = useState(false);

  const { data: validation, isLoading, error } = useQuery({
    queryKey: ['validation', resolvedParams.id],
    queryFn: () => validationsApi.get(resolvedParams.id),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'processing' || data?.status === 'pending' ? 5000 : false;
    },
  });

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
    processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing' },
    completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
    failed: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Failed' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error || !validation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={40} className="text-zinc-600 mb-3" />
        <p className="font-medium text-zinc-300">Validation not found</p>
        <Link
          href="/dashboard/validations"
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Validations
        </Link>
      </div>
    );
  }

  const config = statusConfig[validation.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/validations"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
              <EditableValidationName
                validation={validation}
                fallback={`${validation.dataset_name || 'Dataset'} Validation`}
                textClassName="text-2xl font-semibold text-zinc-100 tracking-tight"
                inputClassName="text-xl font-semibold"
              />
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">{validation.validation_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(validation.status === 'completed' || validation.status === 'failed') && validation.dataset_id && (
            <Link
              href={`/dashboard/validations?dataset=${validation.dataset_id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
            >
              <RotateCw size={13} />
              Re-validate
            </Link>
          )}
          {(validation.status === 'pending' || validation.status === 'processing') && (
            <button
              onClick={() => setCancelDialogOpen(true)}
              className="px-3 py-1.5 text-sm text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
            config.bg,
            config.color
          )}>
            <StatusIcon size={14} className={validation.status === 'processing' ? 'animate-spin' : ''} />
            {config.label}
          </div>
        </div>
      </div>

      {/* Processing State — live pipeline when the backend supports it */}
      {(validation.status === 'pending' || validation.status === 'processing') && (
        <ValidationPipeline
          validationId={validation.id}
          active
          fallback={<ProcessingView progress={validation.progress} />}
        />
      )}

      {/* Failed State */}
      {validation.status === 'failed' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle className="text-rose-400" size={20} />
          <div>
            <p className="font-medium text-rose-400">Validation Failed</p>
            <p className="text-sm text-zinc-500 mt-0.5">
              There was an error processing this validation. Please try again.
            </p>
          </div>
        </div>
      )}

      {/* Completed State - Results */}
      {validation.status === 'completed' && validation.results && (
        <>
          {/* Risk Score Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="panel p-6">
              <h3 className="font-medium text-zinc-300 mb-6 text-center text-sm">Risk Score</h3>
              <RiskScoreGauge score={validation.results.risk_score} />
            </div>

            <div className="lg:col-span-2 panel p-6">
              <h3 className="font-medium text-zinc-300 mb-4 text-sm">Quality Dimensions</h3>
              <DimensionsChart dimensions={validation.results.dimensions} />
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="panel p-6">
            <h3 className="font-medium text-zinc-300 mb-4 text-sm">Dimension Breakdown</h3>
            <DimensionsBarChart dimensions={validation.results.dimensions} />
          </div>

          {/* Collapse Probability & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="text-amber-400" size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200 text-sm">Collapse Probability</h3>
                  <p className="text-xs text-zinc-500">Likelihood of model degradation</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-zinc-100 tabular-nums">
                {(validation.results.collapse_probability * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                {validation.results.collapse_probability < 0.1
                  ? 'Very low risk of model collapse'
                  : validation.results.collapse_probability < 0.3
                  ? 'Moderate risk - consider data augmentation'
                  : 'High risk - data quality improvements recommended'}
              </p>
            </div>

            <div className="panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Shield className="text-violet-400" size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200 text-sm">Recommendations</h3>
                  <p className="text-xs text-zinc-500">Actions to improve data quality</p>
                </div>
              </div>
              {validation.results.recommendations?.length ? (
                <ul className="space-y-2">
                  {validation.results.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={14} className="text-violet-400 mt-0.5 shrink-0" />
                      <span className="text-zinc-400">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-600">
                  No specific recommendations at this time.
                </p>
              )}
            </div>
          </div>

          {/* Row-level findings (backend ≥ findings endpoint) */}
          <FindingsSection validationId={validation.id} />

          {/* Warranty Request */}
          {validation.results.risk_score < 50 && (
            <div className="panel p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Shield className="text-emerald-400" size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-200 text-sm">Quality Warranty Available</h3>
                    <p className="text-xs text-zinc-500">Your data qualifies for a performance warranty (risk score under 50%)</p>
                  </div>
                </div>
                {warrantyRequested ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    <CheckCircle size={14} />
                    Warranty requested
                  </span>
                ) : (
                  <button
                    onClick={() => setWarrantyDialogOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Request Warranty
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Compare Link */}
          <div className="flex justify-center">
            <Link
              href={`/dashboard/validations/compare?id1=${resolvedParams.id}`}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm",
                "border border-zinc-800 text-zinc-400",
                "hover:border-zinc-700 hover:text-zinc-200",
                "transition-all duration-200"
              )}
            >
              <GitCompare size={16} />
              Compare with another validation
            </Link>
          </div>
        </>
      )}

      {/* Metadata */}
      <div className="panel p-6">
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">Details</p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <dt className="text-zinc-600 text-xs">Created</dt>
            <dd className="font-medium text-zinc-300 mt-1 tabular-nums">
              {new Date(validation.created_at).toLocaleString()}
            </dd>
          </div>
          {validation.completed_at && (
            <div>
              <dt className="text-zinc-600 text-xs">Completed</dt>
              <dd className="font-medium text-zinc-300 mt-1 tabular-nums">
                {new Date(validation.completed_at).toLocaleString()}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-zinc-600 text-xs">Model Size</dt>
            <dd className="font-medium text-zinc-300 mt-1 capitalize">
              {validation.options?.model_size || 'Medium'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-600 text-xs">Priority</dt>
            <dd className="font-medium text-zinc-300 mt-1 capitalize">
              {validation.options?.priority || 'Normal'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Cancel Validation Confirmation */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancel this validation?"
        description="The validation job will be stopped and cannot be resumed."
        confirmLabel="Cancel validation"
        cancelLabel="Keep running"
        variant="danger"
        loading={cancelling}
        onConfirm={async () => {
          setCancelling(true);
          try {
            await validationsApi.cancel(validation.id);
            queryClient.invalidateQueries({ queryKey: ['validation', resolvedParams.id] });
            queryClient.invalidateQueries({ queryKey: ['validations'] });
            toast.success('Validation cancelled');
            setCancelDialogOpen(false);
          } catch (err: unknown) {
            toast.error('Failed to cancel validation', getErrorMessage(err, 'Please try again.'));
          } finally {
            setCancelling(false);
          }
        }}
        onClose={() => !cancelling && setCancelDialogOpen(false)}
      />

      {/* Warranty Request Confirmation */}
      <ConfirmDialog
        open={warrantyDialogOpen}
        title="Request quality warranty?"
        description="A performance warranty will be requested for this validation. Warranty requests are billed in credits per your plan."
        confirmLabel="Request warranty"
        loading={requestingWarranty}
        onConfirm={async () => {
          setRequestingWarranty(true);
          try {
            await warrantiesApi.request(validation.id, 'performance');
            setWarrantyRequested(true);
            queryClient.invalidateQueries({ queryKey: ['warranties'] });
            queryClient.invalidateQueries({ queryKey: ['validation', resolvedParams.id] });
            queryClient.invalidateQueries({ queryKey: ['credits'] });
            toast.success('Warranty requested', 'You can track it on the Warranties page.');
            setWarrantyDialogOpen(false);
          } catch (err: unknown) {
            toast.error('Failed to request warranty', getErrorMessage(err, 'Please try again.'));
          } finally {
            setRequestingWarranty(false);
          }
        }}
        onClose={() => !requestingWarranty && setWarrantyDialogOpen(false)}
      />
    </div>
  );
}
