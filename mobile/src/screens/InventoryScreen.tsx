import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { InventoryItem } from '../types';
import { COLORS, FONT_SIZES, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 48) / 4; // 4 columns, 24 padding horizontal, 16 gap

export default function InventoryScreen() {
    const navigation = useNavigation<any>();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Animation for box opening
    const boxScale = useRef(new Animated.Value(1)).current;
    const boxRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const res = await apiService.getInventory();
            setInventory(res.inventory || []);
        } catch (e) {
            console.error('Failed to load inventory', e);
        } finally {
            setLoading(false);
        }
    };

    const handleItemPress = (item: InventoryItem) => {
        setSelectedItem(item);
    };

    const closeSheet = () => {
        setSelectedItem(null);
    };

    const openBox = async () => {
        if (!selectedItem) return;
        setIsProcessing(true);
        try {
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
                    const res = await apiService.openMysteryBox(selectedItem.itemType);
                    
                    Animated.timing(boxScale, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                        Alert.alert('Thành công!', `Bạn nhận được: ${res.reward.displayName}`);
                        closeSheet();
                        loadInventory();
                        boxScale.setValue(1);
                    });
                } catch (e: any) {
                    Alert.alert('Lỗi', e.message || 'Không thể mở hộp');
                    boxScale.setValue(1);
                    closeSheet();
                }
            });
        } catch (e) {
            setIsProcessing(false);
        } finally {
            setTimeout(() => setIsProcessing(false), 2000);
        }
    };

    const exchangeFragment = async () => {
        if (!selectedItem) return;
        setIsProcessing(true);
        try {
            await apiService.exchangeFragment(selectedItem.itemType);
            Alert.alert('Thành công!', 'Bạn đã đổi Voucher thành công! Kiểm tra trong Cửa hàng nhé.');
            closeSheet();
            loadInventory();
        } catch (e: any) {
            Alert.alert('Lỗi', e.message || 'Không thể đổi mảnh');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderGridItem = (item: InventoryItem) => {
        const isFragment = item.itemType.startsWith('frag_');
        const isCoupon = item.itemType.startsWith('coupon_');
        
        return (
            <TouchableOpacity 
                key={item.itemType} 
                style={[styles.gridItem, { borderColor: isFragment ? item.color : '#FFFDF5' }]}
                onPress={() => handleItemPress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: isFragment ? `${item.color}20` : '#F3E8FF' }]}>
                    <MaterialIcons 
                        name={isFragment ? 'extension' : isCoupon ? 'local-offer' : 'card-giftcard'} 
                        size={28} 
                        color={isFragment ? item.color : '#9333EA'} 
                    />
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{item.displayName}</Text>
                <Text style={styles.itemQuantity}>Số lượng: {item.quantity}</Text>
                
                {isFragment && item.canExchange && (
                    <TouchableOpacity 
                        style={styles.inlineRedeemBtn}
                        onPress={() => {
                            setSelectedItem(item);
                            setTimeout(exchangeFragment, 100);
                        }}
                    >
                        <Text style={styles.inlineRedeemText}>Đổi</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderBottomSheet = () => {
        if (!selectedItem) return null;
        
        const isFragment = selectedItem.itemType.startsWith('frag_');
        const isReady = selectedItem.canExchange;

        const rotateInterpolation = boxRotate.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-10deg', '10deg']
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
                                <Text style={styles.fragWaitText}>Đủ số lượng để đổi lấy mã giảm giá!</Text>
                            ) : (
                                <Text style={styles.fragWaitText}>Chưa đủ số lượng để quy đổi.</Text>
                            )}

                            <View style={styles.sheetActions}>
                                {isReady && (
                                    <TouchableOpacity style={styles.btnPrimary} onPress={exchangeFragment} disabled={isProcessing}>
                                        {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextPrimary}>Đổi Ngay!</Text>}
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.btnSecondary} onPress={closeSheet} disabled={isProcessing}>
                                    <Text style={styles.btnTextSecondary}>Để Dành</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : selectedItem.itemType.startsWith('coupon_') ? (
                        <View style={styles.boxDetails}>
                            <MaterialIcons name="local-offer" size={80} color="#9333EA" />
                            <Text style={styles.boxPrompt}>Đây là mã giảm giá của bạn. Nó sẽ được tự động áp dụng khi mua hàng trong Cửa Hàng.</Text>
                            <View style={styles.sheetActions}>
                                <TouchableOpacity style={styles.btnSecondary} onPress={closeSheet}>
                                    <Text style={styles.btnTextSecondary}>Đóng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
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

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.clayAccent1} style={{ marginTop: 50 }} />
            ) : inventory.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="inventory" size={64} color="rgba(93, 64, 55, 0.2)" />
                    <Text style={styles.emptyText}>Kho của bạn đang trống</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.grid}>
                    {inventory.map(renderGridItem)}
                </ScrollView>
            )}

            {renderBottomSheet()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { fontSize: FONT_SIZES.title, fontWeight: 'bold', color: COLORS.clayText },
    backBtn: { padding: 8, marginLeft: -8 },
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
    inlineRedeemBtn: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, ...SHADOWS.clayLight },
    inlineRedeemText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 16, fontSize: FONT_SIZES.body, color: 'rgba(93, 64, 55, 0.4)', fontWeight: 'bold' },
    
    // Bottom Sheet
    bottomSheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 10 },
    bottomSheetBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    bottomSheetContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, ...SHADOWS.clay },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sheetTitle: { fontSize: FONT_SIZES.title, fontWeight: 'bold', color: COLORS.clayText },
    
    // Fragment Sheet
    fragmentDetails: { alignItems: 'center' },
    fragProgressText: { fontSize: FONT_SIZES.body, color: COLORS.clayText, fontWeight: 'bold', marginBottom: 8, alignSelf: 'flex-start' },
    progressBarBg: { width: '100%', height: 12, backgroundColor: '#F0F0F0', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
    progressBarFill: { height: '100%', borderRadius: 6 },
    fragReadyText: { fontSize: FONT_SIZES.body, color: '#10B981', fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
    fragWaitText: { fontSize: FONT_SIZES.body, color: 'rgba(93, 64, 55, 0.6)', marginBottom: 24, textAlign: 'center' },
    
    // Box Sheet
    boxDetails: { alignItems: 'center' },
    boxPrompt: { fontSize: FONT_SIZES.body, color: COLORS.clayText, fontWeight: 'bold', marginVertical: 24, textAlign: 'center' },
    
    // Actions
    sheetActions: { flexDirection: 'row', gap: 12, width: '100%' },
    btnPrimary: { flex: 1, backgroundColor: COLORS.clayAccent1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...SHADOWS.clayLight },
    btnTextPrimary: { color: '#FFF', fontSize: FONT_SIZES.subtitle, fontWeight: 'bold' },
    btnSecondary: { flex: 1, backgroundColor: '#F0F0F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    btnTextSecondary: { color: COLORS.clayText, fontSize: FONT_SIZES.subtitle, fontWeight: 'bold' },
});
