import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import './Sidebar.css';

interface NavItem {
    path: string;
    label: string;
    icon: string;
    id: 'dashboard' | 'quests' | 'shop' | 'users' | 'events' | 'rewards' | 'boss';
}

const mainNav: NavItem[] = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: '📊' },
    { id: 'quests', path: '/quests', label: 'Quản lý Nhiệm vụ', icon: '⚔️' },
    { id: 'shop', path: '/shop', label: 'Cửa hàng & Đổi quà', icon: '🎁' },
    { id: 'users', path: '/users', label: 'Người chơi', icon: '👥' },
    { id: 'rewards', path: '/rewards', label: 'Hệ thống Cấp độ & Quà', icon: '⭐' },
    { id: 'events', path: '/events', label: 'Quản lý Sự kiện', icon: '🎉' },
];

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
    const [pendingTasks, setPendingTasks] = useState(0);
    const [pendingVouchers, setPendingVouchers] = useState(0);

    const fetchCounts = async () => {
        try {
            if (adminApi.isLoggedIn()) {
                const data = await adminApi.getStats();
                setPendingTasks(data.stats.pendingTasks || 0);
                setPendingVouchers(data.stats.pendingVouchers || 0);
            }
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        fetchCounts();

        // Refresh every 30 seconds to keep sidebar up to date
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar__brand">
                <div className="sidebar__logo">G</div>
                <div className="sidebar__brand-text">
                    <span className="sidebar__title">Growary</span>
                    <span className="sidebar__subtitle">Admin Panel</span>
                </div>
            </div>

            <nav className="sidebar__nav">
                <span className="sidebar__section-label">Menu</span>
                {mainNav.map((item) => {
                    let badge = 0;
                    if (item.id === 'quests') badge = pendingTasks;
                    if (item.id === 'shop') badge = pendingVouchers;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                            }
                        >
                            <span className="sidebar__icon">{item.icon}</span>
                            {item.label}
                            {badge > 0 ? <span className="sidebar__badge">{badge}</span> : null}
                        </NavLink>
                    );
                })}
            </nav>

            {onLogout && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%', padding: '10px', borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                            color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        }}
                    >
                        🚪 Đăng xuất
                    </button>
                </div>
            )}
        </aside>
    );
}
