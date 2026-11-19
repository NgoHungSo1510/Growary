import React, { useState, useEffect } from 'react';
import { httpClient } from '../../services/client';
import type { PlayableMiniGameKey, MiniGameCatalogItem } from '@shared';

interface MiniGameConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MiniGameConfigModal: React.FC<MiniGameConfigModalProps> = ({ isOpen, onClose }) => {
    const [minigames, setMinigames] = useState<MiniGameCatalogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        httpClient.get<{ minigames: MiniGameCatalogItem[] }>('/admin/boss-minigames')
            .then((res) => {
                if (res?.minigames) setMinigames(res.minigames);
            })
            .catch((err: Error) => {
                setError(err.message || 'Không thể tải danh sách minigame');
            })
            .finally(() => setLoading(false));
    }, [isOpen]);

    const handleToggle = (key: PlayableMiniGameKey) => {
        setMinigames((prev) =>
            prev.map((item) =>
                item.key === key ? { ...item, enabled: !item.enabled } : item
            )
        );
    };

    const handleSave = async () => {
        const enabledKeys = minigames.filter((m) => m.enabled).map((m) => m.key);
        if (enabledKeys.length === 0) {
            setError('Bắt buộc phải bật ít nhất 1 trò chơi để người chơi có thể phá khóa');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            const res = await httpClient.put<{ minigames: MiniGameCatalogItem[] }>('/admin/boss-minigames', {
                enabledKeys,
            });
            if (res?.minigames) {
                setMinigames(res.minigames);
            }
            setSuccessMessage('Đã lưu cấu hình minigame thành công!');
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">🎮 Quản Lý Các Minigame Hiện Có</h2>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body" style={{ padding: '16px 20px' }}>
                    <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                        Các trò chơi được bật dưới đây sẽ được hệ thống chọn ngẫu nhiên khi người chơi chiến đấu với nhân vật tuần.
                    </p>

                    {error && (
                        <div className="alert alert--error" style={{ padding: 10, borderRadius: 6, marginBottom: 14 }}>
                            ❌ {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="alert alert--success" style={{ padding: 10, borderRadius: 6, marginBottom: 14 }}>
                            ✅ {successMessage}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                            ⏳ Đang tải danh sách minigame...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {minigames.map((game) => (
                                <div
                                    key={game.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        border: '1px solid var(--border)',
                                        background: game.enabled ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-muted)',
                                    }}
                                >
                                    <div style={{ flex: 1, paddingRight: 12 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                                            {game.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                            {game.description}
                                        </div>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                                        <input
                                            type="checkbox"
                                            checked={game.enabled}
                                            onChange={() => handleToggle(game.key)}
                                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: 13, fontWeight: 500, color: game.enabled ? '#10B981' : '#64748B' }}>
                                            {game.enabled ? 'Đang bật' : 'Đang tắt'}
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                        Hủy
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình Minigame'}
                    </button>
                </div>
            </div>
        </div>
    );
};

