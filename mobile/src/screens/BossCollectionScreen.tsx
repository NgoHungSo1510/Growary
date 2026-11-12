import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../theme';
import { BossCollectionWithProgress, CollectionCharacterItem } from '../types';
import { CharacterLorebookModal } from '../components/boss';
import { getEventCache, setEventCache, buildEventCacheKey } from '../utils/eventCache';

type SelectedCharacter = CollectionCharacterItem & {
    collectionTitle?: string;
    themeColor?: string;
};

export default function BossCollectionScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user, refreshUser } = useAuth();

    const [collections, setCollections] = useState<BossCollectionWithProgress[]>([]);
    const [selectedChar, setSelectedChar] = useState<SelectedCharacter | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    const cacheKey = buildEventCacheKey('my_boss_collections', user?._id);

    const loadCollections = useCallback(async () => {
        const cached = await getEventCache<BossCollectionWithProgress[]>(cacheKey);
        if (cached.data) {
            setCollections(cached.data);
        }

        try {
            const data = await apiService.getMyBossCollections();
            if (data?.collections) {
                setCollections(data.collections);
                await setEventCache(cacheKey, data.collections);
            }
        } catch {
            // Giữ nguyên cached data khi offline
        }
    }, [cacheKey]);

    useFocusEffect(
        useCallback(() => {
            loadCollections();
        }, [loadCollections])
    );

    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (route?.params?.collectionId && collections.length > 0) {
            const index = collections.findIndex((c) => c.collection._id === route.params.collectionId);
            if (index >= 0) {
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: index * 200, animated: true });
                }, 500);
            }
        }
    }, [route?.params, collections]);

    const handleClaim = async (collectionId: string, bonusTickets: number) => {
        if (isClaiming) return;
        setIsClaiming(true);
        try {
            const res = await apiService.claimCollectionReward(collectionId);
            Alert.alert('Chúc mừng!', `Bạn đã nhận được ${res.ticketsGranted || bonusTickets} vé Gacha!`);
            setCollections((prev) =>
                prev.map((c) =>
                    c.collection._id === collectionId
                        ? { ...c, userProgress: { ...c.userProgress, bonusTicketsClaimed: true } }
                        : c
                )
            );
            refreshUser();
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể nhận thưởng');
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.clayText} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Bộ Sưu Tập Nhân Vật</Text>
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
                        {collections.map((item) => {
                            const { collection, bosses, userProgress } = item;
                            const isCompleted = userProgress.isCompleted;
                            const canClaim = isCompleted && !userProgress.bonusTicketsClaimed;
                            const isHighlighted = route?.params?.collectionId === collection._id;
                            const themeColor = collection.themeColor || '#8B5CF6';

                            // Đưa nhân vật đã mở khóa lên đầu danh sách
                            const sortedBosses = [...bosses].sort(
                                (a, b) => Number(b.isUnlocked) - Number(a.isUnlocked)
                            );

                            return (
                                <View
                                    key={collection._id}
                                    style={[
                                        styles.collectionCard,
                                        {
                                            backgroundColor: `${themeColor}10`,
                                            borderColor: isHighlighted ? themeColor : `${themeColor}40`,
                                            borderWidth: isHighlighted ? 2.5 : 1.5,
                                        },
                                    ]}
                                >
                                    <View style={styles.collectionHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                            <Text style={styles.collectionIcon}>{collection.iconEmoji}</Text>
                                            <Text style={styles.collectionTitle} numberOfLines={1}>
                                                {collection.title}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={[styles.progressPill, { backgroundColor: `${themeColor}22` }]}>
                                                <Text style={[styles.collectionProgress, { color: themeColor }]}>
                                                    {userProgress.unlockedCount}/{userProgress.totalCount}
                                                </Text>
                                            </View>
                                            {canClaim && <View style={styles.claimBadge} />}
                                        </View>
                                    </View>

                                    <ScrollView
                                        horizontal
                                        nestedScrollEnabled
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.charsScroll}
                                    >
                                        {sortedBosses.map((boss) => {
                                            const isUnlocked = boss.isUnlocked;
                                            return (
                                                <TouchableOpacity
                                                    key={boss._id}
                                                    style={styles.charSlot}
                                                    activeOpacity={0.7}
                                                    disabled={!isUnlocked}
                                                    onPress={() =>
                                                        setSelectedChar({
                                                            ...boss,
                                                            collectionTitle: collection.title,
                                                            themeColor,
                                                        })
                                                    }
                                                >
                                                    <View
                                                        style={[
                                                            styles.charImageWrapper,
                                                            {
                                                                borderColor: isUnlocked
                                                                    ? themeColor
                                                                    : 'rgba(93, 64, 55, 0.2)',
                                                            },
                                                        ]}
                                                    >
                                                        {isUnlocked && boss.avatarImageUrl ? (
                                                            <Image
                                                                source={{ uri: boss.avatarImageUrl }}
                                                                style={styles.charImage}
                                                            />
                                                        ) : isUnlocked ? (
                                                            <View
                                                                style={[
                                                                    styles.charUnlockedPlaceholder,
                                                                    { backgroundColor: boss.colorBg || themeColor },
                                                                ]}
                                                            >
                                                                <MaterialIcons
                                                                    name={(boss.colorIcon as any) || 'pets'}
                                                                    size={26}
                                                                    color="#FFF"
                                                                />
                                                            </View>
                                                        ) : (
                                                            <View style={styles.charLocked}>
                                                                <MaterialIcons name="lock" size={20} color="rgba(93, 64, 55, 0.4)" />
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.charName,
                                                            !isUnlocked && { color: 'rgba(93, 64, 55, 0.5)' },
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {isUnlocked ? boss.title : 'Bí ẩn'}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {canClaim && (
                                        <TouchableOpacity
                                            style={[styles.claimButton, { backgroundColor: themeColor }]}
                                            onPress={() => handleClaim(collection._id, collection.bonusTickets)}
                                        >
                                            <Text style={styles.claimButtonText}>
                                                Nhận Thưởng +{collection.bonusTickets}🎟️
                                            </Text>
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

            {/* Character Lorebook Modal */}
            <CharacterLorebookModal
                visible={!!selectedChar}
                character={selectedChar}
                onClose={() => setSelectedChar(null)}
            />
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
        paddingTop: 56,
        paddingBottom: 16,
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
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    collectionsContainer: {
        gap: 20,
    },
    collectionCard: {
        borderRadius: 22,
        padding: 16,
        ...SHADOWS.clayLight,
    },
    collectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    collectionIcon: {
        fontSize: 24,
    },
    collectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    progressPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    collectionProgress: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    claimBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
    },
    charsScroll: {
        gap: 12,
        paddingVertical: 4,
    },
    charSlot: {
        width: 72,
        alignItems: 'center',
    },
    charImageWrapper: {
        width: 64,
        height: 64,
        borderRadius: 16,
        borderWidth: 2,
        overflow: 'hidden',
        backgroundColor: COLORS.warmBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    charImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    charUnlockedPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    charLocked: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(93, 64, 55, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    charName: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.clayText,
        textAlign: 'center',
    },
    claimButton: {
        marginTop: 14,
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
        ...SHADOWS.clayLight,
    },
    claimButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
});
