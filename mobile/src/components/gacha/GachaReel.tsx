import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    TouchableOpacity,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GachaItem } from '@shared';
import ReelCard, { ITEM_WIDTH, ITEM_STRIDE, RARITY_THEMES } from './ReelCard';

export { RARITY_THEMES };

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_CONTAINER_WIDTH = Math.min(SCREEN_WIDTH - 32, 380);
const REEL_LENGTH = 45;
const WINNING_INDEX = 36;

export interface GachaReelRef {
    spinToItem: (wonItem: GachaItem, tierUpgraded?: boolean) => Promise<void>;
}

interface GachaReelProps {
    items: GachaItem[];
    onSpinRequest: () => Promise<{ wonItem: GachaItem; tierUpgraded?: boolean } | null>;
    onSpinComplete: (wonItem: GachaItem, tierUpgraded?: boolean) => void;
    userTickets: number;
    containerWidth?: number;
    style?: StyleProp<ViewStyle>;
}

export const GachaReel = forwardRef<GachaReelRef, GachaReelProps>(
    (
        {
            items,
            onSpinRequest,
            onSpinComplete,
            userTickets,
            containerWidth = DEFAULT_CONTAINER_WIDTH,
            style,
        },
        ref
    ) => {
        const [isSpinning, setIsSpinning] = useState(false);
        const scrollX = useRef(new Animated.Value(0)).current;

        // Build a randomized strip of 45 cards from available pool
        const [strip, setStrip] = useState<GachaItem[]>([]);

        const generateStrip = useMemo(() => {
            return (winningItem?: GachaItem) => {
                if (items.length === 0) return [];
                const result: GachaItem[] = [];
                for (let i = 0; i < REEL_LENGTH; i++) {
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    result.push(randomItem);
                }
                if (winningItem) {
                    result[WINNING_INDEX] = winningItem;
                }
                return result;
            };
        }, [items]);

        useEffect(() => {
            if (items.length > 0 && strip.length === 0) {
                setStrip(generateStrip());
            }
        }, [items, strip.length, generateStrip]);

        const executeSpinAnimation = (wonItem: GachaItem, tierUpgraded?: boolean) => {
            return new Promise<void>((resolve) => {
                const newStrip = generateStrip(wonItem);
                setStrip(newStrip);

                // Reset position to start
                scrollX.setValue(0);

                // Calculate center alignment
                const viewportCenter = containerWidth / 2;
                const cardCenterOffset = WINNING_INDEX * ITEM_STRIDE + ITEM_WIDTH / 2;
                // Add slight suspense jitter (-16px to +16px inside the winning card)
                const suspenseJitter = (Math.random() - 0.5) * 32;
                const targetTranslateX = -(cardCenterOffset - viewportCenter + suspenseJitter);

                Animated.timing(scrollX, {
                    toValue: targetTranslateX,
                    duration: 4800,
                    easing: Easing.bezier(0.12, 0.8, 0.15, 1),
                    useNativeDriver: true,
                }).start(() => {
                    setIsSpinning(false);
                    onSpinComplete(wonItem, tierUpgraded);
                    resolve();
                });
            });
        };

        useImperativeHandle(ref, () => ({
            spinToItem: async (wonItem: GachaItem, tierUpgraded?: boolean) => {
                setIsSpinning(true);
                await executeSpinAnimation(wonItem, tierUpgraded);
            },
        }));

        const handleSpinPress = async () => {
            if (isSpinning || userTickets < 1) return;
            try {
                setIsSpinning(true);
                const spinResult = await onSpinRequest();
                if (!spinResult || !spinResult.wonItem) {
                    setIsSpinning(false);
                    return;
                }
                await executeSpinAnimation(spinResult.wonItem, spinResult.tierUpgraded);
            } catch (error) {
                setIsSpinning(false);
                console.error('Spin error in GachaReel:', error);
            }
        };

        return (
            <View style={[styles.wrapper, { width: containerWidth }, style]}>
                {/* Reel Screen Case */}
                <View style={[styles.viewport, { width: containerWidth }]}>
                    {/* Animated Strip */}
                    <Animated.View
                        style={[
                            styles.strip,
                            {
                                transform: [{ translateX: scrollX }],
                            },
                        ]}
                    >
                        {strip.map((item, index) => (
                            <ReelCard key={`${item._id}-${index}`} item={item} />
                        ))}
                    </Animated.View>

                    {/* Middle Indicator Needle: Top & Bottom pointers */}
                    <View style={styles.indicatorContainer} pointerEvents="none">
                        <View style={styles.needleTop} />
                        <View style={styles.needleLine} />
                        <View style={styles.needleBottom} />
                    </View>

                    {/* Left & Right gradient edge shadows for seamless look */}
                    <LinearGradient
                        colors={['rgba(18, 20, 24, 0.95)', 'rgba(18, 20, 24, 0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.edgeLeft}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(18, 20, 24, 0)', 'rgba(18, 20, 24, 0.95)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.edgeRight}
                        pointerEvents="none"
                    />
                </View>

                {/* Spin Action CTA */}
                <TouchableOpacity
                    style={[
                        styles.spinButton,
                        (isSpinning || userTickets < 1) && styles.spinButtonDisabled,
                    ]}
                    onPress={handleSpinPress}
                    disabled={isSpinning || userTickets < 1}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={
                            userTickets > 0 && !isSpinning
                                ? ['#FFD54F', '#FFA726']
                                : ['#8E8E93', '#636366']
                        }
                        style={styles.spinButtonGradient}
                    >
                        <MaterialCommunityIcons
                            name={isSpinning ? 'autorenew' : 'cube-scan'}
                            size={22}
                            color="#3E2723"
                            style={styles.spinButtonIcon}
                        />
                        <Text style={styles.spinButtonText}>
                            {isSpinning
                                ? 'ĐANG QUAY THƯỞNG...'
                                : userTickets > 0
                                ? 'QUAY NGAY (1 VÉ)'
                                : 'HẾT VÉ QUAY'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: 'center',
        marginVertical: 12,
    },
    viewport: {
        height: 148,
        backgroundColor: '#121418',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#2C3038',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    strip: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    indicatorContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    needleTop: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 14,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    needleLine: {
        width: 2,
        flex: 1,
        backgroundColor: 'rgba(255, 215, 0, 0.45)',
    },
    needleBottom: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 14,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    edgeLeft: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 36,
        zIndex: 5,
    },
    edgeRight: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: 36,
        zIndex: 5,
    },
    spinButton: {
        marginTop: 14,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#FFA726',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    spinButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
    },
    spinButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    spinButtonIcon: {
        marginRight: 8,
    },
    spinButtonText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#3E2723',
        letterSpacing: 0.8,
    },
});

export default GachaReel;
