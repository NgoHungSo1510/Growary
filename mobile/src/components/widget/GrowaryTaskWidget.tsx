import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';
import type { WidgetSnapshotData } from '../../utils/widgetSnapshot';

export interface GrowaryTaskWidgetProps {
    snapshot: WidgetSnapshotData;
}

export const GrowaryTaskWidget: React.FC<GrowaryTaskWidgetProps> = React.memo(({ snapshot }) => {
    const progressPercent =
        snapshot.totalCount > 0
            ? Math.round((snapshot.completedCount / snapshot.totalCount) * 100)
            : 0;

    return (
        <View style={styles.widgetContainer}>
            <View style={styles.headerRow}>
                <Text style={styles.brandTitle}>🌱 Growary Hôm Nay</Text>
                <View style={styles.badgeRow}>
                    <Text style={styles.streakBadge}>🔥 {snapshot.streak}</Text>
                    <Text style={styles.coinBadge}>🪙 {snapshot.coins}</Text>
                </View>
            </View>

            <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                    Hoàn thành: {snapshot.completedCount}/{snapshot.totalCount} ({progressPercent}%)
                </Text>
                {snapshot.pendingSyncCount > 0 && (
                    <Text style={styles.syncTag}>⏳ Chờ đồng bộ ({snapshot.pendingSyncCount})</Text>
                )}
            </View>

            <View style={styles.taskList}>
                {snapshot.nextTasks.length === 0 ? (
                    <Text style={styles.allDoneText}>
                        🎉 Tuyệt vời! Bạn đã hoàn thành toàn bộ nhiệm vụ hôm nay.
                    </Text>
                ) : (
                    snapshot.nextTasks.map((task, idx) => (
                        <View key={`${task.title}-${idx}`} style={styles.taskItem}>
                            <Text style={styles.taskBullet}>⬜</Text>
                            <Text style={styles.taskTitle} numberOfLines={1}>
                                {task.title}
                            </Text>
                            {task.scheduledTime && (
                                <Text style={styles.taskTime}>{task.scheduledTime}</Text>
                            )}
                        </View>
                    ))
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    widgetContainer: {
        backgroundColor: '#FFFDF5',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(210, 150, 100, 0.35)',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    brandTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    streakBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayAccent1,
    },
    coinBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D97706',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16A34A',
    },
    syncTag: {
        fontSize: 11,
        fontWeight: '600',
        color: '#B45309',
    },
    taskList: {
        gap: 6,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    taskBullet: {
        fontSize: 11,
    },
    taskTitle: {
        flex: 1,
        fontSize: 12,
        color: COLORS.clayText,
    },
    taskTime: {
        fontSize: 11,
        color: COLORS.clayText,
        opacity: 0.65,
        fontWeight: '600',
    },
    allDoneText: {
        fontSize: 12,
        color: '#15803D',
        fontWeight: '600',
    },
});

