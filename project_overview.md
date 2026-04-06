# 🌱 Growary — Tổng Quan Dự Án

> Ứng dụng quản lý nhiệm vụ hàng ngày & hệ thống thưởng gamification, gồm 3 module: **Backend**, **Mobile App**, **Admin Panel**.

---

## 📐 Kiến Trúc Tổng Quan

| Module | Tech Stack | Repo |
|--------|-----------|------|
| **Backend** | Node.js, Express, TypeScript, MongoDB (Mongoose) | [Growary-Backend](https://github.com/NgoHungSo1510/Growary-Backend) (`main`) |
| **Mobile** | React Native (Expo), TypeScript | [Growary](https://github.com/NgoHungSo1510/Growary) (`master`) |
| **Admin** | React (Vite), TypeScript | Nằm trong mono-repo `Growary/admin` |
| **Hosting** | Render (Backend), Cloudinary (ảnh) | `https://growary-backend.onrender.com` |

---

## ✅ TÍNH NĂNG ĐÃ HOÀN THÀNH

### 1. 🔐 Xác Thực (Auth)
- [x] Đăng ký / Đăng nhập (email + password, bcrypt hash)
- [x] JWT Token authentication + middleware bảo vệ route
- [x] Auto-login qua SecureStore (mobile)
- [x] Splash Screen kiểm tra session
- [x] Phân quyền Admin / User

### 2. 📋 Quản Lý Nhiệm Vụ (Tasks & Daily Plans)
- [x] Task Templates — tạo mẫu nhiệm vụ tái sử dụng
- [x] Daily Plans — kế hoạch hàng ngày (Today / Tomorrow)
- [x] Thêm / Xóa / Sắp xếp lại task trong plan
- [x] Đánh dấu hoàn thành task (có hỗ trợ ảnh chứng minh - proof image)
- [x] Upload ảnh chứng minh qua Cloudinary
- [x] Lịch sử hoàn thành (History)
- [x] Hệ thống Backlog (task chưa hoàn thành chuyển sang ngày sau)
- [x] Penalty system cho task bỏ lỡ (cấu hình từ Admin)
- [x] Timezone VN (UTC+7) — đã migrate dữ liệu cũ

### 3. 📓 Nhật Ký (Journals)
- [x] Nhật ký theo ngày (manual content + mood)
- [x] Xem / Sửa nhật ký theo ngày
- [x] Thống kê nhật ký

### 4. 🏆 Hệ Thống Phần Thưởng & Cửa Hàng (Rewards & Shop)
- [x] Admin tạo / quản lý phần thưởng (Reward Management)
- [x] User mua phần thưởng bằng điểm (points)
- [x] Hệ thống Voucher — mã voucher cho mỗi lần mua
- [x] Admin duyệt & gửi voucher (Shop Redemption)
- [x] Thông báo popup khi voucher được duyệt (Global Notification modal)
- [x] Đánh dấu voucher đã đọc / đã dùng

### 5. ⬆️ Hệ Thống Level & Milestones
- [x] Hệ thống level (XP-based)
- [x] Milestone Rewards — phần thưởng tự động khi đạt cột mốc
- [x] API lấy danh sách levels

### 6. 🎰 Gacha (Vòng Quay May Mắn)
- [x] Admin tạo / quản lý Gacha Items (tỉ lệ rơi, rarity)
- [x] User quay gacha (spin) — tiêu điểm
- [x] Lịch sử quay gacha
- [x] Giao diện Gacha Event Screen (mobile)

### 7. 🐉 Boss Events (Sự Kiện Boss)
- [x] Admin tạo / quản lý Boss Events (HP, thời gian, phần thưởng)
- [x] Boss tự động kích hoạt theo lịch (cron job `startBossSchedulerJob`)
- [x] User gây damage cho boss bằng cách hoàn thành task
- [x] Hệ thống phần thưởng tỷ lệ theo sát thương đóng góp
- [x] Boss Record — lưu lại lịch sử tấn công
- [x] Giao diện Boss Event Screen (mobile)

### 8. 📸 Collections (Sưu Tập)
- [x] Admin tạo / quản lý Collection Topics (chủ đề, phần thưởng)
- [x] User chụp ảnh & ghi thông tin vật phẩm
- [x] Collection Entry — bài nộp của user
- [x] Giao diện Collection Screen (mobile)
- [x] API routes cho collections

### 9. 🔔 Thông Báo (Notifications)
- [x] Hệ thống notification in-app
- [x] Đánh dấu đã đọc
- [x] Đếm số thông báo chưa đọc
- [x] Notification Config (Admin cấu hình)
- [x] Notifications Screen (mobile)

### 10. 🔥 Streak System
- [x] Theo dõi chuỗi ngày liên tiếp hoàn thành task
- [x] Cron job tự động kiểm tra streak hàng ngày (`startStreakCronJob`)
- [x] `lastStreakCheckDate` trên User model

### 11. 🖥️ Admin Panel (Web)
- [x] Dashboard tổng quan
- [x] Quản lý Users
- [x] Quản lý Quests (Quest Management)
- [x] Quản lý Rewards + Shop Redemption (duyệt đơn)
- [x] Quản lý Gacha Items
- [x] Quản lý Boss Events
- [x] Quản lý Collections
- [x] Quản lý Notifications
- [x] Quản lý Penalty Config
- [x] Quản lý Events

### 12. 🚀 Deployment
- [x] Backend deploy lên **Render** (`https://growary-backend.onrender.com`)
- [x] Build command: `npm install && npm run build`
- [x] Mobile API URL đã cập nhật sang Render
- [x] Git push lên cả 2 repo (Growary + Growary-Backend)

---

## ⏳ TÍNH NĂNG CHƯA LÀM / CÓ THỂ MỞ RỘNG

### Đã lên kế hoạch (từ các cuộc hội thoại trước)
- [ ] **Push Notifications** — thông báo đẩy qua Expo Notifications / FCM
- [ ] **SLA Tracking** — theo dõi thời hạn hoàn thành task
- [ ] **File Attachments** — đính kèm file vào task
- [ ] **User Ratings** — đánh giá người dùng
- [ ] **AI Integration** — phân loại task tự động, đề xuất, chatbot
- [ ] **Analytics & Reporting** — báo cáo & phân tích dữ liệu

### Cải thiện tiềm năng
- [ ] **Offline support** — cache dữ liệu khi mất mạng
- [ ] **Social features** — bảng xếp hạng, nhóm bạn bè
- [ ] **Dark mode** — chế độ tối cho mobile app
- [ ] **CI/CD Pipeline** — tự động test & deploy
- [ ] **Rate limiting & Security hardening** — bảo mật API

---

## 📁 Cấu Trúc Thư Mục

```
Growary/
├── backend/                    # Node.js + Express API
│   └── src/
│       ├── config/             # Database config
│       ├── constants.ts        # App constants
│       ├── controllers/        # Route controllers
│       ├── jobs/               # Cron jobs (streak, boss)
│       ├── middleware/         # Auth middleware
│       ├── models/            # 18 Mongoose models
│       ├── routes/            # 12 route files
│       ├── scripts/           # Migration scripts
│       ├── seeds/             # Seed data
│       ├── services/          # Business logic (bossService)
│       ├── utils/             # Utilities (milestones, etc.)
│       └── server.ts          # Entry point
├── mobile/                    # React Native (Expo)
│   └── src/
│       ├── components/        # Reusable UI (ClayTabBar, etc.)
│       ├── context/           # AuthContext
│       ├── hooks/             # Custom hooks
│       ├── navigation/        # AppNavigator (5 tabs + modals)
│       ├── screens/           # 13 screens
│       ├── services/          # API service layer
│       ├── theme.ts           # Design tokens
│       ├── types/             # Type definitions
│       └── utils/             # Helpers
├── admin/                     # React (Vite) Admin Panel
│   └── src/
│       ├── components/        # Shared components
│       ├── pages/             # 13 pages
│       ├── services/          # Admin API service
│       └── types/             # Type definitions
└── README.md
```

---

## 🗺️ Sơ Đồ Screens (Mobile App)

```
Auth Flow:
  Login ──→ Register

Main Tabs (ClayTabBar):
  🏠 Home (Hôm nay) ── Kế hoạch ngày, task list
  🛒 Shop (Cửa hàng) ── Mua phần thưởng, vouchers, gacha
  ➕ New (Thêm mới) ── Tạo / chỉnh sửa task
  🎉 Event (Sự kiện) ── Danh sách sự kiện
  ⚙️ Settings (Cài đặt) ── Profile, thống kê

Modal Screens:
  🐉 BossEvent ── Đánh boss
  🎰 GachaEvent ── Vòng quay
  📸 Collection ── Sưu tập
  ✏️ EditProfile ── Sửa hồ sơ
  🔔 Notifications ── Thông báo
```
