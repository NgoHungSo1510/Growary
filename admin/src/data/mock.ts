import type { User, TaskTemplate, DailyTask, Reward, Voucher, GrowaryEvent, DashboardStats, ActivityData } from '../types';

export const mockStats: DashboardStats = {
    newUsersToday: 12,
    totalXPGranted: 84500,
    pendingVouchers: 5,
    pendingTasks: 8,
    activeUsers: 47,
    totalUsers: 156,
};

export const mockActivity: ActivityData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    tasksCompleted: [34, 42, 38, 55, 48, 62, 29],
    xpGranted: [680, 840, 760, 1100, 960, 1240, 580],
};

export const mockUsers: User[] = [
    { _id: '1', username: 'minh_tran', email: 'minh@example.com', role: 'user', currentPoints: 1250, totalPointsEarned: 4800, currentStreak: 7, longestStreak: 21, coins: 0, xp: 0, level: 1, createdAt: '2025-12-01', settings: { pushNotifications: true, timezone: 'Asia/Ho_Chi_Minh' } },
    { _id: '2', username: 'lan_nguyen', email: 'lan@example.com', role: 'user', currentPoints: 800, totalPointsEarned: 3200, currentStreak: 3, longestStreak: 14, coins: 0, xp: 0, level: 1, createdAt: '2025-12-15', settings: { pushNotifications: true, timezone: 'Asia/Ho_Chi_Minh' } },
    { _id: '3', username: 'duc_le', email: 'duc@example.com', role: 'user', currentPoints: 2100, totalPointsEarned: 7600, currentStreak: 15, longestStreak: 30, coins: 0, xp: 0, level: 1, createdAt: '2025-11-20', settings: { pushNotifications: false, timezone: 'Asia/Ho_Chi_Minh' } },
    { _id: '4', username: 'hoa_pham', email: 'hoa@example.com', role: 'user', currentPoints: 450, totalPointsEarned: 1800, currentStreak: 1, longestStreak: 8, coins: 0, xp: 0, level: 1, createdAt: '2026-01-05', settings: { pushNotifications: true, timezone: 'Asia/Ho_Chi_Minh' } },
    { _id: '5', username: 'tuan_vo', email: 'tuan@example.com', role: 'user', currentPoints: 3400, totalPointsEarned: 12000, currentStreak: 28, longestStreak: 45, coins: 0, xp: 0, level: 1, createdAt: '2025-10-10', settings: { pushNotifications: true, timezone: 'Asia/Ho_Chi_Minh' } },
    { _id: '6', username: 'mai_do', email: 'mai@example.com', role: 'user', currentPoints: 600, totalPointsEarned: 2400, currentStreak: 5, longestStreak: 12, coins: 0, xp: 0, level: 1, createdAt: '2026-01-20', settings: { pushNotifications: true, timezone: 'Asia/Ho_Chi_Minh' } },
];

export const mockTemplates: TaskTemplate[] = [
    { _id: 't1', title: 'Uống 2L nước', description: 'Uống đủ 2 lít nước mỗi ngày', pointsReward: 20, coinReward: 5, isActive: true, frequency: 'daily', createdAt: '2025-12-01', isSystemTask: true, isMandatory: false, category: 'health', estimatedMinutes: 0 },
    { _id: 't2', title: 'Chạy bộ 30 phút', description: 'Chạy bộ hoặc đi bộ nhanh', pointsReward: 50, coinReward: 10, isActive: true, frequency: 'daily', createdAt: '2025-12-01', isSystemTask: true, isMandatory: false, category: 'health', estimatedMinutes: 30 },
    { _id: 't3', title: 'Đọc sách 20 phút', description: 'Đọc sách bất kỳ', pointsReward: 30, coinReward: 5, isActive: true, frequency: 'daily', createdAt: '2025-12-01', isSystemTask: true, isMandatory: false, category: 'study', estimatedMinutes: 20 },
    { _id: 't4', title: 'Thiền 10 phút', description: 'Thiền hoặc hít thở sâu', pointsReward: 25, coinReward: 5, isActive: true, frequency: 'daily', createdAt: '2025-12-01', isSystemTask: true, isMandatory: false, category: 'health', estimatedMinutes: 10 },
    { _id: 't5', title: 'Dọn phòng', description: 'Dọn dẹp phòng ngủ và bàn học', pointsReward: 35, coinReward: 10, isActive: true, frequency: 'weekly', createdAt: '2025-12-01', isSystemTask: true, isMandatory: false, category: 'household', estimatedMinutes: 15 },
    { _id: 't6', title: 'Học từ vựng Anh', description: 'Học 20 từ vựng tiếng Anh mới', pointsReward: 40, coinReward: 5, isActive: true, frequency: 'daily', createdAt: '2025-12-01', isSystemTask: true, isMandatory: false, category: 'study', estimatedMinutes: 25 },
];

export const mockPendingTasks: DailyTask[] = [
    { _id: 'pt1', title: 'Tập guitar 1 tiếng', pointsReward: 60, coinReward: 10, isCustomTask: true, adminApprovalStatus: 'pending', isCompleted: false, category: 'personal', userId: '1', userName: 'minh_tran', aiSuggestedPoints: 45 },
    { _id: 'pt2', title: 'Nấu cơm cho gia đình', pointsReward: 40, coinReward: 5, isCustomTask: true, adminApprovalStatus: 'pending', isCompleted: false, category: 'household', userId: '2', userName: 'lan_nguyen', aiSuggestedPoints: 35 },
    { _id: 'pt3', title: 'Học lập trình Python', pointsReward: 80, coinReward: 15, isCustomTask: true, adminApprovalStatus: 'pending', isCompleted: false, category: 'study', userId: '3', userName: 'duc_le', aiSuggestedPoints: 50 },
    { _id: 'pt4', title: 'Chơi cờ vua online', pointsReward: 100, coinReward: 20, isCustomTask: true, adminApprovalStatus: 'pending', isCompleted: false, category: 'personal', userId: '4', userName: 'hoa_pham', aiSuggestedPoints: 30 },
    { _id: 'pt5', title: 'Viết nhật ký buổi tối', pointsReward: 25, coinReward: 5, isCustomTask: true, adminApprovalStatus: 'pending', isCompleted: false, category: 'personal', userId: '5', userName: 'tuan_vo', aiSuggestedPoints: 20 },
];

export const mockRewards: Reward[] = [
    { _id: 'r1', title: 'Sticker Gấu Bông', description: 'Bộ sticker dễ thương', pointCost: 200, stock: 50, isActive: true, imageUrl: '' },
    { _id: 'r2', title: 'Voucher Trà Sữa', description: 'Giảm 30k tại Phúc Long', pointCost: 500, stock: 20, isActive: true, imageUrl: '' },
    { _id: 'r3', title: 'Sổ Tay Premium', description: 'Sổ tay bìa cứng in tên', pointCost: 1000, stock: 10, isActive: true, imageUrl: '' },
    { _id: 'r4', title: 'Áo Thun Growary', description: 'Áo thun chính hãng', pointCost: 2000, stock: 5, isActive: true, imageUrl: '' },
    { _id: 'r5', title: 'Tai Nghe Bluetooth', description: 'Tai nghe không dây', pointCost: 5000, stock: 3, isActive: false, imageUrl: '' },
];

export const mockVouchers: Voucher[] = [
    { _id: 'v1', reward: mockRewards[1], code: 'GRW-TEA-001', pointCostSnapshot: 500, rewardTitleSnapshot: 'Voucher Trà Sữa', purchaseDate: '2026-02-10', status: 'pending_use', userId: '1', userName: 'minh_tran' },
    { _id: 'v2', reward: mockRewards[0], code: 'GRW-STCK-002', pointCostSnapshot: 200, rewardTitleSnapshot: 'Sticker Gấu Bông', purchaseDate: '2026-02-12', status: 'pending_use', userId: '3', userName: 'duc_le' },
    { _id: 'v3', reward: mockRewards[2], code: 'GRW-NOTE-003', pointCostSnapshot: 1000, rewardTitleSnapshot: 'Sổ Tay Premium', purchaseDate: '2026-02-13', status: 'pending_use', userId: '5', userName: 'tuan_vo' },
    { _id: 'v4', reward: mockRewards[1], code: 'GRW-TEA-004', pointCostSnapshot: 500, rewardTitleSnapshot: 'Voucher Trà Sữa', purchaseDate: '2026-02-08', status: 'used', usedAt: '2026-02-09', userId: '2', userName: 'lan_nguyen' },
    { _id: 'v5', reward: mockRewards[3], code: 'GRW-SHIRT-005', pointCostSnapshot: 2000, rewardTitleSnapshot: 'Áo Thun Growary', purchaseDate: '2026-02-14', status: 'pending_use', userId: '6', userName: 'mai_do' },
];

export const mockEvents: GrowaryEvent[] = [
    { _id: 'e1', title: 'Robot Celebration 🤖', description: 'Tuần lễ đặc biệt — hoàn thành nhiệm vụ robot để nhận bonus XP!', startDate: '2026-02-15', endDate: '2026-02-22', isActive: true, specialTasks: [{ title: 'Tập thể dục sáng 5:30', pointsReward: 100 }, { title: 'Hoàn tất 5 nhiệm vụ/ngày', pointsReward: 150 }] },
    { _id: 'e2', title: 'Spring Clean Week 🌸', description: 'Dọn dẹp mùa xuân — bonus điểm cho nhiệm vụ nhà cửa', startDate: '2026-03-01', endDate: '2026-03-07', isActive: false, specialTasks: [{ title: 'Dọn tủ quần áo', pointsReward: 80 }, { title: 'Lau nhà toàn bộ', pointsReward: 60 }] },
];
