import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GachaLeaderboardResponse, GachaLeaderboardEntry, GachaItemRarity } from '@shared';
import { COLORS } from '../../theme';
import { RARITY_THEMES } from './ReelCard';
import CommunityHonorFeed from './CommunityHonorFeed';

interface GachaLeaderboardProps {
    leaderboard: GachaLeaderboardResponse | null;
    loading?: boolean;
    onRefresh?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const GachaLeaderboard: React.FC<GachaLeaderboardProps> = ({
    leaderboard,
    loading = false,
    onRefresh,
    style,
}) => {
    const [selectedTab, setSelectedTab] = useState<'current' | 'hallOfFame'>('current');

    const topUsers = leaderboard?.currentWeek?.topUsers || [];
    const currentUser = leaderboard?.currentWeek?.currentUser;
    const hallOfFame = leaderboard?.hallOfFame;

    const renderRankBadge = (rank: number) => {
        if (rank === 1) {
            return (
                <View style={[styles.rankCircle, { backgroundColor: '#FFD700' }]}>
                    <MaterialCommunityIcons name="crown" size={16} color="#3E2723" />
                </View>
            );
        }
        if (rank === 2) {
            return (
                <View style={[styles.rankCircle, { backgroundColor: '#CFD8DC' }]}>
                    <Text style={[styles.rankNumber, { color: '#37474F' }]}>2</Text>
                </View>
            );
        }
        if (rank === 3) {
            return (
                <View style={[styles.rankCircle, { backgroundColor: '#D7CCC8' }]}>
                    <Text style={[styles.rankNumber, { color: '#4E342E' }]}>3</Text>
                </View>
            );
        }
        return (
            <View style={[styles.rankCircle, { backgroundColor: '#ECEFF1' }]}>
                <Text style={styles.rankNumber}>{rank}</Text>
            </View>
        );
    };

    const renderRarityTag = (rarity: GachaItemRarity) => {
        const theme = RARITY_THEMES[rarity] || RARITY_THEMES.normal;
        return (
            <View style={[styles.rarityTag, { backgroundColor: theme.border }]}>
                <Text style={styles.rarityTagText}>{theme.label}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, style]}>
            {/* Header Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
                    onPress={() => setSelectedTab('current')}
                >
                    <MaterialCommunityIcons
                        name="trophy-outline"
                        size={18}
                        color={selectedTab === 'current' ? '#FFB800' : 'rgba(93, 64, 55, 0.6)'}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === 'current' && styles.activeTabText,
                        ]}
                    >
                        Bảng Điểm Tuần
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'hallOfFame' && styles.activeTab]}
                    onPress={() => setSelectedTab('hallOfFame')}
                >
                    <MaterialCommunityIcons
                        name="seal"
                        size={18}
                        color={selectedTab === 'hallOfFame' ? '#FFB800' : 'rgba(93, 64, 55, 0.6)'}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === 'hallOfFame' && styles.activeTabText,
                        ]}
                    >
                        Vinh Danh
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="small" color="#FFA726" style={{ marginVertical: 24 }} />
            ) : selectedTab === 'current' ? (
                <View style={styles.content}>
                    {/* Current User Standing Card */}
                    {currentUser && (
                        <View style={styles.currentUserCard}>
                            <LinearGradient
                                colors={['rgba(255, 213, 79, 0.25)', 'rgba(255, 167, 38, 0.1)']}
                                style={styles.currentUserGradient}
                            >
                                <View style={styles.row}>
                                    {renderRankBadge(currentUser.rank)}
                                    <View style={styles.userInfo}>
                                        <Text style={styles.currentUserName}>Hạng Của Bạn</Text>
                                        <Text style={styles.userSub}>
                                            {currentUser.spinCount} lượt quay
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.scoreCol}>
                                    <Text style={styles.scoreText}>{currentUser.totalScore} đ</Text>
                                    {renderRarityTag(currentUser.bestRarity)}
                                </View>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Top 10 List */}
                    {topUsers.length === 0 ? (
                        <Text style={styles.emptyText}>Chưa có người chơi nào tuần này</Text>
                    ) : (
                        topUsers.map((user) => (
                            <View key={user.userId || user.rank} style={styles.userRow}>
                                <View style={styles.row}>
                                    {renderRankBadge(user.rank)}
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName} numberOfLines={1}>
                                            {user.username}
                                        </Text>
                                        <Text style={styles.userSub}>
                                            {user.spinCount} lượt quay • +{user.tierUps} cấp
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.scoreCol}>
                                    <Text style={styles.scoreText}>{user.totalScore} đ</Text>
                                    {renderRarityTag(user.bestRarity)}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            ) : (
                <View style={styles.content}>
                    <CommunityHonorFeed
                        achievements={leaderboard?.communityAchievements}
                        hallOfFame={hallOfFame}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFDF5',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(253, 195, 161, 0.4)',
        shadowColor: 'rgba(210, 150, 100, 0.25)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#F8E8B4',
        borderRadius: 14,
        padding: 4,
        marginBottom: 14,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(93, 64, 55, 0.6)',
        marginLeft: 6,
    },
    activeTabText: {
        color: COLORS.clayText,
        fontWeight: '800',
    },
    content: {
        marginTop: 4,
    },
    currentUserCard: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#FFD54F',
        marginBottom: 12,
    },
    currentUserGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    currentUserName: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.clayText,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(253, 195, 161, 0.25)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 12,
        fontWeight: '900',
        color: '#546E7A',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.clayText,
    },
    userSub: {
        fontSize: 10,
        color: 'rgba(93, 64, 55, 0.6)',
        marginTop: 2,
    },
    scoreCol: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#E65100',
        marginBottom: 2,
    },
    rarityTag: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    rarityTagText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(93, 64, 55, 0.5)',
        fontSize: 13,
        marginVertical: 18,
    },
    hofCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
    },
    hofGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    hofDetails: {
        marginLeft: 14,
        flex: 1,
    },
    hofTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#5D4037',
        textTransform: 'uppercase',
    },
    hofName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#3E2723',
        marginVertical: 2,
    },
    hofScore: {
        fontSize: 11,
        color: '#4E342E',
    },
});

export default GachaLeaderboard;
