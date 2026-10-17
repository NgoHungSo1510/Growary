import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Voucher } from '@shared';
import { COLORS } from '../../theme';

interface InventoryVoucherListProps {
    list: Voucher[];
    emptyMsg: string;
}

export const InventoryVoucherList: React.FC<InventoryVoucherListProps> = ({
    list,
    emptyMsg,
}) => {
    if (list.length === 0) {
        return (
            <View style={styles.emptyState}>
                <MaterialIcons name="local-shipping" size={36} color="rgba(93,64,55,0.18)" />
                <Text style={styles.emptyText}>{emptyMsg}</Text>
            </View>
        );
    }

    return (
        <View style={{ gap: 12 }}>
            {list.map((v) => {
                const isPending = v.status === 'pending_use';
                const statusColor = isPending ? '#F59E0B' : '#10B981';
                const statusLabel = isPending ? 'Đang chuẩn bị' : 'Hoàn tất';
                const title = v.reward?.title || v.rewardTitleSnapshot || 'Phần quà';

                return (
                    <View key={v.code} style={styles.voucherCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.voucherTitle} numberOfLines={1}>
                                {title}
                            </Text>
                            <Text style={styles.voucherCode}>{v.code}</Text>
                            <Text style={styles.voucherDate}>
                                Từ: {new Date(v.createdAt || v.purchaseDate).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.voucherStatusBox}>
                            <MaterialIcons
                                name={isPending ? 'access-time' : 'check-circle'}
                                size={15}
                                color={statusColor}
                                style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {statusLabel}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        color: 'rgba(93,64,55,0.6)',
        textAlign: 'center',
    },
    voucherCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(253, 195, 161, 0.4)',
        shadowColor: '#D29664',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    voucherTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 3,
    },
    voucherCode: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: 'monospace',
        marginBottom: 2,
    },
    voucherDate: {
        fontSize: 10,
        color: '#94A3B8',
    },
    voucherStatusBox: {
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 11,
    },
});

export default InventoryVoucherList;
