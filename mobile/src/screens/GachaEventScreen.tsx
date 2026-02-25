import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import LuckyWheel from '../components/LuckyWheel';
import RewardCelebrationModal from '../components/RewardCelebrationModal';
import ClayHeader from '../components/ClayHeader';
import { COLORS } from '../theme';

interface IGachaItem {
    _id: string;
    name: string;
    type: string;
    value?: number;
    rarity: 'normal' | 'rare' | 'epic' | 'legend';
}

export default function GachaEventScreen({ navigation }: any) {
    const { user, refreshUser } = useAuth();
    const [items, setItems] = useState<IGachaItem[]>([]);
    const [currentTier, setCurrentTier] = useState(1);
    const [loading, setLoading] = useState(true);

    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [celebrationData, setCelebrationData] = useState<any>(null);

    useEffect(() => {
        fetchGachaItems();
    }, []);

    const fetchGachaItems = async () => {
        try {
            const data = await apiService.getGachaItems();
            setItems(data.items || []);
            setCurrentTier(data.currentTier || 1);
        } catch (error) {
            console.error('Failed to load gacha items', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        setShowHistory(true);
        try {
            const data = await apiService.getGachaHistory();
            setHistory(data.history || []);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSpinRequest = async (): Promise<IGachaItem | null> => {
        const tickets = (user as any)?.gachaTickets || 0;
        if (!user || tickets < 1) {
            alert('Bạn không có đủ Vé Vòng Quay!');
            return null;
        }

        try {
            const result = await apiService.spinGacha();
            if (result.success) {
                // Return won item to the wheel to animate
                return result.wonItem;
            }
            return null;
        } catch (error: any) {
            alert(error.response?.data?.error || 'Lỗi server');
            return null;
        }
    };

    const handleSpinComplete = async (wonItem: IGachaItem) => {
        // Refresh user to get updated coins, xp, tickets
        await refreshUser();
        fetchGachaItems(); // In case tier unlocked

        // Show celebration
        let payload: any = { coins: 0, gachaTickets: 0, xp: 0, items: [], levelUps: [] };
        if (wonItem.type === 'coins' && wonItem.value) payload.coins = wonItem.value;
        if (wonItem.type === 'xp' && wonItem.value) payload.xp = wonItem.value;
        if (wonItem.type === 'tickets' && wonItem.value) payload.gachaTickets = wonItem.value;
        if (wonItem.type === 'item') {
            payload.items = [wonItem.name];
        }

        if (wonItem.rarity === 'legend') {
            payload.isTierUnlock = true;
            payload.message = `Tuyệt vời! Bạn đã vượt tháp thành công và mở khóa Tầng ${currentTier + 1}!`;
        } else {
            payload.isTierUnlock = false;
            payload.message = `Bạn đã quay trúng ${wonItem.name}!`;
        }

        setCelebrationData(payload);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.contentHeader, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.clayAccent2} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Blobs for Decoration */}
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <ClayHeader user={user} />

            <View style={styles.contentHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.clayText} />
                </TouchableOpacity>
                <Text style={styles.title}>Vòng Quay Nhân Phẩm</Text>
                <TouchableOpacity onPress={loadHistory} style={styles.historyBtn}>
                    <MaterialIcons name="history" size={24} color={COLORS.clayAccent2} />
                </TouchableOpacity>
            </View>


            {/* Lucky Wheel Canvas */}
            <View style={styles.wheelWrapper}>
                {/* Floating Info */}
                <View style={styles.floatingInfo}>
                    <View style={styles.floatingBadge}>
                        <Text style={styles.floatingLabel}>Cấp Độ: ⭐ Tầng {currentTier}</Text>
                    </View>
                </View>

                {/* Banner Deco Card behind the wheel occasionally */}
                <View style={styles.bannerBackdrop} />

                <LuckyWheel
                    items={items}
                    onSpinRequest={handleSpinRequest}
                    onSpinComplete={handleSpinComplete}
                    size={320}
                />
            </View>

            <View style={styles.footerInstruction}>
                <Text style={styles.instructionText}>
                    {user && (user as any).gachaTickets > 0 ? "Nhấn nút vòng tròn giữa tâm để quay!" : "Hoàn thành nhiệm vụ hoặc thăng cấp để nhận thêm Vé."}
                </Text>
            </View>

            {/* History Modal */}
            <Modal visible={showHistory} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Lịch Sử Quay</Text>
                            <TouchableOpacity onPress={() => setShowHistory(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                            </TouchableOpacity>
                        </View>
                        {historyLoading ? (
                            <ActivityIndicator size="large" color={COLORS.clayAccent2} style={{ marginTop: 20 }} />
                        ) : (
                            <ScrollView style={{ marginTop: 10 }}>
                                {history.length === 0 ? (
                                    <Text style={{ textAlign: 'center', marginTop: 20, color: 'rgba(93,64,55,0.6)' }}>Chưa có lịch sử quay</Text>
                                ) : (
                                    history.map(h => (
                                        <View key={h._id} style={styles.historyItem}>
                                            <View>
                                                <Text style={styles.hItemName}>{h.itemDetails?.name}</Text>
                                                <Text style={styles.hItemSub}>Ngày: {new Date(h.createdAt).toLocaleString('vi-VN')}</Text>
                                            </View>
                                            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(h.itemDetails?.rarity) }]}>
                                                <Text style={styles.rarityText}>{h.itemDetails?.rarity?.toUpperCase()}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Celebration Modal */}
            {celebrationData && (
                <RewardCelebrationModal
                    visible={true}
                    rewards={celebrationData}
                    onClose={() => setCelebrationData(null)}
                />
            )}

        </SafeAreaView>
    );
}

const getRarityColor = (r: string) => {
    switch (r) {
        case 'rare': return '#38bdf8';
        case 'epic': return '#a855f7';
        case 'legend': return '#eab308';
        default: return '#4ade80';
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
        position: 'relative'
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blobTop: {
        top: -100,
        left: -50,
        width: 300,
        height: 300,
        backgroundColor: 'rgba(139, 92, 246, 0.1)', // Light purple tone
    },
    blobBottom: {
        bottom: -50,
        right: -100,
        width: 350,
        height: 350,
        backgroundColor: 'rgba(236, 72, 153, 0.08)', // Light pink tone
    },
    contentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    backBtn: {
        padding: 5,
    },
    historyBtn: {
        padding: 5,
    },
    wheelWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    bannerBackdrop: {
        position: 'absolute',
        top: '12%',
        left: '5%',
        width: '90%',
        height: '76%',
        backgroundColor: 'transparent',
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(168, 85, 247, 0.6)',
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 2,
    },
    floatingInfo: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    floatingBadge: {
        backgroundColor: COLORS.whiteOp,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.clayAccent1,
    },
    floatingLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    footerInstruction: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 20,
        marginTop: -30,
        zIndex: 10,
    },
    instructionText: {
        fontSize: 14,
        color: 'rgba(93, 64, 55, 0.8)',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    hItemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 4,
    },
    hItemSub: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.6)',
    },
    rarityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    rarityText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
