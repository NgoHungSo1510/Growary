import { httpClient } from './client';
import { userService } from './userService';
import { rewardService } from './rewardService';
import { questService } from './questService';
import { bossService } from './bossService';
import { eventService } from './eventService';
import { shopEventService } from './shopEventService';
import { warehouseConfigService } from './warehouseConfigService';

class AdminApi {
    // Generic REST
    async get<T = any>(path: string) {
        return httpClient.get<T>(path);
    }
    async post<T = any>(path: string, data?: any) {
        return httpClient.post<T>(path, data);
    }
    async put<T = any>(path: string, data?: any) {
        return httpClient.put<T>(path, data);
    }
    async patch<T = any>(path: string, data?: any) {
        return httpClient.patch<T>(path, data);
    }
    async delete<T = any>(path: string) {
        return httpClient.delete<T>(path);
    }

    // Auth
    async login(email: string, password: string) {
        return userService.login(email, password);
    }
    logout() {
        userService.logout();
    }
    isLoggedIn() {
        return userService.isLoggedIn();
    }

    // Dashboard
    async getStats() {
        return userService.getStats();
    }

    // Task Templates & Approvals
    async getSystemTasks() {
        return questService.getSystemTasks();
    }
    async createTask(data: { title: string; description?: string; pointsReward: number; category: string; estimatedMinutes?: number; isMandatory?: boolean }) {
        return questService.createTask(data);
    }
    async updateTask(id: string, data: any) {
        return questService.updateTask(id, data);
    }
    async deleteTask(id: string) {
        return questService.deleteTask(id);
    }
    async getPendingTasks() {
        return questService.getPendingTasks();
    }
    async approveTask(planId: string, taskId: string, adjustedPoints?: number, adjustedCoins?: number) {
        return questService.approveTask(planId, taskId, adjustedPoints, adjustedCoins);
    }
    async rejectTask(planId: string, taskId: string) {
        return questService.rejectTask(planId, taskId);
    }

    // Users
    async getUsers(params?: { search?: string; page?: number }) {
        return userService.getUsers(params);
    }
    async getUser(id: string) {
        return userService.getUser(id);
    }
    async adjustPoints(userId: string, amount: number, reason?: string) {
        return userService.adjustPoints(userId, amount, reason);
    }
    async updateUser(id: string, data: any) {
        return userService.updateUser(id, data);
    }

    // Rewards & Vouchers
    async getAllRewards() {
        return rewardService.getAllRewards();
    }
    async createReward(data: { title: string; description?: string; pointCost: number; imageUrl?: string; stock?: number; isActive?: boolean }) {
        return rewardService.createReward(data);
    }
    async updateReward(id: string, data: any) {
        return rewardService.updateReward(id, data);
    }
    async getAllVouchers(status?: string) {
        return rewardService.getAllVouchers(status);
    }
    async confirmVoucher(code: string) {
        return rewardService.confirmVoucher(code);
    }

    // Events & Milestones
    async getEvents() {
        return eventService.getEvents();
    }
    async createEvent(data: { title: string; description: string; bannerUrl?: string; startDate: string; endDate: string; specialTasks?: any[] }) {
        return eventService.createEvent(data);
    }
    async updateEvent(id: string, data: any) {
        return eventService.updateEvent(id, data);
    }
    async deleteEvent(id: string) {
        return eventService.deleteEvent(id);
    }
    async getMilestones(type?: string) {
        return eventService.getMilestones(type);
    }
    async createMilestone(data: any) {
        return eventService.createMilestone(data);
    }
    async updateMilestone(id: string, data: any) {
        return eventService.updateMilestone(id, data);
    }
    async deleteMilestone(id: string) {
        return eventService.deleteMilestone(id);
    }

    // Upload
    async uploadImage(base64Image: string) {
        return rewardService.uploadImage(base64Image);
    }

    // Levels
    async getLevels() {
        return eventService.getLevels();
    }
    async createLevel(data: { level: number; xpRequired: number; coinReward: number; unlockDescription?: string }) {
        return eventService.createLevel(data);
    }
    async updateLevel(id: string, data: any) {
        return eventService.updateLevel(id, data);
    }
    async deleteLevel(id: string) {
        return eventService.deleteLevel(id);
    }

    // Penalty Config
    async getPenaltyConfig() {
        return questService.getPenaltyConfig();
    }
    async updatePenaltyConfig(data: any) {
        return questService.updatePenaltyConfig(data);
    }

    // Notifications
    async getNotifications() {
        return eventService.getNotifications();
    }
    async createNotification(data: any) {
        return eventService.createNotification(data);
    }
    async updateNotification(id: string, data: any) {
        return eventService.updateNotification(id, data);
    }
    async deleteNotification(id: string) {
        return eventService.deleteNotification(id);
    }

    // VIP Config
    async getVipConfig() {
        return userService.getVipConfig();
    }
    async updateVipConfig(tiers: any[]) {
        return userService.updateVipConfig(tiers);
    }
    async resetVip(userId: string, resetToTier: number = 0) {
        return userService.resetVip(userId, resetToTier);
    }

    // Special Warehouse & Items
    async getMysteryBoxes() {
        return rewardService.getMysteryBoxes();
    }
    async createMysteryBox(data: any) {
        return rewardService.createMysteryBox(data);
    }
    async updateMysteryBox(id: string, data: any) {
        return rewardService.updateMysteryBox(id, data);
    }
    async deleteMysteryBox(id: string) {
        return rewardService.deleteMysteryBox(id);
    }
    async getUserInventory(userId: string) {
        return userService.getUserInventory(userId);
    }
    async grantInventoryItem(data: { userId: string; itemType: string; specialItem?: string; mysteryBox?: string; rewardForm?: string; quantity: number; reason: string }) {
        return userService.grantInventoryItem(data);
    }
    async getSpecialItems() {
        return rewardService.getSpecialItems();
    }
    async createSpecialItem(data: any) {
        return rewardService.createSpecialItem(data);
    }
    async updateSpecialItem(id: string, data: any) {
        return rewardService.updateSpecialItem(id, data);
    }
    async deleteSpecialItem(id: string) {
        return rewardService.deleteSpecialItem(id);
    }

    // Boss Operations
    async getBossEvents() {
        return bossService.getBossEvents();
    }
    async createBossEvent(data: any) {
        return bossService.createBossEvent(data);
    }
    async updateBossEvent(id: string, data: any) {
        return bossService.updateBossEvent(id, data);
    }
    async deleteBossEvent(id: string) {
        return bossService.deleteBossEvent(id);
    }
    async getBossWeeklyHistory() {
        return bossService.getWeeklyHistory();
    }
    async getBossCollections() {
        return bossService.getBossCollections();
    }
    async createBossCollection(data: any) {
        return bossService.createBossCollection(data);
    }
    async updateBossCollection(id: string, data: any) {
        return bossService.updateBossCollection(id, data);
    }
    async deleteBossCollection(id: string) {
        return bossService.deleteBossCollection(id);
    }

    // Shop Events (Flash Sale)
    async getShopEvents(filter?: string) {
        return shopEventService.getShopEvents(filter);
    }
    async createShopEvent(data: any) {
        return shopEventService.createShopEvent(data);
    }
    async updateShopEvent(id: string, data: any) {
        return shopEventService.updateShopEvent(id, data);
    }
    async deleteShopEvent(id: string) {
        return shopEventService.deleteShopEvent(id);
    }

    // Special Warehouse Config (Product -> Fragment Mapping)
    async getSpecialItemConfigs() {
        return warehouseConfigService.getSpecialItemConfigs();
    }
    async createSpecialItemConfig(data: { rewardId: string; fragmentType: string }) {
        return warehouseConfigService.createSpecialItemConfig(data);
    }
    async updateSpecialItemConfig(id: string, data: any) {
        return warehouseConfigService.updateSpecialItemConfig(id, data);
    }
    async deleteSpecialItemConfig(id: string) {
        return warehouseConfigService.deleteSpecialItemConfig(id);
    }
}

export const adminApi = new AdminApi();
