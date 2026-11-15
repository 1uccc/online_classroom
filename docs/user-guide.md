# Hướng dẫn sử dụng

[README dự án](../README.md) · [API](api-docs.md)

Trước khi sử dụng, chạy backend và frontend theo [hướng dẫn cài đặt](../README.md#cài-đặt-và-chạy-cục-bộ). Mở URL Vite in ra, mặc định `http://127.0.0.1:5173`.

## 1. Tài khoản và điều hướng

- Đăng ký công khai tạo tài khoản **Sinh viên**. Email dùng để đăng nhập.
- **Admin** được tạo bằng script seed; Admin tạo tài khoản **Giảng viên** hoặc Sinh viên qua giao diện.
- Sau đăng nhập, menu bên trái thay đổi theo vai trò. Trên màn hình nhỏ, dùng nút mở menu ở thanh trên cùng.
- Nhấn tên/ảnh chữ viết tắt của mình để mở **Hồ sơ cá nhân** và sửa họ tên.
- **Đăng xuất** kết thúc phiên ở tab hiện tại. Khi tải lại trang, frontend kiểm tra token còn lưu bằng API.

Mật khẩu mới tối thiểu 12 ký tự và tối đa 72 byte UTF-8. Ký tự có dấu có thể dùng nhiều byte; thông báo validation sẽ chỉ rõ khi vượt giới hạn.

## 2. Admin

### Chuẩn bị danh mục và giảng viên

1. Vào **Danh mục khóa học → Tạo danh mục**.
2. Nhập tên và mô tả. Slug được gợi ý từ tên, có thể chỉnh sửa; slug phải duy nhất và dùng chữ thường không dấu, số, dấu gạch ngang.
3. Giữ trạng thái hoạt động để Teacher chọn khi tạo khóa học.
4. Vào **Người dùng → Tạo tài khoản**, nhập họ tên, email, mật khẩu ban đầu và chọn **Giảng viên**.
5. Cung cấp thông tin đăng nhập cho đúng người dùng qua kênh phù hợp; ứng dụng không tự gửi email.

### Chỉnh sửa hồ sơ Sinh viên/Giảng viên

1. Tại **Quản lý người dùng**, tìm theo tên/email hoặc lọc theo vai trò, trạng thái.
2. Nhấn **Sửa hồ sơ** tại đúng dòng tài khoản Student/Teacher.
3. Sửa **Họ và tên**, **Email**; xem role, trạng thái và ngày tạo để đối chiếu.
4. Nhấn **Lưu hồ sơ**. Email mới sẽ dùng để đăng nhập.

Nếu email đã được tài khoản khác sử dụng, form báo lỗi và giữ nội dung vừa nhập. Mật khẩu, role, trạng thái khóa và dữ liệu lớp học không đổi khi sửa hồ sơ. Role/trạng thái trong form là thông tin chỉ đọc.

### Khóa và mở khóa

Nhấn **Khóa** hoặc **Mở khóa** ở dòng người dùng rồi xác nhận. Tài khoản bị khóa không đăng nhập/gọi API được bảo vệ; dữ liệu học tập vẫn được giữ. Admin không thể tự khóa chính mình.

### Quản lý mật khẩu

- **Mật khẩu của mình:** mở **Hồ sơ cá nhân → Đổi mật khẩu của tôi**, nhập mật khẩu hiện tại, mật khẩu mới và xác nhận. Phiên đang dùng nhận token mới; các token cũ hết hiệu lực.
- **Student/Teacher:** vào **Quản lý người dùng → Đặt lại mật khẩu**, nhập và xác nhận mật khẩu mới. Người dùng phải đăng nhập lại bằng mật khẩu mới; tài khoản đang bị khóa vẫn bị khóa.
- Nút reset chỉ áp dụng cho Student/Teacher. Không đặt lại mật khẩu Admin khác bằng chức năng này.

### Sửa/ngừng/xóa danh mục

**Sửa** cho phép đổi thông tin hoặc bỏ chọn trạng thái hoạt động. **Xóa** chỉ thành công khi danh mục không còn khóa học tham chiếu. Nếu đang được dùng, có thể ngừng danh mục thay vì xóa.

## 3. Teacher

### Tạo và xuất bản khóa học

1. Vào **Lớp học giảng dạy → Tạo khóa học**.
2. Nhập tên, chọn danh mục hoạt động và mô tả nội dung học.
3. Lưu để tạo **Bản nháp**, rồi mở lớp học.
4. Chuẩn bị tài liệu/bài tập và chọn **Xuất bản khóa học** khi sẵn sàng nhận sinh viên.

Teacher chỉ quản lý khóa học do mình sở hữu. Danh sách công khai không hiển thị bản nháp. Khóa học và bài tập có trạng thái xuất bản riêng nhau.

### Thêm tài liệu

Ở tab **Tài liệu**, nhấn **Thêm tài liệu** và chọn:

| Loại | Nội dung cần nhập |
| --- | --- |
| Bài đọc văn bản | Tiêu đề và nội dung text |
| Tài liệu PDF | Tiêu đề, file PDF tối đa 10 MB theo cấu hình mặc định |
| Liên kết video | Tiêu đề và URL HTTP/HTTPS |

Thứ tự hiển thị là số nguyên không âm; số nhỏ xuất hiện trước. Dùng **Sửa** để đổi nội dung hoặc thay PDF; **Xóa** để gỡ tài liệu. Đổi loại tài liệu cần tạo tài liệu mới.

### Giao bài tập

1. Vào tab **Bài tập → Tạo bài tập**.
2. Nhập tiêu đề, yêu cầu, điểm tối đa và hình thức nộp: văn bản, file, hoặc văn bản/file.
3. Nhập hạn nộp theo **giờ Việt Nam**, hoặc để trống nếu không giới hạn.
4. Lưu bản nháp; mở **Sửa** và chuyển trạng thái sang **Đã xuất bản** để Student thấy bài và nộp.

**Đã đóng** dừng nhận bài. Khi đã có Submission, không xóa bài tập, không chuyển lại draft hoặc đổi hình thức nộp. Giảm thang điểm phải bảo đảm không thấp hơn điểm đã chấm.

### Chấm và cập nhật điểm

1. Mở bài tập rồi xem **Bài nộp của sinh viên**.
2. Nhấn **Chấm bài** hoặc **Xem / sửa điểm**.
3. Đọc nội dung, tải file đính kèm khi cần.
4. Nhập điểm từ 0 đến điểm tối đa, thêm nhận xét và **Lưu điểm**.

Kết quả xuất hiện khi Student mở lại bài tập. Student không được sửa bài đã chấm; Teacher có thể cập nhật điểm/nhận xét.

### Ghi danh, hoàn thành và lưu trữ

- Tab **Sinh viên** hiển thị các ghi danh và trạng thái.
- **Hoàn thành** chuyển ghi danh active thành completed: Student vẫn đọc tài liệu/xem điểm nhưng không nộp thêm bài.
- **Lưu trữ** khóa học dừng ghi danh và bài nộp mới, giữ nội dung cho Student có ghi danh active/completed.
- Chỉ xóa được khóa học nháp chưa có ghi danh hoặc bài nộp. Khóa học đã có ghi danh sử dụng lưu trữ để giữ lịch sử.

## 4. Student

### Khám phá và ghi danh

1. Vào **Khám phá khóa học**, tìm từ khóa hoặc chọn danh mục.
2. Mở khóa học để đọc giới thiệu.
3. Đăng nhập rồi nhấn **Ghi danh khóa học** khi khóa học đang published.
4. Xem các lớp đã ghi danh trong **Lớp học của tôi**.

Một Student chỉ có một ghi danh cho mỗi khóa học. Ghi danh lại sau khi hủy sử dụng bản ghi cũ, nếu khóa học vẫn nhận người học.

### Học và nộp bài

1. Mở lớp học, dùng tab **Tài liệu** để đọc bài, tải PDF hoặc mở liên kết video.
2. Chuyển tab **Bài tập**, mở yêu cầu và kiểm tra hạn nộp.
3. Nhập bài làm hoặc chọn file theo hình thức giảng viên yêu cầu.
4. Nhấn **Nộp bài**, đợi thông báo thành công và kiểm tra trạng thái **Đã nộp**.

File bài làm hỗ trợ PDF hoặc TXT UTF-8, tối đa 5 file và mặc định 10 MB/file. Hình thức “văn bản hoặc file” nhận một trong hai hoặc cả hai; bài không được trống.

### Sửa bài và xem điểm

- Trước hạn, khi bài chưa chấm và lớp/bài tập còn mở, nhấn **Chỉnh sửa bài nộp**.
- **Lưu bài nộp mới** thay toàn bộ text/file hiện tại. Chọn lại mọi file muốn giữ; không chọn file cũ có thể loại chúng khỏi bài nộp mới.
- Khi Teacher chấm, mở lại bài tập để xem điểm, nhận xét và thời gian chấm. Điểm 0 vẫn là kết quả hợp lệ.
- Không nộp/sửa được nếu ghi danh đã completed/cancelled, khóa học archived, bài tập closed, quá hạn hoặc bài đã graded.

### Hủy ghi danh

Ở cuối trang lớp học, chọn **Hủy ghi danh** và xác nhận. Quyền đọc nội dung lớp học bị dừng; bài nộp và điểm vẫn được giữ trong database. Muốn truy cập lại lớp từ giao diện, ghi danh lại khi khóa học còn nhận ghi danh.

## 5. Trạng thái và thông báo

| Thông báo / trạng thái | Cách xử lý |
| --- | --- |
| Bản nháp | Teacher cần xuất bản khóa học/bài tập phù hợp |
| Chưa ghi danh hợp lệ | Student cần ghi danh hoặc ghi danh lại khi khóa học còn mở |
| Đã quá hạn | Backend đối chiếu thời gian hiện tại; không thể bỏ qua bằng cách chỉnh form |
| Tài khoản bị khóa | Liên hệ Admin để xử lý trạng thái tài khoản |
| JWT hết hạn / mật khẩu đã thay đổi | Đăng nhập lại bằng thông tin hiện tại |
| Email đã được sử dụng | Chọn email khác trong form hồ sơ |
| File không hợp lệ / quá dung lượng | Kiểm tra định dạng thực và kích thước, không chỉ đổi đuôi file |

Các lỗi kết nối/cài đặt được hướng dẫn trong [README](../README.md#xử-lý-lỗi-thường-gặp). Tải lại danh sách hoặc trang bài tập để lấy dữ liệu mới sau thao tác của tài khoản khác; ứng dụng hiện chưa cập nhật realtime.
