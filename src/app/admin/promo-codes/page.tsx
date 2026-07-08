'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { toast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Loader2, AlertCircle } from 'lucide-react';

// createPromoCode requires a numeric max_uses; use this as the "unlimited" sentinel
// when the field is left empty.
const UNLIMITED_USES = 1_000_000;

export default function AdminPromosPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'promo-codes'],
    queryFn: adminApi.listPromoCodes,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: ({ creditsGrant, uses }: { creditsGrant: number; uses: number }) =>
      adminApi.createPromoCode(code.toUpperCase(), creditsGrant, uses, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
      setShowForm(false);
      setCode(''); setCredits(''); setMaxUses(''); setDescription(''); setFormError('');
      toast.success('Promo code created');
    },
    onError: (err: Error) => toast.error('Failed to create promo code', err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updatePromoCode(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
      toast.success(variables.isActive ? 'Promo code activated' : 'Promo code deactivated');
    },
    onError: (err: Error) => toast.error('Failed to update promo code', err.message),
  });

  const handleCreate = () => {
    setFormError('');
    const creditsGrant = Number(credits);
    if (!code.trim()) {
      setFormError('Code is required.');
      return;
    }
    if (!credits.trim() || !Number.isFinite(creditsGrant) || creditsGrant <= 0) {
      setFormError('Credits must be a positive number.');
      return;
    }
    let uses = UNLIMITED_USES;
    if (maxUses.trim() !== '') {
      const parsed = Number(maxUses);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setFormError('Max uses must be a positive whole number, or leave it empty for unlimited.');
        return;
      }
      uses = parsed;
    }
    createMutation.mutate({ creditsGrant, uses });
  };

  const promos = data?.promo_codes ?? [];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Promo Codes</h1>
          <p className="text-sm text-zinc-500 mt-1">Create and manage promotional credit codes</p>
        </header>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Create Promo Code'}
        </button>
      </div>

      {showForm && (
        <div className="panel p-6 space-y-5">
          <p className="text-sm font-medium text-zinc-300">New Promo Code</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME50"
                className="w-full bg-zinc-900/50 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Credits Grant</label>
              <input
                type="number"
                min={1}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="500"
                className="w-full bg-zinc-900/50 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Max Uses (optional)</label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="w-full bg-zinc-900/50 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
              <p className="text-xs text-zinc-600 mt-1.5">Leave empty for an unlimited-use code.</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Welcome bonus for new users"
                className="w-full bg-zinc-900/50 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!code || !credits || createMutation.isPending}
            className="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Code'}
          </button>
          {formError && (
            <p className="text-sm text-rose-400">{formError}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : isError ? (
        <div className="panel p-8 text-center">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 mb-1">Failed to load promo codes</p>
          <p className="text-xs text-zinc-600 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-white/[0.06]">
                <div className="col-span-2">Code</div>
                <div className="col-span-2">Credits</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Uses</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Created</div>
              </div>
              {promos.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-600">No promo codes yet</div>
              ) : (
                promos.map((promo) => (
                  <div key={promo.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-2">
                      <span className="text-sm font-mono text-zinc-100">{promo.code}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-zinc-300 tabular-nums">{promo.credits_grant.toLocaleString()}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm text-zinc-500 truncate">{promo.description || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-zinc-400 tabular-nums">
                        {promo.current_uses}/{promo.max_uses >= UNLIMITED_USES ? '∞' : promo.max_uses}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <Switch
                        checked={promo.is_active}
                        onChange={(next) => toggleMutation.mutate({ id: promo.id, isActive: next })}
                        disabled={toggleMutation.isPending}
                        activeClass="bg-emerald-600"
                        size="sm"
                        label={`Toggle promo code ${promo.code}`}
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm text-zinc-500 tabular-nums">
                        {new Date(promo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
