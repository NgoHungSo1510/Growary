import { httpClient } from './client';
import { SpecialItemConfig } from '@shared';

export const warehouseConfigService = {
    async getSpecialItemConfigs() {
        return httpClient.get<{ configs: SpecialItemConfig[] }>('/admin/special-items-config');
    },

    async createSpecialItemConfig(data: { rewardId: string; fragmentType: string }) {
        return httpClient.post<{ config: SpecialItemConfig }>('/admin/special-items-config', data);
    },

    async updateSpecialItemConfig(id: string, data: { isActive?: boolean; addedToBoxPool?: boolean }) {
        return httpClient.put<{ config: SpecialItemConfig }>(`/admin/special-items-config/${id}`, data);
    },

    async deleteSpecialItemConfig(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/special-items-config/${id}`);
    },
};
