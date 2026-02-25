import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { COLORS } from '../theme';

interface AppNotification {
    _id: string;
    title: string;
    message: string;
    type: 'system' | 'reward' | 'penalty' | 'event';
    isRead: boolean;
    createdAt: string;
}

const getIconForType = (type: string): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
        case 'reward': return 'card-giftcard';
        case 'penalty': return 'warning';
        case 'event': return 'event';
        default: return 'info';
    }
};

const getColorForType = (type: string) => {
    switch (type) {
        case 'reward': return '#4ADE80';
        case 'penalty': return '#EF4444';
        case 'event': return '#A855F7';
        default: return COLORS.clayAccent2;
    }
};

export default function NotificationsScreen() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await apiService.getNotifications();
            setNotifications(data.notifications);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            await apiService.markNotificationAsRead(id);
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const renderItem = ({ item }: { item: AppNotification }) => {
        const iconName = getIconForType(item.type);
        const iconColor = getColorForType(item.type);
        const date = new Date(item.createdAt).toLocaleString('vi-VN');

        return (
            <TouchableOpacity
                style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
                onPress={() => markAsRead(item._id, item.isRead)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: `${iconColor}20` }]}>
                    <MaterialIcons name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.time}>{date}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={COLORS.clayText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hộp thư đến</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.clayAccent2} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialIcons name="notifications-none" size={64} color="rgba(93,64,55,0.3)" />
                            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(93,64,55,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    listContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    unreadCard: {
        backgroundColor: '#FFF',
        borderColor: 'rgba(210, 150, 100, 0.4)',
        shadowColor: '#D29664',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.clayText,
        flex: 1,
    },
    unreadText: {
        fontWeight: 'bold',
        color: '#000',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginLeft: 8,
    },
    message: {
        fontSize: 13,
        color: 'rgba(93,64,55,0.7)',
        marginBottom: 6,
        lineHeight: 18,
    },
    time: {
        fontSize: 11,
        color: 'rgba(93,64,55,0.4)',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        color: 'rgba(93,64,55,0.5)',
        fontWeight: '500',
    }
});
