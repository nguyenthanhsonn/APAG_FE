/**
 * Tập trung xử lý và phân loại lỗi cho toàn bộ ứng dụng.
 *
 * Nguyên tắc:
 * - Lỗi kỹ thuật (network, 5xx, stack trace...) chỉ log ra console — KHÔNG bao giờ hiển thị cho người dùng.
 * - Lỗi nghiệp vụ từ BE (4xx kèm message tiếng Việt, rõ ràng) được hiển thị nếu an toàn.
 * - Tất cả nơi show toast/alert lỗi PHẢI đi qua getUserFriendlyError().
 */

// ─── Các pattern kỹ thuật cần che đi ──────────────────────────────────────────

/** Regex phát hiện các chuỗi kỹ thuật không nên hiển thị cho user */
const TECHNICAL_PATTERNS = [
  /is not a function/i,
  /cannot read (property|properties)/i,
  /\bundefined\b/,
  /\bnull\b/,
  /internal server error/i,
  /axioserror/i,
  /request failed with status code/i,
  /network error/i,
  /failed to fetch/i,
  /unable to connect/i,
  /econnrefused/i,
  /econnreset/i,
  /etimedout/i,
  /socket hang up/i,
  // Generic English status text
  /^unauthorized$/i,
  /^bad request$/i,
  /^forbidden$/i,
  /^not found$/i,
  /^conflict$/i,
  // URL / IP patterns
  /https?:\/\//i,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  // Stack trace fragments
  /at \w+\s*\(/,
  /\.ts:\d+/,
  /\.js:\d+/,
  // Java/Node exception class names
  /Exception:/i,
  /Error:/,
  // Port numbers in context
  /:\d{4,5}\//,
];

/** Kiểm tra xem một message có an toàn để hiển thị cho user không */
function isSafeUserMessage(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  if (message.length > 300) return false;

  const normalized = message.trim();
  if (normalized.length < 3) return false;

  return !TECHNICAL_PATTERNS.some((pattern) => pattern.test(normalized));
}

// ─── Logger ────────────────────────────────────────────────────────────────────

/**
 * Log lỗi kỹ thuật để dev debug — không bao giờ dùng để hiển thị cho user.
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  } else {
    const summary =
      error instanceof Error
        ? `${error.name}: ${error.message.slice(0, 100)}`
        : String(error).slice(0, 100);
    console.error(`[${context}] ${summary}`);
  }
}

// ─── Friendly message mapper ───────────────────────────────────────────────────

/**
 * Nhận lỗi gốc (từ catch) và trả về message thân thiện để hiển thị cho người dùng.
 *
 * @param error      - Lỗi từ catch block
 * @param fallback   - Message mặc định nếu không map được
 * @returns          - String message an toàn để hiển thị trực tiếp lên UI / toast
 */
export function getUserFriendlyError(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
): string {
  // Log đầy đủ lỗi kỹ thuật để dev debug
  console.error('[API Error]:', error);

  if (!error) return fallback;

  // ── Trích xuất thông tin từ error object ──────────────────────────────────
  let rawMessage = '';
  let statusCode: number | undefined;
  let validationErrors: unknown[] = [];
  let url = '';
  let isLogin = false;

  if (error instanceof Error) {
    rawMessage = error.message || '';
    if ('statusCode' in error) statusCode = (error as any).statusCode as number;
    if ('errors' in error && Array.isArray((error as any).errors)) {
      validationErrors = (error as any).errors;
    }
    if ('url' in error && typeof (error as any).url === 'string') {
      url = (error as any).url;
    }
    if ('isLogin' in error && typeof (error as any).isLogin === 'boolean') {
      isLogin = Boolean((error as any).isLogin);
    }
    if (
      'userMessage' in error &&
      typeof (error as any).userMessage === 'string' &&
      (error as any).userMessage
    ) {
      const userMsg = (error as any).userMessage;
      // Tránh lấy lại userMessage cũ bị gán nhầm "hết hạn" cho API đăng nhập
      if ((isLogin || url.includes('/auth/login')) && userMsg.includes('hết hạn')) {
        // Bỏ qua userMessage cũ bị sai, để phía dưới đánh giá lại đúng cho API login
      } else {
        return userMsg;
      }
    }
  } else if (typeof error === 'object' && error !== null) {
    rawMessage = (error as any).message || '';
    statusCode = (error as any).statusCode;
    if (Array.isArray((error as any).errors)) {
      validationErrors = (error as any).errors;
    }
    if (typeof (error as any).url === 'string') url = (error as any).url;
    if (typeof (error as any).isLogin === 'boolean') isLogin = Boolean((error as any).isLogin);
    if (typeof (error as any).userMessage === 'string' && (error as any).userMessage) {
      const userMsg = (error as any).userMessage;
      if ((isLogin || url.includes('/auth/login')) && userMsg.includes('hết hạn')) {
        // Bỏ qua
      } else {
        return userMsg;
      }
    }
  } else if (typeof error === 'string') {
    rawMessage = error;
  }

  // Tự động nhận diện API đăng nhập dựa trên URL hoặc nội dung
  if (url && (url.includes('/auth/login') || url.includes('/login'))) {
    isLogin = true;
  }

  const normalized = rawMessage.toLowerCase();

  // ── Bước 1: Lỗi network / kết nối ───────────────────────────────────────
  const isNetworkError =
    normalized.includes('network error') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('unable to connect') ||
    normalized.includes('econnrefused') ||
    normalized.includes('econnreset') ||
    normalized.includes('socket hang up') ||
    (!statusCode && isTechnicalMessage(normalized));

  if (isNetworkError) {
    return 'Không thể kết nối tới máy chủ, vui lòng thử lại.';
  }

  // ── Bước 2: Timeout ──────────────────────────────────────────────────────
  const isTimeoutError =
    normalized.includes('timeout') ||
    normalized.includes('etimedout') ||
    normalized.includes('exceeded') ||
    statusCode === 408;

  if (isTimeoutError) {
    return 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.';
  }

  // ── Bước 3: 5xx / lỗi hệ thống ──────────────────────────────────────────
  if (statusCode && statusCode >= 500) {
    return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.';
  }

  // ── Bước 4: Validation errors từ BE ─────────────────────────────────────
  if (validationErrors.length > 0) {
    const firstErr = validationErrors[0];
    if (firstErr && typeof firstErr === 'object') {
      const errMsg =
        (firstErr as any).error ||
        (firstErr as any).message ||
        (firstErr as any).msg ||
        '';
      if (typeof errMsg === 'string' && isSafeUserMessage(errMsg)) {
        return errMsg;
      }
    }
  }

  // ── Bước 5: Ưu tiên message tiếng Việt an toàn từ BE ──────────────────────
  // Ví dụ: BE trả về { statusCode: 401, message: "Tên đăng nhập hoặc mật khẩu không đúng" }
  if (rawMessage && isSafeUserMessage(rawMessage)) {
    return rawMessage;
  }

  // ── Bước 6: Phân loại theo HTTP status code khi BE KHÔNG trả message rõ ràng ─
  if (statusCode === 401) {
    if (isLogin) {
      return 'Tên đăng nhập hoặc mật khẩu không đúng.';
    }
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (statusCode === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }

  if (statusCode === 404) {
    return 'Không tìm thấy dữ liệu yêu cầu.';
  }

  if (statusCode && statusCode >= 400 && statusCode < 500) {
    if (isLogin) {
      return 'Đăng nhập không thành công. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.';
    }
    return fallback;
  }

  return fallback;
}

/** Kiểm tra xem normalized message có phải là chuỗi kỹ thuật không */
function isTechnicalMessage(normalized: string): boolean {
  const technicalKeywords = [
    'is not a function',
    'cannot read',
    'undefined',
    'axioserror',
    'request failed',
    'status code',
    'internal server error',
    'econnrefused',
    'socket',
    'exception',
  ];
  return technicalKeywords.some((kw) => normalized.includes(kw));
}
