import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PassQuestDefinition, PassQuestPeriod, ResolvedPassQuestItem } from '@shared';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';

interface Props {
    quests: ResolvedPassQuestItem[];
    claimingKey: string | null;
    onClaimQuest: (questCode: string) => void;
    onNavigateTarget: (screen?: PassQuestDefinition['navigateToScreen']) => void;
}

const PERIOD_TABS: Array<{ key: PassQuestPeriod; label: string }> = [
    { key: 'daily', label: 'Hàng ngày' },
    { key: 'weekly', label: 'Hàng tuần' },
    { key: 'season', label: 'Thử thách mùa' },
];

export const PassQuestList = React.memo<Props>(({
    quests,
    claimingKey,
    onClaimQuest,
    onNavigateTarget,
}) => {
    const [period, setPeriod] = useState<PassQuestPeriod>('daily');
    const filtered = quests.filter((q) => q.period === period);

    return (
        <View style={styles.container}>
            <View style={styles.chipRow}>
                {PERIOD_TABS.map((tab) => {
                    const active = tab.key === period;
                    const readyCount = quests.filter(
                        (q) => q.period === tab.key && q.isCompleted && !q.isClaimed
                    ).length;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setPeriod(tab.key)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {tab.label}{readyCount > 0 ? ` (${readyCount})` : ''}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                {filtered.map((q) => {
                    const pct = Math.min(100, Math.round((q.progress / q.targetCount) * 100));
                    const isBusy = claimingKey === `quest:${q.questCode}`;
                    return (
                        <View key={q.questCode} style={styles.card}>
                            <View style={styles.infoCol}>
                                <Text style={styles.title}>{q.title}</Text>
                                <Text style={styles.desc}>{q.description}</Text>
                                <View style={styles.barBg}>
                                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                                </View>
                                <View style={styles.metaRow}>
                                    <Text style={styles.progressText}>
                                        {Math.min(q.progress, q.targetCount)}/{q.targetCount}
                                    </Text>
                                    <Text style={styles.rewardText}>
                                        +{q.rewardPassXp} Pass XP • +{q.rewardVaultCoins} Xu Két
                                    </Text>
                                </View>
                            </View>

                            {q.isClaimed ? (
                                <View style={styles.doneBadge}>
                                    <Text style={styles.doneText}>✓ Đã nhận</Text>
                                </View>
                            ) : q.isCompleted ? (
                                <TouchableOpacity
                                    style={styles.claimBtn}
                                    disabled={claimingKey !== null}
                                    onPress={() => onClaimQuest(q.questCode)}
                                >
                                    <Text style={styles.claimText}>{isBusy ? '...' : 'Nhận'}</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.goBtn}
                                    onPress={() => onNavigateTarget(q.navigateToScreen)}
                                >
                                    <Text style={styles.goText}>Đi tới</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
    chip: {
        flex: 1, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.clayInset, alignItems: 'center',
    },
    chipActive: { backgroundColor: COLORS.pinkDark },
    chipText: { fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.clayText },
    chipTextActive: { color: '#FFFFFF' },
    list: { gap: 10, paddingBottom: 24 },
    card: {
        backgroundColor: COLORS.tileBg, borderRadius: 16, padding: SPACING.md,
        flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOWS.clayLight,
    },
    infoCol: { flex: 1 },
    title: { fontSize: FONT_SIZES.body, fontWeight: '800', color: COLORS.clayText },
    desc: { fontSize: FONT_SIZES.caption, color: '#78716C', marginTop: 2 },
    barBg: { height: 8, backgroundColor: COLORS.clayInset, borderRadius: 999, marginTop: 8, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 999 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    progressText: { fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.clayText },
    rewardText: { fontSize: FONT_SIZES.caption, fontWeight: '700', color: '#B45309' },
    claimBtn: { backgroundColor: COLORS.pinkDark, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    claimText: { color: '#FFFFFF', fontSize: FONT_SIZES.caption, fontWeight: '800' },
    goBtn: { backgroundColor: COLORS.clayCard, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    goText: { color: COLORS.clayText, fontSize: FONT_SIZES.caption, fontWeight: '800' },
    doneBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    doneText: { color: '#15803D', fontSize: FONT_SIZES.caption, fontWeight: '800' },
});

