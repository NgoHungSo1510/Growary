import React, { useState, useEffect } from 'react';
import { approvalService } from '../../services/approvalService';
import type { AutoApproveConfig } from '../../types';
import './AutoApproval.css';

export const AutoApproveConfigBar: React.FC = () => {
    const [config, setConfig] = useState<AutoApproveConfig>({
        enabled: true,
        thresholdHours: 6,
        maxTasksPerUserPerDay: 3,
        voucherMaxPoints: 500,
    });
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState<string | null>(null);

    useEffect(() => {
        void approvalService
            .getAutoApproveConfig()
            .then((res) => {
                if (res.config) setConfig(res.config);
            })
            .catch(() => undefined);
    }, []);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        setSavedMsg(null);
        try {
            const res = await approvalService.updateAutoApproveConfig(config);
            setConfig(res.config);
            setSavedMsg('✅ Đã lưu cấu hình tự động duyệt!');
        } catch (err: unknown) {
            setSavedMsg(err instanceof Error ? `❌ ${err.message}` : '❌ Lỗi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card auto-approve-config">
            <div className="card__header">
                <span className="card__title">⚙️ Cấu hình Tự động duyệt khi quá hạn (Chống bỏ lỡ)</span>
            </div>
            <div className="card__body">
                <div className="auto-approve-config__grid">
                    <div>
                        <label className="auto-approve-config__toggle">
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            />
                            <span>Bật tự động duyệt</span>
                        </label>
                    </div>

                    <div className="auto-approve-config__field">
                        <label>Số giờ chờ trước khi tự duyệt</label>
                        <input
                            type="number"
                            min={1}
                            max={72}
                            value={config.thresholdHours}
                            onChange={(e) =>
                                setConfig({ ...config, thresholdHours: Math.max(1, Number(e.target.value)) })
                            }
                            className="auto-approve-config__input"
                        />
                    </div>

                    <div className="auto-approve-config__field">
                        <label>Tối đa Task tự duyệt / User / Ngày</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={config.maxTasksPerUserPerDay}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    maxTasksPerUserPerDay: Math.max(1, Number(e.target.value)),
                                })
                            }
                            className="auto-approve-config__input"
                        />
                    </div>

                    <div className="auto-approve-config__field">
                        <label>Giới hạn điểm Voucher tự duyệt</label>
                        <input
                            type="number"
                            min={0}
                            max={50000}
                            value={config.voucherMaxPoints}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    voucherMaxPoints: Math.max(0, Number(e.target.value)),
                                })
                            }
                            className="auto-approve-config__input"
                        />
                    </div>

                    <div>
                        <button
                            type="button"
                            className="btn btn--primary"
                            disabled={saving}
                            onClick={() => void handleSave()}
                        >
                            {saving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình'}
                        </button>
                    </div>
                </div>

                {savedMsg && <div className="auto-approve-config__notice">{savedMsg}</div>}
            </div>
        </div>
    );
};

export default AutoApproveConfigBar;

