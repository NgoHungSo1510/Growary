import React, { useRef, useEffect, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../theme';
import { apiService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import ClayHeader from '../components/ClayHeader';

const { width, height } = Dimensions.get('window');

interface ActiveBoss {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
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
}

interface BossRecord {
    totalDamageDealt: number;
    accumulatedCoins: number;
    pendingDamageAnimation: number;
}

export default function BossEventScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    // Data state
    const [boss, setBoss] = useState<ActiveBoss | null>(null);
    const [record, setRecord] = useState<BossRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Animations
    const floatAnim = useRef(new Animated.Value(0)).current;
    const slashAnim = useRef(new Animated.Value(0)).current; // 0 to 1 for slash opacity/scale
    const damageTextAnim = useRef(new Animated.Value(0)).current; // 0 to 1 for floating text

    // Live HP state for animation
    const [displayHp, setDisplayHp] = useState<number>(100);

    const fetchData = async () => {
        try {
            const res = await apiService.get('/events/boss/active');
            if (res.activeBoss) {
                setBoss(res.activeBoss);
                setRecord(res.userRecord);

                // If there's pending damage, show the OLD hp first, then animate to NEW hp.
                // Formula: The backend `currentHp` ALREADY subtracted the pending damage.
                // So the "old" HP before this visit was: currentHp + pendingDamageAnimation.
                let initialHp = res.activeBoss.currentHp;
                if (res.userRecord?.pendingDamageAnimation > 0) {
                    initialHp = Math.min(res.activeBoss.maxHp, res.activeBoss.currentHp + res.userRecord.pendingDamageAnimation);
                }
                setDisplayHp(initialHp);

                if (res.userRecord?.pendingDamageAnimation > 0) {
                    // Trigger slash animation sequence
                    setTimeout(() => triggerSlashAnimation(res.activeBoss.currentHp), 500);

                    // Tell server we saw it
                    await apiService.post('/events/boss/animate', {});
                }
            }
        } catch (error) {
            console.error('Fetch boss error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Floating robot animation
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

        fetchData();
    }, []);

    const triggerSlashAnimation = (targetHp: number) => {
        // 1. Slash appears
        Animated.sequence([
            Animated.timing(slashAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slashAnim, {
                toValue: 0,
                duration: 200,
                delay: 100,
                useNativeDriver: true,
            })
        ]).start();

        // 2. Damage text floats up
        Animated.sequence([
            Animated.timing(damageTextAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease)
            }),
            Animated.timing(damageTextAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();

        // 3. Number ticks down
        let current = displayHp;
        const step = Math.max(1, Math.floor((current - targetHp) / 20));
        const interval = setInterval(() => {
            current -= step;
            if (current <= targetHp) {
                current = targetHp;
                clearInterval(interval);
            }
            setDisplayHp(current);
        }, 40);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.clayAccent2} />
            </View>
        );
    }

    if (!boss) {
        return (
            <View style={styles.container}>
                <ClayHeader user={user} />
                <View style={[styles.header, { paddingTop: 10 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="security" size={64} color={COLORS.clayText} />
                    <Text style={{ marginTop: 16, fontSize: 18, color: COLORS.clayText, fontWeight: 'bold' }}>
                        Không có sự kiện Săn Boss nào đang diễn ra!
                    </Text>
                </View>
            </View>
        );
    }

    const hpPercent = Math.max(0, Math.min(100, (displayHp / boss.maxHp) * 100));

    const getTimeLeftText = () => {
        if (!boss.endTime) return "HOT EVENT";
        const diff = new Date(boss.endTime).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days > 0) return `CÒN ${days} NGÀY`;
        if (days === 0) return "CÒN < 24 GIỜ";
        return "SẮP TIÊU DIỆT";
    };

    // Slash transforms
    const slashScale = slashAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1.2, 1]
    });

    // Damage text transforms
    const dmgTranslateY = damageTextAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, -60]
    });
    const dmgOpacity = damageTextAnim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 1, 1, 0]
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.warmBg} />

            {/* Background Blobs */}
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <ClayHeader user={user} />

            {/* Sub-Header with Back Button and Timer */}
            <View style={[styles.header, { paddingTop: 0 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                </TouchableOpacity>

                <View style={styles.timerBadge}>
                    <MaterialIcons name="timer" size={20} color={COLORS.clayAccent2} />
                    <Text style={styles.timerText}>{getTimeLeftText()}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Event Banner */}
                <View style={[styles.bannerCard, { borderColor: boss.colorIcon || '#FFF' }]}>
                    <LinearGradient
                        colors={[boss.colorBg || '#ef4444', boss.colorBg || '#991b1b']}
                        style={styles.bannerGradient}
                    >
                        <View style={styles.bannerGlare} />

                        {/* Floating Robot Boss */}
                        <Animated.View style={[styles.floatIconWrapper, { transform: [{ translateY: floatAnim }] }]}>
                            <MaterialIcons name={(boss.iconName as any) || "smart-toy"} size={140} color={boss.colorIcon || "#FFF"} style={styles.robotIconShadow} />

                            {/* Slash Animation Layer */}
                            <Animated.View style={{
                                position: 'absolute',
                                opacity: slashAnim,
                                transform: [{ scale: slashScale }, { rotate: '45deg' }]
                            }}>
                                <View style={{ width: 120, height: 10, backgroundColor: '#FFF', borderRadius: 5, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 10 }} />
                            </Animated.View>

                            {/* Damage Text Layer */}
                            {record?.pendingDamageAnimation ? (
                                <Animated.View style={{
                                    position: 'absolute',
                                    opacity: dmgOpacity,
                                    transform: [{ translateY: dmgTranslateY }]
                                }}>
                                    <Text style={{ fontSize: 36, fontWeight: '900', color: '#fef08a', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 2, height: 2 } }}>
                                        -{record.pendingDamageAnimation}
                                    </Text>
                                </Animated.View>
                            ) : null}
                        </Animated.View>

                        {/* Text */}
                        <View style={styles.bannerContent}>
                            <View style={[styles.seasonTag, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
                                <Text style={[styles.seasonText, { color: '#fee2e2' }]}>SĂN BOSS KỶ LUẬT</Text>
                            </View>
                            <Text style={styles.bannerTitle}>{boss.title}</Text>
                            <Text style={styles.bannerSubtitle}>{boss.description}</Text>
                        </View>

                        {/* Boss HP Bar */}
                        <View style={styles.progressPanel}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>HP Boss</Text>
                                <Text style={styles.progressLabel}>{Math.floor(displayHp)} / {boss.maxHp}</Text>
                            </View>

                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: `${hpPercent}%`, backgroundColor: boss.colorIcon || '#fca5a5' }]}>
                                    <View style={styles.shimmerFill} />
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Base Rewards */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Phần Thưởng Cơ Bản (Khi Boss Bị Tiêu Diệt)</Text>
                </View>

                <View style={[styles.statsContainer, { flexWrap: 'wrap', gap: 12 }]}>
                    <View style={[styles.statCard, { minWidth: '28%', flex: 1 }]}>
                        <MaterialIcons name="star" size={32} color={COLORS.clayAccent1} />
                        <Text style={styles.statValue}>{boss.baseRewardXp || 0}</Text>
                        <Text style={styles.statLabel}>XP</Text>
                    </View>
                    <View style={[styles.statCard, { minWidth: '28%', flex: 1 }]}>
                        <MaterialIcons name="toll" size={32} color="#eab308" />
                        <Text style={styles.statValue}>{boss.baseRewardCoins}</Text>
                        <Text style={styles.statLabel}>Coins</Text>
                    </View>
                    <View style={[styles.statCard, { minWidth: '28%', flex: 1 }]}>
                        <MaterialIcons name="local-play" size={32} color="#8b5cf6" />
                        <Text style={styles.statValue}>{boss.gachaTickets || 0}</Text>
                        <Text style={styles.statLabel}>Vé Gacha</Text>
                    </View>
                    {boss.rewardItems && boss.rewardItems.length > 0 && (
                        <View style={[styles.statCard, { width: '100%' }]}>
                            <MaterialIcons name="card-giftcard" size={32} color={COLORS.clayAccent2} />
                            <Text style={styles.statValue}>{boss.rewardItems.length}</Text>
                            <Text style={styles.statLabel}>Vật Phẩm Mốc</Text>
                        </View>
                    )}
                </View>

                {/* Chest & Contribution Stats */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Rương Của Bạn (Từ Nhiệm Vụ)</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialIcons name="local-fire-department" size={36} color="#ef4444" />
                        <Text style={styles.statValue}>{record?.totalDamageDealt || 0}</Text>
                        <Text style={styles.statLabel}>Sát Thương</Text>
                    </View>
                    <View style={styles.statCard}>
                        <MaterialIcons name="account-balance-wallet" size={36} color="#eab308" />
                        <Text style={styles.statValue}>{record?.accumulatedCoins || 0}</Text>
                        <Text style={styles.statLabel}>Coin Tích Lũy</Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <MaterialIcons name="info" size={24} color={COLORS.clayAccent2} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTextBold}>Cơ chế Rớt Đồ:</Text>
                        <Text style={styles.infoText}>
                            - Làm nhiệm vụ mỗi ngày: XP sẽ biến thành Sát Thương đánh Boss, Coin nhiệm vụ sẽ được nhét lợn vào "Rương".{'\n'}
                            - Đứt chuỗi (Streak): Boss sẽ hút máu và hồi phục HP!{'\n'}
                            - Khi Boss chết (HP = 0): Toàn bộ Coin trong rương sẽ được trả về ví của bạn kèm phần thưởng mốc. Nếu Boss còn sống khi hết hạn, rương sẽ bốc hơi!
                        </Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    bannerCard: {
        height: 280,
        borderRadius: 32,
        marginBottom: 24,
        marginTop: 20,
        shadowColor: '#991b1b',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    bannerGradient: {
        flex: 1,
        borderRadius: 28,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    bannerGlare: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 28,
    },
    floatIconWrapper: {
        position: 'absolute',
        top: -20,
        right: -10,
        width: 160,
        height: 160,
        zIndex: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    robotIconShadow: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 10 },
        textShadowRadius: 20,
    },
    bannerContent: {
        marginTop: 20,
        marginLeft: 0,
        maxWidth: '65%',
        zIndex: 10,
    },
    seasonTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
    },
    seasonText: {
        fontSize: FONT_SIZES.caption,
        fontWeight: '900',
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 32,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        marginBottom: 8,
    },
    bannerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    progressPanel: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: '#FFF',
    },
    progressBarTrack: {
        height: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        padding: 3,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    shimmerFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.3)',
        opacity: 0.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
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
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
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
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    infoTextBold: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#991b1b',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#991b1b',
        lineHeight: 20,
        opacity: 0.8,
    }
});
