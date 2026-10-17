import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CollectionHeroSectionProps {
    title: string;
    description?: string;
    totalSlots: number;
    totalFilled: number;
    progressPercent: number;
}

export const CollectionHeroSection: React.FC<CollectionHeroSectionProps> = ({
    title,
    description,
    totalSlots,
    totalFilled,
    progressPercent,
}) => {
    return (
        <>
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.heroTitleBox}>
                    <Text style={styles.heroTitle}>{title}</Text>
                    <MaterialIcons name="wb-sunny" size={40} color="#fd9c90" style={styles.heroIcon} />
                </View>
                <Text style={styles.heroDesc}>
                    {description || `Cùng nhau thu thập ${totalSlots} bức ảnh để nhận thưởng lớn!`}
                </Text>
            </View>

            {/* Global Progress Bar */}
            <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressCount}>
                        {totalFilled}/{totalSlots} <Text style={styles.progressCountSub}>Đã gom</Text>
                    </Text>
                    <Text style={styles.progressPercentText}>{Math.round(progressPercent)}% Hoàn thành</Text>
                </View>

                <View style={styles.progressTrack}>
                    <LinearGradient
                        colors={['#fd9c90', '#fd7d9f']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${progressPercent}%` }]}
                    />
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    heroSection: {
        marginBottom: 16,
    },
    heroTitleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#332f13',
    },
    heroIcon: {
        opacity: 0.8,
    },
    heroDesc: {
        fontSize: 13,
        color: '#615c3c',
        marginTop: 4,
    },
    progressCard: {
        backgroundColor: '#faf2c4',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#332f13',
    },
    progressCountSub: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#615c3c',
    },
    progressPercentText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9f3456',
    },
    progressTrack: {
        height: 12,
        backgroundColor: '#e2dabc',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
});
