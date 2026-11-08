import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from '../utils/storage';
import { apiService } from '../services/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<User | void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            if (token) {
                // 1. Instant load cached user from hardware device storage
                const cached = await AsyncStorage.getItem('cachedUserProfile');
                if (cached) {
                    try {
                        setUser(JSON.parse(cached));
                    } catch {
                        // ignore JSON parse error
                    }
                }

                // 2. Fetch fresh profile from server in background
                try {
                    const { user: remoteUser } = await apiService.getProfile();
                    setUser(remoteUser);
                    await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(remoteUser));
                } catch (error: any) {
                    if (error.response?.status === 401) {
                        // Truly invalid or expired token
                        console.log('Token expired or rejected (401), clearing session');
                        await SecureStore.deleteItemAsync('authToken');
                        await AsyncStorage.removeItem('cachedUserProfile');
                        setUser(null);
                    } else {
                        // Network error, server asleep (5xx) or timeout: keep session with cached user!
                        console.log('Network/server unreachable, keeping offline session with cached hardware profile');
                    }
                }
            }
        } catch (error) {
            console.log('Auth check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const { user: loggedInUser } = await apiService.login(email, password);
        setUser(loggedInUser);
        await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(loggedInUser));
    };

    const register = async (username: string, email: string, password: string) => {
        const { user: registeredUser } = await apiService.register(username, email, password);
        setUser(registeredUser);
        await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(registeredUser));
    };

    const logout = async () => {
        await apiService.logout();
        await AsyncStorage.removeItem('cachedUserProfile');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const { user: updatedUser } = await apiService.getProfile();
            setUser(updatedUser);
            await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
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
