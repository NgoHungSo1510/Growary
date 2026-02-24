import { useEffect, useRef, useState, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { adminApi } from '../services/api';
import type { DashboardStats, ActivityData } from '../types';

Chart.register(...registerables);

export default function Dashboard() {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [pendingVouchers, setPendingVouchers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminApi.getStats();
            setStats(data.stats);
            setActivity(data.activity);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPending = useCallback(async () => {
        try {
            const [taskData, voucherData] = await Promise.all([
                adminApi.getPendingTasks(),
                adminApi.getAllVouchers('pending_use'),
            ]);
            setPendingTasks(taskData.tasks.slice(0, 5));
            setPendingVouchers(voucherData.vouchers.length);
        } catch {
            // Non-critical
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchPending();
    }, [fetchData, fetchPending]);

    useEffect(() => {
        if (!chartRef.current || !activity) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'line',
            data: {
                labels: activity.labels,
                datasets: [
                    {
                        label: 'Tasks hoàn thành',
                        data: activity.tasksCompleted,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#f59e0b',
                        borderWidth: 2.5,
                    },
                    {
                        label: 'XP cấp ra',
                        data: activity.xpGranted,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981',
                        borderWidth: 2.5,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', weight: 600 } } },
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } },
                    y: { position: 'left', grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter' } } },
                    y1: { position: 'right', grid: { display: false }, ticks: { font: { family: 'Inter' } } },
                },
            },
        });

        return () => { chartInstanceRef.current?.destroy(); };
    }, [activity]);

    if (loading) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state__icon">⏳</div>
                    <div className="empty-state__text">Đang tải dữ liệu...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Dashboard</h1>
                <p className="page__subtitle">Tổng quan hoạt động hệ thống Growary</p>
            </div>

            {error && (
                <div style={{ padding: '10px 16px', background: 'var(--danger-light)', color: '#991b1b', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    ❌ {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--blue">👤</div>
                    <div className="stat-card__info">
                        <div className="stat-card__label">User mới hôm nay</div>
                        <div className="stat-card__value">{stats?.newUsersToday ?? 0}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--amber">⭐</div>
                    <div className="stat-card__info">
                        <div className="stat-card__label">Tổng XP đã cấp</div>
                        <div className="stat-card__value">{(stats?.totalXPGranted ?? 0).toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--red">🎫</div>
                    <div className="stat-card__info">
                        <div className="stat-card__label">Voucher chờ duyệt</div>
                        <div className="stat-card__value">{stats?.pendingVouchers ?? 0}</div>
                        {(stats?.pendingVouchers ?? 0) > 0 && <div className="stat-card__change stat-card__change--down">Cần xử lý</div>}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--green">📋</div>
                    <div className="stat-card__info">
                        <div className="stat-card__label">Tasks chờ duyệt</div>
                        <div className="stat-card__value">{stats?.pendingTasks ?? 0}</div>
                        {(stats?.pendingTasks ?? 0) > 0 && <div className="stat-card__change stat-card__change--down">Cần xử lý</div>}
                    </div>
                </div>
            </div>

            <div className="grid-3">
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">📈 Hoạt động 7 ngày qua</span>
                    </div>
                    <div className="card__body" style={{ height: 300 }}>
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <span className="card__title">🔔 Cần xử lý</span>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        <table>
                            <thead>
                                <tr><th>Loại</th><th>Số lượng</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            ⚔️ Tasks cần duyệt
                                        </span>
                                    </td>
                                    <td><span className="badge badge--warning">{stats?.pendingTasks ?? 0}</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            🎫 Voucher chờ xử lý
                                        </span>
                                    </td>
                                    <td><span className="badge badge--danger">{pendingVouchers}</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            👥 Tổng người chơi
                                        </span>
                                    </td>
                                    <td><span className="badge badge--info">{stats?.totalUsers ?? 0}</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            🟢 Đang hoạt động
                                        </span>
                                    </td>
                                    <td><span className="badge badge--success">{stats?.activeUsers ?? 0}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
                <div className="card__header">
                    <span className="card__title">⏳ Tasks chờ duyệt gần đây</span>
                </div>
                <div className="card__body" style={{ padding: 0 }}>
                    {pendingTasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">✅</div>
                            <div className="empty-state__text">Không có task chờ duyệt!</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Nhiệm vụ</th>
                                    <th>Điểm yêu cầu</th>
                                    <th>AI gợi ý</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingTasks.map((task: any, i: number) => (
                                    <tr key={task.taskId || i}>
                                        <td style={{ fontWeight: 600 }}>{task.userName}</td>
                                        <td>{task.title}</td>
                                        <td style={{ fontWeight: 700 }}>{task.pointsReward} XP</td>
                                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{task.aiSuggestedPoints ? `${task.aiSuggestedPoints} XP` : '—'}</td>
                                        <td><span className="badge badge--warning">Chờ duyệt</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
