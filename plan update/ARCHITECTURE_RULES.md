# 📜 GROWARY — BỘ LUẬT KIẾN TRÚC & PHÁT TRIỂN BỀN VỮNG
# Architectural Governance Rulebook v1.0

> **Ngày lập:** 2026-10-16
> **Phiên bản:** 1.0
> **Áp dụng cho:** Backend · Mobile · Admin · Shared Types
> **Đối tượng:** Tất cả developer (con người hoặc AI agent) làm việc trên dự án Growary
> **Mức độ tuân thủ:** **BẮT BUỘC** — Mọi vi phạm phải được justify bằng văn bản và được tech lead approve trước khi merge

---

## 🎯 MỤC ĐÍCH

Bộ luật này được tạo ra sau khi dự án hoàn thành quá trình cấu trúc lại toàn diện (Review 16/10/2026, 8 mục).
Mục tiêu:
1. **Bảo vệ cấu trúc hiện tại** khỏi bị phá vỡ bởi thay đổi thiếu kiểm soát
2. **Hướng dẫn phát triển mới** theo pattern đã được thiết lập
3. **Giảm thiểu nhu cầu tái cấu trúc** trong tương lai
4. **Đảm bảo consistency** khi nhiều developer hoặc AI agent cùng làm việc

---

## 📑 MỤC LỤC

- [Phần 0: Luật Chung — Áp Dụng Cho Toàn Bộ Dự Án](#phần-0-luật-chung--áp-dụng-cho-toàn-bộ-dự-án)
- [Phần 1: Backend — Node.js / Express / MongoDB](#phần-1-backend--nodejs--express--mongodb)
- [Phần 2: Mobile — React Native / Expo](#phần-2-mobile--react-native--expo)
- [Phần 3: Admin — React / Vite](#phần-3-admin--react--vite)
- [Phần 4: Shared Types — Single Source of Truth](#phần-4-shared-types--single-source-of-truth)
- [Phần 5: Quy Trình Git & CI/CD](#phần-5-quy-trình-git--cicd)
- [Phần 6: Bảng Vi Phạm & Mức Xử Lý](#phần-6-bảng-vi-phạm--mức-xử-lý)
- [Phần 7: Quy Trình Thay Đổi Bộ Luật](#phần-7-quy-trình-thay-đổi-bộ-luật)

---

## Phần 0: Luật Chung — Áp Dụng Cho Toàn Bộ Dự Án

### 0.1 Giới Hạn Kích Thước File

| Module | Loại file | Giới hạn tối đa | Hành động khi vượt |
|--------|-----------|-----------------|---------------------|
| Backend | Route file | **300 dòng** | Tách thành sub-routes |
| Backend | Controller | **400 dòng** | Extract logic sang service |
| Backend | Service | **500 dòng** | Tách thành sub-services theo chức năng |
| Mobile | Screen file | **500 dòng** | Extract components + custom hooks |
| Mobile | Component file | **400 dòng** | Tách thành sub-components |
| Admin | Page file | **400 dòng** | Extract modal/tab/form thành sub-components |
| Admin | Service file | **300 dòng** | Tách theo domain |
| Chung | Bất kỳ file nào | **600 dòng** | **PHẢI** refactor trước khi merge |

> **Nguyên tắc:** Nếu một file đang ở **80% giới hạn**, hãy bắt đầu lên kế hoạch tách — đừng đợi đến khi chạm giới hạn.

### 0.2 TypeScript Strict Mode

```
- Không sử dụng `any` — dùng `unknown` nếu không biết type, rồi narrow down
- Không sử dụng `@ts-ignore` hoặc `@ts-expect-error` — fix root cause
- Không sử dụng `as` type assertion trừ khi có comment giải thích lý do
- Tất cả function parameters và return types PHẢI được annotate
- Biên dịch `npx tsc --noEmit` PHẢI pass (Exit code 0) trước khi commit
```

### 0.3 Cấm Tuyệt Đối (Zero Tolerance)

| Hành vi | Lý do |
|---------|-------|
| ❌ Thêm business logic vào middleware (auth, validate, error handler) | Side-effect ẩn, không thể test độc lập |
| ❌ Hardcode URL, secrets, API keys trong source code | Phải dùng environment variables |
| ❌ Duplicate type definitions giữa các module | Phải dùng `shared/types/` |
| ❌ Trả raw error stack trace cho client | Bảo mật — dùng standardized error response |
| ❌ Commit trực tiếp vào `main` | Phải qua PR + review |
| ❌ Xóa hoặc skip test hiện có mà không có replacement | Test chỉ được xóa khi feature bị remove hoàn toàn |
| ❌ Import trực tiếp từ `../../../` quá 3 levels | Dùng path aliases (`@shared/*`, `@components/*`) |
| ❌ `console.log` trong production code | Dùng structured logging hoặc xóa trước khi commit |
| ❌ Inline CSS style dạng `style={{}}` quá 3 properties (Mobile/Admin) | Extract thành StyleSheet hoặc CSS class |

### 0.4 JSDoc Bắt Buộc

Mọi **public function** trong các thư mục sau PHẢI có JSDoc:
- `backend/src/services/`
- `backend/src/utils/`
- `backend/src/jobs/`
- `mobile/src/hooks/`
- `mobile/src/utils/`
- `admin/src/services/`

**Format tối thiểu:**
```typescript
/**
 * Mô tả ngắn gọn chức năng
 * @param paramName - Mô tả parameter
 * @returns Mô tả return value
 */
```

### 0.5 Error Handling Chuẩn

**Backend:** Mọi controller method PHẢI bọc trong try-catch và sử dụng `errorHandler` middleware:
```typescript
// ✅ Đúng
try {
    const result = await someService.doSomething(req.body);
    res.json(result);
} catch (error) {
    next(error); // errorHandler middleware xử lý
}

// ❌ Sai — trả raw error
catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
}
```

**Mobile:** Sử dụng `utils/errorHandler.ts` (`getErrorMessage`, `showApiError`):
```typescript
// ✅ Đúng
catch (error) {
    showApiError(error, 'Không thể tải dữ liệu');
}
```

**Admin:** Sử dụng try-catch với thông báo user-friendly, không hiển thị technical details.

---

## Phần 1: Backend — Node.js / Express / MongoDB

### 1.1 Kiến Trúc Layers (BẮT BUỘC)

```
Request → Route → [Validate Middleware] → Controller → Service → Model → Database
                                              ↑
                                        Utils / Constants
```

**Trách nhiệm từng layer:**

| Layer | File Location | Trách nhiệm | KHÔNG được làm |
|-------|---------------|-------------|----------------|
| **Route** | `routes/*.ts` | Khai báo HTTP method + path, mount middleware, gọi controller | Business logic, DB query, validation logic |
| **Validate** | `validators/*.ts` + `middleware/validate.ts` | Zod schema validation cho request body/params/query | Business logic, DB access |
| **Controller** | `controllers/*.ts` | Parse request, gọi service, format response, error handling | Truy vấn DB trực tiếp, business logic phức tạp |
| **Service** | `services/*.ts` | Business logic, orchestrate multiple models, tính toán | Format HTTP response, access `req`/`res` objects |
| **Model** | `models/*.ts` | Schema definition, indexes, virtual fields, static methods | Business logic, HTTP-related code |
| **Utils** | `utils/*.ts` | Pure functions, helper utilities | DB access, HTTP-related code, stateful operations |
| **Jobs** | `jobs/*.ts` | Cron job logic, batch operations | HTTP response, synchronous user-facing operations |

### 1.2 Cấu Trúc Thư Mục Backend (Đóng Băng)

```
backend/src/
├── __tests__/              # Test files — mirror cấu trúc src
│   ├── setup.ts            # Test environment setup
│   ├── testApp.ts          # Mock Express app
│   ├── constants.test.ts
│   ├── utils/
│   │   ├── vipUtils.test.ts
│   │   └── penalty.test.ts
│   ├── services/
│   │   ├── levelService.test.ts
│   │   └── planService.test.ts
│   └── integration/
│       ├── authFlow.test.ts
│       ├── taskPlanFlow.test.ts
│       └── rewardPurchaseFlow.test.ts
├── config/                 # Database, third-party configs
├── controllers/            # Request handlers — 1 file per domain
├── jobs/                   # Cron jobs — batch processing
├── middleware/              # Auth, validation, error handler ONLY
│   ├── auth.ts             # ONLY: verify token → attach user → next()
│   ├── validate.ts         # ONLY: Zod schema validation
│   └── errorHandler.ts     # ONLY: Centralized error formatting
├── models/                 # Mongoose schemas — 1 file per collection
├── routes/                 # HTTP route definitions
│   ├── admin/              # Admin sub-routes tách theo domain
│   │   ├── index.ts        # Mount all admin sub-routers
│   │   ├── dashboard.ts
│   │   ├── users.ts
│   │   ├── quests.ts
│   │   ├── boss.ts
│   │   ├── rewards.ts
│   │   ├── gacha.ts
│   │   ├── collections.ts
│   │   ├── quiz.ts
│   │   ├── notifications.ts
│   │   ├── penalties.ts
│   │   ├── events.ts
│   │   └── system.ts
│   ├── auth.ts
│   ├── plans.ts
│   ├── rewards.ts
│   ├── tasks.ts
│   ├── ... (1 file per API domain)
│   └── admin.ts            # Proxy → admin/index.ts
├── scripts/                # One-off migration/seed scripts
├── seeds/                  # Database seed data
├── services/               # Business logic layer
│   ├── bossService.ts
│   ├── levelService.ts
│   ├── planService.ts
│   ├── rewardService.ts
│   └── vipService.ts
├── utils/                  # Pure utility functions
├── validators/             # Zod schemas — 1 file per domain
│   ├── authValidator.ts
│   ├── planValidator.ts
│   ├── rewardValidator.ts
│   └── userValidator.ts
├── constants.ts            # Application constants
├── server.ts               # Express app setup & startup
└── types.ts                # Re-export from @shared
```

### 1.3 Quy Tắc Thêm Feature Mới (Backend)

Khi thêm tính năng mới, developer **PHẢI** tạo đúng các file sau theo thứ tự:

```
1. shared/types/<domain>.ts       → Thêm type/interface mới (nếu cần)
2. backend/src/models/<Model>.ts  → Thêm/update Mongoose schema
3. backend/src/validators/<domain>Validator.ts → Tạo Zod schema validation
4. backend/src/services/<domain>Service.ts → Business logic
5. backend/src/controllers/<domain>Controller.ts → Request handler
6. backend/src/routes/<domain>.ts → Route definition
7. backend/src/__tests__/         → Viết test TRƯỚC hoặc CÙNG LÚC với code
```

**Checklist trước khi commit feature mới:**
- [ ] Type mới đã thêm vào `shared/types/` và export trong `index.ts`
- [ ] Zod validator đã tạo cho mọi write endpoint (POST/PUT/PATCH/DELETE)
- [ ] Controller chỉ chứa: parse request → gọi service → format response
- [ ] Service chứa toàn bộ business logic, không access `req`/`res`
- [ ] Route file chỉ khai báo path + middleware + controller call
- [ ] Test đã viết cho service logic
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass

### 1.4 Quy Tắc Middleware

```
✅ Middleware CHỈ được làm:
   - auth.ts: Verify JWT token → tìm user → gắn req.user → next()
   - validate.ts: Parse Zod schema → trả 400 nếu fail → next()
   - errorHandler.ts: Catch error → format response → trả client

❌ Middleware KHÔNG được:
   - Chứa business logic (tính toán, quyết định nghiệp vụ)
   - Ghi dữ liệu vào DB (ngoại trừ logging, nếu có)
   - Trigger side-effect (gửi notification, update VIP, cashback, v.v.)
   - Import models trực tiếp (trừ User model trong auth.ts)
```

### 1.5 Quy Tắc Database

```
1. MỖI collection PHẢI có 1 file model riêng trong models/
2. KHÔNG tạo collection mới mà không có compound index đi kèm
3. Mọi query trong cron jobs PHẢI dùng batch operations:
   - $in thay vì loop findById()
   - updateMany() thay vì loop save()
   - insertMany() thay vì loop create()
4. Sort fields từ req.query PHẢI qua whitelist, KHÔNG truyền trực tiếp
5. Text search PHẢI dùng escapeRegex() hoặc $text index
6. Không dùng .lean() trên document cần .save() sau đó
```

### 1.6 Quy Tắc Cron Jobs

```
1. Mỗi cron job 1 file riêng trong jobs/
2. PHẢI có JSDoc header ghi rõ: schedule, timezone, models affected
3. PHẢI dùng batch query (xem 1.5 mục 3)
4. PHẢI có error handling — 1 record fail không được crash toàn bộ job
5. KHÔNG import req/res — cron jobs không liên quan đến HTTP
6. Log kết quả: số records processed, số lỗi, thời gian chạy
```

### 1.7 Quy Tắc Zod Validation

```
1. Mỗi domain 1 file validator: validators/<domain>Validator.ts
2. Schema name convention: <action><Domain>Schema
   - Ví dụ: loginSchema, registerSchema, createPlanSchema, purchaseRewardSchema
3. PHẢI validate cho mọi endpoint nhận body từ client (POST/PUT/PATCH/DELETE)
4. Sử dụng validate middleware trong route:
   router.post('/create', validate(createPlanSchema), planController.create)
5. KHÔNG validate trong controller hoặc service — chỉ trong middleware
```

---

## Phần 2: Mobile — React Native / Expo

### 2.1 Cấu Trúc Thư Mục Mobile (Đóng Băng)

```
mobile/src/
├── components/             # Reusable UI components
│   ├── boss/               # Boss-specific components
│   ├── collection/         # Collection-specific components
│   ├── gacha/              # Gacha-specific components
│   ├── profile/            # Profile-specific components
│   ├── shop/               # Shop-specific components (RewardCard, modals)
│   ├── task/               # Task-specific components (TimelineTaskCard, modals)
│   ├── QuestListContent.tsx
│   ├── LuckyWheel.tsx
│   ├── MiniGameModal.tsx
│   ├── ... (shared components)
│   └── [NewDomain]/        # ← Thêm folder mới khi cần
├── context/                # React Context providers
├── hooks/                  # Custom hooks — logic tái sử dụng
│   ├── index.ts            # Barrel export
│   ├── useApi.ts           # Generic API fetcher
│   ├── useDebounce.ts      # Input debouncer
│   ├── useDailyPlan.ts     # Daily plan logic
│   ├── useBossEvent.ts     # Boss event logic
│   ├── useShop.ts          # Shop & purchase logic
│   └── [useNewDomain.ts]   # ← Thêm hooks mới theo domain
├── navigation/             # React Navigation config
├── screens/                # Screen components — orchestration layer
├── services/               # API call layer
│   └── api.ts              # Centralized API client
├── theme.ts                # Design tokens (colors, spacing, typography)
├── types/                  # Re-export from @shared
│   └── index.ts            # export * from '@shared'
└── utils/                  # Pure helper functions
    └── errorHandler.ts     # getErrorMessage, showApiError
```

### 2.2 Quy Tắc Component

```
1. Component > 400 dòng → PHẢI tách thành sub-components
2. Screen > 500 dòng → PHẢI extract logic vào custom hook + tách components
3. Mỗi domain phức tạp có folder riêng trong components/:
   - components/shop/    → RewardCard, RewardDetailModal, CouponsSelectModal
   - components/task/    → TimelineTaskCard, QuestPickerModal, TimePickerModal
   - components/boss/    → BossHealthBar, AttackButton, ...
4. Component nào nhận > 5 props → tạo interface riêng, đặt tên Props suffix
5. Heavy components (list items, SVG, animation) → PHẢI bọc React.memo()
```

### 2.3 Quy Tắc Custom Hooks

```
1. Logic lặp lại ≥ 2 screens → PHẢI extract thành custom hook trong hooks/
2. Hook naming: use<Domain>.ts (useDailyPlan, useBossEvent, useShop)
3. Mọi hook mới PHẢI export trong hooks/index.ts (barrel export)
4. Hook KHÔNG được chứa UI code (JSX) — chỉ trả về data + functions
5. Hook PHẢI return typed object, không return tuple quá 3 elements
6. API calls trong hook PHẢI dùng useApi hoặc pattern tương đương
```

**Template tạo custom hook mới:**
```typescript
// hooks/useNewFeature.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

interface UseNewFeatureReturn {
    data: NewFeatureData | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    doAction: (params: ActionParams) => Promise<void>;
}

/**
 * Hook quản lý logic [mô tả domain]
 * @returns Data, loading state, và action functions
 */
export function useNewFeature(): UseNewFeatureReturn {
    // ... implementation
}
```

### 2.4 Quy Tắc Screen

```
1. Screen = orchestration layer — kết nối hooks + components + navigation
2. Screen KHÔNG chứa:
   - API calls trực tiếp (dùng custom hooks)
   - Business logic phức tạp (dùng utils hoặc hooks)
   - UI components > 100 dòng JSX (extract thành component)
3. Mỗi screen có tối đa 1 hook chính cho domain logic
4. Navigation logic (useNavigation, useRoute) chỉ ở screen level
5. Loading/Error states PHẢI xử lý rõ ràng, không để blank screen
```

### 2.5 Quy Tắc Performance Mobile

```
1. FlatList/SectionList items → component PHẢI bọc React.memo()
2. Callback truyền vào child component → PHẢI dùng useCallback()
3. Computed values phức tạp → PHẢI dùng useMemo()
4. Image nặng → dùng lazy loading hoặc progressive loading
5. KHÔNG re-fetch API khi chỉ thay đổi UI state không liên quan
6. useEffect dependencies PHẢI khai báo đầy đủ, không suppress ESLint warning
```

### 2.6 Quy Tắc Theme & Styling

```
1. Colors, spacing, font sizes → import từ theme.ts, KHÔNG hardcode
2. StyleSheet.create() PHẢI đặt ngoài component (không tạo trong render)
3. Inline style chỉ cho dynamic values (style={{ opacity: isVisible ? 1 : 0 }})
4. Thêm color mới → PHẢI thêm vào theme.ts trước, rồi mới dùng
5. Animation values → dùng Animated API hoặc Reanimated, không setTimeout
```

### 2.7 Quy Tắc Thêm Feature Mới (Mobile)

```
1. shared/types/<domain>.ts        → Thêm type/interface (nếu cần API response mới)
2. mobile/src/hooks/use<Domain>.ts → Tạo custom hook cho business logic
3. mobile/src/components/<domain>/ → Tạo UI components
4. mobile/src/screens/<Screen>.tsx → Orchestrate hooks + components
5. hooks/index.ts                  → Export hook mới
6. npx tsc --noEmit                → Phải pass trước khi commit
```

---

## Phần 3: Admin — React / Vite

### 3.1 Cấu Trúc Thư Mục Admin (Đóng Băng)

```
admin/src/
├── components/             # Reusable UI components
│   ├── common/             # Shared components dùng chung
│   │   ├── ConfirmModal.tsx    # Confirmation dialog (danger/warning/info)
│   │   ├── StatusBadge.tsx     # Status indicator component
│   │   ├── SearchBar.tsx       # Debounced search input
│   │   └── index.ts            # Barrel export
│   ├── boss/               # Boss management sub-components
│   ├── quest/              # Quest management sub-components
│   ├── quiz/               # Quiz management sub-components
│   ├── reward/             # Reward management sub-components
│   ├── shop/               # Shop management sub-components
│   ├── warehouse/          # Warehouse management sub-components
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── TopBar.tsx          # Top navigation bar
│   └── [NewDomain]/        # ← Thêm folder mới khi cần
├── data/                   # Static data, mock data
├── pages/                  # Page components — 1 per route
├── services/               # API service layer
│   ├── client.ts           # HttpClient base, token interceptor, REST helpers
│   ├── userService.ts      # User API calls
│   ├── bossService.ts      # Boss API calls
│   ├── rewardService.ts    # Reward API calls
│   ├── questService.ts     # Quest API calls
│   ├── eventService.ts     # Event API calls
│   ├── api.ts              # AdminApi delegator (backward compat)
│   ├── index.ts            # Barrel export
│   └── [newService.ts]     # ← Thêm service mới theo domain
├── types/                  # Re-export from @shared
│   └── index.ts            # export * from '@shared'
├── App.tsx                 # Root component, routing
├── App.css                 # App-level styles
├── index.css               # Global styles, CSS variables, design tokens
├── main.tsx                # Entry point
└── vite-env.d.ts           # Vite type declarations
```

### 3.2 Quy Tắc Page Component

```
1. Mỗi page ≤ 400 dòng — tuyệt đối
2. Page = orchestration: state management + layout + gọi components
3. Modal/Form phức tạp → PHẢI tách thành component riêng trong components/<domain>/
4. Logic CRUD lặp lại → dùng generic helper hoặc tạo hook
5. KHÔNG inline fetch/axios trong page — dùng service layer
```

### 3.3 Quy Tắc API Service Layer

```
1. Mọi API call đi qua services/ — KHÔNG gọi fetch/axios trực tiếp trong page
2. HttpClient base (client.ts) xử lý: base URL, token, interceptors
3. Mỗi domain 1 service file: userService.ts, bossService.ts, v.v.
4. api.ts (AdminApi) giữ vai trò delegator — backward compat cho code cũ
5. Service mới PHẢI export trong services/index.ts
6. Method naming: get<Entity>s, create<Entity>, update<Entity>, delete<Entity>
```

### 3.4 Quy Tắc Component Admin

```
1. Common components (ConfirmModal, StatusBadge, SearchBar) → components/common/
2. Domain-specific components → components/<domain>/
3. Dùng common components trước khi tạo mới — kiểm tra đã có chưa
4. Props interface PHẢI define riêng, export nếu cần reuse
5. Form state PHẢI validate trước submit — dùng controlled inputs
6. Modal PHẢI có loading state khi submit + disable button khi đang submit
```

### 3.5 Quy Tắc CSS & Design Tokens

```
1. Sử dụng CSS Variables đã define trong index.css:
   - Spacing: --spacing-xs (4px) → --spacing-xl (32px)
   - Border radius: --border-radius-sm (4px) → --border-radius-full (9999px)
2. KHÔNG hardcode magic numbers cho spacing/radius — dùng CSS variables
3. Thêm design token mới → PHẢI thêm vào :root trong index.css trước
4. Component-specific CSS → file CSS riêng cùng tên (Component.css)
5. Global styles chỉ trong index.css và App.css
6. KHÔNG dùng !important trừ khi override thư viện bên ngoài
```

### 3.6 Quy Tắc Thêm Feature Mới (Admin)

```
1. shared/types/<domain>.ts              → Thêm type/interface
2. admin/src/services/<domain>Service.ts → Tạo API service
3. admin/src/services/index.ts           → Export service mới
4. admin/src/components/<domain>/        → Tạo UI components (modal, form, table)
5. admin/src/pages/<Domain>Page.tsx      → Tạo page orchestrator
6. admin/src/App.tsx                     → Thêm route mới
7. npm run build                         → PHẢI pass trước khi commit
```

---

## Phần 4: Shared Types — Single Source of Truth

### 4.1 Nguyên Tắc Cốt Lõi

```
⚠️ ĐÂY LÀ QUY TẮC QUAN TRỌNG NHẤT CỦA TOÀN BỘ DỰ ÁN ⚠️

shared/types/ là Single Source of Truth cho TOÀN BỘ type definitions.

- Backend types.ts: export type * from '@shared'
- Mobile types/index.ts: export * from '@shared'
- Admin types/index.ts: export * from '@shared'

→ KHÔNG BAO GIỜ khai báo type trùng trong module con
→ KHÔNG BAO GIỜ copy-paste type từ shared sang module
→ Mọi thay đổi type BẮT ĐẦU từ shared/types/ rồi lan tỏa ra các module
```

### 4.2 Cấu Trúc Shared Types (Đóng Băng)

```
shared/
├── package.json            # @growary/shared package definition
└── types/
    ├── user.ts             # User, UserSettings, VipTierInfo, VipStatus, AuthResponse
    ├── task.ts             # TaskCategory, TaskTemplate, DailyTask, NotificationConfig, PenaltyConfig
    ├── boss.ts             # BossStatus, MiniGameType, BossEvent
    ├── reward.ts           # Reward, Voucher, VoucherStatus, MysteryBoxReward, InventoryItem
    ├── plan.ts             # DailyPlan, Journal, JournalMood, AutoLoggedTask
    ├── event.ts            # GrowaryEvent, DashboardStats, ActivityData, ApiError
    └── index.ts            # Re-export ALL → import { User } from '@shared'
```

### 4.3 Quy Tắc Thêm Type Mới

```
1. Xác định domain → chọn đúng file (user.ts, task.ts, boss.ts, ...)
2. Nếu type thuộc domain mới → TẠO file mới <domain>.ts
3. Export trong index.ts
4. Run compile check cho CẢ 3 module:
   - cd backend && npx tsc --noEmit
   - cd mobile && npx tsc --noEmit
   - cd admin && npm run build
5. Nếu cả 3 module đều pass → type đã đồng bộ
```

### 4.4 Quy Tắc Sửa Type Hiện Có

```
⚠️ Sửa type là BREAKING CHANGE tiềm tàng ⚠️

1. Thêm field mới (optional): field?: Type → An toàn, không break gì
2. Thêm field mới (required): field: Type → PHẢI update code trong CẢ 3 module
3. Đổi tên field: → PHẢI search & replace trong CẢ 3 module
4. Xóa field: → PHẢI verify không còn module nào sử dụng
5. Đổi type của field: → PHẢI update logic liên quan trong CẢ 3 module

Nguyên tắc: Ưu tiên thêm optional field. Chỉ dùng required field khi cần thiết.
```

### 4.5 Cấu Hình Module Resolution

**KHÔNG SỬA các cấu hình sau trừ khi thêm module mới vào monorepo:**

```
Backend (tsconfig.json):
  - rootDirs: ["./src", "../shared/types"]
  - paths: { "@shared/*": ["../shared/types/*"] }

Mobile (tsconfig.json + metro.config.js):
  - paths: { "@shared/*": ["../shared/types/*"] }
  - Metro: watchFolders + extraNodeModules['@shared']

Admin (tsconfig.json + vite.config.ts):
  - paths: { "@shared/*": ["../shared/types/*"] }
  - Vite: resolve.alias['@shared']
```

---

## Phần 5: Quy Trình Git & CI/CD

### 5.1 Branch Strategy

```
main          → Production, chỉ merge từ dev qua PR
dev           → Integration branch, merge features vào đây
feature/*     → Tính năng mới
fix/*         → Sửa lỗi
refactor/*    → Tái cấu trúc (không đổi behavior)
test/*        → Thêm/sửa tests
```

### 5.2 Commit Convention (Conventional Commits)

```
<type>(<scope>): <description>

Types: feat | fix | refactor | perf | test | docs | chore
Scopes: backend | mobile | admin | shared | root

Ví dụ:
  feat(backend): add quiz leaderboard endpoint
  fix(mobile): resolve crash on empty daily plan
  refactor(admin): extract reward form modal
  test(backend): add VIP tier calculation tests
  chore(shared): add collection types
```

### 5.3 Pre-Commit Checklist (BẮT BUỘC)

Trước MỌI commit, developer PHẢI chạy:

```bash
# 1. Backend type check + tests
cd backend && npx tsc --noEmit && npm test

# 2. Mobile type check
cd mobile && npx tsc --noEmit

# 3. Admin build
cd admin && npm run build
```

**Chỉ commit khi CẢ 3 lệnh đều pass (Exit code 0).**

### 5.4 PR Requirements

```
1. PR PHẢI target branch `dev` (không merge trực tiếp vào main)
2. PR PHẢI điền đầy đủ template .github/PULL_REQUEST_TEMPLATE.md
3. PR PHẢI đính kèm bằng chứng test pass (screenshot hoặc log)
4. PR chỉ chứa thay đổi liên quan — KHÔNG bundle unrelated changes
5. Nếu sửa shared/types/ → PR PHẢI verify compile CẢ 3 module
6. Nếu thêm model mới → PR PHẢI có compound indexes kèm theo
7. Nếu thêm endpoint mới → PR PHẢI có Zod validator kèm theo
```

### 5.5 Quy Tắc Test

```
1. Business logic mới trong services/ → PHẢI có unit test
2. Endpoint mới → NÊN có integration test (bắt buộc cho critical flows)
3. Bug fix → PHẢI có regression test chứng minh bug đã fix
4. Test file đặt trong __tests__/ mirror cấu trúc source:
   - src/services/vipService.ts → __tests__/services/vipService.test.ts
   - src/utils/penalty.ts → __tests__/utils/penalty.test.ts
5. KHÔNG mock quá mức — chỉ mock external dependencies (DB, API calls)
6. Test name PHẢI mô tả behavior, không mô tả implementation:
   ✅ 'should return Silver tier for 500-999 total spent'
   ❌ 'test vipService function'
```

---

## Phần 6: Bảng Vi Phạm & Mức Xử Lý

### 🔴 Critical — Block PR, KHÔNG merge

| # | Vi phạm | Ví dụ |
|---|---------|-------|
| C1 | Business logic trong middleware | Cashback calculation trong auth.ts |
| C2 | Duplicate type definitions | Khai báo `User` interface trong cả mobile và admin |
| C3 | Hardcode secrets/API URLs | `const API = 'https://...'` trong source code |
| C4 | Raw error stack trace trả client | `res.json({ error: err.stack })` |
| C5 | Skip/xóa test mà không thay thế | Xóa `vipUtils.test.ts` vì "test chậm" |
| C6 | Commit trực tiếp vào main | `git push origin main` |
| C7 | N+1 query trong loop | `for (user of users) await Model.findById(user.id)` |

### 🟠 High — Phải fix trước khi merge

| # | Vi phạm | Ví dụ |
|---|---------|-------|
| H1 | File vượt giới hạn kích thước | Controller > 400 dòng |
| H2 | Business logic trong route file | Tính VIP tier trong route handler |
| H3 | Thiếu Zod validation cho write endpoint | POST /api/rewards không có validate |
| H4 | Sử dụng `any` type | `const data: any = await api.get()` |
| H5 | Thiếu test cho service logic mới | Thêm `discountService.ts` không có test |
| H6 | API call trực tiếp trong page/screen | `fetch('/api/users')` trong AdminPage |
| H7 | Thiếu JSDoc cho public function | Service function không có documentation |

### 🟡 Medium — Nên fix, reviewer discretion

| # | Vi phạm | Ví dụ |
|---|---------|-------|
| M1 | File ở 80% giới hạn không có kế hoạch tách | Screen 420/500 dòng |
| M2 | Inline styles > 3 properties | `style={{ margin: 10, padding: 20, flex: 1, color: 'red' }}` |
| M3 | Hardcode magic numbers | `if (level > 50)` thay vì `MAX_LEVEL` |
| M4 | Missing useCallback/useMemo cho heavy components | FlatList renderItem không memoize |
| M5 | CSS không dùng design tokens | `padding: 16px` thay vì `var(--spacing-md)` |

---

## Phần 7: Quy Trình Thay Đổi Bộ Luật

### 7.1 Khi Nào Cần Thay Đổi

```
1. Thêm module mới vào monorepo (ví dụ: landing page, API gateway)
2. Thay đổi tech stack (ví dụ: chuyển từ Express sang Fastify)
3. Phát hiện pattern mới sau ≥ 3 lần lặp lại mà chưa có rule
4. Rule hiện tại gây cản trở phát triển THỰC SỰ (không phải vì lười follow)
```

### 7.2 Quy Trình Thay Đổi

```
1. Tạo issue mô tả: rule cần thay đổi, lý do, impact analysis
2. Đề xuất cụ thể: nội dung mới thay thế nội dung cũ
3. Review bởi tech lead hoặc architect
4. Update file ARCHITECTURE_RULES.md
5. Thông báo toàn team
6. Tăng version number (header của file này)
```

### 7.3 Rule Kế Thừa

```
Nếu phát sinh conflict giữa bộ luật này và CONTRIBUTING.md:
→ ARCHITECTURE_RULES.md có priority cao hơn về mặt kỹ thuật/kiến trúc
→ CONTRIBUTING.md có priority cao hơn về mặt quy trình Git/PR

Nếu phát sinh conflict giữa bộ luật này và requirement mới từ stakeholder:
→ Thực hiện quy trình 7.2 để update rule, KHÔNG silent bypass
```

---

## 📎 PHỤ LỤC: Quick Reference Card

### Thêm Feature Mới — Checklist Nhanh

```
□ 1. Type mới → shared/types/<domain>.ts + export trong index.ts
□ 2. Backend: Model → Validator → Service → Controller → Route → Test
□ 3. Mobile: Hook → Components → Screen
□ 4. Admin: Service → Components → Page → Route trong App.tsx
□ 5. Compile check: backend tsc + test | mobile tsc | admin build
□ 6. Commit: conventional format, target branch dev
□ 7. PR: template đầy đủ, bằng chứng test pass
```

### File Nào Sửa → Phải Kiểm Tra Gì

| Bạn sửa | Bạn PHẢI kiểm tra |
|----------|-------------------|
| `shared/types/` | `backend tsc` + `backend test` + `mobile tsc` + `admin build` |
| `backend/src/models/` | `backend tsc` + `backend test` |
| `backend/src/services/` | `backend test` (unit + integration liên quan) |
| `mobile/src/hooks/` | `mobile tsc` |
| `mobile/src/screens/` | `mobile tsc` + test thủ công trên device/emulator |
| `admin/src/services/` | `admin build` |
| `admin/src/pages/` | `admin build` + test thủ công trên browser |

---

> **Lời nhắn cho AI Agents:**
> Nếu bạn là AI agent đang develop trên dự án Growary, hãy đọc kỹ bộ luật này TRƯỚC KHI viết bất kỳ dòng code nào. Bộ luật này tồn tại vì dự án đã trải qua quá trình tái cấu trúc tốn kém. Mục tiêu của bạn là **bảo vệ cấu trúc hiện tại**, không phải "cải tiến" nó theo ý riêng. Khi nghi ngờ, hãy hỏi human partner thay vì tự quyết định.

> **Lời nhắn cho Developer mới:**
> Chào mừng bạn đến Growary! Bộ luật này có vẻ dài nhưng tóm lại chỉ có 3 nguyên tắc cốt lõi:
> 1. **Types bắt đầu từ shared/** — không duplicate
> 2. **Logic thuộc service layer** — route/controller/screen chỉ orchestrate
> 3. **Biên dịch + test phải pass** — trước mọi commit
>
> Nắm được 3 điều này, bạn sẽ không vi phạm bất kỳ rule nào ở trên.
