import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Image,
    Modal,
    TextInput,
    ActivityIndicator,
    FlatList,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZES } from '../theme';
import { apiService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import ClayHeader from '../components/ClayHeader';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const SLOT_SIZE = (width * 0.65 - 48 - 24) / 3; // 3 columns in right panel

interface Topic {
    _id: string;
    title: string;
    description: string;
    imageUrl?: string;
    colorBg: string;
    colorAccent: string;
    totalSlots: number;
    rewardPerEntry: { coins: number; xp: number; gachaTickets: number };
    milestoneRewards: { target: number; coins: number; xp: number; gachaTickets: number }[];
}

interface Entry {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    status: string;
    slotIndex: number;
}

export default function CollectionScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<number>(-1);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formImage, setFormImage] = useState('');

    const fetchTopics = useCallback(async () => {
        try {
            const res = await apiService.get('/collections/topics');
            setTopics(res.topics || []);
            if (res.topics?.length > 0 && !selectedTopic) {
                setSelectedTopic(res.topics[0]);
            }
        } catch (error) {
            console.error('Fetch topics error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchEntries = useCallback(async (topicId: string) => {
        try {
            const res = await apiService.get(`/collections/topics/${topicId}/entries`);
            setEntries(res.entries || []);
        } catch (error) {
            console.error('Fetch entries error:', error);
        }
    }, []);

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        if (selectedTopic) {
            fetchEntries(selectedTopic._id);
        }
    }, [selectedTopic]);

    const handleSlotPress = (index: number) => {
        const filled = entries.find(e => e.slotIndex === index);
        if (filled) return; // Already filled
        setSelectedSlot(index);
        setFormTitle('');
        setFormDesc('');
        setFormImage('');
        setShowModal(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            try {
                const uploadRes = await apiService.post('/upload/proof', {
                    image: `data:image/jpeg;base64,${result.assets[0].base64}`,
                });
                setFormImage(uploadRes.url || uploadRes.imageUrl);
            } catch (error) {
                Alert.alert('Lỗi', 'Không thể upload ảnh');
            }
        }
    };

    const handleSubmit = async () => {
        if (!formTitle.trim() || !formImage || !selectedTopic) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và chọn ảnh');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiService.post(`/collections/topics/${selectedTopic._id}/submit`, {
                title: formTitle.trim(),
                description: formDesc.trim(),
                imageUrl: formImage,
                slotIndex: selectedSlot,
            });

            setShowModal(false);

            if (res.rewardGiven) {
                let msg = `+${res.rewardGiven.coins} Coins, +${res.rewardGiven.xp} XP`;
                if (res.rewardGiven.milestone) {
                    msg += `\n🎉 Mốc ${res.rewardGiven.milestone.target}! +${res.rewardGiven.milestone.coins} Coins, +${res.rewardGiven.milestone.xp} XP`;
                }
                Alert.alert('✅ Đã xác nhận!', msg);
            }

            fetchEntries(selectedTopic._id);
        } catch (error: any) {
            const errMsg = error?.response?.data?.error || 'Không thể gửi bài';
            Alert.alert('Lỗi', errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.clayAccent2} />
            </View>
        );
    }

    const filledSlots = new Set(entries.filter(e => e.status === 'approved').map(e => e.slotIndex));
    const totalFilled = filledSlots.size;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.warmBg} />
            <ClayHeader user={user} />

            <View style={[styles.header, { paddingTop: 0 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                </TouchableOpacity>
                {selectedTopic && (
                    <View style={styles.progressBadge}>
                        <MaterialIcons name="collections-bookmark" size={18} color={selectedTopic.colorBg} />
                        <Text style={[styles.progressText, { color: selectedTopic.colorBg }]}>
                            {totalFilled}/{selectedTopic.totalSlots}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.mainContent}>
                {/* LEFT: Topic List */}
                <View style={styles.leftPanel}>
                    <FlatList
                        data={topics}
                        keyExtractor={item => item._id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => {
                            const isSelected = selectedTopic?._id === item._id;
                            return (
                                <TouchableOpacity
                                    onPress={() => setSelectedTopic(item)}
                                    style={[
                                        styles.topicCard,
                                        isSelected && { borderColor: item.colorBg, borderWidth: 3 },
                                    ]}
                                >
                                    <View style={[styles.topicImageBox, { backgroundColor: item.colorBg }]}>
                                        {item.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={styles.topicImage} />
                                        ) : (
                                            <MaterialIcons name="eco" size={28} color={item.colorAccent} />
                                        )}
                                    </View>
                                    <Text style={styles.topicTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.topicIndex}>{index + 1}/{topics.length}</Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* RIGHT: Slots Grid */}
                <ScrollView style={styles.rightPanel} contentContainerStyle={styles.rightContent} showsVerticalScrollIndicator={false}>
                    {selectedTopic && (
                        <>
                            <Text style={styles.topicHeading}>{selectedTopic.title}</Text>
                            <Text style={styles.topicDesc}>{selectedTopic.description}</Text>

                            <View style={styles.rewardInfo}>
                                <MaterialIcons name="emoji-events" size={16} color="#eab308" />
                                <Text style={styles.rewardText}>
                                    Mỗi mục: +{selectedTopic.rewardPerEntry.coins}💰 +{selectedTopic.rewardPerEntry.xp}⭐
                                </Text>
                            </View>

                            <View style={styles.slotsGrid}>
                                {Array.from({ length: selectedTopic.totalSlots }, (_, i) => {
                                    const entry = entries.find(e => e.slotIndex === i && e.status === 'approved');
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={[
                                                styles.slot,
                                                entry && { backgroundColor: selectedTopic.colorBg + '20', borderColor: selectedTopic.colorBg },
                                            ]}
                                            onPress={() => handleSlotPress(i)}
                                            activeOpacity={entry ? 1 : 0.7}
                                        >
                                            {entry ? (
                                                <>
                                                    <Image source={{ uri: entry.imageUrl }} style={styles.slotImage} />
                                                    <Text style={styles.slotTitle} numberOfLines={1}>{entry.title}</Text>
                                                </>
                                            ) : (
                                                <Text style={styles.slotQuestion}>?</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {selectedTopic.milestoneRewards.length > 0 && (
                                <View style={styles.milestonesSection}>
                                    <Text style={styles.milestonesTitle}>🏆 Mốc thưởng</Text>
                                    {selectedTopic.milestoneRewards.map((m, i) => (
                                        <View key={i} style={[
                                            styles.milestoneRow,
                                            totalFilled >= m.target && { backgroundColor: '#dcfce7' }
                                        ]}>
                                            <Text style={styles.milestoneTarget}>
                                                {totalFilled >= m.target ? '✅' : '⬜'} {m.target} mục
                                            </Text>
                                            <Text style={styles.milestoneReward}>
                                                +{m.coins}💰 +{m.xp}⭐
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>

            {/* Submit Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📸 Thêm vào bộ sưu tập</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Tên vật phẩm *</Text>
                        <TextInput
                            style={styles.input}
                            value={formTitle}
                            onChangeText={setFormTitle}
                            placeholder="VD: Cây Bàng"
                            placeholderTextColor="rgba(93,64,55,0.4)"
                        />

                        <Text style={styles.inputLabel}>Mô tả</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={formDesc}
                            onChangeText={setFormDesc}
                            placeholder="Mô tả ngắn..."
                            placeholderTextColor="rgba(93,64,55,0.4)"
                            multiline
                        />

                        <Text style={styles.inputLabel}>Ảnh *</Text>
                        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                            {formImage ? (
                                <Image source={{ uri: formImage }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.imagePickerPlaceholder}>
                                    <MaterialIcons name="add-a-photo" size={32} color="rgba(93,64,55,0.3)" />
                                    <Text style={{ color: 'rgba(93,64,55,0.5)', fontSize: 13, marginTop: 4 }}>Chọn ảnh</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <LinearGradient
                                colors={[selectedTopic?.colorBg || '#10b981', '#059669']}
                                style={styles.submitGradient}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.submitText}>Gửi để xác nhận</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 50, paddingBottom: 10, zIndex: 10,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.warmBg,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
    },
    progressBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warmBg,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', shadowColor: '#D29664',
        shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    },
    progressText: { fontSize: 14, fontWeight: 'bold' },

    mainContent: { flex: 1, flexDirection: 'row', paddingHorizontal: 16, gap: 12 },

    // Left panel
    leftPanel: { width: '30%' },
    topicCard: {
        backgroundColor: COLORS.clayCard, borderRadius: 16, padding: 10, marginBottom: 10,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: '#A68A64', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    },
    topicImageBox: {
        width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        marginBottom: 6, overflow: 'hidden',
    },
    topicImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    topicTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.clayText, textAlign: 'center' },
    topicIndex: { fontSize: 10, color: 'rgba(93,64,55,0.5)', marginTop: 2 },

    // Right panel
    rightPanel: { flex: 1 },
    rightContent: { paddingBottom: 20 },
    topicHeading: { fontSize: 20, fontWeight: '900', color: COLORS.clayText, marginBottom: 4 },
    topicDesc: { fontSize: 13, color: 'rgba(93,64,55,0.7)', marginBottom: 12, lineHeight: 18 },
    rewardInfo: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fefce8',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginBottom: 16, alignSelf: 'flex-start',
    },
    rewardText: { fontSize: 12, fontWeight: '600', color: '#92400e' },

    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    slot: {
        width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 14, backgroundColor: COLORS.clayCard,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)', shadowColor: '#A68A64',
        shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
        overflow: 'hidden',
    },
    slotImage: { width: '100%', height: '70%', resizeMode: 'cover', borderRadius: 10 },
    slotTitle: { fontSize: 9, fontWeight: 'bold', color: COLORS.clayText, marginTop: 2, paddingHorizontal: 4 },
    slotQuestion: { fontSize: 28, fontWeight: '900', color: 'rgba(93,64,55,0.2)' },

    milestonesSection: { marginTop: 20 },
    milestonesTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.clayText, marginBottom: 8 },
    milestoneRow: {
        flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 10, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.5)',
    },
    milestoneTarget: { fontSize: 13, fontWeight: '600', color: COLORS.clayText },
    milestoneReward: { fontSize: 13, fontWeight: 'bold', color: '#059669' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: COLORS.warmBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.clayText },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.clayText, marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: COLORS.clayCard, borderRadius: 12, padding: 12, fontSize: 15, color: COLORS.clayText,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    },
    imagePickerBtn: {
        borderRadius: 16, overflow: 'hidden', marginTop: 8, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)', borderStyle: 'dashed',
    },
    imagePickerPlaceholder: {
        height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.clayCard,
    },
    previewImage: { width: '100%', height: 160, resizeMode: 'cover' },
    submitBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
    submitGradient: { paddingVertical: 14, alignItems: 'center' },
    submitText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});
