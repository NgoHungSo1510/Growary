import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { VipStatusResponse } from '../../types';

interface VipDetailSectionProps {
    vipResponse: VipStatusResponse;
}

export const VipDetailSection: React.FC<VipDetailSectionProps> = ({ vipResponse }) => {
    const [showVipTiers, setShowVipTiers] = useState(false);

    return (
        <View style={styles.vipDetailContainer}>
            <Text style={styles.sectionHeading}>Quyền lợi hiện tại:</Text>
            <View style={styles.benefitsBox}>
                <Text style={styles.benefitRow}>
                    • Cashback <Text style={styles.highlightText}>{vipResponse.status.currentTier.cashbackPercent}%</Text> / tháng
                </Text>
                <Text style={styles.benefitRow}>
                    • Chiết khấu <Text style={styles.highlightText}>{vipResponse.status.currentTier.discountPercent}%</Text> mỗi lần mua
                </Text>
                <Text style={styles.benefitRow}>
                    • Tháng này đang tích: <Text style={styles.highlightText}>{vipResponse.status.pendingCashback.toLocaleString()} coins</Text>
                </Text>
            </View>

            <TouchableOpacity
                style={styles.collapseHeader}
                onPress={() => setShowVipTiers(!showVipTiers)}
                activeOpacity={0.7}
            >
                <Text style={styles.sectionHeading}>BẢNG 12 CẤP VIP</Text>
                <MaterialIcons name={showVipTiers ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={COLORS.clayText} />
            </TouchableOpacity>

            {showVipTiers && (
                <View style={styles.tiersList}>
                    {vipResponse.allTiers.map((tier) => {
                        const isCurrent = tier.tier === vipResponse.status.currentTier.tier;
                        const isReached = tier.tier < vipResponse.status.currentTier.tier;
                        return (
                            <View key={tier.tier} style={[styles.tierRow, isCurrent && styles.tierRowCurrent]}>
                                <Text style={[styles.tierCol1, { color: tier.color, fontWeight: isCurrent ? 'bold' : 'normal' }]}>
                                    Tier {tier.tier}
                                </Text>
                                <Text style={[styles.tierCol2, { color: tier.color, fontWeight: isCurrent ? 'bold' : 'normal' }]}>
                                    {tier.name}
                                </Text>
                                <Text style={[styles.tierCol3, { color: 'rgba(93, 64, 55, 0.5)' }]}>
                                    {tier.minSpending.toLocaleString()}
                                </Text>
                                {isCurrent && <Text style={styles.tierTagCurrent}>← BẠN ĐÂY</Text>}
                                {isReached && <Text style={styles.tierTagReached}>(Đã đạt)</Text>}
                            </View>
                        );
                    })}
                </View>
            )}

            {vipResponse.history && vipResponse.history.length > 0 && (
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionHeading}>LỊCH SỬ LÊN HẠNG</Text>
                    {vipResponse.history.map((h, i) => (
                        <Text key={i} style={styles.historyRow}>
                            • {h.tierName} — {new Date(h.date).toLocaleDateString('vi-VN')}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    vipDetailContainer: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 20,
        padding: 16,
        marginTop: 12,
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 8,
    },
    benefitsBox: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 12,
        borderRadius: 14,
        marginBottom: 12,
    },
    benefitRow: {
        fontSize: 12,
        color: COLORS.clayText,
        marginBottom: 4,
    },
    highlightText: {
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
    },
    collapseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    tiersList: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(93,64,55,0.1)',
        paddingTop: 8,
    },
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    tierRowCurrent: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 8,
        paddingHorizontal: 4,
    },
    tierCol1: {
        width: 55,
        fontSize: 11,
    },
    tierCol2: {
        flex: 1,
        fontSize: 12,
    },
    tierCol3: {
        fontSize: 11,
    },
    tierTagCurrent: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
        marginLeft: 6,
    },
    tierTagReached: {
        fontSize: 10,
        color: 'rgba(93,64,55,0.4)',
        marginLeft: 6,
    },
    historyContainer: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(93,64,55,0.1)',
        paddingTop: 8,
    },
    historyRow: {
        fontSize: 11,
        color: 'rgba(93,64,55,0.6)',
        marginBottom: 2,
    },
});
