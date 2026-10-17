import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import type { Voucher } from '../../types';

interface VoucherRedeemTabProps {
    vouchers: Voucher[];
    fetchVouchers: () => Promise<void>;
}

export const VoucherRedeemTab: React.FC<VoucherRedeemTabProps> = ({ vouchers, fetchVouchers }) => {
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemResult, setRedeemResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const handleRedeemByCode = async () => {
        if (!redeemCode.trim()) return;
        try {
            const res = await adminApi.confirmVoucher(redeemCode.trim());
            setRedeemResult({
                type: 'success',
                msg: `✅ Xác nhận thành công! Quà: "${res.voucher.rewardTitleSnapshot}" đã được trao cho user.`,
            });
            setRedeemCode('');
            fetchVouchers();
        } catch (e: any) {
            setRedeemResult({ type: 'error', msg: `❌ ${e.message}` });
        }
    };

    return (
        <>
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card__header">
                    <span className="card__title">🎫 Xác nhận đổi quà</span>
                </div>
                <div className="card__body">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                        Nhập mã voucher từ người chơi để xác nhận đổi quà
                    </p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                value={redeemCode}
                                onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && handleRedeemByCode()}
                                placeholder="Nhập mã voucher... VD: VCH-ABCD1234"
                                style={{ width: '100%', padding: '12px 16px', fontSize: 16, fontWeight: 600, letterSpacing: 1 }}
                            />
                        </div>
                        <button className="btn btn--primary" onClick={handleRedeemByCode} style={{ padding: '12px 24px', fontSize: 15 }}>
                            🔍 Kiểm tra
                        </button>
                    </div>

                    {redeemResult && (
                        <div style={{
                            marginTop: 16,
                            padding: '12px 16px',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            background: redeemResult.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: redeemResult.type === 'success' ? '#065f46' : '#991b1b',
                        }}>
                            {redeemResult.msg}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <span className="card__title">📋 Lịch sử đổi quà</span>
                    <button className="btn btn--secondary" onClick={fetchVouchers}>🔄 Làm mới</button>
                </div>
                <div className="card__body" style={{ padding: 0 }}>
                    {vouchers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">🎫</div>
                            <div className="empty-state__text">Chưa có lịch sử đổi quà</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Quà</th>
                                    <th>Mã voucher</th>
                                    <th>Giá</th>
                                    <th>Ngày mua</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vouchers.map(v => (
                                    <tr key={v._id}>
                                        <td style={{ fontWeight: 600 }}>{v.user?.username || v.userName || '—'}</td>
                                        <td>{v.rewardTitleSnapshot}</td>
                                        <td>
                                            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                                                {v.code}
                                            </code>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#f59e0b' }}>🪙 {v.pointCostSnapshot}</td>
                                        <td>{new Date(v.purchaseDate).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            {v.status === 'pending_use' && <span className="badge badge--warning">Chờ trao</span>}
                                            {v.status === 'used' && <span className="badge badge--success">Đã trao</span>}
                                            {v.status === 'active' && <span className="badge badge--info">Đang giữ</span>}
                                            {v.status === 'expired' && <span className="badge badge--danger">Hết hạn</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
};

export default VoucherRedeemTab;
