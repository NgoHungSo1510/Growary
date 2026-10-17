import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Image,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Reward, VipStatus } from '../../types';
import { COLORS } from '../../theme';
import { getRewardVisual } from './RewardCard';
import { CouponItem } from './CouponsSelectModal';

interface RewardDetailModalProps {
    visible: boolean;
    reward: Reward | null;
    vipStatus: VipStatus | null;
    userCoins: number;
    modalScale: Animated.Value;
    isPurchasing: boolean;
    useDiscountCoupon: CouponItem | null;
    useFreeshipCoupon: CouponItem | null;
    availableDiscountCoupons: CouponItem[];
    availableFreeshipCoupons: CouponItem[];
    onOpenDiscountModal: () => void;
    onOpenFreeshipModal: () => void;
    onClose: () => void;
    onPurchase: () => void;
}

export const RewardDetailModal: React.FC<RewardDetailModalProps> = ({
    visible,
    reward,
    vipStatus,
    userCoins,
    modalScale,
    isPurchasing,
    useDiscountCoupon,
    useFreeshipCoupon,
    availableDiscountCoupons,
    availableFreeshipCoupons,
    onOpenDiscountModal,
    onOpenFreeshipModal,
    onClose,
    onPurchase,
}) => {
    if (!reward) return null;

    const { icon, color } = getRewardVisual(reward.title);

    const getDiscountedPrice = (price?: number) => {
        if (price === undefined || price === null) return 0;
        const discountPercent = vipStatus?.currentTier?.discountPercent || 0;
        if (discountPercent <= 0) return price;
        return Math.floor(price * (1 - discountPercent / 100));
    };

    const shippingFee = reward.shippingFee ?? 15000;
    const discountedPriceBase = getDiscountedPrice(reward.pointCost);
    const appliedProductDiscount = useDiscountCoupon ? useDiscountCoupon.discount : 0;
    const appliedShippingDiscount = useFreeshipCoupon ? useFreeshipCoupon.discount : 0;
    const finalShipping = Math.max(0, shippingFee - appliedShippingDiscount);
    const finalProduct = Math.max(0, discountedPriceBase - appliedProductDiscount);
    const totalRequiredCoins = finalProduct + finalShipping;
    const canAfford = userCoins >= totalRequiredCoins;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <Animated.View style={[styles.rewardModal, { transform: [{ scale: modalScale }] }]}>
                    <TouchableOpacity activeOpacity={1}>
                        {/* Close button */}
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                            <MaterialIcons name="close" size={20} color="rgba(93,64,55,0.5)" />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View style={[styles.modalIconWrap, { backgroundColor: `${color}20` }]}>
                            {reward.imageUrl ? (
                                <Image source={{ uri: reward.imageUrl }} style={{ width: 64, height: 64, borderRadius: 16 }} />
                            ) : (
                                <MaterialIcons name={icon} size={64} color={color} />
                            )}
                            {reward.isFeatured && (
                                <View style={styles.modalRareBadge}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#713F12' }}>RARE</Text>
                                </View>
                            )}
                        </View>

                        {/* Info */}
                        <Text style={styles.modalTitle}>{reward.title}</Text>
                        <Text style={styles.modalDesc}>
                            {reward.description || 'Phần thưởng đặc biệt'}
                        </Text>

                        {availableDiscountCoupons.length > 0 && (
                            <View style={{ marginBottom: 8 }}>
                                <TouchableOpacity
                                    style={styles.couponSelectBtn}
                                    onPress={onOpenDiscountModal}
                                >
                                    <View style={styles.couponIconCircle}>
                                        <MaterialIcons name="local-offer" size={18} color="#2563EB" />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2563EB' }}>
                                            {useDiscountCoupon ? `Dùng ${useDiscountCoupon.label}` : 'Chọn mã giảm giá'}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#3B82F6' }}>
                                            {availableDiscountCoupons.length} mã khả dụng
                                        </Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color="#3B82F6" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {availableFreeshipCoupons.length > 0 && (
                            <View style={{ marginBottom: 12 }}>
                                <TouchableOpacity
                                    style={[styles.couponSelectBtn, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }]}
                                    onPress={onOpenFreeshipModal}
                                >
                                    <View style={[styles.couponIconCircle, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
                                        <MaterialIcons name="local-shipping" size={18} color="#16A34A" />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#16A34A' }}>
                                            {useFreeshipCoupon ? `Dùng ${useFreeshipCoupon.label}` : 'Chọn mã Free Ship'}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#16A34A' }}>
                                            {availableFreeshipCoupons.length} mã khả dụng
                                        </Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color="#16A34A" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Price breakdown */}
                        <View style={styles.breakdownBox}>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Giá sản phẩm</Text>
                                <Text style={styles.breakdownValue}>{discountedPriceBase} G</Text>
                            </View>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Phí vận chuyển</Text>
                                <Text style={styles.breakdownValue}>{shippingFee} G</Text>
                            </View>

                            {(useDiscountCoupon || useFreeshipCoupon) && (
                                <View style={styles.breakdownRow}>
                                    <Text style={{ fontSize: 13, color: '#16A34A' }}>Giảm giá Voucher</Text>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#16A34A' }}>
                                        -{appliedProductDiscount + appliedShippingDiscount} G
                                    </Text>
                                </View>
                            )}
                            <View style={styles.breakdownDivider} />
                            <View style={[styles.breakdownRow, { alignItems: 'center' }]}>
                                <Text style={[styles.breakdownLabel, { fontWeight: 'bold' }]}>Tổng cộng</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <MaterialIcons name="monetization-on" size={16} color={COLORS.clayText} />
                                    <Text style={styles.grandTotalText}>{totalRequiredCoins} G</Text>
                                </View>
                            </View>
                        </View>

                        {/* Price + Balance */}
                        <View style={styles.modalPriceRow}>
                            <View style={styles.modalPriceBox}>
                                <Text style={styles.modalPriceLabel}>Giá</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <MaterialIcons name="monetization-on" size={18} color="#713F12" />
                                    <Text style={styles.modalPriceValue}>{totalRequiredCoins}</Text>
                                </View>
                                {vipStatus?.currentTier?.discountPercent ? (
                                    <Text style={styles.strikethroughText}>
                                        Gốc: {reward.pointCost}
                                    </Text>
                                ) : null}
                            </View>
                            <View style={styles.modalDivider} />
                            <View style={styles.modalPriceBox}>
                                <Text style={styles.modalPriceLabel}>Bạn có</Text>
                                <Text style={[styles.modalPriceValue, { color: canAfford ? '#22C55E' : '#EF4444' }]}>
                                    {userCoins} G
                                </Text>
                            </View>
                        </View>

                        {!canAfford && (
                            <View style={styles.warningBox}>
                                <MaterialIcons name="warning" size={14} color="#B45309" />
                                <Text style={styles.warningText}>
                                    Thiếu {totalRequiredCoins - userCoins} G để đổi
                                </Text>
                            </View>
                        )}

                        {reward.stock !== undefined && reward.stock !== null && (
                            <Text style={styles.stockInfo}>📦 Còn lại: {reward.stock} cái</Text>
                        )}

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalRedeemBtn, (!canAfford || isPurchasing) && { opacity: 0.4 }]}
                                disabled={!canAfford || isPurchasing}
                                onPress={onPurchase}
                            >
                                <LinearGradient
                                    colors={[COLORS.clayAccent2, '#EC4899']}
                                    style={styles.modalRedeemGradient}
                                >
                                    {isPurchasing ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="shopping-cart" size={18} color="#FFF" />
                                            <Text style={styles.modalRedeemText}>Đổi ngay</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    rewardModal: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 4,
        zIndex: 1,
    },
    modalIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    modalRareBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#FEF08A',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
        textAlign: 'center',
        marginBottom: 4,
    },
    modalDesc: {
        fontSize: 13,
        color: 'rgba(93,64,55,0.6)',
        textAlign: 'center',
        marginBottom: 16,
    },
    couponSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59,130,246,0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.3)',
    },
    couponIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(59,130,246,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
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
    breakdownLabel: {
        fontSize: 13,
        color: 'rgba(93,64,55,0.7)',
    },
    breakdownValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#713F12',
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: 'rgba(93,64,55,0.1)',
        marginVertical: 8,
    },
    grandTotalText: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.clayText,
    },
    modalPriceRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    modalPriceBox: {
        flex: 1,
        alignItems: 'center',
    },
    modalDivider: {
        width: 1,
        backgroundColor: 'rgba(93,64,55,0.1)',
    },
    modalPriceLabel: {
        fontSize: 11,
        color: 'rgba(93,64,55,0.5)',
        marginBottom: 2,
    },
    modalPriceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#713F12',
    },
    strikethroughText: {
        fontSize: 11,
        textDecorationLine: 'line-through',
        color: 'rgba(93,64,55,0.4)',
        marginTop: 2,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7',
        padding: 10,
        borderRadius: 12,
        marginBottom: 12,
    },
    warningText: {
        fontSize: 12,
        color: '#B45309',
        fontWeight: '600',
    },
    stockInfo: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.6)',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: 'rgba(93,64,55,0.08)',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    modalRedeemBtn: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
    },
    modalRedeemGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    modalRedeemText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
