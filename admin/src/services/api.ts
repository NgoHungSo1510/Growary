const API_URL = 'http://localhost:5000/api';

class AdminApi {
    private token: string | null;

    constructor() {
        this.token = localStorage.getItem('adminToken');
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        };

        const res = await fetch(`${API_URL}${path}`, { ...options, headers });

        if (res.status === 401) {
            this.token = null;
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'Request failed');
        }

        return res.json();
    }

    // Generic REST
    async get<T = any>(path: string) {
        return this.request<T>(path);
    }
    async post<T = any>(path: string, data: any) {
        return this.request<T>(path, { method: 'POST', body: JSON.stringify(data) });
    }
    async put<T = any>(path: string, data: any) {
        return this.request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
    }
    async delete<T = any>(path: string) {
        return this.request<T>(path, { method: 'DELETE' });
    }

    // Auth
    async login(email: string, password: string) {
        const data = await this.request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.token = data.token;
        localStorage.setItem('adminToken', data.token);
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('adminToken');
    }

    isLoggedIn() {
        return !!this.token;
    }

    // Dashboard
    async getStats() {
        return this.request<{
            stats: { totalUsers: number; newUsersToday: number; pendingVouchers: number; pendingTasks: number; activeUsers: number; totalXPGranted: number };
            activity: { labels: string[]; tasksCompleted: number[]; xpGranted: number[] };
        }>('/admin/stats');
    }

    // Task Templates (system tasks)
    async getSystemTasks() {
        return this.request<{ tasks: any[] }>('/tasks/system');
    }

    async createTask(data: { title: string; description?: string; pointsReward: number; category: string; estimatedMinutes?: number; isMandatory?: boolean }) {
        return this.request<{ task: any }>('/tasks', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateTask(id: string, data: any) {
        return this.request<{ task: any }>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteTask(id: string) {
        return this.request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' });
    }

    // Task Approval
    async getPendingTasks() {
        return this.request<{ tasks: any[] }>('/admin/tasks/pending');
    }

    async approveTask(planId: string, taskId: string, adjustedPoints?: number, adjustedCoins?: number) {
        return this.request<{ message: string; task: any }>(`/admin/tasks/${planId}/${taskId}/approve`, {
            method: 'PATCH',
            body: JSON.stringify({ adjustedPoints, adjustedCoins }),
        });
    }

    async rejectTask(planId: string, taskId: string) {
        return this.request<{ message: string; task: any }>(`/admin/tasks/${planId}/${taskId}/reject`, {
            method: 'PATCH',
        });
    }

    // Users
    async getUsers(params?: { search?: string; page?: number }) {
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        if (params?.page) query.set('page', String(params.page));
        return this.request<{ users: any[]; total: number; page: number; pages: number }>(`/admin/users?${query}`);
    }

    async getUser(id: string) {
        return this.request<{ user: any }>(`/admin/users/${id}`);
    }

    async adjustPoints(userId: string, amount: number, reason?: string) {
        return this.request<{ user: any; message: string }>(`/admin/users/${userId}/points`, {
            method: 'PATCH',
            body: JSON.stringify({ amount, reason }),
        });
    }

    // Rewards (admin sees all — shelf + warehouse)
    async getAllRewards() {
        return this.request<{ rewards: any[] }>('/admin/rewards');
    }

    async createReward(data: { title: string; description?: string; pointCost: number; imageUrl?: string; stock?: number; isActive?: boolean }) {
        return this.request<{ reward: any }>('/rewards', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateReward(id: string, data: any) {
        return this.request<{ reward: any }>(`/rewards/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    // Vouchers
    async getAllVouchers(status?: string) {
        const query = status ? `?status=${status}` : '';
        return this.request<{ vouchers: any[] }>(`/admin/vouchers${query}`);
    }

    async confirmVoucher(code: string) {
        return this.request<{ voucher: any; message: string }>(`/rewards/vouchers/${code}/confirm`, { method: 'PATCH' });
    }

    // Events
    async getEvents() {
        return this.request<{ events: any[] }>('/admin/events');
    }

    async createEvent(data: { title: string; description: string; bannerUrl?: string; startDate: string; endDate: string; specialTasks?: any[] }) {
        return this.request<{ event: any }>('/admin/events', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateEvent(id: string, data: any) {
        return this.request<{ event: any }>(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteEvent(id: string) {
        return this.request<{ message: string }>(`/admin/events/${id}`, { method: 'DELETE' });
    }

    // Milestone Rewards
    async getMilestones(type?: string) {
        return this.request<{ milestones: any[] }>(`/admin/milestones${type ? `?type=${type}` : ''}`);
    }
    async createMilestone(data: any) {
        return this.request<{ milestone: any }>('/admin/milestones', { method: 'POST', body: JSON.stringify(data) });
    }
    async updateMilestone(id: string, data: any) {
        return this.request<{ milestone: any }>(`/admin/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
    async deleteMilestone(id: string) {
        return this.request<{ message: string }>(`/admin/milestones/${id}`, { method: 'DELETE' });
    }

    // Upload
    async uploadImage(base64Image: string) {
        return this.request<{ url: string; imageUrl?: string }>('/upload/proof', {
            method: 'POST',
            body: JSON.stringify({ image: base64Image }),
        });
    }

    // Levels
    async getLevels() {
        return this.request<{ levels: any[] }>('/admin/levels');
    }

    async createLevel(data: { level: number; xpRequired: number; coinReward: number; unlockDescription?: string }) {
        return this.request<{ level: any }>('/admin/levels', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateLevel(id: string, data: any) {
        return this.request<{ level: any }>(`/admin/levels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteLevel(id: string) {
        return this.request<{ message: string }>(`/admin/levels/${id}`, { method: 'DELETE' });
    }
}

export const adminApi = new AdminApi();
