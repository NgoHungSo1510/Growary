import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme';

export interface QuizStreakBadgeProps {
    streak: number;
}

/**
 * Animated combo streak badge showing multiplier state with pulse animation.
 */
export const QuizStreakBadge: React.FC<QuizStreakBadgeProps> = ({ streak }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (streak >= 2) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.25,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [streak, scaleAnim]);

    if (streak < 2) {
        return null;
    }

    const isSuper = streak >= 5;
    const badgeText = isSuper ? `⚡ SIÊU ĐẲNG x${streak}` : `🔥 COMBO x${streak}`;
    const gradientColors: [string, string] = isSuper
        ? ['#F59E0B', '#EF4444']
        : ['#F97316', '#EA580C'];

    return (
        <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badge}
            >
                <Text style={styles.text}>{badgeText}</Text>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: 'center',
        marginVertical: 4,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        elevation: 3,
        shadowColor: COLORS.quizStreak,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
