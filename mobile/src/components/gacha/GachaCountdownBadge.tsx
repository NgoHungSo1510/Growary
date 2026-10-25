import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CountdownState } from '../../hooks/useGacha';
import { COLORS } from '../../theme';

interface GachaCountdownBadgeProps {
    countdown: CountdownState;
    isUrgent: boolean;
    style?: StyleProp<ViewStyle>;
}

export const GachaCountdownBadge: React.FC<GachaCountdownBadgeProps> = ({
    countdown,
    isUrgent,
    style,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isUrgent) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.08,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isUrgent, pulseAnim]);

    return (
        <Animated.View
            style={[
                styles.container,
                isUrgent ? styles.urgentContainer : styles.normalContainer,
                { transform: [{ scale: pulseAnim }] },
                style,
            ]}
        >
            <MaterialIcons
                name={isUrgent ? 'local-fire-department' : 'timer'}
                size={18}
                color={isUrgent ? '#FF3B30' : '#FFB800'}
                style={styles.icon}
            />
            <View style={styles.textContainer}>
                <Text style={[styles.label, isUrgent && styles.urgentLabel]}>
                    {isUrgent ? 'SẮP KẾT THÚC TUẦN' : 'Kỳ quay tuần kết thúc sau'}
                </Text>
                <Text style={[styles.timer, isUrgent && styles.urgentTimer]}>
                    {countdown.formatted}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        alignSelf: 'center',
    },
    normalContainer: {
        backgroundColor: 'rgba(255, 184, 0, 0.12)',
        borderColor: 'rgba(255, 184, 0, 0.4)',
    },
    urgentContainer: {
        backgroundColor: 'rgba(255, 59, 48, 0.16)',
        borderColor: '#FF3B30',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },
    icon: {
        marginRight: 8,
    },
    textContainer: {
        flexDirection: 'column',
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#E0A800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    urgentLabel: {
        color: '#FF453A',
        fontWeight: '900',
    },
    timer: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.clayText,
        fontVariant: ['tabular-nums'],
    },
    urgentTimer: {
        color: '#D70015',
        fontWeight: '900',
    },
});

export default GachaCountdownBadge;
