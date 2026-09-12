import React from 'react';
import { View, Text, StyleSheet, Modal, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface StoryUnlockModalProps {
    visible: boolean;
    boss: { title: string; avatarImageUrl?: string; loreTitle?: string; loreContent?: string } | null;
    isInCollection: boolean;
    onClose: () => void;
}

export default function StoryUnlockModal({ visible, boss, isInCollection, onClose }: StoryUnlockModalProps) {
    if (!boss) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Character Full Image with Glow */}
                    <View style={styles.imageWrapper}>
                        {boss.avatarImageUrl ? (
                            <Image source={{ uri: boss.avatarImageUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.fallbackAvatar]}>
                                <MaterialIcons name="person" size={100} color="#FFF" />
                            </View>
                        )}
                        <View style={styles.glow} />
                    </View>

                    <LinearGradient
                        colors={['#1e293b', '#0f172a']}
                        style={styles.contentContainer}
                    >
                        <Text style={styles.bossName}>{boss.title}</Text>
                        {boss.loreTitle && (
                            <Text style={styles.loreTitle}>~ {boss.loreTitle} ~</Text>
                        )}
                        
                        {isInCollection && (
                            <View style={styles.collectionBadge}>
                                <MaterialIcons name="collections-bookmark" size={16} color="#fbbf24" />
                                <Text style={styles.collectionText}>Đã thêm vào Bộ Sưu Tập!</Text>
                            </View>
                        )}

                        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                            <Text style={styles.loreContent}>
                                {boss.loreContent || 'Chưa có cốt truyện cho nhân vật này.'}
                            </Text>
                        </ScrollView>

                        {/* Minimum 48dp Touch Target for Thumb Zone */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                            <Text style={styles.closeText}>Đóng</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.9,
        maxHeight: height * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
    },
    imageWrapper: {
        height: 250,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        zIndex: 10,
    },
    fallbackAvatar: {
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: -20 },
        shadowOpacity: 0.8,
        shadowRadius: 40,
        elevation: 20,
        zIndex: 5,
    },
    contentContainer: {
        padding: 24,
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bossName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#f8fafc',
        textAlign: 'center',
        marginBottom: 8,
    },
    loreTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#cbd5e1',
        fontStyle: 'italic',
        marginBottom: 16,
        textAlign: 'center',
    },
    collectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.5)',
    },
    collectionText: {
        color: '#fbbf24',
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollArea: {
        width: '100%',
        maxHeight: 200,
        marginBottom: 24,
    },
    loreContent: {
        fontSize: 15,
        color: '#94a3b8',
        lineHeight: 24,
        textAlign: 'justify',
    },
    closeButton: {
        width: '100%',
        height: 52, // Mobile UX principle: > 48dp
        backgroundColor: '#ef4444',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    closeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
