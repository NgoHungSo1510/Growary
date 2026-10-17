import { httpClient } from './client';
import { ShopEvent, CreateShopEventDto } from '@shared';

export const shopEventService = {
    async getShopEvents(filter?: string) {
        const query = filter ? `?filter=${encodeURIComponent(filter)}` : '';
        return httpClient.get<{ events: ShopEvent[] }>(`/admin/shop-events${query}`);
    },

    async createShopEvent(data: CreateShopEventDto) {
        return httpClient.post<{ event: ShopEvent }>('/admin/shop-events', data);
    },

    async updateShopEvent(id: string, data: Partial<CreateShopEventDto> & { isActive?: boolean }) {
        return httpClient.put<{ event: ShopEvent }>(`/admin/shop-events/${id}`, data);
    },

    async deleteShopEvent(id: string) {
        return httpClient.delete<{ message: string }>(`/admin/shop-events/${id}`);
    },
};
