import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import type { Voucher } from '../../types';

interface VoucherRedeemTabProps {
    vouchers: Voucher[];
    fetchVouchers: () => Promise<void>;
}

const renderVoucherPerks = (v: Voucher): React.ReactNode => {
    const hasPerks = Boolean(v.hasFreeShip || (v.discountAmount && v.discountAmount > 0) || v.fragmentType);
    if (!hasPerks) {
        return <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>;
    }

    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {v.hasFreeShip && <span className="badge badge--info">Freeship</span>}
            {v.discountAmount !== undefined && v.discountAmount > 0 && (
                <span className="badge badge--success">-{v.discountAmount} Xu</span>
            )}
            {v.fragmentType && (
                <span className="badge badge--warning">Mảnh: {v.fragmentType}</span>
            )}
        </div>
    );
};

export const VoucherRedeemTab: React.FC<VoucherRedeemTabProps> = ({ vouchers, fetchVouchers }) => {
    const [redeemCode, setRedeemCode] = useState('');
    const [confirmingCode, setConfirmingCode] = useState<string | null>(null);
    const [redeemResult, setRedeemResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const confirmByCode = async (targetCode: string, clearInput = false): Promise<void> => {
        const cleanCode = targetCode.trim();
        if (!cleanCode || confirmingCode) return;

        setConfirmingCode(cleanCode);
        try {
            const res = await adminApi.confirmVoucher(cleanCode);
            setRedeemResult({
                type: 'success',
                msg: `✅ Xác nhận thành công! Quà: "${res.voucher.rewardTitleSnapshot}" đã được trao cho user.`,
            });
            if (clearInput) setRedeemCode('');
            await fetchVouchers();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Xác nhận voucher thất bại';
            setRedeemResult({ type: 'error', msg: `❌ ${msg}` });
        } finally {
            setConfirmingCode(null);
        }
    };

    return (
        <>
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card__header">
                    <span className="card__title">🎫 Xác nhận đổi quà</span>
                </div>
                <div className="card__body">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
                        Nhập mã voucher từ người chơi hoặc bấm duyệt nhanh bên dưới để xác nhận trao quà
                    </p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && void confirmByCode(redeemCode, true)}
                                placeholder="Nhập mã voucher... VD: VCH-ABCD1234"
                                style={{ width: '100%', padding: '10px 14px', fontSize: 15 }}
                            />
                        </div>
                        <button
                            className="btn btn--primary"
                            disabled={!redeemCode.trim() || confirmingCode !== null}
                            onClick={() => void confirmByCode(redeemCode, true)}
                        >
                            {confirmingCode === redeemCode.trim() ? '⏳ Đang duyệt...' : '🔍 Kiểm tra & Trao'}
                        </button>
                    </div>

                    {redeemResult && (
                        <div
                            className={`badge ${redeemResult.type === 'success' ? 'badge--success' : 'badge--danger'}`}
                            style={{ display: 'block', padding: '10px 14px', marginTop: 12 }}
                        >
                            {redeemResult.msg}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <span className="card__title">📋 Lịch sử đổi quà</span>
                    <button className="btn btn--secondary" onClick={() => void fetchVouchers()}>🔄 Làm mới</button>
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
                                    <th>Ưu đãi / Nguồn</th>
                                    <th>Giá</th>
                                    <th>Ngày mua</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vouchers.map((v) => (
                                    <tr key={v._id}>
                                        <td style={{ fontWeight: 600 }}>{v.user?.username || v.userName || '—'}</td>
                                        <td>{v.rewardTitleSnapshot}</td>
                                        <td>
                                            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px' }}>
                                                {v.code}
                                            </code>
                                        </td>
                                        <td>{renderVoucherPerks(v)}</td>
                                        <td style={{ fontWeight: 600, color: '#f59e0b' }}>🪙 {v.pointCostSnapshot}</td>
                                        <td>{new Date(v.purchaseDate).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            {v.status === 'pending_use' && <span className="badge badge--warning">Chờ trao</span>}
                                            {v.status === 'used' && <span className="badge badge--success">Đã trao</span>}
                                            {v.status === 'active' && <span className="badge badge--info">Đang giữ</span>}
                                            {v.status === 'expired' && <span className="badge badge--danger">Hết hạn</span>}
                                        </td>
                                        <td>
                                            {v.status === 'pending_use' ? (
                                                <button
                                                    className="btn btn--primary btn--sm"
                                                    disabled={confirmingCode === v.code}
                                                    onClick={() => void confirmByCode(v.code)}
                                                >
                                                    {confirmingCode === v.code ? '⏳ Đang duyệt...' : '✅ Duyệt trao'}
                                                </button>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
                                            )}
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
