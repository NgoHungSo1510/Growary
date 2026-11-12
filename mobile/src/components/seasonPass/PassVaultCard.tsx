import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { UserPassProgressDTO } from '@shared';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';

interface Props {
    progress: UserPassProgressDTO;
    canWithdrawVault: boolean;
    vaultUnlockReason: string;
    claimingKey: string | null;
    onWithdraw: () => void;
}

const VAULT_MAX = 2000;

export const PassVaultCard = React.memo<Props>(({
    progress,
    canWithdrawVault,
    vaultUnlockReason,
    claimingKey,
    onWithdraw,
}) => {
    const pct = Math.min(100, Math.round((progress.vaultDepositedTotal / VAULT_MAX) * 100));
    const canTap = canWithdrawVault && progress.vaultCoins > 0 && claimingKey === null;

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>🏦 Két Sắt Mùa</Text>
                <Text style={styles.balance}>{progress.vaultCoins.toLocaleString('vi-VN')} Xu chờ rút</Text>
            </View>

            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    Đã tích lũy: {progress.vaultDepositedTotal.toLocaleString('vi-VN')}/{VAULT_MAX.toLocaleString('vi-VN')} Xu
                </Text>
                <Text style={styles.metaText}>
                    Đã rút: {progress.vaultWithdrawnTotal.toLocaleString('vi-VN')} Xu
                </Text>
            </View>

            <View style={styles.footerRow}>
                <Text style={styles.reasonText} numberOfLines={2}>
                    {vaultUnlockReason} (tiếp tục tích thêm sau khi rút)
                </Text>
                <TouchableOpacity
                    style={[styles.withdrawBtn, !canTap && styles.withdrawBtnDisabled]}
                    disabled={!canTap}
                    onPress={onWithdraw}
                    activeOpacity={0.85}
                >
                    <Text style={styles.withdrawBtnText}>
                        {claimingKey === 'withdraw-vault' ? 'Đang rút...' : 'Rút Xu'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.tileBg,
        borderRadius: 18,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1.5,
        borderColor: COLORS.gold,
        ...SHADOWS.clayLight,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: FONT_SIZES.subtitle, fontWeight: '800', color: COLORS.clayText },
    balance: { fontSize: FONT_SIZES.subtitle, fontWeight: '800', color: '#B45309' },
    barBg: {
        height: 10,
        backgroundColor: COLORS.clayInset,
        borderRadius: 999,
        marginTop: SPACING.sm,
        overflow: 'hidden',
    },
    barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 999 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    metaText: { fontSize: FONT_SIZES.caption, fontWeight: '600', color: COLORS.clayText },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: SPACING.sm },
    reasonText: { flex: 1, fontSize: FONT_SIZES.caption, color: '#78716C' },
    withdrawBtn: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    withdrawBtnDisabled: { backgroundColor: '#D6D3D1' },
    withdrawBtnText: { color: '#FFFFFF', fontSize: FONT_SIZES.caption, fontWeight: '800' },
});

