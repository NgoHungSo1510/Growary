import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Voucher } from '../../types';
import { COLORS } from '../../theme';

interface VoucherRedeemModalProps {
    visible: boolean;
    voucher: Voucher | null;
    purchasedTitle: string;
    isRedeeming: boolean;
    onUseNow: () => void;
    onUseLater: () => void;
}

export const VoucherRedeemModal: React.FC<VoucherRedeemModalProps> = ({
    visible,
    voucher,
    purchasedTitle,
    isRedeeming,
    onUseNow,
    onUseLater,
}) => {
    if (!voucher) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.postPurchaseModal}>
                    <Text style={styles.emojiIcon}>{voucher?.rewardTitleSnapshot ? '🎟️' : '🎉'}</Text>
                    <Text style={styles.ppTitle}>{purchasedTitle ? 'Đổi thành công!' : 'Dùng Voucher'}</Text>
                    <Text style={styles.ppSubtitle}>
                        {purchasedTitle
                            ? `"${purchasedTitle}" đã vào kho của bạn.`
                            : `Bạn có muốn dùng "${voucher?.rewardTitleSnapshot}" ngay không?`}
                    </Text>

                    <View style={styles.ppActions}>
                        <TouchableOpacity style={styles.ppUseLaterBtn} onPress={onUseLater}>
                            <MaterialIcons name="inventory-2" size={18} color={COLORS.clayText} />
                            <Text style={styles.ppUseLaterText}>Để sau</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.ppUseNowBtn, isRedeeming && { opacity: 0.7 }]}
                            disabled={isRedeeming}
                            onPress={onUseNow}
                        >
                            <LinearGradient
                                colors={[COLORS.clayAccent2, '#EC4899']}
                                style={styles.ppUseNowGradient}
                            >
                                {isRedeeming ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <MaterialIcons name="play-arrow" size={18} color="#FFF" />
                                        <Text style={styles.ppUseNowText}>Dùng ngay</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

interface ProcessingModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({ visible, onClose }) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.postPurchaseModal, { alignItems: 'center' }]}>
                    <Text style={styles.emojiIcon}>⏳</Text>
                    <Text style={styles.ppTitle}>Đang xử lý</Text>
                    <Text style={[styles.ppSubtitle, { textAlign: 'center', marginBottom: 20 }]}>
                        Yêu cầu sử dụng phần thưởng của bạn đã được gửi. Vui lòng chờ Admin duyệt và trao quà nhé!
                    </Text>
                    <TouchableOpacity
                        style={[styles.ppUseNowBtn, { width: '100%', borderRadius: 16 }]}
                        onPress={onClose}
                    >
                        <LinearGradient
                            colors={[COLORS.clayAccent2, '#EC4899']}
                            style={[styles.ppUseNowGradient, { paddingVertical: 14 }]}
                        >
                            <Text style={styles.ppUseNowText}>Đã hiểu</Text>
                        </LinearGradient>
                    </TouchableOpacity>
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
        padding: 24,
    },
    postPurchaseModal: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    emojiIcon: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 8,
    },
    ppTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 8,
    },
    ppSubtitle: {
        fontSize: 13,
        color: 'rgba(93,64,55,0.7)',
        textAlign: 'center',
        marginBottom: 20,
    },
    ppActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    ppUseLaterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(93,64,55,0.08)',
    },
    ppUseLaterText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    ppUseNowBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    ppUseNowGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    ppUseNowText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
