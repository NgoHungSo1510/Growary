import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClayHeader from '../components/ClayHeader';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const MYSTERY_TITLES = [
    "Nhân vật bí ẩn nào đây?",
    "Liệu bạn có kịp mở khóa nhân vật lần này không?",
    "Một bóng đen bí ẩn đang chờ bạn...",
    "Hãy thu thập sức mạnh để giải mã!",
    "Bí ẩn sắp được hé lộ!"
];

export default function EventScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [activeBosses, setActiveBosses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const mysteryTitleRef = React.useRef(MYSTERY_TITLES[Math.floor(Math.random() * MYSTERY_TITLES.length)]).current;

    useFocusEffect(
        useCallback(() => {
            const checkBoss = async () => {
                try {
                    const res = await apiService.get('/events/boss/active');
                    if (res.activeBosses) {
                        setActiveBosses(res.activeBosses);
                    } else {
                        setActiveBosses([]);
                    }
                } catch {
                    setActiveBosses([]);
                } finally {
                    setIsLoading(false);
                }
            };
            checkBoss();
        }, [])
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.warmBg} />
            <ClayHeader user={user} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionDesc}>Hệ thống Gamification độc quyền chia làm 4 mùa. Tham gia ngay để thu thập vật phẩm hiếm!</Text>

                {/* Mở Khóa Nhân Vật */}
                {activeBosses.length > 0 ? (
                    activeBosses.map((boss) => (
                        <TouchableOpacity
                            key={boss._id}
                            style={styles.cardContainer}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('BossEvent', { bossId: boss._id })}
                        >
                            <LinearGradient
                                colors={boss.colorBg ? [boss.colorBg, '#0f172a'] : ['#ef4444', '#991b1b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                {/* V2 Boss Thumbnail Background */}
                                {boss.avatarImageUrl && (
                                    <View style={StyleSheet.absoluteFill}>
                                        <Image source={{ uri: boss.avatarImageUrl }} style={styles.bgImage} />
                                        <View style={styles.darkOverlay} />
                                    </View>
                                )}
                                
                                <View style={styles.contentWrap}>
                                    {/* Icon / Thumbnail Box */}
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)', overflow: 'hidden' }]}>
                                        {boss.avatarImageUrl ? (
                                            <>
                                                <Image source={{ uri: boss.avatarImageUrl }} style={styles.thumbnailImg} />
                                                {boss.currentHp > 0 && (
                                                    <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="dark" />
                                                )}
                                            </>
                                        ) : (
                                            <MaterialIcons name="local-fire-department" size={40} color="#FFF" />
                                        )}
                                    </View>

                                    <View style={styles.textContainer}>
                                        <Text style={styles.cardTitle}>
                                            {boss.currentHp <= 0 ? boss.title : (boss.secretDescription || 'Nhân vật bí ẩn')}
                                        </Text>
                                        
                                        <View style={styles.badgeRow}>
                                            {boss.isLimited && (
                                                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                                                    <Text style={styles.badgeText}>LIMITED</Text>
                                                </View>
                                            )}
                                            {boss.collectionId && (
                                                <View style={[styles.badge, { backgroundColor: '#fbbf24' }]}>
                                                    <Text style={styles.badgeText}>COLLECTION</Text>
                                                </View>
                                            )}
                                            {boss.loreTitle && (
                                                <View style={[styles.badge, { backgroundColor: '#8b5cf6' }]}>
                                                    <Text style={styles.badgeText}>STORY</Text>
                                                </View>
                                            )}
                                            {!boss.isLimited && !boss.collectionId && (
                                                <Text style={styles.cardSubtitle}>HOT EVENT</Text>
                                            )}
                                        </View>

                                        <Text style={styles.cardDesc} numberOfLines={2}>
                                            {boss.currentHp <= 0 ? boss.description : mysteryTitleRef}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.actionBtn}>
                                        <MaterialIcons name="chevron-right" size={24} color="#FFF" />
                                    </View>
                                </View>
                                
                                {!boss.avatarImageUrl && (
                                    <MaterialIcons name="pets" size={100} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))
                ) : !isLoading ? (
                    <TouchableOpacity
                        style={styles.cardContainer}
                        activeOpacity={1}
                    >
                        <LinearGradient
                            colors={['#ef4444', '#991b1b']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        >
                            <View style={styles.contentWrap}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)', overflow: 'hidden' }]}>
                                    <MaterialIcons name="local-fire-department" size={40} color="#FFF" />
                                </View>

                                <View style={styles.textContainer}>
                                    <Text style={styles.cardTitle}>Mở Khóa Nhân Vật</Text>
                                    <Text style={styles.cardSubtitle}>HOT EVENT</Text>
                                    <Text style={styles.cardDesc} numberOfLines={2}>Tích lũy XP để gây sát thương và chia nhau phần thưởng.</Text>
                                </View>
                                
                                <View style={styles.actionBtn}>
                                    <MaterialIcons name="lock" size={24} color="#FFF" />
                                </View>
                            </View>
                            <MaterialIcons name="pets" size={100} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
                            
                            <View style={styles.lockOverlay}>
                                <MaterialIcons name="lock" size={28} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.lockText}>Chưa có Nhân Vật</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : null}

                {/* Concept 2: Sổ Sứ Mệnh */}
                <TouchableOpacity
                    style={[styles.cardContainer, { opacity: 0.8 }]}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#f59e0b', '#b45309']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        <View style={styles.contentWrap}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                <MaterialIcons name="menu-book" size={40} color="#FFF" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Sổ Sứ Mệnh</Text>
                                <Text style={styles.cardSubtitle}>Concept 2</Text>
                                <Text style={styles.cardDesc}>Chuỗi nhiệm vụ theo cấp tuyến tính. Tính năng đang được phát triển, đón chờ nhé!</Text>
                            </View>
                            <View style={[styles.actionBtn, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                                <MaterialIcons name="lock" size={20} color="#FFF" />
                            </View>
                        </View>
                        <MaterialIcons name="library-books" size={100} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Concept 3: Vòng Quay Nhân Phẩm */}
                <TouchableOpacity
                    style={styles.cardContainer}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('GachaEvent')}
                >
                    <LinearGradient
                        colors={['#8b5cf6', '#5b21b6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        <View style={styles.contentWrap}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                <MaterialIcons name="casino" size={40} color="#FFF" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Vòng Quay Nhân Phẩm</Text>
                                <Text style={styles.cardSubtitle}>Mở 24/7</Text>
                                <Text style={styles.cardDesc}>Dùng Vé Quay thưởng để thử vận may nhận thiết bị, xp, xu, và vật phẩm đặc biệt.</Text>
                            </View>
                            <View style={styles.actionBtn}>
                                <MaterialIcons name="chevron-right" size={24} color="#FFF" />
                            </View>
                        </View>
                        <MaterialIcons name="motion-photos-auto" size={100} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Concept 4: Bộ Sưu Tập */}
                <TouchableOpacity
                    style={styles.cardContainer}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Collection')}
                >
                    <LinearGradient
                        colors={['#10b981', '#047857']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        <View style={styles.contentWrap}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                <MaterialIcons name="collections-bookmark" size={40} color="#FFF" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Bộ Sưu Tập</Text>
                                <Text style={styles.cardSubtitle}>Concept 4</Text>
                                <Text style={styles.cardDesc}>Chụp ảnh, thu thập và ghi lại vật phẩm theo chủ đề. AI xác nhận, nhận thưởng ngay!</Text>
                            </View>
                            <View style={styles.actionBtn}>
                                <MaterialIcons name="chevron-right" size={24} color="#FFF" />
                            </View>
                        </View>
                        <MaterialIcons name="eco" size={100} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Concept 5: Sự Kiện Quiz */}
                <TouchableOpacity
                    style={styles.cardContainer}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('QuizEvent')}
                >
                    <LinearGradient
                        colors={['#2563EB', '#1D4ED8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        <View style={styles.contentWrap}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                <MaterialIcons name="psychology" size={40} color="#FFF" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Thử Thách Trí Tuệ</Text>
                                <Text style={styles.cardSubtitle}>Concept 5</Text>
                                <Text style={styles.cardDesc}>Tham gia các vòng thi trắc nghiệm giới hạn thời gian để nhận thưởng Xu hấp dẫn.</Text>
                            </View>
                            <View style={styles.actionBtn}>
                                <MaterialIcons name="chevron-right" size={24} color="#FFF" />
                            </View>
                        </View>
                        <MaterialIcons name="quiz" size={100} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 16,
        gap: 20,
        paddingBottom: 120
    },
    sectionDesc: {
        fontSize: 14,
        color: 'rgba(93, 64, 55, 0.7)',
        fontWeight: '500',
        marginBottom: 8,
        lineHeight: 20,
    },
    cardContainer: {
        borderRadius: 24,
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    cardGradient: {
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    bgImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        opacity: 0.4,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    contentWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    thumbnailImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
        marginBottom: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFF',
    },
    cardSubtitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    cardDesc: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 18,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        transform: [{ rotate: '-15deg' }],
        zIndex: 1,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        gap: 4,
    },
    lockText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
    },
});
