# Socket notification phía FE

Cập nhật 21/10/2026, tương thích gateway Phase 5. Không cần biến môi trường mới.

## Các file chính

| File | Trách nhiệm |
|---|---|
| `src/hooks/useNotificationSocket.ts` | React subscription theo userId, giữ callback mới nhất và cleanup khi unmount |
| `src/realtime/notification-client.ts` | Singleton cho tab trình duyệt, resolve URL, đọc phiên, lắng nghe auth/storage events |
| `src/realtime/notification-connection.ts` | Lifecycle connection, subscriber độc lập, generation để hủy kết quả async cũ, reconnect/recovery/backoff |
| `src/utils/authSession.ts` | Thông báo token/phiên đổi và logout/login bắt đầu |
| `src/api/api.ts` | HTTP refresh single-flight theo refresh token; không phục hồi credentials của phiên cũ |
| `src/store/authStore.ts` | Phát tín hiệu bắt đầu/kết thúc login/logout |

## Hành vi hiện tại

- Một socket dùng chung cho các component cùng tài khoản trong một tab; mỗi tab có connection riêng.
- Handshake dùng `auth.token`; không gửi userId để chọn room. Server xác minh JWT và tự join room.
- Transport `websocket`, không dùng polling fallback. `NEXT_PUBLIC_SOCKET_URL` nếu có cần trỏ tới origin backend hỗ trợ WebSocket; mặc định suy ra từ `API_URL`.
- Callback auth lấy token đang dùng cho mỗi handshake. Khi HTTP refresh đổi token, đóng connection cũ và tạo connection theo token mới.
- Khi connect/reconnect, báo các subscriber reload notification từ REST. Redis Pub/Sub không replay các event bị lỡ.
- Mất mạng/API restart: dùng reconnection của Socket.IO, backoff 1–30 giây có jitter. Handshake 401 hoặc server disconnect: HTTP `/auth/me` dùng cơ chế refresh hiện có, single-flight; không lặp vô hạn với cùng JWT bị từ chối.
- Lỗi dependency tạm thời trong recovery hoặc import chunk: retry theo backoff, hủy timer khi không còn subscriber. 401/403 kết thúc recovery.
- Logout đóng socket ngay trước khi chờ HTTP logout. Login bắt đầu cũng ngừng socket cũ. Promise import/refresh cũ không được tạo/reconnect connection sau khi phiên đã đổi.
- Kết quả refresh trả về sau logout hoặc đổi tài khoản không được ghi đè credentials. Refresh của phiên mới không phải chờ hoặc dùng chung promise của tài khoản cũ.
- Chỉ subscriber của user hiện tại nhận callback. Token/user trong storage lệch nhau khi đổi tài khoản qua tab khác sẽ không tạo connection. Việc đọc `sub` tại FE chỉ chống lẫn phiên; xác minh JWT vẫn thuộc backend.
- Lắng nghe cả auth event trong tab hiện tại và `storage` event từ tab khác. Gỡ global listeners khi subscriber cuối unmount; login khi UI chưa mounted vẫn khởi động socket đúng khi component xuất hiện sau đó.
- Cleanup subscriber độc lập, chịu được React Strict Mode mount/unmount/remount. Không giữ danh sách callback đang chờ import trong hook.

`Header` và `NewEvaluationChecker` tiếp tục dùng `useNotificationSocket` hiện có, không cần sửa API của các component.

## Kiểm chứng

```bash
pnpm test:socket
pnpm test:api
pnpm test:profile
pnpm exec tsc --noEmit --incremental false
pnpm build
```

Đã đạt 17 test socket, 19 test API và 8 test profile; TypeScript, lint các file thay đổi và production build đạt. Test socket kiểm tra lifecycle với transport giả lập và browser event harness; không phải bài đo tải hay E2E giao diện thực. Backend Phase 5 đã kiểm chứng Pub/Sub giữa hai NestJS process bằng Socket.IO client thật.

Tình huống kiểm tra thủ công khi triển khai:

1. Login, mở hai component notification: trong một tab chỉ có một connection `/notifications`.
2. Mở cùng tài khoản ở hai tab; notification emit tại API A tới socket ở API B.
3. Refresh token qua HTTP: connection mới dùng JWT mới, danh sách notification được tải lại.
4. Tắt/bật network hoặc restart API: reconnect không cần reload trang, REST bù dữ liệu bị lỡ.
5. Logout ngay khi refresh đang chạy: không có connection tự mở lại.
6. Đổi tài khoản khi socket đang reconnect hoặc import chưa xong: tài khoản mới không nhận callback của tài khoản cũ.

Không ghi access/refresh token hoặc Socket.IO options chứa token vào log. Chưa kiểm thử load balancer production hoặc khả năng chịu tải trong thay đổi này.
