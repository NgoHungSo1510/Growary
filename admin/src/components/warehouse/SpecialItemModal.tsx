import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface SpecialItemModalProps {
    isOpen: boolean;
    editItemId: string | null;
    initialData: any;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const SpecialItemModal: React.FC<SpecialItemModalProps> = ({
    isOpen,
    editItemId,
    initialData,
    onClose,
    onSaveSuccess,
}) => {
    const [itemForm, setItemForm] = useState({
        name: '',
        description: '',
        type: 'coin',
        value: 0,
        isFragmentable: false,
        requiredFragments: 10,
        isActive: true,
        imageUrl: '',
    });

    useEffect(() => {
        if (initialData) {
            setItemForm({
                name: initialData.name || '',
                description: initialData.description || '',
                type: initialData.type || 'coin',
                value: initialData.value || 0,
                isFragmentable: initialData.isFragmentable || false,
                requiredFragments: initialData.requiredFragments || 10,
                isActive: initialData.isActive ?? true,
                imageUrl: initialData.imageUrl || '',
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSaveItem = async () => {
        try {
            if (editItemId) {
                await adminApi.updateSpecialItem(editItemId, itemForm);
                alert('Cập nhật vật phẩm thành công!');
            } else {
                await adminApi.createSpecialItem(itemForm);
                alert('Tạo vật phẩm thành công!');
            }
            onClose();
            onSaveSuccess();
        } catch (error: any) {
            alert('Lỗi: ' + error.message);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#1E293B', padding: 24, borderRadius: 12, width: 400, color: '#FFF' }}>
                <h3>{editItemId ? 'Sửa Vật Phẩm' : 'Tạo Vật Phẩm'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Tên vật phẩm</label>
                        <input
                            placeholder="Nhập tên..."
                            value={itemForm.name}
                            onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                            style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Mô tả ngắn</label>
                        <input
                            placeholder="Nhập mô tả..."
                            value={itemForm.description}
                            onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                            style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Link Ảnh (URL)</label>
                        <input
                            placeholder="https://..."
                            value={itemForm.imageUrl}
                            onChange={e => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                            style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Loại định danh (Dùng cho code)</label>
                        <select
                            value={itemForm.type}
                            onChange={e => setItemForm({ ...itemForm, type: e.target.value })}
                            style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        >
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
                        <input
                            type="number"
                            placeholder="5000"
                            value={itemForm.value}
                            onChange={e => setItemForm({ ...itemForm, value: Number(e.target.value) })}
                            style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                        />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={itemForm.isFragmentable}
                            onChange={e => setItemForm({ ...itemForm, isFragmentable: e.target.checked })}
                            style={{ width: 16, height: 16 }}
                        />
                        Cho phép thu thập dạng mảnh?
                    </label>

                    {itemForm.isFragmentable && (
                        <div>
                            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Số mảnh cần để ghép thành 1 vật phẩm</label>
                            <input
                                type="number"
                                placeholder="10"
                                value={itemForm.requiredFragments}
                                onChange={e => setItemForm({ ...itemForm, requiredFragments: Number(e.target.value) })}
                                style={{ padding: 8, width: '100%', borderRadius: 4, border: '1px solid #334155', background: '#0F172A', color: '#FFF' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <button onClick={handleSaveItem} style={{ flex: 1, padding: '10px 0', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Lưu</button>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: '#64748B', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Huỷ</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialItemModal;
