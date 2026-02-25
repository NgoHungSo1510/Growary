import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { COLORS, FONT_SIZES } from '../theme';

export default function EditProfileScreen({ navigation }: any) {
    const { user, refreshUser } = useAuth();

    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data: any = {};
            if (username && username !== (user?.username || '')) data.username = username;
            if (email !== (user?.email || '')) data.email = email;
            if (newPassword) {
                data.currentPassword = currentPassword;
                data.newPassword = newPassword;
            }

            if (Object.keys(data).length === 0) {
                Alert.alert('', 'Không có thay đổi nào.');
                setIsSaving(false);
                return;
            }

            await apiService.updateProfile(data);
            await refreshUser();
            Alert.alert('✅ Thành công', 'Thông tin đã được cập nhật!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể cập nhật.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialIcons name="arrow-back" size={24} color={COLORS.clayText} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Account Info</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>Thông tin cá nhân</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên tài khoản (Tên hiển thị)</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="badge" size={20} color={COLORS.clayAccent2} />
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Nhập tên tài khoản"
                                    placeholderTextColor="rgba(93,64,55,0.3)"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="email" size={20} color={COLORS.clayAccent2} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="example@mail.com"
                                    placeholderTextColor="rgba(93,64,55,0.3)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>Đổi mật khẩu</Text>
                        <Text style={styles.sectionHint}>Để trống nếu không muốn đổi</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu hiện tại</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock" size={20} color="rgba(93,64,55,0.4)" />
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(93,64,55,0.3)"
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu mới</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock-outline" size={20} color="rgba(93,64,55,0.4)" />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(93,64,55,0.3)"
                                    secureTextEntry
                                />
                            </View>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="check" size={20} color="#FFF" />
                        <Text style={styles.saveBtnText}>
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingTop: 56,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },

    // Form
    formSection: {
        marginBottom: 28,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    sectionHint: {
        fontSize: 12,
        color: COLORS.clayText,
        opacity: 0.4,
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.clayText,
        opacity: 0.6,
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFDF5',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#D29664',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.clayText,
        fontWeight: '500',
    },

    // Save
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.clayAccent2,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: COLORS.clayAccent2,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
