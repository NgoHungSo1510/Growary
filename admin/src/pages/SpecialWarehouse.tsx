import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

export default function SpecialWarehouse() {
    const [activeTab, setActiveTab] = useState<'items' | 'boxes' | 'inventory' | 'grant'>('items');

    const [items, setItems] = useState<any[]>([]);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editItemId, setEditItemId] = useState<string | null>(null);
    const [itemForm, setItemForm] = useState({
        name: '', description: '', type: 'coin', value: 0, isFragmentable: false, requiredFragments: 10, isActive: true, imageUrl: ''
    });

    // Boxes state
    const [boxes, setBoxes] = useState<any[]>([]);
    const [showBoxModal, setShowBoxModal] = useState(false);
    const [editBoxId, setEditBoxId] = useState<string | null>(null);
    const [boxForm, setBoxForm] = useState({
        name: '', description: '', itemType: '', rarity: 'common', bonusDropChance: 0, isActive: true, imageUrl: '',
        rewards: [] as { specialItem: string; rewardForm: 'full' | 'fragment'; amount: number; probability: number }[]
    });

    // Inventory state
    const [searchUser, setSearchUser] = useState('');
    const [inventory, setInventory] = useState<any[] | null>(null);

    // Grant Form
    const [grantUserId, setGrantUserId] = useState('');
    const [grantItemType, setGrantItemType] = useState<'special_item' | 'mystery_box'>('special_item');
    const [grantSpecialItemId, setGrantSpecialItemId] = useState('');
    const [grantMysteryBoxId, setGrantMysteryBoxId] = useState('');
    const [grantRewardForm, setGrantRewardForm] = useState<'full' | 'fragment'>('full');
    const [grantQuantity, setGrantQuantity] = useState(1);
    const [grantReason, setGrantReason] = useState('');

    useEffect(() => {
        if (activeTab === 'items') loadItems();
        if (activeTab === 'boxes' || activeTab === 'grant') {
            loadItems();
            loadBoxes();
        }
    }, [activeTab]);

    const loadItems = async () => {
        try {
            const res = await adminApi.getSpecialItems();
            setItems(res.items || []);
        } catch (e) { alert('Failed to load special items'); }
    };

    const loadBoxes = async () => {
        try {
            const res = await adminApi.getMysteryBoxes();
            setBoxes(res.boxes || []);
        } catch (e) { alert('Failed to load mystery boxes'); }
    };

    // --- Special Items ---
    const handleSaveItem = async () => {
        try {
            if (editItemId) {
                await adminApi.updateSpecialItem(editItemId, itemForm);
                alert('Cập nhật vật phẩm thành công!');
            } else {
                await adminApi.createSpecialItem(itemForm);
                alert('Tạo vật phẩm thành công!');
            }
            setShowItemModal(false);
            setEditItemId(null);
            loadItems();
        } catch (error: any) {
            alert('Lỗi: ' + error.message);
        }
    };

    const handleEditItem = (item: any) => {
        setEditItemId(item._id);
        setItemForm({
            name: item.name,
            description: item.description || '',
            type: item.type,
            value: item.value || 0,
            isFragmentable: item.isFragmentable || item.hasFragment || false,
            requiredFragments: item.requiredFragments || item.fragmentsRequired || 10,
            isActive: item.isActive,
            imageUrl: item.imageUrl || ''
        });
        setShowItemModal(true);
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm('Xoá vật phẩm này?')) return;
        try {
            await adminApi.deleteSpecialItem(id);
            loadItems();
        } catch (e) { alert('Lỗi khi xoá vật phẩm'); }
    };

    // --- Mystery Boxes ---
    const handleSaveBox = async () => {
        try {
            if (editBoxId) {
                await adminApi.updateMysteryBox(editBoxId, boxForm);
                alert('Cập nhật Box thành công!');
            } else {
                await adminApi.createMysteryBox(boxForm);
                alert('Tạo Box thành công!');
            }
            setShowBoxModal(false);
            setEditBoxId(null);
            loadBoxes();
        } catch (error: any) {
            alert('Lỗi: ' + error.message);
        }
    };

    const handleEditBox = (box: any) => {
        setEditBoxId(box._id);
        setBoxForm({
            name: box.name,
            description: box.description || '',
            itemType: box.itemType,
            rarity: box.rarity || 'common',
            bonusDropChance: box.bonusDropChance || 0,
            isActive: box.isActive,
            imageUrl: box.imageUrl || '',
            rewards: box.rewards ? box.rewards.map((r: any) => ({
                specialItem: r.specialItem?._id || r.specialItem,
                rewardForm: r.rewardForm,
                amount: r.amount,
                probability: r.probability
            })) : []
        });
        setShowBoxModal(true);
    };

    const handleDeleteBox = async (id: string) => {
        if (!window.confirm('Chắc chắn xoá Box này?')) return;
        try {
            await adminApi.deleteMysteryBox(id);
            alert('Đã xoá Box');
            loadBoxes();
        } catch (e) { alert('Failed to delete box'); }
    };

    // --- Inventory Grant ---
    const handleSearchInventory = async () => {
        if (!searchUser) return;
        try {
            const res = await adminApi.getUserInventory(searchUser);
            setInventory(res.inventory || []);
        } catch (e) { alert('Failed to fetch inventory.'); }
    };

    // --- Grant ---
    const handleGrant = async () => {
        if (!grantUserId || !grantReason || grantQuantity < 1) {
            alert('Please fill all required fields'); return;
        }
        if (grantItemType === 'special_item' && !grantSpecialItemId) {
            alert('Vui lòng chọn vật phẩm'); return;
        }
        if (grantItemType === 'mystery_box' && !grantMysteryBoxId) {
            alert('Vui lòng chọn hộp'); return;
        }

        try {
            await adminApi.grantInventoryItem({
                userId: grantUserId,
                itemType: grantItemType,
                specialItem: grantItemType === 'special_item' ? grantSpecialItemId : undefined,
                mysteryBox: grantItemType === 'mystery_box' ? grantMysteryBoxId : undefined,
                rewardForm: grantItemType === 'special_item' ? grantRewardForm : undefined,
                quantity: grantQuantity,
                reason: grantReason
            });
            alert('Cấp vật phẩm thành công!');
            setGrantQuantity(1);
            setGrantReason('');
        } catch (e) { alert('Lỗi khi cấp vật phẩm'); }
    };

    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, color: '#000000ff' }}>
                <h2>📦 Kho Đặc Biệt</h2>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <button
                    onClick={() => setActiveTab('items')}
                    style={{ padding: '8px 16px', borderRadius: 8, background: activeTab === 'items' ? '#3B82F6' : '#334155', color: '#FFF', border: 'none', cursor: 'pointer' }}
                >
                    Vật Phẩm
                </button>
                <button
                    onClick={() => setActiveTab('boxes')}
                    style={{ padding: '8px 16px', borderRadius: 8, background: activeTab === 'boxes' ? '#3B82F6' : '#334155', color: '#FFF', border: 'none', cursor: 'pointer' }}
                >
                    Mystery Boxes
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    style={{ padding: '8px 16px', borderRadius: 8, background: activeTab === 'inventory' ? '#3B82F6' : '#334155', color: '#FFF', border: 'none', cursor: 'pointer' }}
                >
                    Xem Kho User
                </button>
                <button
                    onClick={() => setActiveTab('grant')}
                    style={{ padding: '8px 16px', borderRadius: 8, background: activeTab === 'grant' ? '#3B82F6' : '#334155', color: '#FFF', border: 'none', cursor: 'pointer' }}
                >
                    Cấp Phát
                </button>
            </div>

            {/* TAB: ITEMS */}
            {activeTab === 'items' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3>Danh sách Vật phẩm Đặc biệt</h3>
                        <button style={{ background: '#10B981', color: '#FFF', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }} onClick={() => {
                            setEditItemId(null);
                            setItemForm({ name: '', description: '', type: 'coin', value: 0, isFragmentable: false, requiredFragments: 10, isActive: true, imageUrl: '' });
                            setShowItemModal(true);
                        }}>
                            + Tạo Vật Phẩm
                        </button>
                    </div>
                    <div style={{ background: '#1E293B', borderRadius: 12, padding: 16 }}>
                        {items.length === 0 ? <p style={{ color: '#94A3B8' }}>Chưa có vật phẩm nào.</p> : (
                            <table style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Tên</th>
                                        <th>Loại</th>
                                        <th>Mảnh?</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item._id} style={{ borderBottom: '1px solid #ffffffff', color: '#ffffffff' }}>
                                            <td style={{ padding: '12px 0' }}>{item.name}</td>
                                            <td>{item.type} (Val: {item.value})</td>
                                            <td>{item.isFragmentable ? `Có (${item.requiredFragments} mảnh ghép lại)` : 'Không'}</td>
                                            <td>{item.hasFragment || item.isFragmentable ? `Có (${item.fragmentsRequired || item.requiredFragments} mảnh ghép lại)` : 'Không'}</td>
                                            <td style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleEditItem(item)} style={{ background: '#3B82F6', color: '#FFF', padding: '4px 8px', borderRadius: 4, border: 'none', fontSize: 12 }}>Sửa</button>
                                                <button onClick={() => handleDeleteItem(item._id)} style={{ background: '#EF4444', color: '#FFF', padding: '4px 8px', borderRadius: 4, border: 'none', fontSize: 12 }}>Xoá</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: BOXES */}
            {activeTab === 'boxes' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3>Danh sách Hộp Đặc Biệt</h3>
                        <button style={{ background: '#3B82F6', color: '#FFF', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }} onClick={() => {
                            setEditBoxId(null);
                            setBoxForm({ name: '', description: '', itemType: '', rarity: 'common', bonusDropChance: 0, isActive: true, imageUrl: '', rewards: [] });
                            setShowBoxModal(true);
                        }}>
                            + Tạo Box Mới
                        </button>
                    </div>
                    <div style={{ background: '#1E293B', borderRadius: 12, padding: 16 }}>
                        {boxes.length === 0 ? <p style={{ color: '#94A3B8' }}>Chưa có Box nào.</p> : (
                            <table style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                                        <th style={{ paddingBottom: 12 }}>Tên Hộp</th>
                                        <th>Loại (Định danh)</th>
                                        <th>Phẩm chất</th>
                                        <th>Cơ hội +1 đồ</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {boxes.map(box => {
                                        const rarityColors: any = { common: '#94A3B8', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B' };
                                        return (
                                        <tr key={box._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: `4px solid ${rarityColors[box.rarity] || '#fff'}` }}>
                                            <td style={{ padding: '12px 12px' }}>{box.name}</td>
                                            <td>{box.itemType}</td>
                                            <td style={{ color: rarityColors[box.rarity] || '#fff', fontWeight: 'bold' }}>{box.rarity}</td>
                                            <td>{box.bonusDropChance || 0}%</td>
                                            <td>{box.isActive ? 'Bật' : 'Tắt'}</td>
                                            <td style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleEditBox(box)} style={{ background: '#3B82F6', color: '#FFF', padding: '4px 8px', borderRadius: 4, border: 'none', fontSize: 12 }}>Sửa</button>
                                                <button onClick={() => handleDeleteBox(box._id)} style={{ background: '#EF4444', color: '#FFF', padding: '4px 8px', borderRadius: 4, border: 'none', fontSize: 12 }}>Xoá</button>
                                            </td>
                                        </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: INVENTORY */}
            {activeTab === 'inventory' && (
                <div style={{ background: '#1E293B', borderRadius: 12, padding: 24 }}>
                    <h3>Kiểm tra Kho</h3>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, marginTop: 16 }}>
                        <input
                            type="text"
                            placeholder="Nhập User ID"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        />
                        <button onClick={handleSearchInventory} style={{ background: '#3B82F6', color: '#FFF', padding: '0 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Tìm</button>
                    </div>

                    {inventory !== null && (
                        <div>
                            <h4>Kết quả:</h4>
                            {inventory.length === 0 ? <p style={{ color: '#94A3B8' }}>Kho trống.</p> : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                                    {inventory.map((item, idx) => (
                                        <div key={idx} style={{ padding: 16, background: '#334155', borderRadius: 8 }}>
                                            <div style={{ fontWeight: 'bold' }}>{item.displayName || item.itemType}</div>
                                            <div style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Số lượng: <span style={{ color: '#FFF' }}>{item.quantity}</span></div>
                                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Updated: {new Date(item.lastUpdated).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: GRANT */}
            {activeTab === 'grant' && (
                <div style={{ background: '#1E293B', borderRadius: 12, padding: 24, maxWidth: 500 }}>
                    <h3>Cấp Phát Thủ Công</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94A3B8' }}>User ID</label>
                            <input type="text" value={grantUserId} onChange={e => setGrantUserId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94A3B8' }}>Loại Đối Tượng</label>
                            <select value={grantItemType} onChange={e => setGrantItemType(e.target.value as any)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                <option value="special_item">Vật Phẩm Đặc Biệt (Items/Fragments)</option>
                                <option value="mystery_box">Hộp Quà (Mystery Box)</option>
                            </select>
                        </div>

                        {grantItemType === 'special_item' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94A3B8' }}>Chọn Vật Phẩm</label>
                                    <select value={grantSpecialItemId} onChange={e => setGrantSpecialItemId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                        <option value="">-- Chọn Vật Phẩm --</option>
                                        {items.map(it => <option key={it._id} value={it._id}>{it.name} ({it.type})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94A3B8' }}>Hình thức</label>
                                    <select value={grantRewardForm} onChange={e => setGrantRewardForm(e.target.value as any)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                        <option value="full">Nguyên bản (Full)</option>
                                        <option value="fragment">Dạng Mảnh (Fragment)</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {grantItemType === 'mystery_box' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94A3B8' }}>Chọn Hộp Quà</label>
                                <select value={grantMysteryBoxId} onChange={e => setGrantMysteryBoxId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                    <option value="">-- Chọn Hộp --</option>
                                    {boxes.map(b => <option key={b._id} value={b._id}>{b.name} ({b.rarity})</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94A3B8' }}>Số lượng</label>
                            <input type="number" min={1} value={grantQuantity} onChange={e => setGrantQuantity(Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94A3B8' }}>Lý do (Ghi log)</label>
                            <input type="text" value={grantReason} onChange={e => setGrantReason(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                        </div>
                        <button onClick={handleGrant} style={{ background: '#10B981', color: '#FFF', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: 8 }}>
                            Cấp Phát
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Create Item */}
            {showItemModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1E293B', padding: 24, borderRadius: 12, width: 400, color: '#FFF' }}>
                        <h3>{editItemId ? 'Sửa Vật Phẩm' : 'Tạo Vật Phẩm'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Tên vật phẩm</label>
                                <input placeholder="Nhập tên..." value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Mô tả ngắn</label>
                                <input placeholder="Nhập mô tả..." value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Link Ảnh (URL)</label>
                                <input placeholder="https://..." value={itemForm.imageUrl} onChange={e => setItemForm({ ...itemForm, imageUrl: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Loại định danh (Dùng cho code)</label>
                                <select value={itemForm.type} onChange={e => setItemForm({ ...itemForm, type: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                    <option value="coin">Coin</option>
                                    <option value="exp">EXP</option>
                                    <option value="gacha_ticket">Gacha Ticket</option>
                                    <option value="discount_ticket">Discount Ticket</option>
                                    <option value="free_ship">Free Ship</option>
                                    <option value="product">Sản Phẩm (Hiện vật)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Giá trị (Nếu có, vd 5000 EXP)</label>
                                <input type="number" placeholder="5000" value={itemForm.value} onChange={e => setItemForm({ ...itemForm, value: Number(e.target.value) })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
                                <input type="checkbox" checked={itemForm.isFragmentable} onChange={e => setItemForm({ ...itemForm, isFragmentable: e.target.checked })} style={{ width: 16, height: 16 }} />
                                Cho phép thu thập dạng mảnh?
                            </label>

                            {itemForm.isFragmentable && (
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Số mảnh cần để ghép thành 1 vật phẩm</label>
                                    <input type="number" placeholder="10" value={itemForm.requiredFragments} onChange={e => setItemForm({ ...itemForm, requiredFragments: Number(e.target.value) })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                <button onClick={handleSaveItem} style={{ flex: 1, padding: '10px 0', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Lưu</button>
                                <button onClick={() => setShowItemModal(false)} style={{ flex: 1, padding: '10px 0', background: '#64748B', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Huỷ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Create Box */}
            {showBoxModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: 20 }}>
                    <div style={{ background: '#1E293B', padding: 24, borderRadius: 12, width: 600, color: '#FFF', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>{editBoxId ? 'Sửa Box Đặc Biệt' : 'Tạo Box Đặc Biệt'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Tên Box</label>
                                    <input placeholder="VD: Hộp Quà Tân Thủ" value={boxForm.name} onChange={e => setBoxForm({ ...boxForm, name: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Loại Box (Code ID)</label>
                                    <input placeholder="VD: starter_box_1" value={boxForm.itemType} onChange={e => setBoxForm({ ...boxForm, itemType: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Mô tả Box</label>
                                <input placeholder="Nhập mô tả..." value={boxForm.description} onChange={e => setBoxForm({ ...boxForm, description: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Phẩm chất Box</label>
                                    <select value={boxForm.rarity} onChange={e => setBoxForm({ ...boxForm, rarity: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}>
                                        <option value="common">Thường (Common)</option>
                                        <option value="rare">Hiếm (Rare)</option>
                                        <option value="epic">Sử Thi (Epic)</option>
                                        <option value="legendary">Huyền Thoại (Legendary)</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Tỉ lệ rơi thêm đồ (Bonus %)</label>
                                    <input type="number" min="0" max="100" value={boxForm.bonusDropChance} onChange={e => setBoxForm({ ...boxForm, bonusDropChance: Number(e.target.value) })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Link Ảnh Box (URL)</label>
                                <input placeholder="https://..." value={boxForm.imageUrl} onChange={e => setBoxForm({ ...boxForm, imageUrl: e.target.value })} style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }} />
                            </div>

                            <hr style={{ borderColor: '#334155', margin: '12px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, color: '#38BDF8' }}>Danh Sách Phần Thưởng (Pool)</h4>
                                <button onClick={() => setBoxForm({...boxForm, rewards: [...boxForm.rewards, { specialItem: items[0]?._id || '', rewardForm: 'full', amount: 1, probability: 10 }]})} style={{ background: '#38BDF8', color: '#0F172A', padding: '4px 12px', borderRadius: 4, border: 'none', fontWeight: 'bold' }}>+ Thêm quà</button>
                            </div>

                            {boxForm.rewards.map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, background: '#0F172A', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                                    <div style={{ flex: 2 }}>
                                        <label style={{ fontSize: 10, color: '#94A3B8' }}>Vật phẩm</label>
                                        <select value={r.specialItem} onChange={e => { const nr = [...boxForm.rewards]; nr[i].specialItem = e.target.value; setBoxForm({...boxForm, rewards: nr}); }} style={{ width: '100%', padding: 4 }}>
                                            <option value="" disabled>Chọn vật phẩm...</option>
                                            {items.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 10, color: '#94A3B8' }}>Dạng</label>
                                        <select value={r.rewardForm} onChange={e => { const nr = [...boxForm.rewards]; nr[i].rewardForm = e.target.value as any; setBoxForm({...boxForm, rewards: nr}); }} style={{ width: '100%', padding: 4 }}>
                                            <option value="full">Nguyên bản</option>
                                            <option value="fragment">Dạng Mảnh</option>
                                        </select>
                                    </div>
                                    <div style={{ width: 60 }}>
                                        <label style={{ fontSize: 10, color: '#94A3B8' }}>SL</label>
                                        <input type="number" min="1" value={r.amount} onChange={e => { const nr = [...boxForm.rewards]; nr[i].amount = Number(e.target.value); setBoxForm({...boxForm, rewards: nr}); }} style={{ width: '100%', padding: 4 }} />
                                    </div>
                                    <div style={{ width: 80 }}>
                                        <label style={{ fontSize: 10, color: '#94A3B8' }}>Tỷ lệ (%)</label>
                                        <input type="number" min="0" max="100" value={r.probability} onChange={e => { const nr = [...boxForm.rewards]; nr[i].probability = Number(e.target.value); setBoxForm({...boxForm, rewards: nr}); }} style={{ width: '100%', padding: 4 }} />
                                    </div>
                                    <button onClick={() => { const nr = boxForm.rewards.filter((_, idx) => idx !== i); setBoxForm({...boxForm, rewards: nr}) }} style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: 16, cursor: 'pointer', marginTop: 12 }}>✕</button>
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                <button onClick={handleSaveBox} style={{ flex: 1, padding: '10px 0', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Lưu Box</button>
                                <button onClick={() => setShowBoxModal(false)} style={{ flex: 1, padding: '10px 0', background: '#64748B', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Huỷ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
