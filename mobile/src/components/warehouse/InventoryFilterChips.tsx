import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export type InventoryFilterType = 'all' | 'fragments' | 'boxes' | 'items';

export interface InventoryCategoryCounts {
    all: number;
    fragments: number;
    boxes: number;
    items: number;
}

interface InventoryFilterChipsProps {
    activeFilter: InventoryFilterType;
    counts: InventoryCategoryCounts;
    onSelectFilter: (filter: InventoryFilterType) => void;
    style?: StyleProp<ViewStyle>;
}

const CHIPS_CONFIG: Array<{
    id: InventoryFilterType;
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    countKey: keyof InventoryCategoryCounts;
}> = [
    { id: 'all', label: 'Tất cả', icon: 'view-grid', countKey: 'all' },
    { id: 'fragments', label: 'Mảnh ghép', icon: 'puzzle', countKey: 'fragments' },
    { id: 'boxes', label: 'Rương thưởng', icon: 'treasure-chest', countKey: 'boxes' },
    { id: 'items', label: 'Vật phẩm & Quà', icon: 'gift', countKey: 'items' },
];

export const InventoryFilterChips: React.FC<InventoryFilterChipsProps> = ({
    activeFilter,
    counts,
    onSelectFilter,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {CHIPS_CONFIG.map((chip) => {
                    const isActive = activeFilter === chip.id;
                    const count = counts[chip.countKey] || 0;

                    return (
                        <TouchableOpacity
                            key={chip.id}
                            style={[styles.chip, isActive && styles.activeChip]}
                            onPress={() => onSelectFilter(chip.id)}
                            activeOpacity={0.75}
                        >
                            <MaterialCommunityIcons
                                name={chip.icon}
                                size={15}
                                color={isActive ? '#FFFFFF' : COLORS.clayText}
                            />
                            <Text
                                style={[
                                    styles.chipLabel,
                                    isActive && styles.activeChipLabel,
                                ]}
                            >
                                {chip.label}
                            </Text>
                            {count > 0 && (
                                <View
                                    style={[
                                        styles.badge,
                                        isActive && styles.activeBadge,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.badgeText,
                                            isActive && styles.activeBadgeText,
                                        ]}
                                    >
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 8,
        alignItems: 'center',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderWidth: 1.5,
        borderColor: 'rgba(253, 195, 161, 0.6)',
        gap: 6,
        shadowColor: '#D29664',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    activeChip: {
        backgroundColor: COLORS.clayAccent2,
        borderColor: COLORS.pinkDark,
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 4,
    },
    chipLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.clayText,
    },
    activeChipLabel: {
        color: '#FFFFFF',
    },
    badge: {
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
        backgroundColor: 'rgba(245, 119, 153, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.clayAccent2,
    },
    activeBadgeText: {
        color: '#FFFFFF',
    },
});

export default InventoryFilterChips;
