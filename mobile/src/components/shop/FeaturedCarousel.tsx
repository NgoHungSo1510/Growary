import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { Reward, VipStatus } from '../../types';
import { RewardCard } from './RewardCard';
import { COLORS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;
const AUTO_PLAY_INTERVAL = 5000; // 5 seconds

interface FeaturedCarouselProps {
    rewards: Reward[];
    vipStatus: VipStatus | null;
    saleDiscountPercent?: number;
    onPressReward: (reward: Reward) => void;
    style?: StyleProp<ViewStyle>;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
    rewards,
    vipStatus,
    saleDiscountPercent = 0,
    onPressReward,
    style,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList<Reward>>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isInteractingRef = useRef<boolean>(false);

    const totalItems = rewards.length;

    // Start auto-play timer
    const startAutoplay = useCallback(() => {
        if (totalItems <= 1) return;
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (isInteractingRef.current) return;

            setActiveIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % totalItems;
                flatListRef.current?.scrollToOffset({
                    offset: nextIndex * SNAP_INTERVAL,
                    animated: true,
                });
                return nextIndex;
            });
        }, AUTO_PLAY_INTERVAL);
    }, [totalItems]);

    // Stop auto-play timer
    const stopAutoplay = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        startAutoplay();
        return () => stopAutoplay();
    }, [startAutoplay, stopAutoplay]);

    // Scroll handlers
    const handleScrollBeginDrag = () => {
        isInteractingRef.current = true;
        stopAutoplay();
    };

    const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / SNAP_INTERVAL);
        const clampedIndex = Math.max(0, Math.min(newIndex, totalItems - 1));
        setActiveIndex(clampedIndex);

        // Resume auto-play after 5s of inactivity
        isInteractingRef.current = false;
        startAutoplay();
    };

    if (totalItems === 0) return null;

    return (
        <View style={[styles.container, style]}>
            {/* Header section with badge */}
            <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                    <Text style={styles.headerIcon}>⭐</Text>
                    <Text style={styles.headerTitle}>Sản Phẩm Nổi Bật</Text>
                </View>
                <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>HOT DEALS</Text>
                </View>
            </View>

            {/* Smooth Carousel List */}
            <FlatList
                ref={flatListRef}
                data={rewards}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                contentContainerStyle={styles.listContent}
                onScrollBeginDrag={handleScrollBeginDrag}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_data, index) => ({
                    length: SNAP_INTERVAL,
                    offset: SNAP_INTERVAL * index,
                    index,
                })}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <RewardCard
                            reward={item}
                            vipStatus={vipStatus}
                            onPress={onPressReward}
                            variant="featured"
                            saleDiscountPercent={saleDiscountPercent}
                        />
                    </View>
                )}
            />

            {/* Pagination Dots */}
            {totalItems > 1 && (
                <View style={styles.paginationRow}>
                    {rewards.map((_, index) => {
                        const isActive = activeIndex === index;
                        return (
                            <View
                                key={`dot-${index}`}
                                style={[
                                    styles.dot,
                                    isActive && styles.activeDot,
                                ]}
                            />
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerIcon: {
        fontSize: 18,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.clayText,
    },
    tagBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    tagText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#B45309',
        letterSpacing: 0.5,
    },
    listContent: {
        paddingHorizontal: 24,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        marginRight: CARD_SPACING,
    },
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(93, 64, 55, 0.2)',
    },
    activeDot: {
        width: 20,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
    },
});

export default FeaturedCarousel;
