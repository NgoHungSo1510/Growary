# 🌱 Growary - Ứng dụng Quản lý Công việc & Tích điểm

Ứng dụng giúp bạn lập kế hoạch, theo dõi tiến độ công việc hàng ngày và đổi điểm thưởng.

## 📁 Cấu trúc dự án

```
Growary/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/   # Database config
│   │   ├── models/   # Mongoose schemas
│   │   ├── routes/   # API endpoints
│   │   └── middleware/
│   └── package.json
│
└── mobile/           # React Native (Expo)
    ├── src/
    │   ├── screens/  # App screens
    │   ├── services/ # API calls
    │   ├── context/  # Global state
    │   └── navigation/
    └── package.json
```

## 🚀 Bắt đầu

### 1. Cài đặt MongoDB

**Option A: Local**
- Download tại: https://www.mongodb.com/try/download/community
- Chạy MongoDB server

**Option B: Cloud (MongoDB Atlas)**
- Tạo tài khoản tại: https://www.mongodb.com/cloud/atlas
- Tạo cluster free tier
- Copy connection string vào `.env`

### 2. Chạy Backend

```bash
cd backend
npm install        # Đã cài sẵn
npm run dev        # Khởi động server
```

Server sẽ chạy tại: http://localhost:5000

### 3. Chạy Mobile App

```bash
cd mobile
npm install        # Đã cài sẵn
npx expo start     # Khởi động Expo
```

Scan QR code bằng **Expo Go** app trên điện thoại.

### 4. Cấu hình API URL (quan trọng!)

Mở file `mobile/src/services/api.ts`, sửa `API_URL`:

```typescript
// Nếu test trên thiết bị thật cùng mạng WiFi:
const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';

// Nếu dùng Android Emulator:
const API_URL = 'http://10.0.2.2:5000/api';
```

## 📱 Tính năng

| Tab | Chức năng |
|-----|-----------|
| 🏠 Hôm nay | Xem & hoàn thành việc đã lên lịch |
| 📝 Lập kế hoạch | Thêm việc cho ngày mai |
| 📖 Nhật ký | Xem lịch sử & ghi chép |
| 🎁 Đổi thưởng | Đổi điểm lấy phần thưởng |
| 👤 Tài khoản | Thông tin cá nhân |

## 🔧 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/tasks` | Lấy danh sách task templates |
| GET | `/api/plans/today` | Kế hoạch hôm nay |
| GET | `/api/plans/tomorrow` | Kế hoạch ngày mai |
| PATCH | `/api/plans/:id/tasks/:idx/complete` | Đánh dấu hoàn thành |
| GET | `/api/journals` | Lấy nhật ký |
| GET | `/api/rewards` | Danh sách phần thưởng |

## 🗄️ Database Collections

- `users` - Tài khoản & điểm
- `tasktemplates` - Kho mẫu nhiệm vụ
- `dailyplans` - Kế hoạch theo ngày
- `journals` - Nhật ký
- `rewards` - Phần thưởng
- `vouchers` - Phiếu đã đổi

## 📝 Việc cần làm tiếp

- [ ] Thêm Cron Job reset ngày (00:00)
- [ ] Tích hợp AI phân tích task
- [ ] Thêm Push Notifications
- [ ] Seed data mẫu

---

Made with 💜 for productivity
