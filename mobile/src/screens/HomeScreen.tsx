import React, { useState, useCallback, useEffect } from 'react';
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
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../hooks';
import { DailyPlan, Journal } from '../types';
import ClayHeader from '../components/ClayHeader';
import { QuestListContent } from '../components/QuestListContent';
import AdventureLog from '../components/AdventureLog';
import PenaltyModal from '../components/PenaltyModal';
import { StreakGraceBanner } from '../components/StreakGraceBanner';
import { TaskSummaryWidget } from '../components/TaskSummaryWidget';
import {
    ensureNotificationChannelAndPermissions,
    scheduleAllQuestReminders,
    cacheNotificationConfigs,
    announceUnreadServerNotifications,
} from '../services/notifications';
import {
    getCachedSnapshot,
    setCachedSnapshot,
    SNAPSHOT_KEYS,
    setGlobalSyncState,
} from '../services/offlineSnapshotStore';
import { syncWidgetSnapshot } from '../utils/widgetSnapshot';
import { COLORS } from '../theme';

export default function HomeScreen() {
    const { user, refreshUser } = useAuth();
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [, setTodayJournal] = useState<Journal | null>(null);
    const [manualContent, setManualContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editorText, setEditorText] = useState('');
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);

    const { pendingCount, flushNow, queueAction, refreshQueueCount } = useOfflineSync(
        (latestPlan) => {
            setPlan(latestPlan);
            void setCachedSnapshot(SNAPSHOT_KEYS.TODAY_PLAN, latestPlan);
            void refreshUser();
        }
    );

    // Instant Cache-First load (<50ms)
    useEffect(() => {
        let isMounted = true;
        const loadInstantCache = async () => {
            const cachedPlan = await getCachedSnapshot<DailyPlan>(SNAPSHOT_KEYS.TODAY_PLAN);
            if (cachedPlan && isMounted) {
                setPlan(cachedPlan);
                setIsLoading(false);
                if (cachedPlan.tasks?.length) {
                    void scheduleAllQuestReminders(cachedPlan.tasks);
                }
            }
        };
        void loadInstantCache();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        void syncWidgetSnapshot(plan, user, pendingCount);
    }, [plan, user, pendingCount]);

    const fetchData = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
            }
            setGlobalSyncState({ isSyncing: true });

            await flushNow().catch(() => undefined);

            const today = new Date().toISOString().split('T')[0];
            const [planRes, journalRes] = await Promise.all([
                apiService.getTodayPlan().catch(async () => {
                    const cached = await getCachedSnapshot<DailyPlan>(SNAPSHOT_KEYS.TODAY_PLAN);
                    return { plan: cached };
                }),
                apiService.getJournalByDate(today).catch(() => ({ journal: null })),
            ]);

            if (planRes?.plan) {
                setPlan(planRes.plan);
                await setCachedSnapshot(SNAPSHOT_KEYS.TODAY_PLAN, planRes.plan);

                const [cfgRes, notifRes] = await Promise.all([
                    apiService.get<{ configs?: any[] }>('/notifications/configs').catch(() => ({ configs: undefined })),
                    apiService.get<{ notifications?: any[] }>('/notifications', { page: 1, limit: 5 }).catch(() => ({ notifications: [] })),
                ]);

                if (cfgRes?.configs) {
                    await cacheNotificationConfigs(cfgRes.configs);
                }
                if (notifRes?.notifications?.length) {
                    void announceUnreadServerNotifications(notifRes.notifications);
                }
                if (planRes.plan.tasks) {
                    await scheduleAllQuestReminders(planRes.plan.tasks, cfgRes?.configs);
                }
            }

            if (journalRes?.journal) {
                setTodayJournal(journalRes.journal);
                setManualContent(journalRes.journal.manualContent || '');
            }

            await refreshQueueCount();
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setGlobalSyncState({ isSyncing: false });
        }
    };

    useFocusEffect(
        useCallback(() => {
            void ensureNotificationChannelAndPermissions().then(() => fetchData(false));
            refreshUser().then((updatedUser) => {
                if (updatedUser?.pendingPenalties && updatedUser.pendingPenalties.length > 0) {
                    setShowPenaltyModal(true);
                }
            });
        }, [])
    );

    const handlePlanUpdated = (updatedPlan: DailyPlan | null) => {
        if (updatedPlan) {
            setPlan(updatedPlan);
            void setCachedSnapshot(SNAPSHOT_KEYS.TODAY_PLAN, updatedPlan);
        }
        void refreshUser();
        void refreshQueueCount();
    };

    const handleOpenEditor = () => {
        setEditorText(manualContent);
        setShowEditor(true);
    };

    const handleSaveEditor = async () => {
        const nextText = editorText;
        setManualContent(nextText);
        setShowEditor(false);
        const today = new Date().toISOString().split('T')[0];
        try {
            const res = await apiService.updateJournal(today, { manualContent: nextText });
            if (res?.journal) setTodayJournal(res.journal);
        } catch {
            await queueAction('SAVE_JOURNAL', {
                date: today,
                manualContent: nextText,
                mood: 'neutral',
            });
        }
    };

    const completedCount = plan?.tasks.filter((t) => t.isCompleted).length || 0;
    const totalCount = plan?.tasks.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (isLoading && !plan) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: COLORS.clayText }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ClayHeader user={user} />
            <StreakGraceBanner user={user} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => void fetchData(true)}
                    />
                }
            >
                <TaskSummaryWidget
                    tasks={plan?.tasks || []}
                    currentStreak={user?.currentStreak || 0}
                    streakGracePeriod={user?.streakGracePeriod}
                />
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

                <View style={styles.progressSection}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]}>
                            <View style={styles.progressShine} />
                        </View>
                    </View>
                </View>

                <QuestListContent
                    tasks={plan?.tasks || []}
                    planId={plan?._id || ''}
                    onPlanUpdated={handlePlanUpdated}
                />

                <AdventureLog tasks={(plan?.tasks || []).filter((t) => t.isCompleted)} />

                {plan && plan.backlogFromPreviousDay.length > 0 && (
                    <View style={styles.backlogNotice}>
                        <Text style={styles.backlogText}>
                            ⚠️ Có {plan.backlogFromPreviousDay.length} việc từ hôm qua chưa làm
                        </Text>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

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
                            value={editorText}
                            onChangeText={setEditorText}
                            placeholder="Hôm nay của bạn thế nào?"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setShowEditor(false)}
                            >
                                <Text style={styles.modalBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnSave]}
                                onPress={handleSaveEditor}
                            >
                                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <PenaltyModal
                visible={showPenaltyModal}
                penalties={user?.pendingPenalties || []}
                onClose={() => setShowPenaltyModal(false)}
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
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: COLORS.clayCard,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        elevation: 2,
    },
    streakBox: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.clayAccent1,
    },
    completedBox: {
        borderLeftWidth: 4,
        borderLeftColor: '#22C55E',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.clayText,
        opacity: 0.7,
        marginTop: 2,
    },
    progressSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    progressTrack: {
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#22C55E',
        borderRadius: 5,
    },
    progressShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    backlogNotice: {
        backgroundColor: '#FEF3C7',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    backlogText: {
        fontSize: 13,
        color: '#92400E',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: COLORS.clayText,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        height: 120,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    modalBtnCancel: {
        backgroundColor: '#F1F5F9',
    },
    modalBtnSave: {
        backgroundColor: COLORS.clayAccent2,
    },
    modalBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.clayText,
    },
});
