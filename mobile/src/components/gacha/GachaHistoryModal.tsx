import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

interface GachaHistoryModalProps {
    visible: boolean;
    loading: boolean;
    history: any[];
    onClose: () => void;
}

const getRarityColor = (r: string) => {
    switch (r) {
        case 'rare': return '#38bdf8';
        case 'epic': return '#a855f7';
        case 'legend': return '#eab308';
        default: return '#4ade80';
    }
};

export default function GachaHistoryModal({
    visible,
    loading,
    history,
    onClose,
}: GachaHistoryModalProps) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Lịch Sử Quay</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.clayAccent2} style={{ marginTop: 20 }} />
                    ) : (
                        <ScrollView style={{ marginTop: 10 }}>
                            {history.length === 0 ? (
                                <Text style={{ textAlign: 'center', marginTop: 20, color: 'rgba(93,64,55,0.6)' }}>
                                    Chưa có lịch sử quay
                                </Text>
                            ) : (
                                history.map(h => (
                                    <View key={h._id} style={styles.historyItem}>
                                        <View>
                                            <Text style={styles.hItemName}>{h.itemDetails?.name}</Text>
                                            <Text style={styles.hItemSub}>
                                                Ngày: {new Date(h.createdAt).toLocaleString('vi-VN')}
                                            </Text>
                                        </View>
                                        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(h.itemDetails?.rarity) }]}>
                                            <Text style={styles.rarityText}>{h.itemDetails?.rarity?.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    hItemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 4,
    },
    hItemSub: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.6)',
    },
    rarityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    rarityText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
