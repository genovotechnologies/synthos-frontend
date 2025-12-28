'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { warrantiesApi, type Warranty } from '@/lib/api';
import { 
  Shield, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function WarrantyCard({ warranty }: { warranty: Warranty }) {
  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Active' },
    expired: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Expired' },
    claimed: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Claimed' },
  };

  const config = statusConfig[warranty.status];
  const StatusIcon = config.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysRemaining = Math.ceil(
    (new Date(warranty.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg", config.bg)}>
            <Shield size={20} className={config.color} />
          </div>
          <div>
            <p className="font-medium">{warranty.dataset_name}</p>
            <p className="text-sm text-muted-foreground">{warranty.coverage_type}</p>
          </div>
        </div>
        <span className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
          config.bg,
          config.color
        )}>
          <StatusIcon size={12} />
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
        <div>
          <p className="text-xs text-muted-foreground">Coverage</p>
          <p className="text-lg font-semibold">{formatCurrency(warranty.coverage_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Risk Score</p>
          <p className={cn(
            "text-lg font-semibold",
            warranty.risk_score < 30 ? "text-green-500" :
            warranty.risk_score < 60 ? "text-yellow-500" : "text-red-500"
          )}>
            {warranty.risk_score}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Premium Paid</p>
          <p className="font-medium">{formatCurrency(warranty.premium_paid)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {warranty.status === 'active' ? 'Expires' : 'Expired'}
          </p>
          <p className="font-medium">{formatDate(warranty.valid_until)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        {warranty.status === 'active' && daysRemaining > 0 && (
          <p className="text-sm text-muted-foreground">
            {daysRemaining} days remaining
          </p>
        )}
        {warranty.status === 'expired' && (
          <p className="text-sm text-muted-foreground">
            Coverage ended
          </p>
        )}
        <Link
          href={`/dashboard/validations/${warranty.validation_id}`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View validation
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}

export default function WarrantiesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['warranties', page],
    queryFn: () => warrantiesApi.list(page, 12),
  });

  // Group warranties by status
  const activeWarranties = data?.warranties?.filter(w => w.status === 'active') || [];
  const otherWarranties = data?.warranties?.filter(w => w.status !== 'active') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Warranties</h1>
        <p className="text-muted-foreground">
          Manage your data quality warranties and coverage
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Shield size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Warranties</p>
              <p className="text-2xl font-bold">{activeWarranties.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Coverage</p>
              <p className="text-2xl font-bold">
                ${activeWarranties.reduce((sum, w) => sum + w.coverage_amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Risk Score</p>
              <p className="text-2xl font-bold">
                {activeWarranties.length 
                  ? Math.round(activeWarranties.reduce((sum, w) => sum + w.risk_score, 0) / activeWarranties.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-2" size={24} />
          Loading warranties...
        </div>
      ) : error ? (
        <div className="p-12 text-center text-destructive">
          Failed to load warranties
        </div>
      ) : !data?.warranties?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <Shield size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No warranties yet</p>
          <p className="text-sm mt-1">
            Complete a validation to get warranty coverage for your datasets
          </p>
          <Link href="/dashboard/validations">
            <Button className="mt-4">
              Create Validation
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeWarranties.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                Active Coverage ({activeWarranties.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWarranties.map((warranty) => (
                  <WarrantyCard key={warranty.id} warranty={warranty} />
                ))}
              </div>
            </div>
          )}

          {otherWarranties.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Past Warranties ({otherWarranties.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherWarranties.map((warranty) => (
                  <WarrantyCard key={warranty.id} warranty={warranty} />
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
    </div>
  );
}
