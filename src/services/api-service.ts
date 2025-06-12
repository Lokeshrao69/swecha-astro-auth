// src/services/api-service.ts
const BASE_URL = 'https://backend2.swecha.org/api/v1';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  gender?: string;
  dob?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  sessionToken?: string;
  token?: string;
  userExists?: boolean;
  user?: User;
}

export interface MediaUploadResponse {
  success: boolean;
  message?: string;
  file_id?: string;
  file_url?: string;
  file_path?: string;
}

export interface RecordingData {
  topic: string;
  media_type: 'audio' | 'video' | 'image' | 'text';
  file_data?: Blob | File;
  text_content?: string;
  duration?: number;
  metadata?: {
    device_info?: string;
    quality?: string;
    format?: string;
  };
}

// Helper function to make authenticated requests
async function makeRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  requiresAuth: boolean = false
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

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
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Authentication API functions
export class AuthAPI {
  
  // Send OTP to phone number
  static async sendOtp(phone_number: string): Promise<AuthResponse> {
    return makeRequest<AuthResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number })
    });
  }

  // Verify OTP
  static async verifyOtp(phone_number: string, otp_code: string): Promise<AuthResponse> {
    return makeRequest<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number,
        otp_code,
        has_given_consent: true
      })
    });
  }

  // Resend OTP
  static async resendOtp(phone_number: string): Promise<AuthResponse> {
    return makeRequest<AuthResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number })
    });
  }

  // Check if user exists
  static async checkUserExists(phone_number: string): Promise<{ exists: boolean; user?: User }> {
    try {
      const response = await makeRequest<{ user: User }>(`/users/phone/${phone_number}`, {
        method: 'GET'
      });
      return { exists: true, user: response.user };
    } catch (error) {
      // If user not found, return exists: false
      return { exists: false };
    }
  }

  // Create new user account
  static async createUser(userData: {
    phone_number: string;
    name: string;
    email: string;
    gender: string;
    dob: string;
  }): Promise<AuthResponse> {
    return makeRequest<AuthResponse>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Update user profile
  static async updateUser(userId: string, userData: Partial<User>): Promise<AuthResponse> {
    return makeRequest<AuthResponse>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }, true);
  }

  // Get user profile
  static async getUserProfile(): Promise<{ user: User }> {
    return makeRequest<{ user: User }>('/auth/me', {
      method: 'GET'
    }, true);
  }

  // Logout user
  static async logout(): Promise<{ success: boolean }> {
    return makeRequest<{ success: boolean }>('/auth/logout', {
      method: 'POST'
    }, true);
  }
}

// Media Upload API functions
export class MediaAPI {
  
  // Upload audio recording
  static async uploadAudio(audioBlob: Blob, metadata: {
    topic: string;
    duration: number;
    format: string;
  }): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', audioBlob, `recording_${Date.now()}.webm`);
    formData.append('topic', metadata.topic);
    formData.append('duration', metadata.duration.toString());
    formData.append('format', metadata.format);
    formData.append('media_type', 'audio');

    return makeRequest<MediaUploadResponse>('/records/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it for FormData
    }, true);
  }

  // Upload video recording
  static async uploadVideo(videoBlob: Blob, metadata: {
    topic: string;
    duration: number;
    format: string;
  }): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', videoBlob, `video_${Date.now()}.webm`);
    formData.append('topic', metadata.topic);
    formData.append('duration', metadata.duration.toString());
    formData.append('format', metadata.format);
    formData.append('media_type', 'video');

    return makeRequest<MediaUploadResponse>('/records/upload', {
      method: 'POST',
      body: formData,
      headers: {}
    }, true);
  }

  // Upload image
  static async uploadImage(imageFile: File, metadata: {
    topic: string;
    description?: string;
  }): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('topic', metadata.topic);
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    formData.append('media_type', 'image');

    return makeRequest<MediaUploadResponse>('/records/upload', {
      method: 'POST',
      body: formData,
      headers: {}
    }, true);
  }

  // Submit text content
  static async submitText(textData: {
    topic: string;
    content: string;
    language?: string;
  }): Promise<MediaUploadResponse> {
    return makeRequest<MediaUploadResponse>('/records/', {
      method: 'POST',
      body: JSON.stringify({
        content: textData.content,
        topic: textData.topic,
        media_type: 'text',
        language: textData.language || 'te'
      })
    }, true);
  }

  // Get user's recordings
  static async getUserRecordings(params?: {
    page?: number;
    limit?: number;
    media_type?: string;
    topic?: string;
  }): Promise<{
    records: Array<{
      id: string;
      topic: string;
      media_type: string;
      file_url?: string;
      content?: string;
      created_at: string;
      duration?: number;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.media_type) searchParams.append('media_type', params.media_type);
    if (params?.topic) searchParams.append('topic', params.topic);

    const queryString = searchParams.toString();
    const endpoint = `/records/${queryString ? '?' + queryString : ''}`;

    return makeRequest(endpoint, { method: 'GET' }, true);
  }

  // Get user statistics
  static async getUserStats(): Promise<{
    total_recordings: number;
    total_duration: number; // in seconds
    recordings_by_type: Record<string, number>;
    recordings_by_topic: Record<string, number>;
    credit_score: number;
  }> {
    return makeRequest('/users/stats', { method: 'GET' }, true);
  }
}

// Export all APIs
export { BASE_URL };
export default {
  Auth: AuthAPI,
  Media: MediaAPI
};
