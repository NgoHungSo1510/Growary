import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface RewardItem {
    _id: string;
    title: string;
    imageUrl?: string;
    pointCost: number;
}

interface Milestone {
    _id: string;
    type: 'streak';
    target: number;
    coins: number;
    gachaTickets: number;
    rewardItems: RewardItem[];
}

interface MilestoneModalProps {
    isOpen: boolean;
    editMode: Milestone | null;
    rewardsList: RewardItem[];
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
    isOpen,
    editMode,
    rewardsList,
    onClose,
    onSaveSuccess,
}) => {
    const [form, setForm] = useState({
        type: 'streak',
        target: 10,
        coins: 0,
        gachaTickets: 0,
        rewardItems: [] as string[],
    });

    useEffect(() => {
        if (editMode) {
            setForm({
                type: editMode.type,
                target: editMode.target,
                coins: editMode.coins,
                gachaTickets: editMode.gachaTickets || 0,
                rewardItems: (editMode.rewardItems || []).map(r => r._id),
            });
        } else {
            setForm({
                type: 'streak',
                target: 10,
                coins: 0,
                gachaTickets: 0,
                rewardItems: [],
            });
        }
    }, [editMode, isOpen]);

    if (!isOpen) return null;

    const toggleRewardItem = (id: string) => {
        setForm(prev => {
            const exists = prev.rewardItems.includes(id);
            return {
                ...prev,
                rewardItems: exists ? prev.rewardItems.filter(item => item !== id) : [...prev.rewardItems, id],
            };
        });
    };

    const handleSave = async () => {
        try {
            if (editMode) {
                await adminApi.updateMilestone(editMode._id, form);
            } else {
                await adminApi.createMilestone(form);
            }
            onClose();
            onSaveSuccess();
        } catch (e: any) {
            alert('Lỗi: ' + e.message);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                <div className="modal__header">
                    <span className="modal__title">{editMode ? '✏️ Sửa Mốc Thưởng' : '➕ Thêm Mốc Thưởng'}</span>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                <div className="modal__body">
                    <div className="form-group">
                        <label>Loại mốc</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} disabled={!!editMode}>
                            <option value="streak">🔥 Streak liên tục (ngày)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Mục tiêu để nhận thưởng (Ngày) *</label>
                        <input
                            type="number"
                            min="1"
                            value={form.target}
                            onChange={e => setForm({ ...form, target: Number(e.target.value) })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>🪙 Tặng thêm Coins</label>
                            <input
                                type="number"
                                min="0"
                                value={form.coins}
                                onChange={e => setForm({ ...form, coins: Number(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label>🎟️ Tặng Vé Gacha</label>
                            <input
                                type="number"
                                min="0"
                                value={form.gachaTickets}
                                onChange={e => setForm({ ...form, gachaTickets: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 8 }}>
                        <label>🎁 Tặng Đặc Quyền (Shop Items dưới dạng Product Tickets)</label>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Chọn các phần quà từ cửa hàng. Người chơi sẽ được nhận MIỄN PHÍ vào mục "Quà tặng" khi đạt mốc này.
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                            maxHeight: 240, overflowY: 'auto', padding: 8, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--card-border)'
                        }}>
                            {rewardsList.map(r => {
                                const isSelected = form.rewardItems.includes(r._id);
                                return (
                                    <div
                                        key={r._id}
                                        onClick={() => toggleRewardItem(r._id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: 8,
                                            background: isSelected ? 'var(--accent-light)' : 'white',
                                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'}`,
                                            borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {r.imageUrl ? (
                                            <img src={r.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                                        ) : <div style={{ width: 32, height: 32, background: '#eee', borderRadius: 6 }}></div>}
                                        <div style={{ flex: 1, fontSize: 13 }}>
                                            <div style={{ fontWeight: 600 }}>{r.title}</div>
                                            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>🪙 {r.pointCost}</div>
                                        </div>
                                        <div style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--accent)' : 'transparent' }}>
                                            {isSelected && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
                    <button className="btn btn--primary" onClick={handleSave} disabled={form.target <= 0}>
                        {editMode ? '💾 Lưu thay đổi' : '🚀 Thêm mốc thưởng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MilestoneModal;
