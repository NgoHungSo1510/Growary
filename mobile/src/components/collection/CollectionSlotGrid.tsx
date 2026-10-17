import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SLOT_GAP = 8;
export const SLOT_SIZE = (width - 40 - SLOT_GAP * 4) / 5;

export interface Entry {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    status: string;
    slotIndex: number;
    userId?: {
        _id: string;
        username: string;
        avatar: string;
    } | string;
    createdAt?: string;
}

interface CollectionSlotGridProps {
    totalSlots: number;
    entries: Entry[];
    onSlotPress: (index: number) => void;
}

export const CollectionSlotGrid: React.FC<CollectionSlotGridProps> = ({
    totalSlots,
    entries,
    onSlotPress,
}) => {
    return (
        <View style={styles.gridSection}>
            {Array.from({ length: totalSlots }).map((_, i) => {
                const entry = entries.find((e) => e.slotIndex === i);
                const isApproved = entry?.status === 'approved';
                const isPending = entry?.status === 'pending';

                return (
                    <TouchableOpacity
                        key={i}
                        onPress={() => onSlotPress(i)}
                        style={styles.slotBox}
                        activeOpacity={0.7}
                    >
                        {entry ? (
                            <>
                                <View style={styles.slotImageWrapper}>
                                    <Image source={{ uri: entry.imageUrl }} style={styles.slotImage} />
                                    {isPending && (
                                        <View style={styles.pendingOverlay}>
                                            <MaterialIcons name="schedule" size={16} color="#FFF" />
                                        </View>
                                    )}
                                    {isApproved && (
                                        <View style={styles.ownerBadge}>
                                            <Image
                                                source={{ uri: (entry.userId as any)?.avatar || 'https://via.placeholder.com/20' }}
                                                style={{ width: 14, height: 14, borderRadius: 7 }}
                                            />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.entryTitle} numberOfLines={1}>
                                    {entry.title}
                                </Text>
                            </>
                        ) : (
                            <View style={styles.slotEmptyBg}>
                                <Text style={styles.slotEmptyText}>#{i + 1}</Text>
                                <MaterialIcons name="add-a-photo" size={16} color="#b4ae88" style={{ marginTop: 2 }} />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    gridSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SLOT_GAP,
        marginBottom: 24,
    },
    slotBox: {
        width: SLOT_SIZE,
        marginBottom: 8,
        alignItems: 'center',
    },
    slotImageWrapper: {
        width: SLOT_SIZE,
        height: SLOT_SIZE,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#faf2c4',
        borderWidth: 2,
        borderColor: '#fd7d9f',
    },
    slotImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    pendingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownerBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 1,
    },
    entryTitle: {
        fontSize: 10,
        color: '#615c3c',
        fontWeight: 'bold',
        marginTop: 4,
        textAlign: 'center',
    },
    slotEmptyBg: {
        width: SLOT_SIZE,
        height: SLOT_SIZE,
        borderRadius: 14,
        backgroundColor: '#f5edd0',
        borderWidth: 1.5,
        borderColor: '#e2dabc',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotEmptyText: {
        fontSize: 10,
        color: '#b4ae88',
        fontWeight: 'bold',
    },
});
