import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Journal } from '../types';
import { COLORS, FONT_SIZES } from '../theme';

interface JournalContentProps {
    journal: Journal | null;
    manualContent: string;
    onOpenEditor: () => void;
}

const Tag = ({ label }: { label: string }) => (
    <View style={styles.tag}>
        <Text style={styles.tagText}>{label}</Text>
    </View>
);

const JournalContent: React.FC<JournalContentProps> = ({
    journal,
    manualContent,
    onOpenEditor,
}) => {
    // Build adventure log entries from journal data
    const entries: Array<{
        title: string;
        subtitle: string;
        note?: string;
        xp?: number;
        icon: keyof typeof MaterialIcons.glyphMap;
        iconBg: string;
        tags?: string[];
    }> = [];

    if (journal) {
        // Auto-logged tasks
        if (journal.autoLoggedTasks && journal.autoLoggedTasks.length > 0) {
            journal.autoLoggedTasks.forEach((task: any) => {
                entries.push({
                    title: task.title || 'Quest hoàn thành',
                    subtitle: `${task.completedAt ? new Date(task.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''} • ${task.category || 'Quest'}`,
                    xp: task.pointsEarned || 0,
                    icon: 'check',
                    iconBg: COLORS.clayAccent2,
                });
            });
        }

        // Manual content as entry
        if (manualContent) {
            entries.push({
                title: 'Ghi chép',
                subtitle: 'Nhật ký cá nhân',
                note: manualContent,
                icon: 'edit',
                iconBg: COLORS.clayCard,
            });
        }
    }

    return (
        <View>
            {/* --- ADVENTURE LOG --- */}
            <View style={styles.timelineSection}>
                <View style={styles.timelineHeader}>
                    <Text style={styles.sectionTitle}>Adventure Log</Text>
                    <TouchableOpacity
                        style={styles.addNoteBtn}
                        onPress={onOpenEditor}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="edit-note" size={18} color={COLORS.clayAccent2} />
                        <Text style={styles.addNoteBtnText}>Ghi chú</Text>
                    </TouchableOpacity>
                </View>

                {/* Vertical Dashed Line */}
                <View style={styles.dashedLineContainer}>
                    <View style={styles.dashedLine} />
                </View>

                {entries.length > 0 ? (
                    entries.map((entry, index) => (
                        <View key={index} style={styles.entryRow}>
                            {/* Timeline Icon */}
                            <View style={[styles.timelineIconBox, { backgroundColor: entry.iconBg }]}>
                                <MaterialIcons name={entry.icon} size={16} color="#FFF" />
                            </View>

                            {/* Card Content */}
                            <View style={styles.clayCard}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle}>{entry.title}</Text>
                                        <Text style={styles.cardSubtitle}>{entry.subtitle}</Text>
                                    </View>
                                    {entry.xp != null && entry.xp > 0 && (
                                        <View style={styles.xpBadge}>
                                            <Text style={styles.xpText}>+{entry.xp} XP</Text>
                                        </View>
                                    )}
                                </View>

                                {entry.note && (
                                    <View style={styles.noteBox}>
                                        <Text style={styles.noteText}>"{entry.note}"</Text>
                                    </View>
                                )}

                                {entry.tags && entry.tags.length > 0 && (
                                    <View style={styles.tagsRow}>
                                        {entry.tags.map((tag) => (
                                            <Tag key={tag} label={tag} />
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyLog}>
                        <Text style={styles.emptyLogText}>
                            Chưa có log nào hôm nay — hoàn thành quest để tự động ghi nhận!
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
        textShadowColor: 'rgba(255,255,255,0.4)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },

    // Timeline
    timelineSection: {
        position: 'relative',
        paddingHorizontal: 24,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 247, 205, 0.9)',
        zIndex: 20,
        paddingBottom: 16,
    },
    addNoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245,119,153,0.2)',
    },
    addNoteBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.clayAccent2,
    },
    dashedLineContainer: {
        position: 'absolute',
        left: 43, // 24 padding + 19
        top: 40,
        bottom: 0,
        width: 2,
        zIndex: 0,
        overflow: 'hidden',
    },
    dashedLine: {
        height: '100%',
        width: 1,
        borderWidth: 1,
        borderColor: '#F57799',
        borderStyle: 'dashed',
        borderRadius: 1,
    },

    // Entry
    entryRow: {
        flexDirection: 'row',
        marginBottom: 24,
        paddingLeft: 48,
        position: 'relative',
    },
    timelineIconBox: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: COLORS.warmBg,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 3,
    },

    // Card
    clayCard: {
        flex: 1,
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(93, 64, 55, 0.7)',
        marginTop: 2,
    },
    xpBadge: {
        backgroundColor: COLORS.clayAccent2,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    xpText: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: '#FFF',
    },
    noteBox: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 10,
        borderRadius: 12,
        marginBottom: 8,
    },
    noteText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: 'rgba(93, 64, 55, 0.8)',
    },

    // Tags
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: '#FFF',
    },

    // Empty
    emptyLog: {
        padding: 24,
        alignItems: 'center',
    },
    emptyLogText: {
        fontSize: 14,
        color: COLORS.clayText,
        opacity: 0.5,
        textAlign: 'center',
    },
});

export default JournalContent;
