import React, { useState, useEffect } from 'react';
import { shopEventService } from '../../services';
import { ShopEvent } from '@shared';
import { ShopEventModal } from './ShopEventModal';

export const ShopEventTab: React.FC = () => {
    const [events, setEvents] = useState<ShopEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'auto'>('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<ShopEvent | null>(null);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await shopEventService.getShopEvents(filter === 'all' ? undefined : filter);
            setEvents(res.events || []);
        } catch (error) {
            console.error('Failed to load shop events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const handleToggleActive = async (event: ShopEvent) => {
        try {
            await shopEventService.updateShopEvent(event._id, { isActive: !event.isActive });
            fetchEvents();
        } catch (error: any) {
            alert('Lỗi khi đổi trạng thái: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
        try {
            await shopEventService.deleteShopEvent(id);
            fetchEvents();
        } catch (error: any) {
            alert('Lỗi khi xóa: ' + error.message);
        }
    };

    const handleOpenCreate = () => {
        setEventToEdit(null);
        setModalVisible(true);
    };

    const handleOpenEdit = (event: ShopEvent) => {
        setEventToEdit(event);
        setModalVisible(true);
    };

    return (
        <div className="card">
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 className="card__title">⚡ Quản Lý Sự Kiện Cửa Hàng (Flash Sale)</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                        Flash Sale tự động được kích hoạt lúc 00:00 VN hàng ngày với tỉ lệ 10%. Bạn cũng có thể tạo sự kiện thủ công bên dưới.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn--primary" onClick={handleOpenCreate}>
                        ➕ Tạo Sự Kiện Mới
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
                <button
                    className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setFilter('all')}
                >
                    Tất cả
                </button>
                <button
                    className={`btn btn--sm ${filter === 'active' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setFilter('active')}
                >
                    Đang kích hoạt
                </button>
                <button
                    className={`btn btn--sm ${filter === 'auto' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setFilter('auto')}
                >
                    Tự động (Cron)
                </button>
            </div>

            <div className="card__body" style={{ overflowX: 'auto', padding: 0 }}>
                {loading ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Đang tải danh sách sự kiện...</div>
                ) : events.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                        Chưa có sự kiện nào trong danh mục này.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                                <th style={{ padding: '12px 16px', fontSize: 13 }}>Tiêu đề & Thông điệp</th>
                                <th style={{ padding: '12px 16px', fontSize: 13 }}>Giảm giá</th>
                                <th style={{ padding: '12px 16px', fontSize: 13 }}>Nguồn</th>
                                <th style={{ padding: '12px 16px', fontSize: 13 }}>Thời gian áp dụng</th>
                                <th style={{ padding: '12px 16px', fontSize: 13 }}>Trạng thái</th>
                                <th style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => {
                                const isExpired = new Date(event.endDate) < new Date();
                                return (
                                    <tr key={event._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 700, color: '#1F2937' }}>{event.title}</div>
                                            <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {event.description}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                backgroundColor: '#FEE2E2',
                                                color: '#DC2626',
                                                fontWeight: 800,
                                                padding: '3px 8px',
                                                borderRadius: 12,
                                                fontSize: 12,
                                            }}>
                                                -{event.discountPercent}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {event.isAutoGenerated ? (
                                                <span style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                                                    🤖 Cron 10%
                                                </span>
                                            ) : (
                                                <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                                                    👤 Thủ công
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#4B5563' }}>
                                            <div>Từ: {new Date(event.startDate).toLocaleString('vi-VN')}</div>
                                            <div>Đến: {new Date(event.endDate).toLocaleString('vi-VN')}</div>
                                            {isExpired && (
                                                <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>● Đã hết hạn</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                className={`btn btn--sm ${event.isActive ? 'btn--primary' : 'btn--secondary'}`}
                                                style={{ fontSize: 11, padding: '3px 8px' }}
                                                onClick={() => handleToggleActive(event)}
                                            >
                                                {event.isActive ? '🟢 Bật' : '⚪ Tắt'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                style={{ marginRight: 6 }}
                                                onClick={() => handleOpenEdit(event)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn--danger btn--sm"
                                                onClick={() => handleDelete(event._id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <ShopEventModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSuccess={fetchEvents}
                eventToEdit={eventToEdit}
            />
        </div>
    );
};

export default ShopEventTab;
