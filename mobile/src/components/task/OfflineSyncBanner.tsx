import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../theme';

export interface OfflineSyncBannerProps {
    pendingCount: number;
    isSyncing: boolean;
    onRetry: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = React.memo(
    ({ pendingCount, isSyncing, onRetry }) => {
        if (pendingCount <= 0) return null;

        return (
            <View style={styles.banner}>
                <View style={styles.left}>
                    {isSyncing ? (
                        <ActivityIndicator size="small" color="#B45309" />
                    ) : (
                        <Text style={styles.icon}>⏳</Text>
                    )}
                    <View style={styles.textWrap}>
                        <Text style={styles.title}>
                            Chờ đồng bộ ({pendingCount} thao tác Offline)
                        </Text>
                        <Text style={styles.subtitle}>
                            {isSyncing
                                ? 'Đang gửi dữ liệu lên máy chủ...'
                                : 'Đã lưu an toàn trên máy • Tự đẩy lên khi máy chủ thức dậy'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.retryBtn}
                    disabled={isSyncing}
                    onPress={onRetry}
                >
                    <Text style={styles.retryText}>
                        {isSyncing ? '...' : 'Đồng bộ'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    banner: {
        marginHorizontal: 20,
        marginBottom: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    icon: {
        fontSize: 16,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#92400E',
    },
    subtitle: {
        fontSize: 11,
        color: COLORS.clayText,
        opacity: 0.75,
    },
    retryBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: '#D97706',
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

