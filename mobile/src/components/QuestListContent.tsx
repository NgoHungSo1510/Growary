import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { DailyTask, PenaltyConfig, DailyPlan } from '../types';
import { COLORS } from '../theme';
import { apiService } from '../services/api';
import { isServerReachable } from '../services/serverReachability';
import { applyOfflineTaskCompletion } from '../services/offlineEconomyEngine';
import { AnimatedQuestCard } from './task/AnimatedQuestCard';
import {
    QuestProofModal,
    launchCameraBase64,
    launchLibraryBase64,
} from './task/QuestProofModal';

interface QuestListContentProps {
    tasks: DailyTask[];
    planId: string;
    onPlanUpdated: (plan: DailyPlan | null, grantedRewards?: unknown, offlineTaskIndex?: number) => void;
}

export const QuestListContent: React.FC<QuestListContentProps> = ({
    tasks,
    planId,
    onPlanUpdated,
}) => {
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [proofPickerIndex, setProofPickerIndex] = useState<number | null>(null);
    const [celebrationData, setCelebrationData] = useState<{
        title: string;
        xp: number;
        coin: number;
        isLate: boolean;
        latePercentage: number;
    } | null>(null);

    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [penaltyConfig, setPenaltyConfig] = useState<PenaltyConfig | null>(null);

    useEffect(() => {
        apiService
            .getPenaltyConfig()
            .then((data) => {
                if (data.config) setPenaltyConfig(data.config);
            })
            .catch(() => {});

        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.scheduledTime && !b.scheduledTime) return 0;
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
    });

    const activeTasks = sortedTasks.filter((t) => !t.isCompleted);

    const executeTaskCompletion = async (
        index: number,
        base64Image?: string
    ): Promise<void> => {
        const taskToComplete = activeTasks[index];
        const realIndex = tasks.findIndex((t) => t._id === taskToComplete?._id);
        if (realIndex === -1) return;

        setLoadingIndex(index);
        try {
            // If server is not reachable, complete immediately offline (< 50ms)
            if (!isServerReachable()) {
                const currentPlan: DailyPlan = {
                    _id: planId,
                    tasks: [...tasks],
                } as DailyPlan;

                const { updatedPlan, optimisticRewards } = await applyOfflineTaskCompletion({
                    plan: currentPlan,
                    taskIndex: realIndex,
                    proofImageBase64: base64Image,
                });

                onPlanUpdated(updatedPlan, optimisticRewards, realIndex);
                setCelebrationData({
                    title: taskToComplete.title,
                    xp: optimisticRewards.xp,
                    coin: optimisticRewards.coins,
                    isLate: optimisticRewards.isLate,
                    latePercentage: optimisticRewards.latePercentage,
                });
                return;
            }

            // Try online completion with safe offline fallback
            const res = await apiService.completeTaskWithProofOfflineSafe(
                planId,
                realIndex,
                base64Image
            );

            if (res.offlineQueued) {
                const currentPlan: DailyPlan = {
                    _id: planId,
                    tasks: [...tasks],
                } as DailyPlan;

                const { updatedPlan, optimisticRewards } = await applyOfflineTaskCompletion({
                    plan: currentPlan,
                    taskIndex: realIndex,
                    proofImageBase64: base64Image,
                });

                onPlanUpdated(updatedPlan, optimisticRewards, realIndex);
                setCelebrationData({
                    title: taskToComplete.title,
                    xp: optimisticRewards.xp,
                    coin: optimisticRewards.coins,
                    isLate: optimisticRewards.isLate,
                    latePercentage: optimisticRewards.latePercentage,
                });
                return;
            }

            const { plan, grantedRewards } = res;
            if (plan) onPlanUpdated(plan, grantedRewards);

            const granted = grantedRewards as Record<string, unknown> | undefined;
            const actualXp =
                typeof granted?.questXp === 'number'
                    ? granted.questXp
                    : typeof granted?.xp === 'number'
                    ? granted.xp
                    : taskToComplete.pointsReward;
            const actualCoin =
                typeof granted?.questCoins === 'number'
                    ? granted.questCoins
                    : typeof granted?.coins === 'number'
                    ? granted.coins
                    : taskToComplete.coinReward ?? 5;
            const isLate = Boolean(granted?.isLate);
            const latePercentage = typeof granted?.latePercentage === 'number' ? granted.latePercentage : 0;

            setCelebrationData({
                title: taskToComplete.title,
                xp: actualXp,
                coin: actualCoin,
                isLate,
                latePercentage,
            });
        } catch (error: unknown) {
            // On unexpected network catch, complete offline safely
            const currentPlan: DailyPlan = {
                _id: planId,
                tasks: [...tasks],
            } as DailyPlan;

            const { updatedPlan, optimisticRewards } = await applyOfflineTaskCompletion({
                plan: currentPlan,
                taskIndex: realIndex,
                proofImageBase64: base64Image,
            });

            onPlanUpdated(updatedPlan, optimisticRewards, realIndex);
            setCelebrationData({
                title: taskToComplete.title,
                xp: optimisticRewards.xp,
                coin: optimisticRewards.coins,
                isLate: optimisticRewards.isLate,
                latePercentage: optimisticRewards.latePercentage,
            });
        } finally {
            setLoadingIndex(null);
        }
    };

    const handleSelectProofSource = async (source: 'camera' | 'library' | 'none') => {
        const idx = proofPickerIndex;
        setProofPickerIndex(null);
        if (idx === null) return;

        if (source === 'none') {
            await executeTaskCompletion(idx);
            return;
        }

        const base64 = source === 'camera' ? await launchCameraBase64() : await launchLibraryBase64();
        if (base64) {
            await executeTaskCompletion(idx, base64);
        }
    };

    if (tasks.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Chưa có quest hôm nay</Text>
                <Text style={styles.emptySubtitle}>Nhấn nút + để thêm việc cho ngày mai</Text>
            </View>
        );
    }

    return (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Quests</Text>
                <View style={styles.timerBadge}>
                    <Text style={styles.timerText}>{activeTasks.length} còn lại</Text>
                </View>
            </View>

            {loadingIndex !== null && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={COLORS.clayAccent2} />
                    <Text style={styles.loadingText}>Đang lưu tiến độ...</Text>
                </View>
            )}

            {activeTasks.map((task, index) => (
                <AnimatedQuestCard
                    key={task._id || `active-${index}`}
                    task={task}
                    index={index}
                    planId={planId}
                    onShowProofPicker={(i) => setProofPickerIndex(i)}
                    currentTime={currentTime}
                    penaltyConfig={penaltyConfig}
                    isGlobalLoading={loadingIndex !== null || proofPickerIndex !== null}
                />
            ))}

            <QuestProofModal
                pickerIndex={proofPickerIndex}
                onClosePicker={() => setProofPickerIndex(null)}
                onSelectProof={handleSelectProofSource}
                celebrationData={celebrationData}
                onCloseCelebration={() => setCelebrationData(null)}
                proofPreviewUrl={proofPreview}
                onCloseProofPreview={() => setProofPreview(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    timerBadge: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    timerText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
    },
    loadingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 12,
    },
    loadingText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.clayText,
        opacity: 0.7,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(93, 64, 55, 0.6)',
        textAlign: 'center',
    },
});
