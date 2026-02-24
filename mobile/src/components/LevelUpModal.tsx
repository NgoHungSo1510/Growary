import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';

interface LevelUpModalProps {
    visible: boolean;
    level: number;
    onClose: () => void;
}

export default function LevelUpModal({ visible, level, onClose }: LevelUpModalProps) {
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0.5);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 50,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                })
            ]).start();

            // Auto close after 5 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
        }).start(() => {
            onClose();
        });
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#FEF3C7', '#FDE68A', '#F59E0B']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialIcons name="auto-awesome" size={48} color="#D97706" style={styles.icon} />
                        <Text style={styles.title}>CHÚC MỪNG!</Text>
                        <Text style={styles.subtitle}>Bạn đã thăng cấp</Text>

                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>{level}</Text>
                        </View>

                        <TouchableOpacity style={styles.btn} onPress={handleClose}>
                            <Text style={styles.btnText}>TUYỆT VỜI!</Text>
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10
    },
    gradient: {
        padding: 32,
        alignItems: 'center',
    },
    icon: {
        marginBottom: 8
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#92400E',
        marginBottom: 4,
        letterSpacing: 1
    },
    subtitle: {
        fontSize: 16,
        color: '#B45309',
        fontWeight: '600',
        marginBottom: 24
    },
    levelBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF',
        borderWidth: 6,
        borderColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5
    },
    levelText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#D97706'
    },
    btn: {
        backgroundColor: '#92400E',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 100,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    btnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5
    }
});
