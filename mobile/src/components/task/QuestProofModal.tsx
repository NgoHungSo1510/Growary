import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../theme';

export interface QuestProofModalProps {
    pickerIndex: number | null;
    onClosePicker: () => void;
    onSelectProof: (source: 'camera' | 'library' | 'none') => void;
    celebrationData: {
        title: string;
        xp: number;
        coin: number;
        isLate: boolean;
        latePercentage: number;
    } | null;
    onCloseCelebration: () => void;
    proofPreviewUrl: string | null;
    onCloseProofPreview: () => void;
}

export const launchCameraBase64 = async (): Promise<string | null> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchCameraAsync({
        quality: 0.35,
        base64: true,
        allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]?.base64) {
        return `data:image/jpeg;base64,${res.assets[0].base64}`;
    }
    return null;
};

export const launchLibraryBase64 = async (): Promise<string | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.35,
        base64: true,
        allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]?.base64) {
        return `data:image/jpeg;base64,${res.assets[0].base64}`;
    }
    return null;
};

export const QuestProofModal: React.FC<QuestProofModalProps> = React.memo(
    ({
        pickerIndex,
        onClosePicker,
        onSelectProof,
        celebrationData,
        onCloseCelebration,
        proofPreviewUrl,
        onCloseProofPreview,
    }) => {
        const celebrationScale = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            if (celebrationData) {
                celebrationScale.setValue(0);
                Animated.spring(celebrationScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 60,
                    useNativeDriver: true,
                }).start();
            }
        }, [celebrationData, celebrationScale]);

        return (
            <>
                {/* 📸 Proof Picker Modal */}
                <Modal visible={pickerIndex !== null} transparent animationType="slide">
                    <TouchableOpacity
                        style={styles.pickerOverlay}
                        activeOpacity={1}
                        onPress={onClosePicker}
                    >
                        <View style={styles.pickerSheet}>
                            <View style={styles.pickerHandle} />
                            <Text style={styles.pickerTitle}>Xác nhận hoàn thành</Text>
                            <Text style={styles.pickerSubtitle}>
                                Chọn ảnh minh chứng hoặc xác nhận hoàn thành ngay (hỗ trợ offline)
                            </Text>

                            <View style={styles.pickerButtons}>
                                <TouchableOpacity
                                    style={styles.pickerBtn}
                                    activeOpacity={0.7}
                                    onPress={() => onSelectProof('camera')}
                                >
                                    <View style={[styles.pickerIconBox, { backgroundColor: 'rgba(251,155,143,0.15)' }]}>
                                        <MaterialIcons name="photo-camera" size={26} color={COLORS.clayAccent1} />
                                    </View>
                                    <Text style={styles.pickerBtnTitle}>Chụp ảnh</Text>
                                    <Text style={styles.pickerBtnSub}>Camera</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.pickerBtn}
                                    activeOpacity={0.7}
                                    onPress={() => onSelectProof('library')}
                                >
                                    <View style={[styles.pickerIconBox, { backgroundColor: 'rgba(245,119,153,0.12)' }]}>
                                        <MaterialIcons name="photo-library" size={26} color={COLORS.clayAccent2} />
                                    </View>
                                    <Text style={styles.pickerBtnTitle}>Thư viện</Text>
                                    <Text style={styles.pickerBtnSub}>Chọn ảnh</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.instantDoneBtn}
                                activeOpacity={0.8}
                                onPress={() => onSelectProof('none')}
                            >
                                <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
                                <Text style={styles.instantDoneBtnText}>Xác nhận hoàn thành ngay (Không kèm ảnh)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.pickerCancelBtn} onPress={onClosePicker}>
                                <Text style={styles.pickerCancelText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* 🎉 Celebration Modal */}
                <Modal visible={!!celebrationData} transparent animationType="fade">
                    <View style={styles.celebrationOverlay}>
                        <Animated.View style={[styles.celebrationCard, { transform: [{ scale: celebrationScale }] }]}>
                            <LinearGradient colors={[COLORS.clayCard, COLORS.clayAccent1]} style={styles.celebrationGradient}>
                                <Text style={styles.celebrationEmoji}>🎉</Text>
                                <Text style={styles.celebrationTitle}>Nhiệm vụ hoàn thành!</Text>
                                <Text style={styles.celebrationQuestName}>{celebrationData?.title}</Text>

                                <View style={styles.celebrationXpRow}>
                                    <View style={styles.celebrationXpBadge}>
                                        <Text style={styles.celebrationXpText}>+{celebrationData?.xp} XP</Text>
                                    </View>
                                    <View style={[styles.celebrationXpBadge, styles.coinBadge]}>
                                        <Text style={[styles.celebrationXpText, { color: '#92400E' }]}>+{celebrationData?.coin} 🪙</Text>
                                    </View>
                                </View>

                                {celebrationData?.isLate && (
                                    <View style={styles.lateWarning}>
                                        <Text style={styles.lateWarningText}>⏰ Trễ hạn: -{celebrationData.latePercentage}% phạt</Text>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.celebrationBtn} onPress={onCloseCelebration} activeOpacity={0.8}>
                                    <Text style={styles.celebrationBtnText}>Tuyệt vời! 🚀</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </Animated.View>
                    </View>
                </Modal>

                {/* 🖼️ Proof Preview Modal */}
                <Modal visible={!!proofPreviewUrl} transparent animationType="fade">
                    <TouchableOpacity style={styles.proofOverlay} activeOpacity={1} onPress={onCloseProofPreview}>
                        <View style={styles.proofContainer}>
                            <Text style={styles.proofTitle}>📸 Bằng chứng</Text>
                            {proofPreviewUrl && <Image source={{ uri: proofPreviewUrl }} style={styles.proofImage} resizeMode="contain" />}
                            <TouchableOpacity style={styles.proofCloseBtn} onPress={onCloseProofPreview}>
                                <Text style={styles.proofCloseText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </>
        );
    }
);

QuestProofModal.displayName = 'QuestProofModal';

const styles = StyleSheet.create({
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
    pickerHandle: { width: 36, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.clayText, textAlign: 'center' },
    pickerSubtitle: { fontSize: 12, color: 'rgba(93,64,55,0.6)', textAlign: 'center', marginTop: 4, marginBottom: 20 },
    pickerButtons: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    pickerBtn: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, alignItems: 'center' },
    pickerIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    pickerBtnTitle: { fontSize: 13, fontWeight: '700', color: COLORS.clayText },
    pickerBtnSub: { fontSize: 11, color: '#94A3B8' },
    instantDoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 14, marginBottom: 10 },
    instantDoneBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    pickerCancelBtn: { paddingVertical: 10, alignItems: 'center' },
    pickerCancelText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
    celebrationOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    celebrationCard: { width: '85%', borderRadius: 28, overflow: 'hidden' },
    celebrationGradient: { padding: 28, alignItems: 'center' },
    celebrationEmoji: { fontSize: 44, marginBottom: 10 },
    celebrationTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    celebrationQuestName: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4, marginBottom: 16 },
    celebrationXpRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    celebrationXpBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    coinBadge: { backgroundColor: 'rgba(254,240,138,0.6)' },
    celebrationXpText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
    lateWarning: { backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 14 },
    lateWarningText: { fontSize: 12, color: '#EF4444', fontWeight: 'bold' },
    celebrationBtn: { backgroundColor: '#FFF', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 18 },
    celebrationBtnText: { color: COLORS.clayAccent2, fontSize: 15, fontWeight: 'bold' },
    proofOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    proofContainer: { width: '90%', backgroundColor: '#FFF', borderRadius: 20, padding: 18, alignItems: 'center' },
    proofTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    proofImage: { width: '100%', height: 260, borderRadius: 12 },
    proofCloseBtn: { marginTop: 14, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
    proofCloseText: { fontSize: 13, fontWeight: '700', color: '#475569' },
});

