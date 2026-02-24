import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../theme';
import LevelTimelineModal from './LevelTimelineModal';
import LevelUpModal from './LevelUpModal';
import { apiService } from '../services/api';

interface ClayHeaderProps {
    username?: string;
    avatarUrl?: string;
    user?: any;
}

const ClayHeader: React.FC<ClayHeaderProps> = ({
    user,
    username = "Beginner Adventurer",
    avatarUrl = "https://cdn3d.iconscout.com/3d/premium/thumb/cute-robot-waving-hand-6332707-5209353.png"
}) => {
    const [showTimeline, setShowTimeline] = useState(false);
    const [levels, setLevels] = useState<any[]>([]);

    // Level Up tracking purely contained here
    const [showLevelUp, setShowLevelUp] = useState(false);
    const prevLevelRef = React.useRef(user?.level);

    React.useEffect(() => {
        // Fetch levels configuration on mount
        const fetchLevelData = async () => {
            try {
                const { levels } = await apiService.getLevels();
                setLevels(levels);
            } catch (e) {
                // ignore
            }
        };
        fetchLevelData();
    }, []);

    React.useEffect(() => {
        if (user?.level && prevLevelRef.current && user.level > prevLevelRef.current) {
            setShowLevelUp(true);
        }
        prevLevelRef.current = user?.level;
    }, [user?.level]);

    // Calculate XP Progress internally (Delta XP Pattern)
    const userXP = user?.xp || 0;
    const userLevel = user?.level || 1;
    const currentLvl = levels.find(l => l.level === userLevel);

    const displayCurrentXP = userXP;
    const displayMaxXP = currentLvl ? currentLvl.xpRequired : 200;
    const xpPercent = Math.min((displayCurrentXP / displayMaxXP) * 100, 100) + '%';

    // Fallbacks
    const name = user?.displayName || user?.username || username;
    const avatar = user?.avatar || avatarUrl;
    const coins = user?.coins || 0;
    const tickets = user?.gachaTickets || 0;

    return (
        <>
            <TouchableOpacity
                style={styles.headerContainer}
                activeOpacity={0.9}
                onPress={() => setShowTimeline(true)}
            >
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatarOuterRing}>
                        <LinearGradient
                            colors={[COLORS.clayAccent1, COLORS.clayAccent2]}
                            style={styles.avatarGradient}
                        >
                            <Image
                                source={{ uri: avatar }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                            />
                        </LinearGradient>
                    </View>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>LVL {userLevel}</Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.usernameText} numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={styles.xpText}>
                            <Text style={{ color: COLORS.clayAccent2 }}>{displayCurrentXP}</Text>
                            <Text style={{ opacity: 0.4 }}> / {displayMaxXP} XP</Text>
                        </Text>
                    </View>
                    <View style={styles.xpTrack}>
                        <View style={[styles.xpFill, { width: xpPercent as any }]}>
                            <View style={styles.xpShine} />
                        </View>
                    </View>
                </View>

                <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginLeft: 12 }}>
                    <View style={styles.coinContainer}>
                        <MaterialIcons name="monetization-on" size={16} color="#FFCA28" />
                        <Text style={styles.coinText}>{coins.toLocaleString()} G</Text>
                    </View>
                    <View style={styles.ticketContainer}>
                        <MaterialIcons name="local-play" size={16} color="#A855F7" />
                        <Text style={styles.ticketText}>{tickets} Vé</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <LevelTimelineModal
                visible={showTimeline}
                onClose={() => setShowTimeline(false)}
                currentXP={displayCurrentXP}
                currentLevel={userLevel}
            />

            <LevelUpModal
                visible={showLevelUp}
                level={userLevel}
                onClose={() => setShowLevelUp(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 56 : 44,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 16,
    },
    avatarOuterRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 4,
        backgroundColor: COLORS.warmBg,
        borderWidth: 2,
        borderColor: 'rgba(251, 155, 143, 0.3)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    avatarGradient: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.clayAccent1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 3,
    },
    levelText: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: '#FFF',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    usernameText: {
        fontSize: FONT_SIZES.body,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.9,
        maxWidth: '60%',
    },
    xpText: {
        fontSize: FONT_SIZES.caption,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    xpTrack: {
        height: 18,
        width: '100%',
        backgroundColor: COLORS.clayInset,
        borderRadius: 9,
        padding: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    xpFill: {
        height: '100%',
        backgroundColor: COLORS.clayAccent1,
        borderRadius: 6,
        overflow: 'hidden',
        shadowColor: '#FB9B8F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        elevation: 2,
    },
    xpShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    coinContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warmBg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#D29664',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    coinText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.8,
    },
    ticketContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warmBg,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    ticketText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        opacity: 0.8,
    },
});

export default ClayHeader;
