import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VipStatus } from '../types';

interface Props {
  vipStatus: VipStatus;
  onDetailPress?: () => void;
}

export const VipMiniCard: React.FC<Props> = ({ vipStatus, onDetailPress }) => {
  const { currentTier, nextTier, totalCoinsSpent, coinsToNextTier } = vipStatus;

  // Progress tính từ tier trước đến tier tiếp theo (chính xác hơn)
  const prevTierMin = currentTier.minSpending;
  const nextTierMin = nextTier ? nextTier.minSpending : prevTierMin;
  const range = nextTierMin - prevTierMin;
  const progress = range > 0 ? Math.min(1, (totalCoinsSpent - prevTierMin) / range) : 1;

  const hasBenefits = currentTier.tier > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tierBadge}>
          <Text style={[styles.tierIcon, { color: currentTier.color }]}>👑</Text>
          <Text style={[styles.tierText, { color: currentTier.color }]}>
            VIP {currentTier.tier}: {currentTier.name}
          </Text>
        </View>
        {onDetailPress && (
          <TouchableOpacity onPress={onDetailPress} style={styles.detailBtn}>
            <Text style={styles.detailText}>Chi tiết →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chỉ hiện benefits khi tier > 0 */}
      {hasBenefits && (
        <Text style={styles.benefits}>
          -{currentTier.discountPercent}% Mua hàng • +{currentTier.cashbackPercent}% Hoàn cuối tháng
        </Text>
      )}

      {nextTier ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: currentTier.color,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressSpent}>
              {totalCoinsSpent.toLocaleString()} coins
            </Text>
            <Text style={styles.progressTarget}>
              {nextTier.minSpending.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.progressText}>
            Tiêu thêm <Text style={{ color: nextTier.color, fontWeight: '700' }}>
              {coinsToNextTier?.toLocaleString()}
            </Text> coins để lên <Text style={{ color: nextTier.color, fontWeight: '700' }}>{nextTier.name}</Text>
          </Text>
        </View>
      ) : (
        <Text style={styles.maxTierText}>🏆 Đã đạt cấp cao nhất!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    backgroundColor: '#1A2235',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  detailText: { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },
  benefits: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 2,
  },
  progressContainer: { marginTop: 8 },
  progressBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressSpent: { color: '#6B7280', fontSize: 10 },
  progressTarget: { color: '#6B7280', fontSize: 10 },
  progressText: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
  maxTierText: { color: '#F9A825', fontWeight: 'bold', fontSize: 12, marginTop: 8 },
});
