import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { SeasonPassDTO, SeasonRankInfo, UserPassProgressDTO } from '@shared';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';
import { formatSeasonCountdown } from '../../utils/seasonPassHelpers';

interface Props {
    season: SeasonPassDTO;
    progress: UserPassProgressDTO;
    rankInfo: SeasonRankInfo;
    canUnlockEliteFreeByVip: boolean;
    onOpenEliteModal: () => void;
    onOpenLeaderboard: () => void;
}

export const PassHeaderBanner = React.memo<Props>(({
    season,
    progress,
    rankInfo,
    canUnlockEliteFreeByVip,
    onOpenEliteModal,
    onOpenLeaderboard,
}) => {
    const countdown = formatSeasonCountdown(season.endDate);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!countdown.isUrgent) {
            pulseAnim.setValue(1);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [countdown.isUrgent, pulseAnim]);

    const xpPct = Math.min(100, Math.round((progress.currentLevelXp / progress.xpForNextLevel) * 100));

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.titleWrap}>
                    <Text style={styles.seasonTag}>MÙA {season.seasonNumber} • {season.seasonCode}</Text>
                    <Text style={styles.title} numberOfLines={1}>{season.title}</Text>
                </View>
                <Animated.View
                    style={[
                        styles.timerBadge,
                        countdown.isUrgent && styles.timerUrgent,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    <Text style={[styles.timerText, countdown.isUrgent && styles.timerUrgentText]}>
                        ⏱ {countdown.label}
                    </Text>
                </Animated.View>
            </View>

            <View style={styles.rankRow}>
                <View style={[styles.rankPill, { backgroundColor: rankInfo.badgeColor }]}>
                    <Text style={styles.rankText}>{rankInfo.icon} {rankInfo.title}</Text>
                </View>
                <Text style={styles.levelLabel}>Cấp {progress.currentLevel}</Text>
                <Text style={styles.xpLabel}>
                    {progress.currentLevelXp}/{progress.xpForNextLevel} Pass XP
                </Text>
            </View>

            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${xpPct}%` }]} />
            </View>

            {progress.overcapXp > 0 && (
                <Text style={styles.overcapNote}>
                    🔥 Vượt cấp: +{progress.overcapXp} XP ({progress.overflowChestsEarned}/10 Rương Vô Cực)
                </Text>
            )}

            <View style={styles.actionsRow}>
                {!progress.isEliteUnlocked ? (
                    <TouchableOpacity
                        style={[styles.btnPrimary, canUnlockEliteFreeByVip && styles.btnVip]}
                        onPress={onOpenEliteModal}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnPrimaryText}>
                            {canUnlockEliteFreeByVip ? '👑 Mở Tinh Anh FREE (VIP)' : '👑 Mở Sổ Tinh Anh (1.500 Xu)'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.eliteOwnedBadge}>
                        <Text style={styles.eliteOwnedText}>👑 Đã kích hoạt Sổ Tinh Anh</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.btnSecondary} onPress={onOpenLeaderboard} activeOpacity={0.85}>
                    <Text style={styles.btnSecondaryText}>🏆 Bảng Vàng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.clay,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    titleWrap: { flex: 1 },
    seasonTag: { fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.pinkDark, marginBottom: 2 },
    title: { fontSize: FONT_SIZES.title, fontWeight: '800', color: COLORS.clayText },
    timerBadge: { backgroundColor: COLORS.clayInset, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    timerUrgent: { backgroundColor: '#DC2626' },
    timerText: { fontSize: FONT_SIZES.caption, fontWeight: '700', color: COLORS.clayText },
    timerUrgentText: { color: '#FFFFFF' },
    rankRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: 8 },
    rankPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    rankText: { color: '#FFFFFF', fontSize: FONT_SIZES.caption, fontWeight: '700' },
    levelLabel: { fontSize: FONT_SIZES.subtitle, fontWeight: '800', color: COLORS.clayText },
    xpLabel: { fontSize: FONT_SIZES.caption, fontWeight: '600', color: COLORS.clayText, marginLeft: 'auto' },
    barBg: {
        height: 12,
        backgroundColor: COLORS.clayInset,
        borderRadius: 999,
        marginTop: SPACING.sm,
        overflow: 'hidden',
    },
    barFill: { height: '100%', backgroundColor: COLORS.clayAccent2, borderRadius: 999 },
    overcapNote: { marginTop: 6, fontSize: FONT_SIZES.caption, fontWeight: '700', color: COLORS.pinkDark },
    actionsRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.md },
    btnPrimary: {
        flex: 1,
        backgroundColor: COLORS.pinkDark,
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
        ...SHADOWS.pink,
    },
    btnVip: { backgroundColor: '#F59E0B' },
    btnPrimaryText: { color: '#FFFFFF', fontSize: FONT_SIZES.caption, fontWeight: '800' },
    eliteOwnedBadge: {
        flex: 1,
        backgroundColor: '#FEF3C7',
        borderRadius: 14,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    eliteOwnedText: { color: '#92400E', fontSize: FONT_SIZES.caption, fontWeight: '800' },
    btnSecondary: {
        backgroundColor: COLORS.tileBg,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        justifyContent: 'center',
        ...SHADOWS.clayLight,
    },
    btnSecondaryText: { color: COLORS.clayText, fontSize: FONT_SIZES.caption, fontWeight: '800' },
});

