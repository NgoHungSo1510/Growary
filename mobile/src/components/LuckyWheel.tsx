import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

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
    normal: '#dcfce7', // light green
    rare: '#e0f2fe',   // light blue
    epic: '#f3e8ff',   // light purple
    legend: '#fef08a', // gold
};

const RARITY_BORDERS = {
    normal: '#4ade80',
    rare: '#38bdf8',
    epic: '#a855f7',
    legend: '#eab308',
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
                                    <G transform={`translate(${cx}, ${cy}) rotate(${slice.centerAngle - 90}) translate(${r * 0.6}, 0)`}>
                                        {/* Slightly rotate text to fit naturally along the radius line */}
                                        <SvgText
                                            fill="#334155"
                                            fontSize={slice.sliceAngle < 20 ? "10" : "14"} // scale down text if small slice
                                            fontWeight="900"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            transform={slice.centerAngle > 90 && slice.centerAngle < 270 ? "rotate(180)" : ""}
                                        // Flip text if it lands upside down on the wheel's left side
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
                    <MaterialCommunityIcons name="play-circle" size={80} color={isSpinning ? '#94a3b8' : '#f59e0b'} />
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
        top: -10,
        zIndex: 10,
        alignItems: 'center',
    },
    pointer: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        borderBottomWidth: 30,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#ef4444',
        transform: [{ rotate: '180deg' }],
    },
    pointerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#b91c1c',
        position: 'absolute',
        top: 0,
    },
    wheel: {
        borderWidth: 4,
        borderColor: '#1e293b',
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        position: 'absolute',
    },
    centerActionContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -40,
        marginTop: -40,
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinIconBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    spinButtonDisabled: {
        opacity: 0.5,
    }
});
