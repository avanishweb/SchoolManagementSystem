import { apiClient } from './apiClient.js';
import { LoginInput } from '@smart-school/validation';
import { AuthResponse, IUser, ISchool } from '@smart-school/shared-types';

export const authService = {
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (!response.data) {
      throw new Error('Malformed login response: missing authentication data');
    }
    apiClient.setToken(response.data.accessToken);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.setToken(null);
    }
  },

  async getMe(): Promise<{ user: IUser; school: ISchool | null }> {
    const response = await apiClient.get<{ user: IUser; school: ISchool | null }>('/auth/me');
    if (!response.data) {
      throw new Error('Failed to retrieve current user profile');
    }
    return response.data;
  },

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh');
    if (!response.data?.accessToken) {
      throw new Error('Failed to refresh authentication session');
    }
    apiClient.setToken(response.data.accessToken);
    return response.data.accessToken;
  },
};
