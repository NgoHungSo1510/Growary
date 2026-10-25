import React, { useState, useEffect } from 'react';
import { SpecialItemConfig, Reward } from '@shared';
import { warehouseConfigService } from '../../services/warehouseConfigService';
import { rewardService } from '../../services/rewardService';

export const ProductFragmentMappingTab: React.FC = () => {
    const [configs, setConfigs] = useState<SpecialItemConfig[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedRewardId, setSelectedRewardId] = useState('');
    const [fragmentType, setFragmentType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [configsRes, rewardsRes] = await Promise.all([
                warehouseConfigService.getSpecialItemConfigs(),
                rewardService.getAllRewards(),
            ]);
            setConfigs(configsRes.configs || []);
            setRewards(rewardsRes.rewards || []);
        } catch (err: any) {
            setError(err.message || 'Không thể tải dữ liệu ánh xạ mảnh');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRewardId || !fragmentType.trim()) {
            alert('Vui lòng chọn quà tặng và nhập mã mảnh');
            return;
        }

        setIsSubmitting(true);
        try {
            await warehouseConfigService.createSpecialItemConfig({
                rewardId: selectedRewardId,
                fragmentType: fragmentType.trim().toLowerCase(),
            });
            setSelectedRewardId('');
            setFragmentType('');
            await loadData();
        } catch (err: any) {
            alert(err.message || 'Lỗi khi tạo ánh xạ sản phẩm - mảnh');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (config: SpecialItemConfig) => {
        try {
            await warehouseConfigService.updateSpecialItemConfig(config._id, {
                isActive: !config.isActive,
            });
            setConfigs(prev =>
                prev.map(c => (c._id === config._id ? { ...c, isActive: !c.isActive } : c))
            );
        } catch (err: any) {
            alert(err.message || 'Lỗi khi cập nhật trạng thái kích hoạt');
        }
    };

    const handleToggleBoxPool = async (config: SpecialItemConfig) => {
        try {
            await warehouseConfigService.updateSpecialItemConfig(config._id, {
                addedToBoxPool: !config.addedToBoxPool,
            });
            setConfigs(prev =>
                prev.map(c => (c._id === config._id ? { ...c, addedToBoxPool: !c.addedToBoxPool } : c))
            );
        } catch (err: any) {
            alert(err.message || 'Lỗi khi cập nhật trạng thái đưa vào rương');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xoá ánh xạ mảnh này?')) return;
        try {
            await warehouseConfigService.deleteSpecialItemConfig(id);
            setConfigs(prev => prev.filter(c => c._id !== id));
        } catch (err: any) {
            alert(err.message || 'Lỗi khi xoá ánh xạ');
        }
    };

    const getRewardTitle = (reward: Reward | string) => {
        if (typeof reward === 'object' && reward !== null) {
            return reward.title;
        }
        const found = rewards.find(r => r._id === reward);
        return found ? found.title : reward;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#1E293B', padding: 20, borderRadius: 12 }}>
                <h3 style={{ color: '#F8FAFC', marginBottom: 12, fontSize: 18 }}>
                    ➕ Thêm Ánh Xạ Quà Tặng ➔ Mảnh Rương
                </h3>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#94A3B8', marginBottom: 6 }}>
                            Chọn Quà Tặng
                        </label>
                        <select
                            value={selectedRewardId}
                            onChange={e => setSelectedRewardId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: '#0F172A',
                                color: '#FFF',
                                border: '1px solid #334155',
                                borderRadius: 8,
                            }}
                            required
                        >
                            <option value="">-- Chọn sản phẩm quà tặng --</option>
                            {rewards.map(r => (
                                <option key={r._id} value={r._id}>
                                    {r.title} ({r.pointCost} pts)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#94A3B8', marginBottom: 6 }}>
                            Mã Định Danh Mảnh (Fragment Type)
                        </label>
                        <input
                            type="text"
                            placeholder="vd: frag_headphone, frag_50k"
                            value={fragmentType}
                            onChange={e => setFragmentType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: '#0F172A',
                                color: '#FFF',
                                border: '1px solid #334155',
                                borderRadius: 8,
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            padding: '10px 20px',
                            background: '#10B981',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 'bold',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isSubmitting ? 'Đang lưu...' : '+ Thêm Ánh Xạ'}
                    </button>
                </form>
            </div>

            <div style={{ background: '#1E293B', padding: 20, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ color: '#F8FAFC', fontSize: 18 }}>
                        📋 Danh Sách Cấu Hình Ghép Mảnh & Rương Thưởng
                    </h3>
                    <button
                        onClick={loadData}
                        style={{
                            background: '#334155',
                            color: '#F8FAFC',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 13,
                        }}
                    >
                        🔄 Làm mới
                    </button>
                </div>

                {error && <div style={{ color: '#EF4444', marginBottom: 12 }}>{error}</div>}

                {loading ? (
                    <div style={{ color: '#94A3B8', textAlign: 'center', padding: 24 }}>Đang tải cấu hình...</div>
                ) : configs.length === 0 ? (
                    <div style={{ color: '#94A3B8', textAlign: 'center', padding: 24 }}>
                        Chưa có ánh xạ nào. Hãy thêm quà tặng ở form phía trên.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8', fontSize: 13 }}>
                                    <th style={{ padding: '10px 12px' }}>Sản phẩm / Quà</th>
                                    <th style={{ padding: '10px 12px' }}>Mã Mảnh Ghép</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Vào Rương Gacha?</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Hoạt Động</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {configs.map(cfg => (
                                    <tr
                                        key={cfg._id}
                                        style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            color: '#F8FAFC',
                                            fontSize: 14,
                                        }}
                                    >
                                        <td style={{ padding: '12px', fontWeight: 500 }}>
                                            {getRewardTitle(cfg.reward)}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <code
                                                style={{
                                                    background: '#0F172A',
                                                    padding: '3px 8px',
                                                    borderRadius: 4,
                                                    color: '#38BDF8',
                                                    fontSize: 12,
                                                }}
                                            >
                                                {cfg.fragmentType}
                                            </code>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={cfg.addedToBoxPool}
                                                onChange={() => handleToggleBoxPool(cfg)}
                                                style={{ cursor: 'pointer', width: 16, height: 16 }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleToggleActive(cfg)}
                                                style={{
                                                    background: cfg.isActive ? '#065F46' : '#374151',
                                                    color: cfg.isActive ? '#34D399' : '#9CA3AF',
                                                    border: 'none',
                                                    padding: '4px 10px',
                                                    borderRadius: 12,
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {cfg.isActive ? 'Bật' : 'Tắt'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(cfg._id)}
                                                style={{
                                                    background: '#EF4444',
                                                    color: '#FFF',
                                                    border: 'none',
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Xoá
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductFragmentMappingTab;
