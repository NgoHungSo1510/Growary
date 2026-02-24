# 🌱 Growary - Unified Productivity & Gamification Suite

**Growary** là một hệ sinh thái ứng dụng giúp tối ưu hóa hiệu suất làm việc thông qua cơ chế Gamification (Trò chơi hóa). Ứng dụng tích hợp quản lý nhiệm vụ, hệ thống cấp độ, săn Boss kỷ luật và đổi thưởng vật phẩm thực tế.

---

## 📁 Cấu trúc Dự án (Monorepo)

Dự án được tổ chức theo cấu trúc monorepo bao gồm 3 thành phần chính:

```bash
Growary/
├── backend/          # Node.js + Express API & MongoDB (Mongoose)
│   ├── src/models/   # Schemas cho User, Boss, Level, Reward...
│   ├── src/routes/   # API logic cho mobile & admin
│   └── src/utils/    # Xử lý Logic thưởng & Leveling
├── admin/            # React + Vite (Dashboard Quản trị)
│   └── src/pages/    # Quản lý Quest, Shop, User & Boss Timeline
└── mobile/           # React Native + Expo (Ứng dụng cho User)
    └── src/screens/  # HomeScreen, Boss Event, Shop...
```

---

## ✨ Tính năng Nổi bật

### 🎮 Gamification & Hệ thống Cấp độ
- **Thăng cấp (Level System):** Tích lũy XP từ nhiệm vụ để lên cấp. Nhận thưởng tự động (Coins, Vé Gacha, Voucher) mỗi khi thăng cấp.
- **Săn Boss Kỷ luật (Boss Hunting):** Sự kiện cộng đồng. XP nhiệm vụ biến thành sát thương đánh Boss. Nhận rương báu lớn khi Boss bị tiêu diệt.
- **Chuỗi Kỷ luật (Streak):** Duy trì hoàn thành ít nhất 3 nhiệm vụ/ngày để nhận mốc thưởng Streak đặc biệt.

### 📝 Quản lý Nhiệm vụ Thông minh
- **Kho nhiệm vụ hệ thống:** Thư viện nhiệm vụ đa dạng đã được thiết lập sẵn.
- **Nghiệm vụ tùy chỉnh:** Người dùng có thể tự đề xuất nhiệm vụ, chờ Admin phê duyệt để nhận thưởng.
- **Nhật ký tiến độ:** Tự động lưu lại lịch sử làm việc hàng ngày.

### 🛍️ Cửa hàng & Phần thưởng
- **Shop Vật phẩm:** Đổi Coin tích lũy lấy Voucher hoặc quà tặng vật lý.
- **Quản lý Voucher:** Hệ thống mã QR và trạng thái sử dụng (Chưa dùng, Đã dùng, Hết hạn).
- **Vòng quay may mắn:** Sử dụng vé Gacha nhận được từ Level-up/Boss để thử vận may.

### 🛠️ Bảng Quản trị (Admin Dashboard)
- **Boss Timeline:** Quản lý sự kiện Boss qua biểu đồ trục thời gian (Roadmap) trực quan.
- **Duyệt nhiệm vụ:** Phê duyệt nhanh chóng các yêu cầu từ User.
- **Thống kê:** Theo dõi tăng trưởng người dùng và hiệu quả hoàn thành mục tiêu.

---

## 🚀 Hướng dẫn Cài đặt

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18+
- **MongoDB**: Local hoặc MongoDB Atlas (Cloud)

### 2. Khởi chạy Backend
```bash
cd backend
npm install
npm run dev
```
*Tạo file `.env` dựa trên `.env.example` và cấu hình `MONGODB_URI`.*

### 3. Khởi chạy Admin Panel
```bash
cd admin
npm install
npm run dev
```
*Truy cập tại: `http://localhost:5173`*

### 4. Khởi chạy Mobile App
```bash
cd mobile
npm install
npx expo start
```
*Dùng **Expo Go** để scan mã QR trên thiết bị thật.*

---

## 🛠️ Stack Công nghệ

- **Frontend (Web):** React, Vite, CSS Vanilla (Modern UI/UX).
- **Mobile:** React Native, Expo, Reanimated.
- **Backend:** Node.js, Express, Mongoose.
- **Database:** MongoDB.
- **UI Architecture:** Claymorphism & Glassmorphism Design Styles.

---

## 📝 Milestone Đã Hoàn Thành
- [x] Hệ thống Level & Logic Delta XP.
- [x] Giao diện Boss Timeline (Roadmap) trên Admin.
- [x] Cơ chế trao thưởng Unified Reward (Coins + Gacha + Items).
- [x] Tích hợp Cloudinary cho minh chứng hoàn thành nhiệm vụ.

---

Made with 💜 by Antigravity Team
