import { ShopEvent } from '../types';

/**
 * Checks whether a specific reward is eligible for an active Flash Sale event.
 * Matches backend logic: if targetRewards is empty, all rewards qualify;
 * otherwise only IDs included in targetRewards qualify.
 *
 * @param rewardId - ID of the reward item
 * @param activeEvent - Currently active shop event, or null/undefined
 * @returns True if Flash Sale discount applies to this reward
 */
export function isRewardInFlashSale(
    rewardId: string,
    activeEvent?: ShopEvent | null
): boolean {
    if (!activeEvent || activeEvent.type !== 'flash_sale' || !activeEvent.isActive) {
        return false;
    }

    if (activeEvent.targetRewards && activeEvent.targetRewards.length > 0) {
        return activeEvent.targetRewards.some(
            (id) => id.toString() === rewardId.toString()
        );
    }

    return true;
}

/**
 * Calculates the effective point price of a reward after applying an active Flash Sale.
 * Uses Math.ceil and a minimum floor of 1 coin (0 when original price <= 0) to stay
 * 100% consistent with backend shopEventService.calculateDiscountedPrice.
 *
 * @param pointCost - Original reward point cost
 * @param rewardId - ID of the reward item
 * @param activeEvent - Currently active shop event, or null/undefined
 * @returns Discounted base price in coins
 */
export function getEffectiveRewardPrice(
    pointCost: number,
    rewardId: string,
    activeEvent?: ShopEvent | null
): number {
    if (pointCost <= 0) return 0;
    if (!activeEvent || !isRewardInFlashSale(rewardId, activeEvent)) {
        return pointCost;
    }

    const discount = Math.min(100, Math.max(0, activeEvent.discountPercent || 0));
    if (discount <= 0) return pointCost;

    const salePrice = Math.ceil(pointCost * (1 - discount / 100));
    return Math.max(1, salePrice);
}

