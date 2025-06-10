// src/scripts/auth.ts
import { sendOtp, verifyOtp, resendOtp } from './auth-api.ts';

// TypeScript type definitions
type AppState = {
  currentPhone: string | null;
  currentScreen: string;
  authFlow: 'signin' | 'signup' | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
};

type Screens = {
  [key: string]: HTMLElement | null;
};

type Forms = {
  [key: string]: HTMLFormElement | null;
};

type NavLinks = {
  [key: string]: HTMLElement | null;
};

// Global state
let appState: AppState = {
  currentPhone: null,
  currentScreen: 'splash',
  authFlow: null,
  sessionToken: null,
  isAuthenticated: false
};

let timer: ReturnType<typeof setTimeout> | null = null;

// DOM Elements - Include all screens
const screens: Screens = {
  splash: document.getElementById('splash-screen'),
  signin: document.getElementById('signin-screen'),
  createAccount: document.getElementById('create-account-screen'),
  otp: document.getElementById('otp-screen'),
  success: document.getElementById('success-screen'),
  dashboard: document.getElementById('dashboard-screen')
};

const forms: Forms = {
  signin: document.getElementById('signin-form') as HTMLFormElement,
  createAccount: document.getElementById('create-account-form') as HTMLFormElement,
  otp: document.getElementById('otp-form') as HTMLFormElement
};

const navLinks: NavLinks = {
  goToCreate: document.getElementById('go-to-create'),
  goToSignin: document.getElementById('go-to-signin'),
  resendOtp: document.getElementById('resend-otp'),
  backToPhone: document.getElementById('back-to-phone'),
  continueToDashboard: document.getElementById('continue-to-dashboard')
};

// Show specified screen and hide others
function showScreen(screenId: string): void {
  console.log('Showing screen:', screenId);
  
  // Hide all screens
  Object.values(screens).forEach(screen => {
    if (screen) {
      screen.classList.remove('active');
    }
  });
  
  // Show the selected screen
  if (screens[screenId]) {
    screens[screenId]?.classList.add('active');
    appState.currentScreen = screenId;
    
    // Update authentication state if showing dashboard
    if (screenId === 'dashboard') {
      appState.isAuthenticated = true;
    }
  }
}

// Form validation
function validateForm(formType: string, data: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (data.phone !== undefined) {
    const phoneRegex = /^\d{10}$/;
    if (!data.phone || !data.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(data.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
  }
  
  if (data.otp !== undefined) {
    if (!data.otp || !data.otp.trim()) {
      errors.otp = 'OTP is required';
    } else if (data.otp.length !== 6 || !/^\d+$/.test(data.otp)) {
      errors.otp = 'OTP must be 6 digits';
    }
  }
  
  return errors;
}

// Display form errors
function showFormErrors(formType: string, errors: Record<string, string>): void {
  const form = forms[formType];
  if (!form) return;
  
  const errorMessages = form.querySelectorAll('.error-message');
  errorMessages.forEach(msg => msg.remove());
  
  form.querySelectorAll('.form-control').forEach(input => {
    input.classList.remove('error');
  });
  
  Object.entries(errors).forEach(([field, message]) => {
    let inputField;
    if (formType === 'otp' && field === 'otp') {
      inputField = document.getElementById('otp-code');
    } else {
      inputField = document.getElementById(`${formType}-${field}`);
    }
    
    if (inputField) {
      inputField.classList.add('error');
      
      const errorEl = document.createElement('span');
      errorEl.className = 'error-message';
      errorEl.textContent = message;
      
      const parent = inputField.parentNode;
      if (parent) {
        parent.appendChild(errorEl);
      }
    }
  });
}

// Clear form errors
function clearFormErrors(formType: string): void {
  const form = forms[formType];
  if (!form) return;
  
  const errorMessages = form.querySelectorAll('.error-message');
  errorMessages.forEach(msg => msg.remove());
  
  form.querySelectorAll('.form-control').forEach(input => {
    input.classList.remove('error');
  });
}

// Resend timer functionality
function setResendTimer(button: HTMLElement): void {
  let counter = 20;
  button.textContent = `Wait (${counter}s)`;
  button.style.pointerEvents = 'none';

  timer = setInterval(() => {
    counter -= 1;
    button.textContent = counter > 0 ? `Wait (${counter}s)` : 'Resend';
    if (counter <= 0 && timer) {
      clearInterval(timer);
      button.style.pointerEvents = 'auto';
    }
  }, 1000);
}

// Form submission handling with your API integration
async function handleFormSubmit(formType: string, event: Event): Promise<void> {
  event.preventDefault();
  
  const form = forms[formType];
  if (!form) return;
  
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (!submitButton) return;
  
  const originalText = submitButton.textContent || 'Submit';
  
  clearFormErrors(formType);
  
  // Show loading state
  form.classList.add('loading');
  submitButton.textContent = 'Loading...';
  
  // Get form data
  const formData: Record<string, any> = {};
  if (formType === 'signin') {
    const phoneInput = document.getElementById('signin-phone') as HTMLInputElement;
    formData.phone = phoneInput?.value || '';
    formData.action = 'signin';
    appState.authFlow = 'signin';
  } else if (formType === 'createAccount') {
    const phoneInput = document.getElementById('create-phone') as HTMLInputElement;
    formData.phone = phoneInput?.value || '';
    formData.action = 'signup';
    appState.authFlow = 'signup';
  } else if (formType === 'otp') {
    const otpInput = document.getElementById('otp-code') as HTMLInputElement;
    formData.otp = otpInput?.value || '';
    formData.phone = appState.currentPhone || '';
  }
  
  // Validate form
  const errors = validateForm(formType, formData);
  
  if (Object.keys(errors).length > 0) {
    form.classList.remove('loading');
    submitButton.textContent = originalText;
    showFormErrors(formType, errors);
    return;
  }
  
  try {
    // Use your API functions
    if (formType === 'signin' || formType === 'createAccount') {
      // Call your sendOtp API
      await sendOtp(formData.phone);
      
      // Store phone for OTP verification
      appState.currentPhone = formData.phone;
      
      // Update OTP screen with phone number
      const phoneDisplay = document.getElementById('otp-phone-display');
      if (phoneDisplay) {
        phoneDisplay.textContent = `+91 ${formData.phone}`;
      }
      
      // Update OTP heading based on flow
      const otpHeading = document.getElementById('otp-heading');
      if (otpHeading) {
        otpHeading.textContent = appState.authFlow === 'signin' 
          ? 'Sign in to your account' 
          : 'Create your account';
      }
      
      showScreen('otp');
      setResendTimer(navLinks.resendOtp as HTMLElement);
      
    } else if (formType === 'otp') {
      // Call your verifyOtp API
      await verifyOtp(formData.phone || '', formData.otp || '');
      
      // Store auth state
      appState.isAuthenticated = true;
      
      // Show success screen
      showScreen('success');
    }
  } catch (error) {
    console.error('API Error:', error);
    
    // Show error based on the type
    const fieldName = formType === 'otp' ? 'otp' : 'phone';
    let errorMessage = 'An error occurred. Please try again.';
    
    if (formType === 'signin' || formType === 'createAccount') {
      errorMessage = 'Failed to send OTP';
    } else if (formType === 'otp') {
      errorMessage = 'Invalid OTP';
    }
    
    const errors: Record<string, string> = { [fieldName]: errorMessage };
    showFormErrors(formType, errors);
  } finally {
    // Reset loading state
    form.classList.remove('loading');
    submitButton.textContent = originalText;
  }
}

// Setup event listeners
function setupEventListeners(): void {
  // Form submissions
  if (forms.signin) {
    forms.signin.addEventListener('submit', (e: Event) => handleFormSubmit('signin', e));
  }
  
  if (forms.createAccount) {
    forms.createAccount.addEventListener('submit', (e: Event) => handleFormSubmit('createAccount', e));
  }
  
  if (forms.otp) {
    forms.otp.addEventListener('submit', (e: Event) => handleFormSubmit('otp', e));
  }
  
  // Navigation
  if (navLinks.goToCreate) {
    navLinks.goToCreate.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      showScreen('createAccount');
    });
  }
  
  if (navLinks.goToSignin) {
    navLinks.goToSignin.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      showScreen('signin');
    });
  }
  
  if (navLinks.resendOtp) {
    navLinks.resendOtp.addEventListener('click', async function(e: MouseEvent) {
      e.preventDefault();
      
      const resendBtn = e.target as HTMLElement;
      const originalText = resendBtn.textContent || 'Resend';
      resendBtn.textContent = 'Sending...';
      resendBtn.style.pointerEvents = 'none';
      
      try {
        // Use your resendOtp API
        await resendOtp(appState.currentPhone || '');
        
        resendBtn.textContent = 'Sent!';
        setTimeout(() => {
          setResendTimer(resendBtn);
        }, 1000);
      } catch (error) {
        console.error('Failed to resend OTP:', error);
        resendBtn.textContent = 'Failed!';
        setTimeout(() => {
          resendBtn.textContent = originalText;
          resendBtn.style.pointerEvents = 'auto';
        }, 2000);
      }
    });
  }
  
  if (navLinks.backToPhone) {
    navLinks.backToPhone.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      showScreen(appState.authFlow === 'signin' ? 'signin' : 'createAccount');
    });
  }
  
  if (navLinks.continueToDashboard) {
    navLinks.continueToDashboard.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      showScreen('dashboard');
    });
  }
  
  // Splash screen click to continue
  if (screens.splash) {
    screens.splash.addEventListener('click', () => {
      showScreen('signin');
    });
  }
}

// Input field enhancement
function enhanceInputFields(): void {
  const inputs = document.querySelectorAll('.form-control');
  
  inputs.forEach(input => {
    // Phone number formatting
    if ((input as HTMLInputElement).type === 'tel') {
      input.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        let value = target.value.replace(/[^\d]/g, '');
        
        if (value.length > 10) {
          value = value.slice(0, 10);
        }
        
        target.value = value;
      });
      
      input.addEventListener('keypress', function(this: HTMLElement, e: Event) {
        const keyEvent = e as KeyboardEvent;
        if (!/\d/.test(keyEvent.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(keyEvent.key)) {
          e.preventDefault();
        }
      });
    }
    
    // OTP field enhancements
    if (input.id === 'otp-code') {
      input.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        let value = target.value.replace(/[^\d]/g, '');
        
        if (value.length > 6) {
          value = value.slice(0, 6);
        }
        
        target.value = value;
      });
      
      input.addEventListener('keypress', function(e) {
        const event = e as unknown as KeyboardEvent;
        if (!/\d/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(event.key)) {
          e.preventDefault();
        }
      });
    }
    
    // Clear error state on input
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errorMsg = input.parentNode?.querySelector('.error-message');
      if (errorMsg) {
        errorMsg.remove();
      }
    });
  });
}

// Initialize app
function initApp(): void {
  // Show splash screen and auto-transition to signin
  showScreen('splash');
  
  setTimeout(() => {
    showScreen('signin');
  }, 2500);

  // Setup event listeners
  setupEventListeners();
  enhanceInputFields();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
