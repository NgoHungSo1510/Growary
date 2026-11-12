import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PassReward, PassTrackType, SeasonPassTier } from '@shared';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';
import { getRewardVisual } from '../../utils/seasonPassHelpers';

interface Props {
    tier: SeasonPassTier;
    highestLevelReached: number;
    isEliteUnlocked: boolean;
    isFreeClaimed: boolean;
    isEliteClaimed: boolean;
    claimingKey: string | null;
    onClaim: (level: number, track: PassTrackType) => void;
}

const RewardCell = React.memo<{
    reward: PassReward | null;
    level: number;
    track: PassTrackType;
    unlocked: boolean;
    claimed: boolean;
    busy: boolean;
    onClaim: (level: number, track: PassTrackType) => void;
}>(({ reward, level, track, unlocked, claimed, busy, onClaim }) => {
    const visual = getRewardVisual(reward);
    const canClaim = Boolean(reward) && unlocked && !claimed;

    return (
        <TouchableOpacity
            style={[
                styles.cell,
                { backgroundColor: reward ? visual.bgColor : COLORS.inputBg },
                canClaim && styles.cellReady,
                !unlocked && reward && styles.cellLocked,
                claimed && styles.cellClaimed,
            ]}
            disabled={!canClaim || busy}
            onPress={() => onClaim(level, track)}
            activeOpacity={0.8}
        >
            <Text style={styles.icon}>{visual.icon}</Text>
            <Text style={styles.label} numberOfLines={2}>
                {reward ? reward.label : 'Trống'}
            </Text>
            {claimed ? (
                <Text style={styles.badgeClaimed}>✓ Đã nhận</Text>
            ) : canClaim ? (
                <Text style={styles.badgeReady}>Nhận!</Text>
            ) : !unlocked && reward ? (
                <Text style={styles.badgeLocked}>{track === 'elite' ? '👑 Khóa' : '🔒'}</Text>
            ) : null}
        </TouchableOpacity>
    );
});

export const PassTierItem = React.memo<Props>(({
    tier,
    highestLevelReached,
    isEliteUnlocked,
    isFreeClaimed,
    isEliteClaimed,
    claimingKey,
    onClaim,
}) => {
    const reached = highestLevelReached >= tier.level;
    const freeKey = `tier:free:${tier.level}`;
    const eliteKey = `tier:elite:${tier.level}`;

    return (
        <View style={styles.row}>
            <RewardCell
                reward={tier.freeReward}
                level={tier.level}
                track="free"
                unlocked={reached}
                claimed={isFreeClaimed}
                busy={claimingKey === freeKey || claimingKey === 'claim-all'}
                onClaim={onClaim}
            />

            <View style={[styles.levelPill, reached && styles.levelPillReached]}>
                <Text style={[styles.levelText, reached && styles.levelTextReached]}>
                    {tier.level}
                </Text>
            </View>

            <RewardCell
                reward={tier.eliteReward}
                level={tier.level}
                track="elite"
                unlocked={reached && isEliteUnlocked}
                claimed={isEliteClaimed}
                busy={claimingKey === eliteKey || claimingKey === 'claim-all'}
                onClaim={onClaim}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    row: {
        height: 96,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    cell: {
        flex: 1,
        height: 92,
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(93, 64, 55, 0.1)',
        ...SHADOWS.clayLight,
    },
    cellReady: {
        borderColor: COLORS.pinkDark,
        borderWidth: 2,
    },
    cellLocked: { opacity: 0.65 },
    cellClaimed: { opacity: 0.55, borderColor: '#22C55E' },
    icon: { fontSize: 22, marginBottom: 2 },
    label: { fontSize: FONT_SIZES.caption, fontWeight: '700', color: COLORS.clayText, textAlign: 'center' },
    badgeReady: {
        marginTop: 3, fontSize: 10, fontWeight: '800', color: '#FFFFFF',
        backgroundColor: COLORS.pinkDark, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
    },
    badgeClaimed: { marginTop: 3, fontSize: 10, fontWeight: '800', color: '#15803D' },
    badgeLocked: { marginTop: 3, fontSize: 10, fontWeight: '700', color: '#78716C' },
    levelPill: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.clayInset,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.clayCard,
    },
    levelPillReached: { backgroundColor: COLORS.pinkDark, borderColor: COLORS.gold },
    levelText: { fontSize: FONT_SIZES.body, fontWeight: '800', color: COLORS.clayText },
    levelTextReached: { color: '#FFFFFF' },
});

