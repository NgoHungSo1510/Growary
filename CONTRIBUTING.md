# 🤝 Growary Contributing Guide

Chào mừng bạn tham gia phát triển dự án **Growary**! Vui lòng đọc kỹ hướng dẫn dưới đây để đảm bảo chất lượng code và quy trình làm việc chuẩn mực.

---

## 🌿 1. Git Branching Strategy

- **`main`**: Nhánh production chính thức, được deploy tự động. Chỉ merge qua Pull Request đã qua review.
- **`dev`**: Nhánh tích hợp tính năng đang phát triển.
- **Branch Naming Convention:**
  - `feature/<tên-tính-năng>` (vd: `feature/vip-tier-badges`)
  - `fix/<mô-tả-lỗi>` (vd: `fix/streak-reset-cron`)
  - `refactor/<tên-module>` (vd: `refactor/admin-pages`)
  - `test/<tên-suite>` (vd: `test/task-plan-integration`)

---

## 📝 2. Commit Message Convention

Áp dụng định dạng Conventional Commits:
```
<type>(<scope>): <mô tả ngắn gọn bằng tiếng Anh hoặc tiếng Việt>
```

**Types:**
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `refactor`: Tái cấu trúc code (không đổi hành vi)
- `perf`: Tối ưu hiệu năng
- `test`: Thêm hoặc cập nhật tests
- `docs`: Cập nhật tài liệu
- `chore`: Thay đổi dependencies, configs, build scripts

**Ví dụ:**
- `feat(mobile): add memoization to timeline task card`
- `fix(backend): resolve n+1 query in streak cron job`
- `refactor(admin): split boss form modal into subcomponent`

---

## 🧪 3. Quality & Testing Checklist Trước Khi Tạo PR

Trước khi mở Pull Request, bạn **BẮT BUỘC** phải chạy kiểm tra cục bộ và đảm bảo không có lỗi:

1. **Backend Tests:**
   ```bash
   cd backend
   npm test
   npx tsc --noEmit
   ```
   Tất cả các unit và integration test suites phải PASS (Exit code 0).

2. **Mobile App:**
   ```bash
   cd mobile
   npx tsc --noEmit
   ```
   Không có lỗi TypeScript.

3. **Admin Panel:**
   ```bash
   cd admin
   npm run build
   ```
   Phải compile sạch sẽ không có lỗi TypeScript hoặc Vite bundler.

4. **Shared Types:**
   Nếu bạn thêm trường mới vào Model hoặc API Response, hãy cập nhật trong `shared/types/` trước tiên để đồng bộ tự động cho cả 3 modules.

---

## 📬 4. Pull Request Workflow

1. Push nhánh của bạn lên remote:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Mở Pull Request trỏ vào nhánh `dev` (hoặc `main` nếu là hotfix khẩn cấp).
3. Điền đầy đủ thông tin theo mẫu PR Template `.github/PULL_REQUEST_TEMPLATE.md`.
4. Đính kèm bằng chứng kiểm thử (ảnh chụp hoặc log chạy test thành công).
