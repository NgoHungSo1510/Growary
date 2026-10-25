import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ShopEvent } from '@shared';
import { EventCountdown } from '../../hooks/useShopEvent';

interface FlashSaleBannerProps {
    event: ShopEvent | null;
    countdown: EventCountdown;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({
    event,
    countdown,
    onPress,
    style,
}) => {
    if (!event || countdown.isEnded) {
        return null;
    }

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={onPress ? 0.85 : 1}
        >
            <LinearGradient
                colors={['#DC2626', '#B91C1C', '#991B1B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <View style={styles.leftCol}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="local-fire-department" size={20} color="#FFD700" />
                    </View>
                    <View>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>FLASH SALE</Text>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>-{event.discountPercent}%</Text>
                            </View>
                        </View>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {event.title}
                        </Text>
                    </View>
                </View>

                <View style={styles.countdownCol}>
                    <Text style={styles.countdownLabel}>KẾT THÚC SAU</Text>
                    <View style={styles.timerBadge}>
                        <MaterialIcons name="timer" size={12} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.timerText}>{countdown.formatted}</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    leftCol: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 13,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    tag: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
        marginLeft: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7F1D1D',
    },
    subtitle: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
    },
    countdownCol: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    countdownLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FCA5A5',
        marginBottom: 2,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    timerText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#FFFFFF',
        fontVariant: ['tabular-nums'],
    },
});

export default FlashSaleBanner;
