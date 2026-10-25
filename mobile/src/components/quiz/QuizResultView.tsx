import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { QuizCompleteResult } from '@shared';
import { COLORS, SHADOWS } from '../../theme';

export interface QuizResultViewProps {
    result: QuizCompleteResult;
    attemptsLeft: number;
    onPlayAgain: () => void;
    onExit: () => void;
}

/**
 * Quiz result breakdown screen displaying earned coins, XP, bonuses, and next actions.
 */
export const QuizResultView: React.FC<QuizResultViewProps> = ({
    result,
    attemptsLeft,
    onPlayAgain,
    onExit,
}) => {
    const isPerfect = Boolean(result.perfectBonus);
    const hasLevelUps = result.levelUps && result.levelUps.length > 0;

    return (
        <View style={styles.container}>
            {/* Header / Celebration Banner */}
            <LinearGradient
                colors={isPerfect ? ['#F59E0B', '#EF4444'] : ['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerBanner}
            >
                <View style={styles.headerIcon}>
                    <MaterialIcons
                        name={isPerfect ? 'military-tech' : 'emoji-events'}
                        size={48}
                        color="#FFFFFF"
                    />
                </View>
                <Text style={styles.headerTitle}>
                    {isPerfect ? 'HOÀN HẢO!' : 'HOÀN THÀNH LƯỢT CHƠI'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    Đúng {result.totalCorrect}/{result.totalQuestions} câu • Điểm Bảng Vàng:{' '}
                    {result.score}
                </Text>

                {isPerfect && (
                    <View style={styles.perfectBadge}>
                        <MaterialIcons name="confirmation-number" size={18} color="#92400E" />
                        <Text style={styles.perfectText}>
                            {result.perfectBonus?.message || 'Nhận thêm 1 Vé Gacha!'}
                        </Text>
                    </View>
                )}

                {hasLevelUps && (
                    <View style={styles.levelUpBadge}>
                        <MaterialIcons name="arrow-upward" size={18} color="#15803D" />
                        <Text style={styles.levelUpText}>
                            Lên cấp {result.levelUps.join(', ')}!
                        </Text>
                    </View>
                )}
            </LinearGradient>

            {/* Rewards Breakdown Card */}
            <View style={styles.breakdownCard}>
                <Text style={styles.cardTitle}>Chi tiết phần thưởng</Text>

                <View style={styles.row}>
                    <View style={styles.rowLeft}>
                        <MaterialIcons name="check-circle" size={18} color={COLORS.quizCorrect} />
                        <Text style={styles.rowLabel}>Thưởng câu đúng ({result.totalCorrect} câu)</Text>
                    </View>
                    <Text style={styles.rowValue}>+{result.baseCoins} xu</Text>
                </View>

                {result.speedBonusCoins > 0 && (
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <MaterialIcons name="speed" size={18} color="#3B82F6" />
                            <Text style={styles.rowLabel}>Thưởng thần tốc ({result.speedAnswerCount} câu)</Text>
                        </View>
                        <Text style={styles.rowValue}>+{result.speedBonusCoins} xu</Text>
                    </View>
                )}

                {result.streakBonusCoins > 0 && (
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <MaterialIcons name="local-fire-department" size={18} color="#F97316" />
                            <Text style={styles.rowLabel}>Thưởng combo streak (max x{result.maxStreak})</Text>
                        </View>
                        <Text style={styles.rowValue}>+{result.streakBonusCoins} xu</Text>
                    </View>
                )}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng Xu nhận được</Text>
                    <Text style={styles.totalCoins}>+{result.coinsEarned} Xu</Text>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng EXP nhận được</Text>
                    <Text style={styles.totalXp}>+{result.xpEarned} EXP</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                {attemptsLeft > 0 ? (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={onPlayAgain}
                        style={styles.primaryButton}
                    >
                        <MaterialIcons name="replay" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>
                            Chơi lại ({attemptsLeft} lượt còn lại)
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onExit}
                    style={styles.secondaryButton}
                >
                    <MaterialIcons name="home" size={20} color={COLORS.quizPrimary} />
                    <Text style={styles.secondaryButtonText}>Về sảnh sự kiện</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    headerBanner: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        ...SHADOWS.clay,
    },
    headerIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    perfectBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
    },
    perfectText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#92400E',
    },
    levelUpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    levelUpText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#15803D',
    },
    breakdownCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 20,
        ...SHADOWS.clay,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.clayText,
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowLabel: {
        fontSize: 14,
        color: '#4B5563',
    },
    rowValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.clayText,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.clayText,
    },
    totalCoins: {
        fontSize: 17,
        fontWeight: '900',
        color: '#EAB308',
    },
    totalXp: {
        fontSize: 17,
        fontWeight: '900',
        color: '#8B5CF6',
    },
    actions: {
        gap: 12,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.quizPrimary,
        paddingVertical: 16,
        borderRadius: 18,
        ...SHADOWS.clay,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.quizPrimary,
    },
    secondaryButtonText: {
        color: COLORS.quizPrimary,
        fontSize: 15,
        fontWeight: '800',
    },
});
