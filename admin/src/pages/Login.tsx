import { useState } from 'react';
import { adminApi } from '../services/api';

export default function Login({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState('admin@growary.vn');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
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
            onLogin();
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}>
            <form onSubmit={handleSubmit} style={{
                background: 'white',
                borderRadius: 16,
                padding: 40,
                width: 380,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🌱</div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Growary Admin</h1>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Đăng nhập để quản lý hệ thống</p>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px', background: '#fef2f2', color: '#dc2626',
                        borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16,
                    }}>
                        ❌ {error}
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Email</label>
                    <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
                        required
                    />
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Mật khẩu</label>
                    <input
                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
                        fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? '⏳ Đang đăng nhập...' : '🔑 Đăng nhập'}
                </button>
            </form>
        </div>
    );
}
