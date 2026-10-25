import React, { memo } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { QuizLeaderboardResponse, QuizLeaderboardEntry } from '@shared';
import { COLORS, SHADOWS } from '../../theme';

export interface QuizLeaderboardModalProps {
    visible: boolean;
    data: QuizLeaderboardResponse | null;
    onClose: () => void;
}

interface RowProps {
    entry: QuizLeaderboardEntry;
    isCurrentUser?: boolean;
}

const LeaderboardRow: React.FC<RowProps> = memo(({ entry, isCurrentUser }) => {
    let rankBadgeColor = '#9CA3AF';
    let rankTextColor = '#FFFFFF';
    if (entry.rank === 1) {
        rankBadgeColor = '#F59E0B'; // Gold
    } else if (entry.rank === 2) {
        rankBadgeColor = '#94A3B8'; // Silver
    } else if (entry.rank === 3) {
        rankBadgeColor = '#D97706'; // Bronze
    }

    return (
        <View
            style={[
                styles.rowContainer,
                isCurrentUser && styles.currentUserHighlight,
            ]}
        >
            <View style={[styles.rankBadge, { backgroundColor: rankBadgeColor }]}>
                <Text style={[styles.rankText, { color: rankTextColor }]}>
                    {entry.rank}
                </Text>
            </View>

            <View style={styles.avatarContainer}>
                {entry.avatarUrl ? (
                    <Image source={{ uri: entry.avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>
                            {(entry.username || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.userCol}>
                <Text style={styles.usernameText} numberOfLines={1}>
                    {entry.username} {isCurrentUser ? '(Bạn)' : ''}
                </Text>
                <Text style={styles.streakSubtext}>
                    🔥 Streak cao nhất: x{entry.bestStreak}
                </Text>
            </View>

            <View style={styles.scoreCol}>
                <Text style={styles.scoreText}>{entry.totalScore}</Text>
                <Text style={styles.scoreSubtext}>điểm</Text>
            </View>
        </View>
    );
});

LeaderboardRow.displayName = 'LeaderboardRow';

/**
 * Quiz leaderboard modal presenting competition rankings and pinned user progress.
 */
export const QuizLeaderboardModal: React.FC<QuizLeaderboardModalProps> = ({
    visible,
    data,
    onClose,
}) => {
    const entries = data?.entries || [];
    const currentUser = data?.currentUser;

    const renderItem = ({ item }: { item: QuizLeaderboardEntry }) => (
        <LeaderboardRow
            entry={item}
            isCurrentUser={currentUser ? item.userId === currentUser.userId : false}
        />
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalSafe}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <MaterialIcons name="emoji-events" size={26} color="#F59E0B" />
                        <Text style={styles.headerTitle}>BẢNG VÀNG TRI THỨC</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={onClose}
                        style={styles.closeBtn}
                    >
                        <MaterialIcons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Body List */}
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.userId}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <MaterialIcons name="leaderboard" size={56} color="#D1D5DB" />
                            <Text style={styles.emptyText}>
                                Chưa có người chơi nào hoàn thành lượt chơi trong sự kiện này.
                            </Text>
                        </View>
                    }
                />

                {/* Pinned Current User Card */}
                {currentUser && (
                    <View style={styles.pinnedFooter}>
                        <Text style={styles.pinnedLabel}>XẾP HẠNG CỦA BẠN</Text>
                        <LeaderboardRow entry={currentUser} isCurrentUser />
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalSafe: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.clayText,
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 4,
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        ...SHADOWS.clayLight,
    },
    currentUserHighlight: {
        borderWidth: 2,
        borderColor: COLORS.quizPrimary,
        backgroundColor: '#EFF6FF',
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    rankText: {
        fontSize: 14,
        fontWeight: '900',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.quizPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarFallbackText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    userCol: {
        flex: 1,
    },
    usernameText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.clayText,
        marginBottom: 2,
    },
    streakSubtext: {
        fontSize: 12,
        color: '#F97316',
        fontWeight: '600',
    },
    scoreCol: {
        alignItems: 'flex-end',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.quizPrimary,
    },
    scoreSubtext: {
        fontSize: 11,
        color: '#6B7280',
    },
    emptyView: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    pinnedFooter: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
        ...SHADOWS.clay,
    },
    pinnedLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6B7280',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
});
