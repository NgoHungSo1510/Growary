import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WeeklyRewardsConfig, WeeklyRewardTier } from '@shared';
import { COLORS } from '../../theme';

interface WeeklyRewardsPreviewCardProps {
    rewards?: WeeklyRewardsConfig;
    style?: StyleProp<ViewStyle>;
}

export const WeeklyRewardsPreviewCard: React.FC<WeeklyRewardsPreviewCardProps> = ({
    rewards,
    style,
}) => {
    const [expanded, setExpanded] = useState(true);

    if (!rewards) return null;

    const renderTierRow = (
        tier: WeeklyRewardTier | undefined,
        rankLabel: string,
        rankColor: string,
        rankIcon: string
    ) => {
        if (!tier) return null;
        const boxRarity = tier.box?.rarity || 'normal';
        const boxColor =
            tier.box?.color ||
            (boxRarity === 'legend'
                ? '#F59E0B'
                : boxRarity === 'epic'
                ? '#A855F7'
                : boxRarity === 'rare'
                ? '#3B82F6'
                : '#94A3B8');

        return (
            <View style={styles.tierRow}>
                {/* Rank Badge */}
                <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                    <Text style={styles.rankIconText}>{rankIcon}</Text>
                    <Text style={styles.rankLabelText}>{rankLabel}</Text>
                </View>

                {/* Box info */}
                <View style={styles.tierMain}>
                    <View style={[styles.boxChip, { borderColor: boxColor, backgroundColor: `${boxColor}15` }]}>
                        <MaterialCommunityIcons name="treasure-chest" size={14} color={boxColor} />
                        <Text style={[styles.boxName, { color: boxColor }]} numberOfLines={1}>
                            {tier.box?.name || 'Rương Thưởng'}
                        </Text>
                    </View>

                    {/* Rewards detail */}
                    <View style={styles.payoutList}>
                        <View style={styles.payoutItem}>
                            <Text style={styles.payoutIcon}>🪙</Text>
                            <Text style={styles.payoutVal}>+{tier.coins.toLocaleString()}</Text>
                        </View>
                        <View style={styles.payoutItem}>
                            <Text style={styles.payoutIcon}>⚡</Text>
                            <Text style={styles.payoutVal}>+{tier.xp} XP</Text>
                        </View>
                        {tier.tickets > 0 && (
                            <View style={styles.payoutItem}>
                                <Text style={styles.payoutIcon}>🎟️</Text>
                                <Text style={styles.payoutVal}>+{tier.tickets} Vé</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={['#FFF9F2', '#FFF3E0']}
                style={styles.gradientHeader}
            >
                <TouchableOpacity
                    style={styles.headerRow}
                    onPress={() => setExpanded(!expanded)}
                    activeOpacity={0.8}
                >
                    <View style={styles.titleWrap}>
                        <MaterialCommunityIcons name="gift-outline" size={20} color="#D97706" />
                        <Text style={styles.headerTitle}>Cơ Cấu Giải Thưởng Tuần Này</Text>
                    </View>
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color="#B45309"
                    />
                </TouchableOpacity>

                {expanded && (
                    <View style={styles.body}>
                        {renderTierRow(rewards.top1, 'TOP 1', '#FEF3C7', '🥇')}
                        {renderTierRow(rewards.top2, 'TOP 2', '#F1F5F9', '🥈')}
                        {renderTierRow(rewards.top3, 'TOP 3', '#FFEDD5', '🥉')}
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#FDE68A',
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    gradientHeader: {
        padding: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#92400E',
    },
    body: {
        marginTop: 10,
        gap: 8,
    },
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(217, 119, 6, 0.12)',
        gap: 8,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    rankIconText: {
        fontSize: 13,
    },
    rankLabelText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#78350F',
    },
    tierMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 6,
    },
    boxChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        maxWidth: 150,
    },
    boxName: {
        fontSize: 11,
        fontWeight: '700',
    },
    payoutList: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    payoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    payoutIcon: {
        fontSize: 11,
    },
    payoutVal: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.clayText,
    },
});

export default WeeklyRewardsPreviewCard;
