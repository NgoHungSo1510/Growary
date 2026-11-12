import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { DailyTask } from '../types';
import { COLORS, SHADOWS } from '../theme';

export interface TaskSummaryWidgetProps {
    tasks: DailyTask[];
    currentStreak: number;
    streakGracePeriod?: boolean;
    onPressTask?: (taskIndex: number) => void;
}

const WIDGET_SNAPSHOT_KEY = '@growary:widget_summary_snapshot';

/**
 * Widget Mini-Dashboard hiển thị tiến độ trong ngày và top 3 nhiệm vụ sắp tới.
 * Tự động đồng bộ snapshot vào AsyncStorage để Native OS Widget có thể đọc.
 */
export const TaskSummaryWidget: React.FC<TaskSummaryWidgetProps> = React.memo(({
    tasks,
    currentStreak,
    streakGracePeriod,
    onPressTask,
}) => {
    const totalCount = tasks.length;
    const completedCount = useMemo(() => tasks.filter((t) => t.isCompleted).length, [tasks]);
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const upcomingTasks = useMemo(() => {
        return tasks
            .map((task, originalIndex) => ({ task, originalIndex }))
            .filter(({ task }) => !task.isCompleted)
            .sort((a, b) => {
                if (!a.task.scheduledTime) return 1;
                if (!b.task.scheduledTime) return -1;
                return a.task.scheduledTime.localeCompare(b.task.scheduledTime);
            })
            .slice(0, 3);
    }, [tasks]);

    // Đồng bộ snapshot dữ liệu widget cho OS
    useEffect(() => {
        const snapshot = {
            updatedAt: new Date().toISOString(),
            currentStreak,
            streakGracePeriod: Boolean(streakGracePeriod),
            totalTasks: totalCount,
            completedTasks: completedCount,
            progressPercent,
            upcomingTasks: upcomingTasks.map(({ task }) => ({
                id: task._id,
                title: task.title,
                scheduledTime: task.scheduledTime,
                category: task.category,
            })),
        };
        AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot)).catch((err) => {
            console.warn('Lỗi lưu widget snapshot:', err);
        });
    }, [tasks, currentStreak, streakGracePeriod, totalCount, completedCount, progressPercent, upcomingTasks]);

    return (
        <View style={styles.card}>
            {/* Header: Tiêu đề + Huy hiệu Streak */}
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <MaterialIcons name="dashboard-customize" size={20} color={COLORS.clayText} />
                    <Text style={styles.headerTitle}>Hôm Nay Của Bạn</Text>
                </View>
                <View style={[styles.streakBadge, streakGracePeriod && styles.streakBadgeWarning]}>
                    <Text style={styles.streakBadgeText}>
                        {streakGracePeriod ? `⚠️ Chuỗi ${currentStreak}` : `🔥 ${currentStreak} ngày`}
                    </Text>
                </View>
            </View>

            {/* Tiến độ hoàn thành */}
            <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                    Đã hoàn thành <Text style={styles.progressBold}>{completedCount}/{totalCount}</Text> nhiệm vụ
                </Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.track}>
                <View style={[styles.fill, { width: `${progressPercent}%` }]} />
            </View>

            {/* Danh sách 3 việc sắp tới */}
            <View style={styles.taskListContainer}>
                {totalCount === 0 ? (
                    <Text style={styles.emptyText}>Chưa có nhiệm vụ nào cho ngày hôm nay 🌱</Text>
                ) : upcomingTasks.length === 0 ? (
                    <View style={styles.completedAllBox}>
                        <MaterialIcons name="stars" size={22} color="#16A34A" />
                        <Text style={styles.completedAllText}>
                            Xuất sắc! Bạn đã hoàn thành toàn bộ mục tiêu hôm nay! 🎉
                        </Text>
                    </View>
                ) : (
                    upcomingTasks.map(({ task, originalIndex }) => (
                        <TouchableOpacity
                            key={task._id || `task_${originalIndex}`}
                            style={styles.taskItem}
                            activeOpacity={0.7}
                            onPress={() => onPressTask?.(originalIndex)}
                            disabled={!onPressTask}
                        >
                            <View style={styles.taskBullet} />
                            <Text style={styles.taskTitle} numberOfLines={1}>
                                {task.title}
                            </Text>
                            {task.scheduledTime ? (
                                <View style={styles.timeTag}>
                                    <MaterialIcons name="schedule" size={12} color="#6B7280" />
                                    <Text style={styles.timeText}>{task.scheduledTime}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </View>
    );
});

TaskSummaryWidget.displayName = 'TaskSummaryWidget';

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
        ...SHADOWS.clayLight,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.clayText,
    },
    streakBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    streakBadgeWarning: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
    },
    streakBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.clayText,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        color: COLORS.clayText,
        opacity: 0.8,
    },
    progressBold: {
        fontWeight: '700',
        color: COLORS.clayAccent1,
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.clayText,
    },
    track: {
        height: 8,
        backgroundColor: 'rgba(93, 64, 55, 0.08)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    fill: {
        height: '100%',
        backgroundColor: '#22C55E',
        borderRadius: 4,
    },
    taskListContainer: {
        gap: 8,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
    },
    taskBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.clayAccent1,
    },
    taskTitle: {
        flex: 1,
        fontSize: 13,
        color: COLORS.clayText,
        fontWeight: '500',
    },
    timeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    timeText: {
        fontSize: 11,
        color: '#4B5563',
    },
    emptyText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 6,
    },
    completedAllBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#DCFCE7',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#86EFAC',
    },
    completedAllText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#15803D',
        flex: 1,
    },
});
