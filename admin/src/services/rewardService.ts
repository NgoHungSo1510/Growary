import { httpClient } from './client';

export const rewardService = {
    async getAllRewards() {
        return httpClient.get<{ rewards: any[] }>('/admin/rewards');
    },

    async createReward(data: {
        title: string;
        description?: string;
        pointCost: number;
        imageUrl?: string;
        stock?: number;
        isActive?: boolean;
    }) {
        return httpClient.post<{ reward: any }>('/rewards', data);
    },

    async updateReward(id: string, data: any) {
        return httpClient.put<{ reward: any }>(`/rewards/${id}`, data);
    },

    async getAllVouchers(status?: string) {
        const query = status ? `?status=${status}` : '';
        return httpClient.get<{ vouchers: any[] }>(`/admin/vouchers${query}`);
    },

    async confirmVoucher(code: string) {
        return httpClient.patch<{ voucher: any; message: string }>(`/rewards/vouchers/${code}/confirm`);
    },

    async getMysteryBoxes() {
        return httpClient.get<{ boxes: any[] }>('/admin/mystery-boxes');
    },

    async createMysteryBox(data: any) {
        return httpClient.post<{ box: any }>('/admin/mystery-boxes', data);
    },

    async updateMysteryBox(id: string, data: any) {
        return httpClient.put<{ box: any }>(`/admin/mystery-boxes/${id}`, data);
    },

    async deleteMysteryBox(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/mystery-boxes/${id}`);
    },

    async getSpecialItems() {
        return httpClient.get<{ items: any[] }>('/admin/special-items');
    },

    async createSpecialItem(data: any) {
        return httpClient.post<{ item: any }>('/admin/special-items', data);
    },

    async updateSpecialItem(id: string, data: any) {
        return httpClient.put<{ item: any }>(`/admin/special-items/${id}`, data);
    },

    async deleteSpecialItem(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/special-items/${id}`);
    },

    async uploadImage(base64Image: string) {
        return httpClient.post<{ url: string; imageUrl?: string }>('/upload/proof', { image: base64Image });
    },
};
