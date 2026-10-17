import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface MysteryBoxModalProps {
    isOpen: boolean;
    editBoxId: string | null;
    initialData: any;
    items: any[];
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({
    isOpen,
    editBoxId,
    initialData,
    items,
    onClose,
    onSaveSuccess,
}) => {
    const [boxForm, setBoxForm] = useState({
        name: '',
        description: '',
        itemType: '',
        rarity: 'common',
        bonusDropChance: 0,
        isActive: true,
        imageUrl: '',
        rewards: [] as { specialItem: string; rewardForm: 'full' | 'fragment'; amount: number; probability: number }[],
    });

    useEffect(() => {
        if (initialData) {
            setBoxForm({
                name: initialData.name || '',
                description: initialData.description || '',
                itemType: initialData.itemType || '',
                rarity: initialData.rarity || 'common',
                bonusDropChance: initialData.bonusDropChance || 0,
                isActive: initialData.isActive ?? true,
                imageUrl: initialData.imageUrl || '',
                rewards: initialData.rewards?.map((r: any) => ({
                    specialItem: r.specialItem?._id || r.specialItem || '',
                    rewardForm: r.rewardForm || 'full',
                    amount: r.amount || 1,
                    probability: r.probability || 10,
                })) || [],
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSaveBox = async () => {
        try {
            if (editBoxId) {
                await adminApi.updateMysteryBox(editBoxId, boxForm);
                alert('Cập nhật Box thành công!');
            } else {
                await adminApi.createMysteryBox(boxForm);
                alert('Tạo Box thành công!');
            }
            onClose();
            onSaveSuccess();
        } catch (error: any) {
            alert('Lỗi: ' + error.message);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: 20 }}>
            <div style={{ background: '#1E293B', padding: 24, borderRadius: 12, width: 600, color: '#FFF', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3>{editBoxId ? 'Sửa Box Đặc Biệt' : 'Tạo Box Đặc Biệt'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Tên Box</label>
                            <input
                                placeholder="VD: Hộp Quà Tân Thủ"
                                value={boxForm.name}
                                onChange={e => setBoxForm({ ...boxForm, name: e.target.value })}
                                style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Loại Box (Code ID)</label>
                            <input
                                placeholder="VD: starter_box_1"
                                value={boxForm.itemType}
                                onChange={e => setBoxForm({ ...boxForm, itemType: e.target.value })}
                                style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Mô tả Box</label>
                        <input
                            placeholder="Nhập mô tả..."
                            value={boxForm.description}
                            onChange={e => setBoxForm({ ...boxForm, description: e.target.value })}
                            style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Phẩm chất Box</label>
                            <select
                                value={boxForm.rarity}
                                onChange={e => setBoxForm({ ...boxForm, rarity: e.target.value })}
                                style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                            >
                                <option value="common">Thường (Common)</option>
                                <option value="rare">Hiếm (Rare)</option>
                                <option value="epic">Sử Thi (Epic)</option>
                                <option value="legendary">Huyền Thoại (Legendary)</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Tỉ lệ rơi thêm đồ (Bonus %)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={boxForm.bonusDropChance}
                                onChange={e => setBoxForm({ ...boxForm, bonusDropChance: Number(e.target.value) })}
                                style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Link Ảnh Box (URL)</label>
                        <input
                            placeholder="https://..."
                            value={boxForm.imageUrl}
                            onChange={e => setBoxForm({ ...boxForm, imageUrl: e.target.value })}
                            style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        />
                    </div>

                    <hr style={{ borderColor: '#334155', margin: '12px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, color: '#38BDF8' }}>Danh Sách Phần Thưởng (Pool)</h4>
                        <button
                            onClick={() => setBoxForm({
                                ...boxForm,
                                rewards: [...boxForm.rewards, { specialItem: items[0]?._id || '', rewardForm: 'full', amount: 1, probability: 10 }]
                            })}
                            style={{ background: '#38BDF8', color: '#0F172A', padding: '4px 12px', borderRadius: 4, border: 'none', fontWeight: 'bold' }}
                        >
                            + Thêm quà
                        </button>
                    </div>

                    {boxForm.rewards.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, background: '#0F172A', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                            <div style={{ flex: 2 }}>
                                <label style={{ fontSize: 10, color: '#94A3B8' }}>Vật phẩm</label>
                                <select
                                    value={r.specialItem}
                                    onChange={e => {
                                        const nr = [...boxForm.rewards];
                                        nr[i].specialItem = e.target.value;
                                        setBoxForm({ ...boxForm, rewards: nr });
                                    }}
                                    style={{ width: '100%', padding: 4 }}
                                >
                                    <option value="" disabled>Chọn vật phẩm...</option>
                                    {items.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, color: '#94A3B8' }}>Dạng</label>
                                <select
                                    value={r.rewardForm}
                                    onChange={e => {
                                        const nr = [...boxForm.rewards];
                                        nr[i].rewardForm = e.target.value as any;
                                        setBoxForm({ ...boxForm, rewards: nr });
                                    }}
                                    style={{ width: '100%', padding: 4 }}
                                >
                                    <option value="full">Nguyên bản</option>
                                    <option value="fragment">Dạng Mảnh</option>
                                </select>
                            </div>
                            <div style={{ width: 60 }}>
                                <label style={{ fontSize: 10, color: '#94A3B8' }}>SL</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={r.amount}
                                    onChange={e => {
                                        const nr = [...boxForm.rewards];
                                        nr[i].amount = Number(e.target.value);
                                        setBoxForm({ ...boxForm, rewards: nr });
                                    }}
                                    style={{ width: '100%', padding: 4 }}
                                />
                            </div>
                            <div style={{ width: 80 }}>
                                <label style={{ fontSize: 10, color: '#94A3B8' }}>Tỷ lệ (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.probability}
                                    onChange={e => {
                                        const nr = [...boxForm.rewards];
                                        nr[i].probability = Number(e.target.value);
                                        setBoxForm({ ...boxForm, rewards: nr });
                                    }}
                                    style={{ width: '100%', padding: 4 }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const nr = boxForm.rewards.filter((_, idx) => idx !== i);
                                    setBoxForm({ ...boxForm, rewards: nr });
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: 16, cursor: 'pointer', marginTop: 12 }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <button onClick={handleSaveBox} style={{ flex: 1, padding: '10px 0', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Lưu Box</button>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: '#64748B', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Huỷ</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MysteryBoxModal;
