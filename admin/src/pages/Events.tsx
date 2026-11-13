import { useSearchParams } from 'react-router-dom';
import BossManagementPage from './BossManagementPage';
import GachaManagement from './GachaManagement';
import CollectionManagementPage from './CollectionManagementPage';
import SeasonPassManagement from './SeasonPassManagement';
import QuizManagementPage from './QuizManagementPage';

type EventTabKey = 'boss' | 'battlepass' | 'quiz' | 'gacha' | 'collection';

const validTabs: EventTabKey[] = ['boss', 'battlepass', 'quiz', 'gacha', 'collection'];

const normalizeTab = (raw: string | null): EventTabKey => {
    if (!raw) return 'boss';
    if (raw === 'season-pass') return 'battlepass';
    if (validTabs.includes(raw as EventTabKey)) return raw as EventTabKey;
    return 'boss';
};

export default function Events() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = normalizeTab(searchParams.get('tab'));

    const handleTabChange = (key: EventTabKey) => {
        setSearchParams({ tab: key }, { replace: true });
    };

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Sự kiện Kỷ Luật</h1>
                <p className="page__subtitle">Hệ thống Gamification & Sự kiện</p>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {[
                    { key: 'boss' as const, label: '👾 Mở Khóa Nhân Vật' },
                    { key: 'battlepass' as const, label: '📜 Sổ Sứ Mệnh' },
                    { key: 'quiz' as const, label: '🧠 Quiz & Minigame' },
                    { key: 'gacha' as const, label: '🎡 Vòng Quay (Concept 3)' },
                    { key: 'collection' as const, label: '📚 Bộ Sưu Tập (Concept 4)' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.key)}
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
            {activeTab === 'battlepass' && <SeasonPassManagement embedded={true} />}
            {activeTab === 'quiz' && <QuizManagementPage embedded={true} />}
            {activeTab === 'gacha' && <GachaManagement />}
            {activeTab === 'collection' && <CollectionManagementPage />}
        </div>
    );
}
