'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { validationsApi, type ValidationDimensions } from '@/lib/api';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    if (value < 30) return '#22c55e'; // green
    if (value < 60) return '#eab308'; // yellow
    return '#ef4444'; // red
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
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/30"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          {/* Value arc */}
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
          <span className="text-4xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="font-semibold" style={{ color }}>{getRiskLevel(score)}</p>
        <p className="text-sm text-muted-foreground">Model Collapse Risk</p>
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
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis 
          dataKey="name" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
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
    if (value >= 80) return '#22c55e';
    if (value >= 60) return '#eab308';
    return '#ef4444';
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          width={130}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
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
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <Loader2 size={48} className="animate-spin mx-auto text-primary mb-4" />
      <h2 className="text-xl font-semibold mb-2">Validation in Progress</h2>
      <p className="text-muted-foreground mb-6">
        Analyzing your dataset for model collapse risks...
      </p>
      {progress !== undefined && (
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      )}
    </div>
  );
}

export default function ValidationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  const { data: validation, isLoading, error } = useQuery({
    queryKey: ['validation', resolvedParams.id],
    queryFn: () => validationsApi.get(resolvedParams.id),
    refetchInterval: (query) => {
      // Poll every 5 seconds if processing
      const data = query.state.data;
      return data?.status === 'processing' || data?.status === 'pending' ? 5000 : false;
    },
  });

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pending' },
    processing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Processing' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
    failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed' },
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
        Loading validation details...
      </div>
    );
  }

  if (error || !validation) {
    return (
      <div className="p-12 text-center text-destructive">
        <AlertCircle size={40} className="mx-auto mb-3" />
        <p className="font-medium">Validation not found</p>
        <Link href="/dashboard/validations">
          <Button variant="outline" className="mt-4">
            <ArrowLeft size={16} className="mr-2" />
            Back to Validations
          </Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[validation.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/validations">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {validation.dataset_name || 'Dataset'} Validation
            </h1>
            <p className="text-muted-foreground">{validation.validation_type}</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          config.bg,
          config.color
        )}>
          <StatusIcon size={16} className={validation.status === 'processing' ? 'animate-spin' : ''} />
          {config.label}
        </div>
      </div>

      {/* Processing State */}
      {(validation.status === 'pending' || validation.status === 'processing') && (
        <ProcessingView progress={validation.progress} />
      )}

      {/* Failed State */}
      {validation.status === 'failed' && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-destructive" size={24} />
            <div>
              <p className="font-semibold text-destructive">Validation Failed</p>
              <p className="text-sm text-muted-foreground">
                There was an error processing this validation. Please try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completed State - Results */}
      {validation.status === 'completed' && validation.results && (
        <>
          {/* Risk Score Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-6 text-center">Risk Score</h3>
              <RiskScoreGauge score={validation.results.risk_score} />
            </div>

            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quality Dimensions</h3>
              <DimensionsChart dimensions={validation.results.dimensions} />
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Dimension Breakdown</h3>
            <DimensionsBarChart dimensions={validation.results.dimensions} />
          </div>

          {/* Collapse Probability & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertTriangle className="text-yellow-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Collapse Probability</h3>
                  <p className="text-sm text-muted-foreground">
                    Likelihood of model degradation
                  </p>
                </div>
              </div>
              <p className="text-4xl font-bold">
                {(validation.results.collapse_probability * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {validation.results.collapse_probability < 0.1 
                  ? 'Very low risk of model collapse'
                  : validation.results.collapse_probability < 0.3
                  ? 'Moderate risk - consider data augmentation'
                  : 'High risk - data quality improvements recommended'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Actions to improve data quality
                  </p>
                </div>
              </div>
              {validation.results.recommendations?.length ? (
                <ul className="space-y-2">
                  {validation.results.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={14} className="text-primary mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific recommendations at this time.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Metadata */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Details</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium mt-1">
              {new Date(validation.created_at).toLocaleString()}
            </dd>
          </div>
          {validation.completed_at && (
            <div>
              <dt className="text-muted-foreground">Completed</dt>
              <dd className="font-medium mt-1">
                {new Date(validation.completed_at).toLocaleString()}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Model Size</dt>
            <dd className="font-medium mt-1 capitalize">
              {validation.options?.model_size || 'Medium'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Priority</dt>
            <dd className="font-medium mt-1 capitalize">
              {validation.options?.priority || 'Normal'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
