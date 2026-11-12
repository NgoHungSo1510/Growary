import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { CouponItem } from './CouponsSelectModal';

export interface RewardPriceBreakdownProps {
    basePrice: number;
    effectivePrice: number;
    flashSalePercent: number;
    shippingFee: number;
    totalRequiredCoins: number;
    useDiscountCoupon: CouponItem | null;
    useFreeshipCoupon: CouponItem | null;
    availableDiscountCoupons: CouponItem[];
    availableFreeshipCoupons: CouponItem[];
    onOpenDiscountModal: () => void;
    onOpenFreeshipModal: () => void;
}

export const RewardPriceBreakdown: React.FC<RewardPriceBreakdownProps> = React.memo(({
    basePrice,
    effectivePrice,
    flashSalePercent,
    shippingFee,
    totalRequiredCoins,
    useDiscountCoupon,
    useFreeshipCoupon,
    availableDiscountCoupons,
    availableFreeshipCoupons,
    onOpenDiscountModal,
    onOpenFreeshipModal,
}) => {
    const appliedProductDiscount = useDiscountCoupon ? useDiscountCoupon.discount : 0;
    const appliedShippingDiscount = useFreeshipCoupon ? useFreeshipCoupon.discount : 0;
    const voucherSaving =
        Math.min(effectivePrice, appliedProductDiscount) +
        Math.min(shippingFee, appliedShippingDiscount);

    return (
        <>
            {availableDiscountCoupons.length > 0 && (
                <TouchableOpacity style={styles.couponBtn} onPress={onOpenDiscountModal}>
                    <View style={styles.couponIconCircle}>
                        <MaterialIcons name="local-offer" size={18} color="#2563EB" />
                    </View>
                    <View style={styles.couponTextWrap}>
                        <Text style={styles.couponTitleBlue}>
                            {useDiscountCoupon ? `Dùng ${useDiscountCoupon.label}` : 'Chọn mã giảm giá'}
                        </Text>
                        <Text style={styles.couponSubBlue}>
                            {availableDiscountCoupons.length} mã khả dụng
                        </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#3B82F6" />
                </TouchableOpacity>
            )}

            {availableFreeshipCoupons.length > 0 && (
                <TouchableOpacity
                    style={[styles.couponBtn, styles.couponBtnGreen]}
                    onPress={onOpenFreeshipModal}
                >
                    <View style={[styles.couponIconCircle, styles.couponIconGreen]}>
                        <MaterialIcons name="local-shipping" size={18} color="#16A34A" />
                    </View>
                    <View style={styles.couponTextWrap}>
                        <Text style={styles.couponTitleGreen}>
                            {useFreeshipCoupon ? `Dùng ${useFreeshipCoupon.label}` : 'Chọn mã Free Ship'}
                        </Text>
                        <Text style={styles.couponTitleGreen}>
                            {availableFreeshipCoupons.length} mã khả dụng
                        </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#16A34A" />
                </TouchableOpacity>
            )}

            <View style={styles.breakdownBox}>
                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Giá sản phẩm</Text>
                    <Text style={styles.breakdownValue}>{basePrice} G</Text>
                </View>

                {flashSalePercent > 0 && effectivePrice < basePrice && (
                    <View style={styles.breakdownRow}>
                        <Text style={styles.flashSaleLabel}>Flash Sale (-{flashSalePercent}%)</Text>
                        <Text style={styles.flashSaleValue}>-{basePrice - effectivePrice} G</Text>
                    </View>
                )}

                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Phí vận chuyển</Text>
                    <Text style={styles.breakdownValue}>{shippingFee} G</Text>
                </View>

                {voucherSaving > 0 && (
                    <View style={styles.breakdownRow}>
                        <Text style={styles.voucherLabel}>Giảm giá Voucher</Text>
                        <Text style={styles.voucherValue}>-{voucherSaving} G</Text>
                    </View>
                )}

                <View style={styles.breakdownDivider} />

                <View style={[styles.breakdownRow, styles.totalRow]}>
                    <Text style={[styles.breakdownLabel, styles.boldLabel]}>Tổng cộng</Text>
                    <View style={styles.totalAmountWrap}>
                        <MaterialIcons name="monetization-on" size={16} color={COLORS.clayText} />
                        <Text style={styles.grandTotalText}>{totalRequiredCoins} G</Text>
                    </View>
                </View>
            </View>
        </>
    );
});

const styles = StyleSheet.create({
    couponBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59,130,246,0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.3)',
        marginBottom: 8,
    },
    couponBtnGreen: {
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderColor: 'rgba(34,197,94,0.3)',
        marginBottom: 12,
    },
    couponIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(59,130,246,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    couponIconGreen: { backgroundColor: 'rgba(34,197,94,0.2)' },
    couponTextWrap: { marginLeft: 12, flex: 1 },
    couponTitleBlue: { fontSize: 13, fontWeight: 'bold', color: '#2563EB' },
    couponSubBlue: { fontSize: 11, color: '#3B82F6' },
    couponTitleGreen: { fontSize: 12, fontWeight: 'bold', color: '#16A34A' },
    breakdownBox: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    totalRow: { alignItems: 'center', marginBottom: 0 },
    breakdownLabel: { fontSize: 13, color: 'rgba(93,64,55,0.7)' },
    boldLabel: { fontWeight: 'bold' },
    breakdownValue: { fontSize: 13, fontWeight: 'bold', color: '#713F12' },
    flashSaleLabel: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
    flashSaleValue: { fontSize: 13, fontWeight: 'bold', color: '#DC2626' },
    voucherLabel: { fontSize: 13, color: '#16A34A' },
    voucherValue: { fontSize: 13, fontWeight: 'bold', color: '#16A34A' },
    breakdownDivider: {
        height: 1,
        backgroundColor: 'rgba(93,64,55,0.1)',
        marginVertical: 8,
    },
    totalAmountWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    grandTotalText: { fontSize: 18, fontWeight: '900', color: COLORS.clayText },
});

export default RewardPriceBreakdown;

