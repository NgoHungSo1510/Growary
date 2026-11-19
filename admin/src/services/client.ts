const API_URL = import.meta.env.VITE_API_URL || 'https://growary-backend-vb86.onrender.com/api';

export const ADMIN_IDLE_LIMIT_MS = 48 * 60 * 60 * 1000;
const LAST_ACTIVE_STORAGE_KEY = 'adminLastActiveAt';
const EXPIRED_REASON_STORAGE_KEY = 'adminSessionExpiredReason';
const REMEMBERED_EMAIL_STORAGE_KEY = 'rememberedAdminEmail';

export type ServerStatusState = 'online' | 'waking';

export class HttpClient {
    private token: string | null;

    constructor() {
        this.token = localStorage.getItem('adminToken');
    }

    /**
     * Ghi nhận tương tác thực tế của quản trị viên để trượt cửa sổ phiên 48 giờ.
     */
    markActivity(): void {
        if (this.token) {
            localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, String(Date.now()));
        }
    }

    /**
     * Kiểm tra xem phiên quản trị đã quá 48 giờ không có tương tác hay chưa.
     * @returns true nếu đã quá 48 giờ không hoạt động
     */
    isIdleExpired(): boolean {
        const raw = localStorage.getItem(LAST_ACTIVE_STORAGE_KEY);
        if (!raw) return false;
        const lastActive = Number(raw);
        return Number.isFinite(lastActive) && Date.now() - lastActive > ADMIN_IDLE_LIMIT_MS;
    }

    getRememberedEmail(): string {
        return localStorage.getItem(REMEMBERED_EMAIL_STORAGE_KEY) || 'admin@growary.vn';
    }

    setRememberedEmail(email: string): void {
        localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, email.trim().toLowerCase());
    }

    consumeSessionExpiredReason(): string | null {
        const reason = localStorage.getItem(EXPIRED_REASON_STORAGE_KEY);
        if (reason) {
            localStorage.removeItem(EXPIRED_REASON_STORAGE_KEY);
        }
        return reason;
    }

    getToken(): string | null {
        return this.token;
    }

    setToken(token: string): void {
        this.token = token;
        localStorage.setItem('adminToken', token);
        localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, String(Date.now()));
        localStorage.removeItem(EXPIRED_REASON_STORAGE_KEY);
    }

    removeToken(): void {
        this.token = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem(LAST_ACTIVE_STORAGE_KEY);
    }

    isLoggedIn(): boolean {
        if (!this.token) return false;
        if (this.isIdleExpired()) {
            this.removeToken();
            localStorage.setItem(EXPIRED_REASON_STORAGE_KEY, 'idle_48h');
            return false;
        }
        return true;
    }

    private emitServerStatus(status: ServerStatusState): void {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('growary:server-status', { detail: status }));
        }
    }

    async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        if (this.token && this.isIdleExpired()) {
            this.removeToken();
            localStorage.setItem(EXPIRED_REASON_STORAGE_KEY, 'idle_48h');
            window.location.href = '/login';
            throw new Error('Phiên làm việc đã hết hạn sau 48 giờ không hoạt động');
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        };

        let res: Response;
        try {
            res = await fetch(`${API_URL}${path}`, { ...options, headers });
        } catch {
            this.emitServerStatus('waking');
            throw new Error('Máy chủ đang khởi động lại, vui lòng đợi giây lát...');
        }

        if (res.status >= 500) {
            this.emitServerStatus('waking');
            const errBody = await res.json().catch(() => ({ error: 'Server waking up' }));
            throw new Error(errBody.error || 'Máy chủ đang thức dậy, vui lòng thử lại');
        }

        this.emitServerStatus('online');

        if (res.status === 401) {
            const errBody = await res.json().catch(() => ({ error: 'Unauthorized', code: 'TOKEN_INVALID' }));
            if (errBody.code === 'TOKEN_INVALID' || errBody.code === 'SESSION_IDLE_EXPIRED' || !path.includes('/login')) {
                this.removeToken();
                window.location.href = '/login';
            }
            throw new Error(errBody.error || 'Unauthorized');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'Request failed');
        }

        return res.json() as Promise<T>;
    }

    async get<T = unknown>(path: string): Promise<T> {
        return this.request<T>(path);
    }

    async post<T = unknown>(path: string, data?: unknown): Promise<T> {
        return this.request<T>(path, {
            method: 'POST',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    async put<T = unknown>(path: string, data?: unknown): Promise<T> {
        return this.request<T>(path, {
            method: 'PUT',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T = unknown>(path: string, data?: unknown): Promise<T> {
        return this.request<T>(path, {
            method: 'PATCH',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T = unknown>(path: string): Promise<T> {
        return this.request<T>(path, { method: 'DELETE' });
    }
}

export const httpClient = new HttpClient();
