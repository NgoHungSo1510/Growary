import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Entry } from './CollectionSlotGrid';

interface ViewEntryModalProps {
    visible: boolean;
    entry: Entry | null;
    currentUsername?: string;
    onClose: () => void;
}

export const ViewEntryModal: React.FC<ViewEntryModalProps> = ({
    visible,
    entry,
    currentUsername,
    onClose,
}) => {
    if (!entry) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle} numberOfLines={1}>
                            {entry.title}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#332f13" />
                        </TouchableOpacity>
                    </View>
                    {entry.imageUrl && (
                        <Image source={{ uri: entry.imageUrl }} style={styles.entryImage} />
                    )}
                    <Text style={styles.uploaderText}>
                        📸 Người tải lên: {(entry.userId as any)?.username || currentUsername || 'Bạn'}
                    </Text>
                    <Text style={styles.descText}>
                        {entry.description || 'Không có mô tả thêm.'}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

interface HistoryModalProps {
    visible: boolean;
    history: Entry[];
    onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
    visible,
    history,
    onClose,
}) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                <View style={styles.historyBox}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>📜 Lịch sử gom ảnh</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#332f13" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {history.length === 0 ? (
                            <Text style={styles.emptyHistoryText}>Bạn chưa đóng góp bức ảnh nào.</Text>
                        ) : (
                            history.map((item) => (
                                <View key={item._id} style={styles.historyCard}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.historyImg} />
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.historyMeta}>
                                            Mã Tầng: {(item as any).topicId?.title || 'Unknown'} - Ô #{item.slotIndex + 1}
                                        </Text>
                                        <Text style={styles.historyDate}>
                                            {new Date(item.createdAt || '').toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBox: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff7cf',
        borderRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#332f13',
        flex: 1,
        marginRight: 8,
    },
    entryImage: {
        width: '100%',
        height: 240,
        borderRadius: 16,
        marginBottom: 16,
        resizeMode: 'cover',
    },
    uploaderText: {
        fontSize: 13,
        color: '#9f3456',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descText: {
        fontSize: 14,
        color: '#332f13',
        lineHeight: 20,
    },
    historyBox: {
        backgroundColor: '#fff7cf',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '80%',
        width: '100%',
    },
    emptyHistoryText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#a09d84',
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#faf2c4',
        borderRadius: 16,
        marginBottom: 10,
    },
    historyImg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#332f13',
    },
    historyMeta: {
        fontSize: 12,
        color: '#9f3456',
        marginTop: 2,
    },
    historyDate: {
        fontSize: 11,
        color: '#a09d84',
        marginTop: 2,
    },
});
