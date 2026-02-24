import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    Modal,
    Animated,
    Image,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Reward, Voucher } from '../types';
import ClayHeader from '../components/ClayHeader';
import RewardCelebrationModal from '../components/RewardCelebrationModal';
import { COLORS, FONT_SIZES } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const FEATURED_CARD_W = width * 0.72;

// Map reward titles to icons/colors
const getRewardVisual = (title: string): { icon: keyof typeof MaterialIcons.glyphMap; color: string } => {
    const t = title.toLowerCase();
    if (t.includes('energy') || t.includes('potion') || t.includes('cafe')) return { icon: 'local-cafe', color: '#A855F7' };
    if (t.includes('theme') || t.includes('palette')) return { icon: 'palette', color: '#3B82F6' };
    if (t.includes('game') || t.includes('play')) return { icon: 'sports-esports', color: '#22C55E' };
    if (t.includes('sticker') || t.includes('emoji')) return { icon: 'sentiment-satisfied', color: '#F97316' };
    if (t.includes('boost') || t.includes('crystal') || t.includes('diamond')) return { icon: 'diamond', color: '#A855F7' };
    return { icon: 'card-giftcard', color: '#A855F7' };
};

export default function ShopScreen() {
    const { user, refreshUser } = useAuth();
    const insets = useSafeAreaInsets();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modals
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [purchasedTitle, setPurchasedTitle] = useState('');
    const [showInventory, setShowInventory] = useState(false);
    const [grantedRewards, setGrantedRewards] = useState<any | null>(null);
    const [redeemVoucher, setRedeemVoucher] = useState<Voucher | null>(null);
    const [showProcessingModal, setShowProcessingModal] = useState(false);

    // Redeem voucher API
    const handleUseVoucher = async () => {
        if (!redeemVoucher) return;
        try {
            // we will call useVoucher
            await apiService.useVoucher(redeemVoucher.code);
            setRedeemVoucher(null);
            setShowProcessingModal(true);
            fetchVouchers(); // Refresh list to show 'pending_use'
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể sử dụng voucher lúc này.');
        }
    };

    const modalScale = useRef(new Animated.Value(0)).current;

    const fetchRewards = async () => {
        try {
            const res = await apiService.getRewards();
            setRewards(res.rewards || []);
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

    useFocusEffect(
        useCallback(() => {
            fetchRewards();
            fetchVouchers();
            refreshUser();
        }, [])
    );

    const openRewardModal = (reward: Reward) => {
        setSelectedReward(reward);
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
        if (!selectedReward) return;
        const reward = selectedReward;
        try {
            const data = await apiService.purchaseReward(reward._id);
            setPurchasedTitle(reward.title);
            setSelectedReward(null);
            setRedeemVoucher(data.voucher);
            if (data.grantedRewards) setGrantedRewards(data.grantedRewards);
            refreshUser();
            fetchRewards();
            fetchVouchers();
        } catch (error: any) {
            closeRewardModal();
            const msg = error.response?.data?.error || 'Không thể đổi';
            setTimeout(() => Alert.alert('Lỗi', msg), 200);
        }
    };

    const featuredRewards = rewards.filter(r => r.isFeatured);
    const regularRewards = rewards.filter(r => !r.isFeatured);
    const userCoins = user?.coins || 0;
    const pendingVouchers = vouchers.filter(v => v.status === 'pending_use' || v.status === 'active');

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: COLORS.clayText }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.warmBg }}>
            {/* Header */}
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

                {/* ── FEATURED SLIDE ── */}
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
                            {featuredRewards.map((reward) => {
                                const { icon, color } = getRewardVisual(reward.title);
                                return (
                                    <TouchableOpacity
                                        key={reward._id}
                                        style={styles.featuredSlide}
                                        activeOpacity={0.9}
                                        onPress={() => openRewardModal(reward)}
                                    >
                                        <View style={styles.rareBadge}>
                                            <Text style={styles.rareText}>RARE</Text>
                                        </View>

                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.4)', 'transparent']}
                                            style={styles.featuredImageArea}
                                        >
                                            {reward.imageUrl ? (
                                                <Image source={{ uri: reward.imageUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                            ) : (
                                                <MaterialIcons name={icon} size={64} color={color} style={{ opacity: 0.9 }} />
                                            )}
                                        </LinearGradient>

                                        <View style={styles.featuredInfo}>
                                            <Text style={styles.featuredTitle} numberOfLines={1}>{reward.title}</Text>
                                            <Text style={styles.featuredSubtitle} numberOfLines={1}>
                                                {reward.description || 'Special reward'}
                                            </Text>
                                            <View style={styles.featuredPriceRow}>
                                                <View style={styles.priceTagYellow}>
                                                    <MaterialIcons name="monetization-on" size={12} color="#713F12" />
                                                    <Text style={styles.priceTextYellow}>{reward.pointCost}</Text>
                                                </View>
                                                {reward.stock !== undefined && reward.stock !== null && (
                                                    <Text style={styles.stockText}>Còn {reward.stock}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </>
                )}

                {/* ── GRID ITEMS ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🛒 Cửa hàng</Text>
                    <View style={styles.refreshBadge}>
                        <Text style={styles.refreshText}>{regularRewards.length} món</Text>
                    </View>
                </View>

                <View style={styles.gridContainer}>
                    {regularRewards.map((reward) => {
                        const { icon, color } = getRewardVisual(reward.title);
                        return (
                            <TouchableOpacity
                                key={reward._id}
                                style={styles.gridItem}
                                activeOpacity={0.85}
                                onPress={() => openRewardModal(reward)}
                            >
                                <View style={styles.iconInsetBox}>
                                    {reward.imageUrl ? (
                                        <Image source={{ uri: reward.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' }} />
                                    ) : (
                                        <MaterialIcons name={icon} size={40} color={color} style={{ opacity: 0.9 }} />
                                    )}
                                    <View style={styles.miniPriceBadge}>
                                        <MaterialIcons name="monetization-on" size={10} color="#713F12" />
                                        <Text style={styles.miniPriceText}>{reward.pointCost}</Text>
                                    </View>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>{reward.title}</Text>
                                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                                        {reward.description || 'Reward'}
                                    </Text>
                                </View>
                                <View style={styles.smallRedeemBtn}>
                                    <Text style={styles.smallRedeemText}>Đổi</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Empty state */}
                {rewards.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="store" size={48} color="rgba(93,64,55,0.2)" />
                        <Text style={styles.emptyText}>Shop đang cập nhật — quay lại sau nhé!</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ══════ REWARD DETAIL MODAL ══════ */}
            <Modal visible={!!selectedReward} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeRewardModal}
                >
                    <Animated.View
                        style={[
                            styles.rewardModal,
                            { transform: [{ scale: modalScale }] },
                        ]}
                    >
                        <TouchableOpacity activeOpacity={1}>
                            {selectedReward && (() => {
                                const { icon, color } = getRewardVisual(selectedReward.title);
                                const canAfford = userCoins >= selectedReward.pointCost;
                                return (
                                    <View>
                                        {/* Close button */}
                                        <TouchableOpacity style={styles.modalCloseBtn} onPress={closeRewardModal}>
                                            <MaterialIcons name="close" size={20} color="rgba(93,64,55,0.5)" />
                                        </TouchableOpacity>

                                        {/* Icon */}
                                        <View style={[styles.modalIconWrap, { backgroundColor: `${color}20` }]}>
                                            {selectedReward.imageUrl ? (
                                                <Image source={{ uri: selectedReward.imageUrl }} style={{ width: 64, height: 64, borderRadius: 16 }} />
                                            ) : (
                                                <MaterialIcons name={icon} size={64} color={color} />
                                            )}
                                            {selectedReward.isFeatured && (
                                                <View style={styles.modalRareBadge}>
                                                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#713F12' }}>RARE</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Info */}
                                        <Text style={styles.modalTitle}>{selectedReward.title}</Text>
                                        <Text style={styles.modalDesc}>
                                            {selectedReward.description || 'Phần thưởng đặc biệt'}
                                        </Text>

                                        {/* Price + Balance */}
                                        <View style={styles.modalPriceRow}>
                                            <View style={styles.modalPriceBox}>
                                                <Text style={styles.modalPriceLabel}>Giá</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <MaterialIcons name="monetization-on" size={18} color="#713F12" />
                                                    <Text style={styles.modalPriceValue}>{selectedReward.pointCost}</Text>
                                                </View>
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
                                                    Thiếu {selectedReward.pointCost - userCoins} G để đổi
                                                </Text>
                                            </View>
                                        )}

                                        {selectedReward.stock !== undefined && selectedReward.stock !== null && (
                                            <Text style={styles.stockInfo}>📦 Còn lại: {selectedReward.stock} cái</Text>
                                        )}

                                        {/* Actions */}
                                        <View style={styles.modalActions}>
                                            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeRewardModal}>
                                                <Text style={styles.modalCancelText}>Hủy</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.modalRedeemBtn, !canAfford && { opacity: 0.4 }]}
                                                disabled={!canAfford}
                                                onPress={handlePurchase}
                                            >
                                                <LinearGradient
                                                    colors={[COLORS.clayAccent2, '#EC4899']}
                                                    style={styles.modalRedeemGradient}
                                                >
                                                    <MaterialIcons name="shopping-cart" size={18} color="#FFF" />
                                                    <Text style={styles.modalRedeemText}>Đổi ngay</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })()}
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            {/* ══════ POST-PURCHASE/USE NOW MODAL ══════ */}
            <Modal visible={!!redeemVoucher} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.postPurchaseModal}>
                        <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>{redeemVoucher?.rewardTitleSnapshot ? '🎟️' : '🎉'}</Text>
                        <Text style={styles.ppTitle}>{purchasedTitle ? 'Đổi thành công!' : 'Dùng Voucher'}</Text>
                        <Text style={styles.ppSubtitle}>
                            {purchasedTitle
                                ? `"${purchasedTitle}" đã vào kho của bạn.`
                                : `Bạn có muốn dùng "${redeemVoucher?.rewardTitleSnapshot}" ngay không?`}
                        </Text>

                        <View style={styles.ppActions}>
                            <TouchableOpacity
                                style={styles.ppUseLaterBtn}
                                onPress={() => {
                                    setRedeemVoucher(null);
                                    setPurchasedTitle('');
                                }}
                            >
                                <MaterialIcons name="inventory-2" size={18} color={COLORS.clayText} />
                                <Text style={styles.ppUseLaterText}>Để sau</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.ppUseNowBtn}
                                onPress={() => {
                                    handleUseVoucher();
                                    setPurchasedTitle('');
                                }}
                            >
                                <LinearGradient
                                    colors={[COLORS.clayAccent2, '#EC4899']}
                                    style={styles.ppUseNowGradient}
                                >
                                    <MaterialIcons name="redeem" size={18} color="#FFF" />
                                    <Text style={styles.ppUseNowText}>Dùng ngay</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ══════ INVENTORY MODAL ══════ */}
            <Modal visible={showInventory} animationType="slide" transparent>
                <View style={styles.inventoryOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowInventory(false)} />
                    <View style={styles.inventorySheet}>
                        <View style={{ alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(93,64,55,0.15)' }} />
                        </View>
                        <View style={styles.inventoryHeader}>
                            <Text style={styles.inventoryTitle}>📦 Kho đồ của bạn</Text>
                            <TouchableOpacity onPress={() => setShowInventory(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {vouchers.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialIcons name="inventory-2" size={40} color="rgba(93,64,55,0.15)" />
                                    <Text style={styles.emptyText}>Chưa có đồ — hãy mua thứ gì đó!</Text>
                                </View>
                            ) : (
                                vouchers.map((v) => (
                                    <TouchableOpacity
                                        key={v._id}
                                        style={styles.voucherRow}
                                        activeOpacity={v.status === 'active' ? 0.7 : 1}
                                        onPress={() => {
                                            if (v.status === 'active') {
                                                setRedeemVoucher(v);
                                            }
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.voucherTitle}>{v.rewardTitleSnapshot}</Text>
                                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                                <Text style={styles.voucherCode}>{v.code}</Text>
                                                <View style={[
                                                    styles.statusBadge,
                                                    v.status === 'used' && { backgroundColor: 'rgba(34,197,94,0.15)' },
                                                    v.status === 'pending_use' && { backgroundColor: 'rgba(234,179,8,0.15)' },
                                                    v.status === 'expired' && { backgroundColor: 'rgba(239,68,68,0.15)' },
                                                ]}>
                                                    <Text style={[
                                                        styles.statusText,
                                                        v.status === 'used' && { color: '#16A34A' },
                                                        v.status === 'pending_use' && { color: '#B45309' },
                                                        v.status === 'expired' && { color: '#DC2626' },
                                                    ]}>
                                                        {v.status === 'active' && '🎟️ Sẵn dùng'}
                                                        {v.status === 'pending_use' && '⏳ Chờ trao'}
                                                        {v.status === 'used' && '✅ Đã dùng'}
                                                        {v.status === 'expired' && '⛔ Hết hạn'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.voucherDate}>
                                                Mua: {new Date(v.purchaseDate).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                        <View style={styles.voucherCostBox}>
                                            <MaterialIcons name="monetization-on" size={12} color="#713F12" />
                                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#713F12' }}>{v.pointCostSnapshot}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── FLOATING INVENTORY FAB ── */}
            <TouchableOpacity
                style={[styles.fab, { bottom: 90 + insets.bottom }]}
                activeOpacity={0.85}
                onPress={() => {
                    fetchVouchers();
                    setShowInventory(true);
                }}
            >
                <MaterialIcons name="inventory-2" size={26} color="#FFF" />
                {pendingVouchers.length > 0 && (
                    <View style={styles.fabBadge}>
                        <Text style={styles.fabBadgeText}>{pendingVouchers.length}</Text>
                    </View>
                )}
            </TouchableOpacity>
            {/* ── PROCESSING MODAL ── */}
            <Modal visible={showProcessingModal} animationType="fade" transparent>
                <View style={styles.inventoryOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowProcessingModal(false)} />
                    <View style={{ backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 24, alignItems: 'center', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                        <MaterialIcons name="hourglass-top" size={48} color={COLORS.clayAccent2} style={{ marginBottom: 16 }} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.clayText, textAlign: 'center', marginBottom: 8 }}>
                            Đang xử lý
                        </Text>
                        <Text style={{ fontSize: 14, color: 'rgba(93,64,55,0.7)', textAlign: 'center', lineHeight: 20 }}>
                            Mã của bạn sẽ được chúng tôi xử lý, hãy đợi một chút.
                            Chúng tôi sẽ gửi cho bạn thông qua Zalo hoặc Messenger.
                        </Text>
                        <TouchableOpacity
                            style={{ marginTop: 24, backgroundColor: COLORS.clayAccent1, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 }}
                            onPress={() => setShowProcessingModal(false)}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Đã hiểu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <RewardCelebrationModal
                visible={!!grantedRewards}
                rewards={grantedRewards}
                onClose={() => setGrantedRewards(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.warmBg },
    scrollContent: { paddingBottom: 120 },

    // Section Header
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 20, fontWeight: 'bold', color: COLORS.clayText,
        textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1,
    },
    refreshBadge: {
        backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    },
    refreshText: { fontSize: FONT_SIZES.caption, fontWeight: 'bold', color: COLORS.clayAccent2 },

    // Featured Slide
    featuredSlide: {
        width: FEATURED_CARD_W,
        backgroundColor: COLORS.clayCard,
        borderRadius: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: COLORS.whiteOp,
        shadowColor: '#A68A64', shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
    },
    featuredImageArea: {
        height: 130, alignItems: 'center', justifyContent: 'center',
    },
    rareBadge: {
        position: 'absolute', top: 12, right: 12,
        backgroundColor: COLORS.yellowBadge, paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: 20, transform: [{ rotate: '6deg' }], zIndex: 10,
        borderWidth: 2, borderColor: '#FFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3,
    },
    rareText: { fontSize: FONT_SIZES.caption, fontWeight: '900', color: '#713F12' },
    featuredInfo: { padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    featuredTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
    featuredSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
    featuredPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    priceTagYellow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.yellowBadge,
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
        borderWidth: 1, borderColor: '#FEF08A', gap: 2,
    },
    priceTextYellow: { fontSize: 12, fontWeight: '900', color: '#713F12' },
    stockText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

    // Grid
    gridContainer: {
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
        paddingHorizontal: 24, gap: 16,
    },
    gridItem: {
        width: (width - 48 - 16) / 2,
        backgroundColor: COLORS.clayCard, borderRadius: 20, padding: 12,
        borderWidth: 1, borderColor: COLORS.whiteOp,
        shadowColor: '#A68A64', shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 6, marginBottom: 16,
    },
    iconInsetBox: {
        width: '100%', aspectRatio: 1,
        backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        borderTopWidth: 2, borderLeftWidth: 2,
        borderTopColor: 'rgba(0,0,0,0.1)', borderLeftColor: 'rgba(0,0,0,0.1)',
        borderBottomWidth: 1, borderRightWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(255,255,255,0.2)',
        position: 'relative',
    },
    miniPriceBadge: {
        position: 'absolute', bottom: 6, right: 6,
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.yellowBadge,
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 1,
        borderWidth: 1, borderColor: '#FEF08A',
    },
    miniPriceText: { fontSize: FONT_SIZES.caption, fontWeight: '900', color: '#713F12' },
    itemInfo: { marginBottom: 8 },
    itemTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
    itemSubtitle: { fontSize: FONT_SIZES.caption, fontWeight: '500', color: 'rgba(93,64,55,0.7)', marginTop: 2 },
    smallRedeemBtn: {
        backgroundColor: COLORS.clayAccent2, paddingVertical: 6, borderRadius: 8,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    smallRedeemText: { fontSize: FONT_SIZES.caption, fontWeight: 'bold', color: '#FFF' },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 14, color: COLORS.clayText, opacity: 0.5, textAlign: 'center' },

    // ── REWARD MODAL ──
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    rewardModal: {
        backgroundColor: COLORS.warmBg, borderRadius: 28, padding: 24,
        width: '85%', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
    },
    rewardIconCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: COLORS.clayInset,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4, borderColor: '#FFF',
        shadowColor: COLORS.clayAccent1, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    rewardModalTitle: {
        fontSize: 22, fontWeight: 'bold', color: COLORS.clayText,
        marginBottom: 8, textAlign: 'center',
    },
    rewardModalDesc: {
        fontSize: 15, color: 'rgba(93,64,55,0.7)',
        textAlign: 'center', marginBottom: 24, lineHeight: 22,
    },
    rewardBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    rewardBtnCancel: {
        backgroundColor: COLORS.clayInset,
        borderWidth: 1, borderColor: 'rgba(93,64,55,0.1)',
    },
    rewardBtnConfirm: {
        backgroundColor: COLORS.clayAccent1,
        shadowColor: COLORS.clayAccent1, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    rewardBtnTextCancel: {
        fontSize: 16, fontWeight: 'bold', color: COLORS.clayText,
    },
    rewardBtnTextConfirm: {
        fontSize: 16, fontWeight: 'bold', color: '#FFF',
    },
    modalCloseBtn: {
        position: 'absolute', top: 0, right: 0, zIndex: 10,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center', justifyContent: 'center',
    },
    modalIconWrap: {
        width: 100, height: 100, borderRadius: 28, alignSelf: 'center',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    modalRareBadge: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: COLORS.yellowBadge, paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 8, borderWidth: 1, borderColor: '#FEF08A',
    },
    modalTitle: {
        fontSize: 20, fontWeight: '800', color: COLORS.clayText,
        textAlign: 'center', marginBottom: 4,
    },
    modalDesc: {
        fontSize: 13, fontWeight: '500', color: 'rgba(93,64,55,0.6)',
        textAlign: 'center', marginBottom: 16, lineHeight: 18,
    },
    modalPriceRow: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 16, padding: 14, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    },
    modalPriceBox: { flex: 1, alignItems: 'center', gap: 4 },
    modalDivider: { width: 1, backgroundColor: 'rgba(93,64,55,0.1)' },
    modalPriceLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(93,64,55,0.5)' },
    modalPriceValue: { fontSize: 20, fontWeight: '900', color: COLORS.clayText },
    warningBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFFBEB', padding: 10, borderRadius: 10, marginBottom: 12,
    },
    warningText: { fontSize: 12, fontWeight: '600', color: '#B45309' },
    stockInfo: { fontSize: 12, fontWeight: '600', color: 'rgba(93,64,55,0.5)', textAlign: 'center', marginBottom: 12 },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalCancelBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    },
    modalCancelText: { fontWeight: '700', color: COLORS.clayText },
    modalRedeemBtn: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
    modalRedeemGradient: {
        paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
        justifyContent: 'center', gap: 6,
    },
    modalRedeemText: { fontWeight: '700', color: '#FFF', fontSize: 15 },

    // ── POST-PURCHASE MODAL ──
    postPurchaseModal: {
        backgroundColor: COLORS.warmBg, borderRadius: 28, padding: 28,
        width: width * 0.85, maxWidth: 380, alignSelf: 'center',
    },
    ppTitle: { fontSize: 22, fontWeight: '900', color: COLORS.clayText, textAlign: 'center', marginBottom: 4 },
    ppSubtitle: { fontSize: 14, fontWeight: '500', color: 'rgba(93,64,55,0.6)', textAlign: 'center', marginBottom: 24 },
    ppActions: { flexDirection: 'row', gap: 10 },
    ppUseLaterBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    ppUseLaterText: { fontWeight: '700', color: COLORS.clayText, fontSize: 13 },
    ppUseNowBtn: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
    ppUseNowGradient: {
        paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
        justifyContent: 'center', gap: 6,
    },
    ppUseNowText: { fontWeight: '700', color: '#FFF', fontSize: 14 },

    // ── INVENTORY MODAL ──
    inventoryOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    inventorySheet: {
        backgroundColor: COLORS.warmBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20,
        maxHeight: '70%',
    },
    inventoryHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    inventoryTitle: { fontSize: 20, fontWeight: '800', color: COLORS.clayText },

    voucherRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)', padding: 14, borderRadius: 16,
        marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    },
    voucherTitle: { fontSize: 15, fontWeight: '700', color: COLORS.clayText },
    voucherCode: {
        fontSize: 11, fontWeight: '600', color: 'rgba(93,64,55,0.4)',
        backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 6, paddingVertical: 1,
        borderRadius: 4, overflow: 'hidden',
    },
    voucherDate: { fontSize: 11, fontWeight: '500', color: 'rgba(93,64,55,0.35)', marginTop: 4 },
    voucherCostBox: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
        backgroundColor: COLORS.yellowBadge, paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, borderWidth: 1, borderColor: '#FEF08A',
    },
    statusBadge: {
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
        backgroundColor: 'rgba(93,64,55,0.08)',
    },
    statusText: { fontSize: 10, fontWeight: '700', color: 'rgba(93,64,55,0.5)' },

    // ── FAB ──
    fab: {
        position: 'absolute', right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35, shadowRadius: 10, elevation: 8, zIndex: 100,
    },
    fabBadge: {
        position: 'absolute', top: 4, right: 4,
        minWidth: 18, height: 18, borderRadius: 9,
        backgroundColor: COLORS.clayAccent2, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    fabBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
});
