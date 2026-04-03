'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { Plus, X, Loader2 } from 'lucide-react';

export default function AdminPromosPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'promo-codes'],
    queryFn: adminApi.listPromoCodes,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createPromoCode(code.toUpperCase(), Number(credits), Number(maxUses), description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
      setShowForm(false);
      setCode(''); setCredits(''); setMaxUses(''); setDescription('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updatePromoCode(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] }),
  });

  const promos = data?.promo_codes ?? [];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Promo Codes</h1>
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
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-5">
          <p className="text-sm font-medium text-zinc-300">New Promo Code</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME50"
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Credits Grant</label>
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="500"
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Max Uses</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="100"
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Welcome bonus for new users"
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!code || !credits || !maxUses || createMutation.isPending}
            className="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Code'}
          </button>
          {createMutation.isError && (
            <p className="text-sm text-rose-400">Failed to create promo code. Please try again.</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="border-t border-zinc-800/50">
          <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
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
              <div key={promo.id} className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors items-center">
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
                  <span className="text-sm text-zinc-400 tabular-nums">{promo.current_uses}/{promo.max_uses}</span>
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => toggleMutation.mutate({ id: promo.id, isActive: !promo.is_active })}
                    className={cn(
                      'relative w-9 h-5 rounded-full transition-colors',
                      promo.is_active ? 'bg-emerald-600' : 'bg-zinc-700'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                      promo.is_active ? 'left-[18px]' : 'left-0.5'
                    )} />
                  </button>
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
      )}
    </div>
  );
}
