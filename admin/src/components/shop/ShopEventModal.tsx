import React, { useState, useEffect } from 'react';
import { shopEventService } from '../../services';
import { ShopEvent, CreateShopEventDto } from '@shared';

const MERCHANT_TEMPLATES = [
    {
        title: 'Thương Nhân Thời Không Ghé Thăm!',
        description: 'Lạ lắm... ta chưa từng thấy ai bán giá rẻ như vậy. Hắn nói chỉ ở đây 24 tiếng thôi. Đừng bỏ lỡ!',
    },
    {
        title: 'Cổng Chiều Không Gian Mở Ra!',
        description: 'Một kẻ bán hàng kỳ lạ xuất hiện từ hư không. Hàng hóa chất lượng, giá không tưởng. Chỉ hôm nay!',
    },
    {
        title: 'Kho Báu Rơi Vãi Của Thương Nhân!',
        description: 'Cỗ xe không gian của thương nhân bí ẩn bị rơi đồ! Hắn quyết định bán tống bán tháo trong ngày.',
    },
    {
        title: 'Chuyến Thăm Bất Ngờ Của Kẻ Lữ Hành!',
        description: 'Hắn mang theo những món đồ từ vùng đất xa xôi và chỉ giảm giá cho những người nhanh tay nhất.',
    },
    {
        title: 'Cơn Lốc Giá Sốc - Thương Nhân Ảo Ảnh!',
        description: 'Bóng dáng mờ ảo của thương nhân xuất hiện tại quảng trường. Toàn bộ cửa hàng được ưu đãi chớp nhoáng!',
    },
];

interface ShopEventModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    eventToEdit?: ShopEvent | null;
}

export const ShopEventModal: React.FC<ShopEventModalProps> = ({
    visible,
    onClose,
    onSuccess,
    eventToEdit,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [discountPercent, setDiscountPercent] = useState<number>(15);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title);
            setDescription(eventToEdit.description || '');
            setDiscountPercent(eventToEdit.discountPercent);
            setStartDate(
                eventToEdit.startDate ? new Date(eventToEdit.startDate).toISOString().slice(0, 16) : ''
            );
            setEndDate(
                eventToEdit.endDate ? new Date(eventToEdit.endDate).toISOString().slice(0, 16) : ''
            );
            setIsActive(eventToEdit.isActive);
        } else {
            // Default: starts now, ends in 24 hours
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
            setTitle(MERCHANT_TEMPLATES[0].title);
            setDescription(MERCHANT_TEMPLATES[0].description);
            setDiscountPercent(15);
            setStartDate(now.toISOString().slice(0, 16));
            setEndDate(tomorrow.toISOString().slice(0, 16));
            setIsActive(true);
        }
        setError(null);
    }, [eventToEdit, visible]);

    if (!visible) return null;

    const handleRandomTemplate = () => {
        const randomIndex = Math.floor(Math.random() * MERCHANT_TEMPLATES.length);
        const template = MERCHANT_TEMPLATES[randomIndex];
        setTitle(template.title);
        setDescription(template.description);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError('Vui lòng nhập tiêu đề sự kiện');
            return;
        }

        if (discountPercent < 1 || discountPercent > 90) {
            setError('Mức giảm giá phải từ 1% đến 90%');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
            setError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload: CreateShopEventDto = {
                title: title.trim(),
                description: description.trim(),
                type: 'flash_sale',
                discountPercent,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                isActive,
            };

            if (eventToEdit && eventToEdit._id) {
                await shopEventService.updateShopEvent(eventToEdit._id, payload);
            } else {
                await shopEventService.createShopEvent(payload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Lỗi khi lưu sự kiện');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card__title">
                        {eventToEdit ? '✏️ Chỉnh sửa Sự Kiện Shop' : '⚡ Tạo Sự Kiện Flash Sale Mới'}
                    </h3>
                    <button className="btn btn--secondary btn--sm" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 20 }}>
                    {error && (
                        <div style={{ padding: 10, backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: 8, marginBottom: 16 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label style={{ fontWeight: 600 }}>Tiêu đề sự kiện *</label>
                            <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={handleRandomTemplate}
                                style={{ fontSize: 11 }}
                            >
                                🎲 Random Mẫu Thương Nhân
                            </button>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Thông điệp thương nhân kỳ lạ</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Mức giảm giá (%) *</label>
                            <input
                                type="number"
                                min={1}
                                max={90}
                                value={discountPercent}
                                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Trạng thái</label>
                            <select
                                value={isActive ? 'active' : 'inactive'}
                                onChange={(e) => setIsActive(e.target.value === 'active')}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                            >
                                <option value="active">Kích hoạt ngay</option>
                                <option value="inactive">Tạm tắt</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                        <div>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Bắt đầu *</label>
                            <input
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Kết thúc *</label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="button" className="btn btn--secondary" onClick={onClose} disabled={isSubmitting}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang lưu...' : eventToEdit ? 'Lưu Thay Đổi' : 'Tạo Sự Kiện'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShopEventModal;
