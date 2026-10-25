import React, { useState } from 'react';
import { QuizTopicDTO } from '@shared';

interface QuizTopicModalProps {
  isOpen: boolean;
  topic: Partial<QuizTopicDTO> | null;
  onClose: () => void;
  onSave: (topic: Partial<QuizTopicDTO>) => Promise<void>;
  onChange: React.Dispatch<React.SetStateAction<Partial<QuizTopicDTO> | null>>;
}

export const QuizTopicModal: React.FC<QuizTopicModalProps> = ({
  isOpen,
  topic,
  onClose,
  onSave,
  onChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !topic) return null;

  const fields: { label: string; key: keyof QuizTopicDTO; type: string }[] = [
    { label: 'Tên chủ đề *', key: 'name', type: 'text' },
    { label: 'Mô tả', key: 'description', type: 'text' },
    { label: 'Màu accent (hex)', key: 'colorAccent', type: 'color' },
    { label: 'MaterialIcon name', key: 'iconName', type: 'text' },
  ];

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onSave(topic);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal__header">
          <h2>{topic._id ? 'Sửa Chủ Đề' : 'Thêm Chủ Đề'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(({ label, key, type }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>{label}</label>
              <input
                type={type}
                value={(topic[key] as string | undefined) ?? ''}
                onChange={e =>
                  onChange(prev => ({
                    ...prev!,
                    [key]: e.target.value,
                  }))
                }
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </div>
          ))}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={topic.isActive ?? true}
              onChange={e =>
                onChange(prev => ({
                  ...prev!,
                  isActive: e.target.checked,
                }))
              }
            />
            <span style={{ fontSize: 14 }}>Bật chủ đề</span>
          </label>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : '💾 Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizTopicModal;
