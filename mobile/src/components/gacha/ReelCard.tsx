import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GachaItem, GachaItemRarity } from '@shared';

export const ITEM_WIDTH = 104;
export const ITEM_GAP = 8;
export const ITEM_STRIDE = ITEM_WIDTH + ITEM_GAP;

export const RARITY_THEMES: Record<
    GachaItemRarity,
    { border: string; bg: [string, string]; text: string; label: string }
> = {
    normal: {
        border: '#4CAF50',
        bg: ['#1C2A1E', '#141E16'],
        text: '#81C784',
        label: 'Thường',
    },
    rare: {
        border: '#2196F3',
        bg: ['#14253B', '#0D1929'],
        text: '#64B5F6',
        label: 'Hiếm',
    },
    epic: {
        border: '#9C27B0',
        bg: ['#2A173B', '#1B0E27'],
        text: '#BA68C8',
        label: 'Sử Thi',
    },
    legend: {
        border: '#FFD700',
        bg: ['#3E2E10', '#251A08'],
        text: '#FFE082',
        label: 'Huyền Thoại',
    },
};

export const ReelCard: React.FC<{ item: GachaItem }> = React.memo(({ item }) => {
    const rarity = (item.rarity as GachaItemRarity) || 'normal';
    const theme = RARITY_THEMES[rarity] || RARITY_THEMES.normal;

    const renderIcon = () => {
        const itemType = (item.type as string) || '';
        switch (itemType) {
            case 'coins':
                return <MaterialIcons name="monetization-on" size={30} color="#FFD700" />;
            case 'exp':
            case 'xp':
                return <MaterialIcons name="star" size={30} color="#FFA726" />;
            case 'ticket':
            case 'tickets':
                return <MaterialCommunityIcons name="ticket-percent" size={30} color="#42A5F5" />;
            case 'voucher':
                return <MaterialCommunityIcons name="gift-outline" size={30} color="#AB47BC" />;
            default:
                return <MaterialCommunityIcons name="diamond-stone" size={30} color="#26A69A" />;
        }
    };

    return (
        <View style={[styles.card, { borderColor: theme.border }]}>
            <LinearGradient colors={theme.bg} style={styles.cardGradient}>
                <View style={[styles.rarityBadge, { backgroundColor: theme.border }]}>
                    <Text style={styles.rarityText}>{theme.label}</Text>
                </View>

                <View style={styles.iconContainer}>{renderIcon()}</View>

                <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                </Text>

                {item.rewardAmount ? (
                    <Text style={[styles.itemAmount, { color: theme.text }]}>
                        +{item.rewardAmount}
                    </Text>
                ) : null}
            </LinearGradient>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        width: ITEM_WIDTH,
        height: 130,
        marginRight: ITEM_GAP,
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    rarityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'center',
    },
    rarityText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    iconContainer: {
        marginVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    itemAmount: {
        fontSize: 11,
        fontWeight: '800',
    },
});

export default ReelCard;
