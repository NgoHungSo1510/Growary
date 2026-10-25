import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { QuizStatusResponse } from '@shared';
import { COLORS, SHADOWS } from '../../theme';

export interface QuizLobbyViewProps {
    status: QuizStatusResponse;
    isBusy: boolean;
    onStart: () => void;
    onOpenLeaderboard: () => void;
}

function formatCountdown(targetDate: string | null): string {
    if (!targetDate) return '';
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return '00:00:00';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Lobby view component displaying event metadata, resume state, and action buttons.
 */
export const QuizLobbyView: React.FC<QuizLobbyViewProps> = ({
    status,
    isBusy,
    onStart,
    onOpenLeaderboard,
}) => {
    const [rechargeText, setRechargeText] = useState<string>(() =>
        formatCountdown(status.nextRechargeAt)
    );

    useEffect(() => {
        if (!status.nextRechargeAt || status.attemptsLeft > 0) return;
        const tick = () => setRechargeText(formatCountdown(status.nextRechargeAt));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [status.nextRechargeAt, status.attemptsLeft]);

    const event = status.event;

    if (!status.hasActiveEvent || !event) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={64} color={COLORS.clayAccent2} />
                <Text style={styles.emptyTitle}>Chưa có sự kiện trắc nghiệm</Text>
                <Text style={styles.emptySubtitle}>
                    Vui lòng quay lại sau khi sự kiện mới được kích hoạt!
                </Text>
            </View>
        );
    }

    const hasResume = Boolean(status.inProgressAttempt);
    const totalQ = status.inProgressAttempt?.questions.length || event.questionsPerAttempt;
    const currentQ = (status.inProgressAttempt?.currentIndex ?? 0) + 1;

    let buttonLabel = 'Bắt đầu thử thách';
    let isButtonDisabled = isBusy || (status.attemptsLeft <= 0 && !hasResume);

    if (hasResume) {
        buttonLabel = `Tiếp tục (câu ${currentQ}/${totalQ})`;
    } else if (status.attemptsLeft <= 0) {
        buttonLabel = `Hồi lượt sau: ${rechargeText}`;
    }

    return (
        <View style={styles.container}>
            {/* Event Header Banner */}
            <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.banner}
            >
                <View style={styles.trophyIcon}>
                    <MaterialIcons name="school" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                        <MaterialIcons name="monetization-on" size={16} color="#FACC15" />
                        <Text style={styles.statText}>+{event.rewardPerCorrect} xu/câu</Text>
                    </View>
                    <View style={styles.statChip}>
                        <MaterialIcons name="quiz" size={16} color="#FFFFFF" />
                        <Text style={styles.statText}>{event.questionsPerAttempt} câu/lượt</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* In-progress Notice */}
            {hasResume && (
                <View style={styles.resumeNotice}>
                    <MaterialIcons name="history" size={20} color="#D97706" />
                    <Text style={styles.resumeText}>
                        Bạn đang có lượt chơi dở dang. Hãy tiếp tục ngay trước khi hết hạn!
                    </Text>
                </View>
            )}

            {/* Attempts Info Card */}
            <View style={styles.card}>
                <View style={styles.attemptRow}>
                    <Text style={styles.attemptLabel}>Số lượt chơi khả dụng</Text>
                    <View style={styles.attemptBadge}>
                        <Text style={styles.attemptCount}>
                            {status.attemptsLeft} / {event.maxAttemptsPerUser}
                        </Text>
                    </View>
                </View>
                {status.attemptsLeft <= 0 && !hasResume && (
                    <Text style={styles.cooldownNote}>
                        ⏳ Lượt chơi sẽ tự động hồi lại sau: {rechargeText}
                    </Text>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isButtonDisabled}
                    onPress={onStart}
                    style={[
                        styles.primaryButton,
                        isButtonDisabled && styles.disabledButton,
                    ]}
                >
                    {isBusy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <MaterialIcons
                                name={hasResume ? 'play-arrow' : 'flash-on'}
                                size={22}
                                color="#FFFFFF"
                            />
                            <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onOpenLeaderboard}
                    style={styles.secondaryButton}
                >
                    <MaterialIcons name="emoji-events" size={22} color={COLORS.quizPrimary} />
                    <Text style={styles.secondaryButtonText}>Bảng Vàng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.clayText,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    banner: {
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        ...SHADOWS.clay,
        marginBottom: 16,
    },
    trophyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    eventTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 6,
    },
    eventDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    resumeNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#F59E0B',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
    },
    resumeText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        fontWeight: '600',
        lineHeight: 18,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        ...SHADOWS.clay,
    },
    attemptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    attemptLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.clayText,
    },
    attemptBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    attemptCount: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.quizPrimary,
    },
    cooldownNote: {
        fontSize: 13,
        color: '#F59E0B',
        fontWeight: '600',
        marginTop: 10,
    },
    actionsContainer: {
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
    disabledButton: {
        backgroundColor: '#9CA3AF',
        elevation: 0,
        shadowOpacity: 0,
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
