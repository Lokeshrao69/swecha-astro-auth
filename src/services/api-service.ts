// src/services/api-service.ts
const BASE_URL = 'https://backend2.swecha.org/api/v1';

// Types for API responses based on actual backend schema
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  place?: string;
  is_active: boolean;
  has_given_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  phone_number: string;
  roles?: RoleRead[];
}

export interface OTPResponse {
  status: string;
  message: string;
  reference_id?: string;
}

export interface RoleRead {
  id: number;
  name: string;
  description?: string;
}

export interface RecordUploadResponse {
  uid: string;
  title: string;
  description?: string;
  media_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  status: string;
  user_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  phone: string;
  name: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  place?: string;
  password: string;
  has_given_consent: boolean;
  role_ids?: number[];
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface OTPSendRequest {
  phone_number: string;
}

export interface OTPVerifyRequest {
  phone_number: string;
  otp_code: string;
  has_given_consent?: boolean;
}

// Helper function to make authenticated requests
async function makeRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  requiresAuth: boolean = false
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add auth token if required
  if (requiresAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Enhanced Authentication API
export class AuthAPI {
  
  // Password-based login - IMPLEMENTED ✓
  static async loginWithPassword(phone: string, password: string): Promise<AuthResponse> {
    return makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
  }

  // Send OTP to phone number - IMPLEMENTED ✓
  static async sendOtp(phone_number: string): Promise<OTPResponse> {
    return makeRequest<OTPResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number })
    });
  }

  // Verify OTP - IMPLEMENTED ✓
  static async verifyOtp(phone_number: string, otp_code: string, has_given_consent: boolean = true): Promise<AuthResponse> {
    return makeRequest<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number,
        otp_code,
        has_given_consent
      })
    });
  }

  // Resend OTP - IMPLEMENTED ✓
  static async resendOtp(phone_number: string): Promise<OTPResponse> {
    return makeRequest<OTPResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number })
    });
  }

  // Get current user info - IMPLEMENTED ✓
  static async getCurrentUser(): Promise<User> {
    return makeRequest<User>('/auth/me', {
      method: 'GET'
    }, true);
  }

  // Change password - IMPLEMENTED ✓
  static async changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    return makeRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password,
        new_password
      })
    }, true);
  }

  // Reset password - IMPLEMENTED ✓
  static async resetPassword(phone: string, new_password: string): Promise<{ message: string }> {
    return makeRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        new_password
      })
    }, true);
  }

  // Refresh token - IMPLEMENTED ✓
  static async refreshToken(): Promise<{ access_token: string; token_type: string }> {
    return makeRequest<{ access_token: string; token_type: string }>('/auth/refresh', {
      method: 'POST'
    }, true);
  }
}

// Enhanced User Management API
export class UserAPI {
  
  // Create new user with password and location - IMPLEMENTED ✓
  static async createUser(userData: UserCreateRequest): Promise<User> {
    return makeRequest<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Get user by phone number - IMPLEMENTED ✓
  static async getUserByPhone(phone: string): Promise<User> {
    return makeRequest<User>(`/users/phone/${phone}`, {
      method: 'GET'
    });
  }

  // Check if user exists by phone
  static async checkUserExists(phone: string): Promise<boolean> {
    try {
      await this.getUserByPhone(phone);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Update user profile - IMPLEMENTED ✓
  static async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return makeRequest<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }, true);
  }

  // Get user by ID - IMPLEMENTED ✓
  static async getUserById(userId: string): Promise<User> {
    return makeRequest<User>(`/users/${userId}`, {
      method: 'GET'
    }, true);
  }

  // Get user with roles - IMPLEMENTED ✓
  static async getUserWithRoles(userId: string): Promise<User & { roles: RoleRead[] }> {
    return makeRequest<User & { roles: RoleRead[] }>(`/users/${userId}/with-roles`, {
      method: 'GET'
    }, true);
  }
}

// Enhanced Records/Media Upload API
export class RecordsAPI {
  
  // Upload file (audio, video, image) - IMPLEMENTED ✓
  static async uploadFile(
    file: File,
    metadata: {
      title: string;
      description?: string;
      category_id: string;
      user_id: string;
      media_type: 'audio' | 'video' | 'image' | 'text';
      latitude?: number;
      longitude?: number;
      use_uid_filename?: boolean;
    }
  ): Promise<RecordUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('category_id', metadata.category_id);
    formData.append('user_id', metadata.user_id);
    formData.append('media_type', metadata.media_type);
    
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    
    if (metadata.latitude !== undefined) {
      formData.append('latitude', metadata.latitude.toString());
    }
    
    if (metadata.longitude !== undefined) {
      formData.append('longitude', metadata.longitude.toString());
    }
    
    if (metadata.use_uid_filename !== undefined) {
      formData.append('use_uid_filename', metadata.use_uid_filename.toString());
    }

    return makeRequest<RecordUploadResponse>('/records/upload', {
      method: 'POST',
      body: formData
    }, true);
  }

  // Create text record - IMPLEMENTED ✓
  static async createTextRecord(
    recordData: {
      title: string;
      description?: string;
      category_id: string;
      user_id: string;
      media_type: 'text';
      status?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<RecordUploadResponse> {
    const payload = {
      ...recordData,
      media_type: 'text' as const
    };

    return makeRequest<RecordUploadResponse>('/records/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true);
  }

  // Get user's records - IMPLEMENTED ✓
  static async getUserRecords(params?: {
    category_id?: string;
    user_id?: string;
    media_type?: 'text' | 'audio' | 'video' | 'image';
    skip?: number;
    limit?: number;
  }): Promise<RecordUploadResponse[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.category_id) searchParams.append('category_id', params.category_id);
    if (params?.user_id) searchParams.append('user_id', params.user_id);
    if (params?.media_type) searchParams.append('media_type', params.media_type);
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/records${queryString ? '?' + queryString : ''}`;

    return makeRequest<RecordUploadResponse[]>(endpoint, {
      method: 'GET'
    }, true);
  }

  // Get record by ID - IMPLEMENTED ✓
  static async getRecordById(recordId: string): Promise<RecordUploadResponse> {
    return makeRequest<RecordUploadResponse>(`/records/${recordId}`, {
      method: 'GET'
    }, true);
  }

  // Update record - IMPLEMENTED ✓
  static async updateRecord(recordId: string, updateData: Partial<RecordUploadResponse>): Promise<RecordUploadResponse> {
    return makeRequest<RecordUploadResponse>(`/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }, true);
  }

  // Delete record - IMPLEMENTED ✓
  static async deleteRecord(recordId: string): Promise<{ message: string }> {
    return makeRequest<{ message: string }>(`/records/${recordId}`, {
      method: 'DELETE'
    }, true);
  }

  // Search records nearby - IMPLEMENTED ✓
  static async searchRecordsNearby(params: {
    latitude: number;
    longitude: number;
    distance_meters: number;
    category_id?: string;
    media_type?: 'text' | 'audio' | 'video' | 'image';
    skip?: number;
    limit?: number;
  }): Promise<RecordUploadResponse[]> {
    const searchParams = new URLSearchParams();
    
    searchParams.append('latitude', params.latitude.toString());
    searchParams.append('longitude', params.longitude.toString());
    searchParams.append('distance_meters', params.distance_meters.toString());
    
    if (params.category_id) searchParams.append('category_id', params.category_id);
    if (params.media_type) searchParams.append('media_type', params.media_type);
    if (params.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());

    return makeRequest<RecordUploadResponse[]>(`/records/search/nearby?${searchParams.toString()}`, {
      method: 'GET'
    }, true);
  }
}

// Categories API
export class CategoriesAPI {
  
  // Get all categories - IMPLEMENTED ✓
  static async getCategories(): Promise<Array<{
    id: string;
    name: string;
    title: string;
    description?: string;
    published: boolean;
    rank: number;
    created_at?: string;
    updated_at?: string;
  }>> {
    return makeRequest('/categories/', {
      method: 'GET'
    }, true);
  }

  // Get category by ID - IMPLEMENTED ✓
  static async getCategoryById(categoryId: string): Promise<{
    id: string;
    name: string;
    title: string;
    description?: string;
    published: boolean;
    rank: number;
    created_at?: string;
    updated_at?: string;
  }> {
    return makeRequest(`/categories/${categoryId}`, {
      method: 'GET'
    }, true);
  }
}

// Tasks API for processing
export class TasksAPI {
  
  // Start audio processing - IMPLEMENTED ✓
  static async startAudioProcessing(recordId: number): Promise<{
    task_id: string;
    task_name: string;
    status: string;
    message: string;
  }> {
    return makeRequest(`/tasks/process-audio/${recordId}`, {
      method: 'POST'
    }, true);
  }

  // Start content analysis - IMPLEMENTED ✓
  static async startContentAnalysis(recordId: number): Promise<{
    task_id: string;
    task_name: string;
    status: string;
    message: string;
  }> {
    return makeRequest(`/tasks/analyze-content/${recordId}`, {
      method: 'POST'
    }, true);
  }

  // Get task status - IMPLEMENTED ✓
  static async getTaskStatus(taskId: string): Promise<{
    task_id: string;
    status: string;
    result?: any;
    traceback?: string;
    progress?: any;
  }> {
    return makeRequest(`/tasks/status/${taskId}`, {
      method: 'GET'
    }, true);
  }
}

// Utility functions
export class APIUtils {
  
  // Get user statistics
  static async getUserStats(): Promise<{
    total_recordings: number;
    total_duration: number;
    recordings_by_type: Record<string, number>;
    recordings_by_topic: Record<string, number>;
    credit_score: number;
  }> {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const records = await RecordsAPI.getUserRecords({ user_id: userId });
      
      // Calculate statistics from records
      const stats = {
        total_recordings: records.length,
        total_duration: 0, // This would need to be calculated from file metadata
        recordings_by_type: {} as Record<string, number>,
        recordings_by_topic: {} as Record<string, number>,
        credit_score: records.length * 10 // Simple credit scoring
      };

      records.forEach(record => {
        // Count by media type
        stats.recordings_by_type[record.media_type] = 
          (stats.recordings_by_type[record.media_type] || 0) + 1;
        
        // Count by category (would need category name mapping)
        stats.recordings_by_topic[record.category_id] = 
          (stats.recordings_by_topic[record.category_id] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        total_recordings: 0,
        total_duration: 0,
        recordings_by_type: {},
        recordings_by_topic: {},
        credit_score: 0
      };
    }
  }

  // Check authentication status
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    return !!(token && userId);
  }

  // Clear authentication data
  static clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
  }

  // Set authentication data
  static setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('authToken', authResponse.access_token);
    localStorage.setItem('userId', authResponse.user_id);
  }
}

// Export all APIs
export default {
  Auth: AuthAPI,
  User: UserAPI,
  Records: RecordsAPI,
  Categories: CategoriesAPI,
  Tasks: TasksAPI,
  Utils: APIUtils
};
