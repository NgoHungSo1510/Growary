import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import type { Reward } from '../../types';

interface RewardFormModalProps {
    isOpen: boolean;
    editReward: Reward | null;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const RewardFormModal: React.FC<RewardFormModalProps> = ({
    isOpen,
    editReward,
    onClose,
    onSaveSuccess,
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
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

    useEffect(() => {
        if (editReward) {
            setForm({
                title: editReward.title,
                description: editReward.description || '',
                pointCost: editReward.pointCost,
                stock: editReward.stock ?? 10,
                imageUrl: editReward.imageUrl || '',
                shippingFee: (editReward as any).shippingFee ?? 15000,
                isActive: editReward.isActive,
                isFeatured: (editReward as any).isFeatured ?? false,
            });
        } else {
            setForm({
                title: '',
                description: '',
                pointCost: 100,
                stock: 10,
                imageUrl: '',
                shippingFee: 15000,
                isActive: true,
                isFeatured: false,
            });
        }
    }, [editReward, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            if (editReward) {
                await adminApi.updateReward(editReward._id, form);
            } else {
                await adminApi.createReward(form);
            }
            onClose();
            onSaveSuccess();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                    <span className="modal__title">{editReward ? '✏️ Sửa quà' : '➕ Thêm quà mới'}</span>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                <div className="modal__body">
                    {error && <div style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</div>}
                    <div className="form-group">
                        <label>Tên quà</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="VD: Voucher Trà Sữa"
                        />
                    </div>
                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Mô tả chi tiết..."
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>🪙 Giá (Coins)</label>
                            <input
                                type="number"
                                value={form.pointCost}
                                onChange={e => setForm({ ...form, pointCost: Number(e.target.value) })}
                                min={1}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tồn kho</label>
                            <input
                                type="number"
                                value={form.stock}
                                onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                                min={0}
                            />
                        </div>
                        <div className="form-group">
                            <label>🚚 Phí vận chuyển</label>
                            <input
                                type="number"
                                value={form.shippingFee}
                                onChange={e => setForm({ ...form, shippingFee: Number(e.target.value) })}
                                min={0}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>🖼️ Ảnh quà</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                type="text"
                                value={form.imageUrl}
                                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                                placeholder="Paste link ảnh hoặc upload bên dưới..."
                                style={{ flex: 1 }}
                            />
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
                                                } catch {
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
                    <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
                    <button className="btn btn--primary" onClick={handleSave} disabled={!form.title.trim()}>
                        {editReward ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RewardFormModal;
