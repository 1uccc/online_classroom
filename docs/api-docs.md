# Online Classroom API — Bước 2 / Backend Bước 3

Base URL cục bộ: `http://localhost:5000/api/v1`.

Các API được bảo vệ nhận `Authorization: Bearer <access_token>`. Mỗi request kiểm tra tài khoản trong MongoDB, role và quyền trên tài nguyên. Admin không mặc nhiên được sửa khóa học hay chấm bài của Teacher.

## Danh sách endpoints

### Authentication

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Đăng ký Student |
| POST | `/auth/login` | Public | Lấy JWT và thông tin tài khoản |
| GET | `/auth/me` | Đã đăng nhập | Xem hồ sơ |
| PATCH | `/auth/me` | Đã đăng nhập | Sửa fullName |

Register: `{ "fullName": "Nguyễn Văn An", "email": "an@example.com", "password": "MatKhauMinhHoa123!" }`.

Login: `{ "email": "an@example.com", "password": "MatKhauMinhHoa123!" }`.

Login trả `data.accessToken`, `data.tokenType` và `data.user`. Mật khẩu tối thiểu 12 ký tự và không quá 72 byte UTF-8. Không nhận role trong đăng ký công khai.

### Users

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/users` | Admin | Lọc người dùng theo role, isActive, search |
| POST | `/users` | Admin | Tạo Teacher/Student |
| GET | `/users/:userId` | Admin | Xem người dùng |
| PATCH | `/users/:userId/status` | Admin | Khóa/mở khóa |

Tạo người dùng dùng payload Register thêm `role: "teacher"` hoặc `"student"`. Khóa: `{ "isActive": false }`. Không cho tự khóa tài khoản. Admin đầu tiên được tạo bằng `npm run seed:admin`.

### Categories

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/categories` | Public / Admin | Danh mục hoạt động; Admin thêm includeInactive=true để xem tất cả |
| GET | `/categories/:categoryId` | Public / Admin | Public chỉ xem danh mục hoạt động |
| POST | `/categories` | Admin | Tạo danh mục |
| PATCH | `/categories/:categoryId` | Admin | Sửa danh mục |
| DELETE | `/categories/:categoryId` | Admin | Xóa khi không có khóa học tham chiếu |

Payload tạo: `{ "name": "Lập trình Web", "slug": "lap-trinh-web", "description": "Các khóa học Web" }`. PATCH nhận các trường trên và `isActive`. Slug duy nhất, chỉ dùng chữ thường ASCII, số và dấu gạch ngang.

### Courses

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/courses` | Public | Khóa học published; lọc search, category |
| GET | `/courses/mine` | Teacher | Khóa học mình sở hữu |
| GET | `/courses/:courseId` | Public / Teacher / Student | Thông tin giới thiệu theo quyền |
| POST | `/courses` | Teacher | Tạo khóa học draft |
| PATCH | `/courses/:courseId` | Teacher sở hữu | Sửa thông tin |
| PATCH | `/courses/:courseId/status` | Teacher sở hữu | Đổi trạng thái |
| DELETE | `/courses/:courseId` | Teacher sở hữu | Xóa draft chưa có ghi danh/bài nộp |

Tạo: `{ "title": "React cơ bản", "description": "Nội dung khóa học", "category": "<ObjectId>" }`. Có thể thêm `thumbnailUrl` HTTP/HTTPS.

Đổi trạng thái: `{ "status": "published" }`, giá trị khác: `draft`, `archived`. Khóa học có bất kỳ ghi danh nào không được chuyển về draft. Public chỉ xem published; Student đã ghi danh active/completed có thể xem archived. Teacher sở hữu xem mọi trạng thái. `teacher` được gán từ tài khoản xác thực.

### Enrollments

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/courses/:courseId/enrollments` | Student | Ghi danh published hoặc kích hoạt lại bản ghi cancelled |
| GET | `/enrollments/me` | Student | Ghi danh của mình |
| GET | `/courses/:courseId/enrollments` | Teacher sở hữu | Danh sách người học |
| PATCH | `/courses/:courseId/enrollments/me/cancel` | Student | Hủy ghi danh, giữ lịch sử bài nộp |
| PATCH | `/courses/:courseId/enrollments/:enrollmentId/complete` | Teacher sở hữu | Đánh dấu hoàn thành |

Các thao tác thay trạng thái ghi danh không yêu cầu body. POST tạo mới trả 201; kích hoạt lại bản ghi cancelled trả 200. Bản ghi active/completed bị ghi danh trùng trả 409. Không hoàn thành ghi danh cancelled.

### Materials

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/courses/:courseId/materials` | Teacher sở hữu / Student hợp lệ | Danh sách tài liệu |
| GET | `/courses/:courseId/materials/:materialId` | Như trên | Nội dung/metadata |
| GET | `/courses/:courseId/materials/:materialId/download` | Như trên | Tải PDF |
| POST | `/courses/:courseId/materials` | Teacher sở hữu | Thêm tài liệu |
| PATCH | `/courses/:courseId/materials/:materialId` | Teacher sở hữu | Sửa thông tin hoặc thay file |
| DELETE | `/courses/:courseId/materials/:materialId` | Teacher sở hữu | Xóa tài liệu và dọn file |

Student hợp lệ có Enrollment active/completed và khóa học published/archived.

- Text JSON: `{ "title": "Giới thiệu", "type": "text", "content": "Nội dung", "position": 1 }`.
- Video JSON: `{ "title": "Bài giảng", "type": "video", "videoUrl": "https://example.com/video", "position": 2 }`.
- PDF multipart: các trường `title`, `type=pdf`, `position` và file tên `file`.
- PATCH chỉ gửi trường cần sửa; có thể chỉ gửi file mới. Không đổi `type`; tạo tài liệu khác nếu cần đổi hình thức.
- Không nhận `storageKey` từ client và không trả trường này trong JSON. Download chỉ dùng với PDF.

### Assignments

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/courses/:courseId/assignments` | Teacher sở hữu / Student hợp lệ | Student không thấy draft |
| GET | `/courses/:courseId/assignments/:assignmentId` | Như trên | Chi tiết bài tập |
| POST | `/courses/:courseId/assignments` | Teacher sở hữu | Tạo draft |
| PATCH | `/courses/:courseId/assignments/:assignmentId` | Teacher sở hữu | Sửa đề, hạn, thang điểm, trạng thái |
| DELETE | `/courses/:courseId/assignments/:assignmentId` | Teacher sở hữu | Xóa khi chưa có bài nộp |

```json
{
  "title": "Todo App",
  "description": "Xây dựng Todo App bằng React",
  "dueAt": "2026-12-01T16:59:00Z",
  "maxScore": 10,
  "submissionType": "both"
}
```

`dueAt` tùy chọn, có thể dùng null để bỏ hạn. `maxScore` > 0, mặc định 10. `submissionType`: text/file/both; both cho phép text, file hoặc cả hai. POST luôn tạo draft; PATCH nhận `status`: draft/published/closed. Sau khi có bài nộp không chuyển về draft, không đổi submissionType, không xóa bài tập và không giảm maxScore dưới điểm đã chấm.

### Submissions

| Method | URL | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/assignments/:assignmentId/submissions` | Student | Nộp lần đầu |
| GET | `/assignments/:assignmentId/submissions/me` | Student | Bài nộp và điểm của mình |
| PUT | `/assignments/:assignmentId/submissions/me` | Student | Thay toàn bộ câu trả lời/file trước khi chấm |
| GET | `/assignments/:assignmentId/submissions` | Teacher sở hữu | Danh sách bài nộp |
| GET | `/submissions/:submissionId` | Student tác giả / Teacher sở hữu | Chi tiết bài nộp |
| GET | `/submissions/:submissionId/attachments/:attachmentId/download` | Như trên | Tải file bài nộp |
| PATCH | `/submissions/:submissionId/grade` | Teacher sở hữu | Chấm/cập nhật điểm |

Nộp text: `{ "textAnswer": "Bài làm" }`. Có file: multipart với `textAnswer` và trường `attachments`, tối đa 5 file PDF/TXT UTF-8, mặc định 10 MB/file. Materials cũng áp dụng giới hạn dung lượng này nhưng chỉ nhận PDF.

Điều kiện POST/PUT: Enrollment active, Course published, Assignment published và chưa quá dueAt. PUT yêu cầu đã có bài nộp, chưa graded và thay toàn bộ nội dung/file. Student không gửi score, status hay gradedBy.

Chấm: `{ "score": 8.5, "feedback": "Hoàn thành tốt" }`. Điểm từ 0 đến maxScore. Backend tự gán gradedBy, gradedAt và status=graded. Student vẫn xem được bài nộp/điểm của mình sau khi hủy ghi danh.

## Response, phân trang và lỗi

Thành công: `{ "success": true, "data": {} }`. Tạo mới trả 201. Xóa thành công trả 204, không có body.

Danh sách nhận `page`, `limit` (mặc định 1/20, tối đa 100 mỗi trang) và trả `pagination: { page, limit, total, totalPages }`. Chỉ nhận query đã khai báo; query khác trả 400.

Lỗi: `{ "success": false, "message": "...", "code": "..." }`, có thể thêm `errors: [{ "field": "title", "message": "..." }]`.

| Status | Ý nghĩa |
| --- | --- |
| 400 | Input/JSON/ObjectId không hợp lệ, điểm vượt thang |
| 401 | Chưa đăng nhập, JWT sai/hết hạn, sai thông tin đăng nhập |
| 403 | Sai role/quyền sở hữu, tài khoản bị khóa, không đủ quyền ghi danh |
| 404 | Không có tài nguyên hoặc tài nguyên không hiển thị với người gọi |
| 409 | Trùng dữ liệu, trạng thái xung đột, quá hạn, dữ liệu đang được tham chiếu |
| 413 | File/request vượt giới hạn |
| 415 | Loại hoặc nội dung file không được hỗ trợ |
| 429 | Vượt giới hạn request |
| 500 | Lỗi nội bộ, không trả stack trace |

Giới hạn mặc định: 300 request/phút/IP cho `/api`; đăng nhập và đăng ký dùng chung giới hạn 20 request/15 phút/IP. Cấu hình reverse proxy và rate limiter dùng chung cần được bổ sung khi triển khai nhiều instance.

## Tài liệu thư viện tham chiếu

- [Express 5 error handling](https://expressjs.com/en/5x/guide/error-handling/) — route/middleware async chuyển lỗi tới error handler.
- [Mongoose validation](https://mongoosejs.com/docs/validation) — unique index được xử lý riêng với validation.
- [Multer middleware](https://expressjs.com/en/resources/middleware/multer/) — upload chỉ gắn trên các route được phép.

Các giới hạn triển khai hiện tại được ghi trong `server/README.md`, đặc biệt transaction liên collection và storage cục bộ.
