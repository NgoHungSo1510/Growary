import { useState, useEffect } from 'react';
import {
  QuizEventDTO,
  QuizTopicAdminDTO,
  QuizTopicDTO,
  QuizQuestionAdminDTO,
} from '@shared';
import { quizService, QuizEventStatsDTO } from '../services/quizService';
import {
  QuizEventModal,
  QuizTopicModal,
  QuizQuestionModal,
  QuizEventsTable,
  QuizTopicsTable,
  QuizQuestionsTable,
  QuizStatsView,
} from '../components/quiz';

type Tab = 'events' | 'topics' | 'questions' | 'stats';

export default function QuizManagementPage() {
  const [tab, setTab] = useState<Tab>('events');

  // ── Events state ──
  const [events, setEvents] = useState<QuizEventDTO[]>([]);
  const [editEvent, setEditEvent] = useState<Partial<QuizEventDTO> | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // ── Topics state ──
  const [topics, setTopics] = useState<QuizTopicAdminDTO[]>([]);
  const [editTopic, setEditTopic] = useState<Partial<QuizTopicDTO> | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);

  // ── Questions state ──
  const [questions, setQuestions] = useState<QuizQuestionAdminDTO[]>([]);
  const [filterTopicId, setFilterTopicId] = useState('');
  const [editQuestion, setEditQuestion] = useState<Partial<QuizQuestionAdminDTO> | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // ── Stats state ──
  const [stats, setStats] = useState<QuizEventStatsDTO | null>(null);
  const [statsEventId, setStatsEventId] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [evRes, topRes, qRes] = await Promise.all([
        quizService.getQuizEvents(),
        quizService.getQuizTopics(),
        quizService.getQuizQuestions(),
      ]);
      setEvents(evRes.events);
      setTopics(topRes.topics);
      setQuestions(qRes.questions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải dữ liệu';
      alert(msg);
    }
  };

  // ────────── TAB: EVENTS ──────────
  const saveEvent = async (eventData: Partial<QuizEventDTO>) => {
    if (!eventData?.title || !eventData.startTime || !eventData.endTime) {
      alert('Vui lòng nhập đủ Tên, Thời gian bắt đầu, Thời gian kết thúc');
      return;
    }
    try {
      if (eventData._id) {
        await quizService.updateQuizEvent(eventData._id, eventData);
      } else {
        await quizService.createQuizEvent(eventData);
      }
      setShowEventModal(false);
      setEditEvent(null);
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi lưu sự kiện');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Xóa sự kiện quiz này?')) return;
    try {
      await quizService.deleteQuizEvent(id);
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi xóa sự kiện');
    }
  };

  // ────────── TAB: TOPICS ──────────
  const saveTopic = async (topicData: Partial<QuizTopicDTO>) => {
    if (!topicData?.name) {
      alert('Nhập tên chủ đề');
      return;
    }
    try {
      if (topicData._id) {
        await quizService.updateQuizTopic(topicData._id, topicData);
      } else {
        await quizService.createQuizTopic(topicData);
      }
      setShowTopicModal(false);
      setEditTopic(null);
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi lưu chủ đề');
    }
  };

  // ────────── TAB: QUESTIONS ──────────
  const saveQuestion = async (qData: Partial<QuizQuestionAdminDTO>) => {
    if (
      !qData?.topic ||
      !qData.question ||
      !qData.options ||
      qData.options.length !== 4 ||
      qData.correctIndex === undefined
    ) {
      alert('Nhập đủ chủ đề, câu hỏi, đúng 4 đáp án và đáp án đúng');
      return;
    }
    try {
      const topicId = typeof qData.topic === 'string' ? qData.topic : qData.topic._id;
      const payload = { ...qData, topic: topicId };
      if (qData._id) {
        await quizService.updateQuizQuestion(qData._id, payload);
      } else {
        await quizService.createQuizQuestion(payload);
      }
      setShowQuestionModal(false);
      setEditQuestion(null);
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi lưu câu hỏi');
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Xóa câu hỏi?')) return;
    try {
      await quizService.deleteQuizQuestion(id);
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi xóa câu hỏi');
    }
  };

  const loadStats = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await quizService.getQuizEventStats(eventId);
      setStats(res);
      setStatsEventId(eventId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi tải thống kê');
    }
  };

  const activeEvent = events.find((e) => e.status === 'active');
  const requiredQuestions = activeEvent ? activeEvent.questionsPerAttempt : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🧠 Quản Lý Trắc Nghiệm (Tri Thức Đấu Trí)</h1>
        {tab === 'events' && (
          <button
            className="btn btn--primary"
            onClick={() => {
              setEditEvent({
                status: 'upcoming',
                colorBg: '#2563EB',
                colorIcon: '#FFFFFF',
                iconName: 'quiz',
                rewardPerCorrect: 50,
                maxAttemptsPerUser: 3,
                attemptCooldownHours: 24,
                questionsPerAttempt: 5,
              });
              setShowEventModal(true);
            }}
          >
            + Tạo Sự Kiện
          </button>
        )}
        {tab === 'topics' && (
          <button
            className="btn btn--primary"
            onClick={() => {
              setEditTopic({ colorAccent: '#2563EB', iconName: 'quiz', isActive: true });
              setShowTopicModal(true);
            }}
          >
            + Thêm Chủ Đề
          </button>
        )}
        {tab === 'questions' && (
          <button
            className="btn btn--primary"
            onClick={() => {
              setEditQuestion({ options: ['', '', '', ''], correctIndex: 0, difficulty: 'medium' });
              setShowQuestionModal(true);
            }}
          >
            + Thêm Câu Hỏi
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div
        className="tab-bar"
        style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--border)' }}
      >
        {(['events', 'topics', 'questions', 'stats'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              fontWeight: tab === t ? 'bold' : 'normal',
              borderBottom: tab === t ? '3px solid #2563EB' : '3px solid transparent',
              color: tab === t ? '#2563EB' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            {{ events: '📅 Sự Kiện', topics: '📚 Chủ Đề', questions: '❓ Câu Hỏi', stats: '📊 Thống Kê' }[t]}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tab === 'events' && (
        <QuizEventsTable
          events={events}
          onEdit={(ev) => { setEditEvent(ev); setShowEventModal(true); }}
          onViewStats={(id) => { setTab('stats'); loadStats(id); }}
          onDelete={deleteEvent}
        />
      )}

      {tab === 'topics' && (
        <QuizTopicsTable
          topics={topics}
          requiredQuestions={requiredQuestions}
          onEdit={(t) => { setEditTopic(t); setShowTopicModal(true); }}
        />
      )}

      {tab === 'questions' && (
        <QuizQuestionsTable
          questions={questions}
          topics={topics}
          filterTopicId={filterTopicId}
          onFilterChange={setFilterTopicId}
          onEdit={(q) => { setEditQuestion(q); setShowQuestionModal(true); }}
          onDelete={deleteQuestion}
        />
      )}

      {tab === 'stats' && (
        <QuizStatsView
          events={events}
          stats={stats}
          statsEventId={statsEventId}
          onSelectEvent={loadStats}
        />
      )}

      {/* Modals */}
      <QuizEventModal
        isOpen={showEventModal}
        event={editEvent}
        onClose={() => setShowEventModal(false)}
        onSave={saveEvent}
        onChange={setEditEvent}
      />

      <QuizTopicModal
        isOpen={showTopicModal}
        topic={editTopic}
        onClose={() => setShowTopicModal(false)}
        onSave={saveTopic}
        onChange={setEditTopic}
      />

      <QuizQuestionModal
        isOpen={showQuestionModal}
        question={editQuestion}
        topics={topics}
        onClose={() => setShowQuestionModal(false)}
        onSave={saveQuestion}
        onChange={setEditQuestion}
      />
    </div>
  );
}
