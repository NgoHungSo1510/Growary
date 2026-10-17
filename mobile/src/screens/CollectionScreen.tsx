import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/api';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import ClayHeader from '../components/ClayHeader';
import RewardCelebrationModal from '../components/RewardCelebrationModal';
import { GrantedRewards } from '../types';
import {
    CollectionSlotGrid,
    Entry,
    SubmitPhotoModal,
    ImageSourcePickerModal,
    ViewEntryModal,
    HistoryModal,
    CollectionHeroSection,
} from '../components/collection';

interface Topic {
    _id: string;
    title: string;
    description: string;
    imageUrl?: string;
    colorBg: string;
    colorAccent: string;
    totalSlots: number;
    completionRewardPool?: { coins: number; xp: number; gachaTickets: number };
    rewardPerEntry: { coins: number; xp: number; gachaTickets: number };
    milestoneRewards: { target: number; coins: number; xp: number; gachaTickets: number }[];
    isCompleted: boolean;
    order: number;
}

export default function CollectionScreen() {
    const navigation = useNavigation<any>();
    const { user, refreshUser } = useAuth();
    const isFocused = useIsFocused();

    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [history, setHistory] = useState<Entry[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<number>(-1);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formImage, setFormImage] = useState('');

    // Celebration & Preview state
    const [celebrationRewards, setCelebrationRewards] = useState<GrantedRewards | null>(null);
    const [viewEntry, setViewEntry] = useState<Entry | null>(null);
    const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchTopics = useCallback(async () => {
        try {
            const res = await apiService.get('/collections/topics');
            const sortedTopics = (res.topics || []).sort((a: Topic, b: Topic) => a.order - b.order);
            setTopics(sortedTopics);

            if (sortedTopics.length > 0 && !selectedTopic) {
                const firstIncomplete = sortedTopics.find((t: Topic) => !t.isCompleted);
                setSelectedTopic(firstIncomplete || sortedTopics[sortedTopics.length - 1]);
            }
        } catch (error) {
            console.error('Fetch topics error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedTopic]);

    const fetchEntries = useCallback(async (topicId: string) => {
        try {
            const res = await apiService.get(`/collections/topics/${topicId}/entries`);
            setEntries(res.entries || []);
        } catch (error) {
            console.error('Fetch entries error:', error);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await apiService.get('/collections/history');
            setHistory(res.entries || []);
        } catch (error) {
            console.error('Fetch history error:', error);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchTopics();
        }
    }, [isFocused, fetchTopics]);

    useEffect(() => {
        if (selectedTopic) {
            fetchEntries(selectedTopic._id);
        }
    }, [selectedTopic, fetchEntries]);

    const handleTopicSelect = (t: Topic, index: number) => {
        if (index > 0) {
            const prevTopic = topics[index - 1];
            if (!prevTopic.isCompleted) {
                Alert.alert('Chưa Mở Khóa', `Vui lòng hoàn thành ${prevTopic.title} (Tầng ${prevTopic.order}) trước!`);
                return;
            }
        }
        setSelectedTopic(t);
    };

    const handleSlotPress = (index: number) => {
        const filled = entries.find((e) => e.slotIndex === index);
        if (filled) {
            setViewEntry(filled);
            return;
        }

        if (selectedTopic?.isCompleted) {
            Alert.alert('Tầng đã đóng', 'Bộ sưu tập này đã hoàn thành, không thể nộp thêm.');
            return;
        }

        setSelectedSlot(index);
        setFormTitle('');
        setFormDesc('');
        setFormImage('');
        setShowModal(true);
    };

    const handleImageSourcePick = async (source: 'camera' | 'library') => {
        setShowImageSourcePicker(false);
        setUploadingImage(true);

        try {
            let result;
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng sử dụng camera.');
                    setUploadingImage(false);
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    quality: 0.7,
                    base64: true,
                    allowsEditing: false,
                });
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập thư viện ảnh.');
                    setUploadingImage(false);
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                    base64: true,
                });
            }

            if (!result.canceled && result.assets && result.assets[0].base64) {
                const uploadRes = await apiService.post('/upload/proof', {
                    image: `data:image/jpeg;base64,${result.assets[0].base64}`,
                });
                setFormImage(uploadRes.url || uploadRes.imageUrl);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể upload ảnh. Vui lòng thử lại.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        if (!formTitle.trim() || !formImage || !selectedTopic) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ảnh và chọn ảnh');
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
                if (res.rewardGiven.isTierUnlock) {
                    setCelebrationRewards({
                        coins: res.rewardGiven.coins,
                        xp: res.rewardGiven.xp,
                        gachaTickets: 0,
                        items: [],
                        levelUps: [],
                        isTierUnlock: true,
                        message: '🎉 TOÀN MAP ĐÃ VƯỢT TẦNG!\nTuyệt vời! Các bạn đã mở khóa bộ sưu tập mới!',
                    });
                    fetchTopics();
                } else {
                    let msg = `Bạn nhận được +${res.rewardGiven.coins} Coins, +${res.rewardGiven.xp} XP`;
                    if (res.rewardGiven.milestone) {
                        msg += `\n\n🎉 MỐC THÀNH TỰU GLOBAL!\nTất cả người đóng góp vừa được thưởng thêm +${res.rewardGiven.milestone.coins} C, +${res.rewardGiven.milestone.xp} XP!`;
                    }
                    setCelebrationRewards({
                        coins: res.rewardGiven.coins + (res.rewardGiven.milestone?.coins || 0),
                        xp: (res.rewardGiven.xp || 0) + (res.rewardGiven.milestone?.xp || 0),
                        gachaTickets: 0,
                        items: [],
                        levelUps: [],
                        message: msg,
                    });
                }
                await refreshUser();
            }

            fetchEntries(selectedTopic._id);
        } catch (error: any) {
            const errMsg = error?.response?.data?.error || 'Lỗi gửi bài. Có thể ai đó đã nhanh tay gửi trước bạn!';
            Alert.alert('Thất bại', errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#f43f5e" />
            </View>
        );
    }

    const topic = selectedTopic;
    if (!topic) {
        return (
            <View style={[styles.container, { backgroundColor: '#fff7cf' }]}>
                <ClayHeader user={user} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <MaterialIcons name="photo-album" size={64} color="#fd9c90" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 18, color: '#332f13', fontWeight: 'bold', textAlign: 'center' }}>
                        Hệ thống chưa có Tầng nào được mở.
                    </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, padding: 12, backgroundColor: '#faf2c4', borderRadius: 12 }}>
                        <Text style={{ color: '#9f3456', fontWeight: 'bold' }}>Trở về Trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const filledSlots = entries.filter((e) => e.status === 'approved');
    const totalFilled = filledSlots.length;
    const progressPercent = topic.totalSlots > 0 ? (totalFilled / topic.totalSlots) * 100 : 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff7cf" />
            <ClayHeader user={user} />

            {/* Back & History Row */}
            <View style={styles.topActionsRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#9f3456" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        fetchHistory();
                        setShowHistoryModal(true);
                    }}
                    style={styles.actionBtn}
                >
                    <MaterialIcons name="history" size={20} color="#9f3456" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>Lịch sử của tôi</Text>
                </TouchableOpacity>
            </View>

            {/* Tiers/Topic Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {topics.map((t, index) => {
                        const isLocked = index > 0 && !topics[index - 1].isCompleted;
                        const isSelected = selectedTopic?._id === t._id;
                        return (
                            <TouchableOpacity
                                key={t._id}
                                style={[
                                    styles.tabPill,
                                    isSelected && styles.tabPillActive,
                                    isLocked && { opacity: 0.5, backgroundColor: '#e2dabc' },
                                ]}
                                onPress={() => handleTopicSelect(t, index)}
                                activeOpacity={0.8}
                            >
                                {isLocked && <MaterialIcons name="lock" size={14} color="#9d9573" style={{ marginRight: 4 }} />}
                                <Text
                                    style={[
                                        styles.tabPillText,
                                        isSelected && styles.tabPillTextActive,
                                        isLocked && { color: '#9d9573' },
                                    ]}
                                >
                                    Tầng {t.order}
                                </Text>
                                {t.isCompleted && !isLocked && (
                                    <MaterialIcons name="check-circle" size={14} color={isSelected ? '#FFF' : '#10b981'} style={{ marginLeft: 4 }} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero & Global Progress Section */}
                <CollectionHeroSection
                    title={topic.title}
                    description={topic.description}
                    totalSlots={topic.totalSlots}
                    totalFilled={totalFilled}
                    progressPercent={progressPercent}
                />

                {/* Photo Grid Section */}
                <CollectionSlotGrid
                    totalSlots={topic.totalSlots}
                    entries={entries}
                    onSlotPress={handleSlotPress}
                />

                {/* CTA Action */}
                {!topic.isCompleted && (
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={() => {
                            const firstEmpty = Array.from({ length: topic.totalSlots }).findIndex(
                                (_, i) => !entries.find((e) => e.slotIndex === i)
                            );
                            if (firstEmpty !== -1) handleSlotPress(firstEmpty);
                        }}
                    >
                        <LinearGradient
                            colors={['#9f3456', '#fd7d9f']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ctaGradient}
                        >
                            <MaterialIcons name="photo-camera" size={22} color="#FFF" />
                            <Text style={styles.ctaText}>Đăng Ảnh (Tìm chỗ trống)</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Modals */}
            <ViewEntryModal
                visible={!!viewEntry}
                entry={viewEntry}
                currentUsername={user?.username}
                onClose={() => setViewEntry(null)}
            />

            <SubmitPhotoModal
                visible={showModal}
                slotIndex={selectedSlot}
                title={formTitle}
                description={formDesc}
                imageUrl={formImage}
                uploadingImage={uploadingImage}
                submitting={submitting}
                onChangeTitle={setFormTitle}
                onChangeDescription={setFormDesc}
                onPickImage={() => setShowImageSourcePicker(true)}
                onSubmit={handleSubmit}
                onClose={() => setShowModal(false)}
            />

            <ImageSourcePickerModal
                visible={showImageSourcePicker}
                onSelectSource={handleImageSourcePick}
                onClose={() => setShowImageSourcePicker(false)}
            />

            <HistoryModal
                visible={showHistoryModal}
                history={history}
                onClose={() => setShowHistoryModal(false)}
            />

            <RewardCelebrationModal
                visible={!!celebrationRewards}
                rewards={celebrationRewards}
                onClose={() => setCelebrationRewards(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff7cf' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    topActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginVertical: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#faf2c4',
        borderRadius: 14,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#9f3456',
    },
    tabsContainer: {
        marginBottom: 16,
    },
    tabPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#faf2c4',
        marginRight: 8,
    },
    tabPillActive: {
        backgroundColor: '#9f3456',
    },
    tabPillText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#615c3c',
    },
    tabPillTextActive: {
        color: '#FFF',
    },
    ctaBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 8,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    ctaText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
