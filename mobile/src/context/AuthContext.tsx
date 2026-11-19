import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from '../utils/storage';
import { apiService } from '../services/api';
import { User } from '../types';

export const CLIENT_IDLE_LIMIT_MS = 48 * 60 * 60 * 1000;
const LAST_ACTIVE_KEY = 'lastActiveAt';
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';
const SESSION_EXPIRED_REASON_KEY = 'sessionExpiredReason';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    rememberedEmail: string;
    sessionExpiredNotice: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<User | void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rememberedEmail, setRememberedEmail] = useState('');
    const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                void handleForegroundActivity();
            }
        });
        return () => subscription.remove();
    }, []);

    const syncSessionInBackground = async () => {
        try {
            const { user: remoteUser } = await apiService.sessionHeartbeat();
            if (remoteUser) {
                setUser(remoteUser);
                await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(remoteUser));
                if (remoteUser.email) {
                    setRememberedEmail(remoteUser.email);
                    await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, remoteUser.email);
                }
            }
        } catch (error: unknown) {
            const err = error as { response?: { status?: number; data?: { code?: string } } };
            if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_INVALID') {
                await SecureStore.deleteItemAsync('authToken');
                await AsyncStorage.removeItem('cachedUserProfile');
                setUser(null);
            }
        }
    };

    const handleForegroundActivity = async () => {
        const token = await SecureStore.getItemAsync('authToken');
        if (!token) return;

        const lastActiveRaw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        if (lastActiveRaw && Date.now() - Number(lastActiveRaw) > CLIENT_IDLE_LIMIT_MS) {
            await SecureStore.deleteItemAsync('authToken');
            await AsyncStorage.removeItem('cachedUserProfile');
            await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
            await AsyncStorage.setItem(SESSION_EXPIRED_REASON_KEY, 'idle_48h');
            setSessionExpiredNotice('Phiên đã tạm khóa sau 48 giờ không mở ứng dụng. Vui lòng nhập mật khẩu để tiếp tục.');
            setUser(null);
            return;
        }

        await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
        void syncSessionInBackground();
    };

    const checkAuth = async () => {
        try {
            const [savedEmail, expiredReason, token, lastActiveRaw, cached] = await Promise.all([
                AsyncStorage.getItem(REMEMBERED_EMAIL_KEY),
                AsyncStorage.getItem(SESSION_EXPIRED_REASON_KEY),
                SecureStore.getItemAsync('authToken'),
                AsyncStorage.getItem(LAST_ACTIVE_KEY),
                AsyncStorage.getItem('cachedUserProfile'),
            ]);

            if (savedEmail) setRememberedEmail(savedEmail);
            if (expiredReason === 'idle_48h') {
                setSessionExpiredNotice('Phiên đã tạm khóa sau 48 giờ không mở ứng dụng. Vui lòng nhập mật khẩu để tiếp tục.');
            }

            if (!token) {
                setIsLoading(false);
                return;
            }

            if (lastActiveRaw && Date.now() - Number(lastActiveRaw) > CLIENT_IDLE_LIMIT_MS) {
                await SecureStore.deleteItemAsync('authToken');
                await AsyncStorage.removeItem('cachedUserProfile');
                await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
                await AsyncStorage.setItem(SESSION_EXPIRED_REASON_KEY, 'idle_48h');
                setSessionExpiredNotice('Phiên đã tạm khóa sau 48 giờ không mở ứng dụng. Vui lòng nhập mật khẩu để tiếp tục.');
                setUser(null);
                setIsLoading(false);
                return;
            }

            if (cached) {
                try {
                    const parsedUser = JSON.parse(cached) as User;
                    setUser(parsedUser);
                    if (parsedUser.email && !savedEmail) {
                        setRememberedEmail(parsedUser.email);
                    }
                } catch {
                    // ignore invalid JSON
                }
            }

            await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
            setIsLoading(false);
            void syncSessionInBackground();
        } catch {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { user: loggedInUser } = await apiService.login(normalizedEmail, password);
        setUser(loggedInUser);
        setRememberedEmail(loggedInUser.email || normalizedEmail);
        setSessionExpiredNotice(null);
        await Promise.all([
            AsyncStorage.setItem('cachedUserProfile', JSON.stringify(loggedInUser)),
            AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, loggedInUser.email || normalizedEmail),
            AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())),
            AsyncStorage.removeItem(SESSION_EXPIRED_REASON_KEY),
        ]);
    };

    const register = async (username: string, email: string, password: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { user: registeredUser } = await apiService.register(username, normalizedEmail, password);
        setUser(registeredUser);
        setRememberedEmail(registeredUser.email || normalizedEmail);
        setSessionExpiredNotice(null);
        await Promise.all([
            AsyncStorage.setItem('cachedUserProfile', JSON.stringify(registeredUser)),
            AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, registeredUser.email || normalizedEmail),
            AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())),
            AsyncStorage.removeItem(SESSION_EXPIRED_REASON_KEY),
        ]);
    };

    const logout = async () => {
        await apiService.logout();
        await Promise.all([
            AsyncStorage.removeItem('cachedUserProfile'),
            AsyncStorage.removeItem(LAST_ACTIVE_KEY),
        ]);
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const { user: updatedUser } = await apiService.getProfile();
            setUser(updatedUser);
            await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(updatedUser));
            return updatedUser;
        } catch {
            // Keep cached profile when server is waking up or offline
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                rememberedEmail,
                sessionExpiredNotice,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
