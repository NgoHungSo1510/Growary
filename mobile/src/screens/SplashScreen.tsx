import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    Easing,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;
    const loadWidthAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -15,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
                easing: Easing.linear,
            })
        ).start();

        Animated.timing(loadWidthAnim, {
            toValue: 0.84,
            duration: 2000,
            useNativeDriver: false,
        }).start();

        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const loadWidth = loadWidthAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* --- BACKGROUND BLOBS --- */}
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />
            <View style={[styles.blob, styles.blobMiddle]} />

            {/* --- TOP RIGHT: CLOUD SYNC --- */}
            <View style={styles.syncContainer}>
                <Text style={styles.syncText}>Cloud Sync</Text>
                <View style={styles.syncIconBox}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <MaterialIcons name="sync" size={16} color={COLORS.clayAccent2} />
                    </Animated.View>
                </View>
            </View>

            {/* --- CENTER CONTENT --- */}
            <View style={styles.contentContainer}>

                {/* 1. ANIMATED MASCOT AREA */}
                <Animated.View style={[styles.mascotWrapper, { transform: [{ translateY: floatAnim }] }]}>

                    {/* THE BOT BODY */}
                    <LinearGradient
                        colors={['#FFFFFF', '#FDC3A1', '#EBB090']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.botBody}
                    >
                        {/* Antenna */}
                        <View style={styles.antennaStem} />
                        <View style={styles.antennaBall} />

                        {/* Screen (Eyes) */}
                        <View style={styles.botScreen}>
                            <View style={styles.botEye} />
                            <View style={styles.botEye} />
                            <View style={styles.screenReflection} />
                        </View>

                        {/* Buttons */}
                        <View style={styles.botButtonsRow}>
                            <View style={[styles.botBtn, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
                            <View style={[styles.botBtn, { backgroundColor: 'rgba(251,155,143,0.6)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }]} />
                            <View style={[styles.botBtn, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
                        </View>

                        {/* Body Reflection */}
                        <View style={styles.bodyReflection} />
                    </LinearGradient>

                    {/* FLOATING ICONS */}
                    <View style={[styles.floatIcon, styles.boltIcon]}>
                        <MaterialIcons name="bolt" size={24} color="#FFF" />
                    </View>
                    <View style={[styles.floatIcon, styles.heartIcon]}>
                        <MaterialIcons name="favorite" size={20} color="#FFF" />
                    </View>

                </Animated.View>

                {/* 2. TEXT TITLE */}
                <View style={styles.textWrapper}>
                    <Text style={styles.titleText}>
                        Grow<Text style={{ color: COLORS.clayAccent2 }}>ary</Text>
                    </Text>
                    <Text style={styles.subtitleText}>Phát triển bản thân mỗi ngày</Text>
                </View>

                {/* 3. LOADING BAR */}
                <View style={styles.loadingWrapper}>
                    <View style={styles.loadingLabels}>
                        <Text style={styles.loadingLabelText}>LOADING...</Text>
                        <Text style={styles.loadingPercentText}>84%</Text>
                    </View>

                    <View style={styles.loadingTrack}>
                        <Animated.View style={[styles.loadingFill, { width: loadWidth }]}>
                            <LinearGradient
                                colors={[COLORS.clayAccent1, COLORS.clayAccent2]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flex: 1, width: '100%' }}
                            />

                            <Animated.View
                                style={[
                                    styles.shimmerOverlay,
                                    { transform: [{ translateX: shimmerTranslate }] }
                                ]}
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ flex: 1 }}
                                />
                            </Animated.View>
                        </Animated.View>
                    </View>
                </View>

            </View>

            {/* --- FOOTER VERSION --- */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Version 1.0.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.warmBg,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // --- BACKGROUND BLOBS ---
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blobTop: {
        top: -height * 0.15,
        left: -width * 0.2,
        width: width * 0.7,
        height: height * 0.5,
        backgroundColor: 'rgba(251, 155, 143, 0.2)',
    },
    blobBottom: {
        bottom: -height * 0.1,
        right: -width * 0.1,
        width: width * 0.8,
        height: height * 0.6,
        backgroundColor: 'rgba(245, 119, 153, 0.15)',
    },
    blobMiddle: {
        top: height * 0.3,
        right: -width * 0.1,
        width: width * 0.4,
        height: height * 0.3,
        backgroundColor: 'rgba(251, 239, 196, 0.6)',
    },

    // --- SYNC INDICATOR ---
    syncContainer: {
        position: 'absolute',
        top: 50,
        right: 30,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.6,
    },
    syncText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginRight: 8,
    },
    syncIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // --- CONTENT AREA ---
    contentContainer: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 30,
        gap: 40,
    },

    // --- MASCOT (BOT) STYLES ---
    mascotWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 200,
        height: 240,
        marginBottom: 20,
    },
    botBody: {
        width: 180,
        height: 210,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#A68A64",
        shadowOffset: { width: 12, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 20,
        overflow: 'visible',
    },
    antennaStem: {
        position: 'absolute',
        top: -20,
        width: 12,
        height: 20,
        backgroundColor: COLORS.clayAccent2,
        borderRadius: 6,
    },
    antennaBall: {
        position: 'absolute',
        top: -30,
        width: 24,
        height: 24,
        backgroundColor: COLORS.clayAccent2,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        elevation: 5,
    },
    botScreen: {
        width: 130,
        height: 90,
        backgroundColor: COLORS.clayText,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 10,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    botEye: {
        width: 24,
        height: 40,
        backgroundColor: COLORS.clayAccent2,
        borderRadius: 12,
        shadowColor: COLORS.clayAccent2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    screenReflection: {
        position: 'absolute',
        top: 8,
        left: 12,
        width: 30,
        height: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        transform: [{ rotate: '-12deg' }],
    },
    botButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    botBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    bodyReflection: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 24,
        opacity: 0.6,
    },

    // --- FLOATING ICONS ---
    floatIcon: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.clayAccent1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: "#D29664",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    boltIcon: {
        width: 48,
        height: 48,
        top: 20,
        right: -20,
        transform: [{ rotate: '12deg' }],
        backgroundColor: COLORS.clayAccent1,
    },
    heartIcon: {
        width: 40,
        height: 40,
        bottom: 20,
        left: -10,
        transform: [{ rotate: '-6deg' }],
        backgroundColor: COLORS.clayAccent2,
    },

    // --- TEXT STYLES ---
    textWrapper: {
        alignItems: 'center',
    },
    titleText: {
        fontSize: 40,
        fontWeight: '900',
        color: COLORS.clayText,
        letterSpacing: -1,
    },
    subtitleText: {
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.clayText,
        opacity: 0.6,
        marginTop: 5,
    },

    // --- LOADING BAR ---
    loadingWrapper: {
        width: 280,
    },
    loadingLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    loadingLabelText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.8,
        letterSpacing: 1,
    },
    loadingPercentText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
    },
    loadingTrack: {
        height: 32,
        width: '100%',
        backgroundColor: COLORS.clayInset,
        borderRadius: 16,
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    loadingFill: {
        height: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: "#A68A64",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '50%',
        height: '100%',
    },

    // --- FOOTER ---
    footer: {
        position: 'absolute',
        bottom: 40,
    },
    footerText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.3,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});
