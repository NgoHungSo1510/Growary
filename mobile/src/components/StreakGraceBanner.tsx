import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { User } from '../../../shared/types/user';
import { SHADOWS } from '../theme';

export interface StreakGraceBannerProps {
    user: User | null;
}

export const StreakGraceBanner: React.FC<StreakGraceBannerProps> = React.memo(({ user }) => {
    if (!user || !user.streakGracePeriod) {
        return null;
    }

    // Tính số lượt khôi phục còn lại trong tháng hiện tại (UTC+7)
    const currentVnMonth = (() => {
        const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    })();

    const restoresUsed =
        user.lastStreakRestoreMonth === currentVnMonth ? (user.streakRestoresThisMonth || 0) : 0;
    const remaining = Math.max(0, 3 - restoresUsed);

    return (
        <View style={styles.banner}>
            <View style={styles.iconCircle}>
                <MaterialIcons name="local-fire-department" size={24} color="#EA580C" />
            </View>
            <View style={styles.textWrap}>
                <Text style={styles.title}>Cảnh báo giữ chuỗi Streak!</Text>
                <Text style={styles.desc}>
                    Bạn đã lỡ ngày hôm qua! Hoàn thành đủ 3 nhiệm vụ hôm nay để cứu chuỗi 🔥{' '}
                    <Text style={styles.highlight}>{user.currentStreak} ngày</Text> (Còn {remaining}/3 lượt khôi phục tháng này).
                </Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF7ED',
        borderWidth: 1.5,
        borderColor: '#F97316',
        borderRadius: 18,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 8,
        ...SHADOWS.clayLight,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#C2410C',
        marginBottom: 2,
    },
    desc: {
        fontSize: 12,
        color: '#7C2D12',
        lineHeight: 17,
    },
    highlight: {
        fontWeight: 'bold',
        color: '#EA580C',
    },
});

