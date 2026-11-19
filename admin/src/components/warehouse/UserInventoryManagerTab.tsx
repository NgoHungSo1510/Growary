import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface UserInventoryManagerTabProps {
    items: any[];
    boxes: any[];
}

export function UserInventoryManagerTab({ items, boxes }: UserInventoryManagerTabProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [inventory, setInventory] = useState<any[] | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingInv, setLoadingInv] = useState(false);
    const [actionMsg, setActionMsg] = useState('');

    // Grant sub-form inside selected user
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [grantItemType, setGrantItemType] = useState<'special_item' | 'mystery_box'>('special_item');
    const [grantSpecialItemId, setGrantSpecialItemId] = useState('');
    const [grantMysteryBoxId, setGrantMysteryBoxId] = useState('');
    const [grantRewardForm, setGrantRewardForm] = useState<'full' | 'fragment'>('full');
    const [grantQuantity, setGrantQuantity] = useState(1);
    const [grantReason, setGrantReason] = useState('Admin cấp phát trực tiếp');

    const loadUsers = async (query = '') => {
        setLoadingUsers(true);
        try {
            const res = await adminApi.getUsers({ search: query, page: 1 });
            setUsers(res.users || []);
            if (!selectedUser && res.users && res.users.length > 0) {
                handleSelectUser(res.users[0]);
            }
        } catch (e) {
            console.error('Failed to load users:', e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSelectUser = async (user: any) => {
        setSelectedUser(user);
        setActionMsg('');
        setLoadingInv(true);
        try {
            const res = await adminApi.getUserInventory(user._id);
            setInventory(res.inventory || []);
        } catch (e) {
            setActionMsg('Không thể tải kho của user này');
            setInventory([]);
        } finally {
            setLoadingInv(false);
        }
    };

    const refreshCurrentInventory = async () => {
        if (!selectedUser) return;
        try {
            const res = await adminApi.getUserInventory(selectedUser._id);
            setInventory(res.inventory || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        void loadUsers('');
    }, []);

    const handleGrant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        if (grantItemType === 'special_item' && !grantSpecialItemId) {
            alert('Vui lòng chọn vật phẩm'); return;
        }
        if (grantItemType === 'mystery_box' && !grantMysteryBoxId) {
            alert('Vui lòng chọn rương'); return;
        }
        try {
            await adminApi.grantInventoryItem({
                userId: selectedUser._id,
                itemType: grantItemType,
                specialItem: grantItemType === 'special_item' ? grantSpecialItemId : undefined,
                mysteryBox: grantItemType === 'mystery_box' ? grantMysteryBoxId : undefined,
                rewardForm: grantItemType === 'special_item' ? grantRewardForm : undefined,
                quantity: grantQuantity,
                reason: grantReason || 'Admin cấp phát',
            });
            setActionMsg(`✓ Đã cấp phát thành công cho ${selectedUser.username}`);
            setShowGrantModal(false);
            setGrantQuantity(1);
            await refreshCurrentInventory();
        } catch (err: any) {
            alert('Lỗi cấp phát: ' + (err.message || 'Thất bại'));
        }
    };

    const handleRevoke = async (item: any) => {
        if (!selectedUser) return;
        const revokeCountStr = window.prompt(
            `Nhập số lượng muốn thu hồi (Hiện có: ${item.quantity}):`,
            '1'
        );
        if (!revokeCountStr) return;
        const revokeQty = parseInt(revokeCountStr, 10);
        if (isNaN(revokeQty) || revokeQty <= 0) {
            alert('Số lượng không hợp lệ'); return;
        }

        try {
            await adminApi.revokeInventoryItem({
                userId: selectedUser._id,
                itemType: item.itemType,
                specialItem: item.specialItem?._id || item.specialItem,
                mysteryBox: item.mysteryBox?._id || item.mysteryBox,
                rewardForm: item.rewardForm,
                quantity: revokeQty,
                reason: 'Admin thu hồi thủ công',
            });
            setActionMsg(`✓ Đã thu hồi ${revokeQty} ${item.displayName || 'mục'} từ ${selectedUser.username}`);
            await refreshCurrentInventory();
        } catch (err: any) {
            alert('Lỗi thu hồi: ' + (err.message || 'Thất bại'));
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
            {/* Left: User Search & List */}
            <div style={{ background: '#1E293B', borderRadius: 12, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#38BDF8' }}>👥 Danh Sách User</h4>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    <input
                        type="text"
                        placeholder="Tìm tên / email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadUsers(search)}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#FFF', fontSize: 13 }}
                    />
                    <button
                        onClick={() => loadUsers(search)}
                        style={{ padding: '8px 12px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                    >
                        Tìm
                    </button>
                </div>

                <div style={{ maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {loadingUsers ? (
                        <p style={{ color: '#94A3B8', fontSize: 13 }}>Đang tải người dùng...</p>
                    ) : users.length === 0 ? (
                        <p style={{ color: '#94A3B8', fontSize: 13 }}>Không tìm thấy người dùng.</p>
                    ) : (
                        users.map((u) => {
                            const isSelected = selectedUser?._id === u._id;
                            return (
                                <div
                                    key={u._id}
                                    onClick={() => handleSelectUser(u)}
                                    style={{
                                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                        background: isSelected ? '#3B82F6' : '#0F172A',
                                        border: isSelected ? '1px solid #60A5FA' : '1px solid transparent',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: '#FFF', fontSize: 14 }}>{u.username}</div>
                                    <div style={{ fontSize: 12, color: isSelected ? '#E0F2FE' : '#94A3B8' }}>{u.email}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right: Selected User Inventory & Actions */}
            <div style={{ background: '#1E293B', borderRadius: 12, padding: 20 }}>
                {selectedUser ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #334155', paddingBottom: 14 }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#FFF' }}>
                                    Kho của: <span style={{ color: '#38BDF8' }}>{selectedUser.username}</span>
                                </h3>
                                <div style={{ fontSize: 13, color: '#94A3B8' }}>ID: <code>{selectedUser._id}</code> • Email: {selectedUser.email}</div>
                            </div>
                            <button
                                onClick={() => setShowGrantModal(true)}
                                style={{ padding: '8px 16px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                            >
                                ➕ Cấp Phát Thêm Vào Kho
                            </button>
                        </div>

                        {actionMsg && (
                            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: '#064E3B', color: '#A7F3D0', fontSize: 13 }}>
                                {actionMsg}
                            </div>
                        )}

                        <div style={{ marginTop: 16 }}>
                            {loadingInv ? (
                                <p style={{ color: '#94A3B8' }}>Đang nạp kho vật phẩm...</p>
                            ) : !inventory || inventory.length === 0 ? (
                                <p style={{ color: '#94A3B8', padding: 24, textAlign: 'center' }}>Kho người chơi này đang trống.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                    {inventory.map((item: any, idx: number) => {
                                        const isBox = item.itemType === 'mystery_box';
                                        const doc = isBox ? item.mysteryBox : item.specialItem;
                                        const img = isBox ? (doc?.imageUrl || '') : (doc?.imageUrl || '');
                                        const title = doc?.name || item.displayName || (isBox ? 'Rương Quà' : 'Vật Phẩm');
                                        return (
                                            <div key={idx} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                        {img ? (
                                                            <img src={img} alt="item" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                                                        ) : (
                                                            <div style={{ width: 44, height: 44, borderRadius: 6, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                                                {isBox ? '🎁' : '💎'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: '#FFF', fontSize: 13 }}>{title}</div>
                                                            <div style={{ fontSize: 11, color: isBox ? '#38BDF8' : '#F59E0B' }}>
                                                                {isBox ? `Rương [${doc?.rarity || 'common'}]` : (item.rewardForm === 'fragment' ? 'Mảnh ghép' : 'Nguyên bản')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 8 }}>
                                                        Số lượng: <strong style={{ color: '#10B981', fontSize: 15 }}>x{item.quantity}</strong>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevoke(item)}
                                                    style={{ padding: '6px 10px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    ➖ Thu Hồi
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <p style={{ color: '#94A3B8' }}>Chọn một user từ danh sách bên trái để xem kho và thao tác.</p>
                )}
            </div>

            {/* Modal Grant Item */}
            {showGrantModal && selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
                    <form onSubmit={handleGrant} style={{ background: '#1E293B', padding: 24, borderRadius: 12, width: 440, color: '#FFF', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3 style={{ margin: 0 }}>➕ Cấp Phát Cho {selectedUser.username}</h3>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Loại đối tượng</label>
                            <select value={grantItemType} onChange={(e) => setGrantItemType(e.target.value as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                <option value="special_item">Vật phẩm đặc biệt (Item / Mảnh)</option>
                                <option value="mystery_box">Hộp quà bí ẩn (Mystery Box)</option>
                            </select>
                        </div>
                        {grantItemType === 'special_item' ? (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Chọn vật phẩm</label>
                                    <select value={grantSpecialItemId} onChange={(e) => setGrantSpecialItemId(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} required>
                                        <option value="">-- Chọn vật phẩm --</option>
                                        {items.map((it) => <option key={it._id} value={it._id}>{it.name} ({it.type})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Hình thức</label>
                                    <select value={grantRewardForm} onChange={(e) => setGrantRewardForm(e.target.value as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                        <option value="full">Nguyên bản (Full)</option>
                                        <option value="fragment">Dạng Mảnh (Fragment)</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Chọn hộp quà</label>
                                <select value={grantMysteryBoxId} onChange={(e) => setGrantMysteryBoxId(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} required>
                                    <option value="">-- Chọn hộp quà --</option>
                                    {boxes.map((b) => <option key={b._id} value={b._id}>{b.name} ({b.rarity})</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Số lượng</label>
                            <input type="number" min={1} value={grantQuantity} onChange={(e) => setGrantQuantity(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Lý do (Ghi log)</label>
                            <input type="text" value={grantReason} onChange={(e) => setGrantReason(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button type="submit" style={{ flex: 1, padding: 10, background: '#10B981', color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Cấp phát</button>
                            <button type="button" onClick={() => setShowGrantModal(false)} style={{ flex: 1, padding: 10, background: '#64748B', color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

