import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Animated,
    Easing,
    ActivityIndicator,
    FlatList,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme';
import { apiService } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import ClayHeader from '../components/ClayHeader';

import MiniGameModal from '../components/MiniGameModal';
import AttackResultModal from '../components/AttackResultModal';
import StoryUnlockModal from '../components/StoryUnlockModal';
import {
    BossBannerCard,
    ActiveBoss,
    BossAttackSection,
    BossContributionStats,
    BossRecord,
    BossWeekCollectionSection,
} from '../components/boss';
import { BossCollectionWithProgress, MiniGameType, PlayableMiniGameKey } from '../../../shared/types/boss';
import {
    getEventCache,
    setEventCache,
    clearEventCache,
    buildEventCacheKey,
} from '../utils/eventCache';

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getWeekLabel = (weekActivatedAt?: string): string => {
    if (!weekActivatedAt) return 'HOT EVENT';
    const d = new Date(weekActivatedAt);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + 6);
    return `W${getWeekNumber(d)} (${d.getDate()}/${d.getMonth() + 1} - ${dEnd.getDate()}/${dEnd.getMonth() + 1})`;
};

const MYSTERY_TITLES = [
    'Nhân vật bí ẩn nào đây?',
    'Liệu bạn có kịp mở khóa nhân vật lần này không?',
    'Một bóng đen bí ẩn đang chờ bạn...',
    'Hãy thu thập sức mạnh để giải mã!',
    'Bí ẩn sắp được hé lộ!',
];

export default function BossEventScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const targetBossId = route?.params?.bossId;

    const [bosses, setBosses] = useState<ActiveBoss[]>([]);
    const [records, setRecords] = useState<BossRecord[]>([]);
    const [selectedBossId, setSelectedBossId] = useState<string | null>(targetBossId || null);
    const [enabledMiniGames, setEnabledMiniGames] = useState<PlayableMiniGameKey[]>(['tap', 'reflex', 'quiz', 'memory']);
    const [attackBossId, setAttackBossId] = useState<string | null>(null);
    const [activeStoryBoss, setActiveStoryBoss] = useState<ActiveBoss | null>(null);
    const [collections, setCollections] = useState<BossCollectionWithProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeCollectionId = React.useMemo(() => {
        const rawColId = bosses[0]?.collectionId as string | { _id?: string } | undefined;
        return typeof rawColId === 'object' && rawColId !== null ? rawColId._id : rawColId;
    }, [bosses]);

    const currentWeekCollection = React.useMemo(() => {
        if (!activeCollectionId) return null;
        return collections.find((c) => String(c.collection?._id) === String(activeCollectionId)) || null;
    }, [collections, activeCollectionId]);

    const [attackPercentage, setAttackPercentage] = useState<0.25 | 0.5 | 0.75 | 1.0>(1.0);
    const [isMiniGameVisible, setIsMiniGameVisible] = useState(false);
    const [miniGameType, setMiniGameType] = useState<Exclude<MiniGameType, 'random'>>('tap');
    const [quizData, setQuizData] = useState<{ questionIndex: number; question: string; options: string[] } | null>(null);
    const [isAttackResultVisible, setIsAttackResultVisible] = useState(false);
    const [lastAttackResult, setLastAttackResult] = useState<{ damage: number; refund: number; isCritical: boolean } | null>(null);
    const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);
    const mysteryTitleRef = useRef(MYSTERY_TITLES[Math.floor(Math.random() * MYSTERY_TITLES.length)]).current;

    const floatAnim = useRef(new Animated.Value(0)).current;

    const applyPayload = useCallback(
        (payload: { activeBosses: ActiveBoss[]; userRecords: BossRecord[]; enabledMiniGames?: PlayableMiniGameKey[] }) => {
            const activeBosses = payload.activeBosses || [];
            const userRecords = payload.userRecords || [];
            if (payload.enabledMiniGames && payload.enabledMiniGames.length > 0) {
                setEnabledMiniGames(payload.enabledMiniGames);
            }
            setBosses(activeBosses);
            setRecords(userRecords);
            if (targetBossId && !selectedBossId) {
                setSelectedBossId(targetBossId);
            }
            return { activeBosses, userRecords };
        },
        [targetBossId, selectedBossId]
    );

    const fetchData = useCallback(
        async (showLoadingIfEmpty = false) => {
            const payloadKey = buildEventCacheKey('active_bosses_payload', user?._id);
            const colKey = buildEventCacheKey('boss_collections', user?._id);
            if (showLoadingIfEmpty && bosses.length === 0) {
                setIsLoading(true);
            }
            try {
                const res = await apiService.get('/events/boss/active');
                if (res.activeBosses && res.activeBosses.length > 0) {
                    const filtered = applyPayload({
                        activeBosses: res.activeBosses,
                        userRecords: res.userRecords || [],
                    });
                    await setEventCache(payloadKey, {
                        activeBosses: res.activeBosses,
                        userRecords: res.userRecords || [],
                    });

                    for (let i = 0; i < filtered.activeBosses.length; i++) {
                        const b = filtered.activeBosses[i];
                        const r = filtered.userRecords[i];
                        if (r?.hasUnlockedStory && b.currentHp <= 0) {
                            const key = `story_seen_${b._id}`;
                            const seen = await AsyncStorage.getItem(key);
                            if (!seen) {
                                setActiveStoryBoss(b);
                                setIsStoryModalVisible(true);
                                await AsyncStorage.setItem(key, 'true');
                                break;
                            }
                        }
                    }
                } else {
                    setBosses([]);
                    setRecords([]);
                    await setEventCache(payloadKey, { activeBosses: [], userRecords: [] });
                }

                const colRes = await apiService.get('/events/boss/collections');
                if (colRes.collections) {
                    setCollections(colRes.collections);
                    await setEventCache(colKey, colRes.collections);
                }
            } catch (error) {
                console.error('Fetch boss error:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [user?._id, bosses.length, applyPayload]
    );

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -15,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const initFromCache = async () => {
                const payloadKey = buildEventCacheKey('active_bosses_payload', user?._id);
                const colKey = buildEventCacheKey('boss_collections', user?._id);
                const [cachedPayload, cachedCol] = await Promise.all([
                    getEventCache<{ activeBosses: ActiveBoss[]; userRecords: BossRecord[] }>(payloadKey),
                    getEventCache<any[]>(colKey),
                ]);
                if (isMounted && cachedPayload.data) {
                    applyPayload(cachedPayload.data);
                    if (cachedCol.data) setCollections(cachedCol.data);
                    setIsLoading(false);
                }
                fetchData(false);
            };
            initFromCache();
            return () => {
                isMounted = false;
            };
        }, [user?._id, applyPayload, fetchData])
    );

    const handleAttackPress = async (targetBoss: ActiveBoss, targetRecord: BossRecord) => {
        if (!targetRecord || targetRecord.attackPoints <= 0) return;
        setAttackBossId(targetBoss._id);

        const hasQuiz = targetBoss.miniGameQuestions && targetBoss.miniGameQuestions.length > 0;
        let pool = enabledMiniGames.filter((g) => g !== 'quiz' || hasQuiz) as Exclude<MiniGameType, 'random'>[];
        if (pool.length === 0) {
            pool = ['tap'];
        }
        const selectedType = pool[Math.floor(Math.random() * pool.length)];
        setMiniGameType(selectedType);

        if (selectedType === 'quiz') {
            try {
                const qRes = await apiService.get(`/events/boss/quiz?bossId=${targetBoss._id}`);
                setQuizData(qRes);
            } catch (err) {
                setMiniGameType('tap');
            }
        }

        setIsMiniGameVisible(true);
    };

    const handleMiniGameComplete = async (result: 'critical' | 'normal', extraData?: { questionIndex?: number; answerIndex?: number }) => {
        setIsMiniGameVisible(false);
        try {
            const body: any = {
                bossId: attackBossId,
                miniGameType,
                miniGameResult: result,
                usePercentage: attackPercentage,
            };
            if (miniGameType === 'quiz' && extraData) {
                body.questionIndex = extraData.questionIndex;
                body.answerIndex = extraData.answerIndex;
            }

            const res = await apiService.post('/events/boss/attack', body);
            setLastAttackResult({
                damage: res.actualDamage,
                refund: res.refundPoints,
                isCritical: res.isCritical,
            });
            setIsAttackResultVisible(true);
            await clearEventCache();
            await fetchData(false);
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tấn công. Thử lại.');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.clayAccent2} />
            </View>
        );
    }

    if (bosses.length === 0) {
        return (
            <View style={styles.container}>
                <ClayHeader user={user} />
                <View style={[styles.header, { paddingTop: 10 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <MaterialIcons name="security" size={64} color={COLORS.clayText} />
                    <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.clayText, fontWeight: 'bold', textAlign: 'center' }}>
                        Tuần này chưa có Nhân Vật xuất hiện. Hãy chờ đến tuần sau nhé!
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.warmBg} />
            <ClayHeader user={user} />

            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                    </TouchableOpacity>

                    <View style={styles.timerBadge}>
                        <MaterialIcons name="calendar-today" size={20} color={COLORS.clayAccent2} />
                        <Text style={styles.timerText}>{getWeekLabel(bosses[0].weekActivatedAt)}</Text>
                    </View>
                </View>

                {bosses.some((b) => b.collectionId) && (
                    <TouchableOpacity
                        style={styles.collectionActionBtn}
                        onPress={() => {
                            const collectionBoss = bosses.find((b) => b.collectionId);
                            navigation.navigate('BossCollection', { collectionId: collectionBoss?.collectionId });
                        }}
                    >
                        <MaterialIcons name="collections-bookmark" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {bosses
                    .filter((b) => !selectedBossId || b._id === selectedBossId)
                    .map((boss) => {
                        const index = bosses.findIndex((b) => b._id === boss._id);
                        const record = records[index];
                        const isBossDefeated = boss.currentHp <= 0;
                        const currentAttackPower = record ? Math.floor(record.attackPoints * attackPercentage) : 0;
                        const remainingBoss = bosses.find((b) => b._id !== boss._id) || null;

                        return (
                            <View key={boss._id} style={{ marginBottom: 40 }}>
                                <BossBannerCard
                                    boss={boss}
                                    floatAnim={floatAnim}
                                    isBossDefeated={isBossDefeated}
                                    mysteryTitle={mysteryTitleRef}
                                />

                                <BossAttackSection
                                    record={record}
                                    attackPercentage={attackPercentage}
                                    currentAttackPower={currentAttackPower}
                                    isBossDefeated={isBossDefeated}
                                    remainingBoss={remainingBoss}
                                    onSelectPercentage={setAttackPercentage}
                                    onAttackPress={() => handleAttackPress(boss, record)}
                                    onUnlockRemainingBoss={() => {
                                        if (remainingBoss) {
                                            setSelectedBossId(remainingBoss._id);
                                        }
                                    }}
                                    onViewStory={() => {
                                        setActiveStoryBoss(boss);
                                        setIsStoryModalVisible(true);
                                    }}
                                />

                                <BossContributionStats record={record} />
                            </View>
                        );
                    })}

                {/* Week Collection Section */}
                <BossWeekCollectionSection
                    collectionItem={currentWeekCollection}
                    onPressCollection={(colId) => navigation.navigate('BossCollection', { collectionId: colId })}
                />

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modals */}
            <MiniGameModal
                visible={isMiniGameVisible}
                type={miniGameType}
                quizQuestion={quizData || undefined}
                onComplete={handleMiniGameComplete}
                onSkip={() => setIsMiniGameVisible(false)}
            />

            <AttackResultModal
                visible={isAttackResultVisible}
                damage={lastAttackResult?.damage || 0}
                refundPoints={lastAttackResult?.refund || 0}
                isCritical={lastAttackResult?.isCritical || false}
                onClose={() => setIsAttackResultVisible(false)}
            />

            <StoryUnlockModal
                visible={isStoryModalVisible}
                boss={activeStoryBoss}
                isInCollection={false}
                onClose={() => setIsStoryModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: COLORS.clayCard,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.clayCard,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
    },
    timerText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    collectionActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: COLORS.clayAccent1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unlockedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(139,92,246,0.1)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#8b5cf6',
        marginBottom: 20,
    },
    unlockedTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    unlockedDesc: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.7)',
        marginTop: 2,
    },
});
