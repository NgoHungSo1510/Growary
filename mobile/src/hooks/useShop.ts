import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { Reward, Voucher, VipStatus } from '../types';
import { getErrorMessage, showApiError } from '../utils/errorHandler';

export function useShop() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [vipStatus, setVipStatus] = useState<VipStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchShopData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [rewardData, voucherData, vipData] = await Promise.allSettled([
                apiService.getRewards(),
                apiService.getMyVouchers(),
                apiService.getVipStatus(),
            ]);

            if (rewardData.status === 'fulfilled' && rewardData.value?.rewards) {
                setRewards(rewardData.value.rewards);
            }
            if (voucherData.status === 'fulfilled' && voucherData.value?.vouchers) {
                setVouchers(voucherData.value.vouchers);
            }
            if (vipData.status === 'fulfilled' && vipData.value) {
                setVipStatus(vipData.value);
            }
        } catch (err: unknown) {
            const msg = getErrorMessage(err);
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShopData();
    }, [fetchShopData]);

    const purchaseReward = async (rewardId: string, couponTypes?: string[]) => {
        try {
            const res = await apiService.purchaseReward(rewardId, couponTypes);
            await fetchShopData();
            return res;
        } catch (err: unknown) {
            showApiError(err, 'Không thể mua phần thưởng');
            return null;
        }
    };

    const redeemVoucher = async (code: string) => {
        try {
            const res = await apiService.useVoucher(code);
            await fetchShopData();
            return res;
        } catch (err: unknown) {
            showApiError(err, 'Không thể sử dụng voucher');
            return null;
        }
    };

    return {
        rewards,
        vouchers,
        vipStatus,
        loading,
        error,
        refreshShop: fetchShopData,
        purchaseReward,
        redeemVoucher,
    };
}
