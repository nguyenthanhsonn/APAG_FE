import { create } from 'zustand';
import type { AuthState } from '../types';

import { API_Auth } from '../api/API_Auth';
import type { Student, Admin } from '../types';

function normalizeProfile(profile: any) {
  const student = profile?.student;
  const classInfo = student?.class;
  const major = student?.major;
  const faculty = student?.faculty;

  return {
    ...profile,
    studentCode: profile?.studentCode ?? student?.studentCode,
    enrolledAt: profile?.enrolledAt ?? student?.enrolledAt,
    class: profile?.class ?? classInfo,
    className: profile?.className ?? classInfo?.name,
    major: profile?.major ?? major,
    faculty: profile?.faculty ?? faculty,
    admissionYear: profile?.admissionYear ?? classInfo?.enrollmentYear,
    phoneNumber: profile?.phoneNumber ?? profile?.phone,
    managedClasses: profile?.managedClasses ?? [],
    managedFaculties: profile?.managedFaculties ?? [],
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  hydrateAuth: () => {
    if (typeof window === 'undefined') {
      set({ isHydrated: true });
      return;
    }

    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (storedUser && accessToken && refreshToken) {
      try {
        const user = JSON.parse(storedUser);
        set({ user, isAuthenticated: true, isHydrated: true });
        return;
      } catch {
        localStorage.removeItem('user');
      }
    }

    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isHydrated: true });
  },
  login: async (username: string, password: string, captchaId: string, captchaCode: string) => {
    try {
      const result = await API_Auth.login(username, password, captchaId, captchaCode);
      // Support nested "data" wrapper if any
      const data = result.data || result;
      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken;

      if (!accessToken) {
        throw new Error('Access Token không tồn tại');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      const profileRes = await API_Auth.getProfile(accessToken);
      const user = normalizeProfile(profileRes.data || profileRes);

      set({ user, isAuthenticated: true, isHydrated: true });
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      if (refreshToken) {
        await API_Auth.logout(refreshToken, accessToken || undefined);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, isAuthenticated: false, isHydrated: true });
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
  refreshProfile: async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      return;
    }

    const profileRes = await API_Auth.getProfile(accessToken);
    const refreshedProfile = normalizeProfile(profileRes.data || profileRes);

    set((state) => ({
      user: state.user ? { ...state.user, ...refreshedProfile } : refreshedProfile,
      isAuthenticated: true,
      isHydrated: true,
    }));

    const storedUser = localStorage.getItem('user');
    let parsedUser = {};
    try {
      parsedUser = storedUser ? JSON.parse(storedUser) : {};
    } catch {
      parsedUser = {};
    }
    localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...refreshedProfile }));
  },
  updateProfile: async (data: Partial<Student | Admin>) => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    try {
      const hasPhone = Object.prototype.hasOwnProperty.call(data, 'phone');
      const hasPhoneNumber = Object.prototype.hasOwnProperty.call(data, 'phoneNumber');
      const payload = {
        fullName: (data as any).fullName,
        phone: hasPhone ? (data as any).phone : hasPhoneNumber ? (data as any).phoneNumber : undefined,
        dateOfBirth: (data as any).dateOfBirth,
      };
      const updateRes = await API_Auth.updateProfile(accessToken, payload);
      const updatedProfile = normalizeProfile(updateRes.data || updateRes);

      set((state) => ({
        user: state.user ? { ...state.user, ...updatedProfile } : null,
      }));

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...updatedProfile }));
      }
    } catch (error) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },
}));
