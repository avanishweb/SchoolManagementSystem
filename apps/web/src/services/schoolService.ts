import {
  ISchool,
  IVendorAuditLog,
  ISupportAccessSession,
  ISubscriptionInvoice,
  SchoolStatus,
  SubscriptionPlanType,
  ISchoolBranding,
  ISubscription,
} from '@smart-school/shared-types';
import {
  OnboardSchoolInput,
  UpdateSchoolBrandingInput,
  UpdateSchoolSubscriptionInput,
  ConfigureCustomDomainInput,
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
  CreateSupportAccessInput,
} from '@smart-school/validation';
import { apiClient } from './apiClient.js';

export interface SchoolListResponse {
  items: ISchool[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const schoolService = {
  /**
   * Resolves public school branding and details by domain or slug
   */
  async resolvePublic(slug?: string, host?: string): Promise<Partial<ISchool>> {
    const query = new URLSearchParams();
    if (slug) query.set('slug', slug);
    if (host) query.set('host', host);
    const endpoint = `/schools/resolve${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<Partial<ISchool>>(endpoint);
    if (!response.data) throw new Error(response.error?.message || 'School not found');
    return response.data;
  },

  async getCurrentSchool(): Promise<ISchool> {
    const response = await apiClient.get<ISchool>('/schools/current');
    if (!response.data) throw new Error(response.error?.message || 'Failed to fetch school details');
    return response.data;
  },

  async listSchools(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: SchoolStatus;
    plan?: SubscriptionPlanType;
  } = {}): Promise<SchoolListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search.trim());
    if (params.status) query.set('status', params.status);
    if (params.plan) query.set('plan', params.plan);

    const endpoint = `/schools${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<SchoolListResponse>(endpoint);
    if (!response.data) throw new Error(response.error?.message || 'Failed to list schools');
    return response.data;
  },

  async getSchoolById(id: string): Promise<ISchool> {
    const response = await apiClient.get<ISchool>(`/schools/${id}`);
    if (!response.data) throw new Error(response.error?.message || 'School not found');
    return response.data;
  },

  async onboardSchool(payload: OnboardSchoolInput): Promise<{ school: ISchool; adminUser: unknown }> {
    const response = await apiClient.post<{ school: ISchool; adminUser: unknown }>('/schools/onboard', payload);
    if (!response.data) throw new Error(response.error?.message || 'Failed to onboard school');
    return response.data;
  },

  async updateBranding(schoolId: string, payload: UpdateSchoolBrandingInput): Promise<ISchool> {
    const response = await apiClient.put<ISchool>(`/schools/${schoolId}/branding`, payload);
    if (!response.data) throw new Error(response.error?.message || 'Failed to update branding');
    return response.data;
  },

  async updateSubscription(schoolId: string, payload: UpdateSchoolSubscriptionInput): Promise<ISchool> {
    const response = await apiClient.put<ISchool>(`/schools/${schoolId}/subscription`, payload);
    if (!response.data) throw new Error(response.error?.message || 'Failed to update subscription');
    return response.data;
  },

  async configureDomain(schoolId: string, payload: ConfigureCustomDomainInput): Promise<ISchool> {
    const response = await apiClient.post<ISchool>(`/schools/${schoolId}/domain`, payload);
    if (!response.data) throw new Error(response.error?.message || 'Failed to configure domain');
    return response.data;
  },

  async verifyDomain(schoolId: string): Promise<{ school: ISchool; result: { verified: boolean; errorMessage?: string } }> {
    const response = await apiClient.post<{ school: ISchool; result: { verified: boolean; errorMessage?: string } }>(
      `/schools/${schoolId}/domain/verify`,
      {}
    );
    if (!response.data) throw new Error(response.error?.message || 'Failed to verify domain');
    return response.data;
  },

  async removeDomain(schoolId: string): Promise<ISchool> {
    const response = await apiClient.delete<ISchool>(`/schools/${schoolId}/domain`);
    if (!response.data) throw new Error(response.error?.message || 'Failed to remove domain');
    return response.data;
  },

  async updateStatus(schoolId: string, status: SchoolStatus, reason?: string): Promise<ISchool> {
    const response = await apiClient.patch<ISchool>(`/schools/${schoolId}/status`, { status, reason });
    if (!response.data) throw new Error(response.error?.message || 'Failed to update school status');
    return response.data;
  },

  async listAuditLogs(params: { schoolId?: string; page?: number; limit?: number } = {}): Promise<{
    items: IVendorAuditLog[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params.schoolId) query.set('schoolId', params.schoolId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const endpoint = `/schools/audit-logs${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<{
      items: IVendorAuditLog[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(endpoint);
    if (!response.data) throw new Error(response.error?.message || 'Failed to fetch audit logs');
    return response.data;
  },

  async createSupportSession(schoolId: string, payload: CreateSupportAccessInput): Promise<ISupportAccessSession> {
    const response = await apiClient.post<ISupportAccessSession>(`/schools/${schoolId}/support-access`, payload);
    if (!response.data) throw new Error(response.error?.message || 'Failed to create support session');
    return response.data;
  },

  async revokeSupportSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/schools/support-access/${sessionId}`);
  },

  async listSupportSessions(schoolId: string): Promise<ISupportAccessSession[]> {
    const response = await apiClient.get<ISupportAccessSession[]>(`/schools/${schoolId}/support-sessions`);
    if (!response.data) throw new Error(response.error?.message || 'Failed to fetch support sessions');
    return response.data;
  },

  async createInvoice(schoolId: string, payload: CreateInvoiceInput): Promise<ISubscriptionInvoice> {
    const response = await apiClient.post<ISubscriptionInvoice>(`/schools/${schoolId}/invoices`, payload);
    if (!response.data) throw new Error(response.error?.message || 'Failed to create invoice');
    return response.data;
  },

  async updateInvoiceStatus(invoiceId: string, payload: UpdateInvoiceStatusInput): Promise<ISubscriptionInvoice> {
    const response = await apiClient.patch<ISubscriptionInvoice>(`/schools/invoices/${invoiceId}`, payload);
    if (!response.data) throw new Error(response.error?.message || 'Failed to update invoice');
    return response.data;
  },

  async listInvoices(schoolId?: string): Promise<{
    items: ISubscriptionInvoice[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const endpoint = schoolId ? `/schools/${schoolId}/invoices` : `/schools/invoices`;
    const response = await apiClient.get<{
      items: ISubscriptionInvoice[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(endpoint);
    if (!response.data) throw new Error(response.error?.message || 'Failed to list invoices');
    return response.data;
  },
};
