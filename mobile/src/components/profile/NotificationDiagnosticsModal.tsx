import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { COLORS } from '../../theme';
import {
    ensureNotificationChannelAndPermissions,
    getScheduledNotificationsDiagnostics,
    triggerTestNotificationIn5Seconds,
} from '../../services/notifications';

export interface NotificationDiagnosticsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const NotificationDiagnosticsModal: React.FC<NotificationDiagnosticsModalProps> = React.memo(
    ({ visible, onClose }) => {
        const [loading, setLoading] = useState(false);
        const [testing, setTesting] = useState(false);
        const [info, setInfo] = useState<{
            permissionStatus: string;
            channelId: string;
            scheduledCount: number;
            cachedRulesCount: number;
            sampleTitles: string[];
        } | null>(null);

        const loadDiagnostics = useCallback(async () => {
            setLoading(true);
            try {
                await ensureNotificationChannelAndPermissions();
                const data = await getScheduledNotificationsDiagnostics();
                setInfo(data);
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => {
            if (visible) {
                void loadDiagnostics();
            }
        }, [visible, loadDiagnostics]);

        const handleTest5s = async () => {
            if (testing) return;
            setTesting(true);
            try {
                await triggerTestNotificationIn5Seconds();
                Alert.alert(
                    'Đã hẹn thông báo thử!',
                    'Thông báo sẽ nổ sau 5 giây. Bạn có thể thoát ra màn hình chính để kiểm tra.'
                );
                await loadDiagnostics();
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Không thể gửi thông báo thử';
                Alert.alert('Lỗi thông báo', msg);
            } finally {
                setTesting(false);
            }
        };

        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.card}>
                        <Text style={styles.title}>🔔 Kiểm tra Thông báo & Offline Alarm</Text>
                        <Text style={styles.subtitle}>
                            Chẩn đoán quyền thông báo và lịch hẹn giờ lưu trên máy (hoạt động cả khi máy chủ ngủ đông).
                        </Text>

                        {loading || !info ? (
                            <ActivityIndicator size="small" color={COLORS.clayAccent1} />
                        ) : (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoRow}>
                                    • Quyền thông báo:{' '}
                                    <Text style={styles.bold}>
                                        {info.permissionStatus === 'granted'
                                            ? '✅ Đã cấp (granted)'
                                            : `⚠️ ${info.permissionStatus}`}
                                    </Text>
                                </Text>
                                <Text style={styles.infoRow}>
                                    • Kênh Android: <Text style={styles.bold}>{info.channelId}</Text>
                                </Text>
                                <Text style={styles.infoRow}>
                                    • Số lịch hẹn đang nằm trong máy:{' '}
                                    <Text style={styles.bold}>{info.scheduledCount}</Text>
                                </Text>
                                <Text style={styles.infoRow}>
                                    • Số quy tắc Offline Alarm từ Admin:{' '}
                                    <Text style={styles.bold}>{info.cachedRulesCount}</Text>
                                </Text>
                                {info.sampleTitles.length > 0 && (
                                    <Text style={styles.sampleText}>
                                        Lịch sắp tới: {info.sampleTitles.join(' • ')}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.btn, styles.primaryBtn]}
                                disabled={testing}
                                onPress={() => void handleTest5s()}
                            >
                                <Text style={styles.primaryBtnText}>
                                    {testing ? '⏳ Đang hẹn...' : '🔔 Gửi thử sau 5 giây'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, styles.secondaryBtn]}
                                onPress={() => void loadDiagnostics()}
                            >
                                <Text style={styles.secondaryBtnText}>🔄 Làm mới trạng thái</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Text style={styles.closeBtnText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFDF5',
        borderRadius: 20,
        padding: 20,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.clayText,
        opacity: 0.7,
        marginBottom: 14,
        lineHeight: 18,
    },
    infoBox: {
        backgroundColor: 'rgba(210, 150, 100, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 6,
    },
    infoRow: {
        fontSize: 13,
        color: COLORS.clayText,
    },
    bold: {
        fontWeight: 'bold',
    },
    sampleText: {
        fontSize: 11,
        color: COLORS.clayText,
        opacity: 0.75,
        marginTop: 4,
    },
    actions: {
        gap: 10,
    },
    btn: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: COLORS.clayAccent2,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    secondaryBtn: {
        backgroundColor: 'rgba(93, 64, 55, 0.1)',
    },
    secondaryBtnText: {
        color: COLORS.clayText,
        fontWeight: '600',
        fontSize: 13,
    },
    closeBtn: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    closeBtnText: {
        color: COLORS.clayText,
        opacity: 0.6,
        fontWeight: '600',
        fontSize: 13,
    },
});

