import { useState, useEffect } from 'react';
import { AdminNotificationBell } from './notifications/AdminNotificationBell';
import type { ServerStatusState } from '../services/client';
import './TopBar.css';

export default function TopBar() {
    const [serverStatus, setServerStatus] = useState<ServerStatusState>('online');

    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent<ServerStatusState>;
            if (custom.detail) {
                setServerStatus(custom.detail);
            }
        };
        window.addEventListener('growary:server-status', handler);
        return () => window.removeEventListener('growary:server-status', handler);
    }, []);

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <header className="topbar">
            <div className="topbar__left">
                <div>
                    <div className="topbar__greeting">Xin chào, Admin 👋</div>
                    <div className="topbar__date">{dateStr}</div>
                </div>
            </div>

            <div className="topbar__right">
                <span
                    className={`topbar__server-pill ${
                        serverStatus === 'waking'
                            ? 'topbar__server-pill--waking'
                            : 'topbar__server-pill--online'
                    }`}
                >
                    {serverStatus === 'waking'
                        ? '🟡 Máy chủ đang thức dậy (Giữ phiên)...'
                        : '🟢 Máy chủ sẵn sàng'}
                </span>

                <div className="topbar__search">
                    <span className="topbar__search-icon">🔍</span>
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>

                <AdminNotificationBell />
                <div className="topbar__avatar">A</div>
            </div>
        </header>
    );
}
