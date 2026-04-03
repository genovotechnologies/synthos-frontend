import apiClient from './client';
import type { SupportTicket, TicketMessage, SupportOverview, AdminUser, Validation, Pagination } from './types';

export const supportApi = {
  getOverview: async (): Promise<SupportOverview> => {
    const { data } = await apiClient.get('/support/overview');
    return data;
  },
  listTickets: async (page = 1, perPage = 20, status?: string, priority?: string): Promise<{ tickets: SupportTicket[]; pagination: Pagination }> => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    const { data } = await apiClient.get(`/support/tickets?${params}`);
    return data;
  },
  getTicket: async (id: string): Promise<{ ticket: SupportTicket; messages: TicketMessage[] }> => {
    const { data } = await apiClient.get(`/support/tickets/${id}`);
    return data;
  },
  replyToTicket: async (id: string, message: string, isInternal = false): Promise<TicketMessage> => {
    const { data } = await apiClient.post(`/support/tickets/${id}/reply`, { message, is_internal: isInternal });
    return data;
  },
  updateTicketStatus: async (id: string, status: string): Promise<void> => {
    await apiClient.patch(`/support/tickets/${id}/status`, { status });
  },
  assignTicket: async (id: string, assignedTo: string): Promise<void> => {
    await apiClient.patch(`/support/tickets/${id}/assign`, { assigned_to: assignedTo });
  },
  updateTicketPriority: async (id: string, priority: string): Promise<void> => {
    await apiClient.patch(`/support/tickets/${id}/priority`, { priority });
  },
  getUser: async (id: string): Promise<AdminUser> => {
    const { data } = await apiClient.get(`/support/users/${id}`);
    return data;
  },
  getUserValidations: async (userId: string, page = 1): Promise<{ validations: Validation[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/support/users/${userId}/validations?page=${page}`);
    return data;
  },
};
