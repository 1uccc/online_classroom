# Online Classroom — Frontend (Bước 4)

React Functional Components, Hooks, React Context, React Router, Tailwind CSS và Vite. Giao diện tiếng Việt, hỗ trợ desktop/mobile, kết nối với backend thật trong `../server`.

## Chạy cục bộ

Yêu cầu Node.js >= 22.19. Chạy backend tại cổng 5000 theo `../server/README.md`. Sau đó mở terminal thứ hai:

```powershell
cd client
npm ci
npm run dev
```

Mở URL Vite in ra, mặc định `http://127.0.0.1:5173`. Vite chuyển `/api` tới `http://127.0.0.1:5000`, nên không cần tạo `.env` frontend để chạy cấu hình mặc định.

Nếu backend dùng cổng khác, sao chép `.env.example` thành `.env`, sửa `BACKEND_TARGET` rồi khởi động lại Vite. `VITE_API_URL` là biến công khai, mặc định `/api/v1`. Không đặt JWT_SECRET, ADMIN_PASSWORD hoặc MongoDB URI trong frontend.

## Màn hình và quyền

| Vai trò | Màn hình |
| --- | --- |
| Khách | Khám phá/lọc/tìm kiếm khóa học, xem giới thiệu, đăng ký Student, đăng nhập |
| Student | Tổng quan, lớp học đã ghi danh, ghi danh/hủy/ghi danh lại, xem/tải tài liệu, nộp và sửa bài chưa chấm, xem điểm/nhận xét |
| Teacher | Tổng quan, CRUD khóa học, xuất bản/lưu trữ, CRUD tài liệu và bài tập, danh sách ghi danh, hoàn thành khóa học, xem bài nộp và chấm/sửa điểm |
| Admin | Tổng quan, tìm/lọc người dùng, tạo Teacher/Student, khóa/mở khóa, CRUD và vô hiệu hóa danh mục |
| Đã đăng nhập | Xem hồ sơ, sửa họ tên, đăng xuất |

Backend vẫn là nơi quyết định quyền. ProtectedRoute hỗ trợ điều hướng và tránh hiển thị giao diện sai vai trò. Tài khoản Admin được tạo bằng seed backend, không có thông tin đăng nhập mặc định.

## Tổ chức mã nguồn

```text
src/
  api/          # Fetch, JWT header, upload FormData, download Blob, API modules
  components/   # UI dùng chung, khóa học, bài tập, chấm điểm
  contexts/     # AuthContext và thông báo
  hooks/        # Truy vấn có AbortController, xử lý mutation
  layouts/      # Sidebar, topbar, điều hướng mobile
  pages/        # Màn hình theo nghiệp vụ, gồm admin/
  routes/       # Lazy routes và ProtectedRoute
  test/         # Kiểm thử frontend
  utils/        # Trạng thái, định dạng giờ Việt Nam, kiểm tra file
```

Phiên đăng nhập dùng JWT trong bộ nhớ và sessionStorage của tab. Khi tải lại, frontend gọi `/auth/me`. JWT hết hạn hoặc tài khoản bị khóa sẽ kết thúc phiên. Đăng xuất xóa token ở client; backend chưa có chức năng thu hồi JWT/refresh token. SessionStorage vẫn có thể bị đọc nếu có XSS; khi đưa lên production nên xem xét xác thực bằng cookie HttpOnly cùng các thay đổi backend tương ứng.

File tải xuống luôn đi qua API có Bearer token. Không đưa JWT vào URL. Bài đọc và bài làm được render như văn bản, không dùng `dangerouslySetInnerHTML`. Liên kết video được backend kiểm tra HTTP/HTTPS và mở với `noopener noreferrer`.

Khi sửa bài nộp, API PUT thay toàn bộ nội dung/file: giao diện thông báo cần chọn lại những file muốn giữ. Upload mặc định PDF/TXT, 5 file và 10 MB/file, khớp backend mặc định. Nếu thay MAX_FILE_SIZE_MB ở backend cần cập nhật giới hạn và hướng dẫn frontend tương ứng.

## Kiểm tra và build

```powershell
npm test
npm run build
```

Build tạo `dist/`. Hosting SPA cần fallback các đường dẫn frontend về `index.html` và reverse proxy `/api` tới backend, hoặc đặt `VITE_API_URL` trước khi build và cấu hình CLIENT_ORIGIN backend phù hợp. `npm run preview` phục vụ bản build để kiểm tra cục bộ, với proxy backend giống dev server; đây không phải máy chủ production.

## Preview QA độc lập (tùy chọn)

Backend có helper `server/scripts/previewFixture.js` để kiểm tra frontend mà không dùng dữ liệu của bạn. Helper cần `mongod` trên PATH, tự tạo MongoDB/thư mục tạm và phục vụ API ở cổng 5501:

```powershell
# Terminal 1, từ thư mục server
node scripts/previewFixture.js

# Terminal 2, từ thư mục client
$env:BACKEND_TARGET = 'http://127.0.0.1:5501'
npm run dev
```

Chỉ database QA này có các tài khoản `student@qa.classroom.test`, `teacher@qa.classroom.test`, `admin@qa.classroom.test`, cùng mật khẩu `ClassroomPreview123!`. Đây là dữ liệu giả lập, không được tạo trong database ứng dụng. Dừng helper bằng Ctrl+C để dọn tài nguyên. Khi trở lại backend thật, xóa biến của terminal bằng `Remove-Item Env:BACKEND_TARGET` rồi khởi động lại Vite.

## Tài liệu tham chiếu

- [Vite](https://vite.dev/guide/)
- [Tailwind CSS với Vite](https://tailwindcss.com/docs/installation/using-vite)
- [React Router declarative routing](https://reactrouter.com/start/declarative/routing)

Tài liệu README và hướng dẫn tổng thể của toàn dự án sẽ được hoàn thiện ở Bước 5.
