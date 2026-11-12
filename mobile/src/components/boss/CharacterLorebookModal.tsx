import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../theme';
import { CollectionCharacterItem } from '../../../../shared/types/boss';

const { width, height } = Dimensions.get('window');

export interface CharacterLorebookModalProps {
    visible: boolean;
    character: (CollectionCharacterItem & { collectionTitle?: string; themeColor?: string }) | null;
    onClose: () => void;
}

export const CharacterLorebookModal: React.FC<CharacterLorebookModalProps> = React.memo(
    ({ visible, character, onClose }) => {
        if (!visible || !character) return null;

        const themeColor = character.themeColor || '#8B5CF6';

        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.card}>
                        {/* Header Controls */}
                        <View style={styles.topBar}>
                            <View style={styles.badgesRow}>
                                <View style={[styles.pillBadge, { backgroundColor: `${themeColor}22`, borderColor: `${themeColor}66` }]}>
                                    <Text style={[styles.pillBadgeText, { color: themeColor }]}>
                                        {character.isLimited ? 'LIMITED' : 'CHÍNH TRUYỆN'}
                                    </Text>
                                </View>
                                {character.collectionTitle && (
                                    <View style={styles.collectionPill}>
                                        <Text style={styles.collectionPillText} numberOfLines={1}>
                                            {character.collectionTitle}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                                <MaterialIcons name="close" size={22} color={COLORS.clayText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                            {/* Large Artwork Frame */}
                            <View style={[styles.artworkFrame, { borderColor: themeColor }]}>
                                {character.avatarImageUrl ? (
                                    <Image source={{ uri: character.avatarImageUrl }} style={styles.artworkImg} />
                                ) : (
                                    <View style={[styles.fallbackArt, { backgroundColor: character.colorBg || '#334155' }]}>
                                        <MaterialIcons
                                            name={(character.colorIcon as any) || 'pets'}
                                            size={72}
                                            color="#FFF"
                                        />
                                    </View>
                                )}
                                <View style={styles.artOverlayGradient} />
                            </View>

                            {/* Titles */}
                            <Text style={styles.charTitle}>{character.title}</Text>
                            <Text style={[styles.loreTitle, { color: themeColor }]}>
                                {character.loreTitle || 'Huyền Thoại Bí Ẩn'}
                            </Text>

                            {/* Quote Box (secretDescription or short description) */}
                            {(character.secretDescription || character.description) && (
                                <View style={styles.quoteBox}>
                                    <MaterialIcons name="format-quote" size={24} color={themeColor} style={styles.quoteIcon} />
                                    <Text style={styles.quoteText}>
                                        "{character.secretDescription || character.description}"
                                    </Text>
                                </View>
                            )}

                            {/* Lore Story Content */}
                            <View style={styles.storySection}>
                                <View style={styles.storyHeader}>
                                    <MaterialIcons name="auto-stories" size={18} color={COLORS.clayText} />
                                    <Text style={styles.storyHeading}>Tiểu Sử & Biên Niên Sử</Text>
                                </View>
                                <Text style={styles.storyContent}>
                                    {character.loreContent ||
                                        character.description ||
                                        'Câu chuyện về nhân vật này đang được ghi chép vào biên niên sử Growary...'}
                                </Text>
                            </View>

                            {/* Week Info Footer */}
                            {character.weekActivatedAt && (
                                <View style={styles.dateRow}>
                                    <MaterialIcons name="event" size={14} color="rgba(93, 64, 55, 0.6)" />
                                    <Text style={styles.dateText}>
                                        Sự kiện ra mắt: {new Date(character.weekActivatedAt).toLocaleDateString('vi-VN')}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Bottom Dismiss Button */}
                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: themeColor }]}
                            onPress={onClose}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.confirmBtnText}>Khép Lại Sổ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: Math.min(width * 0.92, 380),
        maxHeight: height * 0.86,
        backgroundColor: COLORS.warmBg,
        borderRadius: 26,
        padding: 18,
        ...SHADOWS.clay,
        borderWidth: 2,
        borderColor: 'rgba(93, 64, 55, 0.12)',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    pillBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
    },
    pillBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    collectionPill: {
        backgroundColor: 'rgba(93, 64, 55, 0.08)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        maxWidth: 150,
    },
    collectionPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.clayText,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.clayCard,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.clayLight,
    },
    scrollBody: {
        paddingBottom: 16,
        alignItems: 'center',
    },
    artworkFrame: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2.5,
        position: 'relative',
        marginBottom: 14,
        backgroundColor: '#1E293B',
    },
    artworkImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    fallbackArt: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    artOverlayGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    charTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.clayText,
        textAlign: 'center',
    },
    loreTitle: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 2,
        marginBottom: 12,
        textAlign: 'center',
    },
    quoteBox: {
        width: '100%',
        backgroundColor: COLORS.clayCard,
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
        borderLeftWidth: 3.5,
        borderLeftColor: COLORS.clayAccent2,
        ...SHADOWS.clayLight,
    },
    quoteIcon: {
        marginBottom: -6,
        opacity: 0.8,
    },
    quoteText: {
        fontSize: 12.5,
        fontStyle: 'italic',
        color: 'rgba(93, 64, 55, 0.85)',
        lineHeight: 18,
    },
    storySection: {
        width: '100%',
        backgroundColor: COLORS.clayCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        ...SHADOWS.clayLight,
    },
    storyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    storyHeading: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    storyContent: {
        fontSize: 12.5,
        color: 'rgba(93, 64, 55, 0.8)',
        lineHeight: 19,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    dateText: {
        fontSize: 11,
        color: 'rgba(93, 64, 55, 0.6)',
        fontWeight: '500',
    },
    confirmBtn: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        ...SHADOWS.clayLight,
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
});

