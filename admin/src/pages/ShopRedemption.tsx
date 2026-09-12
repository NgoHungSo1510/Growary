import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import type { Reward, Voucher } from '../types';

type ShopTab = 'shelf' | 'warehouse' | 'redeem' | 'vip';

export default function ShopRedemption() {
    const [tab, setTab] = useState<ShopTab>('shelf');
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [editReward, setEditReward] = useState<Reward | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemResult, setRedeemResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [vipTiers, setVipTiers] = useState<any[]>([]);

    // Form state for create/edit
    const [form, setForm] = useState({
        title: '',
        description: '',
        pointCost: 100,
        stock: 10,
        imageUrl: '',
        shippingFee: 15000,
        isActive: true,
        isFeatured: false,
    });

    const fetchRewards = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminApi.getAllRewards();
            setRewards(data.rewards);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchVouchers = useCallback(async () => {
        try {
            const data = await adminApi.getAllVouchers();
            setVouchers(data.vouchers);
        } catch (e: any) {
            setError(e.message);
        }
    }, []);

    const fetchVipTiers = useCallback(async () => {
        try {
            const res = await adminApi.getVipConfig();
            
            const defaultTiers = [
                { tier: 0,  minSpending: 0, name: 'Lữ Khách', cashbackPercent: 0, color: '#9E9E9E', icon: '🚶' },
                { tier: 1,  minSpending: 30000, name: 'Thương Nhân', cashbackPercent: 1, color: '#8D6E63', icon: '💼' },
                { tier: 2,  minSpending: 80000, name: 'Thương Nhân Giàu', cashbackPercent: 2, color: '#795548', icon: '💰' },
                { tier: 3,  minSpending: 150000, name: 'Hào Phú', cashbackPercent: 3, color: '#78909C', icon: '🎩' },
                { tier: 4,  minSpending: 250000, name: 'Quý Tộc', cashbackPercent: 5, color: '#90A4AE', icon: '🏅' },
                { tier: 5,  minSpending: 370000, name: 'Bá Tước', cashbackPercent: 6, color: '#FFD54F', icon: '🥉' },
                { tier: 6,  minSpending: 500000, name: 'Hầu Tước', cashbackPercent: 8, color: '#FFC107', icon: '🥈' },
                { tier: 7,  minSpending: 640000, name: 'Công Tước', cashbackPercent: 10, color: '#00BCD4', icon: '🥇' },
                { tier: 8,  minSpending: 780000, name: 'Vương Tôn', cashbackPercent: 12, color: '#26C6DA', icon: '🌟' },
                { tier: 9,  minSpending: 870000, name: 'Lãnh Chúa', cashbackPercent: 14, color: '#E91E63', icon: '🏰' },
                { tier: 10, minSpending: 940000, name: 'Hoàng Thân', cashbackPercent: 17, color: '#AB47BC', icon: '👑' },
                { tier: 11, minSpending: 1000000, name: 'Hoàng Gia', cashbackPercent: 20, color: '#F9A825', icon: '💎' },
            ];

            if (res && res.tiers && res.tiers.length > 0) {
                // Merge DB config with defaults to ensure missing fields (color, icon) are filled
                const merged = res.tiers.map((t: any, index: number) => {
                    const dt = defaultTiers[index] || defaultTiers[0];
                    return {
                        tier: t.tier ?? dt.tier,
                        name: t.name ?? dt.name,
                        minSpending: t.minSpending ?? dt.minSpending,
                        cashbackPercent: t.cashbackPercent ?? dt.cashbackPercent,
                        color: (t.color && t.color.startsWith('#')) ? t.color : dt.color,
                        icon: (t.icon && t.icon.trim() !== '') ? t.icon : dt.icon,
                    };
                });
                setVipTiers(merged);
            } else {
                setVipTiers(defaultTiers);
            }
        } catch (e: any) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchRewards();
        fetchVouchers();
        fetchVipTiers();
    }, [fetchRewards, fetchVouchers, fetchVipTiers]);

    const shelfItems = rewards.filter(r => r.isActive);
    const warehouseItems = rewards.filter(r => !r.isActive);

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await adminApi.updateReward(id, { isActive });
            fetchRewards();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleSaveVip = async () => {
        try {
            await adminApi.updateVipConfig(vipTiers);
            alert('Lưu cấu hình VIP thành công!');
        } catch (e) {
            alert('Lỗi khi lưu cấu hình VIP');
        }
    };

    const handleResetVip = async () => {
        const userId = prompt('Nhập User ID cần reset VIP:');
        if (!userId) return;

        const tierInput = prompt('Reset về Tier nào? (0-11)\n0 = Lữ Khách, 1-3 = Thượng nhân, 4-7 = Quý tộc/Công tước, 8-11 = Hoàng gia');
        if (tierInput === null) return;
        const resetToTier = parseInt(tierInput, 10);
        if (isNaN(resetToTier) || resetToTier < 0 || resetToTier > 11) {
            alert('Tier không hợp lệ. Vui lòng nhập số từ 0-11.');
            return;
        }

        if (!window.confirm(`Xác nhận reset User ${userId} về VIP ${resetToTier}?\n\nLưu ý:\n- totalCoinsSpent GIỮ NGUYÊN (không xóa lịch sử)\n- claimedVipTiers sẽ giữ [1..${resetToTier}]\n- User lên lại sẽ nhận quà từ tier > ${resetToTier}`)) return;

        try {
            await adminApi.resetVip(userId, resetToTier);
            alert(`✅ Reset VIP thành công! User đã về VIP ${resetToTier}.`);
        } catch (e: any) {
            alert('Lỗi: ' + e.message);
        }
    };

    const openCreate = () => {
        setEditReward(null);
        setForm({ title: '', description: '', pointCost: 100, stock: 10, shippingFee: 15000, imageUrl: '', isActive: true, isFeatured: false });
        setShowCreate(true);
    };

    const openEdit = (r: Reward) => {
        setEditReward(r);
        setForm({
            title: r.title,
            description: r.description || '',
            pointCost: r.pointCost,
            stock: r.stock ?? 10,
            shippingFee: r.shippingFee ?? 15000,
            imageUrl: r.imageUrl || '',
            isActive: r.isActive,
            isFeatured: r.isFeatured || false,
        });
        setShowCreate(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;
        try {
            if (editReward) {
                await adminApi.updateReward(editReward._id, form);
            } else {
                await adminApi.createReward(form);
            }
            setShowCreate(false);
            setEditReward(null);
            fetchRewards();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleRedeemByCode = async () => {
        const code = redeemCode.trim().toUpperCase();
        if (!code) return;
        try {
            const result = await adminApi.confirmVoucher(code);
            setRedeemResult({ type: 'success', msg: `✅ ${result.message}` });
            setRedeemCode('');
            fetchVouchers();
        } catch (e: any) {
            setRedeemResult({ type: 'error', msg: `❌ ${e.message}` });
        }
    };

    const pendingCount = vouchers.filter(v => v.status === 'pending_use').length;

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Cửa hàng & Đổi quà</h1>
                <p className="page__subtitle">Quản lý kệ hàng, kho quà, và xử lý đổi quà</p>
            </div>

            {error && (
                <div style={{ padding: '10px 16px', background: 'var(--danger-light)', color: '#991b1b', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    ❌ {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            )}

            <div className="tabs">
                <button className={`tabs__tab${tab === 'shelf' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('shelf')}>
                    🏪 Trên kệ ({shelfItems.length})
                </button>
                <button className={`tabs__tab${tab === 'warehouse' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('warehouse')}>
                    📦 Trong kho ({warehouseItems.length})
                </button>
                <button className={`tabs__tab${tab === 'redeem' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('redeem')}>
                    🎫 Đổi quà {pendingCount > 0 && <span className="sidebar__badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
                </button>
                <button className={`tabs__tab${tab === 'vip' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('vip')}>
                    👑 Thẻ hạng
                </button>
            </div>

            {/* TAB: Trên kệ */}
            {tab === 'shelf' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">🏪 Quà đang hiển thị cho người chơi</span>
                        <button className="btn btn--primary" onClick={openCreate}>+ Thêm quà mới</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">⏳</div>
                                <div className="empty-state__text">Đang tải...</div>
                            </div>
                        ) : shelfItems.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">🏪</div>
                                <div className="empty-state__text">Chưa có quà trên kệ. Thêm quà mới hoặc đưa từ kho lên!</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tên quà</th>
                                        <th>Giá (Coins)</th>
                                        <th>Tồn kho</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shelfItems.map(r => (
                                        <tr key={r._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {r.imageUrl ? (
                                                        <img src={r.imageUrl} alt={r.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎁</div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{r.title} {r.isFeatured && <span title="Nổi bật" style={{ color: '#f59e0b' }}>⭐</span>}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: '#f59e0b' }}>🪙 {r.pointCost}</td>
                                            <td>
                                                <span style={{ fontWeight: 600 }}>{r.stock ?? '∞'}</span>
                                                {r.stock !== undefined && r.stock <= 5 && (
                                                    <span className="badge badge--danger" style={{ marginLeft: 8 }}>Sắp hết</span>
                                                )}
                                            </td>
                                            <td><span className="badge badge--success">Đang hiển thị</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(r)}>✏️ Sửa</button>
                                                    <button className="btn btn--secondary btn--sm" onClick={() => handleToggleActive(r._id, false)}>📦 Cất kho</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: Trong kho */}
            {tab === 'warehouse' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">📦 Quà trong kho (ẩn với người chơi)</span>
                        <button className="btn btn--primary" onClick={openCreate}>+ Thêm quà mới</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {warehouseItems.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">📦</div>
                                <div className="empty-state__text">Kho trống! Tất cả quà đều đang trên kệ.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tên quà</th>
                                        <th>Giá (Coins)</th>
                                        <th>Tồn kho</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouseItems.map(r => (
                                        <tr key={r._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {r.imageUrl ? (
                                                        <img src={r.imageUrl} alt={r.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎁</div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{r.title} {r.isFeatured && <span title="Nổi bật" style={{ color: '#f59e0b' }}>⭐</span>}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>🪙 {r.pointCost}</td>
                                            <td><span style={{ fontWeight: 600 }}>{r.stock ?? '∞'}</span></td>
                                            <td><span className="badge badge--danger">Trong kho</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(r)}>✏️ Sửa</button>
                                                    <button className="btn btn--success btn--sm" onClick={() => handleToggleActive(r._id, true)}>🏪 Đưa lên kệ</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: Đổi quà */}
            {tab === 'redeem' && (
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
            )}

            {/* TAB: Thẻ hạng */}
            {tab === 'vip' && (
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
                                        <td><input type="number" value={tier.minSpending} onChange={e => { const newTiers = [...vipTiers]; newTiers[idx].minSpending = Number(e.target.value); setVipTiers(newTiers); }} style={{ width: 100, padding: 8 }} /></td>
                                        <td><input type="number" value={tier.cashbackPercent} onChange={e => { const newTiers = [...vipTiers]; newTiers[idx].cashbackPercent = Number(e.target.value); setVipTiers(newTiers); }} style={{ width: 80, padding: 8 }} /></td>
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
            )}

            {/* Create/Edit Modal */}
            {(editReward || showCreate) && (
                <div className="modal-backdrop" onClick={() => { setEditReward(null); setShowCreate(false); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <span className="modal__title">{editReward ? '✏️ Sửa quà' : '➕ Thêm quà mới'}</span>
                            <button className="modal__close" onClick={() => { setEditReward(null); setShowCreate(false); }}>×</button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label>Tên quà</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Voucher Trà Sữa" />
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả chi tiết..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>🪙 Giá (Coins)</label>
                                    <input type="number" value={form.pointCost} onChange={e => setForm({ ...form, pointCost: Number(e.target.value) })} min={1} />
                                </div>
                                <div className="form-group">
                                    <label>Tồn kho</label>
                                    <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} min={0} />
                                </div>
                                <div className="form-group">
                                    <label>🚚 Phí vận chuyển</label>
                                    <input type="number" value={form.shippingFee} onChange={e => setForm({ ...form, shippingFee: Number(e.target.value) })} min={0} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>🖼️ Ảnh quà</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="text" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="Paste link ảnh hoặc upload bên dưới..." style={{ flex: 1 }} />
                                    <label className="btn btn--secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', margin: 0 }}>
                                        {uploading ? '⏳ Đang tải...' : '📁 Upload'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            disabled={uploading}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploading(true);
                                                try {
                                                    const reader = new FileReader();
                                                    reader.onload = async () => {
                                                        try {
                                                            const base64 = reader.result as string;
                                                            const res = await adminApi.uploadImage(base64);
                                                            if (res.url || res.imageUrl) setForm(prev => ({ ...prev, imageUrl: res.imageUrl || res.url || '' }));
                                                        } catch (err) {
                                                            setError('Upload ảnh thất bại');
                                                        } finally {
                                                            setUploading(false);
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                } catch {
                                                    setUploading(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {form.imageUrl && (
                                    <div style={{ marginTop: 8 }}>
                                        <img src={form.imageUrl} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #e2e8f0' }} />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Đưa lên kệ ngay?</label>
                                <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                                    <option value="true">🏪 Có — Hiển thị trên kệ</option>
                                    <option value="false">📦 Không — Để trong kho</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>⭐ Nổi bật?</label>
                                <select value={form.isFeatured ? 'true' : 'false'} onChange={e => setForm({ ...form, isFeatured: e.target.value === 'true' })}>
                                    <option value="false">Không — Hiển thị bình thường</option>
                                    <option value="true">⭐ Có — Hiển thị nổi bật + badge RARE</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => { setEditReward(null); setShowCreate(false); }}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={!form.title.trim()}>
                                {editReward ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
