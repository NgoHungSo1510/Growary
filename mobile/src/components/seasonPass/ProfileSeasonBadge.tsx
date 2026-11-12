import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { UserSeasonBadge } from '@shared';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';
import { apiService } from '../../services/api';
import { showApiError } from '../../utils/errorHandler';
import { getAvatarFrameStyle } from '../../utils/seasonPassHelpers';

interface Props {
    seasonBadges: UserSeasonBadge[];
    unlockedFrames: string[];
    activeFrameId: string | null;
    onFrameChanged: () => Promise<unknown>;
}

export const ProfileSeasonBadge = React.memo<Props>(({
    seasonBadges,
    unlockedFrames,
    activeFrameId,
    onFrameChanged,
}) => {
    const [savingFrame, setSavingFrame] = useState(false);

    if (seasonBadges.length === 0 && unlockedFrames.length === 0) {
        return null;
    }

    const handleEquip = async (frameId: string | null) => {
        if (savingFrame || frameId === activeFrameId) return;
        setSavingFrame(true);
        try {
            await apiService.equipPassAvatarFrame({ frameId });
            await onFrameChanged();
        } catch (err) {
            showApiError(err, 'Không thể đổi khung avatar');
        } finally {
            setSavingFrame(false);
        }
    };

    return (
        <View style={styles.card}>
            <Text style={styles.heading}>📜 Sổ Sứ Mệnh & Khung Avatar</Text>

            {seasonBadges.length > 0 && (
                <View style={styles.badgeList}>
                    {seasonBadges.map((b) => (
                        <View key={b.seasonCode} style={styles.badgeChip}>
                            <Text style={styles.badgeTitle}>
                                {b.rankIcon} {b.seasonCode} • Cấp {b.highestLevel}
                            </Text>
                            <Text style={styles.badgeSub}>
                                {b.rankTitle}{b.isEliteUnlocked ? ' (Tinh Anh)' : ''}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {unlockedFrames.length > 0 && (
                <View style={styles.frameSection}>
                    <Text style={styles.subLabel}>Khung Avatar đã mở khóa:</Text>
                    <View style={styles.frameRow}>
                        <TouchableOpacity
                            style={[styles.framePill, activeFrameId === null && styles.framePillActive]}
                            disabled={savingFrame}
                            onPress={() => void handleEquip(null)}
                        >
                            <Text style={styles.frameText}>Mặc định</Text>
                        </TouchableOpacity>

                        {unlockedFrames.map((fid) => {
                            const meta = getAvatarFrameStyle(fid);
                            const isActive = activeFrameId === fid;
                            return (
                                <TouchableOpacity
                                    key={fid}
                                    style={[
                                        styles.framePill,
                                        meta && { borderColor: meta.borderColor },
                                        isActive && styles.framePillActive,
                                    ]}
                                    disabled={savingFrame}
                                    onPress={() => void handleEquip(fid)}
                                >
                                    <Text style={styles.frameText}>
                                        {meta?.badgeIcon ?? '✨'} {meta?.label ?? fid}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.tileBg,
        borderRadius: 20,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        ...SHADOWS.clayLight,
    },
    heading: { fontSize: FONT_SIZES.subtitle, fontWeight: '800', color: COLORS.clayText, marginBottom: 8 },
    badgeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    badgeChip: {
        backgroundColor: '#FEF3C7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
        borderWidth: 1, borderColor: '#F59E0B',
    },
    badgeTitle: { fontSize: FONT_SIZES.caption, fontWeight: '800', color: '#92400E' },
    badgeSub: { fontSize: 10, fontWeight: '600', color: '#B45309' },
    frameSection: { marginTop: 4 },
    subLabel: { fontSize: FONT_SIZES.caption, fontWeight: '700', color: '#78716C', marginBottom: 6 },
    frameRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    framePill: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
        backgroundColor: COLORS.clayInset, borderWidth: 2, borderColor: 'transparent',
    },
    framePillActive: { backgroundColor: '#FCE7F3', borderColor: COLORS.pinkDark },
    frameText: { fontSize: FONT_SIZES.caption, fontWeight: '700', color: COLORS.clayText },
});

