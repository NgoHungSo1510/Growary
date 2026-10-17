import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityAchievement, GachaLeaderboardEntry } from '@shared';
import { COLORS } from '../../theme';

interface CommunityHonorFeedProps {
    achievements?: CommunityAchievement[];
    hallOfFame?: {
        lastWeekWinner?: GachaLeaderboardEntry;
        lastWeekTopTierUp?: GachaLeaderboardEntry;
    };
}

export const CommunityHonorFeed: React.FC<CommunityHonorFeedProps> = ({
    achievements,
    hallOfFame,
}) => {
    const list = achievements || [];

    const getAchievementVisuals = (type: CommunityAchievement['type'], rarity?: string) => {
        if (type === 'tier_up') {
            return {
                icon: 'shield-crown',
                color: '#10B981',
                bg: '#ECFDF5',
                borderColor: '#A7F3D0',
            };
        }
        if (type === 'rare_drop') {
            const isLegend = rarity === 'legend';
            return {
                icon: isLegend ? 'crown' : 'diamond-stone',
                color: isLegend ? '#F59E0B' : '#A855F7',
                bg: isLegend ? '#FEF3C7' : '#F3E8FF',
                borderColor: isLegend ? '#FDE68A' : '#E9D5FF',
            };
        }
        return {
            icon: 'fire',
            color: '#EF4444',
            bg: '#FEE2E2',
            borderColor: '#FECACA',
        };
    };

    return (
        <View style={styles.container}>
            {/* Recent Feats Feed */}
            {list.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có thành tựu mới nào được ghi nhận</Text>
            ) : (
                list.map((item) => {
                    const visuals = getAchievementVisuals(item.type, item.rarity);
                    return (
                        <View key={item.id} style={[styles.itemCard, { borderColor: visuals.borderColor }]}>
                            <View style={[styles.iconCircle, { backgroundColor: visuals.bg }]}>
                                <MaterialCommunityIcons name={visuals.icon as any} size={18} color={visuals.color} />
                            </View>

                            <View style={styles.itemContent}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.usernameText} numberOfLines={1}>
                                        {item.username}
                                    </Text>
                                    {item.highlightText && (
                                        <View style={[styles.highlightBadge, { backgroundColor: visuals.bg }]}>
                                            <Text style={[styles.highlightText, { color: visuals.color }]}>
                                                {item.highlightText}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.descriptionText}>{item.description}</Text>
                            </View>
                        </View>
                    );
                })
            )}

            {/* Honorary Mention: Last week champion if exists */}
            {hallOfFame?.lastWeekWinner && (
                <View style={styles.championBox}>
                    <LinearGradient colors={['#FFD54F', '#FFA726']} style={styles.championGradient}>
                        <MaterialCommunityIcons name="crown" size={24} color="#3E2723" />
                        <View style={styles.championDetails}>
                            <Text style={styles.championTitle}>Quán Quân Tuần Trước</Text>
                            <Text style={styles.championName}>{hallOfFame.lastWeekWinner.username}</Text>
                            <Text style={styles.championScore}>
                                {hallOfFame.lastWeekWinner.totalScore} điểm • Phẩm chất {hallOfFame.lastWeekWinner.bestRarity?.toUpperCase()}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        gap: 10,
        shadowColor: 'rgba(0, 0, 0, 0.04)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 1,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    usernameText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.clayText,
        flex: 1,
    },
    highlightBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
        marginLeft: 6,
    },
    highlightText: {
        fontSize: 10,
        fontWeight: '800',
    },
    descriptionText: {
        fontSize: 11,
        color: 'rgba(93, 64, 55, 0.75)',
        lineHeight: 15,
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(93, 64, 55, 0.5)',
        fontSize: 13,
        marginVertical: 18,
    },
    championBox: {
        marginTop: 10,
        borderRadius: 14,
        overflow: 'hidden',
    },
    championGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    championDetails: {
        marginLeft: 10,
        flex: 1,
    },
    championTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#5D4037',
        textTransform: 'uppercase',
    },
    championName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#3E2723',
    },
    championScore: {
        fontSize: 10,
        color: '#4E342E',
    },
});

export default CommunityHonorFeed;
