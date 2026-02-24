import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
    const navigation = useNavigation<RegisterScreenNavigationProp>();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }
        if (!agreed) {
            Alert.alert('Lỗi', 'Vui lòng đồng ý với điều khoản sử dụng');
            return;
        }

        setIsLoading(true);
        try {
            await register(name, email, password);
        } catch (error: any) {
            Alert.alert('Đăng ký thất bại', error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" />

            {/* Background Blobs */}
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            {/* Floating Decor Icons */}
            <View style={[styles.floatIcon, styles.iconMap]}>
                <MaterialIcons name="map" size={24} color="#FFF" />
            </View>
            <View style={[styles.floatIcon, styles.iconStar]}>
                <MaterialIcons name="star" size={20} color="#FFF" />
            </View>
            <View style={[styles.floatIcon, styles.iconPuzzle]}>
                <MaterialIcons name="extension" size={32} color="#FFF" />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- HEADER --- */}
                <View style={styles.header}>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.titleText}>
                            Start Your{'\n'}
                            <Text style={{ color: COLORS.clayAccent2 }}>Quest!</Text>
                        </Text>
                        <View style={styles.bgIconSwords}>
                            <MaterialIcons name="security" size={80} color={COLORS.clayAccent1} />
                        </View>
                    </View>
                    <Text style={styles.subtitleText}>Create your character to begin.</Text>
                </View>

                {/* --- FORM --- */}
                <View style={styles.formContainer}>
                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ADVENTURER NAME</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="badge" size={20} color="rgba(93, 64, 55, 0.4)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Sir CodeAlot"
                                placeholderTextColor="rgba(93, 64, 55, 0.3)"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>SCROLL (EMAIL)</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="mail" size={20} color="rgba(93, 64, 55, 0.4)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="hero@quest.com"
                                placeholderTextColor="rgba(93, 64, 55, 0.3)"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>SECRET KEY</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="lock" size={20} color="rgba(93, 64, 55, 0.4)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(93, 64, 55, 0.3)"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility' : 'visibility-off'}
                                    size={20}
                                    color="rgba(93, 64, 55, 0.4)"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Checkbox */}
                    <View style={styles.checkboxRow}>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => setAgreed(!agreed)}
                        >
                            {agreed && <MaterialIcons name="check" size={16} color={COLORS.clayAccent2} />}
                        </TouchableOpacity>
                        <Text style={styles.checkboxText}>
                            I agree to the <Text style={styles.linkText}>Guild Rules</Text> & Terms.
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitBtn}
                        activeOpacity={0.8}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={[COLORS.clayAccent2, '#E91E63']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.btnGradient, isLoading && { opacity: 0.7 }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.btnText}>Create Account</Text>
                                    <MaterialIcons name="arrow-forward" size={24} color="#FFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* --- FOOTER --- */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already a member?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Log in to Realm</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 30,
        paddingTop: 80,
        justifyContent: 'center',
    },

    // Blobs
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blobTop: {
        top: -height * 0.1,
        left: -width * 0.1,
        width: width * 0.7,
        height: width * 0.5,
        backgroundColor: 'rgba(251, 155, 143, 0.2)',
    },
    blobBottom: {
        bottom: -height * 0.1,
        right: -width * 0.1,
        width: width * 0.8,
        height: width * 0.6,
        backgroundColor: 'rgba(245, 119, 153, 0.15)',
    },

    // Floating Icons
    floatIcon: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 10,
    },
    iconMap: {
        top: 60,
        right: 30,
        width: 48,
        height: 48,
        backgroundColor: '#FDC3A1',
        transform: [{ rotate: '12deg' }],
    },
    iconStar: {
        top: 100,
        left: 30,
        width: 32,
        height: 32,
        backgroundColor: '#FDC3A1',
    },
    iconPuzzle: {
        bottom: 120,
        left: 40,
        width: 64,
        height: 64,
        backgroundColor: COLORS.clayCard,
        transform: [{ rotate: '-15deg' }],
        opacity: 0.8,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    titleWrapper: {
        position: 'relative',
    },
    titleText: {
        fontSize: 42,
        fontWeight: '900',
        color: COLORS.clayText,
        textAlign: 'center',
        lineHeight: 46,
        zIndex: 2,
    },
    bgIconSwords: {
        position: 'absolute',
        top: -20,
        left: -30,
        opacity: 0.15,
        transform: [{ rotate: '-12deg' }],
        zIndex: 1,
    },
    subtitleText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.clayText,
        opacity: 0.6,
    },

    // Form
    formContainer: {
        width: '100%',
        gap: 20,
    },
    inputGroup: {
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.8,
        marginLeft: 16,
        marginBottom: 8,
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        height: 56,
        borderWidth: 2,
        borderColor: COLORS.inputBorder,
    },
    inputIcon: {
        marginLeft: 16,
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.clayText,
    },
    eyeIcon: {
        padding: 10,
        marginRight: 6,
    },

    // Checkbox
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        marginTop: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        backgroundColor: COLORS.inputBg,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.clayText,
        opacity: 0.7,
    },
    linkText: {
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
        textDecorationLine: 'underline',
    },

    // Button
    submitBtn: {
        marginTop: 10,
        borderRadius: 16,
        shadowColor: '#F57799',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    btnText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 0.5,
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 40,
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: COLORS.clayText,
        opacity: 0.7,
        fontWeight: '500',
    },
    loginLink: {
        marginTop: 4,
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
        textDecorationLine: 'underline',
    },
});
