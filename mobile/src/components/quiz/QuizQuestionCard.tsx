import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
} from 'react-native';
import { QuizQuestionPublic } from '@shared';
import { COLORS, SHADOWS } from '../../theme';
import { QuizTimerCircle } from './QuizTimerCircle';

export interface QuizQuestionCardProps {
    question: QuizQuestionPublic;
    index: number;
    total: number;
    secondsLeft: number;
    totalSeconds: number;
    selectedIndex: number | null;
    correctIndex: number | null;
    locked: boolean;
    onSelect: (i: number) => void;
}

const OPTION_PREFIXES = ['A', 'B', 'C', 'D'];

/**
 * Quiz question card displaying the prompt, options, timer, and animated feedback.
 */
export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
    question,
    index,
    total,
    secondsLeft,
    totalSeconds,
    selectedIndex,
    correctIndex,
    locked,
    onSelect,
}) => {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Trigger haptic & shake animation on wrong answer
    useEffect(() => {
        if (
            correctIndex !== null &&
            selectedIndex !== null &&
            selectedIndex !== correctIndex
        ) {
            Vibration.vibrate(40);
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }
    }, [correctIndex, selectedIndex, shakeAnim]);

    const difficultyConfig =
        question.difficulty === 'easy'
            ? { label: 'DỄ', color: COLORS.quizDifficultyEasy }
            : question.difficulty === 'hard'
            ? { label: 'KHÓ', color: COLORS.quizDifficultyHard }
            : { label: 'VỪA', color: COLORS.quizDifficultyMedium };

    return (
        <Animated.View
            style={[
                styles.card,
                { transform: [{ translateX: shakeAnim }] },
            ]}
        >
            {/* Header: Progress, Difficulty, and Circular Timer */}
            <View style={styles.headerRow}>
                <View style={styles.metaCol}>
                    <View style={styles.badgeRow}>
                        <View style={styles.indexBadge}>
                            <Text style={styles.indexText}>
                                CÂU {index + 1}/{total}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.difficultyBadge,
                                { backgroundColor: `${difficultyConfig.color}20` },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.difficultyText,
                                    { color: difficultyConfig.color },
                                ]}
                            >
                                {difficultyConfig.label}
                            </Text>
                        </View>
                    </View>
                </View>
                <QuizTimerCircle
                    secondsLeft={secondsLeft}
                    totalSeconds={totalSeconds}
                    size={64}
                />
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{question.question}</Text>

            {/* Options List */}
            <View style={styles.optionsList}>
                {question.options.map((option, idx) => {
                    const isSelected = selectedIndex === idx;
                    const isCorrect = correctIndex !== null && correctIndex === idx;
                    const isWrong =
                        correctIndex !== null &&
                        isSelected &&
                        correctIndex !== idx;

                    let bg: string = '#FFFFFF';
                    let border: string = 'rgba(0, 0, 0, 0.08)';
                    let textColor: string = COLORS.clayText;
                    let prefixBg: string = '#F3F4F6';
                    let prefixColor: string = '#4B5563';


                    if (locked) {
                        if (isCorrect) {
                            bg = COLORS.quizCorrect;
                            border = COLORS.quizCorrect;
                            textColor = '#FFFFFF';
                            prefixBg = 'rgba(255, 255, 255, 0.25)';
                            prefixColor = '#FFFFFF';
                        } else if (isWrong) {
                            bg = COLORS.quizWrong;
                            border = COLORS.quizWrong;
                            textColor = '#FFFFFF';
                            prefixBg = 'rgba(255, 255, 255, 0.25)';
                            prefixColor = '#FFFFFF';
                        } else {
                            bg = 'rgba(255, 255, 255, 0.6)';
                            textColor = '#9CA3AF';
                        }
                    } else if (isSelected) {
                        bg = COLORS.quizPrimary;
                        border = COLORS.quizPrimary;
                        textColor = '#FFFFFF';
                        prefixBg = 'rgba(255, 255, 255, 0.25)';
                        prefixColor = '#FFFFFF';
                    }

                    return (
                        <TouchableOpacity
                            key={idx}
                            activeOpacity={0.8}
                            disabled={locked}
                            onPress={() => onSelect(idx)}
                            style={[
                                styles.optionButton,
                                {
                                    backgroundColor: bg,
                                    borderColor: border,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.prefixBadge,
                                    { backgroundColor: prefixBg },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.prefixText,
                                        { color: prefixColor },
                                    ]}
                                >
                                    {OPTION_PREFIXES[idx] || `${idx + 1}`}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.optionText,
                                    { color: textColor },
                                ]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        ...SHADOWS.clay,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    metaCol: {
        flex: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    indexBadge: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    indexText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.quizPrimary,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: '800',
    },
    questionText: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.clayText,
        lineHeight: 26,
        marginBottom: 16,
    },
    optionsList: {
        gap: 10,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    prefixBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    prefixText: {
        fontSize: 14,
        fontWeight: '800',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
    },
});
