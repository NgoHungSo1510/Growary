import React from 'react';
import { QuizEventDTO } from '@shared';

interface QuizEventsTableProps {
  events: QuizEventDTO[];
  onEdit: (ev: QuizEventDTO) => void;
  onViewStats: (id: string) => void;
  onDelete: (id: string) => void;
}

export const QuizEventsTable: React.FC<QuizEventsTableProps> = ({
  events,
  onEdit,
  onViewStats,
  onDelete,
}) => {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Tên sự kiện</th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
            <th>Xu/câu</th>
            <th>Lượt/user</th>
            <th>Màu</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev._id}>
              <td><strong>{ev.title}</strong></td>
              <td style={{ fontSize: 12 }}>
                {new Date(ev.startTime).toLocaleDateString('vi-VN')} →{' '}
                {new Date(ev.endTime).toLocaleDateString('vi-VN')}
              </td>
              <td>
                <span className={`badge badge--${ev.status === 'active' ? 'primary' : ev.status === 'completed' ? 'success' : 'info'}`}>
                  {{ upcoming: 'Sắp tới', active: 'Đang mở', completed: 'Đã xong' }[ev.status]}
                </span>
              </td>
              <td>{ev.rewardPerCorrect} 🪙</td>
              <td>{ev.maxAttemptsPerUser} lượt</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: ev.colorBg }} />
                  <span style={{ fontSize: 11 }}>{ev.colorBg}</span>
                </div>
              </td>
              <td>
                <div className="table-actions">
                  <button className="btn btn--secondary btn--sm" onClick={() => onEdit(ev)}>✏️ Sửa</button>
                  <button className="btn btn--secondary btn--sm" onClick={() => onViewStats(ev._id)}>📊</button>
                  <button className="btn btn--danger btn--sm" onClick={() => onDelete(ev._id)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuizEventsTable;
