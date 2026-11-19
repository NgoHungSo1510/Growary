import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import QuestManagement from './pages/QuestManagement';
import ShopRedemption from './pages/ShopRedemption';
import UserManagement from './pages/UserManagement';
import Events from './pages/Events';
import RewardManagement from './pages/RewardManagement';
import BossManagementPage from './pages/BossManagementPage';
import PenaltyManagement from './pages/PenaltyManagement.tsx';
import NotificationManagement from './pages/NotificationManagement.tsx';
import SpecialWarehouse from './pages/SpecialWarehouse';
import Login from './pages/Login';
import { adminApi } from './services/api';
import { httpClient } from './services/client';
import './App.css';

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => adminApi.isLoggedIn());

    useEffect(() => {
        if (!isLoggedIn) return;

        const handleUserInteraction = () => {
            if (httpClient.isIdleExpired()) {
                adminApi.logout();
                setIsLoggedIn(false);
                return;
            }
            httpClient.markActivity();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleUserInteraction();
            }
        };

        window.addEventListener('click', handleUserInteraction, { passive: true });
        window.addEventListener('keydown', handleUserInteraction, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        void httpClient
            .post<{ token?: string }>('/auth/session/heartbeat', {})
            .then((res) => {
                if (res?.token) {
                    httpClient.setToken(res.token);
                }
            })
            .catch(() => {
                // Keep session when server is waking up
            });

        return () => {
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return <Login onLogin={() => setIsLoggedIn(true)} />;
    }

    return (
        <div className="app-layout">
            <Sidebar onLogout={() => { adminApi.logout(); setIsLoggedIn(false); }} />
            <TopBar />
            <main className="app-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/quests" element={<QuestManagement />} />
                    <Route path="/shop" element={<ShopRedemption />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/boss" element={<BossManagementPage />} />
                    <Route path="/rewards" element={<RewardManagement />} />
                    <Route path="/penalty" element={<PenaltyManagement />} />
                    <Route path="/notifications" element={<NotificationManagement />} />
                    <Route path="/quiz" element={<Navigate to="/events?tab=quiz" replace />} />
                    <Route path="/special-warehouse" element={<SpecialWarehouse />} />
                    <Route path="/season-pass" element={<Navigate to="/events?tab=battlepass" replace />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}
