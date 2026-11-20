import { Reward, Voucher, VipStatus, InventoryItem, User } from '../types';
import { CouponItem } from '../components/shop/CouponsSelectModal';
import {
    setCachedSnapshot,
    SNAPSHOT_KEYS,
} from '../services/offlineSnapshotStore';
import { enqueueOfflineAction } from '../services/offlineSyncService';

export interface ExecuteOfflineShopPurchaseParams {
    reward: Reward;
    selectedCoupons: CouponItem[];
    activeEventDiscountPct?: number;
    currentUser: User;
    currentInventory: InventoryItem[];
    currentVouchers: Voucher[];
    currentVipStatus: VipStatus | null;
}

export interface OfflineShopPurchaseResult {
    updatedUser: User;
    updatedInventory: InventoryItem[];
    updatedVouchers: Voucher[];
    updatedVipStatus: VipStatus | null;
    createdVoucher: Voucher;
}

/**
 * Executes optimistic shop item redemption offline (A4 / RV-13):
 * Deducts coins and discount coupons, registers gross VIP spending,
 * creates a pending voucher, updates local snapshots, and queues sync action.
 */
export async function executeOfflineShopPurchase(
    params: ExecuteOfflineShopPurchaseParams
): Promise<OfflineShopPurchaseResult> {
    const {
        reward,
        selectedCoupons,
        activeEventDiscountPct = 0,
        currentUser,
        currentInventory,
        currentVouchers,
        currentVipStatus,
    } = params;

    let baseCost = reward.pointCost;
    if (activeEventDiscountPct > 0) {
        baseCost = Math.floor(baseCost * (1 - activeEventDiscountPct / 100));
    }

    const shippingFee = reward.shippingFee ?? 15000;
    let discountVal = 0;
    let freeshipVal = 0;

    for (const c of selectedCoupons) {
        if (c.type === 'freeship') {
            freeshipVal = shippingFee;
        } else if (c.discount) {
            discountVal += c.discount;
        }
    }

    const grossSpending = baseCost + shippingFee;
    const finalPrice = Math.max(
        0,
        baseCost + Math.max(0, shippingFee - freeshipVal) - discountVal
    );

    if ((currentUser.coins || 0) < finalPrice) {
        throw new Error('Bạn không đủ xu để đổi phần thưởng này');
    }

    // Deduct selected coupons from inventory (only rewardForm === 'full')
    const updatedInventory = [...currentInventory];
    for (const c of selectedCoupons) {
        const itemIdx = updatedInventory.findIndex(
            (item) =>
                item.itemType === 'special_item' &&
                item.rewardForm === 'full' &&
                item.specialItem?.type === c.type &&
                item.quantity > 0
        );
        if (itemIdx !== -1) {
            const currentItem = updatedInventory[itemIdx];
            if (currentItem.quantity > 1) {
                updatedInventory[itemIdx] = {
                    ...currentItem,
                    quantity: currentItem.quantity - 1,
                };
            } else {
                updatedInventory.splice(itemIdx, 1);
            }
        }
    }

    const updatedUser: User = {
        ...currentUser,
        coins: Math.max(0, (currentUser.coins || 0) - finalPrice),
    };

    let updatedVipStatus: VipStatus | null = null;
    if (currentVipStatus) {
        updatedVipStatus = {
            ...currentVipStatus,
            totalCoinsSpent: (currentVipStatus.totalCoinsSpent || 0) + grossSpending,
            monthlySpending: (currentVipStatus.monthlySpending || 0) + grossSpending,
        };
    }

    const createdVoucher: Voucher = {
        _id: `offline_v_${Date.now()}`,
        code: `OFFLINE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        reward: reward as unknown as Voucher['reward'],
        user: currentUser as unknown as Voucher['user'],
        status: 'active',
        isOfflinePending: true,
        rewardTitleSnapshot: reward.title,
        pointCostSnapshot: finalPrice,
        purchaseDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };

    const updatedVouchers = [createdVoucher, ...currentVouchers];

    await setCachedSnapshot(SNAPSHOT_KEYS.USER_PROFILE, updatedUser);
    await setCachedSnapshot(SNAPSHOT_KEYS.INVENTORY, {
        inventory: updatedInventory,
        vouchers: updatedVouchers,
        vipStatus: updatedVipStatus,
    });

    await enqueueOfflineAction({
        type: 'PURCHASE_REWARD',
        payload: {
            rewardId: reward._id,
            couponTypes: selectedCoupons.map((c) => c.type),
            cost: finalPrice,
            expectedPrice: reward.pointCost,
            grossSpending,
        },
    });

    return {
        updatedUser,
        updatedInventory,
        updatedVouchers,
        updatedVipStatus,
        createdVoucher,
    };
}

/**
 * Extracts and classifies applicable coupons from user inventory.
 */
export function extractAvailableCoupons(
    inventory: InventoryItem[],
    shippingFee: number
): {
    discounts: CouponItem[];
    freeships: CouponItem[];
    bestDiscount: CouponItem | null;
    bestFreeship: CouponItem | null;
} {
    let bestDiscount: CouponItem | null = null;
    let maxDiscountVal = -1;
    let bestFreeship: CouponItem | null = null;
    let maxFreeshipVal = -1;

    const discounts: CouponItem[] = [];
    const freeships: CouponItem[] = [];

    inventory.forEach((item) => {
        if (
            item.quantity > 0 &&
            item.itemType === 'special_item' &&
            item.rewardForm === 'full' &&
            item.specialItem?.type
        ) {
            const spType = item.specialItem.type as string;
            if (spType === 'coupon_freeship' || spType === 'freeship') {
                const c = { type: spType, discount: shippingFee, label: 'Free Ship' };
                freeships.push(c);
                if (shippingFee > maxFreeshipVal) {
                    maxFreeshipVal = shippingFee;
                    bestFreeship = c;
                }
            } else if (spType.includes('ship_')) {
                const match = spType.match(/(?:coupon_)?ship_(\d+)k$/);
                if (match) {
                    const discount = parseInt(match[1], 10) * 1000;
                    const c = { type: spType, discount, label: `Giảm ship ${match[1]}k` };
                    freeships.push(c);
                    if (discount > maxFreeshipVal) {
                        maxFreeshipVal = discount;
                        bestFreeship = c;
                    }
                }
            } else if (spType.includes('discount_')) {
                const match = spType.match(/(?:coupon_)?discount_(\d+)k$/);
                if (match) {
                    const discount = parseInt(match[1], 10) * 1000;
                    const c = { type: spType, discount, label: `Giảm ${match[1]}k` };
                    discounts.push(c);
                    if (discount > maxDiscountVal) {
                        maxDiscountVal = discount;
                        bestDiscount = c;
                    }
                }
            }
        }
    });

    return { discounts, freeships, bestDiscount, bestFreeship };
}

