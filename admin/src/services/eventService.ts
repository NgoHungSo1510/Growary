import { httpClient } from './client';

export const eventService = {
    async getEvents() {
        return httpClient.get<{ events: any[] }>('/admin/events');
    },

    async createEvent(data: {
        title: string;
        description: string;
        bannerUrl?: string;
        startDate: string;
        endDate: string;
        specialTasks?: any[];
    }) {
        return httpClient.post<{ event: any }>('/admin/events', data);
    },

    async updateEvent(id: string, data: any) {
        return httpClient.put<{ event: any }>(`/admin/events/${id}`, data);
    },

    async deleteEvent(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/events/${id}`);
    },

    async getMilestones(type?: string) {
        return httpClient.get<{ milestones: any[] }>(`/admin/milestones${type ? `?type=${type}` : ''}`);
    },

    async createMilestone(data: any) {
        return httpClient.post<{ milestone: any }>('/admin/milestones', data);
    },

    async updateMilestone(id: string, data: any) {
        return httpClient.put<{ milestone: any }>(`/admin/milestones/${id}`, data);
    },

    async deleteMilestone(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/milestones/${id}`);
    },

    async getLevels() {
        return httpClient.get<{ levels: any[] }>('/admin/levels');
    },

    async createLevel(data: { level: number; xpRequired: number; coinReward: number; unlockDescription?: string }) {
        return httpClient.post<{ level: any }>('/admin/levels', data);
    },

    async updateLevel(id: string, data: any) {
        return httpClient.put<{ level: any }>(`/admin/levels/${id}`, data);
    },

    async deleteLevel(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/levels/${id}`);
    },

    async getNotifications() {
        return httpClient.get<{ configs: any[] }>('/admin/notifications');
    },

    async createNotification(data: any) {
        return httpClient.post<{ config: any }>('/admin/notifications', data);
    },

    async updateNotification(id: string, data: any) {
        return httpClient.put<{ config: any }>(`/admin/notifications/${id}`, data);
    },

    async deleteNotification(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/notifications/${id}`);
    },
};
