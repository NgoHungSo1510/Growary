import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { GrantedRewards } from '../types';

interface RewardCelebrationModalProps {
    visible: boolean;
    rewards: GrantedRewards | null;
    onClose: () => void;
}

export default function RewardCelebrationModal({ visible, rewards, onClose }: RewardCelebrationModalProps) {
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && rewards) {
            scaleAnim.setValue(0.5);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    tension: 60,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [visible, rewards]);

    const handleClose = () => {
        Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true
        }).start(() => {
            onClose();
        });
    };

    if (!visible || !rewards) return null;

    const hasRewards = (rewards.coins || 0) > 0 || (rewards.gachaTickets || 0) > 0 || (rewards.xp || 0) > 0 || (rewards.items?.length || 0) > 0;
    if (!hasRewards && (rewards.levelUps?.length || 0) === 0 && !(rewards as any).isTierUnlock) return null;

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

                        {rewards.levelUps?.length > 0 ? (
                            <>
                                <Text style={styles.title}>THĂNG CẤP!</Text>
                                <Text style={styles.subtitle}>Cấp độ mới: {rewards.levelUps.join(', ')}</Text>
                            </>
                        ) : (rewards as any).isTierUnlock ? (
                            <>
                                <Text style={styles.title}>VƯỢT THÁP!</Text>
                                <Text style={styles.subtitle}>{(rewards as any).message}</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>CHÚC MỪNG!</Text>
                                <Text style={styles.subtitle}>{(rewards as any).message || 'Bạn nhận được phần thưởng'}</Text>
                            </>
                        )}

                        <ScrollView style={styles.rewardsList} contentContainerStyle={{ gap: 12 }}>
                            {rewards.coins > 0 && (
                                <View style={styles.rewardItem}>
                                    <View style={[styles.rewardIconBg, { backgroundColor: '#FEF3C7' }]}>
                                        <FontAwesome5 name="coins" size={20} color="#F59E0B" />
                                    </View>
                                    <Text style={styles.rewardText}>+{rewards.coins} Coins</Text>
                                </View>
                            )}

                            {(rewards as any).xp > 0 && (
                                <View style={styles.rewardItem}>
                                    <View style={[styles.rewardIconBg, { backgroundColor: '#E0F2FE' }]}>
                                        <MaterialIcons name="star" size={24} color="#0284C7" />
                                    </View>
                                    <Text style={styles.rewardText}>+{(rewards as any).xp} XP</Text>
                                </View>
                            )}

                            {rewards.gachaTickets > 0 && (
                                <View style={styles.rewardItem}>
                                    <View style={[styles.rewardIconBg, { backgroundColor: '#FCE7F3' }]}>
                                        <MaterialIcons name="local-activity" size={24} color="#EC4899" />
                                    </View>
                                    <Text style={styles.rewardText}>+{rewards.gachaTickets} Vé Gacha</Text>
                                </View>
                            )}

                            {rewards.items?.map((item, idx) => (
                                <View key={idx} style={styles.rewardItem}>
                                    <View style={[styles.rewardIconBg, { backgroundColor: '#E0E7FF' }]}>
                                        <MaterialIcons name="card-giftcard" size={24} color="#6366F1" />
                                    </View>
                                    <Text style={styles.rewardText} numberOfLines={2}>Tặng: {item}</Text>
                                </View>
                            ))}

                            {rewards.items?.length > 0 && (
                                <Text style={{ fontSize: 11, color: '#B45309', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
                                    (Vật phẩm đã được gửi vào kho Quà của bạn)
                                </Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity style={styles.btn} onPress={handleClose}>
                            <Text style={styles.btnText}>NHẬN THƯỞNG</Text>
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
        fontSize: 15,
        color: '#B45309',
        fontWeight: '600',
        marginBottom: 24,
        textAlign: 'center'
    },
    rewardsList: {
        width: '100%',
        maxHeight: 200,
        marginBottom: 24,
        paddingHorizontal: 8
    },
    rewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 12,
        borderRadius: 16,
        gap: 12
    },
    rewardIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rewardText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400E',
        flex: 1
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
