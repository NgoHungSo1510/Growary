import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DailyTask } from '../../types';
import { COLORS } from '../../theme';
import { CATEGORY_MAP } from './QuestPickerModal';

interface TimelineTaskCardProps {
    task: DailyTask;
    index: number;
    onPress: (task: DailyTask, index: number) => void;
    onEditTime: (task: DailyTask) => void;
}

const TimelineTaskCardComponent: React.FC<TimelineTaskCardProps> = ({
    task,
    index,
    onPress,
    onEditTime,
}) => {
    const cat = CATEGORY_MAP[task.category || 'other'] || CATEGORY_MAP.other;
    const isPending = task.adminApprovalStatus === 'pending';

    return (
        <View style={styles.timelineRow}>
            {/* Time label */}
            <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>
                    {task.scheduledTime || '--:--'}
                </Text>
            </View>

            {/* Dot */}
            <View style={styles.dotColumn}>
                <View style={[styles.timelineDot, { backgroundColor: cat.bg }]}>
                    {task.isMandatory && <Text style={{ fontSize: 8 }}>⭐</Text>}
                </View>
            </View>

            {/* Card */}
            <TouchableOpacity
                style={[
                    styles.timelineCard,
                    { backgroundColor: cat.bg },
                    task.isMandatory && !task.scheduledTime && styles.mandatoryPulse,
                ]}
                activeOpacity={0.8}
                onPress={() => onPress(task, index)}
            >
                <View style={styles.cardRow}>
                    <View style={styles.cardIconBox}>
                        <MaterialIcons name={cat.icon} size={22} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
                        <View style={styles.cardMeta}>
                            <Text style={styles.cardXp}>+{task.pointsReward} XP</Text>
                            {task.durationMinutes ? (
                                <Text style={styles.cardDuration}>{task.durationMinutes} phút</Text>
                            ) : null}
                        </View>
                    </View>
                    {task.isMandatory && (
                        <View style={styles.mandatoryBadge}>
                            <Text style={styles.mandatoryText}>Bắt buộc</Text>
                        </View>
                    )}
                    {isPending && (
                        <View style={[styles.mandatoryBadge, { backgroundColor: 'rgba(234,179,8,0.3)' }]}>
                            <Text style={[styles.mandatoryText, { color: '#B45309' }]}>Chờ duyệt</Text>
                        </View>
                    )}
                    {task.isMandatory && !task.scheduledTime && (
                        <TouchableOpacity
                            style={styles.setTimeBtn}
                            onPress={() => onEditTime(task)}
                        >
                            <Text style={styles.setTimeText}>🕒 Chọn giờ</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    timeColumn: {
        width: 48,
        alignItems: 'flex-end',
        paddingRight: 8,
        paddingTop: 12,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(93,64,55,0.6)',
    },
    dotColumn: {
        width: 20,
        alignItems: 'center',
        paddingTop: 14,
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    timelineCard: {
        flex: 1,
        borderRadius: 18,
        padding: 12,
        marginLeft: 8,
        shadowColor: '#5D4037',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    mandatoryPulse: {
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cardIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    cardMeta: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 2,
    },
    cardXp: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
    },
    cardDuration: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },
    mandatoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    mandatoryText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    setTimeBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    setTimeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
});

export const TimelineTaskCard = React.memo(TimelineTaskCardComponent);
