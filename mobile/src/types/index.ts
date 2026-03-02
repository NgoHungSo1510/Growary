// API Types matching backend models

export interface GrantedRewards {
    coins: number;
    gachaTickets: number;
    items: string[];
    levelUps: number[];
    isTierUnlock?: boolean;
    message?: string;
    xp?: number;
    questCoins?: number;
    questXp?: number;
    isLate?: boolean;
    latePercentage?: number;
}

export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role: 'admin' | 'user';
    coins: number;
    xp: number;
    level: number;
    currentPoints: number;
    totalPointsEarned: number;
    currentStreak: number;
    longestStreak: number;
    settings: {
        pushNotifications: boolean;
        timezone: string;
    };
    pendingPenalties?: {
        questId?: string;
        questTitle?: string;
        penaltyAmount: number;
        reason: 'missed' | 'late';
        createdAt: string;
    }[];
}

export interface TaskTemplate {
    _id: string;
    title: string;
    description?: string;
    pointsReward: number;
    coinReward?: number;
    isSystemTask: boolean;
    isMandatory: boolean;
    category: 'health' | 'study' | 'work' | 'personal' | 'household' | 'other';
    estimatedMinutes?: number;
}

export interface DailyTask {
    _id?: string;
    templateId?: string;
    customTitle?: string;
    title: string;
    pointsReward: number;
    coinReward?: number;
    isCustomTask: boolean;
    isMandatory: boolean;
    aiSuggestedPoints?: number;
    adminApprovalStatus: 'pending' | 'approved' | 'rejected';
    scheduledTime?: string;
    durationMinutes?: number;
    isCompleted: boolean;
    completedAt?: string;
    proofImageUrl?: string;
    category?: string;
    penaltyStatus?: 'none' | 'late' | 'missed';
    penaltyAmount?: number;
}

export interface BacklogItem {
    taskTitle: string;
    originalDate: string;
    skipCount: number;
    pointsReward: number;
}

export interface PenaltyConfig {
    _id: string;
    lateThresholds: {
        thresholdMinutes: number;
        deductionPercentage: number;
    }[];
    missedQuestPenaltyCoin: number;
}

export interface DailyPlan {
    _id: string;
    user: string;
    date: string;
    tasks: DailyTask[];
    backlogFromPreviousDay: BacklogItem[];
    isDailyScoreCalculated: boolean;
    totalPointsEarned: number;
}

export interface Journal {
    _id: string;
    date: string;
    manualContent: string;
    autoLogs: {
        taskId?: string;
        taskTitle: string;
        completedAt: string;
    }[];
    autoLoggedTasks?: {
        title: string;
        completedAt?: string;
        pointsEarned?: number;
        category?: string;
    }[];
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired';
    totalTasksCompleted: number;
    totalPointsEarned: number;
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
    code: string;
    pointCostSnapshot: number;
    rewardTitleSnapshot: string;
    purchaseDate: string;
    expiresAt?: string;
    status: 'active' | 'pending_use' | 'used' | 'expired';
    usedAt?: string;
}

// API Response types
export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export interface ApiError {
    error: string;
    message?: string;
}
