import { useState } from 'react';
import type { PassQuestActivity, PassQuestDefinition, PassQuestPeriod, PassQuestProgressMode } from '@shared';

interface SeasonPassQuestsTabProps {
    quests: PassQuestDefinition[];
    isSettled: boolean;
    saving: boolean;
    onSaveQuest: (quest: PassQuestDefinition, isNew: boolean) => Promise<void>;
    onDeleteQuest: (questCode: string) => Promise<void>;
}

const DEFAULT_FORM: PassQuestDefinition = {
    questCode: '',
    title: '',
    description: '',
    period: 'daily',
    activityType: 'task_complete',
    progressMode: 'inc',
    targetCount: 1,
    rewardPassXp: 30,
    rewardVaultCoins: 20,
    navigateToScreen: 'Home',
};

export default function SeasonPassQuestsTab({
    quests,
    isSettled,
    saving,
    onSaveQuest,
    onDeleteQuest,
}: SeasonPassQuestsTabProps) {
    const [periodFilter, setPeriodFilter] = useState<string>('all');
    const [editingQuest, setEditingQuest] = useState<PassQuestDefinition | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [formError, setFormError] = useState('');

    const filteredQuests = quests.filter((q) => {
        if (periodFilter === 'all') return true;
        return q.period === periodFilter;
    });

    const handleOpenCreate = () => {
        setIsNew(true);
        setEditingQuest({ ...DEFAULT_FORM, questCode: `quest_${Date.now().toString(36)}` });
        setFormError('');
    };

    const handleOpenEdit = (quest: PassQuestDefinition) => {
        setIsNew(false);
        setEditingQuest({ ...quest });
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuest) return;
        if (!editingQuest.questCode.trim() || !editingQuest.title.trim()) {
            setFormError('Vui lòng điền mã và tiêu đề nhiệm vụ');
            return;
        }
        try {
            await onSaveQuest(editingQuest, isNew);
            setEditingQuest(null);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Lỗi khi lưu nhiệm vụ');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['all', 'daily', 'weekly', 'season'] as const).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriodFilter(p)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                background: periodFilter === p ? '#4f46e5' : '#fff',
                                color: periodFilter === p ? '#fff' : '#475569',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            {p === 'all' ? 'Tất cả' : p === 'daily' ? 'Hàng ngày' : p === 'weekly' ? 'Hàng tuần' : 'Cả mùa'}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    disabled={isSettled}
                    onClick={handleOpenCreate}
                    style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: isSettled ? '#cbd5e1' : '#10b981',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: isSettled ? 'not-allowed' : 'pointer',
                    }}
                >
                    ➕ Thêm Nhiệm Vụ Mới
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                            <th style={{ padding: 10 }}>Mã & Tiêu đề</th>
                            <th style={{ padding: 10 }}>Chu kỳ</th>
                            <th style={{ padding: 10 }}>Hành động & Mục tiêu</th>
                            <th style={{ padding: 10 }}>Thưởng XP</th>
                            <th style={{ padding: 10 }}>Thưởng Két</th>
                            <th style={{ padding: 10, width: 140 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuests.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                                    Không có nhiệm vụ nào trong bộ lọc này.
                                </td>
                            </tr>
                        ) : (
                            filteredQuests.map((q) => (
                                <tr key={q.questCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: 10 }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{q.title}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}><code>{q.questCode}</code> • {q.description}</div>
                                    </td>
                                    <td style={{ padding: 10 }}>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                                            background: q.period === 'daily' ? '#dbeafe' : q.period === 'weekly' ? '#fef3c7' : '#e0e7ff',
                                            color: q.period === 'daily' ? '#1e40af' : q.period === 'weekly' ? '#92400e' : '#3730a3',
                                        }}>
                                            {q.period.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: 10, fontSize: 13 }}>
                                        <code>{q.activityType}</code> (x{q.targetCount})
                                    </td>
                                    <td style={{ padding: 10, fontWeight: 700, color: '#4f46e5' }}>+{q.rewardPassXp} XP</td>
                                    <td style={{ padding: 10, fontWeight: 700, color: '#d97706' }}>+{q.rewardVaultCoins} Xu</td>
                                    <td style={{ padding: 10 }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                type="button"
                                                disabled={isSettled}
                                                onClick={() => handleOpenEdit(q)}
                                                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isSettled}
                                                onClick={() => onDeleteQuest(q.questCode)}
                                                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer' }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editingQuest && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
                }}>
                    <form onSubmit={handleSubmit} style={{
                        background: '#fff', borderRadius: 12, maxWidth: 540, width: '100%',
                        maxHeight: '90vh', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                        <h3 style={{ margin: 0 }}>{isNew ? '➕ Thêm Nhiệm Vụ Mới' : '✏️ Chỉnh Sửa Nhiệm Vụ'}</h3>
                        {formError && <div style={{ color: '#dc2626', fontSize: 13 }}>{formError}</div>}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Mã nhiệm vụ (Code)</label>
                                <input
                                    type="text"
                                    disabled={!isNew}
                                    value={editingQuest.questCode}
                                    onChange={(e) => setEditingQuest({ ...editingQuest, questCode: e.target.value })}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Chu kỳ</label>
                                <select
                                    value={editingQuest.period}
                                    onChange={(e) => setEditingQuest({ ...editingQuest, period: e.target.value as PassQuestPeriod })}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                >
                                    <option value="daily">Hàng ngày (Daily)</option>
                                    <option value="weekly">Hàng tuần (Weekly)</option>
                                    <option value="season">Cả mùa (Season)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Tiêu đề</label>
                            <input
                                type="text"
                                value={editingQuest.title}
                                onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Mô tả chi tiết</label>
                            <textarea
                                rows={2}
                                value={editingQuest.description}
                                onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
                                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Loại hoạt động</label>
                                <select
                                    value={editingQuest.activityType}
                                    onChange={(e) => setEditingQuest({ ...editingQuest, activityType: e.target.value as PassQuestActivity })}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                >
                                    <option value="task_complete">task_complete</option>
                                    <option value="xp_earn">xp_earn</option>
                                    <option value="streak_day">streak_day</option>
                                    <option value="boss_defeat">boss_defeat</option>
                                    <option value="gacha_spin">gacha_spin</option>
                                    <option value="quiz_complete">quiz_complete</option>
                                    <option value="coins_earn">coins_earn</option>
                                    <option value="mystery_box_open">mystery_box_open</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Tiến độ</label>
                                <select
                                    value={editingQuest.progressMode}
                                    onChange={(e) => setEditingQuest({ ...editingQuest, progressMode: e.target.value as PassQuestProgressMode })}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                >
                                    <option value="inc">Cộng dồn (inc)</option>
                                    <option value="max">Mốc cao nhất (max)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Mục tiêu</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editingQuest.targetCount}
                                    onChange={(e) => setEditingQuest({ ...editingQuest, targetCount: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Thưởng Pass XP</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={editingQuest.rewardPassXp}
                                    onChange={(e) => setEditingQuest({ ...editingQuest, rewardPassXp: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>Thưởng Xu Két Sắt</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={editingQuest.rewardVaultCoins}
                                    onChange={(e) => setEditingQuest({ ...editingQuest, rewardVaultCoins: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                            <button
                                type="button"
                                onClick={() => setEditingQuest(null)}
                                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {saving ? 'Đang lưu...' : 'Lưu nhiệm vụ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
