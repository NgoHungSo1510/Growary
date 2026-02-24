import { useState } from 'react';
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
import Login from './pages/Login';
import { adminApi } from './services/api';
import './App.css';

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(adminApi.isLoggedIn());

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
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}
