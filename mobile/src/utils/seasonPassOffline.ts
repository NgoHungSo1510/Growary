import {
    PassTrackType,
    PassReward,
    PassGrantedRewards,
    SeasonPassMyProgressResponse,
    SeasonPassTier,
} from '../../../shared/types/seasonPass';
import { InventoryItem } from '../../../shared/types/reward';
import {
    getCachedSnapshot,
    setCachedSnapshot,
    SNAPSHOT_KEYS,
} from '../services/offlineSnapshotStore';
import { enqueueOfflineAction } from '../services/offlineSyncService';
import { applyOfflineCurrencyDelta } from '../services/offlineEconomyEngine';
import { buildEventCacheKey, setEventCache } from './eventCache';

export interface ExecuteOfflinePassClaimParams {
    progressResponse: SeasonPassMyProgressResponse;
    claimKind: 'tier' | 'all' | 'quest' | 'overcap';
    level?: number;
    track?: PassTrackType;
    questCode?: string;
    userId?: string;
}

export interface OfflinePassClaimResult {
    updatedProgress: SeasonPassMyProgressResponse;
    grantedRewards: PassGrantedRewards;
    message: string;
}

/**
 * Optimistically processes Battle Pass reward claims offline (A3 / RV-14):
 * Grants currencies and places mystery boxes directly into local inventory snapshot.
 */
export async function executeOfflinePassClaim(
    params: ExecuteOfflinePassClaimParams
): Promise<OfflinePassClaimResult> {
    const { progressResponse, claimKind, level, track, questCode, userId } = params;
    const progress = JSON.parse(JSON.stringify(progressResponse)) as SeasonPassMyProgressResponse;
    const grantedRewards: PassReward[] = [];
    let message = 'Nhận phần thưởng thành công!';

    if (claimKind === 'tier') {
        if (!level || !track) throw new Error('Thiếu cấp độ hoặc loại vé');
        const tier = progress.season.tiers.find((t: SeasonPassTier) => t.level === level);
        if (!tier) throw new Error(`Không tìm thấy Cấp ${level}`);

        if (track === 'free') {
            if (progress.progress.claimedFreeLevels.includes(level)) {
                throw new Error('Bạn đã nhận quà mốc này rồi');
            }
            if (!tier.freeReward) throw new Error('Mốc này không có quà miễn phí');
            progress.progress.claimedFreeLevels.push(level);
            grantedRewards.push(tier.freeReward);
        } else {
            if (!progress.progress.isEliteUnlocked) throw new Error('Bạn chưa mở khóa Vé Tinh Anh');
            if (progress.progress.claimedEliteLevels.includes(level)) {
                throw new Error('Bạn đã nhận quà mốc này rồi');
            }
            if (!tier.eliteReward) throw new Error('Mốc này không có quà Tinh Anh');
            progress.progress.claimedEliteLevels.push(level);
            grantedRewards.push(tier.eliteReward);
        }
        message = `Đã nhận quà Cấp ${level}!`;
    } else if (claimKind === 'all') {
        const curLvl = progress.progress.currentLevel;
        const freeLevelsToClaim = progress.season.tiers
            .filter((t) => t.level <= curLvl && t.freeReward && !progress.progress.claimedFreeLevels.includes(t.level));
        const eliteLevelsToClaim = progress.progress.isEliteUnlocked
            ? progress.season.tiers.filter((t) => t.level <= curLvl && t.eliteReward && !progress.progress.claimedEliteLevels.includes(t.level))
            : [];

        if (freeLevelsToClaim.length === 0 && eliteLevelsToClaim.length === 0) {
            throw new Error('Không có quà nào để nhận');
        }

        freeLevelsToClaim.forEach((t) => {
            progress.progress.claimedFreeLevels.push(t.level);
            if (t.freeReward) grantedRewards.push(t.freeReward);
        });
        eliteLevelsToClaim.forEach((t) => {
            progress.progress.claimedEliteLevels.push(t.level);
            if (t.eliteReward) grantedRewards.push(t.eliteReward);
        });
        message = 'Đã nhận toàn bộ quà đạt cấp!';
    } else if (claimKind === 'quest') {
        if (!questCode) throw new Error('Thiếu mã nhiệm vụ');
        const quest = progress.quests.find((q) => q.questCode === questCode);
        if (!quest) throw new Error('Không tìm thấy nhiệm vụ');
        if (quest.isClaimed) throw new Error('Nhiệm vụ này đã nhận thưởng');
        quest.isClaimed = true;
        if (quest.rewardVaultCoins > 0) {
            grantedRewards.push({
                type: 'coins',
                amount: quest.rewardVaultCoins,
                label: `${quest.rewardVaultCoins} Xu Hũ`,
            });
        }
        if (quest.rewardPassXp > 0) {
            progress.progress.totalPassXp += quest.rewardPassXp;
            progress.progress.currentLevelXp += quest.rewardPassXp;
        }
        message = `Đã nhận thưởng nhiệm vụ ${quest.title}!`;
    } else if (claimKind === 'overcap') {
        const available = (progress.progress.overflowChestsEarned || 0) - (progress.progress.claimedOverflowChests || 0);
        if (available <= 0) throw new Error('Không có rương vượt cấp để nhận');
        progress.progress.claimedOverflowChests = (progress.progress.claimedOverflowChests || 0) + available;
        grantedRewards.push({
            type: 'mystery_box',
            amount: available,
            label: `${available} Rương Vượt Cấp`,
            boxRarity: 'rare',
        });
        message = `Đã nhận ${available} Rương Vượt Cấp!`;
    }

    // Award currencies
    let coinsDelta = 0;
    let xpDelta = 0;
    let ticketsDelta = 0;
    let mysteryBoxesCount = 0;
    const avatarFrameIds: string[] = [];

    for (const r of grantedRewards) {
        if (r.type === 'coins') coinsDelta += r.amount;
        if (r.type === 'xp') xpDelta += r.amount;
        if (r.type === 'gacha_ticket') ticketsDelta += r.amount;
        if (r.type === 'mystery_box') mysteryBoxesCount += r.amount;
        if (r.type === 'avatar_frame' && r.frameId) avatarFrameIds.push(r.frameId);
    }
    if (coinsDelta > 0 || xpDelta > 0 || ticketsDelta > 0) {
        await applyOfflineCurrencyDelta({ coinsDelta, xpDelta, ticketsDelta });
    }

    // Add mystery boxes into SNAPSHOT_KEYS.INVENTORY (A3 / RV-14)
    const boxes = grantedRewards.filter((r) => r.type === 'mystery_box');
    if (boxes.length > 0) {
        const invData = (await getCachedSnapshot<{ inventory: InventoryItem[]; vouchers: unknown[]; vipStatus: unknown }>(SNAPSHOT_KEYS.INVENTORY)) || {
            inventory: [],
            vouchers: [],
            vipStatus: null,
        };
        const updatedInv = [...invData.inventory];
        for (const box of boxes) {
            const existing = updatedInv.find((i) => i.itemType === 'mystery_box' && (i.boxId === box.boxId || i.displayName === box.label));
            if (existing) {
                existing.quantity += box.amount;
            } else {
                updatedInv.push({
                    id: `box_pass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    boxId: box.boxId || 'season_pass_box',
                    itemType: 'mystery_box',
                    quantity: box.amount,
                    displayName: box.label || 'Rương Sứ Mệnh',
                    color: '#8b5cf6',
                    canExchange: false,
                    lastUpdated: new Date().toISOString(),
                    rarity: box.boxRarity || 'rare',
                });
            }
        }
        await setCachedSnapshot(SNAPSHOT_KEYS.INVENTORY, {
            ...invData,
            inventory: updatedInv,
        });
    }

    // Update pass cache
    await setCachedSnapshot(SNAPSHOT_KEYS.SEASON_PASS, progress);
    const cacheKey = buildEventCacheKey('season_pass_progress', userId);
    await setEventCache(cacheKey, progress);

    // Enqueue action
    await enqueueOfflineAction({
        type: 'CLAIM_PASS_REWARD',
        payload: {
            claimKind,
            level,
            track,
            questCode,
        },
        userId,
    });

    const summaryRewards: PassGrantedRewards = {
        coins: coinsDelta,
        xp: xpDelta,
        gachaTickets: ticketsDelta,
        mysteryBoxes: mysteryBoxesCount,
        avatarFrameIds,
        passXpAdded: claimKind === 'quest' ? (grantedRewards.find((r) => r.type === 'coins')?.amount ? 0 : 0) : 0,
        vaultCoinsAdded: claimKind === 'quest' ? coinsDelta : 0,
        claimedCount: grantedRewards.length,
    };

    return {
        updatedProgress: progress,
        grantedRewards: summaryRewards,
        message,
    };
}
