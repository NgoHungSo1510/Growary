import React from 'react';
import { QuizTopicAdminDTO } from '@shared';

interface QuizTopicsTableProps {
  topics: QuizTopicAdminDTO[];
  requiredQuestions: number;
  onEdit: (topic: QuizTopicAdminDTO) => void;
}

export const QuizTopicsTable: React.FC<QuizTopicsTableProps> = ({
  topics,
  requiredQuestions,
  onEdit,
}) => {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Chủ đề</th>
            <th>Màu</th>
            <th>Icon</th>
            <th>Số câu hỏi</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((t) => {
            const count = t.questionCount ?? 0;
            const isInsufficient = requiredQuestions > 0 && count < requiredQuestions;

            return (
              <tr key={t._id}>
                <td>
                  <strong>{t.name}</strong>
                  <br />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.description}</span>
                </td>
                <td>
                  <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: t.colorAccent }} />
                </td>
                <td>{t.iconName}</td>
                <td>
                  <span>{count} câu</span>
                  {isInsufficient && (
                    <span
                      className="badge badge--danger"
                      style={{ marginLeft: 8, fontSize: 11 }}
                      title={`Cần tối thiểu ${requiredQuestions} câu để sự kiện active hoạt động!`}
                    >
                      ⚠️ Thiếu câu ({count}/{requiredQuestions})
                    </span>
                  )}
                </td>
                <td>
                  <span className={`badge badge--${t.isActive ? 'success' : 'danger'}`}>
                    {t.isActive ? 'Bật' : 'Tắt'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => onEdit(t)}
                    >
                      ✏️ Sửa
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default QuizTopicsTable;
