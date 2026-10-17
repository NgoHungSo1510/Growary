import { httpClient } from './client';

export const questService = {
    async getSystemTasks() {
        return httpClient.get<{ tasks: any[] }>('/tasks/system');
    },

    async createTask(data: {
        title: string;
        description?: string;
        pointsReward: number;
        category: string;
        estimatedMinutes?: number;
        isMandatory?: boolean;
    }) {
        return httpClient.post<{ task: any }>('/tasks', data);
    },

    async updateTask(id: string, data: any) {
        return httpClient.put<{ task: any }>(`/tasks/${id}`, data);
    },

    async deleteTask(id: string) {
        return httpClient.delete<{ message: string }>(`/tasks/${id}`);
    },

    async getPendingTasks() {
        return httpClient.get<{ tasks: any[] }>('/admin/tasks/pending');
    },

    async approveTask(planId: string, taskId: string, adjustedPoints?: number, adjustedCoins?: number) {
        return httpClient.patch<{ message: string; task: any }>(`/admin/tasks/${planId}/${taskId}/approve`, {
            adjustedPoints,
            adjustedCoins,
        });
    },

    async rejectTask(planId: string, taskId: string) {
        return httpClient.patch<{ message: string; task: any }>(`/admin/tasks/${planId}/${taskId}/reject`);
    },

    async getPenaltyConfig() {
        return httpClient.get<{ config: any }>('/admin/penalty-config');
    },

    async updatePenaltyConfig(data: any) {
        return httpClient.put<{ config: any }>('/admin/penalty-config', data);
    },
};
