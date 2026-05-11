import api from '../lib/api';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'client';
  phone?: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async register(fullName: string, email: string, password: string, phone?: string, captchaToken?: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { fullName, email, password, phone, captchaToken });
    return data;
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me');
    return data;
  },

  async forgotPassword(email: string, captchaToken?: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email, captchaToken });
    return data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return data;
  },

  async getProviders(): Promise<{ local: boolean; google: boolean }> {
    const { data } = await api.get<{ local: boolean; google: boolean }>('/auth/providers');
    return data;
  },

  async refresh(refresh_token: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh', { refresh_token });
    return data;
  },

  async logout(refresh_token: string): Promise<void> {
    await api.post('/auth/logout', { refresh_token });
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/verify-email', { token });
    return data;
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/resend-verification', { email });
    return data;
  },
};
