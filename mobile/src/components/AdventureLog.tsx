import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../theme';

interface CompletedTask {
    _id?: string;
    title: string;
    category?: string;
    pointsReward: number;
    coinReward?: number;
    completedAt?: Date | string;
    proofImageUrl?: string;
}

interface Props {
    tasks: CompletedTask[];
}

const CATEGORY_MAP: Record<string, { bg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
    health: { bg: '#FDC3A1', icon: 'fitness-center' },
    study: { bg: '#FB9B8F', icon: 'school' },
    work: { bg: '#F57799', icon: 'work' },
    personal: { bg: '#FDC3A1', icon: 'person' },
    household: { bg: '#FB9B8F', icon: 'home' },
    other: { bg: '#FDC3A1', icon: 'star' },
};

const formatTime = (date?: Date | string): string => {
    if (!date) return '--:--';
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const AdventureLog: React.FC<Props> = ({ tasks }) => {
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    // Sort by completedAt descending
    const sorted = [...tasks].sort((a, b) => {
        const tA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const tB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return tA - tB; // ascending by time (earliest first, like a timeline)
    });

    if (sorted.length === 0) return null;

    const totalXP = sorted.reduce((s, t) => s + t.pointsReward, 0);

    return (
        <View style={styles.wrapper}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📜 Adventure Log</Text>
                <View style={styles.questCountBadge}>
                    <Text style={styles.questCountText}>
                        {sorted.length} quest • {totalXP} XP
                    </Text>
                </View>
            </View>

            {/* Timeline */}
            <View style={styles.timelineWrap}>
                {/* Vertical line */}
                <View style={styles.timelineLine} />

                {sorted.map((task, index) => {
                    const cat = CATEGORY_MAP[task.category || 'other'] || CATEGORY_MAP.other;
                    const time = formatTime(task.completedAt);

                    return (
                        <View key={task._id || `log-${index}`} style={styles.timelineRow}>
                            {/* Time label */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.timeLabel}>{time}</Text>
                            </View>

                            {/* Dot */}
                            <View style={styles.dotColumn}>
                                <View style={[styles.timelineDot, { backgroundColor: cat.bg }]}>
                                    <MaterialIcons name="check" size={8} color="#FFF" />
                                </View>
                            </View>

                            {/* Card */}
                            <TouchableOpacity
                                style={[styles.timelineCard, { backgroundColor: cat.bg }]}
                                activeOpacity={task.proofImageUrl ? 0.8 : 1}
                                onPress={() => task.proofImageUrl && setProofPreview(task.proofImageUrl)}
                            >
                                <View style={styles.cardRow}>
                                    <View style={styles.cardIconBox}>
                                        <MaterialIcons name={cat.icon} size={20} color="#FFF" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
                                        <View style={styles.cardMeta}>
                                            <Text style={styles.cardXp}>+{task.pointsReward} XP</Text>
                                            {(task.coinReward ?? 0) > 0 && (
                                                <Text style={styles.cardCoins}>🪙 +{task.coinReward}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.completedBadge}>
                                        <MaterialIcons name="check-circle" size={14} color="#FFF" />
                                    </View>
                                    {task.proofImageUrl && (
                                        <MaterialIcons name="photo" size={16} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>

            {/* Proof Preview Modal */}
            <Modal visible={!!proofPreview} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.proofOverlay}
                    activeOpacity={1}
                    onPress={() => setProofPreview(null)}
                >
                    <View style={styles.proofContainer}>
                        <Text style={styles.proofTitle}>📸 Bằng chứng</Text>
                        {proofPreview && (
                            <Image source={{ uri: proofPreview }} style={styles.proofImage} resizeMode="contain" />
                        )}
                        <TouchableOpacity style={styles.proofCloseBtn} onPress={() => setProofPreview(null)}>
                            <Text style={styles.proofCloseText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 8,
        paddingHorizontal: 20,
    },

    // Section Header (same style as NewTaskScreen)
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    questCountBadge: {
        backgroundColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    questCountText: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: 'rgba(93, 64, 55, 0.5)',
    },

    // Timeline (matching NewTaskScreen)
    timelineWrap: {
        position: 'relative',
        paddingLeft: 8,
    },
    timelineLine: {
        position: 'absolute',
        left: 56,
        top: 16,
        bottom: 16,
        width: 2,
        backgroundColor: 'rgba(93,64,55,0.1)',
        borderRadius: 1,
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeColumn: {
        width: 44,
        marginRight: 4,
    },
    timeLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.clayText,
        opacity: 0.6,
        textAlign: 'right',
    },
    dotColumn: {
        width: 16,
        alignItems: 'center',
        marginRight: 8,
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineCard: {
        flex: 1,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cardIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 15,
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
        color: 'rgba(255,255,255,0.85)',
    },
    cardCoins: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.75)',
    },
    completedBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },

    // Proof modal
    proofOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proofContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
    },
    proofTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 12,
    },
    proofImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
    },
    proofCloseBtn: {
        marginTop: 12,
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    },
    proofCloseText: {
        fontWeight: '600',
        color: COLORS.clayText,
    },
});

export default AdventureLog;
