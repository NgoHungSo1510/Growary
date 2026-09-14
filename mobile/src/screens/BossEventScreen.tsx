import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
    Easing,
    ActivityIndicator,
    Image,
    FlatList,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZES } from '../theme';
import { apiService } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import ClayHeader from '../components/ClayHeader';

import MiniGameModal from '../components/MiniGameModal';
import AttackResultModal from '../components/AttackResultModal';
import StoryUnlockModal from '../components/StoryUnlockModal';

const { width, height } = Dimensions.get('window');

// Pure helpers — outside component để tránh tạo lại mỗi render
const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getWeekLabel = (weekActivatedAt?: string): string => {
    if (!weekActivatedAt) return 'HOT EVENT';
    const d = new Date(weekActivatedAt);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + 6);
    return `W${getWeekNumber(d)} (${d.getDate()}/${d.getMonth() + 1} - ${dEnd.getDate()}/${dEnd.getMonth() + 1})`;
};

interface ActiveBoss {
    _id: string;
    title: string;
    description: string;
    secretDescription?: string;
    startTime?: string;
    endTime?: string;
    weekActivatedAt?: string;
    maxHp: number;
    currentHp: number;
    baseRewardCoins: number;
    baseRewardXp?: number;
    gachaTickets?: number;
    rewardItems?: any[];
    status: string;
    colorBg?: string;
    colorIcon?: string;
    iconName?: string;
    // V2 NEW
    avatarImageUrl?: string;
    loreTitle?: string;
    loreContent?: string;
    isLimited?: boolean;
    miniGameType?: string;
    miniGameQuestions?: Array<{ question: string; options: string[]; correctIndex: number }>;
    collectionId?: string;
}

interface BossRecord {
    totalDamageDealt: number;
    accumulatedCoins: number;
    // V2 NEW
    attackPoints: number;
    hasUnlockedStory: boolean;
}

const MYSTERY_TITLES = [
    "Nhân vật bí ẩn nào đây?",
    "Liệu bạn có kịp mở khóa nhân vật lần này không?",
    "Một bóng đen bí ẩn đang chờ bạn...",
    "Hãy thu thập sức mạnh để giải mã!",
    "Bí ẩn sắp được hé lộ!"
];

export default function BossEventScreen({ route }: any) {
    const navigation = useNavigation();
    const { user } = useAuth();
    const targetBossId = route?.params?.bossId;

    // Data state
    const [bosses, setBosses] = useState<ActiveBoss[]>([]);
    const [records, setRecords] = useState<BossRecord[]>([]);
    const [attackBossId, setAttackBossId] = useState<string | null>(null);
    const [activeStoryBoss, setActiveStoryBoss] = useState<ActiveBoss | null>(null);
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // V2 UI State
    const [attackPercentage, setAttackPercentage] = useState<0.25 | 0.5 | 0.75 | 1.0>(1.0);
    const [isMiniGameVisible, setIsMiniGameVisible] = useState(false);
    const [miniGameType, setMiniGameType] = useState<'tap' | 'quiz' | 'reflex'>('tap');
    const [quizData, setQuizData] = useState<{ questionIndex: number; question: string; options: string[] } | null>(null);
    const [isAttackResultVisible, setIsAttackResultVisible] = useState(false);
    const [lastAttackResult, setLastAttackResult] = useState<{ damage: number; refund: number; isCritical: boolean } | null>(null);
    const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);
    const mysteryTitleRef = useRef(MYSTERY_TITLES[Math.floor(Math.random() * MYSTERY_TITLES.length)]).current;

    // Animations
    const floatAnim = useRef(new Animated.Value(0)).current;

    const fetchData = async () => {
        try {
            const res = await apiService.get('/events/boss/active');
            if (res.activeBosses && res.activeBosses.length > 0) {
                let activeBosses = res.activeBosses;
                let userRecords = res.userRecords || [];
                
                // If navigated from a specific card, filter to show only that boss
                if (targetBossId) {
                    const idx = activeBosses.findIndex((b: any) => b._id === targetBossId);
                    if (idx !== -1) {
                        activeBosses = [activeBosses[idx]];
                        userRecords = [userRecords[idx]];
                    }
                }

                setBosses(activeBosses);
                setRecords(userRecords);

                for (let i = 0; i < activeBosses.length; i++) {
                    const b = activeBosses[i];
                    const r = userRecords[i];
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
            }

            const colRes = await apiService.get('/events/boss/collections');
            if (colRes.collections) {
                setCollections(colRes.collections);
            }
        } catch (error) {
            console.error('Fetch boss error:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
            fetchData();
        }, [])
    );

    const handleAttackPress = async (targetBoss: ActiveBoss, targetRecord: BossRecord) => {
        if (!targetRecord || targetRecord.attackPoints <= 0) return;
        setAttackBossId(targetBoss._id);

        const hasQuiz = targetBoss.miniGameQuestions && targetBoss.miniGameQuestions.length > 0;
        const options = hasQuiz ? ['tap', 'quiz', 'reflex'] : ['tap', 'reflex'];

        let selectedType = options[Math.floor(Math.random() * options.length)] as 'tap' | 'quiz' | 'reflex';
        if (targetBoss.miniGameType && targetBoss.miniGameType !== 'random') {
            selectedType = targetBoss.miniGameType as 'tap' | 'quiz' | 'reflex';
            if (selectedType === 'quiz' && !hasQuiz) selectedType = 'tap';
        }

        setMiniGameType(selectedType);

        if (selectedType === 'quiz') {
            try {
                const qRes = await apiService.get('/events/boss/quiz');
                setQuizData(qRes);
            } catch (err) {
                // Fallback to tap if fail
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
                usePercentage: attackPercentage
            };
            if (miniGameType === 'quiz' && extraData) {
                body.questionIndex = extraData.questionIndex;
                body.answerIndex = extraData.answerIndex;
            }

            const res = await apiService.post('/events/boss/attack', body);
            setLastAttackResult({
                damage: res.actualDamage,
                refund: res.refundPoints,
                isCritical: res.isCritical
            });
            setIsAttackResultVisible(true);
            await fetchData(); // refresh data
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

            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <ClayHeader user={user} />

            <View style={[styles.header, { paddingTop: 0, justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                    </TouchableOpacity>

                    <View style={styles.timerBadge}>
                        <MaterialIcons name="calendar-today" size={20} color={COLORS.clayAccent2} />
                        <Text style={styles.timerText}>{getWeekLabel(bosses[0].weekActivatedAt)}</Text>
                    </View>
                </View>

                {bosses.some(b => b.collectionId) && (
                    <TouchableOpacity 
                        style={styles.collectionActionBtn} 
                        onPress={() => {
                            const collectionBoss = bosses.find(b => b.collectionId);
                            navigation.navigate('Profile', { scrollToCollection: true, collectionId: collectionBoss?.collectionId });
                        }}
                    >
                        <MaterialIcons name="collections-bookmark" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {
    bosses.map((boss, index) => {
        const record = records[index];
        const hpPercent = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));
        const isBossDefeated = boss.currentHp <= 0;
        const currentAttackPower = record ? Math.floor(record.attackPoints * attackPercentage) : 0;
        return (
            <View key={boss._id} style={{ marginBottom: 40 }}>
{/* Event Banner */}
                <View style={[styles.bannerCard, { borderColor: boss.colorIcon || '#FFF' }]}>
                    <LinearGradient
                        colors={[boss.colorBg || '#1e293b', boss.colorBg || '#0f172a']}
                        style={styles.bannerGradient}
                    >
                        {/* Avatar / Icon rendering */}
                        {boss.avatarImageUrl ? (
                            <View style={StyleSheet.absoluteFill}>
                                <Image source={{ uri: boss.avatarImageUrl }} style={styles.bannerImage} />
                                {!isBossDefeated && (
                                    <>
                                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                                        <View style={styles.lockIconOverlay}>
                                            <MaterialIcons name="lock" size={80} color="rgba(255,255,255,0.7)" />
                                        </View>
                                    </>
                                )}
                            </View>
                        ) : (
                            <Animated.View style={[styles.floatIconWrapper, { transform: [{ translateY: floatAnim }] }]}>
                                <MaterialIcons name={(boss.iconName as any) || "smart-toy"} size={140} color={boss.colorIcon || "#FFF"} style={styles.robotIconShadow} />
                            </Animated.View>
                        )}

                        <View style={styles.bannerGlare} />

                        <View style={styles.bannerContent}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                {boss.isLimited && (
                                    <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                                        <Text style={styles.badgeText}>LIMITED</Text>
                                    </View>
                                )}
                                {boss.loreTitle && (
                                    <View style={[styles.badge, { backgroundColor: '#8b5cf6' }]}>
                                        <Text style={styles.badgeText}>STORY</Text>
                                    </View>
                                )}
                                {boss.collectionId && (
                                    <View style={[styles.badge, { backgroundColor: '#fbbf24' }]}>
                                        <Text style={styles.badgeText}>COLLECTION</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.bannerTitle}>
                                {isBossDefeated 
                                    ? boss.title 
                                    : (boss.secretDescription || 'Nhân vật bí ẩn')}
                            </Text>
                            <Text style={styles.bannerSubtitle}>
                                {isBossDefeated 
                                    ? boss.description 
                                    : mysteryTitleRef}
                            </Text>
                        </View>

                        {/* Boss HP Bar */}
                        <View style={styles.progressPanel}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>{isBossDefeated ? 'ĐÃ TIÊU DIỆT' : 'HP BOSS'}</Text>
                                <Text style={styles.progressLabel}>{Math.floor(boss.currentHp)} / {boss.maxHp}</Text>
                            </View>
                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: `${hpPercent}%`, backgroundColor: boss.colorIcon || '#ef4444' }]} />
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Defeated Status or Attack Section */}
                {isBossDefeated ? (
                    <TouchableOpacity
                        style={styles.unlockedBox}
                        onPress={() => { setActiveStoryBoss(boss); setIsStoryModalVisible(true); }}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="auto-stories" size={32} color="#8b5cf6" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.unlockedTitle}>Nhân vật đã được mở khóa!</Text>
                            <Text style={styles.unlockedDesc}>Nhấn vào đây để xem tiểu sử và câu chuyện.</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#8b5cf6" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.attackSection}>
                        <View style={styles.attackHeader}>
                            <Text style={styles.attackTitle}>Sức Mạnh Của Bạn</Text>
                            <View style={styles.attackPointsBadge}>
                                <MaterialIcons name="bolt" size={16} color="#eab308" />
                                <Text style={styles.attackPointsText}>{record?.attackPoints || 0} Điểm</Text>
                            </View>
                        </View>

                        <Text style={styles.attackDesc}>Hoàn thành nhiệm vụ hàng ngày để tích lũy Điểm Công.</Text>

                        <View style={styles.percentageRow}>
                            {[0.25, 0.5, 0.75, 1.0].map(pct => (
                                <TouchableOpacity
                                    key={pct}
                                    style={[styles.pctBtn, attackPercentage === pct && styles.pctBtnActive]}
                                    onPress={() => setAttackPercentage(pct as any)}
                                >
                                    <Text style={[styles.pctBtnText, attackPercentage === pct && styles.pctBtnTextActive]}>
                                        {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.attackButton, (!record || record.attackPoints <= 0) && styles.attackButtonDisabled]}
                            onPress={() => handleAttackPress(boss, record)}
                            disabled={!record || record.attackPoints <= 0}
                        >
                            <Text style={styles.attackButtonText}>PHÁ KHÓA</Text>
                            <Text style={styles.attackButtonSubtext}>Dùng {currentAttackPower} Điểm</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Contribution Stats */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Đóng Góp Của Bạn</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialIcons name="local-fire-department" size={32} color="#ef4444" />
                        <Text style={styles.statValue}>{record?.totalDamageDealt || 0}</Text>
                        <Text style={styles.statLabel}>Tổng Sát Thương</Text>
                    </View>
                    <View style={styles.statCard}>
                        <MaterialIcons name="account-balance-wallet" size={32} color="#eab308" />
                        <Text style={styles.statValue}>{record?.accumulatedCoins || 0}</Text>
                        <Text style={styles.statLabel}>Coin Tích Lũy</Text>
                    </View>
                </View>

                            </View>
        );
    })
}
{/* Collections Section */}
                {collections.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Bộ Sưu Tập Sự Kiện</Text>
                        </View>

                        <FlatList
                            data={collections}
                            keyExtractor={item => item._id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingRight: 24, gap: 16 }}
                            renderItem={({ item }) => (
                                <View style={styles.collectionCard}>
                                    <View style={styles.colIconBox}>
                                        <Text style={{ fontSize: 32 }}>{item.iconEmoji}</Text>
                                    </View>
                                    <Text style={styles.colTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.colDesc}>{item.userProgress?.bossesUnlocked?.length || 0} / {item.bossCount} Đã Mở Khóa</Text>

                                    {item.userProgress?.isCompleted && (
                                        <View style={styles.completedBadge}>
                                            <MaterialIcons name="check-circle" size={16} color="#10b981" />
                                            <Text style={styles.completedText}>Hoàn Thành</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        />
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <MiniGameModal
                visible={isMiniGameVisible}
                type={miniGameType}
                quizQuestion={quizData || undefined}
                onComplete={handleMiniGameComplete}
                onSkip={() => handleMiniGameComplete('normal')}
            />

            {lastAttackResult && (
                <AttackResultModal
                    visible={isAttackResultVisible}
                    damage={lastAttackResult.damage}
                    refundPoints={lastAttackResult.refund}
                    isCritical={lastAttackResult.isCritical}
                    onClose={() => setIsAttackResultVisible(false)}
                />
            )}

            <StoryUnlockModal
                visible={isStoryModalVisible}
                boss={activeStoryBoss || bosses[0]}
                isInCollection={!!(activeStoryBoss?.collectionId)}
                onClose={() => setIsStoryModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 10,
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blobTop: {
        top: -height * 0.1,
        left: -width * 0.1,
        width: width * 0.5,
        height: width * 0.5,
        backgroundColor: 'rgba(251, 155, 143, 0.2)',
    },
    blobBottom: {
        bottom: -height * 0.1,
        right: -width * 0.1,
        width: width * 0.6,
        height: width * 0.6,
        backgroundColor: 'rgba(245, 119, 153, 0.15)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 10,
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.warmBg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warmBg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#D29664',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    timerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    collectionActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fbbf24',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#d97706',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    bannerCard: {
        height: 300,
        borderRadius: 32,
        marginBottom: 24,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 4,
        borderColor: '#FFF',
        overflow: 'hidden',
    },
    bannerGradient: {
        flex: 1,
        padding: 20,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    lockIconOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    bannerGlare: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    floatIconWrapper: {
        position: 'absolute',
        top: 20,
        right: -20,
        width: 160,
        height: 160,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    robotIconShadow: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 10 },
        textShadowRadius: 20,
    },
    bannerContent: {
        marginTop: 10,
        maxWidth: '80%',
        zIndex: 10,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFF',
    },
    bannerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 32,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        marginBottom: 8,
    },
    bannerSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    progressPanel: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 10,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: '#FFF',
    },
    progressBarTrack: {
        height: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
        padding: 2,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    unlockedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        marginBottom: 24,
        gap: 16,
    },
    unlockedTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7c3aed',
        marginBottom: 4,
    },
    unlockedDesc: {
        fontSize: 13,
        color: '#6b21a8',
    },
    attackSection: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    attackHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    attackTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    attackPointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    attackPointsText: {
        color: '#ca8a04',
        fontWeight: 'bold',
        fontSize: 14,
    },
    attackDesc: {
        fontSize: 13,
        color: 'rgba(93, 64, 55, 0.7)',
        marginBottom: 20,
    },
    percentageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    pctBtn: {
        flex: 1,
        height: 48, // Fitts' Law
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    pctBtnActive: {
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
    },
    pctBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    pctBtnTextActive: {
        color: '#FFF',
    },
    attackButton: {
        width: '100%',
        height: 60, // Thumb zone target
        backgroundColor: '#ef4444',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    attackButtonDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0,
        elevation: 0,
    },
    attackButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
    },
    attackButtonSubtext: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 'bold',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.clayCard,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.clayText,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(93, 64, 55, 0.7)',
        fontWeight: 'bold',
        marginTop: 4,
    },
    collectionCard: {
        width: 160,
        backgroundColor: COLORS.clayCard,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 10,
    },
    colIconBox: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    colTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 4,
    },
    colDesc: {
        fontSize: 12,
        color: 'rgba(93, 64, 55, 0.7)',
        marginBottom: 8,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    completedText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#10b981',
    }
});
