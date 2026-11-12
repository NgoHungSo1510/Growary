import React, { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PassTrackType, SeasonPassTier, UserPassProgressDTO } from '@shared';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';
import { PassTierItem } from './PassTierItem';

interface Props {
    tiers: SeasonPassTier[];
    progress: UserPassProgressDTO;
    unclaimedTierRewardsCount: number;
    unclaimedOvercapChests: number;
    claimingKey: string | null;
    onClaimTier: (level: number, track: PassTrackType) => void;
    onClaimAll: () => void;
    onClaimOvercap: () => void;
}

const ROW_HEIGHT = 104;

export const PassTierTrack = React.memo<Props>(({
    tiers,
    progress,
    unclaimedTierRewardsCount,
    unclaimedOvercapChests,
    claimingKey,
    onClaimTier,
    onClaimAll,
    onClaimOvercap,
}) => {
    const listRef = useRef<FlatList<SeasonPassTier>>(null);
    const freeSet = new Set(progress.claimedFreeLevels);
    const eliteSet = new Set(progress.claimedEliteLevels);

    useEffect(() => {
        if (tiers.length === 0) return;
        const targetIndex = Math.max(0, Math.min(progress.highestLevelReached - 1, tiers.length - 1));
        const timer = setTimeout(() => {
            listRef.current?.scrollToIndex({ index: targetIndex, animated: false, viewPosition: 0.3 });
        }, 120);
        return () => clearTimeout(timer);
    }, [tiers.length, progress.highestLevelReached]);

    return (
        <View style={styles.container}>
            {(unclaimedTierRewardsCount > 0 || unclaimedOvercapChests > 0) && (
                <View style={styles.actionBar}>
                    {unclaimedTierRewardsCount > 0 && (
                        <TouchableOpacity
                            style={styles.claimAllBtn}
                            disabled={claimingKey !== null}
                            onPress={onClaimAll}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.claimAllText}>
                                {claimingKey === 'claim-all'
                                    ? 'Đang nhận...'
                                    : `🎁 Nhận Tất Cả (${unclaimedTierRewardsCount})`}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {unclaimedOvercapChests > 0 && (
                        <TouchableOpacity
                            style={styles.overcapBtn}
                            disabled={claimingKey !== null}
                            onPress={onClaimOvercap}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.claimAllText}>
                                {claimingKey === 'claim-overcap'
                                    ? 'Đang mở...'
                                    : `🌟 Rương Vô Cực (${unclaimedOvercapChests})`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <View style={styles.trackHeader}>
                <Text style={styles.trackTitle}>🌱 TẬP SỰ (FREE)</Text>
                <Text style={styles.trackCenter}>CẤP</Text>
                <Text style={[styles.trackTitle, styles.eliteTitle]}>👑 TINH ANH (ELITE)</Text>
            </View>

            <FlatList
                ref={listRef}
                data={tiers}
                keyExtractor={(item) => String(item.level)}
                getItemLayout={(_data, index) => ({
                    length: ROW_HEIGHT,
                    offset: ROW_HEIGHT * index,
                    index,
                })}
                onScrollToIndexFailed={() => undefined}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <PassTierItem
                        tier={item}
                        highestLevelReached={progress.highestLevelReached}
                        isEliteUnlocked={progress.isEliteUnlocked}
                        isFreeClaimed={freeSet.has(item.level)}
                        isEliteClaimed={eliteSet.has(item.level)}
                        claimingKey={claimingKey}
                        onClaim={onClaimTier}
                    />
                )}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    actionBar: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
    claimAllBtn: {
        flex: 1,
        backgroundColor: COLORS.pinkDark,
        paddingVertical: 11,
        borderRadius: 14,
        alignItems: 'center',
        ...SHADOWS.pink,
    },
    overcapBtn: {
        flex: 1,
        backgroundColor: '#D97706',
        paddingVertical: 11,
        borderRadius: 14,
        alignItems: 'center',
        ...SHADOWS.clayLight,
    },
    claimAllText: { color: '#FFFFFF', fontSize: FONT_SIZES.caption, fontWeight: '800' },
    trackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginBottom: 8,
    },
    trackTitle: { flex: 1, textAlign: 'center', fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.clayText },
    trackCenter: { width: 52, textAlign: 'center', fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.clayText },
    eliteTitle: { color: '#B45309' },
    listContent: { paddingBottom: 24 },
});

