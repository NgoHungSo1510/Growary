import os

file_path = r"d:\Downloads\SE Project\Growary\admin\src\pages\BossManagementPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update interface
content = content.replace(
"""    startTime: string;
    endTime: string;""",
"""    startTime?: string;
    endTime?: string;
    weekActivatedAt?: string;
    timesReturned?: number;"""
)

# 2. Update state and fetch
content = content.replace(
"""    const [events, setEvents] = useState<BossEvent[]>([]);
    const [rewardsList, setRewardsList] = useState<any[]>([]);
    const [collections, setCollections] = useState<BossCollection[]>([]);
    const [editEvent, setEditEvent] = useState<Partial<BossEvent> | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchEvents = async () => {
        try {
            const [eventsRes, rewardsRes, collectionsRes] = await Promise.all([
                adminApi.get<{ events: BossEvent[] }>('/admin/boss'),
                adminApi.getAllRewards(),
                adminApi.get<{ collections: BossCollection[] }>('/admin/boss-collections')
            ]);
            setEvents(eventsRes.events);
            setRewardsList(rewardsRes.rewards);
            setCollections(collectionsRes.collections);
        } catch (error) {
            console.error('Failed to fetch boss data', error);
        }
    };""",
"""    const [events, setEvents] = useState<BossEvent[]>([]);
    const [weeks, setWeeks] = useState<any[]>([]);
    const [poolStatus, setPoolStatus] = useState<any>({});
    const [collections, setCollections] = useState<BossCollection[]>([]);
    const [editEvent, setEditEvent] = useState<Partial<BossEvent> | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'collections' | 'pool'>('timeline');

    const fetchEvents = async () => {
        try {
            const [eventsRes, weeksRes, poolRes, collectionsRes] = await Promise.all([
                adminApi.get<{ events: BossEvent[] }>('/admin/boss'),
                adminApi.get<{ weeks: any[] }>('/admin/boss-weekly-history'),
                adminApi.get<any>('/admin/boss-pool-status'),
                adminApi.get<{ collections: BossCollection[] }>('/admin/boss-collections')
            ]);
            setEvents(eventsRes.events);
            setWeeks(weeksRes.weeks);
            setPoolStatus(poolRes);
            setCollections(collectionsRes.collections);
        } catch (error) {
            console.error('Failed to fetch boss data', error);
        }
    };"""
)

# 3. Update handleSave
content = content.replace(
"""        if (!editEvent?.title || !editEvent?.maxHp || !editEvent?.startTime || !editEvent?.endTime) {
            alert('Vui lòng nhập đủ Tên, HP, và Thời gian');
            return;
        }""",
"""        if (!editEvent?.title || !editEvent?.maxHp) {
            alert('Vui lòng nhập đủ Tên và HP');
            return;
        }"""
)

# 4. Action Row and Timeline
action_row_original = """            <div className="action-row" style={{ marginTop: 0 }}>
                <div></div>
                <button className="btn btn--primary" onClick={() => { setEditEvent({ status: 'upcoming', rewardItems: [], isLimited: false, miniGameQuestions: [] }); setShowCreate(true); }}>
                    + Tạo Sự Kiện Nhân Vật
                </button>
            </div>

            <div className="boss-timeline-wrapper" style={{ overflowX: 'auto', padding: '20px 0 60px 0', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', position: 'relative', minWidth: 'min-content', padding: '0 20px' }}>
                    <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 4, backgroundColor: 'var(--border)', zIndex: 0 }} />

                    {events.map((ev) => {
                        const start = new Date(ev.startTime).toLocaleDateString('vi-VN');
                        const end = new Date(ev.endTime).toLocaleDateString('vi-VN');"""

action_row_new = """            <div className="action-row" style={{ marginTop: 0 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`btn ${activeSubTab === 'timeline' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setActiveSubTab('timeline')}>Timeline Theo Tuần</button>
                    <button className={`btn ${activeSubTab === 'collections' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setActiveSubTab('collections')}>Bộ Nhân Vật</button>
                    <button className={`btn ${activeSubTab === 'pool' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setActiveSubTab('pool')}>Pool Status</button>
                </div>
                <button className="btn btn--primary" onClick={() => { setEditEvent({ status: 'pool', rewardItems: [], isLimited: false, miniGameQuestions: [] }); setShowCreate(true); }}>
                    + Tạo Nhân Vật Mới
                </button>
            </div>

            {activeSubTab === 'timeline' && (
                <div className="boss-timeline-wrapper" style={{ overflowX: 'auto', padding: '20px 0 60px 0', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, minWidth: 'min-content', padding: '0 20px' }}>
                        {weeks.map((week, wIdx) => (
                            <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--accent)' }}>
                                    {week.weekLabel} (Bắt đầu: {new Date(week.weekStart).toLocaleDateString('vi-VN')})
                                </div>
                                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 4, backgroundColor: 'var(--border)', zIndex: 0 }} />

                                    {week.bosses.map((ev: any) => {
                                        const start = ev.weekActivatedAt ? new Date(ev.weekActivatedAt).toLocaleDateString('vi-VN') : '';
                                        const end = '';"""
content = content.replace(action_row_original, action_row_new)

timeline_end_original = """                    })}
                </div>

                {events.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
                        <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', marginBottom: 12 }}>smart_toy</span>
                        <div style={{ color: '#64748b', fontSize: 14 }}>Chưa có sự kiện Nhân vật nào.</div>
                    </div>
                )}
            </div>

            <BossCollectionManagement events={events} />"""

timeline_end_new = """                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {weeks.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
                            <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', marginBottom: 12 }}>smart_toy</span>
                            <div style={{ color: '#64748b', fontSize: 14 }}>Chưa có sự kiện Nhân vật nào.</div>
                        </div>
                    )}
                </div>
            )}

            {activeSubTab === 'collections' && (
                <BossCollectionManagement events={events} />
            )}

            {activeSubTab === 'pool' && (
                <div style={{ padding: 24, background: 'var(--bg)', borderRadius: 8, marginTop: 24 }}>
                    <h3 style={{ marginTop: 0 }}>Pool Status</h3>
                    <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                        <div className="card" style={{ padding: 16, flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{poolStatus.poolCount || 0}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Trong Pool</div>
                        </div>
                        <div className="card" style={{ padding: 16, flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--primary)' }}>{poolStatus.activeCount || 0}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Đang Active</div>
                        </div>
                        <div className="card" style={{ padding: 16, flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--success)' }}>{poolStatus.completedCount || 0}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Đã Tiêu Diệt</div>
                        </div>
                    </div>
                    <button className="btn btn--danger" onClick={async () => {
                        if (window.confirm('Tiến hành xoay vòng boss thủ công? Tính năng này chỉ dùng để test.')) {
                            try {
                                const { adminApi } = await import('../services/api');
                                await adminApi.post('/admin/boss-manual-rotate', {});
                                alert('Đã xoay vòng thành công!');
                                fetchEvents();
                            } catch (error) {
                                alert('Lỗi xoay vòng');
                            }
                        }
                    }}>
                        🔄 Tiến hành Xoay vòng thủ công (Test)
                    </button>
                </div>
            )}"""
content = content.replace(timeline_end_original, timeline_end_new)

# 5. Form edit modifications
form_edit_original = """                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label>TG Bắt đầu</label>
                                            <input
                                                type="datetime-local"
                                                value={editEvent?.startTime ? new Date(editEvent.startTime).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditEvent({ ...editEvent, startTime: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>TG Kết thúc</label>
                                            <input
                                                type="datetime-local"
                                                value={editEvent?.endTime ? new Date(editEvent.endTime).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditEvent({ ...editEvent, endTime: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                    </div>"""
form_edit_new = """                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label>Trạng thái</label>
                                            <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                                                {editEvent?.status === 'active' ? 'Đang mở (Active)' : editEvent?.status === 'completed' ? 'Đã tiêu diệt' : editEvent?.status === 'failed' ? 'Thất bại' : 'Trong Pool'}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Tuần Active</label>
                                            <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                                                {editEvent?.weekActivatedAt ? new Date(editEvent.weekActivatedAt).toLocaleDateString('vi-VN') : 'Chưa bao giờ'}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Số lần trả về Pool</label>
                                            <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                                                {editEvent?.timesReturned || 0}
                                            </div>
                                        </div>
                                    </div>"""
content = content.replace(form_edit_original, form_edit_new)

# badge update
content = content.replace("""                        let statusBadge = <span className="badge badge--info">Sắp tới</span>;""", """                        let statusBadge = <span className="badge badge--info">Trong Pool</span>;""")

# remove `-- {end}` in timeline view since `end` is now empty.
content = content.replace("""{start} — {end}""", """{start}""")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
