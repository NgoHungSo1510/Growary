import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../theme';
import { BossCollectionWithProgress } from '../../../../shared/types/boss';

export interface BossWeekCollectionSectionProps {
    collectionItem: BossCollectionWithProgress | null;
    onPressCollection?: (collectionId: string) => void;
}

const CharacterCard = React.memo<{
    item: BossCollectionWithProgress['bosses'][number];
    themeColor: string;
}>(({ item, themeColor }) => {
    return (
        <View style={[styles.charCard, { borderColor: item.isUnlocked ? themeColor : 'rgba(93, 64, 55, 0.15)' }]}>
            <View style={styles.avatarWrap}>
                {item.avatarImageUrl ? (
                    <Image
                        source={{ uri: item.avatarImageUrl }}
                        style={styles.avatarImg}
                        blurRadius={item.isUnlocked ? 0 : 15}
                    />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: item.colorBg || '#334155' }]}>
                        <MaterialIcons
                            name={(item.colorIcon as any) || 'pets'}
                            size={28}
                            color="#FFF"
                        />
                    </View>
                )}

                {!item.isUnlocked && (
                    <View style={styles.lockedOverlay}>
                        <MaterialIcons name="lock" size={20} color="#FFF" />
                    </View>
                )}
            </View>

            <Text style={styles.charName} numberOfLines={1}>
                {item.isUnlocked ? item.title : 'Bí ẩn'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: item.isUnlocked ? '#10B9811A' : 'rgba(93, 64, 55, 0.08)' }]}>
                <Text style={[styles.statusText, { color: item.isUnlocked ? '#10B981' : COLORS.clayText }]}>
                    {item.isUnlocked ? 'Đã mở' : 'Chưa mở'}
                </Text>
            </View>
        </View>
    );
});

export const BossWeekCollectionSection: React.FC<BossWeekCollectionSectionProps> = React.memo(
    ({ collectionItem, onPressCollection }) => {
        if (!collectionItem || !collectionItem.collection) {
            return null;
        }

        const { collection, bosses, userProgress } = collectionItem;
        const themeColor = collection.themeColor || '#8B5CF6';

        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.headerRow}
                    activeOpacity={0.8}
                    onPress={() => onPressCollection?.(collection._id)}
                    disabled={!onPressCollection}
                >
                    <View style={styles.headerLeft}>
                        <Text style={styles.iconEmoji}>{collection.iconEmoji || '🏆'}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionSubtitle}>BỘ SƯU TẬP TUẦN NÀY</Text>
                            <Text style={styles.sectionTitle} numberOfLines={1}>
                                {collection.title}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.progressPill, { backgroundColor: `${themeColor}22`, borderColor: `${themeColor}55` }]}>
                        <Text style={[styles.progressText, { color: themeColor }]}>
                            {userProgress.unlockedCount}/{userProgress.totalCount || bosses.length}
                        </Text>
                    </View>
                </TouchableOpacity>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollList}
                >
                    {bosses.map((char) => (
                        <CharacterCard
                            key={char._id}
                            item={char}
                            themeColor={themeColor}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        backgroundColor: COLORS.clayCard,
        borderRadius: 20,
        padding: 16,
        ...SHADOWS.clayLight,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconEmoji: {
        fontSize: 26,
    },
    sectionSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(93, 64, 55, 0.6)',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    progressPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    progressText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollList: {
        paddingVertical: 4,
        gap: 12,
    },
    charCard: {
        width: 108,
        backgroundColor: COLORS.warmBg,
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    avatarWrap: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
        position: 'relative',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    charName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
        textAlign: 'center',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
});

