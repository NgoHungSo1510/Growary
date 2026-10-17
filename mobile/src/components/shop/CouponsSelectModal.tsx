import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export interface CouponItem {
    type: string;
    discount: number;
    label: string;
}

interface CouponsSelectModalProps {
    visible: boolean;
    title: string;
    type: 'discount' | 'freeship';
    coupons: CouponItem[];
    selectedCoupon: CouponItem | null;
    onSelect: (coupon: CouponItem | null) => void;
    onClose: () => void;
}

export const CouponsSelectModal: React.FC<CouponsSelectModalProps> = ({
    visible,
    title,
    type,
    coupons,
    selectedCoupon,
    onSelect,
    onClose,
}) => {
    const isDiscount = type === 'discount';
    const activeColor = isDiscount ? '#2563EB' : '#16A34A';
    const iconName = isDiscount ? 'local-offer' : 'local-shipping';

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialIcons name={iconName} size={20} color={activeColor} />
                            <Text style={styles.title}>{title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={20} color="rgba(93,64,55,0.5)" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 300 }}>
                        <TouchableOpacity
                            style={[
                                styles.couponOption,
                                !selectedCoupon && { borderColor: activeColor, backgroundColor: `${activeColor}10` },
                            ]}
                            onPress={() => {
                                onSelect(null);
                                onClose();
                            }}
                        >
                            <Text style={[styles.couponLabel, !selectedCoupon && { color: activeColor, fontWeight: 'bold' }]}>
                                Không sử dụng mã
                            </Text>
                            {!selectedCoupon && <MaterialIcons name="check" size={20} color={activeColor} />}
                        </TouchableOpacity>

                        {coupons.map((c, i) => {
                            const isSelected = selectedCoupon?.type === c.type;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.couponOption,
                                        isSelected && { borderColor: activeColor, backgroundColor: `${activeColor}10` },
                                    ]}
                                    onPress={() => {
                                        onSelect(c);
                                        onClose();
                                    }}
                                >
                                    <View>
                                        <Text style={[styles.couponLabel, isSelected && { color: activeColor, fontWeight: 'bold' }]}>
                                            {c.label}
                                        </Text>
                                        <Text style={styles.couponSub}>
                                            Giảm {c.discount.toLocaleString()} G
                                        </Text>
                                    </View>
                                    {isSelected && <MaterialIcons name="check" size={20} color={activeColor} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.warmBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    closeBtn: {
        padding: 4,
    },
    couponOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: COLORS.clayCard,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    couponLabel: {
        fontSize: 14,
        color: COLORS.clayText,
    },
    couponSub: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.6)',
        marginTop: 2,
    },
});
