'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditsApi, CreditPackage, CreditTransaction } from '@/lib/api/credits';
import { cn } from '@/lib/utils';
import {
  Coins, CreditCard, History, Zap, Shield, TrendingUp,
  Check, ArrowRight, Loader2, AlertCircle, Tag, Star, Gift
} from 'lucide-react';

function formatCredits(n: number) {
  return n.toLocaleString();
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

const packageIcons: Record<string, typeof Star> = {
  pkg_starter: Zap,
  pkg_professional: TrendingUp,
  pkg_business: Shield,
  pkg_enterprise: Star,
};

const packageColors: Record<string, string> = {
  pkg_starter: 'from-blue-600 to-blue-500',
  pkg_professional: 'from-violet-600 to-violet-500',
  pkg_business: 'from-amber-600 to-amber-500',
  pkg_enterprise: 'from-emerald-600 to-emerald-500',
};

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: creditsApi.getBalance,
  });

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['credits', 'packages'],
    queryFn: creditsApi.getPackages,
  });

  const { data: historyData } = useQuery({
    queryKey: ['credits', 'history'],
    queryFn: () => creditsApi.getHistory(1, 10),
  });

  const purchaseMutation = useMutation({
    mutationFn: (packageId: string) => creditsApi.purchase(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });

  const redeemMutation = useMutation({
    mutationFn: (code: string) => creditsApi.redeemPromo(code),
    onSuccess: (data) => {
      setPromoMessage({ type: 'success', text: data.message });
      setPromoCode('');
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
    onError: (err: Error) => {
      setPromoMessage({ type: 'error', text: err.message || 'Invalid promo code' });
    },
  });

  // Auto-redeem promo from URL params (after registration)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promo = params.get('promo');
    if (promo && balance && balance.lifetime_purchased === 0) {
      redeemMutation.mutate(promo);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [balance]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Billing & Credits</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your credits, purchase packages, and view transaction history</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-violet-600/20 to-violet-800/10 border border-violet-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Coins size={20} className="text-violet-400" />
            </div>
            <span className="text-sm text-zinc-400">Available Credits</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {balanceLoading ? '...' : formatCredits(balance?.balance ?? 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <span className="text-sm text-zinc-400">Total Purchased</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {balanceLoading ? '...' : formatCredits(balance?.lifetime_purchased ?? 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Zap size={20} className="text-blue-400" />
            </div>
            <span className="text-sm text-zinc-400">Credits Used</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {balanceLoading ? '...' : formatCredits(balance?.lifetime_used ?? 0)}
          </p>
        </motion.div>
      </div>

      {/* Credit Costs Info */}
      {balance?.credit_costs && balance.credit_costs.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Credit Usage Per Operation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {balance.credit_costs.map((cost) => (
              <div key={cost.id} className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">{cost.description}</p>
                <p className="text-lg font-semibold text-white">{cost.credits_required} <span className="text-xs text-zinc-500">credits</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promo Code */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift size={20} className="text-violet-400" />
          <h3 className="text-lg font-medium text-white">Redeem Promo Code</h3>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoMessage(null); }}
              placeholder="Enter promotional code"
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-lg",
                "bg-zinc-950 border border-zinc-800",
                "text-white placeholder:text-zinc-600",
                "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20",
                "transition-colors duration-200 uppercase tracking-wider"
              )}
            />
          </div>
          <button
            onClick={() => promoCode && redeemMutation.mutate(promoCode)}
            disabled={!promoCode || redeemMutation.isPending}
            className={cn(
              "px-6 py-3 rounded-lg font-medium text-sm",
              "bg-gradient-to-r from-violet-600 to-violet-500 text-white",
              "hover:from-violet-500 hover:to-violet-400",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200 flex items-center gap-2"
            )}
          >
            {redeemMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
            Redeem
          </button>
        </div>
        <AnimatePresence>
          {promoMessage && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "text-sm mt-3 flex items-center gap-2",
                promoMessage.type === 'success' ? "text-green-400" : "text-red-400"
              )}
            >
              {promoMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {promoMessage.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Credit Packages */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Credit Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packagesLoading ? (
            <div className="col-span-4 flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : (
            packagesData?.packages?.map((pkg: CreditPackage, i: number) => {
              const Icon = packageIcons[pkg.id] || Coins;
              const gradient = packageColors[pkg.id] || 'from-zinc-600 to-zinc-500';
              const isPopular = pkg.id === 'pkg_professional';

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative bg-zinc-900/50 border rounded-xl p-6 flex flex-col",
                    isPopular ? "border-violet-500/50 ring-1 ring-violet-500/20" : "border-zinc-800"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs font-medium text-white">
                      Most Popular
                    </div>
                  )}

                  <div className={cn("p-3 rounded-xl bg-gradient-to-br w-fit mb-4", gradient)}>
                    <Icon size={24} className="text-white" />
                  </div>

                  <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1 flex-1">{pkg.description}</p>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{formatCurrency(pkg.price_cents)}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-zinc-300">{formatCredits(pkg.credits)} credits</p>
                      {pkg.bonus_credits > 0 && (
                        <p className="text-sm text-emerald-400">+{formatCredits(pkg.bonus_credits)} bonus credits</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Purchase ${pkg.name} for ${formatCurrency(pkg.price_cents)}?\n\nYou will receive ${formatCredits(pkg.credits + pkg.bonus_credits)} credits.\n\nNote: Payment processing is coming soon. Credits will be added to your account for testing purposes.`)) {
                        purchaseMutation.mutate(pkg.id);
                      }
                    }}
                    disabled={purchaseMutation.isPending}
                    className={cn(
                      "mt-6 w-full py-3 px-4 rounded-lg font-medium text-sm",
                      "bg-gradient-to-r text-white flex items-center justify-center gap-2",
                      isPopular
                        ? "from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400"
                        : "from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    {purchaseMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Purchase
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <History size={20} className="text-zinc-400" />
          <h2 className="text-xl font-semibold text-white">Transaction History</h2>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {historyData?.transactions?.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Coins size={32} className="mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Purchase a credit package or redeem a promo code to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Description</th>
                  <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Balance</th>
                  <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {historyData?.transactions?.map((tx: CreditTransaction) => (
                  <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                        tx.type === 'purchase' && "bg-emerald-500/10 text-emerald-400",
                        tx.type === 'bonus' && "bg-violet-500/10 text-violet-400",
                        tx.type === 'deduction' && "bg-red-500/10 text-red-400",
                        tx.type === 'refund' && "bg-blue-500/10 text-blue-400"
                      )}>
                        {tx.type === 'purchase' && <CreditCard size={12} />}
                        {tx.type === 'bonus' && <Gift size={12} />}
                        {tx.type === 'deduction' && <Zap size={12} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{tx.description}</td>
                    <td className={cn(
                      "px-4 py-3 text-sm text-right font-medium",
                      tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-400">{formatCredits(tx.balance_after)}</td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-500">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
