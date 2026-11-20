import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
    subscribeSyncStatus,
    GlobalSyncState,
    getGlobalSyncState,
} from '../services/offlineSnapshotStore';
import { flushOfflineQueue } from '../services/offlineSyncService';
import { COLORS } from '../theme';

interface GlobalSyncStatusBarProps {
    compact?: boolean;
}

/**
 * Global synchronization status bar displayed on top headers.
 * Shows syncing indicator or offline pending outbox count with manual sync trigger.
 */
export const GlobalSyncStatusBar: React.FC<GlobalSyncStatusBarProps> = React.memo(
    ({ compact = false }) => {
        const [state, setState] = useState<GlobalSyncState>(getGlobalSyncState());
        const [isTriggering, setIsTriggering] = useState(false);

        useEffect(() => {
            const unsubscribe = subscribeSyncStatus(setState);
            return unsubscribe;
        }, []);

        const handleManualSync = async () => {
            if (isTriggering || state.isSyncing) return;
            setIsTriggering(true);
            try {
                await flushOfflineQueue();
            } finally {
                setIsTriggering(false);
            }
        };

        if (!state.isOffline && state.pendingCount === 0 && !state.isSyncing) {
            return null;
        }

        const isSyncActive = state.isSyncing || isTriggering;

        return (
            <View
                style={[
                    styles.container,
                    isSyncActive ? styles.syncingContainer : styles.offlineContainer,
                    compact && styles.compactContainer,
                ]}
            >
                <View style={styles.leftRow}>
                    {isSyncActive ? (
                        <ActivityIndicator size="small" color="#2563EB" style={styles.icon} />
                    ) : (
                        <MaterialIcons
                            name={state.pendingCount > 0 ? 'cloud-queue' : 'cloud-off'}
                            size={16}
                            color="#D97706"
                            style={styles.icon}
                        />
                    )}
                    <Text
                        style={[
                            styles.statusText,
                            isSyncActive ? styles.syncingText : styles.offlineText,
                        ]}
                        numberOfLines={1}
                    >
                        {isSyncActive
                            ? 'Đang đồng bộ dữ liệu hệ thống...'
                            : state.serverWaking
                            ? `Đang đánh thức server... (${state.pendingCount} chờ)`
                            : state.pendingCount > 0
                            ? `Offline • ${state.pendingCount} thao tác chờ đồng bộ`
                            : 'Đang hoạt động ngoại tuyến'}
                    </Text>
                </View>

                {!isSyncActive && state.pendingCount > 0 && (
                    <TouchableOpacity
                        onPress={handleManualSync}
                        style={styles.syncButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.syncButtonText}>Đồng bộ</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }
);

GlobalSyncStatusBar.displayName = 'GlobalSyncStatusBar';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    compactContainer: {
        marginHorizontal: 0,
        marginBottom: 4,
    },
    syncingContainer: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    offlineContainer: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    syncingText: {
        color: '#1D4ED8',
    },
    offlineText: {
        color: '#92400E',
    },
    syncButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    syncButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
});

