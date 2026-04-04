import apiClient from './client';

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  last_triggered_at?: string;
  failure_count: number;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  event_type: string;
  response_status: number;
  success: boolean;
  duration_ms: number;
  created_at: string;
}

export const webhooksApi = {
  list: async (): Promise<{ webhooks: Webhook[] }> => {
    const { data } = await apiClient.get('/webhooks');
    return data;
  },
  create: async (url: string, events: string[]): Promise<Webhook> => {
    const { data } = await apiClient.post('/webhooks', { url, events });
    return data;
  },
  update: async (id: string, updates: Partial<Webhook>): Promise<void> => {
    await apiClient.patch(`/webhooks/${id}`, updates);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/webhooks/${id}`);
  },
  getDeliveries: async (id: string, page = 1): Promise<{ deliveries: WebhookDelivery[] }> => {
    const { data } = await apiClient.get(`/webhooks/${id}/deliveries?page=${page}`);
    return data;
  },
};
