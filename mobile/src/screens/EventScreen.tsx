import React from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClayHeader from '../components/ClayHeader';
import { COLORS, FONT_SIZES } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function EventScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    return (
        <View style={[styles.container]}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.warmBg} />
            <ClayHeader user={user} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionDesc}>Hệ thống Gamification độc quyền chia làm 3 mùa. Tham gia ngay để thu thập vật phẩm hiếm!</Text>

                {/* Concept 1: Săn Boss */}
                <TouchableOpacity
                    style={styles.cardContainer}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('BossEvent')}
                >
                    <LinearGradient
                        colors={['#ef4444', '#991b1b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        <View style={styles.contentWrap}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                <MaterialIcons name="local-fire-department" size={40} color="#FFF" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Săn Boss Thế Giới</Text>
                                <Text style={styles.cardSubtitle}>Concept 1</Text>
                                <Text style={styles.cardDesc}>Tích lũy XP để gây sát thương và chia nhau Rương Thưởng khổng lồ khi Boss bị hạ gục.</Text>
                            </View>
                            <View style={styles.actionBtn}>
                                <MaterialIcons name="chevron-right" size={24} color="#FFF" />
                            </View>
                        </View>
                        {/* Overlay visual decoration */}
                        <MaterialIcons name="pets" size={100} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
                    </LinearGradient>
                </TouchableOpacity>

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
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
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
    }
});
