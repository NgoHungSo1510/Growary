import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_SIZES } from '../../theme';

interface Props {
    onPress: () => void;
    unclaimedBadgeCount?: number;
}

export const SeasonPassEventCard = React.memo<Props>(({ onPress, unclaimedBadgeCount = 0 }) => (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.85} onPress={onPress}>
        <LinearGradient
            colors={['#F59E0B', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
        >
            <View style={styles.contentWrap}>
                <View style={styles.iconBox}>
                    <MaterialIcons name="menu-book" size={40} color="#FFF" />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>Sổ Sứ Mệnh</Text>
                        {unclaimedBadgeCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unclaimedBadgeCount} quà mới</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.cardSubtitle}>Sự Kiện Quý • 80 Cấp & Két Sắt</Text>
                    <Text style={styles.cardDesc}>
                        Hoàn thành task, săn Boss, quay Gacha & Quiz để cày Pass XP nhận quà Tinh Anh và Khung Avatar!
                    </Text>
                </View>
                <View style={styles.actionBtn}>
                    <MaterialIcons name="arrow-forward" size={22} color="#FFF" />
                </View>
            </View>
            <MaterialIcons
                name="library-books"
                size={100}
                color="rgba(255,255,255,0.08)"
                style={styles.bgIcon}
            />
        </LinearGradient>
    </TouchableOpacity>
));

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#B45309',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 8,
    },
    cardGradient: { padding: 20, position: 'relative' },
    contentWrap: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    cardTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
    cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 17 },
    badge: { backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    badgeText: { color: '#FFF', fontSize: FONT_SIZES.caption - 1, fontWeight: '800' },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    bgIcon: { position: 'absolute', right: -10, bottom: -16, zIndex: 1 },
});

