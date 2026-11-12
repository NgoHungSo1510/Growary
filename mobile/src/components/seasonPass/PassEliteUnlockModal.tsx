import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';

interface Props {
    visible: boolean;
    canUnlockFreeByVip: boolean;
    userCoins: number;
    busy: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const PassEliteUnlockModal = React.memo<Props>(({
    visible,
    canUnlockFreeByVip,
    userCoins,
    busy,
    onClose,
    onConfirm,
}) => {
    const canAfford = canUnlockFreeByVip || userCoins >= 1500;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.emoji}>👑</Text>
                    <Text style={styles.title}>Mở Khóa Sổ Tinh Anh</Text>
                    <Text style={styles.subtitle}>
                        Nhận toàn bộ nhánh phần thưởng Tinh Anh từ Cấp 1–80, hồi tố mọi cấp đã đạt!
                    </Text>

                    <View style={styles.perkList}>
                        <Text style={styles.perkItem}>• Cộng ngay +500 Pass XP (tăng 5 cấp tức thì)</Text>
                        <Text style={styles.perkItem}>• Mở khóa Khung Avatar Tinh Anh độc quyền</Text>
                        <Text style={styles.perkItem}>• Thêm Xu, Vé Gacha & Rương Sử Thi / Vô Cực</Text>
                    </View>

                    {canUnlockFreeByVip ? (
                        <View style={styles.vipNote}>
                            <Text style={styles.vipNoteText}>✨ Đặc quyền VIP 4+: Miễn phí kích hoạt 100%!</Text>
                        </View>
                    ) : (
                        <Text style={styles.costText}>
                            Chi phí: 1.500 Xu (Ví hiện có: {userCoins.toLocaleString('vi-VN')} Xu)
                        </Text>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={busy}>
                            <Text style={styles.cancelText}>Để sau</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, (!canAfford || busy) && styles.confirmDisabled]}
                            onPress={onConfirm}
                            disabled={!canAfford || busy}
                        >
                            <Text style={styles.confirmText}>
                                {busy ? 'Đang kích hoạt...' : canUnlockFreeByVip ? 'Kích Hoạt FREE' : 'Mở Khóa (1.500 Xu)'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: SPACING.xl,
    },
    card: {
        backgroundColor: COLORS.tileBg, borderRadius: 24, padding: SPACING.xl, alignItems: 'center', ...SHADOWS.clay,
    },
    emoji: { fontSize: 44, marginBottom: 6 },
    title: { fontSize: FONT_SIZES.title, fontWeight: '800', color: COLORS.clayText },
    subtitle: { fontSize: FONT_SIZES.body, color: '#78716C', textAlign: 'center', marginTop: 6 },
    perkList: {
        width: '100%', backgroundColor: COLORS.clayInset, borderRadius: 14, padding: SPACING.md, marginTop: SPACING.md, gap: 6,
    },
    perkItem: { fontSize: FONT_SIZES.caption, fontWeight: '700', color: COLORS.clayText },
    vipNote: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 10, marginTop: SPACING.md, width: '100%' },
    vipNoteText: { color: '#92400E', fontWeight: '800', fontSize: FONT_SIZES.caption, textAlign: 'center' },
    costText: { marginTop: SPACING.md, fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.clayText },
    actions: { flexDirection: 'row', gap: 10, marginTop: SPACING.lg, width: '100%' },
    cancelBtn: {
        flex: 1, backgroundColor: COLORS.clayInset, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
    },
    cancelText: { fontWeight: '800', color: COLORS.clayText },
    confirmBtn: {
        flex: 1.4, backgroundColor: COLORS.pinkDark, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
    },
    confirmDisabled: { backgroundColor: '#D6D3D1' },
    confirmText: { fontWeight: '800', color: '#FFFFFF' },
});

