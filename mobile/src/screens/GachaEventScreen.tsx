import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { useGacha } from '../hooks/useGacha';
import {
    GachaReel,
    GachaCountdownBadge,
    GachaLeaderboard,
    GachaHistoryModal,
} from '../components/gacha';
import RewardCelebrationModal from '../components/RewardCelebrationModal';
import ClayHeader from '../components/ClayHeader';
import { COLORS } from '../theme';
import { GachaItem, GachaItemRarity } from '@shared';

export default function GachaEventScreen({ navigation }: any) {
    const { user, refreshUser } = useAuth();
    const {
        items,
        currentTier,
        weeklyEvent,
        leaderboard,
        loading,
        countdown,
        isUrgent,
        spin,
        fetchGachaData,
        refreshLeaderboard,
        userTickets,
    } = useGacha();

    // History modal state
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyHasMore, setHistoryHasMore] = useState(false);
    const [historyFilter, setHistoryFilter] = useState<GachaItemRarity | undefined>(undefined);
    const [loadingMore, setLoadingMore] = useState(false);

    // Celebration modal state
    const [celebrationData, setCelebrationData] = useState<any>(null);

    const loadHistoryData = useCallback(
        async (page = 1, rarity = historyFilter, append = false) => {
            if (append) {
                setLoadingMore(true);
            } else {
                setHistoryLoading(true);
            }
            try {
                const data = await apiService.getGachaHistory({
                    page,
                    limit: 15,
                    rarity,
                });
                if (append) {
                    setHistory((prev) => [...prev, ...(data.history || [])]);
                } else {
                    setHistory(data.history || []);
                }
                setHistoryPage(page);
                setHistoryHasMore(data.hasMore || false);
            } catch (error) {
                console.error('Failed to load gacha history:', error);
            } finally {
                setHistoryLoading(false);
                setLoadingMore(false);
            }
        },
        [historyFilter]
    );

    const openHistory = () => {
        setShowHistory(true);
        loadHistoryData(1, historyFilter, false);
    };

    const handleFilterChange = (rarity?: GachaItemRarity) => {
        setHistoryFilter(rarity);
        loadHistoryData(1, rarity, false);
    };

    const handleLoadMoreHistory = () => {
        if (!historyHasMore || loadingMore) return;
        loadHistoryData(historyPage + 1, historyFilter, true);
    };

    const handleSpinRequest = async (): Promise<{ wonItem: GachaItem; tierUpgraded?: boolean } | null> => {
        if (userTickets < 1) {
            Alert.alert('Hết vé quay', 'Bạn cần tối thiểu 1 Vé Vòng Quay để tham gia!');
            return null;
        }

        try {
            const result = await spin();
            if (result && result.success) {
                return {
                    wonItem: result.wonItem,
                    tierUpgraded: result.tierUpgraded,
                };
            }
            return null;
        } catch (error: any) {
            Alert.alert('Thông báo', error.response?.data?.error || 'Không thể thực hiện quay');
            return null;
        }
    };

    const handleSpinComplete = async (wonItem: GachaItem, tierUpgraded?: boolean) => {
        await refreshUser();
        fetchGachaData();
        refreshLeaderboard();

        // Celebration payload
        const payload: any = { coins: 0, gachaTickets: 0, xp: 0, items: [], levelUps: [] };
        if (wonItem.type === 'coins' && wonItem.rewardAmount) payload.coins = wonItem.rewardAmount;
        if (wonItem.type === 'exp' && wonItem.rewardAmount) payload.xp = wonItem.rewardAmount;
        if (wonItem.type === 'ticket' && wonItem.rewardAmount) payload.gachaTickets = wonItem.rewardAmount;
        if (wonItem.type === 'item' || wonItem.type === 'voucher') {
            payload.items = [wonItem.name];
        }

        if (tierUpgraded) {
            payload.isTierUnlock = true;
            payload.message = `Xuất sắc! Bạn đã vượt tháp thành công lên Tầng ${currentTier + 1}!`;
        } else {
            payload.isTierUnlock = false;
            payload.message = `Bạn đã nhận được: ${wonItem.name}`;
        }

        setCelebrationData(payload);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.clayAccent2} />
                    <Text style={styles.loadingText}>Đang tải vòng quay CS:GO...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <ClayHeader user={user} />

            {/* Navigation Header */}
            <View style={styles.contentHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.clayText} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>Vòng Quay May Mắn</Text>
                    <Text style={styles.subtitle}>CS:GO Reel • Tuần này</Text>
                </View>
                <TouchableOpacity onPress={openHistory} style={styles.historyBtn}>
                    <MaterialIcons name="history" size={24} color={COLORS.clayAccent2} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Real-time Countdown Badge */}
                <GachaCountdownBadge countdown={countdown} isUrgent={isUrgent} style={styles.countdownBadge} />

                {/* Tier and Weekly Event Teaser */}
                <View style={styles.infoBanner}>
                    <View style={styles.tierPill}>
                        <MaterialCommunityIcons name="shield-star" size={16} color="#B45309" />
                        <Text style={styles.tierPillText}>Cấp Độ: Tầng {currentTier}</Text>
                    </View>

                    {weeklyEvent?.featuredBoxes && weeklyEvent.featuredBoxes.length > 0 && (
                        <View style={styles.boxPill}>
                            <MaterialCommunityIcons name="treasure-chest" size={16} color="#7C3AED" />
                            <Text style={styles.boxPillText} numberOfLines={1}>
                                Rương Tuần: {weeklyEvent.featuredBoxes[0].name}
                            </Text>
                        </View>
                    )}
                </View>

                {/* CS:GO Horizontal Reel */}
                <GachaReel
                    items={items}
                    onSpinRequest={handleSpinRequest}
                    onSpinComplete={handleSpinComplete}
                    userTickets={userTickets}
                />

                {/* Weekly Leaderboard & Hall of Fame */}
                <GachaLeaderboard
                    leaderboard={leaderboard}
                    onRefresh={refreshLeaderboard}
                />

                <View style={{ height: 32 }} />
            </ScrollView>

            {/* Filtered History Modal */}
            <GachaHistoryModal
                visible={showHistory}
                loading={historyLoading}
                history={history}
                onClose={() => setShowHistory(false)}
                onFilterChange={handleFilterChange}
                onLoadMore={handleLoadMoreHistory}
                hasMore={historyHasMore}
                loadingMore={loadingMore}
            />

            {/* Reward Celebration Modal */}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
        position: 'relative',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.clayText,
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
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
    },
    blobBottom: {
        bottom: -50,
        right: -100,
        width: 350,
        height: 350,
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
    },
    contentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 6,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.clayText,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(93, 64, 55, 0.6)',
        marginTop: 1,
    },
    backBtn: {
        padding: 6,
    },
    historyBtn: {
        padding: 6,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    countdownBadge: {
        marginTop: 6,
        marginBottom: 8,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    tierPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },
    tierPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#92400E',
        marginLeft: 4,
    },
    boxPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDE9FE',
        borderWidth: 1,
        borderColor: '#DDD6FE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        maxWidth: 180,
    },
    boxPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6D28D9',
        marginLeft: 4,
    },
});
