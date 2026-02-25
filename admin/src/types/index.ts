export interface User {
    _id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    coins: number;
    xp: number;
    level: number;
    currentPoints: number;
    totalPointsEarned: number;
    currentStreak: number;
    longestStreak: number;
    createdAt: string;
    settings: {
        pushNotifications: boolean;
        timezone: string;
    };
}

export interface TaskTemplate {
    _id: string;
    title: string;
    description?: string;
    pointsReward: number;
    coinReward: number;
    isSystemTask: boolean;
    isMandatory: boolean;
    isActive: boolean;
    category: 'health' | 'study' | 'work' | 'personal' | 'household' | 'other';
    estimatedMinutes?: number;
    frequency: string;
    createdAt: string;
}

export interface DailyTask {
    _id: string;
    templateId?: string;
    customTitle?: string;
    title: string;
    pointsReward: number;
    coinReward: number;
    isCustomTask: boolean;
    aiSuggestedPoints?: number;
    adminApprovalStatus: 'pending' | 'approved' | 'rejected';
    scheduledTime?: string;
    durationMinutes?: number;
    isCompleted: boolean;
    completedAt?: string;
    category?: string;
    userId?: string;
    userName?: string;
}

export interface Reward {
    _id: string;
    title: string;
    description?: string;
    pointCost: number;
    imageUrl?: string;
    stock?: number;
    isActive: boolean;
    isFeatured?: boolean;
}

export interface Voucher {
    _id: string;
    reward: Reward;
    user?: { _id: string; username: string; email: string };
    code: string;
    pointCostSnapshot: number;
    rewardTitleSnapshot: string;
    purchaseDate: string;
    expiresAt?: string;
    status: 'active' | 'pending_use' | 'used' | 'expired';
    usedAt?: string;
    userId?: string;
    userName?: string;
}

export interface GrowaryEvent {
    _id: string;
    title: string;
    description: string;
    bannerUrl?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    specialTasks: { title: string; pointsReward: number }[];
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
