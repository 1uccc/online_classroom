# Online Classroom — Backend

Backend Express, MongoDB/Mongoose và JWT với 7 models, phân quyền, quản lý người dùng/khóa học, upload riêng tư và kiểm thử tích hợp.

[README toàn dự án](../README.md) · [Kiến trúc](../docs/architecture.md) · [Database](../docs/database-design.md) · [API](../docs/api-docs.md) · [Hướng dẫn sử dụng](../docs/user-guide.md)

## Chạy cục bộ

Yêu cầu Node.js >= 22.19 và MongoDB đang chạy (MongoDB local hoặc Atlas).

```powershell
cd server
npm ci
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Điền chuỗi vừa tạo vào `JWT_SECRET` trong `.env`. Kiểm tra `MONGODB_URI`, `CLIENT_ORIGIN`, `PORT`. Sau đó:

```powershell
npm run dev
```

API: `http://localhost:5000/api/v1`. Health: `GET http://localhost:5000/health`.

`MONGODB_URI` trong ví dụ dùng MongoDB cục bộ, không tự khởi động dịch vụ MongoDB. Với Atlas, cấu hình database user và quyền truy cập mạng trước khi chạy.

## Tạo Admin

Điền `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` trong `.env`, sau đó chạy:

```powershell
npm run seed:admin
```

Mật khẩu tối thiểu 12 ký tự, tối đa 72 byte UTF-8 do giới hạn bcrypt. Không có tài khoản hoặc mật khẩu mặc định. Script không đổi role hay đặt lại mật khẩu nếu email đã tồn tại. Xóa `ADMIN_PASSWORD` khỏi `.env` sau khi seed. Admin đăng nhập rồi dùng `POST /api/v1/users` để tạo Teacher.

## Admin quản lý hồ sơ và mật khẩu

Admin chỉnh sửa họ tên/email của Sinh viên và Giảng viên bằng `PATCH /api/v1/users/:userId`. Chỉ nhận `fullName`/`email`, hỗ trợ cập nhật một phần; email được chuẩn hóa và kiểm tra duy nhất bằng index MongoDB. Email mới dùng để đăng nhập. Các trường role, mật khẩu và trạng thái khóa được xử lý bằng chức năng riêng, không được gửi trong API hồ sơ.

- Tự đổi: `PATCH /api/v1/auth/me/password` với `currentPassword` và `newPassword`. Backend xác nhận mật khẩu cũ, băm mật khẩu mới và trả access token mới để giữ phiên hiện tại.
- Đặt lại cho Student/Teacher: `PATCH /api/v1/users/:userId/password` với `newPassword`. Không được dùng API này cho bất kỳ Admin nào.
- Mật khẩu mới phải khác mật khẩu cũ và tuân thủ giới hạn độ dài/byte. Không lưu hoặc trả mật khẩu dạng rõ. Hai API dùng chung giới hạn 20 request/15 phút/Admin.
- Trường `User.tokenVersion` và claim JWT `ver` vô hiệu hóa mọi token cũ của tài khoản vừa đổi mật khẩu. Tài khoản hiện có thiếu trường này được xem là phiên bản 0; không cần sửa thủ công dữ liệu MongoDB. Mật khẩu reset không tự mở khóa tài khoản.

## Luồng thử chính

1. Đăng ký Student: `POST /auth/register`.
2. Đăng nhập các tài khoản: `POST /auth/login`; lấy `data.accessToken`.
3. Gửi `Authorization: Bearer <access_token>` cho các API cần xác thực.
4. Admin tạo danh mục; Teacher tạo khóa học rồi cập nhật `status` thành `published`.
5. Teacher thêm tài liệu và bài tập. Bài tập mới luôn là `draft`; dùng PATCH để xuất bản.
6. Student ghi danh, xem tài liệu và nộp bài.
7. Teacher chấm bài; Student xem điểm qua `/assignments/:assignmentId/submissions/me`.

Tất cả đường dẫn trong luồng trên dùng tiền tố `/api/v1`. Danh sách đầy đủ được ghi tại `../docs/api-docs.md`.

## Upload

- Tài liệu: JSON với `type=text`/`video`, hoặc multipart với `type=pdf` và trường file `file`.
- Bài nộp: JSON với `textAnswer`, hoặc multipart có `textAnswer` và trường file `attachments` (tối đa 5 file).
- Hỗ trợ PDF và TXT UTF-8, mặc định 10 MB/file. Materials chỉ nhận PDF.
- Có kiểm tra chữ ký PDF và kiểm tra nội dung UTF-8; đây không phải công cụ quét mã độc.
- Thư mục upload không được public qua `express.static`. Tải bằng API có kiểm tra quyền; response không lộ `storageKey`.
- PUT bài nộp thay toàn bộ text/file hiện tại. File cũ được dọn sau khi lưu dữ liệu mới thành công.

## Kiểm tra

```powershell
npm run check
npm test
```

Integration test cần `mongod` trên PATH. Nếu chưa có, đặt `$env:MONGOD_BINARY` bằng đường dẫn tới `mongod.exe`. Test tự mở MongoDB trên cổng trống với thư mục tạm riêng, rồi dọn tài nguyên; không dùng database phát triển.

## Giới hạn của phiên bản khởi tạo

- JWT access token có hạn, chưa có refresh token, tự khôi phục mật khẩu qua email hay xác minh email. Đổi/reset mật khẩu vô hiệu hóa token cũ. Đăng xuất thông thường ở frontend chỉ bỏ token, không thu hồi token phía server.
- Upload dùng ổ đĩa cục bộ và buffer có giới hạn, phù hợp phát triển một instance. Triển khai nhiều instance cần object storage và cơ chế quét file.
- Unique indexes chống ghi danh/bài nộp trùng; optimistic concurrency chống ghi đè đồng thời cùng document.
- Các kiểm tra liên collection và xóa nhiều document chưa chạy trong transaction. Trước production cần bổ sung transaction/đồng bộ ghi trên replica set cho các thao tác như đổi trạng thái song song với ghi danh, thay thang điểm song song với chấm bài và xóa khóa học. Lỗi tiến trình giữa cập nhật DB và dọn file cũng cần job đối soát storage.
- Không cấu hình `trust proxy` mặc định. Khi triển khai sau reverse proxy cần cấu hình đúng số hop/địa chỉ tin cậy và dùng rate limiter chia sẻ nếu chạy nhiều instance.
