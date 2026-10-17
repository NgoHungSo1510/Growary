import React from 'react';
import { adminApi } from '../../services/api';

interface VipConfigTabProps {
    vipTiers: any[];
    setVipTiers: React.Dispatch<React.SetStateAction<any[]>>;
}

export const VipConfigTab: React.FC<VipConfigTabProps> = ({ vipTiers, setVipTiers }) => {
    const handleSaveVip = async () => {
        try {
            await adminApi.updateVipConfig(vipTiers);
            alert('Lưu cấu hình VIP thành công!');
        } catch (e: any) {
            alert('Lỗi khi lưu VIP: ' + e.message);
        }
    };

    const handleResetVip = async () => {
        const userId = prompt('Nhập ID User muốn reset VIP:');
        if (!userId) return;
        const tierStr = prompt('Nhập Tier muốn reset về (0-11, mặc định 0):', '0');
        const resetToTier = parseInt(tierStr || '0', 10);

        try {
            const res = await adminApi.resetVip(userId, resetToTier);
            alert(`Reset VIP thành công cho User: ${res.user?.username || userId}`);
        } catch (e: any) {
            alert('Lỗi khi reset VIP: ' + e.message);
        }
    };

    return (
        <div className="card">
            <div className="card__header">
                <h3 className="card__title">👑 Cấu hình Thẻ Hạng (VIP)</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn--danger" onClick={handleResetVip}>⚠️ Reset VIP User</button>
                    <button className="btn btn--primary" onClick={handleSaveVip}>💾 Lưu VIP</button>
                </div>
            </div>
            <div className="card__body" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 600 }}>
                    <thead>
                        <tr>
                            <th>Cấp</th>
                            <th>Icon</th>
                            <th>Tên hạng</th>
                            <th>Chi tiêu tối thiểu (G)</th>
                            <th>Hoàn tiền cuối tháng (%)</th>
                            <th>Màu sắc</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vipTiers.map((tier, idx) => (
                            <tr key={idx}>
                                <td>{tier.tier}</td>
                                <td style={{ fontSize: '20px' }}>{tier.icon}</td>
                                <td style={{ fontWeight: 'bold', color: tier.color }}>{tier.name}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={tier.minSpending}
                                        onChange={e => {
                                            const newTiers = [...vipTiers];
                                            newTiers[idx].minSpending = Number(e.target.value);
                                            setVipTiers(newTiers);
                                        }}
                                        style={{ width: 100, padding: 8 }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={tier.cashbackPercent}
                                        onChange={e => {
                                            const newTiers = [...vipTiers];
                                            newTiers[idx].cashbackPercent = Number(e.target.value);
                                            setVipTiers(newTiers);
                                        }}
                                        style={{ width: 80, padding: 8 }}
                                    />
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 20, height: 20, backgroundColor: tier.color, borderRadius: 4, border: '1px solid #334155' }}></div>
                                        <span>{tier.color}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VipConfigTab;
