import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export interface BossRecord {
    totalDamageDealt: number;
    accumulatedCoins: number;
    attackPoints: number;
    hasUnlockedStory: boolean;
}

interface BossAttackSectionProps {
    record: BossRecord | null;
    attackPercentage: 0.25 | 0.5 | 0.75 | 1.0;
    currentAttackPower: number;
    onSelectPercentage: (pct: 0.25 | 0.5 | 0.75 | 1.0) => void;
    onAttackPress: () => void;
}

export const BossAttackSection: React.FC<BossAttackSectionProps> = ({
    record,
    attackPercentage,
    currentAttackPower,
    onSelectPercentage,
    onAttackPress,
}) => {
    const hasPoints = record && record.attackPoints > 0;

    return (
        <View style={styles.attackSection}>
            <View style={styles.attackHeader}>
                <Text style={styles.attackTitle}>Sức Mạnh Của Bạn</Text>
                <View style={styles.attackPointsBadge}>
                    <MaterialIcons name="bolt" size={16} color="#eab308" />
                    <Text style={styles.attackPointsText}>{record?.attackPoints || 0} Điểm</Text>
                </View>
            </View>

            <Text style={styles.attackDesc}>Hoàn thành nhiệm vụ hàng ngày để tích lũy Điểm Công.</Text>

            <View style={styles.percentageRow}>
                {([0.25, 0.5, 0.75, 1.0] as const).map((pct) => (
                    <TouchableOpacity
                        key={pct}
                        style={[styles.pctBtn, attackPercentage === pct && styles.pctBtnActive]}
                        onPress={() => onSelectPercentage(pct)}
                    >
                        <Text style={[styles.pctBtnText, attackPercentage === pct && styles.pctBtnTextActive]}>
                            {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.attackButton, !hasPoints && styles.attackButtonDisabled]}
                onPress={onAttackPress}
                disabled={!hasPoints}
            >
                <Text style={styles.attackButtonText}>PHÁ KHÓA</Text>
                <Text style={styles.attackButtonSubtext}>Dùng {currentAttackPower} Điểm</Text>
            </TouchableOpacity>
        </View>
    );
};

interface BossContributionStatsProps {
    record: BossRecord | null;
}

export const BossContributionStats: React.FC<BossContributionStatsProps> = ({ record }) => {
    return (
        <View style={styles.statsWrapper}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đóng Góp Của Bạn</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <MaterialIcons name="local-fire-department" size={32} color="#ef4444" />
                    <Text style={styles.statValue}>{record?.totalDamageDealt || 0}</Text>
                    <Text style={styles.statLabel}>Tổng Sát Thương</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialIcons name="account-balance-wallet" size={32} color="#eab308" />
                    <Text style={styles.statValue}>{record?.accumulatedCoins || 0}</Text>
                    <Text style={styles.statLabel}>Coin Tích Lũy</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    attackSection: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    attackHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    attackTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    attackPointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(234,179,8,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    attackPointsText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#B45309',
    },
    attackDesc: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.6)',
        marginBottom: 16,
    },
    percentageRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    pctBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(93,64,55,0.06)',
    },
    pctBtnActive: {
        backgroundColor: COLORS.clayAccent1,
    },
    pctBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    pctBtnTextActive: {
        color: '#FFF',
    },
    attackButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    attackButtonDisabled: {
        opacity: 0.4,
    },
    attackButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    attackButtonSubtext: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    statsWrapper: {
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.clayCard,
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginTop: 6,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(93,64,55,0.6)',
        marginTop: 2,
    },
});
