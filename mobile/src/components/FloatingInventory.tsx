import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { InventoryItem, Voucher } from '../types';
import { COLORS } from '../theme';
import {
    InventoryFilterChips,
    InventoryFilterType,
    InventoryCategoryCounts,
    InventoryItemCard,
    WrappedInventoryItem,
    InventoryVoucherList,
    MysteryBoxOpenModal,
} from './warehouse';

export default function FloatingInventory() {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'kho' | 'pending' | 'delivered'>('kho');
    const [activeFilter, setActiveFilter] = useState<InventoryFilterType>('all');

    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Mystery box opening modal state
    const [openingBox, setOpeningBox] = useState<{
        boxId: string;
        name: string;
        rarity?: string;
        quantity: number;
    } | null>(null);

    // Filtered voucher subsets
    const pendingVouchers = vouchers.filter((v) => v.status === 'pending_use');
    const deliveredVouchers = vouchers.filter((v) => v.status === 'used');
    const unusedVouchers = vouchers.filter((v) => v.status === 'active');

    const fetchData = useCallback(async () => {
        try {
            const [invRes, voucherRes] = await Promise.all([
                apiService.getInventory(),
                apiService.getMyVouchers(),
            ]);
            setInventoryItems(invRes.inventory || []);
            setVouchers(voucherRes.vouchers || []);
        } catch (e) {
            console.error('Failed to fetch inventory:', e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    useEffect(() => {
        if (visible) {
            fetchData();
        }
    }, [visible, fetchData]);

    // Actions
    const handleExchangeFragment = async (item: InventoryItem) => {
        const specialId = (item.specialItem?._id as string) || (item.specialItem as unknown as string) || item.id || '';
        try {
            const res = await apiService.exchangeFragment(specialId);
            Alert.alert('Thành công!', res.message || 'Bạn đã đổi vật phẩm thành công!');
            fetchData();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.error || e.message);
        }
    };

    const handleUseSpecialItem = async (item: InventoryItem) => {
        const specialId = (item.specialItem?._id as string) || (item.specialItem as unknown as string) || item.id || '';
        try {
            const res = await apiService.useItem(specialId);
            Alert.alert('Thành công!', res.message || 'Sử dụng thành công!');
            fetchData();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.error || e.message);
        }
    };

    const handleOpenBoxClick = (item: InventoryItem) => {
        const boxId = item.boxId || item.id || (item.specialItem?._id as string) || '';
        setOpeningBox({
            boxId,
            name: item.displayName || 'Hộp Quà Bí Ẩn',
            rarity: item.rarity,
            quantity: item.quantity,
        });
    };

    const handleUseVoucher = async (voucher: Voucher) => {
        const code = voucher.code;
        if (loadingAction === code) return;
        setLoadingAction(code);
        try {
            await apiService.useVoucher(code);
            Alert.alert('Thành công', 'Đã chuyển sang trạng thái chờ giao hàng.');
            fetchData();
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể thao tác.');
        } finally {
            setLoadingAction(null);
        }
    };

    // Category calculation
    const allGridItems: WrappedInventoryItem[] = [
        ...inventoryItems.map((i) => ({ type: 'inventory' as const, data: i })),
        ...unusedVouchers.map((v) => ({ type: 'voucher' as const, data: v })),
    ];

    const isBoxItem = (inv: InventoryItem) =>
        inv.itemType === 'mystery_box' ||
        (typeof inv.itemType === 'string' && inv.itemType.startsWith('box_')) ||
        !!inv.boxId;

    const counts: InventoryCategoryCounts = {
        all: allGridItems.length,
        fragments: allGridItems.filter((i) => i.type === 'inventory' && i.data.rewardForm === 'fragment').length,
        boxes: allGridItems.filter((i) => i.type === 'inventory' && isBoxItem(i.data)).length,
        items: allGridItems.filter(
            (i) => i.type === 'voucher' || (i.type === 'inventory' && i.data.rewardForm !== 'fragment' && !isBoxItem(i.data))
        ).length,
    };

    const readyFragmentsCount = inventoryItems.filter(
        (i) => i.rewardForm === 'fragment' && i.quantity >= ((i.specialItem?.requiredFragments as number) || 10)
    ).length;

    const totalBadgeCount = pendingVouchers.length + counts.boxes + readyFragmentsCount;

    const filteredGridItems = allGridItems.filter((item) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'fragments') return item.type === 'inventory' && item.data.rewardForm === 'fragment';
        if (activeFilter === 'boxes') return item.type === 'inventory' && isBoxItem(item.data);
        if (activeFilter === 'items') {
            return (
                item.type === 'voucher' ||
                (item.type === 'inventory' && item.data.rewardForm !== 'fragment' && !isBoxItem(item.data))
            );
        }
        return true;
    });

    const renderEmptyState = () => {
        let msg = 'Kho đồ của bạn đang trống.';
        if (activeFilter === 'fragments') msg = 'Chưa có mảnh ghép nào. Hãy hoàn thành nhiệm vụ để thu thập!';
        if (activeFilter === 'boxes') msg = 'Kho đồ chưa có rương nào. Hãy quay Vòng Quay May Mắn để săn rương!';
        if (activeFilter === 'items') msg = 'Chưa có vật phẩm hoặc voucher nào.';

        return (
            <View style={styles.emptyState}>
                <MaterialIcons name="inventory-2" size={40} color="rgba(93,64,55,0.18)" />
                <Text style={styles.emptyText}>{msg}</Text>
            </View>
        );
    };

    const renderKho = () => (
        <View>
            <InventoryFilterChips
                activeFilter={activeFilter}
                counts={counts}
                onSelectFilter={setActiveFilter}
            />

            {filteredGridItems.length === 0 ? (
                renderEmptyState()
            ) : (
                <View style={styles.gridContainer}>
                    {filteredGridItems.map((wrapped, index) => {
                        const key =
                            wrapped.type === 'inventory'
                                ? `inv-${wrapped.data.id || wrapped.data.displayName || index}`
                                : `vou-${wrapped.data.code}`;

                        return (
                            <View key={key} style={styles.gridItemWrapper}>
                                <InventoryItemCard
                                    item={wrapped}
                                    onOpenBox={handleOpenBoxClick}
                                    onExchangeFragment={handleExchangeFragment}
                                    onUseItem={handleUseSpecialItem}
                                    onUseVoucher={handleUseVoucher}
                                    loadingAction={loadingAction}
                                />
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );

    return (
        <>
            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { bottom: 90 + insets.bottom }]}
                activeOpacity={0.85}
                onPress={() => setVisible(true)}
            >
                <MaterialIcons name="inventory-2" size={26} color="#FFFFFF" />
                {totalBadgeCount > 0 && (
                    <View style={styles.fabBadge}>
                        <Text style={styles.fabBadgeText}>{totalBadgeCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Main Warehouse Modal Sheet */}
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setVisible(false)}
                    />
                    <View style={styles.modalSheet}>
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <View style={styles.sheetHandle} />
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>📦 Kho đồ của bạn</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                            </TouchableOpacity>
                        </View>

                        {/* Top Level Tabs */}
                        <View style={styles.tabsWrapper}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'kho' && styles.tabActive]}
                                onPress={() => setActiveTab('kho')}
                            >
                                <Text style={[styles.tabText, activeTab === 'kho' && styles.tabTextActive]}>
                                    Kho Đồ
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
                                onPress={() => setActiveTab('pending')}
                            >
                                <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                                    Đang Chờ Giao
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'delivered' && styles.tabActive]}
                                onPress={() => setActiveTab('delivered')}
                            >
                                <Text style={[styles.tabText, activeTab === 'delivered' && styles.tabTextActive]}>
                                    Đã Giao
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                        >
                            {activeTab === 'kho' && renderKho()}
                            {activeTab === 'pending' && (
                                <InventoryVoucherList
                                    list={pendingVouchers}
                                    emptyMsg="Không có đơn nào đang chờ giao."
                                />
                            )}
                            {activeTab === 'delivered' && (
                                <InventoryVoucherList
                                    list={deliveredVouchers}
                                    emptyMsg="Chưa có đơn nào đã giao thành công."
                                />
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Mystery Box Opening Animation Modal */}
            <MysteryBoxOpenModal
                visible={!!openingBox}
                box={openingBox}
                onClose={() => setOpeningBox(null)}
                onSuccess={() => {
                    fetchData();
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        zIndex: 999,
    },
    fabBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    fabBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#FFF9D2',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        paddingTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(93,64,55,0.15)' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 14,
    },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.clayText },
    tabsWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(93,64,55,0.1)',
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: '#F59E0B' },
    tabText: { fontSize: 13, color: 'rgba(93,64,55,0.6)', fontWeight: '600' },
    tabTextActive: { color: '#F59E0B', fontWeight: 'bold' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItemWrapper: { width: '31%', minWidth: 96, marginBottom: 4 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    emptyText: { marginTop: 12, fontSize: 14, color: 'rgba(93,64,55,0.6)', textAlign: 'center', lineHeight: 20 },
});
