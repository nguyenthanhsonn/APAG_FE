# Hướng dẫn sử dụng trang Admin

Tài liệu này dành cho tài khoản có vai trò **Quản trị viên** trong hệ thống đánh giá rèn luyện sinh viên APAG.

## 1. Đăng nhập và truy cập

1. Mở hệ thống trên trình duyệt.
2. Nhập tài khoản và mật khẩu admin.
3. Sau khi đăng nhập thành công, hệ thống tự chuyển vào khu vực quản trị.
4. Nếu không vào được trang admin, kiểm tra lại vai trò tài khoản hoặc liên hệ người quản lý hệ thống.

Các trang chính của admin gồm:

| Chức năng | Đường dẫn |
|---|---|
| Dashboard | `/admin` |
| Quản lý người dùng | `/admin/users` |
| Quản lý sinh viên | `/admin/students` |
| Import danh sách lớp/sinh viên | `/admin/import` |
| Quản lý khoa | `/admin/faculties` |
| Quản lý ngành học | `/admin/majors` |
| Quản lý lớp | `/admin/classes` |
| Quản lý học kỳ | `/admin/semesters` |
| Duyệt đánh giá rèn luyện | `/admin/evaluations` |
| Đổi mật khẩu | `/admin/change-password` |

## 2. Dashboard

Trang **Dashboard** hiển thị nhanh tình hình dữ liệu toàn hệ thống:

- Tổng số tài khoản.
- Tổng số sinh viên.
- Tổng số quản trị viên.
- Số khoa, ngành học và lớp.
- Thống kê số sinh viên theo từng khoa.

Admin nên kiểm tra Dashboard sau khi import dữ liệu hoặc tạo mới khoa/ngành/lớp/sinh viên để xác nhận số liệu đã cập nhật.

## 3. Quản lý người dùng

Trang **Quản lý người dùng** dùng để quản lý các tài khoản nội bộ, gồm:

- Quản trị viên.
- Lớp trưởng.
- Cố vấn học tập.
- Tài khoản khoa.
- Phòng Đào tạo.

### Tìm kiếm và lọc

1. Nhập tên người dùng vào ô tìm kiếm.
2. Chọn trạng thái: **Tất cả**, **Hoạt động**, hoặc **Đang khóa**.
3. Chọn vai trò cần xem nếu muốn lọc theo nhóm tài khoản.

### Thêm người dùng

1. Bấm **Thêm người dùng**.
2. Nhập thông tin tài khoản: username, họ tên, email, mật khẩu, vai trò và thông tin liên quan.
3. Nếu tạo tài khoản khoa, chọn khoa được quản lý.
4. Nếu tạo cố vấn học tập hoặc lớp trưởng, chọn lớp được phân công.
5. Bấm **Lưu** để tạo tài khoản.

Sau khi tạo, hệ thống có thể gửi email tài khoản nếu backend/email service đã được cấu hình.

### Sửa, khóa/mở khóa, xóa tài khoản

- Bấm biểu tượng **Sửa** để cập nhật thông tin người dùng.
- Bấm biểu tượng **Khóa** để tạm khóa tài khoản.
- Bấm biểu tượng **Mở khóa** để cho phép tài khoản đăng nhập lại.
- Bấm biểu tượng **Xóa** để xóa tài khoản.

Lưu ý: Sinh viên được quản lý ở trang **Quản lý sinh viên**, không chỉnh sửa trực tiếp trong modal người dùng.

## 4. Quản lý sinh viên

Trang **Quản lý sinh viên** dùng để xem, tạo, import, khóa/mở khóa và xóa tài khoản sinh viên.

### Tìm kiếm sinh viên

1. Nhập tên hoặc mã sinh viên vào ô tìm kiếm.
2. Hệ thống hiển thị danh sách theo trang, mỗi trang 10 sinh viên.

### Tạo sinh viên thủ công

1. Bấm **Thêm sinh viên**.
2. Nhập thông tin sinh viên theo form.
3. Chọn lớp tương ứng nếu form yêu cầu.
4. Bấm **Lưu**.

### Import sinh viên từ Excel

Có thể import tại trang **Quản lý sinh viên** hoặc trang **Import danh sách lớp**.

1. Bấm **Import Excel** hoặc vào `/admin/import`.
2. Tải file mẫu Excel.
3. Điền dữ liệu đúng định dạng trong file mẫu.
4. Upload file `.xlsx` hoặc `.xls`.
5. Kiểm tra phần **Preview import**:
   - Số dòng thành công.
   - Số dòng bị bỏ qua.
   - Số dòng thất bại.
   - Chi tiết lỗi nếu có.
6. Nếu dữ liệu hợp lệ, bấm **Xác nhận import** để ghi dữ liệu vào hệ thống.

Sau khi import thành công, hệ thống có thể hiển thị danh sách tài khoản vừa được tạo, bao gồm username và password trả về từ backend.

### Khóa/mở khóa hoặc xóa sinh viên

- Bấm biểu tượng **Khóa** để tạm khóa tài khoản sinh viên.
- Bấm biểu tượng **Mở khóa** để mở lại tài khoản.
- Bấm biểu tượng **Xóa** để xóa sinh viên.

## 5. Quản lý khoa

Trang **Quản lý Khoa** dùng để thêm, sửa, ẩn/hiện và xóa khoa.

### Tìm kiếm và lọc

1. Nhập tên khoa hoặc mã khoa.
2. Lọc theo trạng thái:
   - **Tất cả**.
   - **Hoạt động**.
   - **Đang ẩn**.

### Thêm hoặc sửa khoa

1. Bấm **Thêm khoa** để tạo mới, hoặc bấm biểu tượng **Sửa** trên dòng cần cập nhật.
2. Nhập mã khoa và tên khoa.
3. Bấm **Lưu**.

### Ẩn/hiện hoặc xóa khoa

- Bấm biểu tượng **Ẩn khoa** để chuyển khoa sang trạng thái ẩn.
- Bấm biểu tượng **Hiện khoa** để kích hoạt lại.
- Bấm biểu tượng **Xóa** để xóa khoa.

Không nên xóa khoa đã có ngành học, lớp học hoặc dữ liệu đánh giá liên quan.

## 6. Quản lý ngành học

Trang **Quản lý Ngành học** dùng để tạo và cập nhật ngành thuộc từng khoa.

### Tìm kiếm và lọc

1. Nhập tên ngành hoặc mã ngành.
2. Chọn khoa để chỉ xem ngành thuộc khoa đó.

### Thêm hoặc sửa ngành

1. Bấm **Thêm ngành** hoặc biểu tượng **Sửa**.
2. Nhập mã ngành, tên ngành.
3. Chọn khoa quản lý ngành.
4. Bấm **Lưu**.

### Xóa ngành

Bấm biểu tượng **Xóa** trên dòng ngành cần xóa và xác nhận. Không nên xóa ngành đã có lớp học hoặc dữ liệu liên quan.

## 7. Quản lý lớp

Trang **Quản lý Lớp** dùng để xem danh sách lớp theo khoa/ngành và truy cập danh sách sinh viên trong lớp.

### Tìm kiếm và lọc lớp

1. Nhập tên lớp hoặc mã lớp.
2. Chọn khoa.
3. Chọn ngành nếu cần lọc hẹp hơn.

### Xem chi tiết lớp

Chọn một lớp trong danh sách để xem danh sách sinh viên hoặc thông tin liên quan của lớp.

### Lưu ý hiện tại

Trong giao diện có nút thêm/sửa/xóa lớp, nhưng phần code hiện tại đang báo **Chưa có API tạo/cập nhật/xóa lớp học**. Vì vậy các thao tác này chưa được xem là hoàn chỉnh cho vận hành thực tế.

## 8. Quản lý học kỳ

Trang **Quản lý Học kỳ** dùng để tạo, chỉnh sửa và mở/đóng kỳ đánh giá rèn luyện.

### Lọc học kỳ

1. Chọn năm học.
2. Chọn trạng thái:
   - **Tất cả**.
   - **Đang mở**.
   - **Đã khóa**.

### Tạo học kỳ mới

1. Bấm **Tạo học kỳ mới**.
2. Nhập năm bắt đầu.
3. Chọn học kỳ: **Học kỳ 1**, **Học kỳ 2**, hoặc **Học kỳ hè**.
4. Chọn ngày bắt đầu và ngày kết thúc.
5. Nếu muốn mở ngay kỳ vừa tạo, tích **Mở học kỳ sau khi tạo**.
6. Bấm **Lưu**.

Ngày kết thúc phải sau ngày bắt đầu. Năm học chỉ được chọn trong khoảng hệ thống cho phép.

### Sửa học kỳ

1. Bấm **Sửa** trên dòng học kỳ.
2. Cập nhật ngày bắt đầu, ngày kết thúc hoặc thông tin học kỳ.
3. Bấm **Lưu**.

### Mở hoặc đóng học kỳ

- Bấm **Mở kỳ này** để kích hoạt học kỳ.
- Bấm **Đóng kỳ** để khóa học kỳ đang mở.

Khi mở một học kỳ mới, hệ thống có thể tự khóa học kỳ đang mở hiện tại. Khi đóng học kỳ, sinh viên sẽ không thể chỉnh sửa phiếu thuộc học kỳ đó.

## 9. Duyệt đánh giá rèn luyện

Trang **Duyệt đánh giá rèn luyện** dùng để phê duyệt cuối các phiếu đã được lớp/CVHT/khoa xử lý và đang chờ admin xác nhận.

### Lọc danh sách phiếu

Admin có thể lọc theo:

- Tên sinh viên hoặc lớp.
- Khoa.
- Lớp.
- Học kỳ.

Hệ thống hiển thị tổng số phiếu đang chờ duyệt theo bộ lọc hiện tại.

### Xem và duyệt một phiếu

1. Tìm phiếu cần xử lý.
2. Bấm **Xem** hoặc **Duyệt**.
3. Kiểm tra sinh viên, lớp, điểm lớp đã duyệt, xếp loại và tiến trình.
4. Bấm **Phê duyệt** để chuyển phiếu sang trạng thái hoàn tất.

Admin chỉ xác nhận điểm đã được các cấp trước duyệt, không nhập lại toàn bộ phiếu tại màn này.

### Duyệt nhiều phiếu

1. Tích chọn các phiếu cần duyệt.
2. Bấm **Phê duyệt đã chọn**.
3. Xác nhận thao tác.

### Duyệt tất cả theo bộ lọc

1. Chọn bộ lọc chính xác trước khi thao tác.
2. Bấm **Phê duyệt tất cả ... phiếu**.
3. Kiểm tra số lượng phiếu trong hộp xác nhận.
4. Xác nhận nếu chắc chắn.

Nên dùng bộ lọc theo học kỳ/khoa/lớp trước khi duyệt hàng loạt để tránh phê duyệt nhầm phạm vi.

## 10. Đổi mật khẩu

1. Vào `/admin/change-password`.
2. Nhập mật khẩu hiện tại.
3. Nhập mật khẩu mới.
4. Xác nhận mật khẩu mới.
5. Bấm lưu để cập nhật.

Sau khi đổi mật khẩu, nên đăng xuất và đăng nhập lại để kiểm tra.

## 11. Một số lưu ý vận hành

- Luôn tạo hoặc mở đúng học kỳ trước khi cho sinh viên điền phiếu.
- Kiểm tra dữ liệu khoa, ngành, lớp trước khi import sinh viên.
- Khi import Excel, luôn tải file mẫu mới nhất từ hệ thống.
- Không xóa khoa/ngành/lớp/tài khoản đã phát sinh dữ liệu đánh giá nếu không chắc chắn.
- Trước khi duyệt hàng loạt phiếu đánh giá, kiểm tra kỹ bộ lọc và số lượng phiếu.
- Nếu màn hình báo lỗi khi lưu dữ liệu, đọc nội dung lỗi hiển thị trước khi thao tác lại.

## 12. Luồng thao tác khuyến nghị đầu kỳ

1. Kiểm tra hoặc tạo học kỳ mới.
2. Mở học kỳ cần đánh giá.
3. Kiểm tra danh mục khoa.
4. Kiểm tra danh mục ngành.
5. Kiểm tra danh sách lớp.
6. Import hoặc tạo sinh viên.
7. Tạo/phân công tài khoản lớp trưởng, cố vấn học tập, khoa và phòng đào tạo.
8. Theo dõi tiến độ xử lý phiếu.
9. Duyệt cuối các phiếu đã qua đủ bước.
10. Đóng học kỳ sau khi hoàn tất.
