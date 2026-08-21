# Course Registration API

Backend API cho hệ thống đăng ký học phần: xác thực sinh viên, quản lý học kỳ/học phần, đăng ký/huỷ đăng ký học phần (xử lý an toàn dưới tải đồng thời cao) và xuất phiếu đăng ký ra Word.

**Stack:** Node.js (Express 5) · Prisma ORM 7 + MySQL (MariaDB driver adapter) · Zod · JWT · Swagger.

## 1. Cài đặt

```bash
npm install
```

Tạo file `.env` từ mẫu (`.env.example`) và điền thông tin kết nối MySQL thật:

```bash
cp .env.example .env
```

```env
DATABASE_URL="mysql://user:pass@host:3306/db"
PORT=3000
```

Đồng bộ schema vào database (dùng `db push` vì repo chưa có migration history):

```bash
npx prisma db push
npx prisma generate
```

Seed dữ liệu mẫu (3 sinh viên + ~30 môn học):

```bash
node prisma/seed.js
# hoặc xoá sạch students/courses trước khi seed lại:
node prisma/seed.js --clean
```

| Mã SV | Email | Password | Trạng thái |
|---|---|---|---|
| SV001 | sv001@example.com | password123 | ACTIVE |
| SV002 | sv002@example.com | password123 | ACTIVE |
| SV003 | sv003@example.com | password123 | LOCKED (dùng để test case tài khoản bị khoá) |

## 2. Chạy ứng dụng

```bash
npm run dev
```

Server chạy tại `http://localhost:3000`

## 3. Cách test

### 3.1. Qua Swagger UI

1. Mở **http://localhost:3000/api-docs**
2. Gọi thử `POST /auth/login` với 1 tài khoản mẫu ở bảng trên (nút "Try it out") → copy `accessToken` trong response.
3. Bấm nút **Authorize** (góc trên bên phải trang), dán access token vào.

JSON OpenAPI để  import vào Postman: `http://localhost:3000/api-docs.json`.
