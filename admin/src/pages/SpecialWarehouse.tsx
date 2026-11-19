import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import {
    SpecialItemModal,
    MysteryBoxModal,
    ProductFragmentMappingTab,
    UserInventoryManagerTab,
} from '../components/warehouse';

export default function SpecialWarehouse() {
    const [activeTab, setActiveTab] = useState<'items' | 'boxes' | 'inventory' | 'mapping'>('items');

    const [items, setItems] = useState<any[]>([]);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editItemId, setEditItemId] = useState<string | null>(null);
    const [editItemData, setEditItemData] = useState<any | null>(null);

    // Boxes state
    const [boxes, setBoxes] = useState<any[]>([]);
    const [showBoxModal, setShowBoxModal] = useState(false);
    const [editBoxId, setEditBoxId] = useState<string | null>(null);
    const [editBoxData, setEditBoxData] = useState<any | null>(null);

    useEffect(() => {
        loadItems();
        loadBoxes();
    }, [activeTab]);

    const loadItems = async () => {
        try {
            const res = await adminApi.getSpecialItems();
            setItems(res.items || []);
        } catch (e) {
            console.error('Failed to load special items', e);
        }
    };

    const loadBoxes = async () => {
        try {
            const res = await adminApi.getMysteryBoxes();
            setBoxes(res.boxes || []);
        } catch (e) {
            console.error('Failed to load mystery boxes', e);
        }
    };

    // --- Special Items ---
    const handleEditItem = (item: any) => {
        setEditItemId(item._id);
        setEditItemData(item);
        setShowItemModal(true);
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm('Xoá vật phẩm này?')) return;
        try {
            await adminApi.deleteSpecialItem(id);
            loadItems();
        } catch (e) {
            alert('Lỗi khi xoá vật phẩm');
        }
    };

    // --- Mystery Boxes ---
    const handleEditBox = (box: any) => {
        setEditBoxId(box._id);
        setEditBoxData(box);
        setShowBoxModal(true);
    };

    const handleDeleteBox = async (id: string) => {
        if (!window.confirm('Chắc chắn xoá Box này?')) return;
        try {
            await adminApi.deleteMysteryBox(id);
            alert('Đã xoá Box');
            loadBoxes();
        } catch (e) {
            alert('Failed to delete box');
        }
    };

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, color: '#0F172A' }}>📦 Kho Đặc Biệt & Quản Lý Rương</h2>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {(['items', 'boxes', 'inventory', 'mapping'] as const).map((tab) => {
                    const labels = {
                        items: '💎 Vật Phẩm Đặc Biệt',
                        boxes: '🎁 Mystery Boxes',
                        inventory: '👤 Kho User & Cấp Phát / Thu Hồi',
                        mapping: '🔄 Ánh Xạ Mảnh',
                    };
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                background: isActive ? '#3B82F6' : '#334155',
                                color: '#FFF',
                                border: 'none',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            {labels[tab]}
                        </button>
                    );
                })}
            </div>

            {/* TAB: ITEMS */}
            {activeTab === 'items' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Danh sách Vật phẩm Đặc biệt</h3>
                        <button
                            style={{ background: '#10B981', color: '#FFF', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => {
                                setEditItemId(null);
                                setEditItemData(null);
                                setShowItemModal(true);
                            }}
                        >
                            + Tạo Vật Phẩm Mới
                        </button>
                    </div>
                    <div style={{ background: '#1E293B', borderRadius: 12, padding: 16 }}>
                        {items.length === 0 ? <p style={{ color: '#94A3B8' }}>Chưa có vật phẩm nào.</p> : (
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                                        <th style={{ padding: 10 }}>Ảnh</th>
                                        <th style={{ padding: 10 }}>Tên</th>
                                        <th style={{ padding: 10 }}>Loại</th>
                                        <th style={{ padding: 10 }}>Mảnh?</th>
                                        <th style={{ padding: 10 }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item._id} style={{ borderBottom: '1px solid #334155', color: '#FFF' }}>
                                            <td style={{ padding: 10 }}>
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                                ) : (
                                                    <div style={{ width: 40, height: 40, borderRadius: 6, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</div>
                                                )}
                                            </td>
                                            <td style={{ padding: 10, fontWeight: 600 }}>{item.name}</td>
                                            <td style={{ padding: 10 }}>{item.type} (Val: {item.value || 0})</td>
                                            <td style={{ padding: 10 }}>{item.isFragmentable ? `Có (${item.requiredFragments} mảnh)` : 'Không'}</td>
                                            <td style={{ padding: 10 }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => handleEditItem(item)} style={{ background: '#3B82F6', color: '#FFF', padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>Sửa</button>
                                                    <button onClick={() => handleDeleteItem(item._id)} style={{ background: '#EF4444', color: '#FFF', padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>Xoá</button>
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

            {/* TAB: BOXES */}
            {activeTab === 'boxes' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Danh sách Hộp Quà Đặc Biệt (Mystery Boxes)</h3>
                        <button
                            style={{ background: '#3B82F6', color: '#FFF', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => {
                                setEditBoxId(null);
                                setEditBoxData(null);
                                setShowBoxModal(true);
                            }}
                        >
                            + Tạo Box Mới
                        </button>
                    </div>
                    <div style={{ background: '#1E293B', borderRadius: 12, padding: 16 }}>
                        {boxes.length === 0 ? <p style={{ color: '#94A3B8' }}>Chưa có Box nào.</p> : (
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                                        <th style={{ padding: 10 }}>Ảnh</th>
                                        <th style={{ padding: 10 }}>Tên Hộp</th>
                                        <th style={{ padding: 10 }}>Loại (itemType)</th>
                                        <th style={{ padding: 10 }}>Phẩm chất</th>
                                        <th style={{ padding: 10 }}>Cơ hội +1 đồ</th>
                                        <th style={{ padding: 10 }}>Trạng thái</th>
                                        <th style={{ padding: 10 }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {boxes.map(box => {
                                        const rarityColors: Record<string, string> = { common: '#94A3B8', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B' };
                                        return (
                                            <tr key={box._id} style={{ borderBottom: '1px solid #334155', color: '#FFF' }}>
                                                <td style={{ padding: 10 }}>
                                                    {box.imageUrl ? (
                                                        <img src={box.imageUrl} alt={box.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: 6, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎁</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: 10, fontWeight: 600 }}>{box.name}</td>
                                                <td style={{ padding: 10 }}><code>{box.itemType}</code></td>
                                                <td style={{ padding: 10, color: rarityColors[box.rarity] || '#FFF', fontWeight: 'bold' }}>{box.rarity}</td>
                                                <td style={{ padding: 10 }}>{box.bonusDropChance || 0}%</td>
                                                <td style={{ padding: 10 }}>{box.isActive ? '🟢 Bật' : '⚪ Tắt'}</td>
                                                <td style={{ padding: 10 }}>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => handleEditBox(box)} style={{ background: '#3B82F6', color: '#FFF', padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>Sửa</button>
                                                        <button onClick={() => handleDeleteBox(box._id)} style={{ background: '#EF4444', color: '#FFF', padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>Xoá</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: INVENTORY & DIRECT GRANT / REVOKE */}
            {activeTab === 'inventory' && (
                <UserInventoryManagerTab items={items} boxes={boxes} />
            )}

            {/* TAB: MAPPING */}
            {activeTab === 'mapping' && (
                <ProductFragmentMappingTab />
            )}

            {/* Modal Create/Edit Item */}
            <SpecialItemModal
                isOpen={showItemModal}
                editItemId={editItemId}
                initialData={editItemData}
                onClose={() => setShowItemModal(false)}
                onSaveSuccess={loadItems}
            />

            {/* Modal Create/Edit Box */}
            <MysteryBoxModal
                isOpen={showBoxModal}
                editBoxId={editBoxId}
                initialData={editBoxData}
                items={items}
                onClose={() => setShowBoxModal(false)}
                onSaveSuccess={loadBoxes}
            />
        </div>
    );
}
