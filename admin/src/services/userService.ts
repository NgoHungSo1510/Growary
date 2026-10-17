import { httpClient } from './client';

export const userService = {
    async login(email: string, password: string) {
        const data = await httpClient.post<{ token: string; user: any }>('/auth/login', { email, password });
        httpClient.setToken(data.token);
        return data;
    },

    logout() {
        httpClient.removeToken();
    },

    isLoggedIn() {
        return httpClient.isLoggedIn();
    },

    async getStats() {
        return httpClient.get<{
            stats: {
                totalUsers: number;
                newUsersToday: number;
                pendingVouchers: number;
                pendingTasks: number;
                activeUsers: number;
                totalXPGranted: number;
                activeUsersToday: number;
                tasksCompletedToday: number;
            };
            activity: { labels: string[]; tasksCompleted: number[]; xpGranted: number[] };
        }>('/admin/stats');
    },

    async getUsers(params?: { search?: string; page?: number }) {
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        if (params?.page) query.set('page', String(params.page));
        return httpClient.get<{ users: any[]; total: number; page: number; pages: number }>(`/admin/users?${query}`);
    },

    async getUser(id: string) {
        return httpClient.get<{ user: any }>(`/admin/users/${id}`);
    },

    async adjustPoints(userId: string, amount: number, reason?: string) {
        return httpClient.patch<{ user: any; message: string }>(`/admin/users/${userId}/points`, { amount, reason });
    },

    async updateUser(id: string, data: any) {
        return httpClient.put<{ user: any; message: string }>(`/admin/users/${id}`, data);
    },

    async getVipConfig() {
        return httpClient.get<{ tiers: any[] }>('/admin/vip-config');
    },

    async updateVipConfig(tiers: any[]) {
        return httpClient.put<{ message: string }>('/admin/vip-config', { tiers });
    },

    async resetVip(userId: string, resetToTier: number = 0) {
        return httpClient.post<{ message: string; user: any }>('/admin/vip-config/reset', { userId, resetToTier });
    },

    async getUserInventory(userId: string) {
        return httpClient.get<{ inventory: any[] }>(`/admin/user-inventory/${userId}`);
    },

    async grantInventoryItem(data: {
        userId: string;
        itemType: string;
        specialItem?: string;
        mysteryBox?: string;
        rewardForm?: string;
        quantity: number;
        reason: string;
    }) {
        return httpClient.post<{ message: string; inventory: any }>('/admin/inventory/grant', data);
    },
};
