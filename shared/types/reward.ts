// Shared Reward & Shop Types

export type VoucherStatus = 'active' | 'pending_use' | 'used' | 'expired';

export interface Reward {
    _id: string;
    title: string;
    description?: string;
    pointCost: number;
    imageUrl?: string;
    stock?: number;
    shippingFee?: number;
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
    createdAt?: string;
    expiresAt?: string;
    status: VoucherStatus;
    usedAt?: string;
    discountAmount?: number;
    hasFreeShip?: boolean;
    fragmentType?: string;
    userId?: string;
    userName?: string;
}

export interface MysteryBoxReward {
    type: 'coins' | 'gacha_ticket' | 'fragment' | 'special_item';
    itemType?: string;
    amount: number;
    displayName: string;
}

export interface InventoryItem {
    itemType: string;
    quantity: number;
    displayName: string;
    color: string;
    canExchange: boolean;
    lastUpdated: string | Date;
    rewardForm?: string;
    specialItem?: {
        _id?: string;
        type?: string;
        name?: string;
        imageUrl?: string;
        requiredFragments?: number;
        [key: string]: any;
    };
}
