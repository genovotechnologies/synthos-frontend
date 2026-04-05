import apiClient from './client';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export const notificationsApi = {
  list: async (): Promise<NotificationsResponse> => {
    try {
      const response = await apiClient.get<NotificationsResponse>('/notifications');
      return response.data;
    } catch {
      return { notifications: [], unread_count: 0 };
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    // Backend supports batch mark-as-read via POST /notifications/read with {ids: [...]}
    await apiClient.post('/notifications/read', { notification_ids: [id] });
  },

  markAllAsRead: async (): Promise<void> => {
    // Backend only supports batch mark-as-read. Fetch all unread, then mark them.
    try {
      const response = await apiClient.get<NotificationsResponse>('/notifications');
      const unreadIds = response.data.notifications
        .filter((n) => !n.is_read)
        .map((n) => n.id);
      if (unreadIds.length > 0) {
        await apiClient.post('/notifications/read', { notification_ids: unreadIds });
      }
    } catch {
      // Silently fail if we can't fetch or mark
    }
  },

  delete: async (id: string): Promise<void> => {
    // Backend does not support deleting notifications.
    // Mark as read instead so the UI can hide it.
    console.warn('notificationsApi.delete: not supported by backend, marking as read instead');
    await apiClient.post('/notifications/read', { notification_ids: [id] });
  },
};
