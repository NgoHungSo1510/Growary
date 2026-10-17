import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { OpenMysteryBoxResult } from '@shared';
import { COLORS } from '../../theme';

interface MysteryBoxOpenModalProps {
    visible: boolean;
    box: {
        boxId: string;
        name: string;
        rarity?: string;
        quantity: number;
    } | null;
    onClose: () => void;
    onSuccess?: (result: OpenMysteryBoxResult) => void;
}

export const MysteryBoxOpenModal: React.FC<MysteryBoxOpenModalProps> = ({
    visible,
    box,
    onClose,
    onSuccess,
}) => {
    const [step, setStep] = useState<'idle' | 'opening' | 'revealed'>('idle');
    const [result, setResult] = useState<OpenMysteryBoxResult | null>(null);
    const [remainingQty, setRemainingQty] = useState<number>(box?.quantity || 1);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const handleOpenBox = async () => {
        if (!box || step === 'opening') return;

        setErrorMsg(null);
        setStep('opening');

        // Start shake animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
            ]),
            { iterations: 6 }
        ).start();

        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();

        try {
            const data: OpenMysteryBoxResult = await apiService.openWarehouseBox(box.boxId);
            setResult(data);
            const remaining = data.userInventoryUpdated?.remainingBoxes ?? data.remainingBoxes ?? 0;
            setRemainingQty(remaining);
            if (onSuccess) {
                onSuccess(data);
            }
            setStep('revealed');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Không thể mở rương');
            setStep('idle');
        }
    };

    const handleClose = () => {
        setStep('idle');
        setResult(null);
        setErrorMsg(null);
        onClose();
    };

    if (!box) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.cardContainer}>
                    <LinearGradient
                        colors={['#1E1B4B', '#2E1065', '#0F172A']}
                        style={styles.cardGradient}
                    >
                        {/* Close button */}
                        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                            <MaterialIcons name="close" size={22} color="rgba(255, 255, 255, 0.6)" />
                        </TouchableOpacity>

                        {step !== 'revealed' ? (
                            <>
                                <Text style={styles.title}>{box.name}</Text>
                                <Text style={styles.subtitle}>
                                    Còn lại trong kho: {remainingQty} rương
                                </Text>

                                {/* Animated Chest */}
                                <Animated.View
                                    style={[
                                        styles.chestContainer,
                                        {
                                            transform: [
                                                { scale: scaleAnim },
                                                { translateX: shakeAnim },
                                            ],
                                        },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#A855F7', '#6366F1']}
                                        style={styles.chestAura}
                                    >
                                        <MaterialCommunityIcons
                                            name={step === 'opening' ? 'treasure-chest' : 'treasure-chest'}
                                            size={72}
                                            color="#FFD700"
                                        />
                                    </LinearGradient>
                                </Animated.View>

                                {errorMsg && (
                                    <Text style={styles.errorText}>{errorMsg}</Text>
                                )}

                                <TouchableOpacity
                                    style={[styles.btn, step === 'opening' && styles.btnDisabled]}
                                    onPress={handleOpenBox}
                                    disabled={step === 'opening' || remainingQty < 1}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={
                                            remainingQty > 0
                                                ? ['#FFD54F', '#FFA726']
                                                : ['#8E8E93', '#636366']
                                        }
                                        style={styles.btnGradient}
                                    >
                                        {step === 'opening' ? (
                                            <ActivityIndicator size="small" color="#3E2723" />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="key-variant"
                                                    size={18}
                                                    color="#3E2723"
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text style={styles.btnText}>
                                                    {remainingQty > 0 ? 'MỞ RƯƠNG NGAY' : 'HẾT RƯƠNG'}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.congratsAura}>
                                    <MaterialIcons name="auto-awesome" size={48} color="#FFD700" />
                                </View>
                                <Text style={styles.congratsTitle}>CHÚC MỪNG BẠN!</Text>
                                <Text style={styles.congratsSubtitle}>
                                    Đã nhận được phần thưởng từ {box.name}
                                </Text>

                                {/* Reward Items Display */}
                                <View style={styles.rewardsList}>
                                    {result?.rewards && result.rewards.length > 0 ? (
                                        result.rewards.map((r, idx) => (
                                            <View key={idx} style={styles.rewardCard}>
                                                {r.type === 'coins' ? (
                                                    <MaterialIcons name="monetization-on" size={24} color="#FFD700" />
                                                ) : r.type === 'fragment' ? (
                                                    <MaterialCommunityIcons name="puzzle" size={24} color="#FFD700" />
                                                ) : (
                                                    <MaterialIcons name="card-giftcard" size={24} color="#FFD700" />
                                                )}
                                                <Text style={styles.rewardName}>{r.name}</Text>
                                                <Text style={styles.rewardAmount}>+{r.amount}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.rewardCard}>
                                            <MaterialIcons name="monetization-on" size={24} color="#FFD700" />
                                            <Text style={styles.rewardName}>
                                                {result?.rewardName || '50 Xu May Mắn'}
                                            </Text>
                                            <Text style={styles.rewardAmount}>
                                                +{result?.amount || 50}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.remainingHint}>
                                    Còn lại trong kho: {remainingQty} rương
                                </Text>

                                <View style={styles.actionRow}>
                                    {remainingQty > 0 && (
                                        <TouchableOpacity
                                            style={[styles.btn, { flex: 1, marginRight: 8 }]}
                                            onPress={handleOpenBox}
                                        >
                                            <LinearGradient
                                                colors={['#FFD54F', '#FFA726']}
                                                style={styles.btnGradient}
                                            >
                                                <Text style={styles.btnText}>MỞ TIẾP</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.btn,
                                            { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
                                        ]}
                                        onPress={handleClose}
                                    >
                                        <View style={styles.btnGradient}>
                                            <Text style={[styles.btnText, { color: '#FFF' }]}>
                                                XONG
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
        zIndex: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 6,
    },
    subtitle: {
        fontSize: 12,
        color: '#E2E8F0',
        marginTop: 4,
        marginBottom: 16,
    },
    chestContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 14,
    },
    chestAura: {
        width: 110,
        height: 110,
        borderRadius: 55,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    errorText: {
        color: '#F87171',
        fontSize: 12,
        marginBottom: 12,
        textAlign: 'center',
    },
    btn: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#3E2723',
        letterSpacing: 0.6,
    },
    congratsAura: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    congratsTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFD700',
        letterSpacing: 1,
    },
    congratsSubtitle: {
        fontSize: 12,
        color: '#E2E8F0',
        marginVertical: 4,
        textAlign: 'center',
    },
    rewardsList: {
        width: '100%',
        marginVertical: 14,
    },
    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.4)',
    },
    rewardName: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    rewardAmount: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFD700',
    },
    remainingHint: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 14,
    },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
    },
});

export default MysteryBoxOpenModal;
