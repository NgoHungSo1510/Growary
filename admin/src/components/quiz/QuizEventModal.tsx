import React from 'react';

export interface QuizEvent {
  _id?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: 'upcoming' | 'active' | 'completed';
  colorBg?: string;
  colorIcon?: string;
  iconName?: string;
  rewardPerCorrect?: number;
  maxAttemptsPerUser?: number;
  attemptCooldownHours?: number;
  questionsPerAttempt?: number;
}

interface QuizEventModalProps {
  isOpen: boolean;
  event: Partial<QuizEvent> | null;
  onClose: () => void;
  onSave: (event: Partial<QuizEvent>) => Promise<void>;
  onChange: React.Dispatch<React.SetStateAction<Partial<QuizEvent> | null>>;
}

export const QuizEventModal: React.FC<QuizEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSave,
  onChange,
}) => {
  if (!isOpen || !event) return null;

  const fields: { label: string; key: keyof QuizEvent; type: string }[] = [
    { label: 'Tên sự kiện *', key: 'title', type: 'text' },
    { label: 'Mô tả', key: 'description', type: 'text' },
    { label: 'Thời gian bắt đầu *', key: 'startTime', type: 'datetime-local' },
    { label: 'Thời gian kết thúc *', key: 'endTime', type: 'datetime-local' },
    { label: 'Xu / câu đúng', key: 'rewardPerCorrect', type: 'number' },
    { label: 'Số lượt / user', key: 'maxAttemptsPerUser', type: 'number' },
    { label: 'Giờ hồi lượt', key: 'attemptCooldownHours', type: 'number' },
    { label: 'Số câu / lượt', key: 'questionsPerAttempt', type: 'number' },
    { label: 'Màu nền (hex)', key: 'colorBg', type: 'color' },
    { label: 'Màu icon (hex)', key: 'colorIcon', type: 'color' },
    { label: 'MaterialIcon name', key: 'iconName', type: 'text' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal__header">
          <h2>{event._id ? 'Sửa Sự Kiện Quiz' : 'Tạo Sự Kiện Quiz'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(({ label, key, type }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>{label}</label>
              <input
                type={type}
                value={(event as any)[key] ?? ''}
                onChange={e =>
                  onChange(prev => ({
                    ...prev!,
                    [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                  }))
                }
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </div>
          ))}
          {/* Color preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: event.colorBg || '#2563EB',
            }}
          >
            <span style={{ fontSize: 13, color: event.colorIcon || '#FFF', fontWeight: 'bold' }}>
              Preview màu: {event.title || 'Sự kiện Quiz'}
            </span>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn--primary" onClick={() => onSave(event)}>💾 Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default QuizEventModal;
