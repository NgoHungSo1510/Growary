import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { COLORS, FONT_SIZES, SHADOWS } from '../theme';
import { VipMiniCard } from '../components/VipMiniCard';
import { VipStatusResponse } from '../types';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
    const { user, refreshUser, logout } = useAuth();
    const navigation = useNavigation<any>();
    const [isUploading, setIsUploading] = useState(false);
    const [vipResponse, setVipResponse] = useState<VipStatusResponse | null>(null);
    const [showVipTiers, setShowVipTiers] = useState(false);

    const level = user?.level || 1;
    const levelTitle =
        level >= 10 ? 'Master' : level >= 5 ? 'Adventurer' : 'Beginner';

    React.useEffect(() => {
        apiService.getVipStatus()
            .then(data => setVipResponse(data))
            .catch(console.error);
    }, []);

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
        ]);
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setIsUploading(true);
                // 1. Upload the image using the existing upload endpoint
                const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;
                const uploadRes = await apiService.uploadProofImage(base64Data);

                // 2. Update user profile with the new avatar URL
                await apiService.updateProfile({ avatar: uploadRes.url });

                // 3. Refresh context
                await refreshUser();
                Alert.alert('Thành công', 'Đổi ảnh đại diện thành công!');
            }
        } catch (error) {
            console.error('Failed to update avatar:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Blobs */}
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- HEADER --- */}
                <View style={styles.header}>
                    <Text style={styles.screenTitle}>My Profile</Text>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarFrame}>
                            <LinearGradient
                                colors={[COLORS.clayAccent1, COLORS.clayAccent2]}
                                style={styles.avatarGradient}
                            >
                                <Image
                                    source={{
                                        uri: user?.avatar || 'https://cdn3d.iconscout.com/3d/premium/thumb/cute-robot-waving-hand-6332707-5209353.png',
                                    }}
                                    style={styles.avatarImage}
                                />
                                {isUploading && (
                                    <View style={styles.uploadingOverlay}>
                                        <ActivityIndicator color="#FFF" />
                                    </View>
                                )}
                            </LinearGradient>
                        </View>

                        <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage} disabled={isUploading}>
                            <MaterialIcons name="photo-camera" size={20} color={COLORS.clayAccent2} />
                        </TouchableOpacity>
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.username || 'Adventurer'}</Text>
                        <Text style={styles.userLevel}>
                            Level {level} • {levelTitle}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage} disabled={isUploading}>
                        <Text style={styles.changePhotoText}>{isUploading ? 'Đang tải lên...' : 'Change Photo'}</Text>
                    </TouchableOpacity>
                </View>

                {/* --- VIP STATUS --- */}
                {vipResponse && (
                    <View style={{ marginBottom: 24 }}>
                        <VipMiniCard
                            vipStatus={vipResponse.status}
                        />

                        {/* --- FULL VIP DETAIL SECTION --- */}
                        <View style={styles.vipDetailContainer}>
                            <Text style={styles.sectionHeading}>Quyền lợi hiện tại:</Text>
                            <View style={styles.benefitsBox}>
                                <Text style={styles.benefitRow}>• Cashback <Text style={styles.highlightText}>{vipResponse.status.currentTier.cashbackPercent}%</Text> / tháng</Text>
                                <Text style={styles.benefitRow}>• Chiết khấu <Text style={styles.highlightText}>{vipResponse.status.currentTier.discountPercent}%</Text> mỗi lần mua</Text>
                                <Text style={styles.benefitRow}>• Tháng này đang tích: <Text style={styles.highlightText}>{vipResponse.status.pendingCashback.toLocaleString()} coins</Text></Text>
                            </View>

                            <TouchableOpacity
                                style={styles.collapseHeader}
                                onPress={() => setShowVipTiers(!showVipTiers)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.sectionHeading}>BẢNG 12 CẤP VIP</Text>
                                <MaterialIcons name={showVipTiers ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={COLORS.clayText} />
                            </TouchableOpacity>

                            {showVipTiers && (
                                <View style={styles.tiersList}>
                                    {vipResponse.allTiers.map(tier => {
                                        const isCurrent = tier.tier === vipResponse.status.currentTier.tier;
                                        const isReached = tier.tier < vipResponse.status.currentTier.tier;
                                        return (
                                            <View key={tier.tier} style={[styles.tierRow, isCurrent && styles.tierRowCurrent]}>
                                                <Text style={[styles.tierCol1, { color: tier.color, fontWeight: isCurrent ? 'bold' : 'normal' }]}>Tier {tier.tier}</Text>
                                                <Text style={[styles.tierCol2, { color: tier.color, fontWeight: isCurrent ? 'bold' : 'normal' }]}>{tier.name}</Text>
                                                <Text style={[styles.tierCol3, { color: 'rgba(93, 64, 55, 0.5)' }]}>{tier.minSpending.toLocaleString()}</Text>
                                                {isCurrent && <Text style={styles.tierTagCurrent}>← BẠN ĐÂY</Text>}
                                                {isReached && <Text style={styles.tierTagReached}>(Đã đạt)</Text>}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {vipResponse.history && vipResponse.history.length > 0 && (
                                <View style={styles.historyContainer}>
                                    <Text style={styles.sectionHeading}>LỊCH SỬ LÊN HẠNG</Text>
                                    {vipResponse.history.map((h, i) => (
                                        <Text key={i} style={styles.historyRow}>
                                            • {h.tierName} — {new Date(h.date).toLocaleDateString('vi-VN')}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* --- SETTINGS LIST --- */}
                <View style={styles.settingsList}>
                    {/* Account Info */}
                    <TouchableOpacity style={styles.clayTile} activeOpacity={0.7} onPress={() => navigation.navigate('EditProfile')}>
                        <View style={styles.tileLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                <MaterialIcons name="person" size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.tileTitle}>Account Info</Text>
                                <Text style={styles.tileSubtitle}>
                                    {user?.email || 'Email, Password, Username'}
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="rgba(93, 64, 55, 0.3)" />
                    </TouchableOpacity>

                    {/* Notifications */}
                    <TouchableOpacity style={styles.clayTile} activeOpacity={0.7}>
                        <View style={styles.tileLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                                <MaterialIcons name="notifications" size={24} color="#9333EA" />
                            </View>
                            <View>
                                <Text style={styles.tileTitle}>Notifications</Text>
                                <Text style={styles.tileSubtitle}>Quest alerts, Daily reminders</Text>
                            </View>
                        </View>
                        <View style={styles.toggleSwitch}>
                            <View style={styles.toggleKnob} />
                        </View>
                    </TouchableOpacity>

                    {/* App Theme */}
                    <TouchableOpacity style={styles.clayTile} activeOpacity={0.7}>
                        <View style={styles.tileLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#FFEDD5' }]}>
                                <MaterialIcons name="palette" size={24} color="#F97316" />
                            </View>
                            <View>
                                <Text style={styles.tileTitle}>App Theme</Text>
                                <Text style={styles.tileSubtitle}>Warm Claymorphism</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="rgba(93, 64, 55, 0.3)" />
                    </TouchableOpacity>

                    {/* Help & Support */}
                    <TouchableOpacity style={styles.clayTile} activeOpacity={0.7}>
                        <View style={styles.tileLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                <MaterialIcons name="help" size={24} color="#16A34A" />
                            </View>
                            <View>
                                <Text style={styles.tileTitle}>Help & Support</Text>
                                <Text style={styles.tileSubtitle}>FAQ, Contact Us</Text>
                            </View>
                        </View>
                        <MaterialIcons name="open-in-new" size={20} color="rgba(93, 64, 55, 0.3)" />
                    </TouchableOpacity>
                </View>

                {/* --- LOGOUT --- */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    activeOpacity={0.8}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={20} color="#FFF" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>App Version {Constants.expoConfig?.version || '1.1.0'} (Beta)</Text>

                <View style={{ height: 80 }} />
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
        paddingTop: 60,
        paddingBottom: 40
    },

    // Blobs
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blobTop: {
        top: -height * 0.1,
        left: -width * 0.2,
        width: width * 0.6,
        height: width * 0.6,
        backgroundColor: 'rgba(251, 155, 143, 0.2)',
    },
    blobBottom: {
        bottom: height * 0.1,
        right: -width * 0.1,
        width: width * 0.5,
        height: width * 0.5,
        backgroundColor: 'rgba(245, 119, 153, 0.15)',
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    avatarContainer: {
        width: 128,
        height: 128,
        position: 'relative',
        marginBottom: 16,
    },
    avatarFrame: {
        width: '100%',
        height: '100%',
        borderRadius: 64,
        backgroundColor: COLORS.warmBg,
        padding: 6,
        borderWidth: 6,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#D29664',
        shadowOffset: { width: 10, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    avatarGradient: {
        flex: 1,
        borderRadius: 60,
        overflow: 'hidden',
        padding: 2,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFDF5',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 12,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.clayText,
        marginBottom: 4,
    },
    userLevel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.clayText,
        opacity: 0.6,
    },
    changePhotoBtn: {
        backgroundColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    changePhotoText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(93, 64, 55, 0.8)',
    },

    // Settings List
    settingsList: {
        gap: 16,
        marginBottom: 30,
    },
    clayTile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFDF5',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#D29664',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    tileLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tileTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    tileSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.clayText,
        opacity: 0.5,
        marginTop: 2,
    },

    // Toggle
    toggleSwitch: {
        width: 44,
        height: 24,
        backgroundColor: COLORS.clayAccent2,
        borderRadius: 12,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'flex-end',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    toggleKnob: {
        width: 20,
        height: 20,
        backgroundColor: '#FFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 2,
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.clayAccent1,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: '#C86464',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    versionText: {
        textAlign: 'center',
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.3,
        marginLeft: 16,
    },

    // --- VIP Detail Styles ---
    vipDetailContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 20,
        ...SHADOWS.clayLight,
    },
    sectionHeading: {
        fontSize: FONT_SIZES.subtitle,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 12,
        marginTop: 8,
    },
    benefitsBox: {
        backgroundColor: 'rgba(251, 155, 143, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    benefitRow: {
        fontSize: FONT_SIZES.body,
        color: COLORS.clayText,
        marginBottom: 6,
    },
    highlightText: {
        fontWeight: 'bold',
        color: COLORS.clayAccent1,
    },
    collapseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    tiersList: {
        marginTop: 12,
        marginBottom: 20,
    },
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    tierRowCurrent: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        borderBottomWidth: 0,
    },
    tierCol1: {
        flex: 1,
        fontSize: FONT_SIZES.caption,
    },
    tierCol2: {
        flex: 1.5,
        fontSize: FONT_SIZES.caption,
    },
    tierCol3: {
        flex: 1,
        fontSize: FONT_SIZES.caption,
        textAlign: 'right',
    },
    tierTagCurrent: {
        position: 'absolute',
        right: 8,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    tierTagReached: {
        position: 'absolute',
        right: 0,
        fontSize: 10,
        color: 'rgba(93, 64, 55, 0.5)',
    },
    historyContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    historyRow: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.clayText,
        marginBottom: 8,
    }
});
