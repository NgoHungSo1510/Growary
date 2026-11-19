import { useState, useEffect, type FormEvent } from 'react';
import { adminApi } from '../services/api';
import { httpClient } from '../services/client';
import './Login.css';

export default function Login({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState(() => httpClient.getRememberedEmail());
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [idleNotice, setIdleNotice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const reason = httpClient.consumeSessionExpiredReason();
        if (reason === 'idle_48h') {
            setIdleNotice('Phiên quản trị đã tạm khóa sau 48 giờ không hoạt động. Vui lòng nhập lại mật khẩu.');
        }
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await adminApi.login(email, password);
            if (data.user.role !== 'admin') {
                setError('Tài khoản không có quyền admin');
                adminApi.logout();
                return;
            }
            httpClient.setRememberedEmail(email);
            httpClient.markActivity();
            onLogin();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <form onSubmit={handleSubmit} className="admin-login-form">
                <div className="admin-login-header">
                    <div className="admin-login-logo">🌱</div>
                    <h1 className="admin-login-title">Growary Admin</h1>
                    <p className="admin-login-subtitle">Đăng nhập để quản lý hệ thống</p>
                </div>

                {idleNotice && (
                    <div className="admin-login-alert admin-login-alert--info">
                        ⏰ {idleNotice}
                    </div>
                )}

                {error && (
                    <div className="admin-login-alert admin-login-alert--error">
                        ❌ {error}
                    </div>
                )}

                <div className="admin-login-field">
                    <label className="admin-login-label">Email đã ghi nhớ</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="admin-login-input"
                        required
                    />
                </div>

                <div className="admin-login-field admin-login-field--last">
                    <label className="admin-login-label">Mật khẩu</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="admin-login-input"
                        placeholder="Nhập mật khẩu quản trị"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="admin-login-submit"
                >
                    {loading ? '⏳ Đang đăng nhập...' : '🔑 Đăng nhập'}
                </button>
            </form>
        </div>
    );
}
