import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GachaLeaderboardEntry, GachaItemRarity } from '@shared';
import { RARITY_THEMES } from './ReelCard';

interface GachaUserScoreCardProps {
    currentUser?: GachaLeaderboardEntry;
    onPressRewards?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const GachaUserScoreCard: React.FC<GachaUserScoreCardProps> = ({
    currentUser,
    onPressRewards,
    style,
}) => {
    const totalScore = currentUser?.totalScore ?? 0;
    const rank = currentUser?.rank && currentUser.rank > 0 ? `#${currentUser.rank}` : 'Chưa xếp hạng';
    const spinCount = currentUser?.spinCount ?? 0;
    const tierUps = currentUser?.tierUps ?? 0;
    const bestRarity = (currentUser?.bestRarity as GachaItemRarity) || 'normal';
    const rarityTheme = RARITY_THEMES[bestRarity] || RARITY_THEMES.normal;

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={['#1E293B', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Header row */}
                <View style={styles.topRow}>
                    <View style={styles.titleWrap}>
                        <MaterialCommunityIcons name="target" size={18} color="#FBBF24" />
                        <Text style={styles.title}>Thành Tích Tuần Này Của Bạn</Text>
                    </View>
                    {onPressRewards ? (
                        <TouchableOpacity
                            style={styles.rewardsHeaderBtn}
                            onPress={onPressRewards}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="gift" size={14} color="#F59E0B" />
                            <Text style={styles.rewardsHeaderBtnText}>Quà Đua Top</Text>
                        </TouchableOpacity>
                    ) : spinCount > 0 ? (
                        <View style={[styles.rarityBadge, { borderColor: rarityTheme.border }]}>
                            <Text style={[styles.rarityText, { color: rarityTheme.border }]}>
                                {rarityTheme.label}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsRow}>
                    <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>Điểm Tuần</Text>
                        <View style={styles.metricValRow}>
                            <Text style={styles.metricValScore}>{totalScore.toLocaleString()}</Text>
                            <Text style={styles.metricUnit}>đ</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>Thứ Hạng</Text>
                        <Text style={[styles.metricVal, { color: rank.startsWith('#') ? '#F59E0B' : '#94A3B8' }]}>
                            {rank}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>Lượt Quay</Text>
                        <Text style={styles.metricVal}>{spinCount} lượt</Text>
                    </View>

                    {tierUps > 0 && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.metricCol}>
                                <Text style={styles.metricLabel}>Đột Phá</Text>
                                <Text style={[styles.metricVal, { color: '#34D399' }]}>+{tierUps} Tầng</Text>
                            </View>
                        </>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    gradient: {
        padding: 14,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    rarityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    rarityText: {
        fontSize: 10,
        fontWeight: '800',
    },
    rewardsHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    rewardsHeaderBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FBBF24',
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 6,
    },
    metricCol: {
        alignItems: 'center',
        flex: 1,
    },
    metricLabel: {
        fontSize: 11,
        color: '#94A3B8',
        marginBottom: 4,
    },
    metricValRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    metricValScore: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FBBF24',
    },
    metricUnit: {
        fontSize: 11,
        color: '#FDE68A',
        fontWeight: '700',
    },
    metricVal: {
        fontSize: 14,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});

export default GachaUserScoreCard;
