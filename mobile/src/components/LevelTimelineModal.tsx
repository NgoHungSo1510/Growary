import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../theme';
import { apiService } from '../services/api';

interface LevelTimelineModalProps {
    visible: boolean;
    onClose: () => void;
    currentXP: number;
    currentLevel: number;
}

export default function LevelTimelineModal({ visible, onClose, currentXP, currentLevel }: LevelTimelineModalProps) {
    const [levels, setLevels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            apiService.getLevels().then(data => {
                setLevels(data.levels || []);
                setIsLoading(false);
            }).catch(e => {
                console.warn('Failed to fetch levels', e);
                setIsLoading(false);
            });
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>🏆 Lộ Trình Cấp Độ</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.clayText }}>Đang tải lộ trình...</Text>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {levels.length === 0 && (
                                <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Chưa có cấu hình cấp độ</Text>
                            )}
                            {levels.map((lvl, index) => {
                                const isPassed = currentLevel >= lvl.level;
                                const isCurrent = currentLevel === lvl.level;
                                const isNext = currentLevel + 1 === lvl.level;

                                return (
                                    <View key={lvl._id} style={styles.levelRow}>
                                        <View style={styles.timelineCol}>
                                            <View style={[
                                                styles.node,
                                                isPassed && styles.nodePassed,
                                                isCurrent && styles.nodeCurrent
                                            ]}>
                                                {isPassed && !isCurrent ? (
                                                    <MaterialIcons name="check" size={16} color="#FFF" />
                                                ) : (
                                                    <Text style={[
                                                        styles.nodeText,
                                                        (isPassed || isCurrent) && { color: '#FFF' }
                                                    ]}>{lvl.level}</Text>
                                                )}
                                            </View>
                                            {index < levels.length - 1 && (
                                                <View style={[styles.line, isPassed && styles.linePassed]} />
                                            )}
                                        </View>
                                        <View style={[styles.card, isCurrent && styles.cardCurrent]}>
                                            <Text style={styles.cardTitle}>Cấp {lvl.level}</Text>
                                            <Text style={styles.cardXp}>Yêu cầu: {lvl.xpRequired.toLocaleString()} XP</Text>

                                            {(lvl.coinReward > 0 || lvl.gachaTickets > 0 || (lvl.rewardItems && lvl.rewardItems.length > 0) || lvl.unlockDescription) && (
                                                <View style={styles.rewardsBox}>
                                                    {lvl.coinReward > 0 && (
                                                        <Text style={styles.rewardText}>🎁 +{lvl.coinReward} G</Text>
                                                    )}
                                                    {lvl.gachaTickets > 0 && (
                                                        <Text style={styles.rewardText}>🎟️ +{lvl.gachaTickets} Vé Gacha</Text>
                                                    )}
                                                    {lvl.rewardItems && lvl.rewardItems.length > 0 && (
                                                        <Text style={styles.rewardText}>🛍️ +{lvl.rewardItems.length} Vật phẩm</Text>
                                                    )}
                                                    {!!lvl.unlockDescription && (
                                                        <Text style={styles.rewardText}>🔓 {lvl.unlockDescription}</Text>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    backdrop: { flex: 1 },
    container: {
        backgroundColor: COLORS.warmBg,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '80%',
        paddingTop: 20
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderColor: 'rgba(93,64,55,0.1)'
    },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.clayText },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(93,64,55,0.05)',
        alignItems: 'center', justifyContent: 'center'
    },
    scrollContent: { padding: 24 },
    levelRow: { flexDirection: 'row', marginBottom: 0 },
    timelineCol: { alignItems: 'center', width: 40, marginRight: 16 },
    node: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB',
        alignItems: 'center', justifyContent: 'center', zIndex: 2, borderWidth: 2, borderColor: '#FFF'
    },
    nodeText: { fontSize: 13, fontWeight: 'bold', color: '#9CA3AF' },
    nodePassed: { backgroundColor: '#10B981' }, // Emerald
    nodeCurrent: { backgroundColor: COLORS.clayAccent1, transform: [{ scale: 1.2 }] },
    line: { width: 3, flex: 1, backgroundColor: '#E5E7EB', marginVertical: -4 },
    linePassed: { backgroundColor: '#10B981' },
    card: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16,
        marginBottom: 24, borderWidth: 1, borderColor: 'rgba(93,64,55,0.05)',
        shadowColor: '#A68A64', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2
    },
    cardCurrent: {
        borderColor: COLORS.clayAccent1, borderWidth: 2, backgroundColor: '#FEFCE8'
    },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.clayText, marginBottom: 4 },
    cardXp: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
    rewardsBox: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, gap: 4 },
    rewardText: { fontSize: 13, fontWeight: '600', color: '#4B5563' }
});
