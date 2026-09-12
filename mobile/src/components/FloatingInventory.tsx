import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Animated, Dimensions, StyleSheet, Alert, Image } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { InventoryItem, Voucher } from '../types';
import { COLORS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 48) / 4; // 4 columns with padding

export default function FloatingInventory() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'kho' | 'pending' | 'delivered'>('kho');

    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filtered data
    const pendingVouchers = vouchers.filter(v => v.status === 'pending_use');
    const deliveredVouchers = vouchers.filter(v => v.status === 'used');
    const unusedVouchers = vouchers.filter(v => v.status === 'active');

    // Box Opening Animation
    const boxScale = useRef(new Animated.Value(1)).current;
    const boxRotate = useRef(new Animated.Value(0)).current;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invRes, voucherRes] = await Promise.all([
                apiService.getInventory(),
                apiService.getMyVouchers()
            ]);
            setInventoryItems(invRes.inventory || []);
            setVouchers(voucherRes.vouchers || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        if (visible) {
            fetchData();
        }
    }, [visible]);

    const handleExchangeFragment = async (item: InventoryItem) => {
        try {
            const res = await apiService.exchangeFragment(item.specialItem?._id || (item.specialItem as unknown as string));
            Alert.alert('Thành công!', res.message || 'Bạn đã đổi vật phẩm thành công!');
            fetchData();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.error || e.message);
        }
    };

    const handleUseSpecialItem = async (item: InventoryItem) => {
        try {
            const res = await apiService.useItem(item.specialItem?._id || (item.specialItem as unknown as string));
            Alert.alert('Thành công!', res.message || 'Sử dụng thành công!');
            fetchData();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.error || e.message);
        }
    };

    const handleOpenBox = async (item: InventoryItem) => {
        // Animation
        Animated.sequence([
            Animated.timing(boxScale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(boxRotate, { toValue: 1, duration: 50, useNativeDriver: true }),
                    Animated.timing(boxRotate, { toValue: -1, duration: 100, useNativeDriver: true }),
                    Animated.timing(boxRotate, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]),
                { iterations: 3 }
            )
        ]).start(async () => {
            try {
                const res = await apiService.openMysteryBox(item.itemType);
                Animated.timing(boxScale, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                    Alert.alert('Thành công!', `Bạn nhận được: ${res.reward.displayName}`);
                    fetchData();
                    boxScale.setValue(1);
                });
            } catch (e: any) {
                Alert.alert('Lỗi', e.response?.data?.error || 'Không thể mở hộp');
                boxScale.setValue(1);
            }
        });
    };

    const handleUseVoucher = async (code: string) => {
        try {
            await apiService.useVoucher(code);
            Alert.alert('Thành công', 'Đã yêu cầu giao hàng. Vui lòng kiểm tra tab "Chờ Giao".');
            fetchData();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.error || e.message);
        }
    };

    // --- RENDER TABS ---
    const renderKho = () => {
        const gridItems = [
            ...inventoryItems.map(i => ({ type: 'inventory', data: i })),
            ...unusedVouchers.map(v => ({ type: 'voucher', data: v }))
        ];

        if (gridItems.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <MaterialIcons name="inventory-2" size={40} color="rgba(93,64,55,0.15)" />
                    <Text style={styles.emptyText}>Kho đồ của bạn đang trống.</Text>
                </View>
            );
        }

        return (
            <View style={styles.gridContainer}>
                {gridItems.map((wrapped, index) => {
                    if (wrapped.type === 'inventory') {
                        const item = wrapped.data as InventoryItem;
                        const isBox = item.itemType.startsWith('box_');
                        const sp = item.specialItem;
                        const isFragment = item.rewardForm === 'fragment';
                        const reqFrag = sp?.requiredFragments || 10;
                        const canExchange = isFragment && item.quantity >= reqFrag;

                        // Identify icons/colors
                        let iconName = 'stars';
                        let color = '#F59E0B';
                        if (isBox) { iconName = 'unarchive'; color = '#8B5CF6'; }
                        else if (sp?.type === 'coin') { iconName = 'monetization-on'; color = '#F59E0B'; }
                        else if (sp?.type === 'exp') { iconName = 'school'; color = '#3B82F6'; }
                        else if (sp?.type === 'gacha_ticket') { iconName = 'local-activity'; color = '#EF4444'; }
                        else if (sp?.type === 'free_ship' || sp?.type === 'discount_ticket') { iconName = 'local-offer'; color = '#10B981'; }

                        const rotation = boxRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });

                        return (
                            <View key={`inv-${index}`} style={styles.gridItem}>
                                <View style={styles.gridItemInner}>
                                    <View style={styles.quantityBadge}>
                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                    </View>

                                    {sp?.imageUrl ? (
                                        <Image source={{ uri: sp.imageUrl }} style={{ width: 32, height: 32, marginBottom: 8 }} />
                                    ) : (
                                        <Animated.View style={isBox ? { transform: [{ scale: boxScale }, { rotate: rotation }] } : {}}>
                                            <MaterialIcons name={iconName as any} size={32} color={color} style={{ marginBottom: 8 }} />
                                        </Animated.View>
                                    )}
                                    <Text style={styles.gridItemName} numberOfLines={2}>{item.displayName || sp?.name}</Text>
                                    
                                    {/* Actions */}
                                    <View style={{ marginTop: 'auto', paddingTop: 8, width: '100%' }}>
                                        {isBox && (
                                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenBox(item)}>
                                                <Text style={styles.actionBtnText}>Mở</Text>
                                            </TouchableOpacity>
                                        )}
                                        {!isBox && isFragment && canExchange && (
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => handleExchangeFragment(item)}>
                                                <Text style={styles.actionBtnText}>Đổi</Text>
                                            </TouchableOpacity>
                                        )}
                                        {!isBox && isFragment && !canExchange && (
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={styles.progressText}>{item.quantity}/{reqFrag}</Text>
                                            </View>
                                        )}
                                        {!isBox && !isFragment && ['coin', 'exp', 'gacha_ticket'].includes(sp?.type || '') && (
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]} onPress={() => handleUseSpecialItem(item)}>
                                                <Text style={styles.actionBtnText}>Dùng</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    } else {
                        // Voucher
                        const voucher = wrapped.data as Voucher;
                        return (
                            <View key={`vou-${index}`} style={styles.gridItem}>
                                <View style={styles.gridItemInner}>
                                    {voucher.reward?.imageUrl ? (
                                        <Image source={{ uri: voucher.reward.imageUrl }} style={{ width: 32, height: 32, marginBottom: 8 }} resizeMode="cover" />
                                    ) : (
                                        <FontAwesome5 name="box-open" size={28} color="#F57799" style={{ marginBottom: 8 }} />
                                    )}
                                    <Text style={styles.gridItemName} numberOfLines={2}>{voucher.reward?.title || voucher.rewardTitleSnapshot}</Text>
                                    <View style={{ marginTop: 'auto', paddingTop: 8, width: '100%' }}>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F57799' }]} onPress={() => handleUseVoucher(voucher.code)}>
                                            <Text style={styles.actionBtnText}>Giao Hàng</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    }
                })}
            </View>
        );
    };

    const renderVoucherList = (list: Voucher[], emptyMsg: string) => {
        if (list.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{emptyMsg}</Text>
                </View>
            );
        }
        return (
            <View style={{ gap: 12 }}>
                {list.map(v => (
                    <View key={v.code} style={styles.voucherCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.voucherTitle}>{v.reward?.title || v.rewardTitleSnapshot}</Text>
                            <Text style={styles.voucherCode}>{v.code}</Text>
                            <Text style={styles.voucherDate}>Từ: {new Date(v.createdAt || v.purchaseDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.voucherStatusBox}>
                            <MaterialIcons name={v.status === 'pending_use' ? 'access-time' : 'check-circle'} size={16} color={v.status === 'pending_use' ? '#F59E0B' : '#10B981'} style={{ marginRight: 4 }} />
                            <Text style={{ color: v.status === 'pending_use' ? '#F59E0B' : '#10B981', fontWeight: 'bold', fontSize: 12 }}>
                                {v.status === 'pending_use' ? 'Đang chuẩn bị' : 'Hoàn tất'}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <>
            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: 90 + insets.bottom }]}
                activeOpacity={0.85}
                onPress={() => setVisible(true)}
            >
                <MaterialIcons name="inventory-2" size={26} color="#FFF" />
                {pendingVouchers.length > 0 && (
                    <View style={styles.fabBadge}>
                        <Text style={styles.fabBadgeText}>{pendingVouchers.length}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* MODAL */}
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setVisible(false)} />
                    <View style={styles.modalSheet}>
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(93,64,55,0.15)' }} />
                        </View>
                        
                        <View style={styles.header}>
                            <Text style={styles.title}>📦 Kho đồ của bạn</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={styles.tabsWrapper}>
                            <TouchableOpacity style={[styles.tab, activeTab === 'kho' && styles.tabActive]} onPress={() => setActiveTab('kho')}>
                                <Text style={[styles.tabText, activeTab === 'kho' && styles.tabTextActive]}>Kho Đồ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.tabActive]} onPress={() => setActiveTab('pending')}>
                                <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Đang Chờ Giao</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, activeTab === 'delivered' && styles.tabActive]} onPress={() => setActiveTab('delivered')}>
                                <Text style={[styles.tabText, activeTab === 'delivered' && styles.tabTextActive]}>Đã Giao</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                            {activeTab === 'kho' && renderKho()}
                            {activeTab === 'pending' && renderVoucherList(pendingVouchers, 'Không có đơn nào đang chờ giao.')}
                            {activeTab === 'delivered' && renderVoucherList(deliveredVouchers, 'Chưa có đơn nào đã giao thành công.')}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4,
        shadowRadius: 16, elevation: 8, borderWidth: 2, borderColor: '#FFF', zIndex: 999
    },
    fabBadge: {
        position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444',
        minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
        borderWidth: 1.5, borderColor: '#FFF'
    },
    fabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#FFF9D2', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        height: '85%', paddingTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.clayText },
    
    tabsWrapper: {
        flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(93,64,55,0.1)'
    },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#F59E0B' },
    tabText: { fontSize: 13, color: 'rgba(93,64,55,0.6)', fontWeight: '600' },
    tabTextActive: { color: '#F59E0B', fontWeight: 'bold' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    gridItem: {
        width: ITEM_SIZE, backgroundColor: '#FFF', borderRadius: 16,
        padding: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2
    },
    gridItemInner: { flex: 1, alignItems: 'center' },
    quantityBadge: {
        position: 'absolute', top: -4, right: -4, backgroundColor: '#F59E0B', borderRadius: 8,
        paddingHorizontal: 6, paddingVertical: 2, zIndex: 1
    },
    quantityText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    gridItemName: { fontSize: 11, fontWeight: 'bold', color: COLORS.clayText, textAlign: 'center', lineHeight: 14, minHeight: 28 },
    
    actionBtn: { width: '100%', backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
    actionBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    progressText: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold' },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { marginTop: 12, fontSize: 15, color: 'rgba(93,64,55,0.6)' },

    voucherCard: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2
    },
    voucherTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.clayText, marginBottom: 4 },
    voucherCode: { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', marginBottom: 4 },
    voucherDate: { fontSize: 12, color: '#94A3B8' },
    voucherStatusBox: { backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }
});
