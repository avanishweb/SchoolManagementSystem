import { IStudent, PaginatedResult, StudentQueryParams, StudentStatus } from '@smart-school/shared-types';
import { CreateStudentInput, UpdateStudentInput } from '@smart-school/validation';
import { apiClient } from './apiClient.js';

export const studentService = {
  async getStudents(params: StudentQueryParams = {}): Promise<PaginatedResult<IStudent>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search.trim());
    if (params.class) query.set('class', params.class);
    if (params.section) query.set('section', params.section);
    if (params.status) query.set('status', params.status);
    if (params.gender) query.set('gender', params.gender);
    if (params.academicSession) query.set('academicSession', params.academicSession);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/students${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<PaginatedResult<IStudent>>(endpoint);
    if (!response.data) {
      throw new Error(response.error?.message || 'No data returned from server.');
    }
    return response.data;
  },

  async getStudentById(id: string): Promise<IStudent> {
    const response = await apiClient.get<IStudent>(`/students/${id}`);
    if (!response.data) {
      throw new Error(response.error?.message || 'Student not found.');
    }
    return response.data;
  },

  async getNextAdmissionNumber(): Promise<{ admissionNumber: string }> {
    const response = await apiClient.get<{ admissionNumber: string }>('/students/next-admission-number');
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to generate admission number.');
    }
    return response.data;
  },

  async createStudent(payload: CreateStudentInput): Promise<IStudent> {
    const response = await apiClient.post<IStudent>('/students', payload);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to create student.');
    }
    return response.data;
  },

  async updateStudent(id: string, payload: UpdateStudentInput): Promise<IStudent> {
    const response = await apiClient.put<IStudent>(`/students/${id}`, payload);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to update student.');
    }
    return response.data;
  },

  async updateStudentStatus(id: string, status: StudentStatus): Promise<IStudent> {
    const response = await apiClient.patch<IStudent>(`/students/${id}/status`, { status });
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to update student status.');
    }
    return response.data;
  },

  async uploadPhoto(id: string, file: File): Promise<IStudent> {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiClient.upload<IStudent>(`/students/${id}/photo`, formData);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to upload photo.');
    }
    return response.data;
  },

  async uploadDocument(id: string, file: File, title: string, category: string): Promise<IStudent> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', title);
    formData.append('category', category);
    const response = await apiClient.upload<IStudent>(`/students/${id}/documents`, formData);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to upload document.');
    }
    return response.data;
  },

  async deleteDocument(studentId: string, documentId: string): Promise<IStudent> {
    const response = await apiClient.delete<IStudent>(`/students/${studentId}/documents/${documentId}`);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to delete document.');
    }
    return response.data;
  },
};
