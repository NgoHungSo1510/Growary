import { useState } from 'react';
import BossManagementPage from './BossManagementPage';
import GachaManagement from './GachaManagement';
import CollectionManagementPage from './CollectionManagementPage';

export default function Events() {
    const [activeTab, setActiveTab] = useState<'boss' | 'battlepass' | 'gacha' | 'collection'>('boss');

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Sự kiện Kỷ Luật</h1>
                <p className="page__subtitle">Hệ thống Gamification 4 Concept</p>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {[
                    { key: 'boss' as const, label: '👾 Săn Boss (Concept 1)' },
                    { key: 'battlepass' as const, label: '📜 Sổ Sứ Mệnh (Concept 2)' },
                    { key: 'gacha' as const, label: '🎡 Vòng Quay (Concept 3)' },
                    { key: 'collection' as const, label: '📚 Bộ Sưu Tập (Concept 4)' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === tab.key ? 'var(--accent)' : 'var(--card-bg)',
                            color: activeTab === tab.key ? '#FFF' : 'var(--text-secondary)',
                            borderRadius: 12,
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'boss' && <BossManagementPage />}
            {activeTab === 'battlepass' && (
                <div className="empty-state">
                    <div className="empty-state__icon">🚧</div>
                    <div className="empty-state__text">Sổ Sứ Mệnh: Tính năng đang được phát triển...</div>
                </div>
            )}
            {activeTab === 'gacha' && <GachaManagement />}
            {activeTab === 'collection' && <CollectionManagementPage />}
        </div>
    );
}
