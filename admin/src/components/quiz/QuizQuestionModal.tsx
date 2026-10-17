import React from 'react';

export interface QuizQuestionItem {
  _id?: string;
  topic?: any;
  question?: string;
  options?: string[];
  correctIndex?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizQuestionModalProps {
  isOpen: boolean;
  question: Partial<QuizQuestionItem> | null;
  topics: { _id: string; name: string }[];
  onClose: () => void;
  onSave: (question: Partial<QuizQuestionItem>) => Promise<void>;
  onChange: React.Dispatch<React.SetStateAction<Partial<QuizQuestionItem> | null>>;
}

export const QuizQuestionModal: React.FC<QuizQuestionModalProps> = ({
  isOpen,
  question,
  topics,
  onClose,
  onSave,
  onChange,
}) => {
  if (!isOpen || !question) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal__header">
          <h2>{question._id ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold' }}>Chủ đề *</label>
            <select
              value={(question.topic as any) ?? ''}
              onChange={e => onChange(p => ({ ...p!, topic: e.target.value as any }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
            >
              <option value="">Chọn chủ đề</option>
              {topics.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold' }}>Câu hỏi *</label>
            <textarea
              value={question.question ?? ''}
              rows={3}
              onChange={e => onChange(p => ({ ...p!, question: e.target.value }))}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>
          {['A', 'B', 'C', 'D'].map((label, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 'bold', width: 24 }}>{label}</label>
              <input
                value={question.options?.[idx] ?? ''}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 14,
                }}
                onChange={e => {
                  const opts = [...(question.options || ['', '', '', ''])];
                  opts[idx] = e.target.value;
                  onChange(p => ({ ...p!, options: opts }));
                }}
              />
              <input
                type="radio"
                checked={question.correctIndex === idx}
                onChange={() => onChange(p => ({ ...p!, correctIndex: idx }))}
                title="Đáp án đúng"
              />
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            ☝️ Chọn radio để đánh dấu đáp án đúng
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold' }}>Độ khó</label>
            <select
              value={question.difficulty ?? 'medium'}
              onChange={e => onChange(p => ({ ...p!, difficulty: e.target.value as any }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn--primary" onClick={() => onSave(question)}>💾 Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestionModal;
