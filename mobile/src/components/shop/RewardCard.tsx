import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Reward, VipStatus } from '../../types';
import { COLORS } from '../../theme';

const { width } = Dimensions.get('window');
export const FEATURED_CARD_W = width * 0.72;

export const getRewardVisual = (title: string): { icon: keyof typeof MaterialIcons.glyphMap; color: string } => {
    const t = title.toLowerCase();
    if (t.includes('energy') || t.includes('potion') || t.includes('cafe')) return { icon: 'local-cafe', color: '#A855F7' };
    if (t.includes('theme') || t.includes('palette')) return { icon: 'palette', color: '#3B82F6' };
    if (t.includes('game') || t.includes('play')) return { icon: 'sports-esports', color: '#22C55E' };
    if (t.includes('sticker') || t.includes('emoji')) return { icon: 'sentiment-satisfied', color: '#F97316' };
    if (t.includes('boost') || t.includes('crystal') || t.includes('diamond')) return { icon: 'diamond', color: '#A855F7' };
    return { icon: 'card-giftcard', color: '#A855F7' };
};

interface RewardCardProps {
    reward: Reward;
    vipStatus: VipStatus | null;
    onPress: (reward: Reward) => void;
    variant?: 'featured' | 'grid';
}

export const RewardCard: React.FC<RewardCardProps> = ({
    reward,
    vipStatus,
    onPress,
    variant = 'grid',
}) => {
    const { icon, color } = getRewardVisual(reward.title);

    const getDiscountedPrice = (price?: number) => {
        if (price === undefined || price === null) return 0;
        const discountPercent = vipStatus?.currentTier?.discountPercent || 0;
        if (discountPercent <= 0) return price;
        return Math.floor(price * (1 - discountPercent / 100));
    };

    if (variant === 'featured') {
        return (
            <TouchableOpacity
                style={styles.featuredSlide}
                activeOpacity={0.9}
                onPress={() => onPress(reward)}
            >
                <View style={styles.rareBadge}>
                    <Text style={styles.rareText}>RARE</Text>
                </View>

                <LinearGradient
                    colors={['rgba(255,255,255,0.4)', 'transparent']}
                    style={styles.featuredImageArea}
                >
                    {reward.imageUrl ? (
                        <Image source={{ uri: reward.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                        <MaterialIcons name={icon} size={64} color={color} style={{ opacity: 0.9 }} />
                    )}
                </LinearGradient>

                <View style={styles.featuredInfo}>
                    <Text style={styles.featuredTitle} numberOfLines={1}>{reward.title}</Text>
                    <Text style={styles.featuredSubtitle} numberOfLines={1}>
                        {reward.description || 'Special reward'}
                    </Text>
                    <View style={styles.featuredPriceRow}>
                        <View style={styles.priceTagYellow}>
                            <MaterialIcons name="monetization-on" size={12} color="#713F12" />
                            <Text style={styles.priceTextYellow}>{getDiscountedPrice(reward.pointCost)}</Text>
                        </View>
                        {vipStatus?.currentTier?.discountPercent ? (
                            <Text style={{ fontSize: 10, textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.5)' }}>
                                {reward.pointCost}
                            </Text>
                        ) : null}
                        {reward.stock !== undefined && reward.stock !== null && (
                            <Text style={styles.stockText}>Còn {reward.stock}</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.85}
            onPress={() => onPress(reward)}
        >
            <View style={styles.iconInsetBox}>
                {reward.imageUrl ? (
                    <Image source={{ uri: reward.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' }} />
                ) : (
                    <MaterialIcons name={icon} size={40} color={color} style={{ opacity: 0.9 }} />
                )}
                <View style={styles.miniPriceBadge}>
                    <MaterialIcons name="monetization-on" size={10} color="#713F12" />
                    <Text style={styles.miniPriceText}>{getDiscountedPrice(reward.pointCost)}</Text>
                </View>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{reward.title}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {reward.description || 'Reward'}
                </Text>
            </View>
            <View style={styles.smallRedeemBtn}>
                <Text style={styles.smallRedeemText}>Đổi</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    featuredSlide: {
        width: FEATURED_CARD_W,
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: COLORS.clayCard,
        shadowColor: '#5D4037',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    rareBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        backgroundColor: '#FEF08A',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    rareText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#713F12',
    },
    featuredImageArea: {
        width: '100%',
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    featuredInfo: {
        padding: 12,
    },
    featuredTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    featuredSubtitle: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.6)',
        marginTop: 2,
    },
    featuredPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    priceTagYellow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FEF08A',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    priceTextYellow: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#713F12',
    },
    stockText: {
        fontSize: 11,
        color: 'rgba(93,64,55,0.5)',
        marginLeft: 'auto',
    },
    gridItem: {
        width: (width - 48 - 12) / 2,
        backgroundColor: COLORS.clayCard,
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#5D4037',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    iconInsetBox: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 8,
    },
    miniPriceBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#FEF08A',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    miniPriceText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#713F12',
    },
    itemInfo: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.clayText,
        textAlign: 'center',
    },
    itemSubtitle: {
        fontSize: 11,
        color: 'rgba(93,64,55,0.5)',
        marginTop: 2,
        textAlign: 'center',
    },
    smallRedeemBtn: {
        backgroundColor: COLORS.clayAccent1,
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 10,
    },
    smallRedeemText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
