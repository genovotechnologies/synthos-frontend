import { apiClient } from './client';

export interface CreditBalance {
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  credit_costs: CreditCost[];
}

export interface CreditCost {
  id: string;
  operation: string;
  credits_required: number;
  description: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price_cents: number;
  currency: string;
  bonus_credits: number;
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'deduction' | 'refund' | 'bonus';
  amount: number;
  balance_after: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

export interface PurchaseResponse {
  transaction_id: string;
  package_name: string;
  credits_added: number;
  bonus_credits: number;
  total_added: number;
  new_balance: number;
  amount_charged_cents: number;
  currency: string;
}

export interface PromoRedeemResponse {
  success: boolean;
  code: string;
  credits_granted: number;
  new_balance: number;
  description: string;
  message: string;
}

export const creditsApi = {
  getBalance: async (): Promise<CreditBalance> => {
    const { data } = await apiClient.get('/credits/balance');
    return data;
  },

  getPackages: async (): Promise<{ packages: CreditPackage[] }> => {
    const { data } = await apiClient.get('/credits/packages');
    return data;
  },

  purchase: async (packageId: string): Promise<PurchaseResponse> => {
    const { data } = await apiClient.post('/credits/purchase', { package_id: packageId });
    return data;
  },

  getHistory: async (page = 1, perPage = 20): Promise<{ transactions: CreditTransaction[]; pagination: { page: number; total_count: number; total_pages: number } }> => {
    const { data } = await apiClient.get(`/credits/history?page=${page}&page_size=${perPage}`);
    return data;
  },

  redeemPromo: async (code: string): Promise<PromoRedeemResponse> => {
    const { data } = await apiClient.post('/credits/redeem', { code });
    return data;
  },

  validatePromo: async (code: string): Promise<{ valid: boolean; credits: number; description: string; message: string }> => {
    const { data } = await apiClient.get(`/promo/validate?code=${encodeURIComponent(code)}`);
    return data;
  },
};
