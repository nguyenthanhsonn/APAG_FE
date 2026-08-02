import type { Admin } from '../admin/admin-user.type';
import type { Student } from '../student/student-user.type';
import type { UserRole } from './auth.type';

/** Thông tin người dùng đăng nhập. */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  email?: string;
  fullName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  managedClasses?: Array<{
    id?: string;
    classId?: string;
    code?: string;
    classCode?: string;
    name?: string;
    className?: string;
    enrollmentYear?: number;
    studentCount?: number;
    major?: {
      name?: string;
    };
    facultyName?: string;
    faculty?: {
      name?: string;
    };
  }>;
}

/** Mã xác nhận đăng nhập. */
export interface CaptchaResponse {
  captchaId: string;
  image: string;
  expiresInSeconds?: number;
  debugCode?: string;
}

/** Thông tin dùng để đăng nhập. */
export interface LoginPayload {
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
}

/** Thông tin nhận được sau khi đăng nhập. */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

/** Thông tin dùng để giữ phiên đăng nhập. */
export interface RefreshTokenPayload {
  refreshToken: string;
}

/** Thông tin phiên đăng nhập mới. */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/** Thông tin dùng để đổi mật khẩu. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Trạng thái đăng nhập trong ứng dụng. */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrateAuth: () => void;
  login: (username: string, password: string, captchaId: string, captchaCode: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Mock: set user directly without API — dev/test only */
  setUser: (user: any) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Student | Admin>) => Promise<void>;
}
