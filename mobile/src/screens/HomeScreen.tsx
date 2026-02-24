import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TextInput,
    Modal,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DailyPlan, Journal } from '../types';
import ClayHeader from '../components/ClayHeader';
import QuestListContent from '../components/QuestListContent';
import AdventureLog from '../components/AdventureLog';
import RewardCelebrationModal from '../components/RewardCelebrationModal';
import { requestNotificationPermissions, scheduleAllQuestReminders } from '../services/notifications';
import { COLORS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const { user, refreshUser } = useAuth();
    const insets = useSafeAreaInsets();
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [levels, setLevels] = useState<any[]>([]);
    const [todayJournal, setTodayJournal] = useState<Journal | null>(null);
    const [manualContent, setManualContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editorText, setEditorText] = useState('');

    // Reward Celebration Modal State
    const [grantedRewards, setGrantedRewards] = useState<any | null>(null);

    const fetchData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [planRes, journalRes, levelRes] = await Promise.all([
                apiService.getTodayPlan(),
                apiService.getJournalByDate(today).catch(() => ({ journal: null })),
                apiService.getLevels().catch(() => ({ levels: [] })),
            ]);
            setPlan(planRes.plan);
            if (levelRes.levels) setLevels(levelRes.levels);

            // Schedule quest reminders
            if (planRes.plan?.tasks) {
                scheduleAllQuestReminders(planRes.plan.tasks);
            }

            if (journalRes.journal) {
                setTodayJournal(journalRes.journal);
                setManualContent(journalRes.journal.manualContent || '');
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            requestNotificationPermissions();
            fetchData();
            refreshUser();
        }, [])
    );

    const handlePlanUpdated = (updatedPlan: DailyPlan, newRewards?: any) => {
        setPlan(updatedPlan);
        if (newRewards) {
            setGrantedRewards(newRewards);
        }
        refreshUser();
    };

    const handleOpenEditor = () => {
        setEditorText(manualContent);
        setShowEditor(true);
    };

    const handleSaveEditor = async () => {
        setManualContent(editorText);
        setShowEditor(false);
        const today = new Date().toISOString().split('T')[0];
        try {
            const res = await apiService.updateJournal(today, {
                manualContent: editorText,
            });
            if (res.journal) setTodayJournal(res.journal);
        } catch (error) {
            console.error('Failed to save journal:', error);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    const completedCount = plan?.tasks.filter((t) => t.isCompleted).length || 0;
    const totalCount = plan?.tasks.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: COLORS.clayText }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ClayHeader user={user} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            >
                {/* ClayHeader is now self-contained for calculating XP and Tracking level-ups */}


                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, styles.streakBox]}>
                        <Text style={[styles.statValue, { color: COLORS.clayAccent1 }]}>
                            {user?.currentStreak || 0}
                        </Text>
                        <Text style={styles.statLabel}>🔥 Streak</Text>
                    </View>
                    <View style={[styles.statBox, styles.completedBox]}>
                        <Text style={[styles.statValue, { color: '#22C55E' }]}>
                            {completedCount}/{totalCount}
                        </Text>
                        <Text style={styles.statLabel}>✅ Hoàn thành</Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]}>
                            <View style={styles.progressShine} />
                        </View>
                    </View>
                </View>

                {/* ── QUEST LIST ── */}
                <QuestListContent
                    tasks={plan?.tasks || []}
                    planId={plan?._id || ''}
                    onPlanUpdated={handlePlanUpdated}
                />

                {/* ── ADVENTURE LOG ── */}
                <AdventureLog tasks={(plan?.tasks || []).filter(t => t.isCompleted)} />

                {/* Backlog Notice */}
                {plan && plan.backlogFromPreviousDay.length > 0 && (
                    <View style={styles.backlogNotice}>
                        <Text style={styles.backlogText}>
                            ⚠️ Có {plan.backlogFromPreviousDay.length} việc từ hôm qua chưa làm
                        </Text>
                    </View>
                )}



                {/* Bottom spacer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── JOURNAL EDITOR MODAL ── */}
            <Modal
                visible={showEditor}
                animationType="slide"
                transparent
                onRequestClose={() => setShowEditor(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>📝 Ghi chép</Text>
                        <TextInput
                            style={styles.modalInput}
                            multiline
                            placeholder="Ghi lại điều gì đó về ngày hôm nay..."
                            placeholderTextColor="rgba(93,64,55,0.4)"
                            value={editorText}
                            onChangeText={setEditorText}
                            textAlignVertical="top"
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowEditor(false)}
                            >
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSaveEditor}
                            >
                                <Text style={styles.saveBtnText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── FLOATING JOURNAL FAB ── */}
            <TouchableOpacity
                style={[styles.fab, { bottom: 90 + insets.bottom }]}
                activeOpacity={0.8}
                onPress={handleOpenEditor}
            >
                <MaterialIcons name="edit-note" size={28} color="#FFF" />
                {manualContent.length > 0 && (
                    <View style={styles.fabDot} />
                )}
            </TouchableOpacity>

            <RewardCelebrationModal
                visible={!!grantedRewards}
                rewards={grantedRewards}
                onClose={() => setGrantedRewards(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.warmBg,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 12,
        gap: 12,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 16,
        paddingVertical: 12,
        borderWidth: 1,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    streakBox: {
        backgroundColor: '#FFF0EE',
        borderColor: '#FBCFC8',
        shadowColor: COLORS.clayAccent1,
    },
    completedBox: {
        backgroundColor: '#EEFBF3',
        borderColor: '#B5E8C8',
        shadowColor: '#22C55E',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.clayText,
        opacity: 0.6,
        marginTop: 2,
        fontWeight: '600',
    },

    // Progress
    progressSection: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    progressTrack: {
        height: 12,
        backgroundColor: COLORS.clayInset,
        borderRadius: 6,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(237, 113, 113, 0.5)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.clayAccent1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    // Backlog
    backlogNotice: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 12,
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,202,40,0.3)',
    },
    backlogText: {
        color: COLORS.clayText,
        textAlign: 'center',
        fontSize: 13,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.warmBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 300,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        padding: 14,
        fontSize: 14,
        color: COLORS.clayText,
        minHeight: 150,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    cancelBtnText: {
        color: COLORS.clayText,
        fontWeight: '600',
    },
    saveBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: COLORS.clayAccent2,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: '600',
    },

    // Floating Journal FAB
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.clayAccent2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.clayAccent2,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 100,
    },
    fabDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4ADE80',
        borderWidth: 2,
        borderColor: '#FFF',
    },
});
