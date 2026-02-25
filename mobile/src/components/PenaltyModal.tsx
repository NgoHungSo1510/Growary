import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import { apiService } from '../services/api';

interface PenaltyModalProps {
    visible: boolean;
    penalties: {
        questTitle?: string;
        penaltyAmount: number;
        reason: 'missed' | 'late';
        createdAt: string;
    }[];
    onClose: () => void;
}

export default function PenaltyModal({ visible, penalties, onClose }: PenaltyModalProps) {
    const [isClearing, setIsClearing] = useState(false);

    const handleAcknowledge = async () => {
        setIsClearing(true);
        try {
            await apiService.clearPendingPenalties();
        } catch (error) {
            console.error('Failed to clear penalties:', error);
        } finally {
            setIsClearing(false);
            onClose();
        }
    };

    if (!penalties || penalties.length === 0) return null;

    const totalDeducted = penalties.reduce((sum, p) => sum + p.penaltyAmount, 0);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={handleAcknowledge}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.headerIcon}>⚠️</Text>
                        <Text style={styles.title}>Cảnh báo Kỷ luật</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        Bạn có {penalties.length} vi phạm chưa xử lý.
                    </Text>

                    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                        {penalties.map((penalty, index) => (
                            <View key={index} style={styles.penaltyItem}>
                                <View style={styles.penaltyLeft}>
                                    <Text style={styles.penaltyReason}>
                                        {penalty.reason === 'missed' ? 'Bỏ lỡ: ' : 'Trễ hạn: '}
                                    </Text>
                                    <Text style={styles.penaltyTitle} numberOfLines={1}>
                                        {penalty.questTitle || 'Nhiệm vụ'}
                                    </Text>
                                </View>
                                <Text style={styles.penaltyAmount}>
                                    -{penalty.penaltyAmount} 🪙
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryLabel}>Tổng Coin bị trừ:</Text>
                        <Text style={styles.summaryValue}>-{totalDeducted}</Text>
                    </View>

                    <Text style={styles.hintText}>
                        Hãy cố gắng hoàn thành nhiệm vụ đúng hạn để không bị trừ thưởng nhé!
                    </Text>

                    <TouchableOpacity
                        style={styles.ackButton}
                        onPress={handleAcknowledge}
                        disabled={isClearing}
                    >
                        <Text style={styles.ackButtonText}>
                            {isClearing ? 'Đang xử lý...' : 'Đã hiểu'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: COLORS.warmBg,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 8,
    },
    headerIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ef4444', // Red for warning
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.clayText,
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 20,
    },
    list: {
        width: '100%',
        maxHeight: 200,
        marginBottom: 20,
    },
    penaltyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.1)',
    },
    penaltyLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    penaltyReason: {
        fontSize: 13,
        color: '#ef4444',
        fontWeight: '600',
    },
    penaltyTitle: {
        fontSize: 14,
        color: COLORS.clayText,
        flex: 1,
    },
    penaltyAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    summaryContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 16,
        color: COLORS.clayText,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    hintText: {
        fontSize: 12,
        color: COLORS.clayText,
        opacity: 0.6,
        textAlign: 'center',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    ackButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        width: '100%',
        borderRadius: 16,
        alignItems: 'center',
    },
    ackButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
