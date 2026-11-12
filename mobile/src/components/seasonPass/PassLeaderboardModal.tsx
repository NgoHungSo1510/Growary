import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { SeasonPassLeaderboardEntry, SeasonPassLeaderboardResponse } from '@shared';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../theme';

interface Props {
    visible: boolean;
    loading: boolean;
    data: SeasonPassLeaderboardResponse | null;
    onClose: () => void;
}

const getRankMedal = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
};

const LeaderboardRow = React.memo<{ item: SeasonPassLeaderboardEntry; isMe: boolean }>(({ item, isMe }) => (
    <View style={[styles.row, item.rank <= 3 && styles.topRow, isMe && styles.meRow]}>
        <Text style={styles.rank}>{getRankMedal(item.rank)}</Text>
        <View style={styles.nameWrap}>
            <Text style={styles.username} numberOfLines={1}>
                {item.username} {item.isEliteUnlocked ? '👑' : ''}
            </Text>
            <Text style={styles.subText}>Cấp {item.currentLevel}</Text>
        </View>
        <Text style={styles.xpText}>{item.totalPassXp.toLocaleString('vi-VN')} XP</Text>
    </View>
));

export const PassLeaderboardModal = React.memo<Props>(({ visible, loading, data, onClose }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>🏆 Bảng Vàng Quý ({data?.seasonCode ?? ''})</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.pinkDark} style={{ marginVertical: 40 }} />
                ) : (
                    <FlatList
                        data={data?.leaderboard ?? []}
                        keyExtractor={(item) => item.userId}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có người chơi trên Bảng Vàng.</Text>}
                        renderItem={({ item }) => (
                            <LeaderboardRow
                                item={item}
                                isMe={data?.currentUserEntry?.userId === item.userId}
                            />
                        )}
                    />
                )}
            </View>
        </View>
    </Modal>
));

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    card: {
        backgroundColor: COLORS.warmBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '80%', padding: SPACING.lg, ...SHADOWS.clay,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZES.title, fontWeight: '800', color: COLORS.clayText },
    closeBtn: { padding: 6 },
    closeText: { fontSize: 18, fontWeight: '800', color: COLORS.clayText },
    row: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.tileBg,
        borderRadius: 14, padding: 12, marginBottom: 8, gap: 10,
    },
    topRow: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
    meRow: { borderWidth: 2, borderColor: COLORS.pinkDark },
    rank: { width: 34, fontSize: 16, fontWeight: '800', textAlign: 'center', color: COLORS.clayText },
    nameWrap: { flex: 1 },
    username: { fontSize: FONT_SIZES.body, fontWeight: '800', color: COLORS.clayText },
    subText: { fontSize: FONT_SIZES.caption, color: '#78716C' },
    xpText: { fontSize: FONT_SIZES.caption, fontWeight: '800', color: COLORS.pinkDark },
    emptyText: { textAlign: 'center', color: '#78716C', marginVertical: 24 },
});

