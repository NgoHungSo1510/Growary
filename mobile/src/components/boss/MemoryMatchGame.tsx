import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../theme';

interface CardItem {
    id: number;
    pairId: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    color: string;
}

const BASE_PAIRS: Omit<CardItem, 'id'>[] = [
    { pairId: 'seed', icon: 'spa', label: 'Hạt Giống', color: '#10B981' },
    { pairId: 'water', icon: 'water-drop', label: 'Giọt Nước', color: '#3B82F6' },
    { pairId: 'sun', icon: 'wb-sunny', label: 'Mặt Trời', color: '#F59E0B' },
];

export interface MemoryMatchGameProps {
    /** Thời gian còn lại (giây) truyền từ MiniGameModal xuống để tính Critical */
    timeLeft: number;
    /** Callback gọi ngay khi lật đúng cả 3 cặp thẻ */
    onAllMatched: (isCritical: boolean) => void;
}

const SingleCard = React.memo<{
    card: CardItem;
    isFlipped: boolean;
    isMatched: boolean;
    onPress: () => void;
}>(({ card, isFlipped, isMatched, onPress }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: isFlipped || isMatched ? 180 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [isFlipped, isMatched]);

    const frontInterpolate = animatedValue.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = animatedValue.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }],
    };

    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }],
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            disabled={isFlipped || isMatched}
            style={styles.cardTouch}
        >
            {/* Card Back (Úp) */}
            <Animated.View style={[styles.cardBase, styles.cardBack, frontAnimatedStyle]}>
                <MaterialIcons name="eco" size={32} color={COLORS.clayAccent1} />
                <Text style={styles.cardBackText}>Growary</Text>
            </Animated.View>

            {/* Card Front (Mở) */}
            <Animated.View
                style={[
                    styles.cardBase,
                    styles.cardFront,
                    backAnimatedStyle,
                    isMatched && { borderColor: card.color, backgroundColor: `${card.color}15` },
                ]}
            >
                <MaterialIcons name={card.icon} size={36} color={card.color} />
                <Text style={[styles.cardFrontLabel, { color: card.color }]}>
                    {card.label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
});

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = React.memo(
    ({ timeLeft, onAllMatched }) => {
        const [cards, setCards] = useState<CardItem[]>([]);
        const [flippedIds, setFlippedIds] = useState<number[]>([]);
        const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
        const [isLocked, setIsLocked] = useState(false);
        const hasFinishedRef = useRef(false);
        const timeoutRef = useRef<NodeJS.Timeout | null>(null);

        // Khởi tạo và xáo trộn 6 thẻ (3 cặp) khi mount
        useEffect(() => {
            const rawCards: CardItem[] = [];
            let idCounter = 1;
            BASE_PAIRS.forEach((p) => {
                rawCards.push({ ...p, id: idCounter++ });
                rawCards.push({ ...p, id: idCounter++ });
            });

            // Fisher-Yates shuffle
            for (let i = rawCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rawCards[i], rawCards[j]] = [rawCards[j], rawCards[i]];
            }

            setCards(rawCards);
            hasFinishedRef.current = false;

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }, []);

        const handleCardPress = useCallback(
            (card: CardItem) => {
                if (isLocked || flippedIds.includes(card.id) || matchedPairs.includes(card.pairId)) {
                    return;
                }

                if (flippedIds.length === 0) {
                    setFlippedIds([card.id]);
                } else if (flippedIds.length === 1) {
                    const firstCardId = flippedIds[0];
                    const firstCard = cards.find((c) => c.id === firstCardId);
                    if (!firstCard) return;

                    const newFlipped = [firstCardId, card.id];
                    setFlippedIds(newFlipped);

                    if (firstCard.pairId === card.pairId) {
                        // Khớp cặp
                        const nextMatched = [...matchedPairs, card.pairId];
                        setMatchedPairs(nextMatched);
                        setFlippedIds([]);

                        if (nextMatched.length === 3 && !hasFinishedRef.current) {
                            hasFinishedRef.current = true;
                            const isCritical = timeLeft >= 5;
                            onAllMatched(isCritical);
                        }
                    } else {
                        // Khác cặp: khóa 500ms rồi úp lại
                        setIsLocked(true);
                        timeoutRef.current = setTimeout(() => {
                            setFlippedIds([]);
                            setIsLocked(false);
                        }, 500);
                    }
                }
            },
            [isLocked, flippedIds, matchedPairs, cards, timeLeft, onAllMatched]
        );

        return (
            <View style={styles.container}>
                <Text style={styles.instruction}>
                    Tìm 3 cặp thẻ thiên nhiên trong 15s. Hoàn thành $\le$ 10s để kích hoạt Chí Mạng!
                </Text>
                <View style={styles.grid}>
                    {cards.map((card) => (
                        <SingleCard
                            key={card.id}
                            card={card}
                            isFlipped={flippedIds.includes(card.id)}
                            isMatched={matchedPairs.includes(card.pairId)}
                            onPress={() => handleCardPress(card)}
                        />
                    ))}
                </View>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    instruction: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.clayText,
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        maxWidth: 320,
    },
    cardTouch: {
        width: 90,
        height: 110,
    },
    cardBase: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
        borderWidth: 2,
        ...SHADOWS.clayLight,
    },
    cardBack: {
        backgroundColor: COLORS.clayCard,
        borderColor: 'rgba(93, 64, 55, 0.15)',
        gap: 4,
    },
    cardBackText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.clayAccent1,
    },
    cardFront: {
        backgroundColor: COLORS.warmBg,
        borderColor: 'rgba(93, 64, 55, 0.25)',
        gap: 6,
    },
    cardFrontLabel: {
        fontSize: 11,
        fontWeight: 'bold',
    },
});

