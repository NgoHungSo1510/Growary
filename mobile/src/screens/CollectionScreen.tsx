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
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';
import { apiService } from '../services/api';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import ClayHeader from '../components/ClayHeader';
import RewardCelebrationModal from '../components/RewardCelebrationModal';
import { GrantedRewards } from '../types';

const { width, height } = Dimensions.get('window');
const SLOT_GAP = 8;
const SLOT_SIZE = (width - 40 - (SLOT_GAP * 4)) / 5;

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

interface Entry {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    status: string;
    slotIndex: number;
    userId?: {
        _id: string;
        username: string;
        avatar: string;
    } | string;
    createdAt?: string;
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

    // Celebration state
    const [celebrationRewards, setCelebrationRewards] = useState<GrantedRewards | null>(null);
    const [viewEntry, setViewEntry] = useState<Entry | null>(null);
    const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchTopics = useCallback(async () => {
        try {
            const res = await apiService.get('/collections/topics');
            const sortedTopics = (res.topics || []).sort((a: Topic, b: Topic) => a.order - b.order);
            setTopics(sortedTopics);
            
            // Auto Select the first INCOMPLETE topic by default, or the last topic if all completed
            if (sortedTopics.length > 0 && !selectedTopic) {
                const firstIncomplete = sortedTopics.find((t: Topic) => !t.isCompleted);
                if (firstIncomplete) {
                    setSelectedTopic(firstIncomplete);
                } else {
                    setSelectedTopic(sortedTopics[sortedTopics.length - 1]);
                }
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
        // Locking Logic: Topic N requires Topic N-1 to be completed
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
        const filled = entries.find(e => e.slotIndex === index);
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

    const pickImage = () => {
        setShowImageSourcePicker(true);
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

    const isSubmittingRef = React.useRef(false);

    const handleSubmit = async () => {
        if (isSubmittingRef.current) return;
        if (!formTitle.trim() || !formImage || !selectedTopic) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ảnh và chọn ảnh');
            return;
        }

        isSubmittingRef.current = true;
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
                        message: "🎉 TOÀN MAP ĐÃ VƯỢT TẦNG!\nTuyệt vời! Các bạn đã mở khóa bộ sưu tập mới!"
                    });
                    fetchTopics(); // Refresh topics to unlock the next one
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
                        message: msg
                    });
                }
                
                await refreshUser();
            }

            fetchEntries(selectedTopic._id);
        } catch (error: any) {
            const errMsg = error?.response?.data?.error || 'Lỗi gửi bài. Có thể ai đó đã nhanh tay gửi trước bạn!';
            Alert.alert('Thất bại', errMsg);
        } finally {
            isSubmittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleHistoryOpen = () => {
        fetchHistory();
        setShowHistoryModal(true);
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
                    <Text style={{ fontSize: 18, color: '#332f13', fontWeight: 'bold', textAlign: 'center' }}>Hệ thống chưa có Tầng nào được mở.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, padding: 12, backgroundColor: '#faf2c4', borderRadius: 12 }}>
                        <Text style={{ color: '#9f3456', fontWeight: 'bold' }}>Trở về Trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const filledSlots = entries.filter(e => e.status === 'approved');
    const totalFilled = filledSlots.length;
    const progressPercent = topic.totalSlots > 0 ? (totalFilled / topic.totalSlots) * 100 : 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff7cf" />
            
            <View style={{ zIndex: 10 }}>
                <ClayHeader user={user} />
            </View>

            {/* Back & History Row */}
            <View style={styles.topActionsRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#9f3456" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleHistoryOpen} style={styles.actionBtn}>
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
                                    isLocked && { opacity: 0.5, backgroundColor: '#e2dabc' }
                                ]}
                                onPress={() => handleTopicSelect(t, index)}
                                activeOpacity={0.8}
                            >
                                {isLocked && <MaterialIcons name="lock" size={14} color="#9d9573" style={{ marginRight: 4 }} />}
                                <Text style={[
                                    styles.tabPillText,
                                    isSelected && styles.tabPillTextActive,
                                    isLocked && { color: '#9d9573' }
                                ]}>Tầng {t.order}</Text>
                                {t.isCompleted && !isLocked && <MaterialIcons name="check-circle" size={14} color={isSelected ? "#FFF" : "#10b981"} style={{ marginLeft: 4 }} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroTitleBox}>
                        <Text style={styles.heroTitle}>{topic.title}</Text>
                        <MaterialIcons name="wb-sunny" size={40} color="#fd9c90" style={styles.heroIcon} />
                    </View>
                    <Text style={styles.heroDesc}>
                        {topic.description || `Cùng nhau thu thập ${topic.totalSlots} bức ảnh để nhận thưởng lớn!`}
                    </Text>
                </View>

                {/* Global Progress Bar */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressCount}>{totalFilled}/{topic.totalSlots} <Text style={styles.progressCountSub}>Đã gom</Text></Text>
                        <Text style={styles.progressPercentText}>{Math.round(progressPercent)}% Hoàn thành</Text>
                    </View>
                    
                    <View style={styles.progressTrack}>
                        <LinearGradient
                            colors={['#fd9c90', '#fd7d9f']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${progressPercent}%` }]}
                        />
                        {/* Render simple target dots according to milestone configs */}
                        {topic.milestoneRewards?.map((m) => {
                            const percent = (m.target / topic.totalSlots) * 100;
                            return (
                                <View key={m.target} style={[styles.milestoneBadge, { left: `${percent}%` }]}>
                                    <MaterialIcons name="star" size={14} color="#653e24" />
                                </View>
                            );
                        })}
                        <LinearGradient
                            colors={['#9f3456', '#90284a']}
                            style={[styles.milestoneBadgeEnd, { right: 0 }]}
                        >
                            <MaterialIcons name={topic.isCompleted ? "lock-open" : "lock"} size={18} color="#FFF" />
                        </LinearGradient>
                    </View>
                    <Text style={{ fontSize: 11, color: '#9f3456', marginTop: 16, fontStyle: 'italic', textAlign: 'right' }}>
                        *Tiến trình chung của toàn server
                    </Text>
                </View>

                {/* Photo Grid Section */}
                <View style={styles.gridSection}>
                    {Array.from({ length: topic.totalSlots }).map((_, i) => {
                        const entry = entries.find(e => e.slotIndex === i);
                        const isApproved = entry?.status === 'approved';
                        const isPending = entry?.status === 'pending';
                        
                        return (
                            <TouchableOpacity
                                key={i}
                                onPress={() => handleSlotPress(i)}
                                style={styles.slotBox}
                                activeOpacity={entry ? 0.7 : 0.7}
                            >
                                {entry ? (
                                    <>
                                        <View style={styles.slotImageWrapper}>
                                            <Image source={{ uri: entry.imageUrl }} style={styles.slotImage} />
                                            {isPending && (
                                                <View style={styles.pendingOverlay}>
                                                    <MaterialIcons name="schedule" size={16} color="#FFF" />
                                                </View>
                                            )}
                                            {isApproved && (
                                                <View style={styles.ownerBadge}>
                                                    <Image 
                                                        source={{ uri: (entry.userId as any)?.avatar || 'https://via.placeholder.com/20' }} 
                                                        style={{ width: 14, height: 14, borderRadius: 7 }} 
                                                    />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 10, color: '#615c3c', fontWeight: 'bold', marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
                                            {entry.title}
                                        </Text>
                                    </>
                                ) : (
                                    <View style={styles.slotEmptyBg}>
                                        <Text style={{ fontSize: 10, color: '#b4ae88', fontWeight: 'bold' }}>#{i + 1}</Text>
                                        <MaterialIcons name="add-a-photo" size={16} color="#b4ae88" style={{ marginTop: 2 }} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* CTA Action */}
                {!topic.isCompleted && (
                    <TouchableOpacity style={styles.ctaBtn} onPress={() => {
                        const firstEmpty = Array.from({ length: topic.totalSlots }).findIndex((_, i) => !entries.find(e => e.slotIndex === i));
                        if (firstEmpty !== -1) handleSlotPress(firstEmpty);
                    }}>
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

            {/* View Entry Modal */}
            <Modal visible={!!viewEntry} animationType="fade" transparent>
                <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalBox, { maxHeight: 'auto', borderRadius: 24 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { flex: 1, marginRight: 8 }]} numberOfLines={1}>{viewEntry?.title}</Text>
                            <TouchableOpacity onPress={() => setViewEntry(null)}>
                                <MaterialIcons name="close" size={24} color="#332f13" />
                            </TouchableOpacity>
                        </View>
                        {viewEntry?.imageUrl && (
                            <Image source={{ uri: viewEntry.imageUrl }} style={{ width: '100%', height: 260, borderRadius: 16, marginBottom: 16, resizeMode: 'cover' }} />
                        )}
                        <Text style={{ fontSize: 14, color: '#9f3456', fontWeight: 'bold', marginBottom: 8 }}>
                            📸 Người tải lên: {(viewEntry?.userId as any)?.username || user?.username || 'Bạn'}
                        </Text>
                        <Text style={{ fontSize: 15, color: '#332f13', lineHeight: 22 }}>
                            {viewEntry?.description || 'Không có mô tả thêm.'}
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Submit Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📸 Gửi Ảnh Vào Ô #{selectedSlot + 1}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <MaterialIcons name="close" size={24} color="#332f13" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Tên ảnh *</Text>
                        <TextInput
                            style={styles.input}
                            value={formTitle}
                            onChangeText={setFormTitle}
                            placeholder="VD: Nhành dương xỉ..."
                            placeholderTextColor="rgba(93,64,55,0.4)"
                        />

                        <Text style={styles.inputLabel}>Ghi chú thêm</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={formDesc}
                            onChangeText={setFormDesc}
                            placeholder="Chia sẻ một chút thông tin..."
                            placeholderTextColor="rgba(93,64,55,0.4)"
                            multiline
                        />

                        <Text style={styles.inputLabel}>Ảnh tải lên *</Text>
                        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} disabled={uploadingImage}>
                            {uploadingImage ? (
                                <View style={styles.imagePickerPlaceholder}>
                                    <ActivityIndicator size="small" color="#9f3456" />
                                    <Text style={{ color: '#9f3456', fontSize: 13, marginTop: 4, fontWeight: 'bold' }}>Đang tải ảnh...</Text>
                                </View>
                            ) : formImage ? (
                                <Image source={{ uri: formImage }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.imagePickerPlaceholder}>
                                    <MaterialIcons name="add-a-photo" size={32} color="rgba(93,64,55,0.3)" />
                                    <Text style={{ color: 'rgba(93,64,55,0.5)', fontSize: 13, marginTop: 4 }}>📷 Chụp ảnh / 🖼️ Chọn từ thư viện</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <LinearGradient
                                colors={['#9f3456', '#fd7d9f']}
                                style={styles.submitGradient}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.submitText}>Xác nhận gửi</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* History Modal */}
            <Modal visible={showHistoryModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBoxHistory}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📜 Lịch sử gom ảnh</Text>
                            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                <MaterialIcons name="close" size={24} color="#332f13" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40}}>
                            {history.length === 0 ? (
                                <Text style={{ textAlign: 'center', marginTop: 40, color: '#a09d84' }}>Bạn chưa đóng góp bức ảnh nào.</Text>
                            ) : (
                                history.map((item, index) => (
                                    <View key={item._id} style={styles.historyCard}>
                                        <Image source={{ uri: item.imageUrl }} style={styles.historyImg} />
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                                            <Text style={styles.historyMeta}>
                                                Mã Tầng: {(item as any).topicId?.title || 'Unknown'} - Ô #{item.slotIndex + 1}
                                            </Text>
                                            <Text style={styles.historyDate}>
                                                {new Date(item.createdAt || '').toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Image Source Picker Bottom Sheet */}
            <Modal visible={showImageSourcePicker} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setShowImageSourcePicker(false)}
                >
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerTitle}>📸 Chọn nguồn ảnh</Text>
                        <Text style={styles.pickerSubtitle}>
                            Chụp ảnh mới hoặc chọn từ thư viện có sẵn
                        </Text>

                        <View style={styles.pickerButtons}>
                            <TouchableOpacity
                                style={styles.pickerBtn}
                                activeOpacity={0.7}
                                onPress={() => handleImageSourcePick('camera')}
                            >
                                <View style={[styles.pickerIconBox, { backgroundColor: 'rgba(159,52,86,0.1)' }]}>
                                    <MaterialIcons name="photo-camera" size={28} color="#9f3456" />
                                </View>
                                <Text style={styles.pickerBtnTitle}>Chụp ảnh</Text>
                                <Text style={styles.pickerBtnSub}>Mở camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.pickerBtn}
                                activeOpacity={0.7}
                                onPress={() => handleImageSourcePick('library')}
                            >
                                <View style={[styles.pickerIconBox, { backgroundColor: 'rgba(253,125,159,0.1)' }]}>
                                    <MaterialIcons name="photo-library" size={28} color="#fd7d9f" />
                                </View>
                                <Text style={styles.pickerBtnTitle}>Thư viện</Text>
                                <Text style={styles.pickerBtnSub}>Chọn ảnh có sẵn</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.pickerCancelBtn}
                            onPress={() => setShowImageSourcePicker(false)}
                        >
                            <Text style={styles.pickerCancelText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <RewardCelebrationModal
                visible={!!celebrationRewards}
                rewards={celebrationRewards}
                onClose={() => setCelebrationRewards(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff7cf',
    },
    topActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
        zIndex: 5,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#faf2c4',
        borderRadius: 16,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#9f3456',
    },
    tabsContainer: {
        height: 48,
        marginBottom: 8,
    },
    tabPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#faf2c4',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        alignSelf: 'center',
    },
    tabPillActive: {
        backgroundColor: '#fd7d9f',
        shadowColor: '#fd7d9f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    tabPillText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#9f3456',
    },
    tabPillTextActive: {
        color: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 120,
    },
    heroSection: {
        marginBottom: 24,
    },
    heroTitleBox: {
        position: 'relative',
        alignSelf: 'flex-start',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#332f13',
        marginBottom: 8,
    },
    heroIcon: {
        position: 'absolute',
        top: -16,
        right: -24,
        opacity: 0.4,
        transform: [{ rotate: '12deg' }],
    },
    heroDesc: {
        fontSize: 14,
        color: '#615c3c',
        lineHeight: 22,
    },
    progressCard: {
        backgroundColor: '#faf2c4',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#332f13',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        overflow: 'visible',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    progressCount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#332f13',
    },
    progressCountSub: {
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.6,
    },
    progressPercentText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        color: '#9f3456',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    progressTrack: {
        height: 32,
        backgroundColor: '#ece4b1',
        borderRadius: 16,
        padding: 4,
        position: 'relative',
        justifyContent: 'center',
    },
    progressFill: {
        height: '100%',
        borderRadius: 12,
    },
    milestoneBadge: {
        position: 'absolute',
        top: -4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ffc5a4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#faf2c4',
        transform: [{ translateX: -16 }],
    },
    milestoneBadgeEnd: {
        position: 'absolute',
        top: -4,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#faf2c4',
        transform: [{ translateY: 0 }],
    },
    gridSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SLOT_GAP,
        marginBottom: 24,
    },
    slotBox: {
        width: SLOT_SIZE,
        height: SLOT_SIZE + 20,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#332f13',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
    },
    slotImageWrapper: {
        flex: 1,
        position: 'relative',
    },
    slotEmptyBg: {
        flex: 1,
        backgroundColor: '#faf2c4',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    pendingOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -8 }, { translateY: -8 }],
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownerBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    ctaBtn: {
        marginTop: 10,
        shadowColor: '#9f3456',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
        borderRadius: 16,
    },
    ctaText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: '#fff7cf', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, maxHeight: '85%',
    },
    modalBoxHistory: {
        backgroundColor: '#fff7cf', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, height: '80%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#332f13' },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#615c3c', marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#ffffff', borderRadius: 12, padding: 12, fontSize: 15, color: '#332f13',
        borderWidth: 1, borderColor: 'rgba(125, 120, 85, 0.2)',
    },
    imagePickerBtn: {
        borderRadius: 16, overflow: 'hidden', marginTop: 8, borderWidth: 1.5,
        borderColor: 'rgba(125, 120, 85, 0.3)', borderStyle: 'dashed',
    },
    imagePickerPlaceholder: {
        height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf2c4',
    },
    previewImage: { width: '100%', height: 160, resizeMode: 'cover' },
    submitBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
    submitGradient: { paddingVertical: 16, alignItems: 'center' },
    submitText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    // History Modal specific
    historyCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#332f13',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    historyImg: {
        width: 60, height: 60, borderRadius: 12, marginRight: 16,
    },
    historyInfo: {
        flex: 1, justifyContent: 'center',
    },
    historyTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#332f13', marginBottom: 2,
    },
    historyMeta: {
        fontSize: 13, color: '#9f3456', fontWeight: '600', marginBottom: 4,
    },
    historyDate: {
        fontSize: 12, color: '#a09d84',
    },
    // Image Source Picker Bottom Sheet
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    pickerSheet: {
        backgroundColor: '#fff7cf',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    pickerHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#d4ce9e',
        alignSelf: 'center',
        marginBottom: 20,
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#332f13',
        textAlign: 'center',
        marginBottom: 6,
    },
    pickerSubtitle: {
        fontSize: 14,
        color: '#615c3c',
        textAlign: 'center',
        marginBottom: 24,
    },
    pickerButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    pickerBtn: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#faf2c4',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(125,120,85,0.15)',
    },
    pickerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    pickerBtnTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#332f13',
        marginBottom: 2,
    },
    pickerBtnSub: {
        fontSize: 12,
        color: '#a09d84',
    },
    pickerCancelBtn: {
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 16,
        backgroundColor: '#ece4b1',
    },
    pickerCancelText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#9f3456',
    },
});
