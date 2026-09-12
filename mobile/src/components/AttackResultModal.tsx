import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface AttackResultModalProps {
    visible: boolean;
    damage: number;
    refundPoints: number;
    isCritical: boolean;
    onClose: () => void;
}

export default function AttackResultModal({ visible, damage, refundPoints, isCritical, onClose }: AttackResultModalProps) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const numberAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0);
            numberAnim.setValue(0);
            fadeAnim.setValue(0);

            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(numberAnim, {
                    toValue: damage,
                    duration: 1000,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false, // Cannot animate text value natively easily, so false
                })
            ]).start();
        }
    }, [visible, damage]);

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={isCritical ? ['#f59e0b', '#d97706'] : ['#3b82f6', '#2563eb']}
                        style={styles.content}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons 
                                name={isCritical ? "local-fire-department" : "flash-on"} 
                                size={56} 
                                color={isCritical ? "#f59e0b" : "#3b82f6"} 
                                style={styles.icon} 
                            />
                        </View>
                        
                        <Text style={styles.titleText}>
                            {isCritical ? "CHIẾN THẮNG!" : "THẤT BẠI"}
                        </Text>
                        
                        {isCritical ? (
                            <Text style={styles.multiplierText}>+50% SÁT THƯƠNG</Text>
                        ) : (
                            <Text style={styles.multiplierText}>-25% SÁT THƯƠNG</Text>
                        )}

                        <View style={styles.damageBox}>
                            <Text style={styles.damageLabel}>Sát thương gây ra</Text>
                            <Text style={styles.damageValue}>{damage.toLocaleString()}</Text>
                        </View>

                        {refundPoints > 0 && (
                            <View style={styles.refundBox}>
                                <MaterialIcons name="assignment-return" size={20} color="#10b981" />
                                <Text style={styles.refundText}>
                                    Hoàn trả {refundPoints} Điểm Công (Overkill)
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                            <Text style={styles.closeBtnText}>TUYỆT VỜI</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
        overflow: 'hidden',
    },
    content: {
        padding: 32,
        alignItems: 'center',
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10, // Giúp icon nổi bần bật lên dạng flex
    },
    icon: {
        // Remove text shadows because it's now inside a white circle
    },
    titleText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        textAlign: 'center',
    },
    multiplierText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fef3c7',
        marginTop: 4,
        marginBottom: 20,
    },
    damageBox: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 20,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        marginVertical: 20,
    },
    damageLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    damageValue: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFF',
        marginTop: 8,
    },
    refundBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        marginBottom: 24,
        gap: 8,
    },
    refundText: {
        color: '#34d399',
        fontWeight: 'bold',
        fontSize: 14,
    },
    closeBtn: {
        backgroundColor: '#FFF',
        width: '100%',
        height: 52, // Mobile UX > 48dp
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
});
