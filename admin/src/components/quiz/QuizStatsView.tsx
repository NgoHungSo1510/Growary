import React from 'react';
import { QuizEventDTO } from '@shared';
import { QuizEventStatsDTO } from '../../services/quizService';

interface QuizStatsViewProps {
  events: QuizEventDTO[];
  stats: QuizEventStatsDTO | null;
  statsEventId: string;
  onSelectEvent: (eventId: string) => void;
}

export const QuizStatsView: React.FC<QuizStatsViewProps> = ({
  events,
  stats,
  statsEventId,
  onSelectEvent,
}) => {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <select
          value={statsEventId}
          onChange={(e) => onSelectEvent(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, minWidth: 240 }}
        >
          <option value="">Chọn sự kiện</option>
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title}
            </option>
          ))}
        </select>
      </div>
      {stats && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Tổng người chơi', value: stats.totalPlayers, icon: '👥' },
            { label: 'Tổng lượt chơi', value: stats.totalAttempts, icon: '🎮' },
            { label: 'Trung bình đúng', value: stats.avgCorrect, icon: '✅' },
            { label: 'Xu đã phát', value: `${stats.totalCoinsDistributed} 🪙`, icon: '💰' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ minWidth: 160 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{s.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizStatsView;
