import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

// ── Types ──
interface QuizEvent {
  _id: string; title: string; description: string;
  startTime: string; endTime: string;
  status: 'upcoming' | 'active' | 'completed';
  colorBg: string; colorIcon: string; iconName: string;
  rewardPerCorrect: number; maxAttemptsPerUser: number;
  attemptCooldownHours: number; questionsPerAttempt: number;
}
interface QuizTopic {
  _id: string; name: string; description: string;
  colorAccent: string; iconName: string; isActive: boolean;
  questionCount?: number;
}
interface QuizQuestion {
  _id: string; topic: { _id: string; name: string; colorAccent: string };
  question: string; options: string[]; correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

type Tab = 'events' | 'topics' | 'questions' | 'stats';

export default function QuizManagementPage() {
  const [tab, setTab] = useState<Tab>('events');

  // ── Events state ──
  const [events, setEvents] = useState<QuizEvent[]>([]);
  const [editEvent, setEditEvent] = useState<Partial<QuizEvent> | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // ── Topics state ──
  const [topics, setTopics] = useState<QuizTopic[]>([]);
  const [editTopic, setEditTopic] = useState<Partial<QuizTopic> | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);

  // ── Questions state ──
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [filterTopicId, setFilterTopicId] = useState('');
  const [editQuestion, setEditQuestion] = useState<Partial<QuizQuestion & { options: string[] }> | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // ── Stats ──
  const [stats, setStats] = useState<any>(null);
  const [statsEventId, setStatsEventId] = useState('');

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    const [evRes, topRes, qRes] = await Promise.all([
      adminApi.get<{ events: QuizEvent[] }>('/admin/quiz/events'),
      adminApi.get<{ topics: QuizTopic[] }>('/admin/quiz/topics'),
      adminApi.get<{ questions: QuizQuestion[] }>('/admin/quiz/questions'),
    ]);
    setEvents(evRes.events);
    setTopics(topRes.topics);
    setQuestions(qRes.questions);
  };

  // ────────── TAB: EVENTS ──────────
  const saveEvent = async () => {
    if (!editEvent?.title || !editEvent.startTime || !editEvent.endTime) {
      alert('Vui lòng nhập đủ Tên, Thời gian bắt đầu, Thời gian kết thúc');
      return;
    }
    if (editEvent._id) await adminApi.put(`/admin/quiz/events/${editEvent._id}`, editEvent);
    else await adminApi.post('/admin/quiz/events', editEvent);
    setShowEventModal(false);
    setEditEvent(null);
    fetchAll();
  };
  const deleteEvent = async (id: string) => {
    if (!confirm('Xóa sự kiện quiz này?')) return;
    await adminApi.delete(`/admin/quiz/events/${id}`);
    fetchAll();
  };

  // ────────── TAB: TOPICS ──────────
  const saveTopic = async () => {
    if (!editTopic?.name) { alert('Nhập tên chủ đề'); return; }
    if (editTopic._id) await adminApi.put(`/admin/quiz/topics/${editTopic._id}`, editTopic);
    else await adminApi.post('/admin/quiz/topics', editTopic);
    setShowTopicModal(false);
    setEditTopic(null);
    fetchAll();
  };

  // ────────── TAB: QUESTIONS ──────────
  const saveQuestion = async () => {
    const q = editQuestion;
    if (!q?.topic || !q.question || !q.options || q.options.length !== 4 || q.correctIndex === undefined) {
      alert('Nhập đủ chủ đề, câu hỏi, 4 đáp án và đáp án đúng');
      return;
    }
    if (q._id) await adminApi.put(`/admin/quiz/questions/${q._id}`, q);
    else await adminApi.post('/admin/quiz/questions', q);
    setShowQuestionModal(false);
    setEditQuestion(null);
    fetchAll();
  };
  const deleteQuestion = async (id: string) => {
    if (!confirm('Xóa câu hỏi?')) return;
    await adminApi.delete(`/admin/quiz/questions/${id}`);
    fetchAll();
  };

  const loadStats = async (eventId: string) => {
    const res = await adminApi.get<any>(`/admin/quiz/events/${eventId}/stats`);
    setStats(res.data);
    setStatsEventId(eventId);
  };

  const filteredQuestions = filterTopicId ? questions.filter(q => q.topic._id === filterTopicId) : questions;

  // ────────── RENDER ──────────
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🧠 Quiz Management</h1>
        {tab === 'events' && (
          <button className="btn btn--primary" onClick={() => {
            setEditEvent({ status: 'upcoming', colorBg: '#2563EB', colorIcon: '#FFFFFF', iconName: 'quiz', rewardPerCorrect: 50, maxAttemptsPerUser: 3, attemptCooldownHours: 6, questionsPerAttempt: 5 });
            setShowEventModal(true);
          }}>+ Tạo Sự Kiện</button>
        )}
        {tab === 'topics' && (
          <button className="btn btn--primary" onClick={() => {
            setEditTopic({ colorAccent: '#2563EB', iconName: 'quiz', isActive: true });
            setShowTopicModal(true);
          }}>+ Thêm Chủ Đề</button>
        )}
        {tab === 'questions' && (
          <button className="btn btn--primary" onClick={() => {
            setEditQuestion({ options: ['', '', '', ''], correctIndex: 0, difficulty: 'medium' });
            setShowQuestionModal(true);
          }}>+ Thêm Câu Hỏi</button>
        )}
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
        {(['events','topics','questions','stats'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none',
              fontWeight: tab === t ? 'bold' : 'normal',
              borderBottom: tab === t ? '3px solid #2563EB' : '3px solid transparent',
              color: tab === t ? '#2563EB' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
            }}
          >
            {{ events: '📅 Sự Kiện', topics: '📚 Chủ Đề', questions: '❓ Câu Hỏi', stats: '📊 Thống Kê' }[t]}
          </button>
        ))}
      </div>

      {/* ─── Tab: Events ─── */}
      {tab === 'events' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tên sự kiện</th><th>Thời gian</th><th>Trạng thái</th>
                <th>Xu/câu</th><th>Lượt/event</th><th>Màu</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
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
                      <button className="btn btn--secondary btn--sm" onClick={() => { setEditEvent(ev); setShowEventModal(true); }}>✏️ Sửa</button>
                      <button className="btn btn--secondary btn--sm" onClick={() => { setTab('stats'); loadStats(ev._id); }}>📊</button>
                      <button className="btn btn--danger btn--sm" onClick={() => deleteEvent(ev._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab: Topics ─── */}
      {tab === 'topics' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Chủ đề</th><th>Màu</th><th>Icon</th><th>Số câu</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {topics.map(t => (
                <tr key={t._id}>
                  <td><strong>{t.name}</strong><br/><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{t.description}</span></td>
                  <td><div style={{ width:24, height:24, borderRadius:6, backgroundColor:t.colorAccent }} /></td>
                  <td>{t.iconName}</td>
                  <td>{t.questionCount ?? 0} câu</td>
                  <td><span className={`badge badge--${t.isActive?'success':'danger'}`}>{t.isActive?'Bật':'Tắt'}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn--secondary btn--sm" onClick={() => { setEditTopic(t); setShowTopicModal(true); }}>✏️ Sửa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab: Questions ─── */}
      {tab === 'questions' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <select value={filterTopicId} onChange={e => setFilterTopicId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}>
              <option value="">Tất cả chủ đề</option>
              {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <span style={{ marginLeft: 12, color: 'var(--text-secondary)', fontSize: 13 }}>{filteredQuestions.length} câu hỏi</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Câu hỏi</th><th>Chủ đề</th><th>Đáp án đúng</th><th>Độ khó</th><th>Thao tác</th></tr></thead>
              <tbody>
                {filteredQuestions.map((q, i) => (
                  <tr key={q._id}>
                    <td>{i + 1}</td>
                    <td style={{ maxWidth: 300 }}>{q.question}</td>
                    <td><span style={{ background: q.topic.colorAccent, color:'#FFF', padding:'2px 8px', borderRadius:10, fontSize:11 }}>{q.topic.name}</span></td>
                    <td style={{ color:'#22C55E', fontWeight:'bold' }}>{['A','B','C','D'][q.correctIndex]}. {q.options[q.correctIndex]}</td>
                    <td><span className={`badge badge--${{ easy:'success', medium:'info', hard:'danger' }[q.difficulty]}`}>{q.difficulty}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn--secondary btn--sm" onClick={() => { setEditQuestion({ ...q, topic: q.topic._id as any }); setShowQuestionModal(true); }}>✏️</button>
                        <button className="btn btn--danger btn--sm" onClick={() => deleteQuestion(q._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── Tab: Stats ─── */}
      {tab === 'stats' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <select value={statsEventId} onChange={e => loadStats(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:14, minWidth:240 }}>
              <option value="">Chọn sự kiện</option>
              {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </div>
          {stats && (
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {[
                { label:'Tổng người chơi', value: stats.totalPlayers, icon:'👥' },
                { label:'Tổng lượt', value: stats.totalAttempts, icon:'🎮' },
                { label:'Trung bình đúng', value: stats.avgCorrect, icon:'✅' },
                { label:'Xu đã phát', value: stats.totalCoinsDistributed + ' 🪙', icon:'💰' },
              ].map(s => (
                <div key={s.label} className="card" style={{ minWidth: 160 }}>
                  <div style={{ fontSize:28 }}>{s.icon}</div>
                  <div style={{ fontSize:28, fontWeight:'bold', marginTop:4 }}>{s.value}</div>
                  <div style={{ color:'var(--text-secondary)', fontSize:13 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal: Event ─── */}
      {showEventModal && editEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal__header">
              <h2>{editEvent._id ? 'Sửa Sự Kiện Quiz' : 'Tạo Sự Kiện Quiz'}</h2>
              <button className="modal__close" onClick={() => setShowEventModal(false)}>✕</button>
            </div>
            <div className="modal__body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Tên sự kiện *', key:'title', type:'text' },
                { label:'Mô tả', key:'description', type:'text' },
                { label:'Thời gian bắt đầu *', key:'startTime', type:'datetime-local' },
                { label:'Thời gian kết thúc *', key:'endTime', type:'datetime-local' },
                { label:'Xu / câu đúng', key:'rewardPerCorrect', type:'number' },
                { label:'Số lượt / user', key:'maxAttemptsPerUser', type:'number' },
                { label:'Giờ hồi lượt', key:'attemptCooldownHours', type:'number' },
                { label:'Số câu / lượt', key:'questionsPerAttempt', type:'number' },
                { label:'Màu nền (hex)', key:'colorBg', type:'color' },
                { label:'Màu icon (hex)', key:'colorIcon', type:'color' },
                { label:'MaterialIcon name', key:'iconName', type:'text' },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:13, fontWeight:'bold' }}>{label}</label>
                  <input type={type} value={(editEvent as any)[key] ?? ''}
                    onChange={e => setEditEvent(prev => ({ ...prev!, [key]: type==='number'?Number(e.target.value):e.target.value }))}
                    style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:14 }}
                  />
                </div>
              ))}
              {/* Color preview */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background: editEvent.colorBg || '#2563EB' }}>
                <span style={{ fontSize:13, color: editEvent.colorIcon || '#FFF', fontWeight:'bold' }}>Preview màu: {editEvent.title || 'Sự kiện Quiz'}</span>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowEventModal(false)}>Hủy</button>
              <button className="btn btn--primary" onClick={saveEvent}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Topic ─── */}
      {showTopicModal && editTopic && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal__header">
              <h2>{editTopic._id ? 'Sửa Chủ Đề' : 'Thêm Chủ Đề'}</h2>
              <button className="modal__close" onClick={() => setShowTopicModal(false)}>✕</button>
            </div>
            <div className="modal__body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Tên chủ đề *', key:'name', type:'text' },
                { label:'Mô tả', key:'description', type:'text' },
                { label:'Màu accent (hex)', key:'colorAccent', type:'color' },
                { label:'MaterialIcon name', key:'iconName', type:'text' },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:13, fontWeight:'bold' }}>{label}</label>
                  <input type={type} value={(editTopic as any)[key] ?? ''}
                    onChange={e => setEditTopic(prev => ({ ...prev!, [key]: e.target.value }))}
                    style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:14 }}
                  />
                </div>
              ))}
              <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}>
                <input type="checkbox" checked={editTopic.isActive ?? true}
                  onChange={e => setEditTopic(prev => ({ ...prev!, isActive: e.target.checked }))} />
                <span style={{ fontSize:14 }}>Bật chủ đề</span>
              </label>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowTopicModal(false)}>Hủy</button>
              <button className="btn btn--primary" onClick={saveTopic}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Question ─── */}
      {showQuestionModal && editQuestion && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal__header">
              <h2>{editQuestion._id ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi'}</h2>
              <button className="modal__close" onClick={() => setShowQuestionModal(false)}>✕</button>
            </div>
            <div className="modal__body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:13, fontWeight:'bold' }}>Chủ đề *</label>
                <select value={(editQuestion.topic as any) ?? ''} onChange={e => setEditQuestion(p => ({ ...p!, topic: e.target.value as any }))}
                  style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:14 }}>
                  <option value="">Chọn chủ đề</option>
                  {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:13, fontWeight:'bold' }}>Câu hỏi *</label>
                <textarea value={editQuestion.question ?? ''} rows={3}
                  onChange={e => setEditQuestion(p => ({ ...p!, question: e.target.value }))}
                  style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:14, resize:'vertical' }} />
              </div>
              {['A','B','C','D'].map((label, idx) => (
                <div key={idx} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <label style={{ fontSize:13, fontWeight:'bold', width:24 }}>{label}</label>
                  <input value={editQuestion.options?.[idx] ?? ''} style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:14 }}
                    onChange={e => {
                      const opts = [...(editQuestion.options || ['','','',''])];
                      opts[idx] = e.target.value;
                      setEditQuestion(p => ({ ...p!, options: opts }));
                    }} />
                  <input type="radio" checked={editQuestion.correctIndex === idx}
                    onChange={() => setEditQuestion(p => ({ ...p!, correctIndex: idx }))}
                    title="Đáp án đúng" />
                </div>
              ))}
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>☝️ Chọn radio để đánh dấu đáp án đúng</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:13, fontWeight:'bold' }}>Độ khó</label>
                <select value={editQuestion.difficulty ?? 'medium'} onChange={e => setEditQuestion(p => ({ ...p!, difficulty: e.target.value as any }))}
                  style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:14 }}>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowQuestionModal(false)}>Hủy</button>
              <button className="btn btn--primary" onClick={saveQuestion}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
