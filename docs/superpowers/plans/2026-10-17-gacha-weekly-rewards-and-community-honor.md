# Gacha Weekly Rewards, Personal Score Visibility & Community Honor Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Enhance Growary's Gacha Weekly Competition with:
1. **Weekly Leaderboard Reward Structure**: Top 1 (1 random Epic box + 1500 coins + 500 XP + 3 tickets), Top 2 (1 random Rare box + 1000 coins + 250 XP + 1 ticket), Top 3 (1 random Normal box + 500 coins + 100 XP).
2. **Personal Weekly Score & Rank Visibility**: Prominent live scorecard showing the user's weekly points, current rank, and total spins directly on `GachaEventScreen`.
3. **Community Honor Board (Bảng Thành Tựu)**: Real-time community achievement feed ("A vừa vượt tầng...", "B vừa quay trúng Huyền Thoại...") replacing the static single-winner display in the Gacha Leaderboard tab.

---

## Workspace Architecture & Line Limits
- `backend/`: Routes $\le$ 300, Controllers $\le$ 400, Services $\le$ 500, Models $\le$ 250 lines.
- `mobile/`: Screens $\le$ 500 lines, Components $\le$ 400 lines.
- `shared/`: Single source of truth in `shared/types/gacha.ts`.

---

## Tasks

### Task 1: Extend Shared Types for Weekly Rewards & Community Achievements
**Files:**
- `shared/types/gacha.ts`
- `shared/types/index.ts`

- [ ] Add `WeeklyRewardTier`:
  ```typescript
  export interface WeeklyRewardTier {
      box: {
          boxId?: string;
          name: string;
          rarity: GachaItemRarity;
          color?: string;
      };
      coins: number;
      xp: number;
      tickets: number;
  }

  export interface WeeklyRewardsConfig {
      top1: WeeklyRewardTier;
      top2: WeeklyRewardTier;
      top3: WeeklyRewardTier;
  }
  ```
- [ ] Add `CommunityAchievement`:
  ```typescript
  export interface CommunityAchievement {
      id: string;
      userId: string;
      username: string;
      avatarUrl?: string;
      type: 'tier_up' | 'rare_drop' | 'score_milestone';
      title: string;
      description: string;
      highlightText?: string;
      rarity?: GachaItemRarity;
      createdAt: string;
  }
  ```
- [ ] Update `GachaWeeklyEvent` to include optional `weeklyRewards?: WeeklyRewardsConfig`.
- [ ] Update `GachaLeaderboardResponse` to include `communityAchievements?: CommunityAchievement[]`.
- [ ] Verify TypeScript compiles in `backend/` and `mobile/`.

---

### Task 2: Backend Models & Services (TDD)
**Files:**
- `backend/src/models/GachaWeeklyEvent.ts`
- `backend/src/services/gachaRevampService.ts`
- `backend/src/controllers/gachaController.ts`
- `backend/src/__tests__/services/gachaRevampService.test.ts`
- `backend/src/__tests__/integration/gachaRevampFlow.test.ts`

- [ ] Update `GachaWeeklyEvent.ts` Mongoose schema to include `weeklyRewards` sub-schema.
- [ ] Write tests in `gachaRevampService.test.ts`:
  - `getOrCreateCurrentWeeklyEvent` randomly assigns 3 active boxes (`epic`, `rare`, `normal`) and exact coin/XP/ticket payouts.
  - Fallback defaults when database has no boxes of matching rarity.
  - `getCommunityAchievements` returns formatted achievements from `GachaHistory` and `GachaLeaderboard`.
- [ ] Implement `weeklyRewards` generation in `gachaRevampService.ts`.
- [ ] Implement `getCommunityAchievements(limit = 10)` in `gachaRevampService.ts`.
- [ ] Update `getGachaLeaderboard` in `gachaController.ts` to return `communityAchievements`.
- [ ] Run `npm test -- gachaRevampService.test.ts` and `npm test -- gachaRevampFlow.test.ts` -> Verify all tests pass.
- [ ] Commit backend changes in `backend/` and reference in root.

---

### Task 3: Mobile Weekly Reward Preview & Personal Score Card Components
**Files:**
- `mobile/src/components/gacha/WeeklyRewardsPreviewCard.tsx` (new component, $\le$ 300 lines)
- `mobile/src/components/gacha/GachaUserScoreCard.tsx` (new component, $\le$ 250 lines)
- `mobile/src/screens/GachaEventScreen.tsx` (integrate components, $\le$ 500 lines)

- [ ] Create `WeeklyRewardsPreviewCard.tsx`:
  - Visual display for Top 1, Top 2, Top 3 prizes.
  - Rarity badges with matching colors (Epic: `#A855F7`, Rare: `#3B82F6`, Normal: `#94A3B8`).
  - Formatted reward tokens: Coins, XP, Gacha Tickets.
- [ ] Create `GachaUserScoreCard.tsx`:
  - Displays user's weekly points (`currentUser.totalScore || 0`), current rank (`#rank`), spins count, and highest rarity tag.
  - Claymorphism container matching Growary design system.
- [ ] Update `GachaEventScreen.tsx` to embed both cards before the CS:GO reel and pass `weeklyRewards` and `currentUser`.
- [ ] Verify `mobile/` TypeScript compilation (`npx tsc -p tsconfig.json --noEmit`).
- [ ] Commit mobile changes in root.

---

### Task 4: Mobile Community Honor Board (Bảng Thành Tựu)
**Files:**
- `mobile/src/components/gacha/GachaLeaderboard.tsx` ($\le$ 400 lines)

- [ ] Update `GachaLeaderboard.tsx`:
  - Change Tab 2 title to "Thành Tựu" / "Vinh Danh" with trophy/star icon.
  - Render `communityAchievements` list with distinctive icons for `tier_up` (🏰), `rare_drop` (🌟), and `score_milestone` (🔥).
  - Show user avatar or initials, time ago or formatted date, and highlighted text.
  - Keep `GachaLeaderboard.tsx` under 400 lines.
- [ ] Verify `mobile/` TypeScript compilation (`npx tsc -p tsconfig.json --noEmit`).
- [ ] Commit mobile leaderboard updates.

---

### Task 5: Full Verification Suite
- [ ] Run backend tests: `npm test` inside `backend/` (all 17+ suites must pass).
- [ ] Run backend tsc: `npx tsc --noEmit` in `backend/` (0 errors).
- [ ] Run mobile tsc: `npx tsc -p tsconfig.json --noEmit` in `mobile/` (0 errors).
- [ ] Run admin build: `npm run build` in `admin/` (0 errors).
- [ ] Review git status across repos, clean commits, and report to user.
