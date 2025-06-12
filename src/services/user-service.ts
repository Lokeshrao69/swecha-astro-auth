// src/services/user-service.ts
import { AuthAPI, User } from './api-service';

export interface UserState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAccount: boolean;
  currentPhone: string | null;
  currentUser: User | null;
  authFlow: 'signin' | 'signup' | null;
  sessionToken: string | null;
  error: string | null;
}

class UserService {
  private state: UserState = {
    isAuthenticated: false,
    isLoading: false,
    hasAccount: false,
    currentPhone: null,
    currentUser: null,
    authFlow: null,
    sessionToken: null,
    error: null
  };

  private listeners: Array<(state: UserState) => void> = [];

  constructor() {
    this.initFromLocalStorage();
  }

  // Initialize state from localStorage
  private initFromLocalStorage(): void {
    try {
      const authToken = localStorage.getItem('authToken');
      const userDataStr = localStorage.getItem('userData');
      
      if (authToken) {
        this.state.isAuthenticated = true;
        this.state.sessionToken = authToken;
        
        if (userDataStr) {
          this.state.currentUser = JSON.parse(userDataStr);
          this.state.hasAccount = true;
          this.state.currentPhone = this.state.currentUser?.phone || null;
        }
      }
    } catch (error) {
      console.error('Error initializing user state from localStorage:', error);
    }
  }

  // Get current state
  getState(): UserState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: (state: UserState) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify listener of current state
    listener({ ...this.state });
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of state change
  private notifyListeners(): void {
    const currentState = { ...this.state };
    this.listeners.forEach(listener => listener(currentState));
  }

  // Update state and notify listeners
  private updateState(newState: Partial<UserState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  // Check if user exists
  async checkUserExists(phone: string): Promise<boolean> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      const response = await AuthAPI.checkUserExists(phone);
      const userExists = response.exists;
      
      this.updateState({ 
        hasAccount: userExists,
        isLoading: false,
        currentPhone: phone
      });
      
      return userExists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check if user exists';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Send OTP
  async sendOTP(phone: string, flowType: 'signin' | 'signup'): Promise<void> {
    try {
      this.updateState({ 
        isLoading: true, 
        error: null,
        authFlow: flowType,
        currentPhone: phone
      });
      
      const response = await AuthAPI.sendOtp(phone);
      
      // Store session token if provided
      if (response.sessionToken) {
        this.updateState({ sessionToken: response.sessionToken });
      }
      
      this.updateState({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(phone: string, otp: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      const response = await AuthAPI.verifyOtp(phone, otp);
      
      if (response.success) {
        // Store auth token and user data
        const token = response.token;
        const user = response.user;
        
        if (token) {
          localStorage.setItem('authToken', token);
          
          this.updateState({
            isAuthenticated: true,
            sessionToken: token,
            currentUser: user || null,
            hasAccount: true
          });
          
          if (user) {
            localStorage.setItem('userData', JSON.stringify(user));
          }
        }
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
      
      this.updateState({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Login with phone and password (placeholder - needs AuthAPI implementation)
  async loginWithPassword(phone: string, password: string): Promise<void> {
    try {
      this.updateState({ 
        isLoading: true, 
        error: null,
        authFlow: 'signin',
        currentPhone: phone
      });
      
      // TODO: Implement AuthAPI.loginWithPassword method
      // For now, throw an error to indicate this feature is not implemented
      throw new Error('Password login is not yet implemented in AuthAPI');
      
      // When AuthAPI.loginWithPassword is implemented, uncomment below:
      /*
      const response = await AuthAPI.loginWithPassword(phone, password);
      
      if (response.success) {
        const token = response.token;
        const user = response.user;
        
        if (token) {
          localStorage.setItem('authToken', token);
          
          this.updateState({
            isAuthenticated: true,
            sessionToken: token,
            currentUser: user || null,
            hasAccount: true,
            isLoading: false
          });
          
          if (user) {
            localStorage.setItem('userData', JSON.stringify(user));
          }
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Create new user account
  async createUser(userData: {
    phone: string;
    name: string;
    email: string;
    gender: string;
    dob: string;
    place: string;
    password: string;
  }): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      // Check if AuthAPI.createUser supports place and password
      // For now, we'll only send the fields that exist in the current API
      const response = await AuthAPI.createUser({
        phone_number: userData.phone,
        name: userData.name,
        email: userData.email,
        gender: userData.gender,
        dob: userData.dob,
        // TODO: Add place and password when AuthAPI supports them
        // place: userData.place,
        // password: userData.password
      });
      
      if (response.success) {
        this.updateState({
          hasAccount: true,
          currentUser: response.user || null
        });
        
        // Save temp user data (excluding password for security)
        const tempUserData = {
          phone: userData.phone,
          name: userData.name,
          email: userData.email,
          gender: userData.gender,
          dob: userData.dob,
          place: userData.place
        };
        localStorage.setItem('tempUserData', JSON.stringify(tempUserData));
      } else {
        throw new Error(response.message || 'Failed to create user');
      }
      
      this.updateState({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user account';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Update user profile (placeholder - needs AuthAPI implementation)
  async updateProfile(userData: {
    name?: string;
    email?: string;
    gender?: string;
    dob?: string;
    place?: string;
  }): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      // TODO: Implement AuthAPI.updateProfile method
      throw new Error('Profile update is not yet implemented in AuthAPI');
      
      // When AuthAPI.updateProfile is implemented, uncomment below:
      /*
      const response = await AuthAPI.updateProfile(userData);
      
      if (response.success && response.user) {
        this.updateState({
          currentUser: response.user,
          isLoading: false
        });
        
        // Update user data in localStorage
        localStorage.setItem('userData', JSON.stringify(response.user));
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Change password (placeholder - needs AuthAPI implementation)
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      // TODO: Implement AuthAPI.changePassword method
      throw new Error('Change password is not yet implemented in AuthAPI');
      
      // When AuthAPI.changePassword is implemented, uncomment below:
      /*
      const response = await AuthAPI.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        this.updateState({ isLoading: false });
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Reset password with OTP (placeholder - needs AuthAPI implementation)
  async resetPassword(phone: string, otp: string, newPassword: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      // TODO: Implement AuthAPI.resetPassword method
      throw new Error('Password reset is not yet implemented in AuthAPI');
      
      // When AuthAPI.resetPassword is implemented, uncomment below:
      /*
      const response = await AuthAPI.resetPassword(phone, otp, newPassword);
      
      if (response.success) {
        this.updateState({ isLoading: false });
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Send password reset OTP (placeholder - needs AuthAPI implementation)
  async sendPasswordResetOTP(phone: string): Promise<void> {
    try {
      this.updateState({ 
        isLoading: true, 
        error: null,
        currentPhone: phone
      });
      
      // TODO: Implement AuthAPI.sendPasswordResetOtp method
      throw new Error('Password reset OTP is not yet implemented in AuthAPI');
      
      // When AuthAPI.sendPasswordResetOtp is implemented, uncomment below:
      /*
      const response = await AuthAPI.sendPasswordResetOtp(phone);
      
      if (response.sessionToken) {
        this.updateState({ sessionToken: response.sessionToken });
      }
      
      this.updateState({ isLoading: false });
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset OTP';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      // Call logout API
      await AuthAPI.logout();
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('tempUserData');
      
      // Reset state
      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        currentUser: null,
        currentPhone: null,
        sessionToken: null,
        authFlow: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
      this.updateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(): Promise<User | null> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      const response = await AuthAPI.getUserProfile();
      
      if (response.user) {
        this.updateState({
          currentUser: response.user,
          isLoading: false
        });
        
        // Update user data in localStorage
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        return response.user;
      } else {
        this.updateState({ isLoading: false });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user profile';
      this.updateState({ isLoading: false, error: errorMessage });
      return null;
    }
  }

  // Clear error state
  clearError(): void {
    this.updateState({ error: null });
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.state.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  // Get current phone
  getCurrentPhone(): string | null {
    return this.state.currentPhone;
  }
}

// Create singleton instance
const userService = new UserService();

export default userService;