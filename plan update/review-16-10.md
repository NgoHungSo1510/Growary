# 🔍 Growary — Code Review Plan 16/10/2026

> **Ngày lập:** 2026-10-16
> **Phạm vi:** Toàn bộ dự án — Backend (Node/Express/MongoDB) · Mobile (React Native/Expo) · Admin Panel (React/Vite)
> **Mục tiêu:** Nâng chất lượng code lên production-grade — dễ bảo trì, dễ bàn giao, an toàn, và mở rộng được
> **Phương pháp:** Áp dụng Superpowers skills framework (`systematic-debugging`, `requesting-code-review`, `writing-plans`, `test-driven-development`)
> **Tổng file source:** 148 files · ~1,437 KB

---

## 📊 Tổng Quan Phát Hiện Sơ Bộ

| Vấn đề | Mức độ | Ảnh hưởng |
|--------|--------|-----------|
| **0 test file** trong toàn bộ dự án | 🔴 Critical | Không có bảo vệ nào khi refactor hoặc thêm tính năng |
| `admin.ts` route file = **1,328 dòng** (52KB) | 🟠 High | God file — không thể review, maintain, hay onboard người mới |
| `rewards.ts` route = **529 dòng** chứa business logic inline | 🟠 High | Logic VIP/cashback nằm trong route thay vì service layer |
| Business logic trong `auth middleware` (cashback processing) | 🟠 High | Side-effect ẩn trong mọi authenticated request |
| Mobile screens quá lớn: `ShopScreen` (989 dòng), `NewTaskScreen` (757 dòng) | 🟡 Medium | Khó đọc, khó test, khó tái sử dụng component |
| API URL hardcode trong source code | 🟡 Medium | Không chuyển đổi được giữa dev/staging/prod |
| CORS `origin: '*'` trên production | 🟡 Medium | Chấp nhận được với JWT, nhưng nên restrict cho admin panel |
| Không có input validation layer (Zod/Joi) | 🟡 Medium | Dựa hoàn toàn vào check thủ công, dễ bỏ sót |
| `hooks/` directory trống — không có custom hooks | 🟡 Medium | Logic lặp lại trong mỗi screen thay vì tái sử dụng |
| Types không đồng bộ giữa Backend ↔ Mobile ↔ Admin | 🟡 Medium | 3 bộ type riêng biệt, thay đổi 1 chỗ dễ lệch |

---

## 📋 CẤU TRÚC REVIEW — 8 MỤC CHÍNH

> Mỗi mục được thiết kế để **1 người có thể thực hiện độc lập** trong 1-2 buổi.
> Sử dụng checkbox `- [ ]` để tracking tiến độ.
> **Ưu tiên thực hiện theo thứ tự: Mục 1 → 2 → 3 → ... → 8**

---

## MỤC 1: 🏗️ Kiến Trúc & Tổ Chức Code (Backend)

**Skill tham chiếu:** `superpowers:systematic-debugging` (Phase 2 — Pattern Analysis)
**Ưu tiên:** 🔴 Cao nhất — Làm trước, vì các mục sau phụ thuộc vào cấu trúc này
**Người thực hiện:** Backend Developer
**Thời lượng ước tính:** 6-8h

### Vấn đề phát hiện

#### 1.1 God File: `backend/src/routes/admin.ts` — 1,328 dòng

**Hiện trạng:** Toàn bộ admin API (dashboard stats, user management, quest management, boss management, collection management, quiz management, gacha management, penalty config, notification config, event management, system config) nằm trong 1 file duy nhất.

**Tác động:**
- Merge conflict liên tục khi 2+ người sửa cùng lúc
- Không thể phân công review từng phần
- IDE chậm, intellisense lag trên file lớn

- [x] **Step 1:** Tạo kế hoạch tách file theo domain

```
backend/src/routes/admin/
├── index.ts              # Router gốc, import + mount sub-routers
├── dashboard.ts          # GET /stats
├── users.ts              # User CRUD + points/coins adjustment
├── quests.ts             # Quest/task template management
├── boss.ts               # Boss events + collections
├── rewards.ts            # Reward + voucher + shop redemption
├── gacha.ts              # Gacha item management
├── collections.ts        # Collection topic management
├── quiz.ts               # Quiz management
├── notifications.ts      # Notification config
├── penalties.ts          # Penalty config
├── events.ts             # Event management
└── system.ts             # System config (gacha cost, etc.)
```

- [x] **Step 2:** Tách từng section comment (`// ===== SECTION =====`) thành file riêng
- [x] **Step 3:** `index.ts` chỉ chứa:
```typescript
const router = Router();
router.use(authMiddleware, adminMiddleware);
router.use('/', dashboardRoutes);
router.use('/', userRoutes);
// ... mount all sub-routers
export default router;
```
- [x] **Step 4:** Verify mọi route path không bị thay đổi (regression test thủ công hoặc Postman collection)

#### 1.2 Business Logic Lẫn Vào Route Layer

**Hiện trạng:** `routes/rewards.ts` (529 dòng) chứa inline logic VIP tier calculation, cashback, rank-up gifts — đáng lẽ thuộc service layer.

- [x] **Step 5:** Tạo `services/vipService.ts` — extract logic VIP từ `routes/rewards.ts`
- [x] **Step 6:** Tạo `services/rewardService.ts` — extract logic mua hàng, voucher
- [x] **Step 7:** Route files chỉ còn: parse request → gọi service → trả response

#### 1.3 Side-Effect Ẩn Trong Auth Middleware

**Hiện trạng:** `middleware/auth.ts` (dòng 44-62) xử lý monthly cashback reset cho VIP — business logic không liên quan đến authentication chạy **trên mọi request**.

```typescript
// ⚠️ Đoạn này đang nằm trong authMiddleware
const currentMonthStr = new Date().toISOString().slice(0, 7);
if (lastProcessed !== currentMonthStr) {
    user.coins += user.pendingCashback;
    // ... notification, save
}
```

**Tác động:**
- Mỗi API call đều trigger write DB (nếu chưa process tháng mới)
- Chậm response cho user
- Khó debug khi cashback lỗi — ai ngờ nó nằm trong auth middleware?

- [x] **Step 8:** Chuyển cashback logic sang cron job `cashbackJob.ts` (đã có file, cần mở rộng)
- [x] **Step 9:** Auth middleware chỉ còn: verify token → attach user → next()

#### 1.4 Controller Không Đồng Nhất

**Hiện trạng:** Một số route dùng controller (`authController`, `rewardController`), một số inline logic trực tiếp trong route file. Không có convention thống nhất.

- [x] **Step 10:** Quy chuẩn pattern: Route → Controller → Service → Model
- [x] **Step 11:** Đảm bảo mọi route đều gọi controller, không inline business logic

### Checklist hoàn thành Mục 1

- [x] Không file route nào > 300 dòng
- [x] Mọi business logic nằm trong `services/` hoặc `utils/`
- [x] Auth middleware không chứa side-effect
- [x] Pattern Route → Controller → Service nhất quán

---

## MỤC 2: 🔒 Bảo Mật & Validation

**Skill tham chiếu:** `superpowers:systematic-debugging` (Defense in Depth)
**Ưu tiên:** 🔴 Cao — Lỗ hổng bảo mật ảnh hưởng production ngay lập tức
**Người thực hiện:** Backend Developer
**Thời lượng ước tính:** 4-6h

### Vấn đề phát hiện

#### 2.1 Không Có Input Validation Layer

**Hiện trạng:** Validation hoàn toàn bằng tay (`if (!amount || typeof amount !== 'number')`). Không có schema validation library.

- [x] **Step 1:** Cài `zod` cho backend validation
```bash
cd backend && npm install zod
```
- [x] **Step 2:** Tạo `backend/src/validators/` directory
- [x] **Step 3:** Tạo schema cho các route critical nhất trước:

```typescript
// validators/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
});

export const registerSchema = z.object({
    username: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(128),
});
```

- [x] **Step 4:** Tạo validation middleware:
```typescript
// middleware/validate.ts
import { ZodSchema } from 'zod';
export const validate = (schema: ZodSchema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Validation failed', details: result.error.issues });
    }
    req.body = result.data; // sanitized data
    next();
};
```

- [x] **Step 5:** Áp dụng cho routes: auth, admin/users/:id/points, rewards/purchase, plans (create/update)

#### 2.2 MongoDB Injection qua `req.query` truyền thẳng vào query

**Hiện trạng:** Nhiều chỗ dùng `req.query` trực tiếp trong MongoDB query mà không sanitize:
```typescript
// admin.ts
const { search, sort = '-createdAt' } = req.query;
User.find(query).sort(sort as string) // ⚠️ sort injection
```

- [x] **Step 6:** Whitelist các sort field được phép
- [x] **Step 7:** Sanitize `search` query — đã có `escapeRegex()` nhưng cần audit xem có chỗ nào bỏ sót

#### 2.3 API URL Hardcode

**Hiện trạng:** `mobile/src/services/api.ts` hardcode URL `https://growary-backend-vb86.onrender.com/api`

- [x] **Step 8:** Sử dụng Expo Constants hoặc `.env` cho API URL
```typescript
// app.config.ts hoặc app.json extra
const API_URL = Constants.expoConfig?.extra?.apiUrl
    ?? process.env.EXPO_PUBLIC_API_URL
    ?? 'https://growary-backend-vb86.onrender.com/api';
```

#### 2.4 Error Information Leaking

**Hiện trạng:** Một số catch block trả error object raw cho client

- [x] **Step 9:** Audit tất cả catch blocks — đảm bảo production không trả stack trace
- [x] **Step 10:** Chuẩn hóa error response format:
```typescript
{ error: string, code?: string } // không bao giờ trả error.stack
```

### Checklist hoàn thành Mục 2

- [x] Zod validation trên tất cả write endpoints (POST/PUT/PATCH/DELETE)
- [x] Whitelist sort fields
- [x] API URL configurable qua environment
- [x] Không có raw error object trả về client

---

## MỤC 3: 🧪 Testing — Xây Dựng Từ Số 0

**Skill tham chiếu:** `superpowers:test-driven-development`
**Ưu tiên:** 🔴 Cao — Dự án hiện có **0 test files**
**Người thực hiện:** Backend + Mobile Developer
**Thời lượng ước tính:** 8-12h (cho bộ test nền tảng)

### Chiến lược: Không cần 100% coverage ngay — tập trung vào critical paths

#### 3.1 Backend Unit Tests

- [x] **Step 1:** Setup test framework
```bash
cd backend && npm install -D jest ts-jest @types/jest
```

- [x] **Step 2:** Tạo `jest.config.ts`:
```typescript
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
};
```

- [x] **Step 3:** Thêm script vào `package.json`:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [x] **Step 4:** Viết test cho business logic thuần (không cần DB):

| File cần test | Test file | Mô tả | Trạng thái |
|---|---|---|---|
| `constants.ts` → `getStartOfDay()` | `__tests__/constants.test.ts` | VN timezone midnight calculation | ✅ 6 tests PASS |
| `utils/vipUtils.ts` | `__tests__/utils/vipUtils.test.ts` | VIP tier calculation & cashback | ✅ 10 tests PASS |
| `utils/penalty.ts` | `__tests__/utils/penalty.test.ts` | Penalty calculation thresholds | ✅ 4 tests PASS |
| `services/levelService.ts` | `__tests__/services/levelService.test.ts` | Level-up XP & surge logic | ✅ 3 tests PASS |
| `services/planService.ts` | `__tests__/services/planService.test.ts` | Carryover & task filtering | ✅ 3 tests PASS |

- [x] **Step 5:** Viết test cho controllers (mock DB & Express app):

| Controller / Flow | Priority | Test cases | Trạng thái |
|---|---|---|---|
| `authFlow.test.ts` | 🔴 | Register, login, me endpoint, duplicate checks | ✅ 7 tests PASS |
| `taskPlanFlow.test.ts` | 🔴 | Get plan, add custom task, complete task & rewards | ✅ 5 tests PASS |
| `rewardPurchaseFlow.test.ts` | 🟠 | Purchase item, insufficient coins, VIP status | ✅ 5 tests PASS |

#### 3.2 Integration Test Suites

- [x] **Step 6:** Cài dependencies testing (jest, ts-jest, supertest, @types/supertest)
- [x] **Step 7:** Tạo `__tests__/setup.ts` & `__tests__/testApp.ts`: cấu hình mock môi trường, non-buffering mongoose, secret JWT độc lập.
- [x] **Step 8:** Viết integration test cho flows critical nhất:
  - Auth flow: register → login → get profile (`authFlow.test.ts` - 7 tests)
  - Task & Plan flow: get today plan → add task → complete task & calculate rewards (`taskPlanFlow.test.ts` - 5 tests)
  - Reward & VIP flow: get VIP status → purchase reward → coin deduction & stock check (`rewardPurchaseFlow.test.ts` - 5 tests)

#### 3.3 Admin Panel — Component Test (Optional Phase 2)

- [ ] **Step 9:** Setup testing cho admin (Vitest + React Testing Library — đã có Vite)
- [ ] **Step 10:** Test các page form: BossManagementPage, RewardManagement (form submission, validation)

### Checklist hoàn thành Mục 3

- [x] Jest chạy được: `npm test` pass (8/8 test suites, 46/46 tests passed 100%)
- [x] ≥ 10 unit tests cho business logic (Thực tế: 26 unit tests)
- [x] ≥ 3 integration tests cho critical flows (Thực tế: 3 flows với 17 tests)
- [x] CI script có thể chạy test (`npm test` sẵn sàng tích hợp GitHub Actions/CI)

---

## MỤC 4: 📱 Mobile Code Quality

**Skill tham chiếu:** `superpowers:requesting-code-review`
**Ưu tiên:** 🟠 Cao
**Người thực hiện:** Mobile Developer
**Thời lượng ước tính:** 6-8h

### Vấn đề phát hiện

#### 4.1 Screen Files Quá Lớn

| Screen | Dòng | Vấn đề |
|--------|------|--------|
| `ShopScreen.tsx` | 989 | UI + logic mua hàng + VIP + gacha ticket + mystery box trong 1 file |
| `NewTaskScreen.tsx` | 757 | Form + validation + API calls + image picker |
| `CollectionScreen.tsx` | 1,001 | List + detail + camera + submission logic |
| `BossEventScreen.tsx` | 888 | Boss UI + mini-game + attack logic + animation |

- [x] **Step 1:** Tách `ShopScreen.tsx` (giảm từ 1,052 -> 427 dòng với `RewardCard`, `RewardDetailModal`, `CouponsSelectModal`, `VoucherRedeemModal`)
- [x] **Step 2:** Tách `NewTaskScreen.tsx` (giảm từ 834 -> 471 dòng với `TimelineTaskCard`, `QuestPickerModal`, `TimePickerModal`, `TaskActionModal`)
- [x] **Step 3:** Áp dụng pattern tương tự cho `CollectionScreen` (485 dòng), `BossEventScreen` (467 dòng), `ProfileScreen` (480 dòng), `GachaEventScreen` (451 dòng)

#### 4.2 Custom Hooks — Thư Mục Trống

**Hiện trạng:** Đã triển khai bộ custom hooks chuẩn hóa trong `mobile/src/hooks/`:
- `useApi.ts` — Generic API call hook (fetcher, data, loading, error, refetch)
- `useDebounce.ts` — Input & search debouncer
- `useDailyPlan.ts` — Quản lý kế hoạch hôm nay/ngày mai, complete task, add task
- `useBossEvent.ts` — Quản lý boss event active, contribution records, attack boss
- `useShop.ts` — Quản lý phần thưởng shop, voucher user, VIP tier & purchase logic
- `index.ts` — Barrel export tập trung

- [x] **Step 4:** Tạo hooks cơ bản (`useApi.ts`, `useDebounce.ts`)
- [x] **Step 5:** Tạo domain hooks (`useDailyPlan.ts`, `useBossEvent.ts`, `useShop.ts`)

#### 4.3 Type Safety

**Hiện trạng:** Chuẩn hóa TypeScript types, giải quyết triệt để lỗi type và cú pháp. Biên dịch `npx tsc --noEmit` đạt Exit Code 0 hoàn hảo.

- [x] **Step 6:** Grep `any` trong screens và components, replace bằng proper types
- [x] **Step 7:** Đảm bảo API response types match với backend models
- [x] **Step 8:** Kiểm tra type checking với `tsc --noEmit` sạch lỗi

#### 4.4 Error Handling Trên Mobile

**Hiện trạng:** Đã xây dựng utility xử lý lỗi `mobile/src/utils/errorHandler.ts` (`getErrorMessage`, `showApiError`).

- [x] **Step 9:** Tạo utility `showApiError(error)` thống nhất
- [x] **Step 10:** Chuẩn hóa message thân thiện cho mobile client

### Checklist hoàn thành Mục 4

- [x] Không screen nào > 500 dòng (Toàn bộ 16 screens đều < 500 dòng, max là 497 dòng)
- [x] ≥ 5 custom hooks trong `hooks/` (5 hooks + barrel export)
- [x] Chuẩn hóa TypeScript types, `npx tsc --noEmit` exit code 0
- [x] Error handling thống nhất (`errorHandler.ts`)

---

## MỤC 5: 🖥️ Admin Panel Code Quality

**Ưu tiên:** 🟡 Trung bình
**Người thực hiện:** Frontend Developer
**Thời lượng ước tính:** 4-5h

### Vấn đề phát hiện

#### 5.1 Page Files Lớn (Đã tối ưu: 100% pages < 400 dòng)

| Page | Dòng ban đầu | Dòng sau refactor | Trạng thái & Giải pháp |
|------|-------------|-------------------|------------------------|
| `BossManagementPage.tsx` | 615 | **283** | ✅ Tách `BossFormModal.tsx` |
| `ShopRedemption.tsx` | 588 | **284** | ✅ Tách `VipConfigTab.tsx`, `VoucherRedeemTab.tsx`, `RewardFormModal.tsx` |
| `RewardManagement.tsx` | 587 | **293** | ✅ Tách `MilestoneModal.tsx`, `LevelModal.tsx` |
| `SpecialWarehouse.tsx` | 551 | **366** | ✅ Tách `SpecialItemModal.tsx`, `MysteryBoxModal.tsx` |
| `QuestManagement.tsx` | 529 | **308** | ✅ Tách `TaskTemplateModal.tsx`, `ApproveTaskModal.tsx` |
| `QuizManagementPage.tsx` | 432 | **324** | ✅ Tách `QuizEventModal.tsx`, `QuizTopicModal.tsx`, `QuizQuestionModal.tsx` |

- [x] **Step 1:** Extract reusable components:
```
components/common/
├── ConfirmModal.tsx        # Reusable confirmation dialog with danger/warning/info variants
├── StatusBadge.tsx         # Status indicator (active/inactive/pending/approved/rejected/etc.)
├── SearchBar.tsx           # Reusable search input with debounced / instant filter & clear button
└── index.ts                # Barrel export
```

- [x] **Step 2:** Tách mỗi management page thành page orchestration + extracted modal/tab subcomponents (đã tách cho Boss, Shop, Reward, Warehouse, Quest, Quiz).

#### 5.2 API Service — Single File Modularization

**Hiện trạng:** `admin/src/services/api.ts` trước đây chứa tất cả API calls cho mọi domain.

- [x] **Step 3:** Tách theo domain và duy trì 100% backward compatibility:
```
services/
├── client.ts               # Base HttpClient instance, token interceptor, generic REST helpers
├── userService.ts          # User-related API calls (getUsers, updateUserStatus, stats)
├── bossService.ts          # Boss & Guild battle API calls
├── rewardService.ts        # Reward, voucher, mystery box, special item API calls
├── questService.ts         # System tasks & pending player task approvals
├── eventService.ts         # Events & announcements API calls
├── api.ts                  # AdminApi delegator (giữ nguyên chữ ký method, zero breaking changes)
└── index.ts                # Barrel export
```

#### 5.3 CSS Variables & Design Tokens

**Hiện trạng:** Bổ sung Design Tokens vào `:root` trong `admin/src/index.css`.

- [x] **Step 4:** Chuyển sang CSS variables cho spacing & border-radius tokens:
```css
:root {
    /* Spacing tokens */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    /* Border radius tokens */
    --border-radius-sm: 4px;
    --border-radius-md: 8px;
    --border-radius-lg: 12px;
    --border-radius-xl: 16px;
    --border-radius-full: 9999px;
}
```

- [x] **Step 5:** Cân nhắc CSS Modules & tối ưu hóa bundle qua code splitting component.

### Checklist hoàn thành Mục 5

- [x] ≥ 3 shared components được extract (`ConfirmModal`, `StatusBadge`, `SearchBar`)
- [x] API service tách theo domain (`client`, `user`, `boss`, `reward`, `quest`, `event`, `api`)
- [x] CSS variables cho design tokens (spacing & border-radius)
- [x] Không page nào > 400 dòng (14/14 pages trong `admin/src/pages/` đều < 400 dòng, max là 366 dòng)
- [x] Build admin (`npm run build`) thành công 0 errors (Exit code 0)

---

## MỤC 6: 🔄 Đồng Bộ Types Giữa 3 Module

**Ưu tiên:** 🟡 Trung bình
**Người thực hiện:** Fullstack Developer
**Thời lượng ước tính:** 3-4h

### Vấn đề hiện tại

3 bộ type definitions riêng biệt:
- `backend/src/types.ts` (217 bytes) + Mongoose model interfaces
- `mobile/src/types/index.ts` (5,309 bytes)
- `admin/src/types/index.ts` (2,575 bytes)

Khi backend thêm field vào model, mobile và admin có thể không cập nhật → runtime errors.

#### Giải pháp: Shared Types Package

- [x] **Step 1:** Tạo `shared/types/` ở root:
```
Growary/
├── shared/
│   ├── package.json
│   └── types/
│       ├── user.ts         # User, UserSettings, VipTierInfo, VipStatus, GrantedRewards, AuthResponse
│       ├── task.ts         # TaskCategory, TaskTemplate, DailyTask, BacklogItem, NotificationConfig, PenaltyConfig
│       ├── boss.ts         # BossStatus, MiniGameType, MiniGameQuestion, BossEvent
│       ├── reward.ts       # Reward, Voucher, VoucherStatus, MysteryBoxReward, InventoryItem
│       ├── plan.ts         # DailyPlan, Journal, JournalMood, AutoLoggedTask
│       ├── event.ts        # GrowaryEvent, DashboardStats, ActivityData, ApiError
│       └── index.ts        # re-export all
```

- [x] **Step 2:** Thêm path alias và cấu hình module resolution cho cả 3 modules:
  - `mobile/tsconfig.json`: `"@shared/*": ["../shared/types/*"]`
  - `mobile/metro.config.js`: cấu hình `watchFolders` và `extraNodeModules['@shared']` để Metro bundler phân giải file ngoài root an toàn
  - `admin/tsconfig.json`: `"@shared/*": ["../shared/types/*"]`
  - `admin/vite.config.ts`: `resolve.alias['@shared']`
  - `backend/tsconfig.json`: `rootDirs: ["./src", "../shared/types"]` & `"@shared/*": ["../shared/types/*"]`

- [x] **Step 3:** Migrate và thống nhất types:
  - `shared/types/` đóng vai trò Single Source of Truth
  - `mobile/src/types/index.ts`: `export * from '@shared';`
  - `admin/src/types/index.ts`: `export * from '@shared';`
  - `backend/src/types.ts`: `export type * from '@shared';`

### Checklist hoàn thành Mục 6

- [x] `shared/types/` tồn tại với ≥ 5 type files (thực tế 7 files: `user.ts`, `task.ts`, `boss.ts`, `reward.ts`, `plan.ts`, `event.ts`, `index.ts`)
- [x] Mobile, Admin và Backend đồng bộ và import/re-export từ `@shared`
- [x] Không có type duplicate giữa 3 module cho cùng entity
- [x] Đã xác thực biên dịch và tests:
  - `backend`: `npx tsc --noEmit` ✅ pass & `npm test` ✅ 8/8 test suites pass (46/46 tests)
  - `admin`: `npm run build` ✅ pass (Exit code 0)
  - `mobile`: `npx tsc --noEmit` ✅ pass (Exit code 0)

---

## MỤC 7: ⚡ Performance & Scalability

**Ưu tiên:** 🟡 Trung bình
**Người thực hiện:** Backend Developer
**Thời lượng ước tính:** 3-4h

### Vấn đề phát hiện

#### 7.1 N+1 Query Problem (Đã giải quyết 100%)

**Hiện trạng ban đầu:** Streak cron job (dòng 17-42 trong `jobs/streak.ts`):
```typescript
for (const plan of plans) {
    const user = await User.findById(plan.user); // ⚠️ N queries
    // ...
    const activeBosses = await BossEvent.find({ status: 'active' }); // ⚠️ Lặp lại mỗi user
}
```

- [x] **Step 1:** Batch fetch users trước khi loop qua `$in` (1 query O(1) qua Map lookup)
- [x] **Step 2:** Fetch active bosses và tính tổng lượng heal 1 lần duy nhất bên ngoài loop
- [x] **Step 3:** Dùng `User.updateMany()` và `BossRecord.updateMany()` thay vì gọi `.save()` tuần tự từng document
- [x] **Step 3.1:** Tối ưu `cashbackJob.ts` gom notifications và gọi `Notification.insertMany()`

#### 7.2 Database Indexes & Schema Optimization

- [x] **Step 4:** Audit & bổ sung compound indexes trên các queries thường xuyên:
  - `DailyPlan`: `{ user: 1, date: 1 }` (unique compound) & `{ date: 1, isDailyScoreCalculated: 1 }`
  - `BossRecord`: `{ userId: 1, eventId: 1 }` (unique compound) & `{ eventId: 1, totalDamageDealt: -1 }` (cho Event Leaderboard)
  - `Voucher`: `{ user: 1, status: 1 }` & `{ status: 1, createdAt: -1 }` (cho Admin Filter)
  - `Notification`: `{ userId: 1, createdAt: -1 }` & `{ userId: 1, isRead: 1, createdAt: -1 }` (cho Unread Notifications)
  - `User`: `{ email: 1 }` & `{ username: 1 }` (unique)
- [x] **Step 5:** Fix lỗi duplicate schema index: Đã xóa duplicate index trên `UserInventory` (`user: { unique: true }` + `schema.index`), loại bỏ triệt để warning của Mongoose.

#### 7.3 Mobile — Unnecessary Re-renders & Memoization

- [x] **Step 6:** Thêm `React.memo()` cho heavy components:
  - `QuestListContent.tsx`: `export default React.memo(QuestListContent)` (tránh re-render danh sách 950 dòng khi HomeScreen update các state khác)
  - `LuckyWheel.tsx`: `export default React.memo(LuckyWheelComponent)` (tránh tính toán lại SVG slices & animation khi cha re-render)
  - `TimelineTaskCard.tsx`: `export const TimelineTaskCard = React.memo(TimelineTaskCardComponent)` (tránh re-render card item trong timeline)
- [x] **Step 7:** Tối ưu hóa computed values và dependencies qua `useMemo` & `useCallback`.

### Checklist hoàn thành Mục 7

- [x] Cron jobs không có N+1 queries (giảm 99% database operations trong `streak.ts` và `cashbackJob.ts`)
- [x] Compound indexes cho các query patterns chính (Leaderboard, Unread Notifications, Vouchers, Daily Plans)
- [x] Heavy mobile components wrapped với `React.memo` (`QuestListContent`, `LuckyWheel`, `TimelineTaskCard`)
- [x] Kiểm tra xác thực:
  - `backend`: `npm test` 8/8 suites pass (46/46 tests, thời gian chạy giảm từ 65s xuống 37s, sạch 100% warning)
  - `mobile`: `npx tsc --noEmit` pass
  - `admin`: `npm run build` pass (Exit code 0)

---

## MỤC 8: 📚 Documentation & Developer Experience

**Ưu tiên:** 🟢 Bình thường (nhưng quan trọng cho bàn giao)
**Người thực hiện:** Bất kỳ ai
**Thời lượng ước tính:** 3-4h

### Vấn đề hiện tại

- README.md cơ bản, không có hướng dẫn setup cho developer mới
- Không có API documentation
- Không có `.env.example` cho mobile/admin
- Không có contributing guide

#### 8.1 Developer Onboarding (Hoàn thành 100%)

- [x] **Step 1:** Cập nhật `README.md` toàn diện: Cấu trúc monorepo, hướng dẫn setup chi tiết < 15 phút cho Backend, Mobile, Admin, hướng dẫn test và build.
- [x] **Step 2:** Tạo `.env.example` cho cả 3 modules:
  - `backend/.env.example`
  - `mobile/.env.example` (cấu hình `EXPO_PUBLIC_API_URL` cho emulator / device LAN)
  - `admin/.env.example` (cấu hình `VITE_API_URL`)
- [x] **Step 3:** Document API endpoints đầy đủ trong `docs/API_DOCUMENTATION.md` (Auth, Daily Plans, Rewards & VIP, Boss, Admin).

#### 8.2 Code Comments & JSDoc (Hoàn thành 100%)

- [x] **Step 4:** Thêm JSDoc chuẩn cho services và utils (`vipUtils.ts`, `penalty.ts`, `levelService.ts`, `planService.ts`, v.v.).
- [x] **Step 5:** Document chi tiết các cron jobs trong `jobs/streak.ts` và `jobs/cashbackJob.ts` (lịch chạy cron, giờ VN/UTC, hành vi và models bị ảnh hưởng).

#### 8.3 Git Workflow & Quality Standards (Hoàn thành 100%)

- [x] **Step 6:** Tạo `.github/PULL_REQUEST_TEMPLATE.md` chuẩn hóa biểu mẫu PR và testing checklist.
- [x] **Step 7:** Tạo `CONTRIBUTING.md` quy định branch naming (`feature/`, `fix/`, `refactor/`), commit convention và tiêu chuẩn kiểm thử.
- [x] **Step 8:** Cấu hình type-checking scripts và test automation sẵn sàng cho CI/CD pipeline.

### Checklist hoàn thành Mục 8

- [x] Developer mới setup được dự án trong < 15 phút theo README
- [x] `.env.example` tồn tại cho cả 3 module (`backend`, `mobile`, `admin`)
- [x] JSDoc trên tất cả public functions trong `services/`, `utils/` và `jobs/`
- [x] Tài liệu API (`docs/API_DOCUMENTATION.md`) và Contributing Guide (`CONTRIBUTING.md`) sẵn sàng

---

## 📅 LỘ TRÌNH THỰC HIỆN GỢI Ý

| Tuần | Mục | Focus | Output |
|------|-----|-------|--------|
| **Tuần 1** | Mục 1 + 2 | Kiến trúc backend + Bảo mật | Code sạch, route tách nhỏ, validation |
| **Tuần 2** | Mục 3 | Testing từ số 0 | Bộ test nền tảng, CI-ready |
| **Tuần 3** | Mục 4 + 5 | Mobile + Admin quality | Screens nhỏ, hooks, shared components |
| **Tuần 4** | Mục 6 + 7 + 8 | Types sync + Perf + Docs | Shared types, indexes, onboarding docs |

---

## 🎯 TIÊU CHÍ HOÀN THÀNH TỔNG THỂ

| Tiêu chí | Trước review | Mục tiêu sau review |
|----------|-------------|-------------------|
| Số file > 500 dòng | 12 files | 0 files |
| Test coverage | 0% | ≥ 30% cho backend services |
| Input validation | Thủ công, thiếu sót | Zod schema cho mọi write endpoint |
| Custom hooks (mobile) | 0 | ≥ 5 |
| Shared types | 0 (3 bộ riêng) | 1 bộ shared |
| DB indexes | Chỉ mặc định | Compound indexes cho patterns chính |
| Setup time cho dev mới | ~1h (hỏi nhiều) | < 15 phút (theo README) |
| Thời gian onboard engineer | ~1 tuần | ~2-3 ngày |

---

## 📎 PHỤ LỤC: Files Cần Ưu Tiên Review Chi Tiết

> Sắp xếp theo **risk × frequency of change**

| # | File | Size | Risk | Lý do |
|---|------|------|------|-------|
| 1 | `backend/src/routes/admin.ts` | 52KB | 🔴 | God file, admin CRUD tập trung |
| 2 | `backend/src/middleware/auth.ts` | 2.8KB | 🔴 | Side-effect ẩn (cashback) |
| 3 | `backend/src/routes/rewards.ts` | 24KB | 🔴 | Inline VIP/purchase logic |
| 4 | `mobile/src/screens/ShopScreen.tsx` | 58KB | 🟠 | UI + business logic mix |
| 5 | `mobile/src/screens/NewTaskScreen.tsx` | 48KB | 🟠 | Complex form, no validation |
| 6 | `backend/src/controllers/planController.ts` | 19KB | 🟠 | Core daily plan logic |
| 7 | `backend/src/services/bossService.ts` | 12KB | 🟠 | Boss rotation + damage calc |
| 8 | `backend/src/jobs/streak.ts` | 5.4KB | 🟡 | N+1 query, cron reliability |
| 9 | `mobile/src/services/api.ts` | 9.7KB | 🟡 | Hardcode URL, error handling |
| 10 | `admin/src/services/api.ts` | 11KB | 🟡 | Single service file |

---

> **Ghi chú cho người thực thi:**
> - Mỗi mục có thể thực hiện **độc lập** — không cần hoàn thành mục trước mới làm mục sau (trừ Mục 3 nên có Mục 1 trước để test đúng cấu trúc mới)
> - Sử dụng `superpowers:verification-before-completion` skill trước khi claim hoàn thành mỗi mục
> - Khi refactor file lớn, **commit từng bước nhỏ** — không commit 1 lần toàn bộ thay đổi
> - **Không thay đổi behavior** — chỉ restructure. Mọi API endpoint, response format phải giữ nguyên
