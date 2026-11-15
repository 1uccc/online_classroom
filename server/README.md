# Online Classroom — Backend (Bước 3)

Backend Express, MongoDB/Mongoose và JWT. Phạm vi hiện tại gồm 7 models, toàn bộ nhóm API của Bước 2, phân quyền, upload riêng tư và kiểm thử tích hợp. Frontend được thực hiện ở Bước 4; README toàn dự án ở Bước 5.

## Chạy cục bộ

Yêu cầu Node.js >= 22.19 và MongoDB đang chạy (MongoDB local hoặc Atlas).

```powershell
cd server
npm ci
Copy-Item .env.example .env
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

- JWT access token có hạn, chưa có refresh token, quên mật khẩu hay xác minh email. Đăng xuất ở frontend bằng cách bỏ token; token chưa hết hạn vẫn dùng được nếu tài khoản còn hoạt động.
- Upload dùng ổ đĩa cục bộ và buffer có giới hạn, phù hợp phát triển một instance. Triển khai nhiều instance cần object storage và cơ chế quét file.
- Unique indexes chống ghi danh/bài nộp trùng; optimistic concurrency chống ghi đè đồng thời cùng document.
- Các kiểm tra liên collection và xóa nhiều document chưa chạy trong transaction. Trước production cần bổ sung transaction/đồng bộ ghi trên replica set cho các thao tác như đổi trạng thái song song với ghi danh, thay thang điểm song song với chấm bài và xóa khóa học. Lỗi tiến trình giữa cập nhật DB và dọn file cũng cần job đối soát storage.
- Không cấu hình `trust proxy` mặc định. Khi triển khai sau reverse proxy cần cấu hình đúng số hop/địa chỉ tin cậy và dùng rate limiter chia sẻ nếu chạy nhiều instance.
