import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Animated,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Reward, Voucher, VipStatus, InventoryItem } from '../types';
import ClayHeader from '../components/ClayHeader';
import RewardCelebrationModal from '../components/RewardCelebrationModal';
import { VipMiniCard } from '../components/VipMiniCard';
import { COLORS, FONT_SIZES } from '../theme';
import {
    RewardCard,
    RewardDetailModal,
    CouponsSelectModal,
    CouponItem,
    VoucherRedeemModal,
    ProcessingModal,
    FEATURED_CARD_W,
    FlashSaleBanner,
    SaleEventModal,
} from '../components/shop';
import { useShopEvent } from '../hooks/useShopEvent';

export default function ShopScreen() {
    const { user, refreshUser } = useAuth();
    const navigation = useNavigation();

    const [rewards, setRewards] = useState<Reward[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [vipStatus, setVipStatus] = useState<VipStatus | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Active Shop Event
    const {
        event: shopEvent,
        countdown: shopEventCountdown,
        showPopup: showSalePopup,
        dismissPopup: dismissSalePopup,
    } = useShopEvent();

    // Modal states
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [purchasedTitle, setPurchasedTitle] = useState('');
    const [grantedRewards, setGrantedRewards] = useState<any | null>(null);
    const [redeemVoucher, setRedeemVoucher] = useState<Voucher | null>(null);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState(false);

    // Coupon states
    const [useDiscountCoupon, setUseDiscountCoupon] = useState<CouponItem | null>(null);
    const [useFreeshipCoupon, setUseFreeshipCoupon] = useState<CouponItem | null>(null);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [showFreeshipModal, setShowFreeshipModal] = useState(false);
    const [availableDiscountCoupons, setAvailableDiscountCoupons] = useState<CouponItem[]>([]);
    const [availableFreeshipCoupons, setAvailableFreeshipCoupons] = useState<CouponItem[]>([]);

    const modalScale = useRef(new Animated.Value(0)).current;

    const fetchRewards = async () => {
        try {
            const [res, vipRes] = await Promise.all([
                apiService.getRewards(),
                apiService.getVipStatus().catch(() => null),
            ]);
            setRewards(res.rewards || []);
            if (vipRes && vipRes.status) setVipStatus(vipRes.status);
        } catch (error) {
            console.error('Failed to fetch rewards:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchVouchers = async () => {
        try {
            const res = await apiService.getMyVouchers();
            setVouchers(res.vouchers || []);
        } catch {
            // Silently fail
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await apiService.getInventory();
            setInventory(res.inventory || []);
        } catch { }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRewards();
            fetchVouchers();
            fetchInventory();
            refreshUser();
        }, [])
    );

    const openRewardModal = (reward: Reward) => {
        setSelectedReward(reward);

        let bestDiscount: CouponItem | null = null;
        let maxDiscountVal = -1;
        let bestFreeship: CouponItem | null = null;
        let maxFreeshipVal = -1;

        const shippingFee = reward.shippingFee ?? 15000;
        const discounts: CouponItem[] = [];
        const freeships: CouponItem[] = [];

        inventory.forEach((item) => {
            if (item.quantity > 0 && item.itemType === 'special_item' && item.rewardForm === 'full' && item.specialItem && item.specialItem.type) {
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

        setAvailableDiscountCoupons(discounts);
        setAvailableFreeshipCoupons(freeships);
        setUseDiscountCoupon(bestDiscount);
        setUseFreeshipCoupon(bestFreeship);

        modalScale.setValue(0);
        Animated.spring(modalScale, {
            toValue: 1,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const closeRewardModal = () => {
        Animated.timing(modalScale, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => setSelectedReward(null));
    };

    const handlePurchase = async () => {
        if (!selectedReward || isPurchasing) return;
        setIsPurchasing(true);
        const reward = selectedReward;

        const selectedCoupons: string[] = [];
        if (useDiscountCoupon) selectedCoupons.push(useDiscountCoupon.type);
        if (useFreeshipCoupon) selectedCoupons.push(useFreeshipCoupon.type);

        try {
            const data = await apiService.purchaseReward(reward._id, selectedCoupons);
            setPurchasedTitle(reward.title);
            setSelectedReward(null);
            setRedeemVoucher(data.voucher);
            if (data.grantedRewards) setGrantedRewards(data.grantedRewards);
            refreshUser();
            fetchRewards();
            fetchVouchers();
            fetchInventory();
        } catch (error: any) {
            closeRewardModal();
            const msg = error.response?.data?.error || 'Không thể đổi';
            setTimeout(() => Alert.alert('Lỗi', msg), 200);

            setUseDiscountCoupon(null);
            setUseFreeshipCoupon(null);
            fetchInventory();
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleUseVoucher = async () => {
        if (!redeemVoucher || isRedeeming) return;
        setIsRedeeming(true);
        try {
            await apiService.useVoucher(redeemVoucher.code);
            setRedeemVoucher(null);
            setShowProcessingModal(true);
            fetchVouchers();
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể sử dụng voucher lúc này.');
        } finally {
            setIsRedeeming(false);
        }
    };

    const featuredRewards = rewards.filter((r) => r.isFeatured);
    const regularRewards = rewards.filter((r) => !r.isFeatured);
    const userCoins = user?.coins || 0;

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: COLORS.clayText }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.warmBg }}>
            <ClayHeader user={user} />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => {
                            setIsRefreshing(true);
                            fetchRewards();
                            fetchVouchers();
                        }}
                    />
                }
            >
                {/* FLASH SALE BANNER */}
                <FlashSaleBanner
                    event={shopEvent}
                    countdown={shopEventCountdown}
                />

                {vipStatus && (
                    <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                        <VipMiniCard
                            vipStatus={vipStatus}
                            onDetailPress={() => navigation.navigate('Settings' as never)}
                        />
                    </View>
                )}

                {/* FEATURED SLIDE */}
                {featuredRewards.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>⭐ Nổi bật</Text>
                            <View style={styles.refreshBadge}>
                                <Text style={styles.refreshText}>RARE</Text>
                            </View>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={FEATURED_CARD_W + 16}
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                            style={{ marginBottom: 24 }}
                        >
                            {featuredRewards.map((reward) => (
                                <RewardCard
                                    key={reward._id}
                                    reward={reward}
                                    vipStatus={vipStatus}
                                    onPress={openRewardModal}
                                    variant="featured"
                                    saleDiscountPercent={shopEvent?.discountPercent || 0}
                                />
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* REGULAR GRID */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🛒 Cửa hàng</Text>
                    <View style={styles.refreshBadge}>
                        <Text style={styles.refreshText}>{regularRewards.length} món</Text>
                    </View>
                </View>

                <View style={styles.gridContainer}>
                    {regularRewards.map((reward) => (
                        <RewardCard
                            key={reward._id}
                            reward={reward}
                            vipStatus={vipStatus}
                            onPress={openRewardModal}
                            variant="grid"
                            saleDiscountPercent={shopEvent?.discountPercent || 0}
                        />
                    ))}
                </View>

                {rewards.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="store" size={48} color="rgba(93,64,55,0.2)" />
                        <Text style={styles.emptyText}>Shop đang cập nhật — quay lại sau nhé!</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modals */}
            <RewardDetailModal
                visible={!!selectedReward}
                reward={selectedReward}
                vipStatus={vipStatus}
                userCoins={userCoins}
                modalScale={modalScale}
                isPurchasing={isPurchasing}
                useDiscountCoupon={useDiscountCoupon}
                useFreeshipCoupon={useFreeshipCoupon}
                availableDiscountCoupons={availableDiscountCoupons}
                availableFreeshipCoupons={availableFreeshipCoupons}
                onOpenDiscountModal={() => setShowDiscountModal(true)}
                onOpenFreeshipModal={() => setShowFreeshipModal(true)}
                onClose={closeRewardModal}
                onPurchase={handlePurchase}
            />

            <CouponsSelectModal
                visible={showDiscountModal}
                title="Chọn Mã Giảm Giá"
                type="discount"
                coupons={availableDiscountCoupons}
                selectedCoupon={useDiscountCoupon}
                onSelect={setUseDiscountCoupon}
                onClose={() => setShowDiscountModal(false)}
            />

            <CouponsSelectModal
                visible={showFreeshipModal}
                title="Chọn Mã Free Ship"
                type="freeship"
                coupons={availableFreeshipCoupons}
                selectedCoupon={useFreeshipCoupon}
                onSelect={setUseFreeshipCoupon}
                onClose={() => setShowFreeshipModal(false)}
            />

            <VoucherRedeemModal
                visible={!!redeemVoucher}
                voucher={redeemVoucher}
                purchasedTitle={purchasedTitle}
                isRedeeming={isRedeeming}
                onUseNow={handleUseVoucher}
                onUseLater={() => {
                    setRedeemVoucher(null);
                    setPurchasedTitle('');
                }}
            />

            <ProcessingModal
                visible={showProcessingModal}
                onClose={() => setShowProcessingModal(false)}
            />

            <RewardCelebrationModal
                visible={!!grantedRewards}
                rewards={grantedRewards}
                onClose={() => setGrantedRewards(null)}
            />

            {/* Sale Event Announcement Modal */}
            <SaleEventModal
                visible={showSalePopup}
                event={shopEvent}
                onClose={dismissSalePopup}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.warmBg },
    scrollContent: { paddingBottom: 20 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    refreshBadge: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    refreshText: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(93,64,55,0.5)',
        marginTop: 12,
    },
});
