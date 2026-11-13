import React, { useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import type { PassQuestDefinition } from '@shared';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useSeasonPass } from '../hooks';
import {
    PassEliteUnlockModal,
    PassHeaderBanner,
    PassLeaderboardModal,
    PassQuestList,
    PassTierTrack,
    PassVaultCard,
} from '../components/seasonPass';
import { COLORS, FONT_SIZES, SPACING } from '../theme';

type PassTab = 'tiers' | 'quests' | 'vault';

export default function SeasonPassScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuth();
    const pass = useSeasonPass();

    const [activeTab, setActiveTab] = useState<PassTab>('tiers');
    const [showEliteModal, setShowEliteModal] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const handleOpenLeaderboard = () => {
        setShowLeaderboard(true);
        void pass.loadLeaderboard();
    };

    const handleNavigateTarget = (target?: PassQuestDefinition['navigateToScreen']) => {
        if (!target || target === 'Home' || target === 'Shop') {
            navigation.navigate('MainTabs');
            return;
        }
        navigation.navigate(target);
    };

    const readyQuestCount = (pass.data?.quests ?? []).filter(
        (q) => q.isCompleted && !q.isClaimed
    ).length;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.clayText} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>📜 Sổ Sứ Mệnh</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => void pass.refresh(true)}>
                    <MaterialIcons name="refresh" size={22} color={COLORS.clayText} />
                </TouchableOpacity>
            </View>

            {pass.loading && !pass.data ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.pinkDark} />
                    <Text style={styles.loadingText}>Đang tải Sổ Sứ Mệnh...</Text>
                </View>
            ) : pass.data ? (
                <View style={styles.body}>
                    <PassHeaderBanner
                        season={pass.data.season}
                        progress={pass.data.progress}
                        rankInfo={pass.data.rankInfo}
                        canUnlockEliteFreeByVip={pass.data.canUnlockEliteFreeByVip}
                        onOpenEliteModal={() => setShowEliteModal(true)}
                        onOpenLeaderboard={handleOpenLeaderboard}
                    />

                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'tiers' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('tiers')}
                        >
                            <Text style={[styles.tabText, activeTab === 'tiers' && styles.tabTextActive]}>
                                🎁 Phần thưởng ({pass.data.unclaimedTierRewardsCount})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'quests' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('quests')}
                        >
                            <Text style={[styles.tabText, activeTab === 'quests' && styles.tabTextActive]}>
                                ⚔️ Nhiệm vụ{readyQuestCount > 0 ? ` (${readyQuestCount})` : ''}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'vault' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('vault')}
                        >
                            <Text style={[styles.tabText, activeTab === 'vault' && styles.tabTextActive]}>
                                🏦 Két Sắt
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'tiers' && (
                        <PassTierTrack
                            tiers={pass.data.season.tiers}
                            progress={pass.data.progress}
                            unclaimedTierRewardsCount={pass.data.unclaimedTierRewardsCount}
                            unclaimedOvercapChests={pass.data.unclaimedOvercapChests}
                            claimingKey={pass.claimingKey}
                            onClaimTier={(lvl, track) => void pass.claimTier(lvl, track)}
                            onClaimAll={() => void pass.claimAll()}
                            onClaimOvercap={() => void pass.claimOvercap()}
                        />
                    )}

                    {activeTab === 'quests' && (
                        <PassQuestList
                            quests={pass.data.quests}
                            claimingKey={pass.claimingKey}
                            onClaimQuest={(code) => void pass.claimQuest(code)}
                            onNavigateTarget={handleNavigateTarget}
                        />
                    )}

                    {activeTab === 'vault' && (
                        <ScrollView
                            refreshControl={
                                <RefreshControl
                                    refreshing={pass.refreshing}
                                    onRefresh={() => void pass.refresh(true)}
                                />
                            }
                        >
                            <PassVaultCard
                                progress={pass.data.progress}
                                canWithdrawVault={pass.data.canWithdrawVault}
                                vaultUnlockReason={pass.data.vaultUnlockReason}
                                claimingKey={pass.claimingKey}
                                onWithdraw={() => void pass.withdrawVault()}
                            />
                        </ScrollView>
                    )}

                    <PassEliteUnlockModal
                        visible={showEliteModal}
                        canUnlockFreeByVip={pass.data.canUnlockEliteFreeByVip}
                        userCoins={user?.coins ?? 0}
                        busy={pass.claimingKey === 'unlock-elite'}
                        onClose={() => setShowEliteModal(false)}
                        onConfirm={() => {
                            setShowEliteModal(false);
                            void pass.unlockElite();
                        }}
                    />

                    <PassLeaderboardModal
                        visible={showLeaderboard}
                        loading={pass.loadingLeaderboard}
                        data={pass.leaderboard}
                        onClose={() => setShowLeaderboard(false)}
                    />
                </View>
            ) : (
                <View style={styles.centered}>
                    <Text style={styles.loadingText}>Không thể tải dữ liệu Sổ Sứ Mệnh</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => void pass.refresh()}>
                        <Text style={styles.retryText}>🔄 Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    },
    backBtn: { padding: 6, backgroundColor: COLORS.clayInset, borderRadius: 12 },
    refreshBtn: { padding: 6, backgroundColor: COLORS.clayInset, borderRadius: 12 },
    screenTitle: { fontSize: FONT_SIZES.title, fontWeight: '800', color: COLORS.clayText },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    loadingText: { fontSize: FONT_SIZES.body, fontWeight: '700', color: COLORS.clayText },
    retryBtn: {
        marginTop: 8, backgroundColor: COLORS.clayText, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
    },
    retryText: { color: '#FFFFFF', fontSize: FONT_SIZES.body, fontWeight: '800' },
    body: { flex: 1, paddingHorizontal: SPACING.lg },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
    tabBtn: {
        flex: 1, backgroundColor: COLORS.clayInset, paddingVertical: 9, borderRadius: 14, alignItems: 'center',
    },
    tabBtnActive: { backgroundColor: COLORS.clayText },
    tabText: { fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.clayText },
    tabTextActive: { color: '#FFFFFF' },
});

