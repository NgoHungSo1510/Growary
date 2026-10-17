import React from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export interface ActiveBoss {
    _id: string;
    title: string;
    description: string;
    secretDescription?: string;
    startTime?: string;
    endTime?: string;
    weekActivatedAt?: string;
    maxHp: number;
    currentHp: number;
    baseRewardCoins: number;
    baseRewardXp?: number;
    gachaTickets?: number;
    rewardItems?: any[];
    status: string;
    colorBg?: string;
    colorIcon?: string;
    iconName?: string;
    avatarImageUrl?: string;
    loreTitle?: string;
    loreContent?: string;
    isLimited?: boolean;
    miniGameType?: string;
    miniGameQuestions?: Array<{ question: string; options: string[]; correctIndex: number }>;
    collectionId?: string;
}

interface BossBannerCardProps {
    boss: ActiveBoss;
    floatAnim: Animated.Value;
    isBossDefeated: boolean;
    mysteryTitle: string;
}

export const BossBannerCard: React.FC<BossBannerCardProps> = ({
    boss,
    floatAnim,
    isBossDefeated,
    mysteryTitle,
}) => {
    const hpPercent = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));

    return (
        <View style={[styles.bannerCard, { borderColor: boss.colorIcon || '#FFF' }]}>
            <LinearGradient
                colors={[boss.colorBg || '#1e293b', boss.colorBg || '#0f172a']}
                style={styles.bannerGradient}
            >
                {boss.avatarImageUrl ? (
                    <View style={StyleSheet.absoluteFill}>
                        <Image source={{ uri: boss.avatarImageUrl }} style={styles.bannerImage} />
                        {!isBossDefeated && (
                            <>
                                <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                                <View style={styles.lockIconOverlay}>
                                    <MaterialIcons name="lock" size={80} color="rgba(255,255,255,0.7)" />
                                </View>
                            </>
                        )}
                    </View>
                ) : (
                    <Animated.View style={[styles.floatIconWrapper, { transform: [{ translateY: floatAnim }] }]}>
                        <MaterialIcons
                            name={(boss.iconName as any) || 'smart-toy'}
                            size={140}
                            color={boss.colorIcon || '#FFF'}
                            style={styles.robotIconShadow}
                        />
                    </Animated.View>
                )}

                <View style={styles.bannerGlare} />

                <View style={styles.bannerContent}>
                    <View style={styles.badgeRow}>
                        {boss.isLimited && (
                            <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                                <Text style={styles.badgeText}>LIMITED</Text>
                            </View>
                        )}
                        {boss.loreTitle && (
                            <View style={[styles.badge, { backgroundColor: '#8b5cf6' }]}>
                                <Text style={styles.badgeText}>STORY</Text>
                            </View>
                        )}
                        {boss.collectionId && (
                            <View style={[styles.badge, { backgroundColor: '#fbbf24' }]}>
                                <Text style={styles.badgeText}>COLLECTION</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.bannerTitle}>
                        {isBossDefeated ? boss.title : boss.secretDescription || 'Nhân vật bí ẩn'}
                    </Text>
                    <Text style={styles.bannerSubtitle}>
                        {isBossDefeated ? boss.description : mysteryTitle}
                    </Text>
                </View>

                {/* Boss HP Bar */}
                <View style={styles.progressPanel}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>{isBossDefeated ? 'ĐÃ TIÊU DIỆT' : 'HP BOSS'}</Text>
                        <Text style={styles.progressLabel}>{Math.floor(boss.currentHp)} / {boss.maxHp}</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${hpPercent}%`, backgroundColor: boss.colorIcon || '#ef4444' }]} />
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    bannerCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    bannerGradient: {
        padding: 24,
        minHeight: 280,
        justifyContent: 'space-between',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    lockIconOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatIconWrapper: {
        position: 'absolute',
        right: 10,
        bottom: 40,
        opacity: 0.2,
    },
    robotIconShadow: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 8,
    },
    bannerGlare: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    bannerContent: {
        zIndex: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 18,
    },
    progressPanel: {
        marginTop: 20,
        zIndex: 1,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.8)',
    },
    progressBarTrack: {
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
});
