import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface PenaltyConfig {
    lateThresholds: { thresholdMinutes: number; deductionPercentage: number }[];
    missedQuestPenaltyCoin: number;
}

export default function PenaltyManagement() {
    const [config, setConfig] = useState<PenaltyConfig>({ lateThresholds: [], missedQuestPenaltyCoin: 50 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const data = await adminApi.getPenaltyConfig();
            if (data.config) {
                setConfig({
                    lateThresholds: data.config.lateThresholds || [],
                    missedQuestPenaltyCoin: data.config.missedQuestPenaltyCoin ?? 50,
                });
            }
        } catch (error) {
            console.error('Failed to load penalty config', error);
            setMessage('Lỗi tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await adminApi.updatePenaltyConfig(config);
            setMessage('Lưu cấu hình thành công!');
        } catch (error) {
            setMessage('Lỗi khi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const handleAddThreshold = () => {
        setConfig(prev => ({
            ...prev,
            lateThresholds: [...prev.lateThresholds, { thresholdMinutes: 15, deductionPercentage: 10 }]
        }));
    };

    const handleRemoveThreshold = (index: number) => {
        setConfig(prev => {
            const newArr = [...prev.lateThresholds];
            newArr.splice(index, 1);
            return { ...prev, lateThresholds: newArr };
        });
    };

    const handleThresholdChange = (index: number, field: 'thresholdMinutes' | 'deductionPercentage', value: number) => {
        setConfig(prev => {
            const newArr = [...prev.lateThresholds];
            newArr[index][field] = value;
            return { ...prev, lateThresholds: newArr };
        });
    };

    if (loading) return <div className="p-6">Đang tải...</div>;

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Quản lý Luật lệ & Phạt</h1>
                    <p className="page__subtitle">Thiết lập các mốc phạt trì hoãn và bỏ lỡ nhiệm vụ.</p>
                </div>
            </header>

            <div className="grid-3 !grid-cols-1 max-w-[800px]">
                <div className="card">
                    <h2 className="card__title">Phạt không làm nhiệm vụ (Missed Quest)</h2>
                    <div className="form-group mt-4">
                        <label className="form-label block mb-2 text-slate-400">Số Coin bị trừ mỗi nhiệm vụ không hoàn thành</label>
                        <input
                            type="number"
                            min="0"
                            className="input w-full p-3 bg-white/5 border border-white/10 text-white rounded-lg"
                            value={config.missedQuestPenaltyCoin}
                            onChange={(e) => setConfig({ ...config, missedQuestPenaltyCoin: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center">
                        <h2 className="card__title">Phạt trễ hạn (Late Penalty)</h2>
                        <button onClick={handleAddThreshold} className="btn btn--primary px-3 py-1.5 text-[13px]">+ Thêm mốc phần trăm</button>
                    </div>
                    <p className="text-slate-500 text-sm mt-2 mb-4">Các mốc phạt sẽ tự động áp dụng khi người dùng hoàn thành quest trễ so với giờ dự kiến.</p>

                    {config.lateThresholds.length === 0 ? (
                        <p className="text-slate-400 italic">Chưa có mốc phạt trễ nào.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {config.lateThresholds.map((t, index) => (
                                <div key={index} className="flex gap-4 items-end bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div className="flex-1">
                                        <label className="block text-xs text-slate-400 mb-1">Trễ từ (phút)</label>
                                        <input
                                            type="number"
                                            value={t.thresholdMinutes}
                                            onChange={(e) => handleThresholdChange(index, 'thresholdMinutes', Number(e.target.value))}
                                            className="w-full p-2 bg-black/20 border border-white/10 text-white rounded"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-slate-400 mb-1">Giảm thưởng (%)</label>
                                        <input
                                            type="number"
                                            value={t.deductionPercentage}
                                            onChange={(e) => handleThresholdChange(index, 'deductionPercentage', Number(e.target.value))}
                                            className="w-full p-2 bg-black/20 border border-white/10 text-white rounded"
                                        />
                                    </div>
                                    <button onClick={() => handleRemoveThreshold(index)} className="px-3 py-2 bg-red-500/20 text-red-500 border-none rounded cursor-pointer hover:bg-red-500/30 transition-colors">Xóa</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-center ${message.includes('thành công') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn--primary w-full p-3.5 text-base mt-4"
                >
                    {saving ? 'Đang lưu...' : 'Lưu lại tất cả cấu hình'}
                </button>
            </div>
        </div>
    );
}
