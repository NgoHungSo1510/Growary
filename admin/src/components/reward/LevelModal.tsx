import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface RewardItem {
    _id: string;
    title: string;
    imageUrl?: string;
    pointCost: number;
}

interface Level {
    _id: string;
    level: number;
    xpRequired: number;
    coinReward: number;
    gachaTickets?: number;
    rewardItems?: RewardItem[];
    unlockDescription: string;
}

interface LevelModalProps {
    isOpen: boolean;
    editLevelMode: Level | null;
    rewardsList: RewardItem[];
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const LevelModal: React.FC<LevelModalProps> = ({
    isOpen,
    editLevelMode,
    rewardsList,
    onClose,
    onSaveSuccess,
}) => {
    const [levelForm, setLevelForm] = useState({
        level: 1,
        xpRequired: 0,
        coinReward: 0,
        gachaTickets: 0,
        rewardItems: [] as string[],
        unlockDescription: '',
    });

    useEffect(() => {
        if (editLevelMode) {
            setLevelForm({
                level: editLevelMode.level,
                xpRequired: editLevelMode.xpRequired,
                coinReward: editLevelMode.coinReward,
                gachaTickets: editLevelMode.gachaTickets || 0,
                rewardItems: (editLevelMode.rewardItems || []).map(r => r._id),
                unlockDescription: editLevelMode.unlockDescription || '',
            });
        } else {
            setLevelForm({
                level: 1,
                xpRequired: 0,
                coinReward: 0,
                gachaTickets: 0,
                rewardItems: [],
                unlockDescription: '',
            });
        }
    }, [editLevelMode, isOpen]);

    if (!isOpen) return null;

    const toggleLevelRewardItem = (id: string) => {
        setLevelForm(prev => {
            const exists = prev.rewardItems.includes(id);
            return {
                ...prev,
                rewardItems: exists ? prev.rewardItems.filter(item => item !== id) : [...prev.rewardItems, id],
            };
        });
    };

    const handleSaveLevel = async () => {
        try {
            if (editLevelMode) {
                await adminApi.updateLevel(editLevelMode._id, levelForm);
            } else {
                await adminApi.createLevel(levelForm);
            }
            onClose();
            onSaveSuccess();
        } catch (e: any) {
            alert('Lỗi: ' + e.message);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                <div className="modal__header">
                    <span className="modal__title">
                        {editLevelMode ? `✏️ Sửa Cấp ${levelForm.level}` : '➕ Tạo Cấp độ mới'}
                    </span>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                <div className="modal__body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>Số Cấp độ *</label>
                            <input
                                type="number"
                                value={levelForm.level}
                                onChange={e => setLevelForm({ ...levelForm, level: Number(e.target.value) })}
                                min={1}
                                disabled={!!editLevelMode}
                                style={{ background: editLevelMode ? '#f3f4f6' : 'white' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>XP Yêu cầu *</label>
                            <input
                                type="number"
                                value={levelForm.xpRequired}
                                onChange={e => setLevelForm({ ...levelForm, xpRequired: Number(e.target.value) })}
                                min={0}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                        <div className="form-group">
                            <label>🪙 Coin Thưởng (khi đạt cấp)</label>
                            <input
                                type="number"
                                value={levelForm.coinReward}
                                onChange={e => setLevelForm({ ...levelForm, coinReward: Number(e.target.value) })}
                                min={0}
                            />
                        </div>
                        <div className="form-group">
                            <label>🎟️ Tặng Vé Gacha</label>
                            <input
                                type="number"
                                value={levelForm.gachaTickets}
                                onChange={e => setLevelForm({ ...levelForm, gachaTickets: Number(e.target.value) })}
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 8 }}>
                        <label>🎁 Tặng Đặc Quyền (Shop Items dưới dạng Product Tickets)</label>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Chọn các phần quà từ cửa hàng. Người chơi sẽ được nhận MIỄN PHÍ vào mục "Quà tặng" khi đạt cấp này.
                        </div>
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                            maxHeight: 240, overflowY: 'auto', padding: 8, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--card-border)'
                        }}>
                            {rewardsList.map(r => {
                                const isSelected = levelForm.rewardItems.includes(r._id);
                                return (
                                    <div
                                        key={r._id}
                                        onClick={() => toggleLevelRewardItem(r._id)}
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

                    <div className="form-group">
                        <label>Mô tả Đặc quyền (Tùy chọn)</label>
                        <input
                            type="text"
                            value={levelForm.unlockDescription}
                            onChange={e => setLevelForm({ ...levelForm, unlockDescription: e.target.value })}
                            placeholder="Ví dụ: Mở khóa mua Khung Avatar Bạc"
                        />
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            Cái này sẽ hiển thị lên giao diện Roadmap và Thông báo thăng cấp.
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
                    <button className="btn btn--primary" onClick={handleSaveLevel}>
                        {editLevelMode ? '💾 Lưu thay đổi' : '🚀 Tạo Cấp độ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LevelModal;
