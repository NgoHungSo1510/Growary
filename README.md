# 🌱 Growary - Unified Productivity & Gamification Suite

**Growary** là hệ sinh thái ứng dụng quản lý công việc và mục tiêu cá nhân kết hợp yếu tố **Gamification** (Trò chơi hóa) đỉnh cao. Dự án giúp biến các thói quen hàng ngày thành các nhiệm vụ RPG hấp dẫn, tích lũy XP thăng cấp, cùng cộng đồng săn Boss kỷ luật và đổi thưởng phần quà thực tế.

---

## 📁 Cấu Trúc Dự Án (Monorepo)

```bash
Growary/
├── backend/            # REST API (Node.js + Express + TypeScript + Mongoose)
│   ├── src/models/     # Schemas (User, DailyPlan, BossEvent, Reward, Voucher...)
│   ├── src/routes/     # API routes (Auth, Plans, Rewards, Boss, Admin...)
│   ├── src/services/   # Core Business Services (Level, VIP, Plan, Reward, Boss...)
│   ├── src/validators/ # Zod validation schemas cho mọi write request
│   ├── src/jobs/       # Cron jobs (Streak reset, Cashback, Penalty, Boss rotation)
│   └── src/__tests__/  # Unit & Integration test suites (Jest + Supertest)
├── mobile/             # React Native Mobile App (Expo SDK 54 + TypeScript)
│   ├── src/screens/    # Màn hình chính (Home, Tasks, Boss Event, Shop, Profile...)
│   ├── src/components/ # Reusable UI components (Task, Gacha, Boss, Shop...)
│   └── src/hooks/      # Custom React hooks quản lý state và API
├── admin/              # Dashboard Quản Trị Viên (React + Vite + TypeScript)
│   ├── src/pages/      # 14 trang quản trị (< 400 dòng/trang)
│   ├── src/components/ # Shared common modals, badges & search bars
│   └── src/services/   # Domain-driven API services
├── shared/             # Single Source of Truth cho Type Definitions
│   └── types/          # User, Task, Boss, Reward, Plan, Event types (@shared/*)
└── docs/               # Tài liệu hệ thống & API Reference
```

---

## 🚀 Hướng Dẫn Cài Đặt Nhanh (< 15 Phút)

### 1. Yêu Cầu Hệ Thống (Prerequisites)
- **Node.js**: Phiên bản >= 18.x (khuyên dùng Node 20 LTS)
- **MongoDB**: MongoDB Server local (cổng 27017) hoặc MongoDB Atlas Cloud URI
- **Expo CLI**: `npm install -g expo-cli` (cho Mobile App)

---

### 2. Thiết Lập Backend API

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file biến môi trường từ mẫu
cp .env.example .env
# Chỉnh sửa MONGODB_URI và JWT_SECRET trong .env nếu cần

# 4. Khởi chạy server ở chế độ Development (Nodemon + ts-node)
npm run dev
# Server lắng nghe tại: http://localhost:5000 (API: http://localhost:5000/api)

# 5. Chạy bộ kiểm thử tự động (Unit & Integration Tests)
npm test
```

---

### 3. Thiết Lập Admin Dashboard

```bash
# 1. Di chuyển vào thư mục admin
cd admin

# 2. Cài đặt dependencies
npm install

# 3. Tạo file biến môi trường từ mẫu
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

# 4. Khởi chạy Admin Dashboard
npm run dev
# Truy cập giao diện tại: http://localhost:5174
```

---

### 4. Thiết Lập Mobile App (React Native / Expo)

```bash
# 1. Di chuyển vào thư mục mobile
cd mobile

# 2. Cài đặt dependencies
npm install

# 3. Tạo file biến môi trường từ mẫu
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://localhost:5000/api (hoặc LAN IP máy tính của bạn)

# 4. Khởi chạy Expo Metro Bundler
npx expo start
```
- Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại thật (iOS / Android).
- Hoặc nhấn `a` để chạy trên Android Emulator, `i` cho iOS Simulator, `w` cho Web browser.

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance)

Dự án áp dụng quy trình kiểm thử nghiêm ngặt trước khi merge code:

| Module | Lệnh Kiểm Thử | Trạng Thái |
|---|---|:---:|
| **Backend Tests** | `cd backend && npm test` | ✅ 8/8 suites PASS (46 tests) |
| **Backend Type-Check** | `cd backend && npx tsc --noEmit` | ✅ 0 errors |
| **Mobile Type-Check** | `cd mobile && npx tsc --noEmit` | ✅ 0 errors |
| **Admin Production Build** | `cd admin && npm run build` | ✅ 0 errors |

---

## 📚 Tài Liệu Tham Khảo

- [📘 Chi tiết API Endpoints](file:///d:/Downloads/SE%20Project/Growary/docs/API_DOCUMENTATION.md): Danh mục toàn bộ API endpoints, request bodies & response formats.
- [🤝 Hướng dẫn Đóng Góp (Contributing Guide)](file:///d:/Downloads/SE%20Project/Growary/CONTRIBUTING.md): Quy chuẩn đặt tên nhánh Git, Commit convention và quy trình Pull Request.
- [📋 Kế hoạch & Nhật ký Code Review](file:///d:/Downloads/SE%20Project/Growary/plan%20update/review-16-10.md): Lịch trình và checklist chi tiết 8 mục nâng cấp chất lượng mã nguồn.

---

## 🛡️ License

Dự án phát triển nội bộ bởi đội ngũ **Growary Team**. Mọi quyền được bảo lưu.
