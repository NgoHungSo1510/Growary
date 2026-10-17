import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface BossFormModalProps {
    isOpen: boolean;
    editEvent: any | null;
    collections: any[];
    mysteryBoxes: any[];
    isLoading: boolean;
    onClose: () => void;
    onSave: (savedEvent: any) => void;
}

export const BossFormModal: React.FC<BossFormModalProps> = ({
    isOpen,
    editEvent: initialEvent,
    collections,
    mysteryBoxes,
    isLoading: parentLoading,
    onClose,
    onSave,
}) => {
    const [editEvent, setEditEvent] = useState<any>(initialEvent || {});
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setEditEvent(initialEvent || {});
    }, [initialEvent]);

    if (!isOpen) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = reader.result as string;
                const res = await adminApi.post<{ url: string }>('/upload/image', { image: base64Image });
                if (res.url) {
                    setEditEvent((prev: any) => ({ ...prev, avatarImageUrl: res.url }));
                }
            };
        } catch (error) {
            alert('Upload ảnh thất bại!');
        } finally {
            setIsUploading(false);
        }
    };

    const addQuestion = () => {
        setEditEvent((prev: any) => ({
            ...prev,
            miniGameQuestions: [...(prev?.miniGameQuestions || []), { question: '', options: ['', '', '', ''], correctIndex: 0 }]
        }));
    };

    const removeQuestion = (idx: number) => {
        setEditEvent((prev: any) => ({
            ...prev,
            miniGameQuestions: prev.miniGameQuestions?.filter((_: any, i: number) => i !== idx)
        }));
    };

    const updateQuestion = (idx: number, field: string, value: any) => {
        setEditEvent((prev: any) => {
            const qs = [...(prev.miniGameQuestions || [])];
            qs[idx] = { ...qs[idx], [field]: value };
            return { ...prev, miniGameQuestions: qs };
        });
    };

    const updateOption = (qIdx: number, optIdx: number, value: string) => {
        setEditEvent((prev: any) => {
            const qs = [...(prev.miniGameQuestions || [])];
            const opts = [...qs[qIdx].options];
            opts[optIdx] = value;
            qs[qIdx] = { ...qs[qIdx], options: opts };
            return { ...prev, miniGameQuestions: qs };
        });
    };

    const handleSubmit = () => {
        if (!editEvent?.title || !editEvent?.maxHp) {
            alert('Vui lòng nhập đủ Tên và HP');
            return;
        }
        onSave(editEvent);
    };

    const isLoading = parentLoading || isUploading;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
                <div className="modal__header">
                    <span className="modal__title">
                        {editEvent?._id ? '✏️ Chỉnh sửa Sự Kiện Nhân Vật' : '➕ Tạo Sự Kiện Nhân Vật Mới'}
                    </span>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                <div className="modal__body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                        {/* Section 1: Basic & Identity */}
                        <div>
                            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--accent)' }}>1. Thông tin cơ bản</h3>

                            <div className="form-group">
                                <label>URL Ảnh Đại Diện Nhân Vật</label>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    {editEvent?.avatarImageUrl && (
                                        <img
                                            src={editEvent.avatarImageUrl}
                                            style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: `2px solid ${editEvent?.colorBg || '#ef4444'}` }}
                                            alt="preview"
                                        />
                                    )}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        <input
                                            type="text"
                                            value={editEvent?.avatarImageUrl || ''}
                                            onChange={e => setEditEvent({ ...editEvent, avatarImageUrl: e.target.value })}
                                            placeholder="Hoặc dán URL: https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    id="isLimited"
                                    checked={editEvent?.isLimited ?? false}
                                    onChange={e => setEditEvent({ ...editEvent, isLimited: e.target.checked })}
                                />
                                <label htmlFor="isLimited" style={{ margin: 0 }}>Nhân vật sự kiện giới hạn (Chỉ xuất hiện 1 lần)</label>
                            </div>

                            <div className="form-group">
                                <label>Thuộc Bộ sưu tập</label>
                                <select
                                    value={editEvent?.collectionId || ''}
                                    onChange={e => setEditEvent({ ...editEvent, collectionId: e.target.value })}
                                    style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
                                >
                                    <option value="">-- Không thuộc bộ nào --</option>
                                    {collections.map(col => (
                                        <option key={col._id} value={col._id}>{col.iconEmoji} {col.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tên Sự Kiện Nhân Vật</label>
                                <input
                                    type="text"
                                    value={editEvent?.title || ''}
                                    onChange={e => setEditEvent({ ...editEvent, title: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Mô tả ngắn gọn (Sự kiện)</label>
                                <textarea
                                    value={editEvent?.description || ''}
                                    onChange={e => setEditEvent({ ...editEvent, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="form-group">
                                <label>Tên cốt truyện (VD: Bí Ẩn Doraemon)</label>
                                <input
                                    type="text"
                                    value={editEvent?.loreTitle || ''}
                                    onChange={e => setEditEvent({ ...editEvent, loreTitle: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Nội dung cốt truyện (Hiển thị khi phá khóa)</label>
                                <textarea
                                    rows={4}
                                    value={editEvent?.loreContent || ''}
                                    onChange={e => setEditEvent({ ...editEvent, loreContent: e.target.value })}
                                />
                            </div>

                            <h3 style={{ fontSize: 16, marginTop: 24, marginBottom: 16, color: 'var(--accent)' }}>2. Phần thưởng & Chỉ số</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label>Máu (Max HP)</label>
                                    <input
                                        type="number"
                                        value={editEvent?.maxHp || ''}
                                        onChange={e => setEditEvent({ ...editEvent, maxHp: Number(e.target.value) })}
                                    />
                                </div>
                                {editEvent?._id && (
                                    <div className="form-group">
                                        <label>Current HP</label>
                                        <input
                                            type="number"
                                            value={editEvent?.currentHp || ''}
                                            onChange={e => setEditEvent({ ...editEvent, currentHp: Number(e.target.value) })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label>Coins</label>
                                    <input type="number" value={editEvent?.baseRewardCoins || 0} onChange={e => setEditEvent({ ...editEvent, baseRewardCoins: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>XP</label>
                                    <input type="number" value={editEvent?.baseRewardXp || 0} onChange={e => setEditEvent({ ...editEvent, baseRewardXp: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Gacha</label>
                                    <input type="number" value={editEvent?.gachaTickets || 0} onChange={e => setEditEvent({ ...editEvent, gachaTickets: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label>Phần Thưởng Mystery Box</label>
                                <select
                                    value={editEvent?.mysteryBoxRewards?.[0] || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setEditEvent({ ...editEvent, mysteryBoxRewards: val ? [val] : [] });
                                    }}
                                    style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
                                >
                                    <option value="">-- Không có phần thưởng rương --</option>
                                    {mysteryBoxes.map(box => (
                                        <option key={box._id} value={box._id}>{box.name} ({box.rarity})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Section 2: Mini-Game & Styling */}
                        <div>
                            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--accent)' }}>3. Cơ Chế Minigame</h3>

                            <div className="form-group">
                                <label>Loại Cơ Chế (Đánh Khóa)</label>
                                <select
                                    value={editEvent?.miniGameType || 'random'}
                                    onChange={e => setEditEvent({ ...editEvent, miniGameType: e.target.value })}
                                    style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
                                >
                                    <option value="random">Ngẫu nhiên</option>
                                    <option value="tap">Bấm liên tục (Tap)</option>
                                    <option value="reflex">Phản xạ (Reflex)</option>
                                    <option value="quiz">Giải đố (Quiz)</option>
                                </select>
                            </div>

                            <h4 style={{ fontSize: 14, marginTop: 24, marginBottom: 8 }}>Câu Hỏi Mini-Game (Quick Quiz)</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                Chỉ dùng nếu cơ chế là Random hoặc Quiz.
                            </p>

                            {(editEvent?.miniGameQuestions || []).map((q: any, idx: number) => (
                                <div key={idx} style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <strong>Câu hỏi {idx + 1}</strong>
                                        <button className="btn btn--danger btn--sm" onClick={() => removeQuestion(idx)}>Xóa</button>
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Nội dung câu hỏi"
                                            value={q.question}
                                            onChange={e => updateQuestion(idx, 'question', e.target.value)}
                                        />
                                    </div>
                                    {['A', 'B', 'C', 'D'].map((opt, optIdx) => (
                                        <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                            <input
                                                type="radio"
                                                name={`correct-${idx}`}
                                                checked={q.correctIndex === optIdx}
                                                onChange={() => updateQuestion(idx, 'correctIndex', optIdx)}
                                            />
                                            <span style={{ fontWeight: 'bold' }}>{opt}:</span>
                                            <input
                                                type="text"
                                                placeholder={`Đáp án ${opt}`}
                                                value={q.options[optIdx] || ''}
                                                onChange={e => updateOption(idx, optIdx, e.target.value)}
                                                style={{ flex: 1, padding: '4px 8px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <button className="btn btn--secondary" onClick={addQuestion} style={{ width: '100%', marginBottom: 24 }}>+ Thêm câu hỏi</button>

                            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--accent)' }}>4. Tùy chỉnh (Dự phòng)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label>Màu nền (Hex)</label>
                                    <input type="text" value={editEvent?.colorBg || '#ef4444'} onChange={e => setEditEvent({ ...editEvent, colorBg: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Màu Icon Nhân vật</label>
                                    <input type="text" value={editEvent?.colorIcon || '#ffffff'} onChange={e => setEditEvent({ ...editEvent, colorIcon: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
                    <button className="btn btn--primary" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Đang lưu...' : (editEvent?._id ? 'Cập nhật Nhân vật' : 'Tạo Nhân vật')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BossFormModal;
