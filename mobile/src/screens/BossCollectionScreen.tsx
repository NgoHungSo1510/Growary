import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../theme';

export default function BossCollectionScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { refreshUser } = useAuth();
    
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedChar, setSelectedChar] = useState<any | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        apiService.getMyBossCollections()
            .then(data => setCollections(data.collections))
            .catch(console.error);
    }, []);

    const scrollViewRef = useRef<ScrollView>(null);

    // Auto scroll logic (simplified, assuming items are roughly same height, or just highlight)
    useEffect(() => {
        if (route?.params?.collectionId && collections.length > 0) {
            // Find index to scroll to
            const index = collections.findIndex(c => c.collection._id === route.params.collectionId);
            if (index >= 0) {
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: index * 200, animated: true }); // approximate height
                }, 500);
            }
        }
    }, [route?.params, collections]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.clayText} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Bộ Sưu Tập Boss</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {collections.length > 0 ? (
                    <View style={styles.collectionsContainer}>
                        {collections.map((item, index) => {
                            const { collection, bosses, userProgress } = item;
                            const isCompleted = userProgress.isCompleted;
                            const canClaim = isCompleted && !userProgress.bonusTicketsClaimed;
                            const isHighlighted = route?.params?.collectionId === collection._id;

                            return (
                                <View key={collection._id} style={[styles.collectionCard, isHighlighted && { borderColor: collection.themeColor, borderWidth: 2 }]}>
                                    <View style={styles.collectionHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={styles.collectionIcon}>{collection.iconEmoji}</Text>
                                            <Text style={styles.collectionTitle}>{collection.title}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={[styles.collectionProgress, isCompleted && { color: '#16A34A', fontWeight: 'bold' }]}>
                                                {userProgress.unlockedCount}/{userProgress.totalCount}
                                            </Text>
                                            {canClaim && <View style={styles.claimBadge} />}
                                        </View>
                                    </View>

                                    <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.charsScroll}>
                                        {bosses.map((boss: any) => {
                                            const isUnlocked = boss.isUnlocked;
                                            return (
                                                <TouchableOpacity
                                                    key={boss._id}
                                                    style={styles.charSlot}
                                                    activeOpacity={0.7}
                                                    disabled={!isUnlocked}
                                                    onPress={() => setSelectedChar({ ...boss, themeColor: collection.themeColor })}
                                                >
                                                    <View style={[styles.charImageWrapper, { borderColor: isUnlocked ? collection.themeColor : 'rgba(93, 64, 55, 0.2)' }]}>
                                                        {isUnlocked ? (
                                                            <Image source={{ uri: boss.avatarImageUrl }} style={styles.charImage} />
                                                        ) : (
                                                            <View style={styles.charLocked}>
                                                                <Text style={{ fontSize: 24, opacity: 0.5 }}>?</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={[styles.charName, !isUnlocked && { color: COLORS.clayText }]} numberOfLines={1}>
                                                        {isUnlocked ? boss.title : 'Bí ẩn'}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {canClaim && (
                                        <TouchableOpacity
                                            style={[styles.claimButton, { backgroundColor: collection.themeColor }]}
                                            onPress={async () => {
                                                if (isClaiming) return;
                                                setIsClaiming(true);
                                                try {
                                                    const res = await apiService.claimCollectionReward(collection._id);
                                                    Alert.alert('Chúc mừng!', `Bạn đã nhận được ${res.ticketsGranted} vé Gacha!`);
                                                    setCollections(prev => prev.map(c => c.collection._id === collection._id ? { ...c, userProgress: { ...c.userProgress, bonusTicketsClaimed: true } } : c));
                                                    refreshUser();
                                                } catch (error: any) {
                                                    Alert.alert('Lỗi', error.response?.data?.error || 'Không thể nhận thưởng');
                                                } finally {
                                                    setIsClaiming(false);
                                                }
                                            }}
                                        >
                                            <Text style={styles.claimButtonText}>Nhận Thưởng +{collection.bonusTickets}🎟️</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: COLORS.clayText, opacity: 0.6 }}>Bạn chưa có bộ sưu tập nào.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Char Modal */}
            <Modal
                visible={!!selectedChar}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedChar(null)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedChar(null)}>
                    <View style={[styles.modalContent, { borderColor: selectedChar?.themeColor || '#ccc' }]}>
                        <Image source={{ uri: selectedChar?.avatarImageUrl }} style={styles.modalCharImage} />
                        <View style={[styles.modalCharNameBadge, { backgroundColor: selectedChar?.themeColor || '#ccc' }]}>
                            <Text style={styles.modalCharNameText}>{selectedChar?.title}</Text>
                        </View>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedChar(null)}>
                            <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: COLORS.warmBg,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.clayLight,
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
        letterSpacing: -0.5,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 80
    },
    collectionsContainer: {
        gap: 16,
    },
    collectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        ...SHADOWS.clayLight,
    },
    collectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    collectionIcon: {
        fontSize: 24,
    },
    collectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    collectionProgress: {
        fontSize: 14,
        color: COLORS.clayText,
        fontWeight: '600',
    },
    claimBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
    },
    charsScroll: {
        gap: 12,
        paddingBottom: 4,
    },
    charSlot: {
        alignItems: 'center',
        width: 70,
    },
    charImageWrapper: {
        width: 60,
        height: 60,
        borderRadius: 16,
        borderWidth: 2,
        marginBottom: 8,
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
    },
    charImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    charLocked: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    charName: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.clayText,
        textAlign: 'center',
    },
    claimButton: {
        marginTop: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    claimButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: 280,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 8,
        alignItems: 'center',
        borderWidth: 4,
    },
    modalCharImage: {
        width: '100%',
        height: 280,
        borderRadius: 16,
        resizeMode: 'cover',
    },
    modalCharNameBadge: {
        position: 'absolute',
        bottom: -16,
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 20,
        ...SHADOWS.clay,
    },
    modalCharNameText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
