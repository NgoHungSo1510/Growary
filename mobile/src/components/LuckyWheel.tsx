import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, G, Text as SvgText, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface IGachaItem {
    _id: string;
    name: string;
    type: string;
    value?: number;
    rarity: 'normal' | 'rare' | 'epic' | 'legend';
    probability?: number;
}

interface Props {
    items: IGachaItem[];
    onSpinRequest: () => Promise<IGachaItem | null>;
    onSpinComplete: (item: IGachaItem) => void;
    size?: number;
}

const RARITY_COLORS = {
    normal: '#71B93F', // wheel-green
    rare: '#2D9CDB',   // wheel-blue
    epic: '#9B51E0',   // wheel-purple
    legend: '#F2C94C', // wheel-gold
};

const RARITY_BORDERS = {
    normal: 'rgba(255,255,255,0.4)',
    rare: 'rgba(255,255,255,0.4)',
    epic: 'rgba(255,255,255,0.4)',
    legend: 'rgba(255,255,255,0.4)',
};

const createPieSlice = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    if (endAngle - startAngle >= 359.9) {
        return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
    }

    const startRad = (startAngle - 90) * Math.PI / 180.0;
    const endRad = (endAngle - 90) * Math.PI / 180.0;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

export default function LuckyWheel({ items, onSpinRequest, onSpinComplete, size = 300 }: Props) {
    const spinAnim = useRef(new Animated.Value(0)).current;
    const [isSpinning, setIsSpinning] = useState(false);

    const displayItems = items.length >= 1 ? items : [
        { _id: 'empty', name: 'Trống', rarity: 'normal' as any, type: 'coins', value: 0, probability: 1 }
    ];

    const totalWeight = displayItems.reduce((sum, item) => sum + (item.probability !== undefined ? item.probability : 1), 0) || 1;

    const slices = useMemo(() => {
        let currentAngle = 0;
        return displayItems.map((item) => {
            const weight = item.probability !== undefined ? item.probability : 1;
            const sliceAngle = (weight / totalWeight) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            const centerAngle = currentAngle + sliceAngle / 2;
            currentAngle += sliceAngle;

            return {
                ...item,
                startAngle,
                endAngle,
                centerAngle,
                sliceAngle
            };
        });
    }, [displayItems, totalWeight]);

    const handleSpin = async () => {
        if (isSpinning || items.length === 0) return;
        setIsSpinning(true);

        const winningItem = await onSpinRequest();

        if (!winningItem) {
            setIsSpinning(false);
            return;
        }

        const winIndex = slices.findIndex(i => i._id === winningItem._id);
        if (winIndex === -1) {
            setIsSpinning(false);
            return;
        }

        const winSlice = slices[winIndex];
        const centerAngle = winSlice.centerAngle;

        const extraSpins = 5 * 360;
        const targetAngle = extraSpins + (360 - centerAngle);

        Animated.timing(spinAnim, {
            toValue: targetAngle,
            duration: 4000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setIsSpinning(false);
            onSpinComplete(winningItem);
            spinAnim.setValue(targetAngle % 360);
        });
    };

    const spinInterpolate = spinAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* The Pointer at the top */}
            <View style={styles.pointerContainer}>
                <View style={styles.pointer} />
                <View style={styles.pointerDot} />
            </View>

            {/* The Wheel */}
            <Animated.View
                style={[
                    styles.wheel,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ rotate: spinInterpolate }]
                    }
                ]}
            >
                <Svg width={size} height={size}>
                    {slices.map((slice, index) => {
                        const color = RARITY_COLORS[slice.rarity as keyof typeof RARITY_COLORS] || '#ffffff';
                        const borderColor = RARITY_BORDERS[slice.rarity as keyof typeof RARITY_BORDERS] || '#cccccc';

                        let displayLabel = slice.name;
                        if (slice.type === 'coins' && slice.value) displayLabel = `${slice.value} 🪙`;
                        if (slice.type === 'xp' && slice.value) displayLabel = `${slice.value} ✨`;
                        if (slice.type === 'tickets' && slice.value) displayLabel = `${slice.value} 🎟️`;
                        if (slice.type === 'item') displayLabel = `📦 ${slice.name.substring(0, 8)}`;

                        return (
                            <G key={slice._id + index}>
                                {/* Slice Background */}
                                <Path
                                    d={createPieSlice(cx, cy, r, slice.startAngle, slice.endAngle)}
                                    fill={color}
                                    stroke={borderColor}
                                    strokeWidth="2"
                                // Slight inset if we wanted a border, but Svg stroke handles lines between slices well
                                />
                                {/* Label logic */}
                                {slice.sliceAngle > 10 && ( // Hide text if slice is absurdly thin (< 10deg)
                                    <G transform={`translate(${cx}, ${cy}) rotate(${slice.centerAngle - 90}) translate(${r * 0.7}, 0)`}>
                                        <SvgText
                                            fill="#ffffff"
                                            fontSize={slice.sliceAngle < 20 ? "11" : "15"}
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            transform={slice.centerAngle > 90 && slice.centerAngle < 270 ? "rotate(180)" : ""}
                                        >
                                            {displayLabel}
                                        </SvgText>
                                    </G>
                                )}
                            </G>
                        );
                    })}
                </Svg>
            </Animated.View>

            {/* Center Hub & Spin Button Combined */}
            <View style={styles.centerActionContainer}>
                <TouchableOpacity
                    style={[styles.spinIconBtn, isSpinning && styles.spinButtonDisabled]}
                    onPress={handleSpin}
                    disabled={isSpinning || items.length === 0}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#ff9bb6', '#F57799']}
                        style={styles.spinButtonGradient}
                        start={{ x: 0.2, y: 0.2 }}
                        end={{ x: 0.8, y: 0.8 }}
                    >
                        <Text style={styles.spinTitle}>SPIN</Text>
                        <View style={styles.spinCostRow}>
                            <MaterialIcons name="local-activity" size={14} color="#FFF" />
                            <Text style={styles.spinCost}>1</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        position: 'relative',
    },
    pointerContainer: {
        position: 'absolute',
        top: -15,
        zIndex: 10,
        alignItems: 'center',
        shadowColor: 'rgba(51,47,19,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 6,
    },
    pointer: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 16,
        borderRightWidth: 16,
        borderBottomWidth: 32,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFF',
        transform: [{ rotate: '180deg' }],
    },
    pointerDot: {
        display: 'none',
    },
    wheel: {
        backgroundColor: 'transparent',
        overflow: 'hidden',
        shadowColor: '#332f13',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        position: 'absolute',
    },
    centerActionContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -45,
        marginTop: -45,
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinIconBtn: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'rgba(245, 119, 153, 0.4)',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 12,
    },
    spinButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    spinTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    spinCostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: -2,
    },
    spinCost: {
        flexDirection: 'row',
        color: 'rgba(255,255,255,0.9)',
        fontWeight: 'bold',
        fontSize: 14,
    },
    spinButtonDisabled: {
        opacity: 0.6,
        transform: [{ scale: 0.95 }]
    }
});
