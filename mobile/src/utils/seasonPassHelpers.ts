import type { PassGrantedRewards, PassReward } from '@shared';

export interface SeasonCountdownResult {
    label: string;
    isUrgent: boolean;
}

export interface RewardVisualMeta {
    icon: string;
    bgColor: string;
    accentColor: string;
}

export interface AvatarFrameStyleMeta {
    borderColor: string;
    label: string;
    badgeIcon: string;
}

/**
 * Format remaining season duration and signal 24h red urgency state.
 */
export function formatSeasonCountdown(
    endDateIso: string,
    now: Date = new Date()
): SeasonCountdownResult {
    const diffMs = new Date(endDateIso).getTime() - now.getTime();
    if (!Number.isFinite(diffMs) || diffMs <= 0) {
        return { label: 'Đã kết thúc mùa', isUrgent: false };
    }
    const isUrgent = diffMs < 24 * 60 * 60 * 1000;
    const days = Math.floor(diffMs / 86_400_000);
    const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    if (days >= 1) {
        return { label: `Còn ${days} ngày ${hours} giờ`, isUrgent };
    }
    return { label: `Còn ${hours}g ${minutes}p`, isUrgent };
}

/**
 * Build a concise Vietnamese summary string from a Season Pass reward grant payload.
 */
export function formatPassRewardSummary(granted: PassGrantedRewards): string {
    const parts: string[] = [];
    if (granted.coins > 0) parts.push(`+${granted.coins} Xu`);
    if (granted.xp > 0) parts.push(`+${granted.xp} EXP`);
    if (granted.gachaTickets > 0) parts.push(`+${granted.gachaTickets} Vé Gacha`);
    if (granted.mysteryBoxes > 0) parts.push(`+${granted.mysteryBoxes} Rương Bí Ẩn`);
    if (granted.passXpAdded > 0) parts.push(`+${granted.passXpAdded} Pass XP`);
    if (granted.vaultCoinsAdded > 0) parts.push(`+${granted.vaultCoinsAdded} Xu Két`);
    if (granted.avatarFrameIds.length > 0) parts.push('Khung Avatar Mùa');
    return parts.join(' • ') || 'Đã nhận phần thưởng';
}

/**
 * Resolve emoji icon and clay palette colors for any Season Pass tier reward.
 */
export function getRewardVisual(reward: PassReward | null): RewardVisualMeta {
    if (!reward) {
        return { icon: '·', bgColor: '#F3EAC0', accentColor: '#9CA3AF' };
    }
    switch (reward.type) {
        case 'coins':
            return { icon: '🪙', bgColor: '#FEF3C7', accentColor: '#D97706' };
        case 'xp':
            return { icon: '⚡', bgColor: '#DBEAFE', accentColor: '#2563EB' };
        case 'gacha_ticket':
            return { icon: '🎟️', bgColor: '#FCE7F3', accentColor: '#DB2777' };
        case 'mystery_box':
            return {
                icon: reward.boxRarity === 'legendary' ? '🌟' : reward.boxRarity === 'epic' ? '💎' : '🎁',
                bgColor: reward.boxRarity === 'legendary' ? '#FEF08A' : '#EDE9FE',
                accentColor: reward.boxRarity === 'legendary' ? '#CA8A04' : '#7C3AED',
            };
        case 'avatar_frame':
            return { icon: '🖼️', bgColor: '#FFEDD5', accentColor: '#EA580C' };
    }
}

/**
 * Map a seasonal `frameId` to its border color and Vietnamese display title.
 */
export function getAvatarFrameStyle(frameId?: string | null): AvatarFrameStyleMeta | null {
    if (!frameId) return null;
    if (frameId.includes('season_1')) {
        return { borderColor: '#F59E0B', label: 'Khung Tinh Anh Mùa 1', badgeIcon: '👑' };
    }
    if (frameId.includes('season_2')) {
        return { borderColor: '#8B5CF6', label: 'Khung Tinh Anh Mùa 2', badgeIcon: '🔮' };
    }
    return { borderColor: '#EC4899', label: `Khung ${frameId}`, badgeIcon: '✨' };
}

