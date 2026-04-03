import apiClient from './client';
import type { SupportTicket, TicketMessage, Pagination } from './types';

export const ticketsApi = {
  create: async (subject: string, message: string, category = 'general'): Promise<SupportTicket> => {
    const { data } = await apiClient.post('/tickets', { subject, message, category });
    return data;
  },
  list: async (page = 1): Promise<{ tickets: SupportTicket[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/tickets?page=${page}`);
    return data;
  },
  get: async (id: string): Promise<{ ticket: SupportTicket; messages: TicketMessage[] }> => {
    const { data } = await apiClient.get(`/tickets/${id}`);
    return data;
  },
  reply: async (id: string, message: string): Promise<TicketMessage> => {
    const { data } = await apiClient.post(`/tickets/${id}/reply`, { message });
    return data;
  },
};
