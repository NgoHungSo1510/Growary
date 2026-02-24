import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { DailyTask } from '../types';
import { COLORS } from '../theme';
import { apiService } from '../services/api';

const GREEN_SUCCESS = '#4ADE80';

interface QuestListContentProps {
    tasks: DailyTask[];
    planId: string;
    onPlanUpdated: (plan: any, grantedRewards?: any) => void;
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


// Animated quest card wrapper
const AnimatedQuestCard: React.FC<{
    task: DailyTask;
    index: number;
    planId: string;
    onComplete: (index: number, proofUrl: string) => void;
    onUncomplete: (index: number) => void;
    onShowProofPicker: (index: number) => void;
}> = ({ task, index, planId, onComplete, onUncomplete, onShowProofPicker }) => {
    const flashAnim = useRef(new Animated.Value(0)).current;
    const [justCompleted, setJustCompleted] = useState(false);

    useEffect(() => {
        if (justCompleted) {
            Animated.sequence([
                Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
                Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
            ]).start(() => setJustCompleted(false));
        }
    }, [justCompleted]);

    const borderColor = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255,255,255,0.3)', GREEN_SUCCESS],
    });

    const iconName = getCategoryIcon(task.category);
    const iconColor = getCategoryColor(task.category);
    const isPending = task.adminApprovalStatus === 'pending';

    if (task.isCompleted) {
        return null; // Completed tasks rendered separately at bottom
    }

    return (
        <Animated.View style={[styles.clayCard, { borderColor: borderColor as any, borderWidth: 2 }]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                        <MaterialIcons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{task.title}</Text>
                        <Text style={styles.cardSubtitle}>
                            {task.scheduledTime ? `🕐 ${task.scheduledTime}` : (task.category || 'Quest')}
                        </Text>
                    </View>
                </View>

                <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>+{task.coinReward ?? 5} G</Text>
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
                    <Text style={styles.xpBadgeText}>⚡ {task.pointsReward} XP</Text>
                </View>

                {!isPending && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onShowProofPicker(index)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionBtnText}>📸 Hoàn thành</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

// Image picker helpers
const launchCamera = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
        Alert.alert('Lỗi', 'Cần quyền camera để chụp ảnh.');
        return null;
    }
    const result = await ImagePicker.launchCameraAsync({
        quality: 0.6, base64: true, allowsEditing: false,
    });
    if (!result.canceled && result.assets[0].base64) {
        return `data:image/jpeg;base64,${result.assets[0].base64}`;
    }
    return null;
};

const launchLibrary = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh.');
        return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.6, base64: true, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0].base64) {
        return `data:image/jpeg;base64,${result.assets[0].base64}`;
    }
    return null;
};

const QuestListContent: React.FC<QuestListContentProps> = ({ tasks, planId, onPlanUpdated }) => {
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [celebrationData, setCelebrationData] = useState<{ title: string; xp: number } | null>(null);
    const [proofPickerIndex, setProofPickerIndex] = useState<number | null>(null);
    const celebrationScale = useRef(new Animated.Value(0)).current;

    const activeTasks = tasks.filter(t => !t.isCompleted);
    const completedTasks = tasks.filter(t => t.isCompleted);

    const handleProofPick = async (source: 'camera' | 'library') => {
        const idx = proofPickerIndex;
        setProofPickerIndex(null);
        if (idx === null) return;
        const base64 = source === 'camera' ? await launchCamera() : await launchLibrary();
        if (base64) handleComplete(idx, base64);
    };

    const showCelebration = (title: string, xp: number) => {
        setCelebrationData({ title, xp });
        celebrationScale.setValue(0);
        Animated.spring(celebrationScale, {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
        }).start();
    };

    const closeCelebration = () => {
        Animated.timing(celebrationScale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setCelebrationData(null));
    };

    const handleComplete = async (index: number, base64Image: string) => {
        setLoadingIndex(index);
        try {
            const taskToComplete = activeTasks[index];
            // Upload to Cloudinary
            const { url } = await apiService.uploadProofImage(base64Image);

            // Mark as complete with proof URL
            const realIndex = tasks.findIndex(t => t._id === taskToComplete?._id);
            if (realIndex === -1) return;
            const { plan, grantedRewards } = await apiService.completeTask(planId, realIndex, true, url);
            onPlanUpdated(plan, grantedRewards);

            // Show celebration
            showCelebration(taskToComplete.title, taskToComplete.pointsReward);
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể hoàn thành quest.');
        } finally {
            setLoadingIndex(null);
        }
    };

    const handleUncomplete = async (index: number) => {
        try {
            const { plan } = await apiService.completeTask(planId, index, false);
            onPlanUpdated(plan, undefined);
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể hoàn tác.');
        }
    };

    if (tasks.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Chưa có quest hôm nay</Text>
                <Text style={styles.emptySubtitle}>
                    Nhấn nút + để thêm việc cho ngày mai
                </Text>
            </View>
        );
    }

    return (
        <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Quests</Text>
                <View style={styles.timerBadge}>
                    <Text style={styles.timerText}>
                        {activeTasks.length} còn lại
                    </Text>
                </View>
            </View>

            {/* Loading overlay */}
            {loadingIndex !== null && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={COLORS.clayAccent2} />
                    <Text style={styles.loadingText}>Đang upload ảnh...</Text>
                </View>
            )}

            {/* Active Quest Cards */}
            {activeTasks.map((task, index) => (
                <AnimatedQuestCard
                    key={task._id || `active-${index}`}
                    task={task}
                    index={index}
                    planId={planId}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onShowProofPicker={(i) => setProofPickerIndex(i)}
                />
            ))}



            {/* Proof Image Preview Modal */}
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

            {/* 🎉 Celebration Modal */}
            <Modal visible={!!celebrationData} transparent animationType="fade">
                <View style={styles.celebrationOverlay}>
                    <Animated.View style={[
                        styles.celebrationCard,
                        { transform: [{ scale: celebrationScale }] },
                    ]}>
                        <LinearGradient
                            colors={[COLORS.clayCard, COLORS.clayAccent1]}
                            style={styles.celebrationGradient}
                        >
                            <Text style={styles.celebrationEmoji}>🎉</Text>
                            <Text style={styles.celebrationTitle}>Quest hoàn thành!</Text>
                            <Text style={styles.celebrationQuestName}>
                                {celebrationData?.title}
                            </Text>

                            <View style={styles.celebrationXpRow}>
                                <View style={styles.celebrationXpBadge}>
                                    <Text style={styles.celebrationXpText}>
                                        +{celebrationData?.xp} XP
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.celebrationStars}>
                                {['⭐', '🌟', '⭐'].map((star, i) => (
                                    <Text key={i} style={{ fontSize: 24, marginHorizontal: 4 }}>{star}</Text>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.celebrationBtn}
                                onPress={closeCelebration}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.celebrationBtnText}>Tuyệt vời! 🚀</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>

            {/* 📸 Proof Picker Modal */}
            <Modal visible={proofPickerIndex !== null} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setProofPickerIndex(null)}
                >
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerTitle}>📸 Gửi bằng chứng</Text>
                        <Text style={styles.pickerSubtitle}>
                            Chụp ảnh hoặc chọn từ thư viện để xác nhận hoàn thành quest
                        </Text>

                        <View style={styles.pickerButtons}>
                            <TouchableOpacity
                                style={styles.pickerBtn}
                                activeOpacity={0.7}
                                onPress={() => handleProofPick('camera')}
                            >
                                <View style={[styles.pickerIconBox, { backgroundColor: 'rgba(251,155,143,0.15)' }]}>
                                    <MaterialIcons name="photo-camera" size={28} color={COLORS.clayAccent1} />
                                </View>
                                <Text style={styles.pickerBtnTitle}>Chụp ảnh</Text>
                                <Text style={styles.pickerBtnSub}>Mở camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.pickerBtn}
                                activeOpacity={0.7}
                                onPress={() => handleProofPick('library')}
                            >
                                <View style={[styles.pickerIconBox, { backgroundColor: 'rgba(245,119,153,0.12)' }]}>
                                    <MaterialIcons name="photo-library" size={28} color={COLORS.clayAccent2} />
                                </View>
                                <Text style={styles.pickerBtnTitle}>Thư viện</Text>
                                <Text style={styles.pickerBtnSub}>Chọn ảnh có sẵn</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.pickerCancelBtn}
                            onPress={() => setProofPickerIndex(null)}
                        >
                            <Text style={styles.pickerCancelText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
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

    // Loading
    loadingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
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

    // Clay Card
    clayCard: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        marginHorizontal: 20,
        borderWidth: 2,
        borderColor: COLORS.whiteOp,
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
        marginBottom: 16,
    },
    cardLeft: {
        flexDirection: 'row',
        gap: 16,
        flex: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.whiteOp,
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
        marginTop: 4,
    },
    rewardBadge: {
        backgroundColor: '#FEF08A',
        borderColor: '#FEF08A',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    rewardText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6a7306ff',
    },

    // Pending banner
    pendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 12,
    },
    pendingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#B45309',
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    xpBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#22C55E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    xpBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#22C55E',
    },
    actionBtn: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
    },

    // Completed Section
    completedSection: {
        marginHorizontal: 20,
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    completedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    completedHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.7,
    },
    completedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(93,64,55,0.06)',
    },
    completedRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    completedRowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.clayText,
        opacity: 0.5,
        textDecorationLine: 'line-through',
        flex: 1,
    },
    completedRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    completedXp: {
        fontSize: 12,
        fontWeight: 'bold',
        color: GREEN_SUCCESS,
    },

    // Proof Preview Modal
    proofOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proofContainer: {
        backgroundColor: COLORS.warmBg,
        borderRadius: 24,
        padding: 20,
        width: '85%',
        alignItems: 'center',
    },
    proofTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 12,
    },
    proofImage: {
        width: '100%',
        height: 280,
        borderRadius: 16,
        marginBottom: 16,
    },
    proofCloseBtn: {
        backgroundColor: COLORS.clayAccent2,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    proofCloseText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // 🎉 Celebration Modal
    celebrationOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    celebrationCard: {
        width: '80%',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: COLORS.clayAccent1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    celebrationGradient: {
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        borderRadius: 28,
    },
    celebrationEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    celebrationTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        marginBottom: 8,
    },
    celebrationQuestName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(93,64,55,0.8)',
        textAlign: 'center',
        marginBottom: 16,
    },
    celebrationXpRow: {
        marginBottom: 16,
    },
    celebrationXpBadge: {
        backgroundColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    celebrationXpText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    celebrationStars: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    celebrationBtn: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    celebrationBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
    },

    // Proof Picker Modal
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    pickerSheet: {
        backgroundColor: COLORS.warmBg,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
        borderTopWidth: 2,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    pickerHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(93,64,55,0.15)',
        marginBottom: 16,
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 6,
    },
    pickerSubtitle: {
        fontSize: 13,
        color: COLORS.clayText,
        opacity: 0.5,
        textAlign: 'center',
        marginBottom: 24,
    },
    pickerButtons: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
        width: '100%',
    },
    pickerBtn: {
        flex: 1,
        backgroundColor: '#FFFDF5',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#D29664',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    pickerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    pickerBtnTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 2,
    },
    pickerBtnSub: {
        fontSize: 11,
        color: COLORS.clayText,
        opacity: 0.4,
    },
    pickerCancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    pickerCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.clayText,
        opacity: 0.6,
    },

    // Empty State
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 56,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.clayText,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.clayText,
        opacity: 0.5,
        textAlign: 'center',
    },
});

export default QuestListContent;
