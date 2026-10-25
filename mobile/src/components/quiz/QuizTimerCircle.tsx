import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../../theme';

export interface QuizTimerCircleProps {
    secondsLeft: number;
    totalSeconds: number;
    size?: number;
}

/**
 * Circular SVG countdown timer with dynamic color thresholds.
 */
export const QuizTimerCircle: React.FC<QuizTimerCircleProps> = ({
    secondsLeft,
    totalSeconds,
    size = 80,
}) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const safeTotal = totalSeconds > 0 ? totalSeconds : 30;
    const progress = Math.max(0, Math.min(1, secondsLeft / safeTotal));
    const strokeDashoffset = circumference * (1 - progress);

    const timerColor =
        secondsLeft > 20
            ? COLORS.quizTimerSafe
            : secondsLeft > 10
            ? COLORS.quizTimerWarn
            : COLORS.quizTimerDanger;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Background track circle */}
                <Circle
                    stroke="rgba(0, 0, 0, 0.08)"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                {/* Progress animated circle */}
                <Circle
                    stroke={timerColor}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={styles.textOverlay}>
                <Text style={[styles.secondsText, { color: timerColor }]}>
                    {secondsLeft}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    textOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondsText: {
        fontSize: 22,
        fontWeight: '900',
    },
});
