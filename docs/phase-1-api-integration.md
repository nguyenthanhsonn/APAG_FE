# FE integration sau Phase 1

Cập nhật 20/10/2026. FE: `/Users/nguyenson/APAG_FE`; BE: `/Users/nguyenson/APAG_BE/projects`. Đã sửa code và kiểm tra local; chưa deploy.

## Các thay đổi

| Yêu cầu | Cách triển khai |
|---|---|
| API layer | `evaluationTransport.ts` dùng chung: giữ snapshot version, xếp hàng ghi cùng phiếu, gom request double-click đang chạy và quản lý intent retry |
| Idempotency-Key | Tự gắn cho submit, review/confirm, chuyển cấp, finalize/bulk/filter. Timeout/5xx giữ nguyên key và payload đã chuẩn bị, gồm expectedVersion. Thành công hoặc lỗi 4xx xác định kết thúc intent |
| expectedVersion | Gửi version đã đọc trên màn hình, không GET lại version ngay trước khi ghi. BE so sánh version client, sau đó vẫn CAS id + version khi UPDATE |
| Batch chọn ID | Gửi `expectedVersions: [{ id, version }]` cùng `ids`/`evaluationIds`. Một candidate mất hiệu lực hoặc stale trả 409, không cập nhật một phần |
| Evidence | Gửi đủ evaluationFormId, criteriaCode, imageUrl, publicId; không thử endpoint/criteria khác và không báo thành công khi link thất bại |
| 401 | Một refresh request dùng chung khi nhiều API đồng thời hết access token; refresh thất bại/thiếu refresh token thì xóa session và chuyển login |
| 403 | Hiển thị thiếu quyền hoặc assignment đã đổi; không refresh, không biến thành danh sách rỗng thành công |
| 409 | Dừng ghi/retry tự động; giữ nội dung đang sửa, thông báo nguyên nhân và có nút tải lại với xác nhận bỏ thay đổi chưa lưu |
| Double submit | Khóa bằng ref ngay khi bắt đầu, disabled/loading ở nút/modal; API còn dedupe các request giống nhau đang chạy |

## Version theo màn hình

`createStudentApi()`, `createAdminApi()` và `createSharedApi()` cho phép dùng một `EvaluationTransport` riêng cho mỗi màn hình. Các API của cùng màn hình review dùng chung context. Màn hình sinh viên, trang evidence, trang admin và màn hình reviewer giữ context riêng, để lần refresh ở nơi khác không nâng version của một form còn chứa dữ liệu cũ.

Response cập nhật điểm/trạng thái có version; response thêm/xóa evidence trả thêm `evaluationVersion`, là version chính xác của phiếu cha sau transaction. Hàng đợi chỉ dùng version mới sau khi request trước đã thành công. Lỗi 409 khóa các lần ghi tiếp theo của context đó cho đến khi tải lại dữ liệu. Một GET bắt đầu trước lần ghi không được làm version quay về snapshot cũ khi trả kết quả chậm.

Form sinh viên lưu các mục tuần tự khi submit. Autosave và evidence cùng đi qua hàng đợi của phiếu, giảm xung đột do chính UI tạo ra. Sau timeout ở bước submit, nút retry ưu tiên gọi lại submit trước khi ghi thêm nháp.

Client cũ vẫn được BE chấp nhận khi chưa gửi expectedVersion; FE mới đã gửi ở các thao tác từng phiếu và batch chọn ID. Finalize-by-filter và khoa gửi cả lớp là command theo scope tại thời điểm thực thi, không giả định một trang dữ liệu đã tải chứa đủ version cho toàn bộ scope; các command này có idempotency và CAS phía server.

## Evidence

Trang quản lý minh chứng bắt buộc người dùng chọn phiếu; chỉ cho thêm/xóa khi snapshot đã tải và phiếu còn editable. Danh sách lọc theo form đã chọn. Form đánh giá gửi ID đang mở; không chọn form theo createdAt. Chỉ hiện tệp đã gắn thành công với BE. Xóa trên form gọi backend trước khi bỏ tệp khỏi UI.

Cloudinary upload và DB link là hai hệ thống riêng: nếu upload thành công nhưng link thất bại, tệp chưa được tính là minh chứng đã lưu. Chưa bổ sung cơ chế dọn Cloudinary asset mồ côi trong đợt này.

## Kiểm tra tự động

Trong FE:

```bash
npm run test:api
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

16 tests API dùng Node test runner và Axios adapter giả lập, không truy cập DB hoặc gửi thông báo. Bao gồm autosave tuần tự, double-click, retry giữ key/version, receipt intent qua sessionStorage, 409, evidence, GET cũ trả chậm, scope theo màn hình, payload bulk/class-forward, refresh một lần cho nhiều 401 và phân biệt 403.

Trong BE:

```bash
pnpm typecheck
pnpm test --runInBand
pnpm lint
pnpm test:concurrency
pnpm test:invariants
pnpm build
```

Bộ HTTP/PostgreSQL có full workflow qua sinh viên → lớp trưởng xác nhận/chuyển CVHT → CVHT xác nhận/chuyển khoa → khoa chuyển PĐT → PĐT finalize, kèm replay submit/finalize. Có test hai request tuần tự nhưng request sau giữ version màn hình cũ, và test rollback toàn selection khi bulk có version stale. Test ghi trong schema tạm rồi dọn; không seed hoặc sửa record nghiệp vụ trong public.

HTTP workflow test dùng principal giả lập ở auth guard để kiểm tra use case/role/scope, không thay cho bài test đăng nhập thực bằng trình duyệt. Logic refresh của FE và principal hiện tại của JWT có các test riêng.

## Checklist kiểm thử bằng trình duyệt trên staging

1. Sinh viên mở phiếu, sửa nhiều mục nhanh, tải nhiều minh chứng và submit. Mỗi tệp thành công phải hiện lại sau reload; double-click không tạo thêm business effect.
2. Mở cùng phiếu ở hai tab. Lưu tab A, sau đó lưu tab B: tab B nhận 409, giữ nội dung chưa lưu và có hành động tải lại; không tự retry dữ liệu cũ.
3. Dùng network throttling/offline ở bước submit/finalize. Retry cùng thao tác phải giữ key và nhận kết quả đầu tiên; không tạo thêm notification.
4. Lớp trưởng và CVHT chấm/xác nhận đúng lớp, chuyển danh sách từng bước. Tài khoản ngoài assignment nhận 403.
5. Khoa chuyển lớp thuộc khoa; PĐT chốt đơn và batch. Một form trong selection đã bị sửa ở tab khác phải làm cả selection trả 409.
6. Hết access token: chỉ một refresh cho nhiều API đồng thời. Hết refresh token: về login. Thu hồi role/assignment: API bị từ chối, không hiện thành dữ liệu rỗng.
7. Kiểm tra ngày deadline theo giờ Việt Nam và phiếu bị khóa/kỳ đã đóng; UI hiển thị đúng lỗi nghiệp vụ.

Checklist trình duyệt trên là hướng dẫn nghiệm thu, chưa được ghi nhận đã chạy đủ bằng tài khoản thực. Kết quả tự động không được xem là bằng chứng đã kiểm thử toàn bộ tương tác UI trên staging/production.

## Kết quả đã chạy local

- FE: 16 API tests đạt, TypeScript check đạt, Next.js production build đạt.
- FE lint: 0 errors, còn 3 warnings (PostCSS default export và dependencies hooks ở danh sách lớp).
- BE: 273 unit tests đạt, 29 HTTP/concurrency tests đạt, 12 invariant tests đạt; typecheck, lint và build đạt.
- Không deploy hoặc thay đổi dữ liệu nghiệp vụ trong public trong đợt tích hợp FE này.
