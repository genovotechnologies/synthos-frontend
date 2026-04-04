'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { validationsApi } from '@/lib/api';
import type { Validation, ValidationDimensions } from '@/lib/api';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

function DeltaIndicator({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) {
    return (
      <span className="flex items-center gap-1 text-xs text-zinc-500">
        <Minus size={12} />
        <span className="tabular-nums">0</span>
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <ArrowUpRight size={12} />
        <span className="tabular-nums">+{value.toFixed(1)}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-rose-400">
      <ArrowDownRight size={12} />
      <span className="tabular-nums">{value.toFixed(1)}</span>
    </span>
  );
}

function ComparisonBarChart({
  dimensions1,
  dimensions2,
  name1,
  name2,
}: {
  dimensions1: ValidationDimensions;
  dimensions2: ValidationDimensions;
  name1: string;
  name2: string;
}) {
  const data = [
    {
      name: 'Distribution',
      [name1]: dimensions1.distribution_fidelity,
      [name2]: dimensions2.distribution_fidelity,
    },
    {
      name: 'Correlation',
      [name1]: dimensions1.feature_correlation,
      [name2]: dimensions2.feature_correlation,
    },
    {
      name: 'Temporal',
      [name1]: dimensions1.temporal_consistency,
      [name2]: dimensions2.temporal_consistency,
    },
    {
      name: 'Outliers',
      [name1]: dimensions1.outlier_detection,
      [name2]: dimensions2.outlier_detection,
    },
    {
      name: 'Schema',
      [name1]: dimensions1.schema_compliance,
      [name2]: dimensions2.schema_compliance,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#71717a', fontSize: 11 }}
          width={90}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: '#e4e4e7',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
        />
        <Bar dataKey={name1} fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={12} />
        <Bar dataKey={name2} fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ValidationSelector({
  excludeId,
  selectedId,
  onSelect,
}: {
  excludeId?: string;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['validations', 'all-completed'],
    queryFn: () => validationsApi.list(1, 100),
  });

  const completedValidations = data?.validations?.filter(
    (v) => v.status === 'completed' && v.id !== excludeId
  ) || [];

  return (
    <div className="relative">
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={isLoading}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg appearance-none',
          'bg-zinc-950 border border-zinc-800',
          'text-white text-sm',
          'focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20',
          'transition-colors duration-200 pr-10'
        )}
      >
        <option value="">Select a validation to compare</option>
        {completedValidations.map((v) => (
          <option key={v.id} value={v.id}>
            {v.dataset_name || 'Untitled'} - Risk: {v.results?.risk_score ?? '?'}% ({new Date(v.created_at).toLocaleDateString()})
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const urlId1 = searchParams.get('id1') || '';
  const urlId2 = searchParams.get('id2') || '';

  const [selectedId2, setSelectedId2] = useState(urlId2);
  const effectiveId2 = selectedId2 || urlId2;

  const { data: validation1, isLoading: loading1 } = useQuery({
    queryKey: ['validation', urlId1],
    queryFn: () => validationsApi.get(urlId1),
    enabled: !!urlId1,
  });

  const { data: validation2, isLoading: loading2 } = useQuery({
    queryKey: ['validation', effectiveId2],
    queryFn: () => validationsApi.get(effectiveId2),
    enabled: !!effectiveId2,
  });

  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ['validations', 'compare', urlId1, effectiveId2],
    queryFn: () => validationsApi.compare(urlId1, effectiveId2),
    enabled: !!urlId1 && !!effectiveId2,
  });

  const isLoading = loading1 || loading2;
  const hasBoth = validation1 && validation2;
  const bothCompleted =
    hasBoth &&
    validation1.status === 'completed' &&
    validation2.status === 'completed' &&
    validation1.results &&
    validation2.results;

  const dimensions: { key: keyof ValidationDimensions; label: string }[] = [
    { key: 'distribution_fidelity', label: 'Distribution Fidelity' },
    { key: 'feature_correlation', label: 'Feature Correlation' },
    { key: 'temporal_consistency', label: 'Temporal Consistency' },
    { key: 'outlier_detection', label: 'Outlier Detection' },
    { key: 'schema_compliance', label: 'Schema Compliance' },
  ];

  const riskDelta = bothCompleted
    ? validation2.results!.risk_score - validation1.results!.risk_score
    : 0;

  const name1 = validation1?.dataset_name || 'Validation 1';
  const name2 = validation2?.dataset_name || 'Validation 2';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/validations"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div>
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">
            Validation Comparison
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Compare quality scores side by side
          </p>
        </div>
      </div>

      {/* Select second validation if not provided */}
      {urlId1 && !effectiveId2 && (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
          <p className="text-sm text-zinc-300 mb-3">Select a second validation to compare with:</p>
          <div className="max-w-md">
            <ValidationSelector
              excludeId={urlId1}
              selectedId={selectedId2}
              onSelect={setSelectedId2}
            />
          </div>
        </div>
      )}

      {!urlId1 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle size={40} className="text-zinc-600 mb-3" />
          <p className="font-medium text-zinc-300">No validations selected</p>
          <p className="text-sm text-zinc-500 mt-1">
            Go to the validations page and select two validations to compare.
          </p>
          <Link
            href="/dashboard/validations"
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Validations
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      )}

      {bothCompleted && (
        <>
          {/* Side-by-side scores */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {/* Validation 1 */}
            <div className="lg:col-span-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Validation A</p>
              <p className="text-sm font-medium text-zinc-200 mb-4 truncate">{name1}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold tabular-nums text-zinc-100">
                  {validation1.results!.risk_score}%
                </span>
                <span className="text-sm text-zinc-500 ml-2">risk score</span>
              </div>
              <div className="space-y-3">
                {dimensions.map((dim) => (
                  <div key={dim.key} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{dim.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${validation1.results!.dimensions[dim.key]}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 tabular-nums w-8 text-right">
                        {validation1.results!.dimensions[dim.key]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-4 tabular-nums">
                {new Date(validation1.created_at).toLocaleString()}
              </p>
            </div>

            {/* Delta column */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center gap-3 py-4">
              <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Delta</p>
              {dimensions.map((dim) => (
                <div key={dim.key} className="flex items-center justify-center h-[22px]">
                  <DeltaIndicator
                    value={
                      validation2.results!.dimensions[dim.key] -
                      validation1.results!.dimensions[dim.key]
                    }
                  />
                </div>
              ))}
            </div>

            {/* Validation 2 */}
            <div className="lg:col-span-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Validation B</p>
              <p className="text-sm font-medium text-zinc-200 mb-4 truncate">{name2}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold tabular-nums text-zinc-100">
                  {validation2.results!.risk_score}%
                </span>
                <span className="text-sm text-zinc-500 ml-2">risk score</span>
              </div>
              <div className="space-y-3">
                {dimensions.map((dim) => (
                  <div key={dim.key} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{dim.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${validation2.results!.dimensions[dim.key]}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 tabular-nums w-8 text-right">
                        {validation2.results!.dimensions[dim.key]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-4 tabular-nums">
                {new Date(validation2.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Bar chart comparison */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
            <h3 className="font-medium text-zinc-300 mb-4 text-sm">Dimension Comparison</h3>
            <ComparisonBarChart
              dimensions1={validation1.results!.dimensions}
              dimensions2={validation2.results!.dimensions}
              name1={name1}
              name2={name2}
            />
          </div>

          {/* Summary card */}
          <div
            className={cn(
              'rounded-xl border p-6 text-center',
              riskDelta < 0
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : riskDelta > 0
                ? 'bg-rose-500/5 border-rose-500/20'
                : 'bg-zinc-900/30 border-zinc-800/50'
            )}
          >
            <p className="text-sm text-zinc-400 mb-2">Overall Quality Change</p>
            <div className="flex items-center justify-center gap-3">
              {riskDelta < 0 ? (
                <>
                  <ArrowUpRight size={24} className="text-emerald-400" />
                  <span className="text-2xl font-bold text-emerald-400">
                    Improved by {Math.abs(riskDelta).toFixed(1)} points
                  </span>
                </>
              ) : riskDelta > 0 ? (
                <>
                  <ArrowDownRight size={24} className="text-rose-400" />
                  <span className="text-2xl font-bold text-rose-400">
                    Degraded by {riskDelta.toFixed(1)} points
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-zinc-400">No change in risk score</span>
              )}
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Risk score: {validation1.results!.risk_score}% → {validation2.results!.risk_score}%
              {riskDelta < 0
                ? ' (lower is better)'
                : ''}
            </p>
          </div>
        </>
      )}

      {hasBoth && !bothCompleted && !isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="text-amber-400" size={20} />
          <p className="text-sm text-zinc-300">
            Both validations must be completed to compare results.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
