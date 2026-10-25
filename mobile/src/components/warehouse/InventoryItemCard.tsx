import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { InventoryItem, Voucher } from '@shared';
import { COLORS } from '../../theme';

export type WrappedInventoryItem =
    | { type: 'inventory'; data: InventoryItem }
    | { type: 'voucher'; data: Voucher };

interface InventoryItemCardProps {
    item: WrappedInventoryItem;
    onOpenBox: (boxItem: InventoryItem) => void;
    onExchangeFragment: (item: InventoryItem) => void;
    onUseItem: (item: InventoryItem) => void;
    onUseVoucher: (voucher: Voucher) => void;
    loadingAction?: string | null;
    style?: StyleProp<ViewStyle>;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
    item,
    onOpenBox,
    onExchangeFragment,
    onUseItem,
    onUseVoucher,
    loadingAction,
    style,
}) => {
    if (item.type === 'inventory') {
        const inv = item.data;
        const isBox =
            inv.itemType === 'mystery_box' ||
            (typeof inv.itemType === 'string' && inv.itemType.startsWith('box_')) ||
            !!inv.boxId;
        const sp = inv.specialItem;
        const isFragment = inv.rewardForm === 'fragment';
        const reqFrag = (sp?.requiredFragments as number) || 10;
        const canExchange = isFragment && inv.quantity >= reqFrag;

        // Resolve visuals & icons
        let iconName: string = 'stars';
        let iconColor: string = '#F59E0B';
        let bgTint: string = 'rgba(245, 158, 11, 0.08)';

        if (isBox) {
            iconName = 'treasure-chest';
            iconColor = inv.color || '#A855F7';
            bgTint = `${iconColor}15`;
        } else if (sp?.type === 'coin') {
            iconName = 'monetization-on';
            iconColor = '#F59E0B';
            bgTint = 'rgba(245, 158, 11, 0.1)';
        } else if (sp?.type === 'exp') {
            iconName = 'school';
            iconColor = '#3B82F6';
            bgTint = 'rgba(59, 130, 246, 0.1)';
        } else if (sp?.type === 'gacha_ticket') {
            iconName = 'local-activity';
            iconColor = '#EF4444';
            bgTint = 'rgba(239, 68, 68, 0.1)';
        } else if (sp?.type === 'free_ship' || sp?.type === 'discount_ticket') {
            iconName = 'local-offer';
            iconColor = '#10B981';
            bgTint = 'rgba(16, 185, 129, 0.1)';
        }

        const displayName = inv.displayName || (sp?.name as string) || (isBox ? 'Rương Thưởng' : 'Vật phẩm');

        return (
            <View style={[styles.card, style]}>
                {/* Header Badge */}
                <View
                    style={[
                        styles.badge,
                        isFragment && canExchange
                            ? styles.badgeReady
                            : isFragment
                            ? styles.badgeFragment
                            : isBox
                            ? styles.badgeBox
                            : styles.badgeDefault,
                    ]}
                >
                    <Text
                        style={[
                            styles.badgeText,
                            isFragment && canExchange ? styles.badgeTextReady : undefined,
                        ]}
                    >
                        {isFragment ? `${inv.quantity}/${reqFrag}` : inv.quantity}
                    </Text>
                </View>

                {/* Icon or Image */}
                <View style={[styles.iconWrap, { backgroundColor: bgTint }]}>
                    {sp?.imageUrl ? (
                        <Image
                            source={{ uri: sp.imageUrl as string }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    ) : isBox ? (
                        <MaterialCommunityIcons
                            name="treasure-chest"
                            size={32}
                            color={iconColor}
                        />
                    ) : (
                        <MaterialIcons
                            name={iconName as any}
                            size={30}
                            color={iconColor}
                        />
                    )}
                </View>

                {/* Item Name */}
                <Text style={styles.name} numberOfLines={2}>
                    {displayName}
                </Text>

                {/* Action Area */}
                <View style={styles.actionWrap}>
                    {isBox ? (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnBox]}
                            onPress={() => onOpenBox(inv)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#A855F7', '#7C3AED']}
                                style={styles.gradientBtn}
                            >
                                <MaterialCommunityIcons
                                    name="gift-open"
                                    size={13}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.btnText}>Mở</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : isFragment && canExchange ? (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnReady]}
                            onPress={() => onExchangeFragment(inv)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.gradientBtn}
                            >
                                <MaterialIcons name="swap-horiz" size={14} color="#FFFFFF" />
                                <Text style={styles.btnText}>Đổi</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : isFragment && !canExchange ? (
                        <View style={styles.progressPill}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${Math.min(100, (inv.quantity / reqFrag) * 100)}%` },
                                ]}
                            />
                            <Text style={styles.progressText}>
                                {inv.quantity}/{reqFrag}
                            </Text>
                        </View>
                    ) : ['coin', 'exp', 'gacha_ticket'].includes(sp?.type as string) ? (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnUse]}
                            onPress={() => onUseItem(inv)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                style={styles.gradientBtn}
                            >
                                <Text style={styles.btnText}>Dùng</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.ownedPill}>
                            <Text style={styles.ownedText}>Đang có</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // Voucher Card
    const voucher = item.data;
    const isLoading = loadingAction === voucher.code;
    const rewardTitle = voucher.reward?.title || voucher.rewardTitleSnapshot || 'Phần quà';

    return (
        <View style={[styles.card, style]}>
            <View style={[styles.badge, styles.badgeDefault]}>
                <Text style={styles.badgeText}>1</Text>
            </View>

            <View style={[styles.iconWrap, { backgroundColor: 'rgba(245, 119, 153, 0.12)' }]}>
                {voucher.reward?.imageUrl ? (
                    <Image
                        source={{ uri: voucher.reward.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <FontAwesome5 name="box-open" size={26} color="#F57799" />
                )}
            </View>

            <Text style={styles.name} numberOfLines={2}>
                {rewardTitle}
            </Text>

            <View style={styles.actionWrap}>
                <TouchableOpacity
                    style={[styles.btn, styles.btnDeliver, isLoading && { opacity: 0.7 }]}
                    onPress={() => onUseVoucher(voucher)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#F57799', '#E91E63']}
                        style={styles.gradientBtn}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.btnText}>Giao Hàng</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(253, 195, 161, 0.45)',
        shadowColor: '#D29664',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: '#F59E0B',
        zIndex: 2,
    },
    badgeDefault: { backgroundColor: '#F59E0B' },
    badgeFragment: { backgroundColor: '#F97316' },
    badgeReady: { backgroundColor: '#10B981' },
    badgeBox: { backgroundColor: '#8B5CF6' },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
    badgeTextReady: { color: '#FFFFFF' },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 8,
    },
    image: { width: 36, height: 36, borderRadius: 8 },
    name: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.clayText,
        textAlign: 'center',
        minHeight: 28,
        marginBottom: 8,
    },
    actionWrap: { width: '100%', marginTop: 'auto' },
    btn: {
        borderRadius: 10,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 2,
    },
    gradientBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        gap: 3,
    },
    btnBox: { shadowColor: '#7C3AED' },
    btnReady: { shadowColor: '#059669' },
    btnUse: { shadowColor: '#D97706' },
    btnDeliver: { shadowColor: '#E91E63' },
    btnText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    progressPill: {
        width: '100%',
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
    },
    progressBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(249, 115, 22, 0.25)',
    },
    progressText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    ownedPill: {
        paddingVertical: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownedText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
    },
});

export default InventoryItemCard;
