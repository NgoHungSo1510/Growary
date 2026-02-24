import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Đăng nhập thất bại', error.response?.data?.error || 'Có lỗi xảy ra');
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

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- HEADER: AVATAR & TITLE --- */}
                <View style={styles.headerContainer}>
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={[COLORS.clayAccent1, COLORS.clayAccent2]}
                            style={styles.avatarGlow}
                        />
                        <View style={styles.avatarFrame}>
                            <Image
                                source={{
                                    uri: 'https://cdn3d.iconscout.com/3d/premium/thumb/cute-robot-waving-hand-6332707-5209353.png',
                                }}
                                style={styles.avatarImage}
                            />
                        </View>
                    </View>

                    <View style={styles.textWrapper}>
                        <Text style={styles.welcomeText}>Welcome Back!</Text>
                        <Text style={styles.subtitleText}>Ready to complete some quests?</Text>
                    </View>
                </View>

                {/* --- FORM --- */}
                <View style={styles.formContainer}>
                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="mail" size={20} color="rgba(93, 64, 55, 0.4)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="hero@questapp.com"
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
                        <View style={styles.passwordHeader}>
                            <Text style={styles.label}>Password</Text>
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Forgot?</Text>
                            </TouchableOpacity>
                        </View>
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

                    {/* Login Button */}
                    <TouchableOpacity
                        style={styles.loginBtn}
                        activeOpacity={0.8}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={[COLORS.clayAccent2, '#E91E63']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.loginBtnGradient, isLoading && { opacity: 0.7 }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.loginBtnText}>Login</Text>
                                    <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* --- DIVIDER --- */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* --- SOCIAL BUTTONS --- */}
                <View style={styles.socialRow}>
                    <TouchableOpacity style={styles.socialBtn}>
                        <AntDesign name="google" size={24} color="#DB4437" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn}>
                        <AntDesign name={"apple-o" as any} size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* --- SIGN UP LINK --- */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>New here? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.signUpText}>Sign Up</Text>
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
        justifyContent: 'center',
        padding: 30,
        paddingTop: 60,
    },

    // Blobs
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blobTop: {
        top: -height * 0.1,
        left: -width * 0.1,
        width: width * 0.6,
        height: width * 0.6,
        backgroundColor: 'rgba(251, 155, 143, 0.2)',
    },
    blobBottom: {
        bottom: -height * 0.1,
        right: -width * 0.1,
        width: width * 0.7,
        height: width * 0.7,
        backgroundColor: 'rgba(245, 119, 153, 0.1)',
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarWrapper: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 70,
        opacity: 0.3,
        transform: [{ scale: 1.1 }],
    },
    avatarFrame: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: COLORS.warmBg,
        padding: 8,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    textWrapper: {
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 4,
    },
    subtitleText: {
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
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.8,
        marginLeft: 8,
        marginBottom: 8,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    forgotText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
        marginRight: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warmBg,
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
        color: COLORS.clayText,
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 10,
        marginRight: 6,
    },

    // Button
    loginBtn: {
        marginTop: 10,
        borderRadius: 16,
        shadowColor: '#F57799',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    loginBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    loginBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },

    // Divider
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
        opacity: 0.6,
    },
    dividerLine: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(93, 64, 55, 0.1)',
        borderRadius: 1,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginHorizontal: 16,
        opacity: 0.5,
    },

    // Social
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialBtn: {
        width: 64,
        height: 64,
        backgroundColor: COLORS.warmBg,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: COLORS.clayText,
        opacity: 0.7,
        fontWeight: '500',
    },
    signUpText: {
        color: COLORS.clayAccent2,
        fontWeight: 'bold',
    },
});
