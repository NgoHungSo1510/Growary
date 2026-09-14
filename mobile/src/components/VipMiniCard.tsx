import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VipStatus } from '../types';

interface Props {
  vipStatus: VipStatus;
  onDetailPress?: () => void;
}

const getContrastColor = (hexcolor: string) => {
  if (!hexcolor || !/^#([0-9A-F]{3}){1,2}$/i.test(hexcolor)) return '#FFFFFF';
  const hex = hexcolor.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1A2235' : '#FFFFFF';
};

export const VipMiniCard: React.FC<Props> = ({ vipStatus, onDetailPress }) => {
  const { currentTier, nextTier, totalCoinsSpent, coinsToNextTier } = vipStatus;

  // Progress tính từ tier trước đến tier tiếp theo (chính xác hơn)
  const prevTierMin = currentTier.minSpending;
  const nextTierMin = nextTier ? nextTier.minSpending : prevTierMin;
  const range = nextTierMin - prevTierMin;
  const progress = range > 0 ? Math.min(1, (totalCoinsSpent - prevTierMin) / range) : 1;

  const hasBenefits = currentTier.tier > 0;
  
  const textColor = getContrastColor(currentTier.color);
  const isDarkText = textColor === '#1A2235';
  const secondaryTextColor = isDarkText ? 'rgba(26,34,53,0.7)' : 'rgba(255,255,255,0.8)';
  const progressBgColor = isDarkText ? 'rgba(26,34,53,0.15)' : 'rgba(255,255,255,0.3)';
  const benefitColor = isDarkText ? '#065F46' : '#10B981'; // darker green for light background

  return (
    <View style={[styles.card, { backgroundColor: currentTier.color }]}>
      <View style={styles.header}>
        <View style={styles.tierBadge}>
          <Text style={[styles.tierIcon, { color: textColor }]}>👑</Text>
          <Text style={[styles.tierText, { color: textColor }]}>
            VIP {currentTier.tier}: {currentTier.name}
          </Text>
        </View>
        {onDetailPress && (
          <TouchableOpacity onPress={onDetailPress} style={[styles.detailBtn, { backgroundColor: isDarkText ? 'rgba(26,34,53,0.1)' : 'rgba(255,255,255,0.15)' }]}>
            <Text style={[styles.detailText, { color: textColor }]}>Chi tiết →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chỉ hiện benefits khi tier > 0 */}
      {hasBenefits && (
        <Text style={[styles.benefits, { color: benefitColor }]}>
          -{currentTier.discountPercent}% Mua hàng • +{currentTier.cashbackPercent}% Hoàn cuối tháng
        </Text>
      )}

      {nextTier ? (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: progressBgColor }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: textColor,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressSpent, { color: secondaryTextColor }]}>
              {totalCoinsSpent.toLocaleString()} coins
            </Text>
            <Text style={[styles.progressTarget, { color: secondaryTextColor }]}>
              {nextTier.minSpending.toLocaleString()}
            </Text>
          </View>
          <Text style={[styles.progressText, { color: secondaryTextColor }]}>
            Tiêu thêm <Text style={{ color: textColor, fontWeight: '700' }}>
              {coinsToNextTier?.toLocaleString()}
            </Text> coins để lên <Text style={{ color: textColor, fontWeight: '700' }}>{nextTier.name}</Text>
          </Text>
        </View>
      ) : (
        <Text style={[styles.maxTierText, { color: textColor }]}>🏆 Đã đạt cấp cao nhất!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierIcon: { fontSize: 16 },
  tierText: { fontWeight: 'bold', fontSize: 14 },
  detailBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailText: { fontSize: 11, fontWeight: '600' },
  benefits: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 2,
  },
  progressContainer: { marginTop: 8 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressSpent: { fontSize: 10 },
  progressTarget: { fontSize: 10 },
  progressText: { fontSize: 11, marginTop: 4 },
  maxTierText: { fontWeight: 'bold', fontSize: 12, marginTop: 8 },
});
