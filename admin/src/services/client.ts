const API_URL = import.meta.env.VITE_API_URL || 'https://growary-backend-vb86.onrender.com/api';

export class HttpClient {
    private token: string | null;

    constructor() {
        this.token = localStorage.getItem('adminToken');
    }

    getToken(): string | null {
        return this.token;
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('adminToken', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('adminToken');
    }

    isLoggedIn(): boolean {
        return !!this.token;
    }

    async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        };

        const res = await fetch(`${API_URL}${path}`, { ...options, headers });

        if (res.status === 401) {
            this.removeToken();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'Request failed');
        }

        return res.json();
    }

    async get<T = any>(path: string): Promise<T> {
        return this.request<T>(path);
    }

    async post<T = any>(path: string, data?: any): Promise<T> {
        return this.request<T>(path, {
            method: 'POST',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    async put<T = any>(path: string, data?: any): Promise<T> {
        return this.request<T>(path, {
            method: 'PUT',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T = any>(path: string, data?: any): Promise<T> {
        return this.request<T>(path, {
            method: 'PATCH',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T = any>(path: string): Promise<T> {
        return this.request<T>(path, { method: 'DELETE' });
    }
}

export const httpClient = new HttpClient();
