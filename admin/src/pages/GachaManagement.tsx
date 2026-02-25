import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import './GachaManagement.css';

export default function GachaManagement() {
    const [items, setItems] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState('coins');
    const [value, setValue] = useState(0);
    const [rewardId, setRewardId] = useState('');
    const [rarity, setRarity] = useState('normal');
    const [probability, setProbability] = useState(0);
    const [tier, setTier] = useState(1);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gachaRes, rewardsRes] = await Promise.all([
                adminApi.get('/admin/gacha'),
                adminApi.getAllRewards()
            ]);
            setItems(gachaRes.items || []);
            setRewards(rewardsRes.rewards || []);
        } catch (error) {
            console.error('Failed to fetch Gacha data', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setName(item.name);
            setType(item.type);
            setValue(item.value || 0);
            setRewardId(item.rewardId?._id || '');
            setRarity(item.rarity);
            setProbability(item.probability);
            setTier(item.tier);
            setIsActive(item.isActive);
        } else {
            setEditingItem(null);
            setName('');
            setType('coins');
            setValue(0);
            setRewardId('');
            setRarity('normal');
            setProbability(0);
            setTier(1);
            setIsActive(true);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                name,
                type,
                rarity,
                probability: Number(probability),
                tier: Number(tier),
                isActive
            };

            if (type === 'coins' || type === 'xp' || type === 'tickets') {
                payload.value = Number(value);
            } else if (type === 'item') {
                payload.rewardId = rewardId;
            }

            if (editingItem) {
                await adminApi.put(`/admin/gacha/${editingItem._id}`, payload);
            } else {
                await adminApi.post('/admin/gacha', payload);
            }

            fetchData();
            closeModal();
        } catch (error) {
            console.error('Failed to save gacha item', error);
            alert('Lỗi lưu vật phẩm Gacha');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa vật phẩm này?')) return;
        try {
            await adminApi.delete(`/admin/gacha/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete gacha item', error);
            alert('Lỗi xóa vật phẩm');
        }
    };

    const getRarityBadge = (r: string) => {
        if (r === 'normal') return <span className="gacha-badge gacha-normal">Normal</span>;
        if (r === 'rare') return <span className="gacha-badge gacha-rare">Rare</span>;
        if (r === 'epic') return <span className="gacha-badge gacha-epic">Epic</span>;
        if (r === 'legend') return <span className="gacha-badge gacha-legend">Legend</span>;
        return null;
    };

    const formatReward = (item: any) => {
        if (item.type === 'coins') return `${item.value} Coins`;
        if (item.type === 'xp') return `${item.value} XP`;
        if (item.type === 'tickets') return `${item.value} Tickets`;
        if (item.type === 'item' && item.rewardId) return item.rewardId.title;
        return 'N/A';
    };

    if (loading) return <div>Đang tải dữ liệu Gacha...</div>;

    // Group items by Tier
    const itemsByTier: Record<number, any[]> = {};
    items.forEach(i => {
        if (!itemsByTier[i.tier]) itemsByTier[i.tier] = [];
        itemsByTier[i.tier].push(i);
    });

    return (
        <div className="gacha-management">
            <div className="gm-header">
                <h2>Quản lý Vòng Quay (Gacha)</h2>
                <button className="btn-primary" onClick={() => openModal()}>+ Thêm vật phẩm vào vòng quay</button>
            </div>

            {Object.keys(itemsByTier).sort((a, b) => Number(a) - Number(b)).map(tierKey => {
                const tierItems = itemsByTier[Number(tierKey)];
                const totalProb = tierItems.reduce((sum, it) => sum + it.probability, 0);

                return (
                    <div key={tierKey} className="tier-section">
                        <h3>Tầng {tierKey} (Total Probability: {totalProb.toFixed(2)}%)</h3>
                        <table className="gm-table">
                            <thead>
                                <tr>
                                    <th>Cờ</th>
                                    <th>Tên hiển thị</th>
                                    <th>Loại quà</th>
                                    <th>Mức thưởng</th>
                                    <th>Độ Hiếm (Màu vòng)</th>
                                    <th>Xác suất (Trọng số)</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tierItems.map(item => (
                                    <tr key={item._id} className={!item.isActive ? 'gm-inactive' : ''}>
                                        <td>{item.isActive ? '🟢' : '⚪'}</td>
                                        <td>{item.name}</td>
                                        <td>{item.type.toUpperCase()}</td>
                                        <td>{formatReward(item)}</td>
                                        <td>{getRarityBadge(item.rarity)}</td>
                                        <td>{item.probability}%</td>
                                        <td>
                                            <button className="btn-text btn-edit" onClick={() => openModal(item)}>Sửa</button>
                                            <button className="btn-text btn-danger" onClick={() => handleDelete(item._id)}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}

            {showModal && (
                <div className="gm-modal-overlay" onClick={closeModal}>
                    <div className="gm-modal" onClick={e => e.stopPropagation()}>
                        <h2>{editingItem ? 'Sửa vật phẩm Gacha' : 'Thêm vật phẩm Gacha'}</h2>
                        <form onSubmit={handleSubmit}>

                            <div className="gm-form-group">
                                <label>Tên hiển thị trên Vòng Quay</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Rương Code Random" />
                            </div>

                            <div className="gm-form-row">
                                <div className="gm-form-group">
                                    <label>Loại Quà</label>
                                    <select value={type} onChange={e => setType(e.target.value)}>
                                        <option value="coins">Coins</option>
                                        <option value="xp">XP</option>
                                        <option value="tickets">Gacha Tickets (Trả vé)</option>
                                        <option value="item">Vật phẩm Shop (Voucher)</option>
                                    </select>
                                </div>
                                <div className="gm-form-group">
                                    <label>Tầng (Tier)</label>
                                    <input type="number" min="1" required value={tier} onChange={e => setTier(Number(e.target.value))} />
                                </div>
                            </div>

                            {type === 'item' ? (
                                <div className="gm-form-group">
                                    <label>Chọn Vật Phẩm Shop</label>
                                    <select value={rewardId} onChange={e => setRewardId(e.target.value)} required>
                                        <option value="">-- Chọn vật phẩm --</option>
                                        {rewards.filter(r => r.isActive).map(r => (
                                            <option key={r._id} value={r._id}>{r.title} (Kho: {r.stock === null ? 'Vô hạn' : r.stock})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="gm-form-group">
                                    <label>Mức Thưởng (Số lượng {type})</label>
                                    <input type="number" min="1" required value={value} onChange={e => setValue(Number(e.target.value))} />
                                </div>
                            )}

                            <div className="gm-form-row">
                                <div className="gm-form-group">
                                    <label>Độ Hiếm</label>
                                    <select value={rarity} onChange={e => setRarity(e.target.value)}>
                                        <option value="normal">Normal (Xanh lá - 40~60%)</option>
                                        <option value="rare">Rare (Xanh lam - 20~30%)</option>
                                        <option value="epic">Epic (Tím - 5~10%)</option>
                                        <option value="legend">Legend (Vàng - &lt;1%)</option>
                                    </select>
                                </div>
                                <div className="gm-form-group">
                                    <label>Xác suất ra (%)</label>
                                    <input type="number" step="0.01" min="0" required value={probability} onChange={e => setProbability(Number(e.target.value))} />
                                </div>
                            </div>

                            <div className="gm-form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                    Vật phẩm này đang Active
                                </label>
                            </div>

                            <div className="gm-form-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Hủy</button>
                                <button type="submit" className="btn-primary">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
