/**
 * @file eventCountdown.ts
 * @description Utility functions for formatting event remaining time and countdown badges.
 * Follows V2.6.4 Specification R10:
 * - When days >= 1: "Còn X ngày Y giờ" (badge: "Còn Xn Yg")
 * - When days === 0: "Còn Y giờ Z phút" (badge: "Yg Zp")
 */

export interface EventRemainingTimeResult {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    fullText: string;
    badgeText: string;
    isExpired: boolean;
}

/**
 * Calculates the end of the current Vietnamese calendar week (Sunday 23:59:59.999 UTC+7).
 *
 * @param now - Reference timestamp, defaults to new Date()
 * @returns Date instance marking Sunday 23:59:59.999 UTC+7
 */
export function getEndOfCurrentWeekVN(now = new Date()): Date {
    const vnOffsetMs = 7 * 60 * 60 * 1000;
    const vnTime = new Date(now.getTime() + vnOffsetMs);

    // In JS, Sunday is 0, Monday is 1, ..., Saturday is 6
    const dayOfWeek = vnTime.getUTCDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;

    const sundayUtc = new Date(vnTime);
    sundayUtc.setUTCDate(sundayUtc.getUTCDate() + daysUntilSunday);
    sundayUtc.setUTCHours(23, 59, 59, 999);

    // Convert back from VN UTC offset to actual global timestamp
    return new Date(sundayUtc.getTime() - vnOffsetMs);
}

/**
 * Formats remaining duration until targetDate into human-readable strings and badges.
 *
 * @param targetDate - Expiration timestamp as Date, ISO string, or number
 * @param now - Current reference time
 * @returns Formatted object containing days, hours, minutes, fullText and badgeText
 */
export function formatEventRemainingTime(
    targetDate: Date | string | number | null | undefined,
    now = new Date()
): EventRemainingTimeResult {
    if (!targetDate) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            fullText: 'Đang diễn ra',
            badgeText: 'Mở',
            isExpired: false,
        };
    }

    const targetMs = typeof targetDate === 'number'
        ? targetDate
        : new Date(targetDate).getTime();
    const diffMs = targetMs - now.getTime();

    if (diffMs <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            fullText: 'Đã kết thúc',
            badgeText: 'Hết hạn',
            isExpired: true,
        };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let fullText: string;
    let badgeText: string;

    if (days >= 1) {
        fullText = `Còn ${days} ngày ${hours} giờ`;
        badgeText = `Còn ${days}n ${hours}g`;
    } else {
        fullText = `Còn ${hours} giờ ${minutes} phút`;
        badgeText = `${hours}g ${minutes}p`;
    }

    return {
        days,
        hours,
        minutes,
        seconds,
        fullText,
        badgeText,
        isExpired: false,
    };
}

