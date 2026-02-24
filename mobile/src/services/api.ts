import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Point to Railway Production Backend
const getApiUrl = () => {
    return 'https://growary-production.up.railway.app/api';
};

const API_URL = getApiUrl();

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add auth token to requests
        this.api.interceptors.request.use(
            async (config) => {
                const token = await SecureStore.getItemAsync('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Handle response errors
        this.api.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expired - clear and redirect to login
                    SecureStore.deleteItemAsync('authToken');
                }
                return Promise.reject(error);
            }
        );
    }

    // ============ GENERIC ============
    async get<T = any>(path: string, params?: any): Promise<T> {
        const response = await this.api.get<T>(path, { params });
        return response.data;
    }

    async post<T = any>(path: string, data?: any): Promise<T> {
        const response = await this.api.post<T>(path, data);
        return response.data;
    }

    // ============ AUTH ============
    async register(username: string, email: string, password: string) {
        const response = await this.api.post('/auth/register', { username, email, password });
        if (response.data.token) {
            await SecureStore.setItemAsync('authToken', response.data.token);
        }
        return response.data;
    }

    async login(email: string, password: string) {
        const response = await this.api.post('/auth/login', { email, password });
        if (response.data.token) {
            await SecureStore.setItemAsync('authToken', response.data.token);
        }
        return response.data;
    }

    async logout() {
        await SecureStore.deleteItemAsync('authToken');
    }

    async getProfile() {
        const response = await this.api.get('/auth/me');
        return response.data;
    }

    async updateProfile(data: { displayName?: string; email?: string; currentPassword?: string; newPassword?: string; avatar?: string }) {
        const response = await this.api.put('/auth/me', data);
        return response.data;
    }

    // ============ TASKS ============
    async getTaskTemplates() {
        const response = await this.api.get('/tasks');
        return response.data;
    }

    async createTaskTemplate(data: { title: string; description?: string; pointsReward?: number; category?: string }) {
        const response = await this.api.post('/tasks', data);
        return response.data;
    }

    // ============ DAILY PLANS ============
    async getTodayPlan() {
        const response = await this.api.get('/plans/today');
        return response.data;
    }

    async getTomorrowPlan() {
        const response = await this.api.get('/plans/tomorrow');
        return response.data;
    }

    async addTaskToPlan(planId: string, data: { templateId?: string; customTitle?: string; scheduledTime?: string; durationMinutes?: number; description?: string; category?: string }) {
        const response = await this.api.post(`/plans/${planId}/tasks`, data);
        return response.data;
    }

    async completeTask(planId: string, taskIndex: number, isCompleted: boolean, proofImageUrl?: string) {
        const response = await this.api.patch(`/plans/${planId}/tasks/${taskIndex}/complete`, { isCompleted, proofImageUrl });
        return response.data;
    }

    async uploadProofImage(base64Image: string) {
        const response = await this.api.post('/upload/proof', { image: base64Image });
        return response.data;
    }

    async updateTaskDetails(planId: string, taskIndex: number, data: { scheduledTime?: string; durationMinutes?: number; customTitle?: string }) {
        const response = await this.api.patch(`/plans/${planId}/tasks/${taskIndex}`, data);
        return response.data;
    }

    async removeTaskFromPlan(planId: string, taskIndex: number) {
        const response = await this.api.delete(`/plans/${planId}/tasks/${taskIndex}`);
        return response.data;
    }

    async reorderTasks(planId: string, taskOrder: number[]) {
        const response = await this.api.patch(`/plans/${planId}/reorder`, { taskOrder });
        return response.data;
    }

    async getCompletedHistory(days = 30) {
        const response = await this.api.get(`/plans/history?days=${days}`);
        return response.data;
    }

    // ============ JOURNALS ============
    async getJournals(page = 1, limit = 10) {
        const response = await this.api.get(`/journals?page=${page}&limit=${limit}`);
        return response.data;
    }

    async getJournalByDate(date: string) {
        const response = await this.api.get(`/journals/date/${date}`);
        return response.data;
    }

    async updateJournal(date: string, data: { manualContent?: string; mood?: string }) {
        const response = await this.api.put(`/journals/date/${date}`, data);
        return response.data;
    }

    async getJournalStats() {
        const response = await this.api.get('/journals/stats');
        return response.data;
    }

    // ============ REWARDS ============
    async getRewards() {
        const response = await this.api.get('/rewards');
        return response.data;
    }

    async purchaseReward(rewardId: string) {
        const response = await this.api.post(`/rewards/${rewardId}/purchase`);
        return response.data;
    }

    async getMyVouchers() {
        const response = await this.api.get('/rewards/vouchers/my');
        return response.data;
    }

    async useVoucher(code: string) {
        const response = await this.api.patch(`/rewards/vouchers/${code}/use`);
        return response.data;
    }

    async getUnreadVouchers() {
        const response = await this.api.get('/rewards/vouchers/unread');
        return response.data;
    }

    async markVoucherAsRead(code: string) {
        const response = await this.api.patch(`/rewards/vouchers/${code}/read`);
        return response.data;
    }

    // ============ LEVELS ============
    async getLevels() {
        const response = await this.api.get('/levels');
        return response.data;
    }
}

export const apiService = new ApiService();
