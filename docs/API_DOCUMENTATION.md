# 📘 Growary API Documentation (v2.3.1)

Base URL: `http://localhost:5000/api` (Local) | `https://growary-backend-vb86.onrender.com/api` (Production)

---

## 🔐 1. Authentication (`/api/auth`)

### 1.1 Register User
- **Method:** `POST /api/auth/register`
- **Auth:** Public
- **Body (Zod Validated):**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!"
}
```
- **Response `201 Created`:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-string",
  "user": {
    "id": "67...",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "coins": 0,
    "xp": 0,
    "level": 1
  }
}
```

### 1.2 Login User
- **Method:** `POST /api/auth/login`
- **Auth:** Public
- **Body (Zod Validated):**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```
- **Response `200 OK`:** Same as register.

### 1.3 Get Current Profile
- **Method:** `GET /api/auth/me`
- **Auth:** Required (`Bearer <token>`)
- **Response `200 OK`:** Returns full user profile including streaks, coins, XP, and VIP tier.

---

## 📋 2. Daily Plans & Tasks (`/api/plans`)

### 2.1 Get Today's Plan
- **Method:** `GET /api/plans/today`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "_id": "plan-id",
  "user": "user-id",
  "date": "2026-10-17T00:00:00.000Z",
  "tasks": [
    {
      "_id": "task-id",
      "title": "Chạy bộ 30 phút",
      "pointsReward": 20,
      "coinReward": 10,
      "isCompleted": false,
      "isMandatory": true,
      "adminApprovalStatus": "approved"
    }
  ],
  "totalPointsEarned": 0
}
```

### 2.2 Add Custom Task
- **Method:** `POST /api/plans/:planId/tasks`
- **Auth:** Required
- **Body (Zod Validated):**
```json
{
  "title": "Đọc sách Clean Code",
  "pointsReward": 15,
  "coinReward": 5,
  "category": "study",
  "durationMinutes": 30
}
```
- **Response `201 Created`:** Updated task object.

### 2.3 Complete Task & Claim Rewards
- **Method:** `PATCH /api/plans/:planId/tasks/:taskIndex/complete`
- **Auth:** Required
- **Body (Zod Validated):**
```json
{
  "isCompleted": true,
  "proofImageUrl": "https://res.cloudinary.com/..."
}
```
- **Response `200 OK`:**
```json
{
  "message": "Nhiệm vụ đã hoàn thành!",
  "rewards": {
    "coins": 10,
    "xp": 20,
    "gachaTickets": 0,
    "levelUps": []
  }
}
```

---

## 🛍️ 3. Rewards & Shop (`/api/rewards`)

### 3.1 Get All Active Rewards
- **Method:** `GET /api/rewards`
- **Auth:** Required
- **Response `200 OK`:** Array of reward items (vouchers, physical products).

### 3.2 Purchase Reward
- **Method:** `POST /api/rewards/:rewardId/purchase`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "message": "Đổi thưởng thành công!",
  "voucher": {
    "code": "VCH-A1B2C3D4",
    "status": "active",
    "rewardTitleSnapshot": "Voucher Giảm Giá 50k",
    "purchaseDate": "2026-10-17T00:00:00.000Z"
  }
}
```

### 3.3 Get VIP Status & Cashback Info
- **Method:** `GET /api/rewards/vip-status`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "status": {
    "currentTier": {
      "tier": 2,
      "name": "Đồng",
      "cashbackPercent": 2,
      "discountPercent": 1
    },
    "monthlySpending": 50000,
    "pendingCashback": 1000,
    "coinsToNextTier": 50000
  },
  "allTiers": [...]
}
```

---

## 👾 4. Boss Events & Battles (`/api/boss`)

### 4.1 Get Active Boss Event
- **Method:** `GET /api/boss/active`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "_id": "boss-id",
  "title": "Ma Thần Trì Hoãn",
  "maxHp": 100000,
  "currentHp": 42000,
  "status": "active",
  "baseRewardCoins": 500,
  "baseRewardXp": 1000
}
```

### 4.2 Attack Boss / Mini-Game Action
- **Method:** `POST /api/boss/:bossId/attack`
- **Auth:** Required
- **Body:** `{ "damage": 50, "miniGameAnswer": 2 }`
- **Response `200 OK`:** Damage animation metadata and accumulated battle coins.

---

## 🛠️ 5. Admin Panel APIs (`/api/admin`)

- **Auth:** Required (`Bearer <token>` with `role: 'admin'`)
- `GET /api/admin/dashboard` — Overview statistics
- `GET /api/admin/users` — List and filter users
- `PATCH /api/admin/users/:id/status` — Lock/unlock user accounts
- `GET /api/admin/system-tasks` — Task template library CRUD
- `GET /api/admin/pending-tasks` — Player-submitted tasks awaiting approval
- `PATCH /api/admin/plans/:planId/tasks/:taskId/approve` — Approve player task with custom coins/XP
- `GET /api/admin/vouchers` — View and confirm redeemed vouchers
- `POST /api/admin/boss` — Create new Guild Boss event
