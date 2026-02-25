import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface NotificationConfig {
    _id?: string;
    title: string;
    message: string;
    targetType: 'daily' | 'event' | 'boss';
    triggerBeforeMinutes: number;
    isActive: boolean;
}

export default function NotificationManagement() {
    const [configs, setConfigs] = useState<NotificationConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentConfig, setCurrentConfig] = useState<NotificationConfig>({
        title: '', message: '', targetType: 'daily', triggerBeforeMinutes: 15, isActive: true
    });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const data = await adminApi.getNotifications();
            setConfigs(data.configs || []);
        } catch (error) {
            console.error('Failed to fetch', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (currentConfig._id) {
                await adminApi.updateNotification(currentConfig._id, currentConfig);
            } else {
                await adminApi.createNotification(currentConfig);
            }
            setIsEditing(false);
            fetchConfigs();
        } catch (error) {
            console.error('Save error', error);
            alert('Lỗi lưu thông báo!');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa cấu hình thông báo này?')) return;
        try {
            await adminApi.deleteNotification(id);
            fetchConfigs();
        } catch (error) {
            console.error('Delete error', error);
        }
    };

    const openCreate = () => {
        setCurrentConfig({ title: '', message: '', targetType: 'daily', triggerBeforeMinutes: 15, isActive: true });
        setIsEditing(true);
    };

    if (loading) return <div className="p-6">Đang tải...</div>;

    return (
        <div className="page">
            <header className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page__title">Quản lý Thông báo</h1>
                    <p className="page__subtitle">Thiết lập các thông báo PUSH tự động cho người dùng (Offline Alarm).</p>
                </div>
                <button onClick={openCreate} className="btn btn--primary">+ Tạo thông báo mới</button>
            </header>

            {isEditing && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
                    <div className="bg-slate-800 w-[90%] max-w-[500px] p-6 rounded-xl border border-white/10">
                        <h2 className="text-white mb-5 text-xl">{currentConfig._id ? 'Sửa thông báo' : 'Thêm thông báo mới'}</h2>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-slate-400 text-[13px] mb-1.5">Tiêu đề</label>
                                <input value={currentConfig.title} onChange={e => setCurrentConfig({ ...currentConfig, title: e.target.value })} className="w-full p-2.5 rounded-md bg-black/30 border border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-[13px] mb-1.5">Nội dung thông báo (Message)</label>
                                <textarea value={currentConfig.message} onChange={e => setCurrentConfig({ ...currentConfig, message: e.target.value })} rows={3} className="w-full p-2.5 rounded-md bg-black/30 border border-white/10 text-white resize-y" />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-[13px] mb-1.5">Loại sự kiện</label>
                                    <select value={currentConfig.targetType} onChange={e => setCurrentConfig({ ...currentConfig, targetType: e.target.value as any })} className="w-full p-2.5 rounded-md bg-black/30 border border-white/10 text-white">
                                        <option value="daily">Daily Reset / Tới hạn Quest</option>
                                        <option value="boss">Boss Xuất hiện</option>
                                        <option value="event">Sự kiện đặc biệt</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-[13px] mb-1.5">Báo trước (phút)</label>
                                    <input type="number" value={currentConfig.triggerBeforeMinutes} onChange={e => setCurrentConfig({ ...currentConfig, triggerBeforeMinutes: Number(e.target.value) })} className="w-full p-2.5 rounded-md bg-black/30 border border-white/10 text-white" />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-white cursor-pointer mt-2">
                                <input type="checkbox" checked={currentConfig.isActive} onChange={e => setCurrentConfig({ ...currentConfig, isActive: e.target.checked })} className="w-[18px] h-[18px]" />
                                <span>Kích hoạt (Cho phép tạo Alarm)</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 bg-transparent text-slate-400 border border-white/20 rounded-md cursor-pointer hover:bg-white/5 transition-colors">Hủy</button>
                            <button onClick={handleSave} className="btn btn--primary px-4 py-2.5">Lưu thông báo</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid-3 !grid-cols-1">
                {configs.map(conf => (
                    <div key={conf._id} className={`card flex justify-between items-center ${conf.isActive ? 'opacity-100' : 'opacity-50'}`}>
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-white text-base m-0">{conf.title}</h3>
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-sky-400/20 text-sky-400 uppercase tracking-wide">{conf.targetType}</span>
                                <span className="text-xs text-amber-500">⏰ Báo trước {conf.triggerBeforeMinutes}p</span>
                            </div>
                            <p className="text-slate-400 text-sm m-0">{conf.message}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setCurrentConfig(conf); setIsEditing(true); }} className="bg-white/10 border-none text-white px-3 py-2 rounded-md cursor-pointer hover:bg-white/20 transition-colors">Sửa</button>
                            <button onClick={() => handleDelete(conf._id!)} className="bg-red-500/20 border-none text-red-500 px-3 py-2 rounded-md cursor-pointer hover:bg-red-500/30 transition-colors">Xóa</button>
                        </div>
                    </div>
                ))}

                {configs.length === 0 && (
                    <div className="text-center p-10 text-slate-500">
                        Chưa có quy tắc thông báo nào được thiết lập.
                    </div>
                )}
            </div>
        </div>
    );
}
