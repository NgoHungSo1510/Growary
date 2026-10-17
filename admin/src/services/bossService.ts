import { httpClient } from './client';

export const bossService = {
    async getBossEvents() {
        return httpClient.get<{ events: any[] }>('/admin/boss');
    },

    async createBossEvent(data: any) {
        return httpClient.post<{ event: any }>('/admin/boss', data);
    },

    async updateBossEvent(id: string, data: any) {
        return httpClient.put<{ event: any }>(`/admin/boss/${id}`, data);
    },

    async deleteBossEvent(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/boss/${id}`);
    },

    async getWeeklyHistory() {
        return httpClient.get<{ weeks: any[] }>('/admin/boss-weekly-history');
    },

    async getBossCollections() {
        return httpClient.get<{ collections: any[] }>('/admin/boss-collections');
    },

    async createBossCollection(data: any) {
        return httpClient.post<{ collection: any }>('/admin/boss-collections', data);
    },

    async updateBossCollection(id: string, data: any) {
        return httpClient.put<{ collection: any }>(`/admin/boss-collections/${id}`, data);
    },

    async deleteBossCollection(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/boss-collections/${id}`);
    },
};
