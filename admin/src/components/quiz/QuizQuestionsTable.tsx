import React from 'react';
import { QuizQuestionAdminDTO, QuizTopicAdminDTO } from '@shared';

interface QuizQuestionsTableProps {
  questions: QuizQuestionAdminDTO[];
  topics: QuizTopicAdminDTO[];
  filterTopicId: string;
  onFilterChange: (topicId: string) => void;
  onEdit: (q: QuizQuestionAdminDTO) => void;
  onDelete: (id: string) => void;
}

export const QuizQuestionsTable: React.FC<QuizQuestionsTableProps> = ({
  questions,
  topics,
  filterTopicId,
  onFilterChange,
  onEdit,
  onDelete,
}) => {
  const filteredQuestions = filterTopicId
    ? questions.filter((q) => {
        const tId = typeof q.topic === 'string' ? q.topic : q.topic?._id;
        return tId === filterTopicId;
      })
    : questions;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <select
          value={filterTopicId}
          onChange={(e) => onFilterChange(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
        >
          <option value="">Tất cả chủ đề</option>
          {topics.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
          {filteredQuestions.length} câu hỏi
        </span>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Câu hỏi</th>
              <th>Chủ đề</th>
              <th>Đáp án đúng</th>
              <th>Độ khó</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q, i) => {
              const topicName =
                typeof q.topic === 'object' && q.topic
                  ? q.topic.name
                  : topics.find((t) => t._id === q.topic)?.name || 'Chủ đề';
              const topicColor =
                typeof q.topic === 'object' && q.topic
                  ? q.topic.colorAccent
                  : '#2563EB';

              return (
                <tr key={q._id}>
                  <td>{i + 1}</td>
                  <td style={{ maxWidth: 300 }}>{q.question}</td>
                  <td>
                    <span
                      style={{
                        background: topicColor,
                        color: '#FFF',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                      }}
                    >
                      {topicName}
                    </span>
                  </td>
                  <td style={{ color: '#22C55E', fontWeight: 'bold' }}>
                    {['A', 'B', 'C', 'D'][q.correctIndex]}. {q.options[q.correctIndex]}
                  </td>
                  <td>
                    <span
                      className={`badge badge--${
                        { easy: 'success', medium: 'info', hard: 'danger' }[q.difficulty]
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => onEdit(q)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => onDelete(q._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default QuizQuestionsTable;
