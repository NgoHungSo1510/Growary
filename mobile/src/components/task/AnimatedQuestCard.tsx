import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DailyTask, PenaltyConfig } from '../../types';
import { COLORS } from '../../theme';

const GREEN_SUCCESS = '#4ADE80';

export interface AnimatedQuestCardProps {
    task: DailyTask;
    index: number;
    planId: string;
    onShowProofPicker: (index: number) => void;
    currentTime: Date;
    penaltyConfig: PenaltyConfig | null;
    isGlobalLoading: boolean;
}

const getCategoryIcon = (category?: string): keyof typeof MaterialIcons.glyphMap => {
    const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
        health: 'water-drop',
        study: 'auto-stories',
        work: 'calculate',
        personal: 'self-improvement',
        household: 'home',
        other: 'task-alt',
    };
    return icons[category || 'other'] || 'task-alt';
};

const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
        health: '#3B82F6',
        study: '#EC4899',
        work: '#9333EA',
        personal: '#F59E0B',
        household: '#22C55E',
        other: '#6366F1',
    };
    return colors[category || 'other'] || '#6366F1';
};

export const AnimatedQuestCard: React.FC<AnimatedQuestCardProps> = React.memo(
    ({ task, index, onShowProofPicker, currentTime, penaltyConfig, isGlobalLoading }) => {
        const flashAnim = useRef(new Animated.Value(0)).current;
        const [justCompleted, setJustCompleted] = useState(false);

        useEffect(() => {
            if (justCompleted) {
                Animated.sequence([
                    Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
                    Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
                ]).start(() => setJustCompleted(false));
            }
        }, [justCompleted, flashAnim]);

        if (task.isCompleted) return null;

        const borderColor = flashAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255,255,255,0.3)', GREEN_SUCCESS],
        });

        const iconName = getCategoryIcon(task.category);
        const iconColor = getCategoryColor(task.category);
        const isPending = task.adminApprovalStatus === 'pending';

        let displayCoin = task.coinReward ?? 5;
        let displayXp = task.pointsReward;
        let latePercentage = 0;

        if (task.scheduledTime && currentTime && penaltyConfig && !isPending) {
            const [h, m] = task.scheduledTime.split(':').map(Number);
            if (!Number.isNaN(h) && !Number.isNaN(m)) {
                const scheduledDate = new Date(currentTime);
                scheduledDate.setHours(h, m, 0, 0);
                const duration = task.durationMinutes && task.durationMinutes > 0 ? task.durationMinutes : 15;
                scheduledDate.setMinutes(scheduledDate.getMinutes() + duration);

                const diffMinutes = Math.floor((currentTime.getTime() - scheduledDate.getTime()) / 60000);
                if (diffMinutes >= 15 && penaltyConfig.lateThresholds?.length) {
                    let highest = 0;
                    for (const t of penaltyConfig.lateThresholds) {
                        if (diffMinutes >= t.thresholdMinutes && t.deductionPercentage > highest) {
                            highest = t.deductionPercentage;
                        }
                    }
                    if (highest > 0) {
                        latePercentage = highest;
                        displayCoin = Math.max(1, Math.floor((task.coinReward ?? 5) * (1 - latePercentage / 100)));
                        displayXp = Math.max(1, Math.floor(task.pointsReward * (1 - latePercentage / 100)));
                    }
                }
            }
        }

        return (
            <Animated.View style={[styles.clayCard, { borderColor, borderWidth: 2 }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                        <View style={styles.iconBox}>
                            <MaterialIcons name={iconName} size={24} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{task.title}</Text>
                            <Text style={styles.cardSubtitle}>
                                {task.scheduledTime ? `🕐 ${task.scheduledTime}` : (task.category || 'Quest')}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.rewardBadge}>
                            {latePercentage > 0 ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={[styles.rewardText, styles.strikethrough]}>
                                        {task.coinReward ?? 5} G
                                    </Text>
                                    <Text style={[styles.rewardText, { color: '#B45309' }]}>
                                        +{displayCoin} G
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.rewardText}>+{displayCoin} G</Text>
                            )}
                        </View>
                        {latePercentage > 0 && (
                            <View style={styles.lateBadge}>
                                <Text style={styles.lateBadgeText}>-{latePercentage}% Trễ</Text>
                            </View>
                        )}
                    </View>
                </View>

                {isPending && (
                    <View style={styles.pendingBanner}>
                        <MaterialIcons name="hourglass-empty" size={14} color="#B45309" />
                        <Text style={styles.pendingText}>Chờ admin duyệt</Text>
                    </View>
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.xpBadge}>
                        {latePercentage > 0 ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={[styles.xpBadgeText, styles.strikethrough]}>
                                    ⚡ {task.pointsReward} XP
                                </Text>
                                <Text style={[styles.xpBadgeText, { color: '#B45309' }]}>
                                    ⚡ {displayXp} XP
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.xpBadgeText}>⚡ {displayXp} XP</Text>
                        )}
                    </View>

                    {!isPending && (
                        <TouchableOpacity
                            style={[styles.actionBtn, isGlobalLoading && { opacity: 0.5 }]}
                            onPress={() => onShowProofPicker(index)}
                            disabled={isGlobalLoading}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.actionBtnText}>Hoàn thành</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        );
    }
);

AnimatedQuestCard.displayName = 'AnimatedQuestCard';

const styles = StyleSheet.create({
    clayCard: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        marginHorizontal: 20,
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    cardLeft: {
        flexDirection: 'row',
        gap: 14,
        flex: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    cardSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(93, 64, 55, 0.7)',
        marginTop: 2,
    },
    rewardBadge: {
        backgroundColor: '#FEF08A',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    rewardText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#713F12',
    },
    lateBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 6,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    lateBadgeText: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: 'bold',
    },
    pendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
    },
    pendingText: {
        fontSize: 12,
        color: '#B45309',
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    xpBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    xpBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#5D4037',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    actionBtn: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});

