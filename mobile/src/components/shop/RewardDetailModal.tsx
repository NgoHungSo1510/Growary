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
import { Reward, ShopEvent, VipStatus } from '../../types';
import { COLORS } from '../../theme';
import { getRewardVisual } from './RewardCard';
import { CouponItem } from './CouponsSelectModal';
import { RewardPriceBreakdown } from './RewardPriceBreakdown';
import { getEffectiveRewardPrice, isRewardInFlashSale } from '../../utils/shopPricing';

interface RewardDetailModalProps {
    visible: boolean;
    reward: Reward | null;
    vipStatus: VipStatus | null;
    shopEvent?: ShopEvent | null;
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
    shopEvent = null,
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
    const shippingFee = reward.shippingFee ?? 15000;
    const inFlashSale = isRewardInFlashSale(reward._id, shopEvent);
    const flashSalePercent = inFlashSale && shopEvent ? shopEvent.discountPercent : 0;
    const discountedPriceBase = getEffectiveRewardPrice(reward.pointCost, reward._id, shopEvent);

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
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                            <MaterialIcons name="close" size={20} color="rgba(93,64,55,0.5)" />
                        </TouchableOpacity>

                        <View style={[styles.modalIconWrap, { backgroundColor: `${color}20` }]}>
                            {reward.imageUrl ? (
                                <Image source={{ uri: reward.imageUrl }} style={styles.modalImage} />
                            ) : (
                                <MaterialIcons name={icon} size={64} color={color} />
                            )}
                            {reward.isFeatured && (
                                <View style={styles.modalRareBadge}>
                                    <Text style={styles.modalRareText}>RARE</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.modalTitle}>{reward.title}</Text>
                        <Text style={styles.modalDesc}>
                            {reward.description || 'Phần thưởng đặc biệt'}
                        </Text>

                        <RewardPriceBreakdown
                            basePrice={reward.pointCost}
                            effectivePrice={discountedPriceBase}
                            flashSalePercent={flashSalePercent}
                            shippingFee={shippingFee}
                            totalRequiredCoins={totalRequiredCoins}
                            useDiscountCoupon={useDiscountCoupon}
                            useFreeshipCoupon={useFreeshipCoupon}
                            availableDiscountCoupons={availableDiscountCoupons}
                            availableFreeshipCoupons={availableFreeshipCoupons}
                            onOpenDiscountModal={onOpenDiscountModal}
                            onOpenFreeshipModal={onOpenFreeshipModal}
                        />

                        <View style={styles.modalPriceRow}>
                            <View style={styles.modalPriceBox}>
                                <Text style={styles.modalPriceLabel}>Giá</Text>
                                <View style={styles.inlineRow}>
                                    <MaterialIcons name="monetization-on" size={18} color="#713F12" />
                                    <Text style={styles.modalPriceValue}>{totalRequiredCoins}</Text>
                                </View>
                                {discountedPriceBase < reward.pointCost && (
                                    <Text style={styles.strikethroughText}>Gốc: {reward.pointCost}</Text>
                                )}
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

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalRedeemBtn, (!canAfford || isPurchasing) && styles.disabledBtn]}
                                disabled={!canAfford || isPurchasing}
                                onPress={onPurchase}
                            >
                                <LinearGradient colors={[COLORS.clayAccent2, '#EC4899']} style={styles.modalRedeemGradient}>
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
    modalCloseBtn: { position: 'absolute', top: 0, right: 0, padding: 4, zIndex: 1 },
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
    modalImage: { width: 64, height: 64, borderRadius: 16 },
    modalRareBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#FEF08A',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    modalRareText: { fontSize: 9, fontWeight: '900', color: '#713F12' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.clayText, textAlign: 'center', marginBottom: 4 },
    modalDesc: { fontSize: 13, color: 'rgba(93,64,55,0.6)', textAlign: 'center', marginBottom: 16 },
    modalPriceRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    modalPriceBox: { flex: 1, alignItems: 'center' },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    modalDivider: { width: 1, backgroundColor: 'rgba(93,64,55,0.1)' },
    modalPriceLabel: { fontSize: 11, color: 'rgba(93,64,55,0.5)', marginBottom: 2 },
    modalPriceValue: { fontSize: 16, fontWeight: 'bold', color: '#713F12' },
    strikethroughText: { fontSize: 11, textDecorationLine: 'line-through', color: 'rgba(93,64,55,0.4)', marginTop: 2 },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7',
        padding: 10,
        borderRadius: 12,
        marginBottom: 12,
    },
    warningText: { fontSize: 12, color: '#B45309', fontWeight: '600' },
    stockInfo: { fontSize: 12, color: 'rgba(93,64,55,0.6)', textAlign: 'center', marginBottom: 16 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: 'rgba(93,64,55,0.08)',
    },
    modalCancelText: { fontSize: 14, fontWeight: 'bold', color: COLORS.clayText },
    modalRedeemBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
    disabledBtn: { opacity: 0.4 },
    modalRedeemGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    modalRedeemText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
});
