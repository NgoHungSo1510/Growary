// Shared Event & Analytics Types

export interface GrowaryEvent {
    _id: string;
    title: string;
    description: string;
    bannerUrl?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    specialTasks?: { title: string; pointsReward: number }[];
}

export interface DashboardStats {
    totalUsers: number;
    newUsersToday: number;
    totalXPGranted: number;
    pendingVouchers: number;
    pendingTasks: number;
    activeUsers: number;
    activeUsersToday: number;
    tasksCompletedToday: number;
}

export interface ActivityData {
    labels: string[];
    tasksCompleted: number[];
    xpGranted: number[];
}

export interface ApiError {
    error: string;
    message?: string;
}
