import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { InventoryItem } from '../types';
import { COLORS, FONT_SIZES, SHADOWS } from '../theme';
import { MysteryBoxOpenModal } from '../components/warehouse';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 48) / 4; // 4 columns, 24 padding horizontal, 16 gap

const isFragmentItem = (item: InventoryItem): boolean =>
    item.rewardForm === 'fragment' || item.itemType.startsWith('frag_');

const isCouponItem = (item: InventoryItem): boolean =>
    Boolean(item.type?.startsWith('coupon_') || item.type === 'freeship' || item.itemType.startsWith('coupon_')) &&
    !isFragmentItem(item);

const isMysteryBoxItem = (item: InventoryItem): boolean =>
    item.itemType === 'mystery_box';

export default function InventoryScreen() {
    const navigation = useNavigation<any>();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'items' | 'coupons'>('all');
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMysteryBox, setSelectedMysteryBox] = useState<{
        boxId: string;
        name: string;
        rarity?: string;
        quantity: number;
        imageUrl?: string;
    } | null>(null);

    const boxScale = useRef(new Animated.Value(1)).current;
    const boxRotate = useRef(new Animated.Value(0)).current;

    const loadInventory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiService.getInventory();
            setInventory((res.inventory || []).filter((item: InventoryItem) => item.quantity > 0));
        } catch (e) {
            console.error('Failed to load inventory', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadInventory();
        }, [loadInventory])
    );

    const handleItemPress = (item: InventoryItem) => {
        if (isMysteryBoxItem(item)) {
            setSelectedMysteryBox({
                boxId: item.boxId || item.id || item.itemType,
                name: item.displayName,
                quantity: item.quantity,
                rarity: item.rarity,
                imageUrl: item.imageUrl,
            });
            return;
        }
        setSelectedItem(item);
    };

    const closeSheet = () => {
        setSelectedItem(null);
    };

    const openBox = () => {
        if (!selectedItem) return;
        const boxToOpen = {
            boxId: selectedItem.boxId || selectedItem.id || selectedItem.itemType,
            name: selectedItem.displayName,
            quantity: selectedItem.quantity,
            rarity: selectedItem.rarity,
            imageUrl: selectedItem.imageUrl,
        };
        closeSheet();
        setSelectedMysteryBox(boxToOpen);
    };

    const exchangeFragment = async (targetItem: InventoryItem) => {
        setIsProcessing(true);
        try {
            const fragmentId = targetItem.specialItem?._id || targetItem.id || targetItem.itemType;
            await apiService.exchangeFragment(fragmentId);
            Alert.alert('Thành công!', 'Bạn đã đổi Voucher thành công! Kiểm tra trong Cửa hàng nhé.');
            closeSheet();
            loadInventory();
        } catch (e: any) {
            Alert.alert('Lỗi', e.message || 'Không thể đổi mảnh');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUseItem = async () => {
        if (!selectedItem) return;
        setIsProcessing(true);
        try {
            const itemId = selectedItem.specialItem?._id || selectedItem.id || '';
            await apiService.useItem(itemId);
            Alert.alert('Thành công', `Đã sử dụng ${selectedItem.displayName}!`);
            closeSheet();
            loadInventory();
        } catch (e: any) {
            Alert.alert('Lỗi', e.message || 'Không thể sử dụng vật phẩm');
        } finally {
            setIsProcessing(false);
        }
    };

    const displayedItems = inventory.filter((item) => {
        if (activeTab === 'items') return !isCouponItem(item);
        if (activeTab === 'coupons') return isCouponItem(item);
        return true;
    });

    const renderGridItem = (item: InventoryItem) => {
        const isFragment = isFragmentItem(item);
        const isCoupon = isCouponItem(item);
        const isBox = isMysteryBoxItem(item);
        const uniqueKey = `${item.itemType}-${item.boxId || item.id || item.displayName}-${item.rewardForm || 'full'}`;

        return (
            <TouchableOpacity
                key={uniqueKey}
                style={[styles.gridItem, { borderColor: isFragment ? item.color : '#FFFDF5' }]}
                onPress={() => handleItemPress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: isFragment ? `${item.color}20` : '#F3E8FF' }]}>
                    <MaterialIcons
                        name={isFragment ? 'extension' : isCoupon ? 'local-offer' : isBox ? 'card-giftcard' : 'stars'}
                        size={28}
                        color={isFragment ? item.color : isCoupon ? '#EAB308' : '#9333EA'}
                    />
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{item.displayName}</Text>
                <Text style={styles.itemQuantity}>SL: {item.quantity}</Text>

                {isCoupon && (
                    <View style={styles.couponBadge}>
                        <Text style={styles.couponBadgeText}>
                            {item.type?.includes('freeship') ? 'FREESHIP' : 'GIẢM GIÁ'}
                        </Text>
                    </View>
                )}

                {isFragment && item.canExchange && (
                    <TouchableOpacity
                        style={styles.inlineRedeemBtn}
                        onPress={() => exchangeFragment(item)}
                    >
                        <Text style={styles.inlineRedeemText}>Đổi</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderBottomSheet = () => {
        if (!selectedItem) return null;

        const isFragment = isFragmentItem(selectedItem);
        const isCoupon = isCouponItem(selectedItem);
        const isBox = isMysteryBoxItem(selectedItem);
        const isReady = selectedItem.canExchange;

        const rotateInterpolation = boxRotate.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-10deg', '10deg'],
        });

        return (
            <View style={styles.bottomSheetOverlay}>
                <TouchableOpacity style={styles.bottomSheetBg} onPress={closeSheet} disabled={isProcessing} />
                <View style={styles.bottomSheetContent}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>{selectedItem.displayName}</Text>
                        <TouchableOpacity onPress={closeSheet} disabled={isProcessing}>
                            <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                        </TouchableOpacity>
                    </View>

                    {isFragment ? (
                        <View style={styles.fragmentDetails}>
                            <Text style={styles.fragReadyText}>Bạn đang có {selectedItem.quantity} mảnh này.</Text>
                            {isReady ? (
                                <Text style={styles.fragWaitText}>Đủ số lượng để đổi lấy vật phẩm!</Text>
                            ) : (
                                <Text style={styles.fragWaitText}>Chưa đủ số lượng để quy đổi.</Text>
                            )}
                            <View style={styles.sheetActions}>
                                {isReady && (
                                    <TouchableOpacity style={styles.btnPrimary} onPress={() => exchangeFragment(selectedItem)} disabled={isProcessing}>
                                        {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextPrimary}>Đổi Ngay!</Text>}
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.btnSecondary} onPress={closeSheet} disabled={isProcessing}>
                                    <Text style={styles.btnTextSecondary}>Để Dành</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : isCoupon ? (
                        <View style={styles.boxDetails}>
                            <MaterialIcons name="local-offer" size={80} color="#EAB308" />
                            <Text style={styles.boxPrompt}>Đây là vé giảm giá của bạn. Nó sẽ được tự động gợi ý khi mua hàng trong Cửa Hàng.</Text>
                            <View style={styles.sheetActions}>
                                <TouchableOpacity style={styles.btnSecondary} onPress={closeSheet}>
                                    <Text style={styles.btnTextSecondary}>Đóng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : isBox ? (
                        <View style={styles.boxDetails}>
                            <Animated.View style={{ transform: [{ scale: boxScale }, { rotate: rotateInterpolation }] }}>
                                <MaterialIcons name="card-giftcard" size={80} color="#9333EA" />
                            </Animated.View>
                            <Text style={styles.boxPrompt}>Bạn có muốn mở hộp quà này không?</Text>
                            <View style={styles.sheetActions}>
                                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#9333EA' }]} onPress={openBox} disabled={isProcessing}>
                                    {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextPrimary}>Mở Hộp</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnSecondary} onPress={closeSheet} disabled={isProcessing}>
                                    <Text style={styles.btnTextSecondary}>Để Dành</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.boxDetails}>
                            <MaterialIcons name="stars" size={80} color={COLORS.clayAccent2} />
                            <Text style={styles.boxPrompt}>Vật phẩm đặc biệt. Sử dụng để nhận thưởng ngay!</Text>
                            <View style={styles.sheetActions}>
                                <TouchableOpacity style={styles.btnPrimary} onPress={handleUseItem} disabled={isProcessing}>
                                    {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextPrimary}>Sử Dụng</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnSecondary} onPress={closeSheet} disabled={isProcessing}>
                                    <Text style={styles.btnTextSecondary}>Đóng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.clayText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kho của bạn</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'items' && styles.tabBtnActive]}
                    onPress={() => setActiveTab('items')}
                >
                    <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>Vật phẩm & Rương</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'coupons' && styles.tabBtnActive]}
                    onPress={() => setActiveTab('coupons')}
                >
                    <Text style={[styles.tabText, activeTab === 'coupons' && styles.tabTextActive]}>Vé & Voucher</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.clayAccent1} style={{ marginTop: 50 }} />
            ) : displayedItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="inventory" size={64} color="rgba(93, 64, 55, 0.2)" />
                    <Text style={styles.emptyText}>Mục này đang trống</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.grid}>
                    {displayedItems.map(renderGridItem)}
                </ScrollView>
            )}

            {renderBottomSheet()}

            <MysteryBoxOpenModal
                visible={!!selectedMysteryBox}
                box={selectedMysteryBox}
                onClose={() => setSelectedMysteryBox(null)}
                onSuccess={() => loadInventory()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
    headerTitle: { fontSize: FONT_SIZES.title, fontWeight: 'bold', color: COLORS.clayText },
    backBtn: { padding: 8, marginLeft: -8 },
    tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8, gap: 8 },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(93,64,55,0.08)' },
    tabBtnActive: { backgroundColor: COLORS.clayAccent2, borderColor: COLORS.clayAccent2 },
    tabText: { fontSize: 11, fontWeight: '600', color: COLORS.clayText },
    tabTextActive: { color: '#FFF', fontWeight: 'bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 24 },
    gridItem: {
        width: ITEM_SIZE,
        aspectRatio: 0.8,
        backgroundColor: '#FFFDF5',
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        ...SHADOWS.clayLight,
    },
    iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    itemName: { fontSize: 10, fontWeight: 'bold', color: COLORS.clayText, textAlign: 'center', marginBottom: 4 },
    itemQuantity: { fontSize: 10, color: 'rgba(93, 64, 55, 0.5)', fontWeight: 'bold', marginBottom: 6 },
    couponBadge: { backgroundColor: '#FEF08A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    couponBadgeText: { fontSize: 8, fontWeight: 'bold', color: '#854D0E' },
    inlineRedeemBtn: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, ...SHADOWS.clayLight },
    inlineRedeemText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 16, fontSize: FONT_SIZES.body, color: 'rgba(93, 64, 55, 0.4)', fontWeight: 'bold' },
    bottomSheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 10 },
    bottomSheetBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    bottomSheetContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, ...SHADOWS.clay },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sheetTitle: { fontSize: FONT_SIZES.title, fontWeight: 'bold', color: COLORS.clayText },
    fragmentDetails: { alignItems: 'center' },
    fragReadyText: { fontSize: FONT_SIZES.body, color: '#10B981', fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
    fragWaitText: { fontSize: FONT_SIZES.body, color: 'rgba(93, 64, 55, 0.6)', marginBottom: 24, textAlign: 'center' },
    boxDetails: { alignItems: 'center' },
    boxPrompt: { fontSize: FONT_SIZES.body, color: COLORS.clayText, fontWeight: 'bold', marginVertical: 24, textAlign: 'center' },
    sheetActions: { flexDirection: 'row', gap: 12, width: '100%' },
    btnPrimary: { flex: 1, backgroundColor: COLORS.clayAccent1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...SHADOWS.clayLight },
    btnTextPrimary: { color: '#FFF', fontSize: FONT_SIZES.subtitle, fontWeight: 'bold' },
    btnSecondary: { flex: 1, backgroundColor: '#F0F0F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    btnTextSecondary: { color: COLORS.clayText, fontSize: FONT_SIZES.subtitle, fontWeight: 'bold' },
});
