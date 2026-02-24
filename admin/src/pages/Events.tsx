import { useState } from 'react';
import BossManagementPage from './BossManagementPage';

export default function Events() {
    const [activeTab, setActiveTab] = useState<'boss' | 'battlepass' | 'gacha'>('boss');

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Sự kiện Kỷ Luật</h1>
                <p className="page__subtitle">Hệ thống Gamification 3 Concept</p>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <button
                    className={`nav-tab ${activeTab === 'boss' ? 'active' : ''}`}
                    onClick={() => setActiveTab('boss')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'boss' ? 'var(--accent)' : 'var(--card-bg)',
                        color: activeTab === 'boss' ? '#FFF' : 'var(--text-secondary)',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    👾 Săn Boss (Concept 1)
                </button>
                <button
                    className={`nav-tab ${activeTab === 'battlepass' ? 'active' : ''}`}
                    onClick={() => setActiveTab('battlepass')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'battlepass' ? 'var(--accent)' : 'var(--card-bg)',
                        color: activeTab === 'battlepass' ? '#FFF' : 'var(--text-secondary)',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    📜 Sổ Sứ Mệnh (Concept 2)
                </button>
                <button
                    className={`nav-tab ${activeTab === 'gacha' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gacha')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'gacha' ? 'var(--accent)' : 'var(--card-bg)',
                        color: activeTab === 'gacha' ? '#FFF' : 'var(--text-secondary)',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🎡 Vòng Quay (Concept 3)
                </button>
            </div>

            {activeTab === 'boss' && <BossManagementPage />}
            {activeTab === 'battlepass' && (
                <div className="empty-state">
                    <div className="empty-state__icon">🚧</div>
                    <div className="empty-state__text">Sổ Sứ Mệnh: Tính năng đang được phát triển...</div>
                </div>
            )}
            {activeTab === 'gacha' && (
                <div className="empty-state">
                    <div className="empty-state__icon">🚧</div>
                    <div className="empty-state__text">Vòng Quay Nhân Phẩm: Tính năng đang được phát triển...</div>
                </div>
            )}
        </div>
    );
}
