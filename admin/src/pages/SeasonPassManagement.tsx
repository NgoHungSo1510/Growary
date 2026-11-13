import { useEffect, useState } from 'react';
import type {
    AdminSeasonSummaryDTO,
    PassReward,
    SeasonPassDTO,
    SeasonPassLeaderboardEntry,
    SeasonPassTier,
} from '@shared';
import { seasonPassAdminService } from '../services/seasonPassAdminService';
import TierRewardEditorModal from '../components/seasonPass/TierRewardEditorModal';

type AdminTab = 'tiers' | 'leaderboard';

export default function SeasonPassManagement({ embedded = false }: { embedded?: boolean } = {}) {
    const [seasons, setSeasons] = useState<AdminSeasonSummaryDTO[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const [season, setSeason] = useState<SeasonPassDTO | null>(null);
    const [leaderboard, setLeaderboard] = useState<SeasonPassLeaderboardEntry[]>([]);
    const [activeTab, setActiveTab] = useState<AdminTab>('tiers');
    const [editingTier, setEditingTier] = useState<SeasonPassTier | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string>('');

    const loadSeasons = async () => {
        setLoading(true);
        setStatusMsg('');
        try {
            const res = await seasonPassAdminService.getSeasons();
            setSeasons(res.seasons);
            if (res.seasons.length > 0 && !selectedSeasonId) {
                setSelectedSeasonId(res.seasons[0]._id);
            }
        } catch (err) {
            setStatusMsg(err instanceof Error ? err.message : 'Không thể tải danh sách mùa');
        } finally {
            setLoading(false);
        }
    };

    const loadDetail = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setStatusMsg('');
        try {
            const res = await seasonPassAdminService.getSeasonDetail(id);
            setSeason(res.season);
            setLeaderboard(res.leaderboard);
        } catch (err) {
            setStatusMsg(err instanceof Error ? err.message : 'Không thể tải chi tiết mùa');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSeasons();
    }, []);

    useEffect(() => {
        if (selectedSeasonId) void loadDetail(selectedSeasonId);
    }, [selectedSeasonId]);

    const handleSaveTier = async (freeReward: PassReward | null, eliteReward: PassReward | null) => {
        if (!season || !editingTier) return;
        setSaving(true);
        try {
            const res = await seasonPassAdminService.updateTierReward(
                season._id,
                editingTier.level,
                { freeReward, eliteReward }
            );
            setSeason({
                ...season,
                tiers: season.tiers.map((t) => (t.level === editingTier.level ? res.tier : t)),
            });
            setStatusMsg(res.message);
            setEditingTier(null);
        } catch (err) {
            setStatusMsg(err instanceof Error ? err.message : 'Không thể cập nhật cấp thưởng');
        } finally {
            setSaving(false);
        }
    };

    const selectedSummary = seasons.find((s) => s._id === selectedSeasonId);

    return (
        <div className={embedded ? undefined : 'page'} style={embedded ? { padding: 0 } : undefined}>
            <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div>
                    <h2 style={{ fontSize: 24, margin: 0 }}>📜 Quản Lý Sổ Sứ Mệnh</h2>
                    <p className="page__subtitle" style={{ margin: '4px 0 0 0' }}>Cấu hình 80 cấp phần thưởng & theo dõi Bảng Vàng Quý</p>
                </div>
                <select
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 280 }}
                >
                    {seasons.map((s) => (
                        <option key={s._id} value={s._id}>
                            {s.title} ({s.participantCount} người chơi) {s.isSettled ? '• Đã tất toán' : '• Đang diễn ra'}
                        </option>
                    ))}
                </select>
            </div>

            {statusMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#eef2ff', color: '#3730a3', marginBottom: 16 }}>
                    {statusMsg}
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__icon">📅</div>
                    <div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Mã mùa</div>
                        <strong style={{ fontSize: 18 }}>{season?.seasonCode ?? '—'}</strong>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon">👥</div>
                    <div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Người tham gia</div>
                        <strong style={{ fontSize: 18 }}>{selectedSummary?.participantCount ?? 0}</strong>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon">🏅</div>
                    <div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Trạng thái</div>
                        <strong style={{ fontSize: 18 }}>{season?.isSettled ? 'Đã tất toán' : 'Đang mở'}</strong>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('tiers')}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
                        background: activeTab === 'tiers' ? '#6366f1' : '#e2e8f0',
                        color: activeTab === 'tiers' ? '#fff' : '#334155',
                    }}
                >
                    Bảng 80 Cấp Phần Thưởng
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('leaderboard')}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
                        background: activeTab === 'leaderboard' ? '#6366f1' : '#e2e8f0',
                        color: activeTab === 'leaderboard' ? '#fff' : '#334155',
                    }}
                >
                    Bảng Vàng Quý (Top {leaderboard.length})
                </button>
            </div>

            <div className="card">
                <div className="card__body" style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <p>Đang tải dữ liệu Sổ Sứ Mệnh...</p>
                    ) : activeTab === 'tiers' ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: 10 }}>Cấp</th>
                                    <th style={{ padding: 10 }}>Nhánh Tập Sự (Free)</th>
                                    <th style={{ padding: 10 }}>Nhánh Tinh Anh (Elite)</th>
                                    <th style={{ padding: 10, width: 110 }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(season?.tiers ?? []).map((tier) => (
                                    <tr key={tier.level} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 10, fontWeight: 700 }}>Cấp {tier.level}</td>
                                        <td style={{ padding: 10 }}>{tier.freeReward ? `${tier.freeReward.label} (${tier.freeReward.type})` : '—'}</td>
                                        <td style={{ padding: 10 }}>{tier.eliteReward ? `${tier.eliteReward.label} (${tier.eliteReward.type})` : '—'}</td>
                                        <td style={{ padding: 10 }}>
                                            <button
                                                type="button"
                                                disabled={Boolean(season?.isSettled)}
                                                onClick={() => setEditingTier(tier)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1',
                                                    background: season?.isSettled ? '#f1f5f9' : '#fff',
                                                    cursor: season?.isSettled ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: 10 }}>Hạng</th>
                                    <th style={{ padding: 10 }}>Người chơi</th>
                                    <th style={{ padding: 10 }}>Cấp</th>
                                    <th style={{ padding: 10 }}>Pass XP</th>
                                    <th style={{ padding: 10 }}>Sổ Tinh Anh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((row) => (
                                    <tr key={row.userId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 10, fontWeight: 700 }}>#{row.rank}</td>
                                        <td style={{ padding: 10 }}>{row.username}</td>
                                        <td style={{ padding: 10 }}>Cấp {row.currentLevel}</td>
                                        <td style={{ padding: 10 }}>{row.totalPassXp} XP</td>
                                        <td style={{ padding: 10 }}>{row.isEliteUnlocked ? '👑 Tinh Anh' : 'Tập Sự'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {editingTier && season && (
                <TierRewardEditorModal
                    tier={editingTier}
                    eliteAvatarFrameId={season.eliteAvatarFrameId}
                    saving={saving}
                    onClose={() => setEditingTier(null)}
                    onSave={handleSaveTier}
                />
            )}
        </div>
    );
}

