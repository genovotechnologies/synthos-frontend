'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

type Granularity = 'day' | 'week' | 'month';
type MetricKey = 'signups' | 'validations' | 'revenue';

// Single-series charts, one per metric; colors validated against #09090b
// (lightness band, chroma, CVD separation, contrast all pass).
const METRICS: { key: MetricKey; label: string; color: string; format: (v: number) => string }[] = [
  { key: 'signups', label: 'Signups', color: '#8b5cf6', format: (v) => v.toLocaleString() },
  { key: 'validations', label: 'Validations', color: '#059669', format: (v) => v.toLocaleString() },
  { key: 'revenue', label: 'Revenue', color: '#0284c7', format: (v) => `$${v.toLocaleString()}` },
];

const RANGE_PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Module-scope date math keeps component render pure for the React compiler.
function presetRange(days: number): { from: string; to: string } {
  const now = Date.now();
  return {
    from: isoDate(new Date(now - days * 86_400_000)),
    to: isoDate(new Date(now)),
  };
}

const INITIAL_RANGE = presetRange(30);

function formatBucket(bucket: string, granularity: Granularity): string {
  const d = new Date(bucket);
  if (granularity === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminGrowthPage() {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [from, setFrom] = useState(INITIAL_RANGE.from);
  const [to, setTo] = useState(INITIAL_RANGE.to);

  const rangeInvalid = new Date(from).getTime() > new Date(to).getTime();

  const applyPreset = (days: number) => {
    const range = presetRange(days);
    setFrom(range.from);
    setTo(range.to);
    setGranularity(days > 60 ? 'week' : 'day');
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Growth</h1>
        <p className="text-sm text-zinc-500 mt-1">Signups, validations, and revenue over time</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex items-center gap-1.5">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.days)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium text-zinc-400 bg-white/[0.03] ring-1 ring-white/[0.07] hover:text-zinc-100 hover:bg-white/[0.06] transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <label className="block">
            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">From</span>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 focus:outline-none focus:ring-rose-500/40 [color-scheme:dark]"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">To</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 focus:outline-none focus:ring-rose-500/40 [color-scheme:dark]"
            />
          </label>
        </div>
        <label className="block">
          <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Granularity</span>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 focus:outline-none focus:ring-rose-500/40 appearance-none cursor-pointer pr-8"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </label>
      </div>

      {rangeInvalid ? (
        <p className="text-sm text-rose-400">The start date must be before the end date.</p>
      ) : (
        <div className="space-y-12">
          {METRICS.map((metric) => (
            <MetricChart
              key={metric.key}
              metric={metric}
              from={from}
              to={to}
              granularity={granularity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MetricChart({
  metric,
  from,
  to,
  granularity,
}: {
  metric: (typeof METRICS)[number];
  from: string;
  to: string;
  granularity: Granularity;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'metrics', metric.key, from, to, granularity],
    queryFn: () => adminApi.getMetrics(metric.key, from, to, granularity),
    retry: 1,
    staleTime: 60_000,
  });

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        bucket: formatBucket(point.bucket, granularity),
        value: point.value,
      })),
    [data?.series, granularity]
  );

  const total = useMemo(() => (data?.series ?? []).reduce((sum, p) => sum + p.value, 0), [data?.series]);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{metric.label}</p>
          {data?.mocked && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/20">
              <FlaskConical className="w-2.5 h-2.5" />
              Sample data — metrics endpoint not live
            </span>
          )}
        </div>
        {data && (
          <p className="text-sm text-zinc-400 tabular-nums">
            {metric.format(total)} <span className="text-zinc-600">total in range</span>
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center text-sm text-rose-400">
          Failed to load {metric.label.toLowerCase()} — try a different range.
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-zinc-600">
          No data in this range.
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
              <XAxis
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 11 }}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#3f3f46', fontSize: 10 }}
                width={44}
                tickCount={4}
                allowDecimals={false}
                tickFormatter={(v: number) => (metric.key === 'revenue' ? `$${v}` : String(v))}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="surface px-3.5 py-2.5">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
                      <p className={cn('text-sm font-medium text-zinc-100 tabular-nums')}>
                        {metric.format(Number(payload[0]?.value ?? 0))}
                        <span className="text-zinc-500 font-normal"> {metric.label.toLowerCase()}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2}
                fill={`url(#grad-${metric.key})`}
                activeDot={{ r: 4, fill: metric.color, stroke: '#09090b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
