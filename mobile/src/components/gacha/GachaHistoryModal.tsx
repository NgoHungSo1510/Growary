import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { GachaItemRarity } from '@shared';
import { RARITY_THEMES } from './ReelCard';

interface HistoryItem {
    _id: string;
    itemDetails?: {
        name: string;
        rarity: GachaItemRarity;
        type: string;
        value?: number;
    };
    scoreGained?: number;
    createdAt: string;
}

interface GachaHistoryModalProps {
    visible: boolean;
    loading: boolean;
    history: HistoryItem[];
    onClose: () => void;
    onFilterChange?: (rarity?: GachaItemRarity) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}

const FILTER_CHIPS: { label: string; value?: GachaItemRarity }[] = [
    { label: 'Tất cả', value: undefined },
    { label: 'Huyền thoại', value: 'legend' },
    { label: 'Sử thi', value: 'epic' },
    { label: 'Hiếm', value: 'rare' },
    { label: 'Thường', value: 'normal' },
];

export default function GachaHistoryModal({
    visible,
    loading,
    history,
    onClose,
    onFilterChange,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
}: GachaHistoryModalProps) {
    const [activeFilter, setActiveFilter] = useState<GachaItemRarity | undefined>(undefined);

    const handleChipPress = (rarity?: GachaItemRarity) => {
        setActiveFilter(rarity);
        if (onFilterChange) {
            onFilterChange(rarity);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Lịch Sử Quay Thưởng</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Chips Bar */}
                    <View style={styles.filterBar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {FILTER_CHIPS.map((chip) => {
                                const isSelected = activeFilter === chip.value;
                                return (
                                    <TouchableOpacity
                                        key={chip.label}
                                        style={[styles.chip, isSelected && styles.activeChip]}
                                        onPress={() => handleChipPress(chip.value)}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                                            {chip.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* History List */}
                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={COLORS.clayAccent2}
                            style={{ marginVertical: 32 }}
                        />
                    ) : (
                        <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                            {history.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    Chưa có lượt quay nào phù hợp
                                </Text>
                            ) : (
                                history.map((h) => {
                                    const rarity = h.itemDetails?.rarity || 'normal';
                                    const theme = RARITY_THEMES[rarity] || RARITY_THEMES.normal;
                                    return (
                                        <View key={h._id} style={styles.historyItem}>
                                            <View style={styles.itemLeft}>
                                                <Text style={styles.hItemName}>
                                                    {h.itemDetails?.name || 'Phần thưởng'}
                                                </Text>
                                                <Text style={styles.hItemSub}>
                                                    {new Date(h.createdAt).toLocaleString('vi-VN', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short',
                                                    })}
                                                </Text>
                                            </View>

                                            <View style={styles.itemRight}>
                                                <View
                                                    style={[
                                                        styles.rarityBadge,
                                                        { backgroundColor: theme.border },
                                                    ]}
                                                >
                                                    <Text style={styles.rarityText}>
                                                        {theme.label}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })
                            )}

                            {hasMore && onLoadMore && (
                                <TouchableOpacity
                                    style={styles.loadMoreButton}
                                    onPress={onLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <ActivityIndicator size="small" color={COLORS.clayText} />
                                    ) : (
                                        <Text style={styles.loadMoreText}>Tải thêm lịch sử</Text>
                                    )}
                                </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFDF5',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 28,
        maxHeight: '75%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(253, 195, 161, 0.3)',
        paddingBottom: 14,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.clayText,
    },
    filterBar: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(253, 195, 161, 0.2)',
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F8E8B4',
        marginRight: 8,
    },
    activeChip: {
        backgroundColor: '#FFD54F',
        borderWidth: 1.5,
        borderColor: '#FFA726',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(93, 64, 55, 0.7)',
    },
    activeChipText: {
        color: '#3E2723',
        fontWeight: '800',
    },
    scrollList: {
        marginTop: 6,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(253, 195, 161, 0.25)',
    },
    itemLeft: {
        flex: 1,
        marginRight: 12,
    },
    hItemName: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.clayText,
        marginBottom: 2,
    },
    hItemSub: {
        fontSize: 11,
        color: 'rgba(93, 64, 55, 0.55)',
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    rarityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    rarityText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    emptyText: {
        textAlign: 'center',
        marginVertical: 28,
        color: 'rgba(93, 64, 55, 0.6)',
        fontSize: 13,
    },
    loadMoreButton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 10,
        borderRadius: 14,
        backgroundColor: '#F8E8B4',
    },
    loadMoreText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.clayText,
    },
});
