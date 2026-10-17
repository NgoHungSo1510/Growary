import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ShopEvent } from '@shared';

interface SaleEventModalProps {
    visible: boolean;
    event: ShopEvent | null;
    onClose: () => void;
}

export const SaleEventModal: React.FC<SaleEventModalProps> = ({
    visible,
    event,
    onClose,
}) => {
    if (!event) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.cardContainer}>
                    <LinearGradient
                        colors={['#1E1B4B', '#2E1065', '#0F172A']}
                        style={styles.cardGradient}
                    >
                        {/* Close button */}
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons name="close" size={22} color="rgba(255, 255, 255, 0.6)" />
                        </TouchableOpacity>

                        {/* Mysterious Merchant Icon */}
                        <View style={styles.iconCircle}>
                            <LinearGradient
                                colors={['#A855F7', '#6366F1']}
                                style={styles.iconInner}
                            >
                                <MaterialCommunityIcons
                                    name="wizard-hat"
                                    size={42}
                                    color="#FFD700"
                                />
                            </LinearGradient>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>{event.title}</Text>

                        {/* Discount Banner */}
                        <View style={styles.discountBadge}>
                            <MaterialIcons name="bolt" size={20} color="#FFD700" />
                            <Text style={styles.discountText}>
                                GIẢM GIÁ {event.discountPercent}% TOÀN BỘ
                            </Text>
                            <MaterialIcons name="bolt" size={20} color="#FFD700" />
                        </View>

                        {/* Merchant Message Quote */}
                        <View style={styles.quoteBox}>
                            <Text style={styles.quoteText}>
                                "{event.description || 'Hàng hóa hiếm từ chiều không gian khác vừa cập bến. Đừng bỏ lỡ cơ hội chỉ có trong ngày!'}"
                            </Text>
                        </View>

                        {/* Action CTA */}
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={onClose}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                style={styles.ctaGradient}
                            >
                                <Text style={styles.ctaText}>KHÁM PHÁ NGAY</Text>
                                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    cardGradient: {
        padding: 24,
        alignItems: 'center',
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 5,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 3,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        marginBottom: 16,
        marginTop: 8,
    },
    iconInner: {
        flex: 1,
        borderRadius: 37,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    discountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.25)',
        borderWidth: 1.5,
        borderColor: '#EF4444',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    discountText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#FCA5A5',
        marginHorizontal: 4,
        letterSpacing: 0.5,
    },
    quoteBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    quoteText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: '#E2E8F0',
        lineHeight: 18,
        textAlign: 'center',
    },
    ctaButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    ctaText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        marginRight: 6,
        letterSpacing: 0.8,
    },
});

export default SaleEventModal;
