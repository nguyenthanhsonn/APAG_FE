# Hướng dẫn sử dụng Hệ thống Đánh giá Rèn luyện Sinh viên

---

## 🎯 Dành cho SINH VIÊN

### Bước 1: Đăng nhập hệ thống

1. Truy cập hệ thống
2. Nhập tên đăng nhập (mã sinh viên hoặc username)
3. Nhập mật khẩu
4. Nhấn **Đăng nhập**

**Tài khoản demo:** `sv001` / `123456`

---

### Bước 2: Cập nhật thông tin cá nhân

Vào menu **Thông tin cá nhân**, điền đầy đủ các thông tin:

#### Thông tin sinh viên (bắt buộc)

1. **Năm trúng tuyển**: Chọn từ ComboBox (tự động theo năm học)
2. **Khoa**: Chọn khoa quản lý từ ComboBox
3. **Ngành/chuyên ngành**: Chọn ngành học từ ComboBox (lọc theo khoa)
4. **Lớp**: Chọn lớp từ ComboBox (lọc theo ngành và khoa)
5. **Mã sinh viên**: Nhập hoặc chọn từ ComboBox (nếu hỗ trợ)
6. **Họ và tên**: Tự động hiển thị (hoặc nhập nếu chưa có)
7. **Ngày sinh**: Tự động hiển thị (hoặc nhập nếu chưa có)
8. **Số điện thoại**: Nhập số điện thoại liên hệ

#### Kỳ đánh giá

1. **Học kỳ**: Chọn Kỳ I hoặc Kỳ II
2. **Năm học**: Chọn năm học từ ComboBox

Nhấn **Lưu thông tin** để lưu.

---

### Bước 3: Điền phiếu đánh giá rèn luyện

Vào menu **Phiếu đánh giá**, điền theo 5 mục:

---

## 📋 MỤC I: Ý thức tham gia học tập (0-20 điểm)

### 1. Ý thức và thái độ học tập (0-6 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- ≥9 điểm → 6 điểm
- 7 đến cận 9 → 5 điểm
- 5 đến cận 7 → 4 điểm
- 4 đến cận 5 → 2 điểm
- 1 đến cận 4 → 1 điểm

### 2. Hoạt động NCKH, Olympic (0-6 điểm)

**Cách làm:** Tích CheckBox vào các hoạt động đã tham gia

- ☑ Tham gia đầy đủ hoạt động NCKH (2đ)
  - Cần có **minh chứng** (file đính kèm)
  
- ☑ Có công bố khoa học hoặc tham gia thi (2đ)
  - Cần có **minh chứng** (file đính kèm)
  - **AI sẽ kiểm tra** nội dung giấy khen
  
- ☑ Đạt giải Olympic/NCKH (2đ)
  - Cần có **minh chứng** (file đính kèm)
  - **AI sẽ kiểm tra** nội dung giấy khen

### 3. Xếp loại học tập (0-8 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Xuất sắc → 8 điểm
- Giỏi → 7 điểm
- Khá → 6 điểm
- Trung bình → 4 điểm
- Yếu (chưa cảnh báo) → 2 điểm
- Yếu (cảnh báo lần 1) → 1 điểm

---

## 📋 MỤC II: Chấp hành nội quy (0-25 điểm)

**Điểm gốc: 25 điểm** → Sẽ bị trừ theo vi phạm

**Cách làm:** Nhập số lần vi phạm vào TextBox

| Vi phạm | Trừ | Nhập số lần |
|---------|-----|-------------|
| Không tham gia tuần sinh hoạt / bài thu hoạch <5 | -10đ | [ ] |
| Nghỉ không lý do tuần sinh hoạt | -3đ/buổi | [ ] |
| Không tham gia sinh hoạt lớp, họp | -5đ/buổi | [ ] |
| Không đeo thẻ, không mặc đồng phục | -5đ/lần | [ ] |
| Vi phạm giảng đường, thư viện | -5đ/lần | [ ] |
| Chậm đóng học phí | -5đ/lần | [ ] |
| Bị khiển trách trong thi | -5đ/lần | [ ] |
| Vi phạm quy chế thi | -10đ/lần | [ ] |
| Bị đình chỉ thi | -20đ/lần | [ ] |

**Hệ thống sẽ tự động tính:** 25 - (tổng điểm trừ)

---

## 📋 MỤC III: Hoạt động CT-XH (0-20 điểm)

### 1. Hoạt động chính trị, xã hội (0-5 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Tham gia và chấp hành tốt → 5 điểm
- Vắng 1 buổi không lý do → 3 điểm
- Vắng 2 buổi không lý do → 2 điểm
- Vắng ≥3 buổi hoặc không tham gia → 0 điểm

### 2. Văn hóa, văn nghệ, thể thao (0-5 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Tham gia đầy đủ, có hiệu quả → 5 điểm
- Tham gia ≥50% hoạt động → 3 điểm
- Tích cực vận động → 2 điểm
- Vắng >50% → 1 điểm
- Không tham gia → 0 điểm

### 3. Câu lạc bộ, Đội, Nhóm (0-5 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Tham gia đầy đủ, có hiệu quả → 5 điểm
- Tham gia tích cực ≥1 hoạt động → 3 điểm
- Là thành viên tích cực → 2 điểm
- Vắng >50% → 1 điểm
- Không tham gia → 0 điểm

### 4. Phòng chống TNXH (0-3 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Tham gia tích cực / có tố giác TNXH → 3 điểm
- Tham gia 1 hoạt động đạt hiệu quả → 2 điểm
- Có ý thức tham gia → 1 điểm
- Bị nhắc nhở do vi phạm → 0 điểm

### 5. Được khen thưởng (0-2 điểm)

**Cách làm:** Nhập điểm vào TextBox (tối đa 2 điểm)

- Cần **tải file đính kèm** giấy khen

---

## 📋 MỤC IV: Ý thức công dân (0-25 điểm)

### 1. Chấp hành chính sách pháp luật (0-10 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Chấp hành tốt + được khen thưởng → 10 điểm
  - Cần **file đính kèm** giấy khen
- Chấp hành tốt + tuyên truyền → 8 điểm
- Chấp hành đúng quy định → 5 điểm
- Bị nhắc nhở, lập biên bản → 0 điểm

### 2. Hoạt động từ thiện, tình nguyện (0-10 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Tích cực, được khen thưởng → 10 điểm
  - Cần **file đính kèm** giấy khen
- Tham gia tích cực → 8 điểm
- Có ý thức tham gia → 5 điểm
- Gây mất đoàn kết → 0 điểm
- Không tham gia → 0 điểm

### 3. Xây dựng tập thể (0-5 điểm)

**Cách làm:** Chọn 1 mức từ ComboBox

- Có ý thức xây dựng tập thể → 5 điểm
- Bị nhắc nhở 1 lần → 1 điểm
- Bị nhắc nhở 2 lần → 0 điểm

---

## 📋 MỤC V: Vai trò cán bộ (0-10 điểm)

### ⚠️ LƯU Ý: Chọn 1 trong 2 vai trò

**Cách làm:** Tích CheckBox vào vai trò của bạn

---

### ☑ OPTION 1: Là Cán bộ lớp, BCH Đoàn, Hội, CLB

#### a) Ý thức, tinh thần, thái độ (0-7 điểm)

**Nếu là Lớp trưởng, Bí thư, Chủ nhiệm:**

Chọn 1 mức từ ComboBox:
- Xuất sắc (được khen thưởng) → 7 điểm
  - Cần **file đính kèm** giấy khen
- Hoàn thành tốt → 6 điểm
- Hoàn thành → 4 điểm
- Không hoàn thành → 0 điểm

**Nếu là Ủy viên, Tổ trưởng:**

Chọn 1 mức từ ComboBox:
- Xuất sắc (được khen thưởng) → 7 điểm
  - Cần **file đính kèm** giấy khen
- Hoàn thành tốt → 6 điểm (thực tế ghi 5 điểm)
- Hoàn thành → 4 điểm (thực tế ghi 3 điểm)
- Không hoàn thành → 0 điểm

#### b) Kỹ năng tổ chức (0-3 điểm)

Chọn 1 mức từ ComboBox:
- Cấp trưởng → 3 điểm
- Cấp phó → 2 điểm
- Ủy viên → 1 điểm

---

### ☑ OPTION 2: Là Sinh viên thường

#### a) Tham gia hoạt động lớp, khoa (0-3 điểm)

**Cách làm:** Nhập điểm vào TextBox (từ 1 đến 3)

#### b) Thành tích đặc biệt (0-7 điểm)

Chọn 1 mức từ ComboBox:
- Khen thưởng từ cấp Học viện trở lên → 7 điểm
  - Cần **file đính kèm** giấy khen
- Khen thưởng từ cấp Khoa trở lên → 5 điểm
  - Cần **file đính kèm** giấy khen
- Không có → 0 điểm

---

## 🎯 Bước 4: Quản lý minh chứng

Vào menu **Quản lý minh chứng**:

1. Chọn tiêu chí cần tải minh chứng
2. Click **Tải lên** hoặc kéo thả file
3. Hỗ trợ: JPG, PNG, PDF (max 5MB)
4. AI sẽ tự động kiểm tra:
   - ✅ Phù hợp (`verified`)
   - ⚠️ Nghi ngờ không khớp (`suspicious`)
   - 📝 Cần kiểm tra thủ công (`manual_review`)

---

## 💾 Bước 5: Lưu và nộp phiếu

### Lưu nháp
- Click **Lưu nháp** để lưu tạm
- Có thể chỉnh sửa sau

### Tính điểm
- Click **Tính điểm** để xem điểm tạm tính
- Kiểm tra từng mục

### Nộp phiếu chính thức
1. Kiểm tra đầy đủ thông tin
2. Kiểm tra đã tải minh chứng
3. Click **Nộp phiếu**
4. Xác nhận nộp

⚠️ **LƯU Ý:** Sau khi nộp sẽ KHÔNG thể chỉnh sửa!

---

## 📊 Bước 6: Theo dõi trạng thái

Vào menu **Lịch sử đánh giá** hoặc **Kết quả**:

### Trạng thái phiếu
1. **Nháp** (`draft`) - Chưa nộp
2. **Đã nộp** (`submitted`) - Chờ lớp đánh giá
3. **Lớp đánh giá** (`class_reviewed`) - Chờ CVHT
4. **CVHT xét duyệt** (`advisor_reviewed`) - Chờ Khoa
5. **Khoa phê duyệt** (`faculty_approved`) - Hoàn tất ✅
6. **Bị trả lại** (`rejected`) - Xem lý do, sửa và nộp lại

### Xem kết quả
- Tổng điểm / 100
- Xếp loại: Xuất sắc / Tốt / Khá / Trung bình / Yếu / Kém
- Nhận xét từ người đánh giá
- Chi tiết từng mục

---

## 📏 Xếp loại rèn luyện

| Điểm | Xếp loại |
|------|----------|
| 90-100 | Xuất sắc |
| 80-89 | Tốt |
| 65-79 | Khá |
| 50-64 | Trung bình |
| 35-49 | Yếu |
| <35 | Kém |

---

## 📊 Bảng tổng hợp điểm tối đa

| Mục | Tên | Điểm tối đa |
|-----|-----|-------------|
| I | Ý thức tham gia học tập | 20 điểm |
| II | Chấp hành nội quy, quy chế | 25 điểm |
| III | Hoạt động CT-XH, văn hóa, thể thao | 20 điểm |
| IV | Đánh giá về ý thức công dân trong quan hệ cộng đồng | 25 điểm |
| V | Vai trò cán bộ lớp, Đoàn, Hội, CLB | 10 điểm |
| **TỔNG** | | **100 điểm** |

---

## ⚠️ QUY ĐỊNH ĐẶC BIỆT

1. **Những sinh viên đạt điểm ở nhiều nội dung, lấy nội dung điểm cao nhất**

2. **Sinh viên vi phạm trên mức quy định → điểm mục đó = 0**

3. **Sinh viên bị thông báo, nhắc nhở bằng văn bản hoặc đình chỉ ≤30 ngày**
   → Điểm rèn luyện **KHÔNG vượt quá loại Khá**

4. **Sinh viên không nộp phiếu đúng hạn**
   → Xếp loại **Yếu hoặc Kém**

---

## 🎁 Lợi ích của xếp loại cao

### Xuất sắc (≥90 điểm)
✅ Ưu tiên xét học bổng  
✅ Ưu tiên giới thiệu việc làm  
✅ Được xét khen thưởng cuối năm  
✅ Cộng điểm xét tuyển sau đại học  

### Tốt (80-89 điểm)
✅ Xét học bổng khuyến khích  
✅ Được khen thưởng  

---

## 🖥️ Dành cho ADMIN / QUẢN TRỊ VIÊN

**Tài khoản demo:** `admin` / `123456`

---

### A1. Quản lý User

1. Vào menu **Quản lý User**
2. Nhấn **Thêm user** để tạo tài khoản mới (admin hoặc sinh viên)
3. Điền thông tin: Username, Họ tên, Role (admin / sinh viên), Email
4. Nhấn icon ✏️ để sửa thông tin user
5. Nhấn icon 🔒 để khóa / mở khóa tài khoản
6. Nhấn icon 🗑️ để xóa user (có xác nhận)
7. Tìm kiếm theo tên hoặc username

> ⚠️ **Lưu ý hiện tại:** Form tạo/sửa User (modal popup) đang trong giai đoạn phát triển.

---

### A2. Quản lý Ngành học

1. Vào menu **Quản lý Ngành**
2. Nhấn **Thêm ngành** để thêm ngành mới
3. Điền: Mã ngành + Tên ngành/Chuyên ngành + Khoa
4. Nhấn icon ✏️ để sửa ngành
5. Nhấn icon 🗑️ để xóa (có xác nhận)
6. Danh sách hiển thị: Mã ngành, Tên ngành, Khoa

> ⚠️ **Lưu ý hiện tại:** Form tạo/sửa Ngành (modal) đang trong giai đoạn phát triển.

---

### A3. Quản lý Khoa ✅ (Đầy đủ chức năng)

1. Vào menu **Quản lý Khoa**
2. Nhấn **Thêm khoa** → Modal popup mở ra
3. Điền: Mã khoa + Tên khoa → Nhấn **Thêm mới**
4. Nhấn icon ✏️ → Modal mở sẵn thông tin cũ → Nhấn **Cập nhật**
5. Nhấn icon 👁️ để ẩn/hiện khoa
6. Nhấn icon 🗑️ để xóa (có xác nhận)

---

### A4. Quản lý Lớp

1. Vào menu **Quản lý Lớp**
2. Danh sách hiển thị: Mã lớp, Tên lớp, Ngành, Khoa
3. Nhấn **Thêm lớp** → Form tạo lớp
4. Nhấn icon ✏️ để sửa lớp
5. Nhấn icon 🗑️ để xóa (có xác nhận)

> ⚠️ **Lưu ý hiện tại:** Modal tạo/sửa Lớp đang trong giai đoạn phát triển.

---

### A5. Danh sách lớp & Import

#### Xem danh sách sinh viên theo lớp:
1. Vào menu **Danh sách lớp**
2. Chọn **Khoa** từ ComboBox
3. Chọn **Ngành** từ ComboBox (lọc theo Khoa đã chọn)
4. Chọn **Lớp** từ ComboBox (lọc theo Ngành đã chọn)
5. Danh sách sinh viên của lớp đó hiện ra bên dưới
6. Có thể tìm kiếm trong danh sách
7. Nhấn **Thêm sinh viên** để thêm mới vào lớp

#### Import danh sách từ file:
1. Vào menu **Import danh sách**
2. Tải file mẫu: **Excel (.xlsx/.xls)** hoặc **Word (.doc/.docx)**
3. Điền thông tin sinh viên vào file theo đúng định dạng mẫu
4. Upload file lên hệ thống (kéo thả hoặc click chọn file)
5. Hệ thống xử lý và hiển thị kết quả:
   - ✅ Số dòng thành công
   - ❌ Số dòng thất bại + Chi tiết lỗi từng dòng
6. Nhấn **Xác nhận import** để lưu vào hệ thống

**Các trường bắt buộc trong file mẫu:**
- Mã sinh viên (không trùng lặp)
- Họ và tên
- Ngày sinh (định dạng DD/MM/YYYY)
- Lớp

---

## 🔄 Luồng xét duyệt phiếu

Sau khi sinh viên nộp phiếu, quy trình xét duyệt như sau:

```
draft             → SV đang soạn thảo (chưa nộp)
     ↓ SV nhấn "Nộp phiếu"
submitted         → SV đã nộp, chờ lớp chấm
     ↓ Lớp trưởng/Ban cán sự chấm
class_reviewed    → Lớp đã chấm, chờ CVHT
     ↓ Cố vấn học tập xét duyệt
advisor_reviewed  → CVHT đã xét, chờ Khoa
     ↓ Khoa phê duyệt
faculty_approved  → Hoàn tất ✅

--- Ở bất kỳ bước nào đều có thể ---
rejected          → Bị trả lại (bắt buộc ghi rõ lý do)
```

> ⚠️ **Sinh viên không nộp đúng hạn** → Hệ thống tự động xếp loại **Yếu hoặc Kém**.

---

## 📎 Yêu cầu file minh chứng

| Loại file | Định dạng hỗ trợ |
|-----------|-----------------|
| Ảnh | JPG, PNG |
| Tài liệu | PDF |
| Kích thước tối đa | 5MB/file |

**Kết quả AI kiểm tra tự động:**

| Trạng thái | Ý nghĩa |
|-----------|---------|
| ✅ `verified` | Hợp lệ, đúng nội dung tiêu chí đã khai |
| ⚠️ `suspicious` | Nghi ngờ không khớp — cần kiểm tra thêm |
| 📝 `manual_review` | Cần cán bộ kiểm tra thủ công |

---

## 📞 Hỗ trợ

- Nếu gặp vấn đề kỹ thuật: Liên hệ IT
- Nếu có thắc mắc về tiêu chí: Hỏi CVHT
- Nếu cần hỗ trợ minh chứng: Liên hệ Đoàn - Hội

---

## 💡 MẸO ĐÁNH GIÁ

✅ **Chuẩn bị trước:**
- Thu thập giấy khen, chứng nhận
- Chụp ảnh hoạt động (có logo trường)
- Lưu trữ minh chứng theo thư mục

✅ **Khi điền phiếu:**
- Đọc kỹ từng tiêu chí
- Chọn đúng mức độ thực tế
- Không khai khống
- Tải đủ minh chứng

✅ **Trước khi nộp:**
- Kiểm tra lại toàn bộ
- Xem điểm tạm tính
- Đảm bảo file minh chứng rõ ràng
- Lưu nháp nhiều lần

---

**Chúc các bạn đánh giá tốt! 🎓**
