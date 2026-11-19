import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Image,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { quizService } from '../../services/quizService';
import { formatEventRemainingTime, getEndOfCurrentWeekVN } from '../../utils/eventCountdown';

interface BossItem {
    _id: string;
    title: string;
    avatarUrl?: string;
    isDefeated?: boolean;
}

export const FloatingEventStack = memo(function FloatingEventStack() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // 1. Boss event state
    const [bosses, setBosses] = useState<BossItem[]>([]);
    const [activeBossIndex, setActiveBossIndex] = useState(0);
    const bossAnim = useRef(new Animated.Value(1)).current;

    // 2. Season pass state
    const [seasonEndDate, setSeasonEndDate] = useState<string | null>(null);

    // 3. Quiz state
    const [quizTarget, setQuizTarget] = useState<string | null>(null);
    const [quizAttempts, setQuizAttempts] = useState<number>(0);

    // 4. Timer tick for countdown refresh
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000); // refresh every 30s
        return () => clearInterval(timer);
    }, []);

    // Fetch initial event data
    const fetchEventData = useCallback(async () => {
        // Fetch Bosses
        try {
            const bossRes = await apiService.get('/events/boss/active');
            if (bossRes?.currentBosses && Array.isArray(bossRes.currentBosses)) {
                setBosses(bossRes.currentBosses);
            }
        } catch {
            // silent fallback
        }

        // Fetch Season Pass
        try {
            const passRes = await apiService.getCurrentSeasonPass();
            if (passRes?.season?.endDate) {
                setSeasonEndDate(passRes.season.endDate);
            }
        } catch {
            // silent fallback
        }

        // Fetch Quiz
        try {
            const quizRes = await quizService.getStatus();
            if (quizRes?.hasActiveEvent) {
                setQuizAttempts(quizRes.attemptsLeft);
                const target = quizRes.attemptsLeft > 0 ? quizRes.event?.endTime : quizRes.nextRechargeAt;
                setQuizTarget(target || null);
            }
        } catch {
            // silent fallback
        }
    }, []);

    useEffect(() => {
        void fetchEventData();
    }, [fetchEventData]);

    // Alternate 2 bosses animation every 3.5s
    useEffect(() => {
        if (bosses.length <= 1) return;
        const interval = setInterval(() => {
            Animated.sequence([
                Animated.timing(bossAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
                Animated.timing(bossAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();

            setActiveBossIndex((prev) => (prev + 1) % bosses.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [bosses.length, bossAnim]);

    // Compute countdowns
    const weekEnd = getEndOfCurrentWeekVN(now);
    const bossCountdown = formatEventRemainingTime(weekEnd, now);
    const seasonCountdown = formatEventRemainingTime(seasonEndDate, now);
    const quizCountdown = formatEventRemainingTime(quizTarget, now);
    const gachaCountdown = formatEventRemainingTime(weekEnd, now);

    const currentBoss = bosses[activeBossIndex] || bosses[0];

    return (
        <View style={[styles.container, { bottom: 160 + insets.bottom }]} pointerEvents="box-none">
            {/* 1. Event Boss / Nhân Vật (Alternate Animation) */}
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.itemWrapper}
                onPress={() => navigation.navigate('BossEvent', currentBoss ? { bossId: currentBoss._id } : undefined)}
            >
                <Animated.View style={[styles.circleButton, { transform: [{ scale: bossAnim }] }]}>
                    <LinearGradient colors={['#DC2626', '#991B1B']} style={styles.gradient}>
                        {currentBoss?.avatarUrl ? (
                            <Image source={{ uri: currentBoss.avatarUrl }} style={styles.avatar} resizeMode="cover" />
                        ) : (
                            <MaterialIcons name="sports-martial-arts" size={26} color="#FFF" />
                        )}
                        {currentBoss?.isDefeated && (
                            <View style={styles.checkBadge}>
                                <Text style={styles.checkText}>✓</Text>
                            </View>
                        )}
                        {bosses.length > 1 && (
                            <View style={styles.bossIndexDot}>
                                <Text style={styles.bossIndexText}>{activeBossIndex + 1}/2</Text>
                            </View>
                        )}
                    </LinearGradient>
                </Animated.View>
                <View style={[styles.timeBadge, { backgroundColor: '#7F1D1D' }]}>
                    <Text style={styles.timeBadgeText}>{bossCountdown.badgeText}</Text>
                </View>
            </TouchableOpacity>

            {/* 2. Event Sổ Sứ Mệnh */}
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.itemWrapper}
                onPress={() => navigation.navigate('SeasonPass')}
            >
                <View style={styles.circleButton}>
                    <LinearGradient colors={['#F59E0B', '#B45309']} style={styles.gradient}>
                        <MaterialIcons name="menu-book" size={26} color="#FFF" />
                    </LinearGradient>
                </View>
                <View style={[styles.timeBadge, { backgroundColor: '#78350F' }]}>
                    <Text style={styles.timeBadgeText}>{seasonCountdown.badgeText}</Text>
                </View>
            </TouchableOpacity>

            {/* 3. Event Thử Thách Trí Tuệ */}
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.itemWrapper}
                onPress={() => navigation.navigate('QuizEvent')}
            >
                <View style={styles.circleButton}>
                    <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.gradient}>
                        <MaterialIcons name="psychology" size={26} color="#FFF" />
                        {quizAttempts > 0 && (
                            <View style={styles.counterBadge}>
                                <Text style={styles.counterText}>{quizAttempts}</Text>
                            </View>
                        )}
                    </LinearGradient>
                </View>
                <View style={[styles.timeBadge, { backgroundColor: '#1E3A8A' }]}>
                    <Text style={styles.timeBadgeText}>{quizCountdown.badgeText}</Text>
                </View>
            </TouchableOpacity>

            {/* 4. Event Vòng Quay */}
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.itemWrapper}
                onPress={() => navigation.navigate('GachaEvent')}
            >
                <View style={styles.circleButton}>
                    <LinearGradient colors={['#8B5CF6', '#5B21B6']} style={styles.gradient}>
                        <MaterialIcons name="casino" size={26} color="#FFF" />
                    </LinearGradient>
                </View>
                <View style={[styles.timeBadge, { backgroundColor: '#4C1D95' }]}>
                    <Text style={styles.timeBadgeText}>{gachaCountdown.badgeText}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
});

export default FloatingEventStack;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 16,
        alignItems: 'center',
        gap: 12,
        zIndex: 99,
    },
    itemWrapper: {
        alignItems: 'center',
    },
    circleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    gradient: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    timeBadge: {
        marginTop: 3,
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    timeBadgeText: {
        color: '#FFF',
        fontSize: 9.5,
        fontWeight: '700',
    },
    checkBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#10B981',
        borderRadius: 6,
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    bossIndexDot: {
        position: 'absolute',
        bottom: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 4,
        paddingHorizontal: 3,
    },
    bossIndexText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '700',
    },
    counterBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#EF4444',
        borderRadius: 7,
        minWidth: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    counterText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
});
