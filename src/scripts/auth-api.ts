// src/scripts/auth-api.ts

const BASE_URL = 'https://backend2.swecha.org/api/v1/auth';

export async function sendOtp(phone_number: string) {
  const res = await fetch(`${BASE_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number }),
  });

  return res.ok ? await res.json() : Promise.reject(await res.json());
}

export async function verifyOtp(phone_number: string, otp_code: string) {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number,
      otp_code,
      has_given_consent: true,
    }),
  });

  return res.ok ? await res.json() : Promise.reject(await res.json());
}

export async function resendOtp(phone_number: string) {
  const res = await fetch(`${BASE_URL}/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number }),
  });

  return res.ok ? await res.json() : Promise.reject(await res.json());
}

export async function createUser(userData) {
  try {
    const response = await fetch('https://backend2.swecha.org/api/v1/users/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (response.status === 201) {
      const newUser = await response.json();
      console.log('User created successfully:', newUser);
      return newUser;
    } else if (response.status === 422) {
      const errorData = await response.json();
      console.error('Validation error:', errorData.detail);
      throw new Error('Validation failed');
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// auth-api.ts
export async function loginUser(phone: string, password: string) {
    try {
        const response = await fetch('https://backend2.swecha.org/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phone,
                password: password
            })
        });

        if (response.status === 200) {
            const loginData = await response.json();
            console.log('Login successful:', loginData);
            
            // Store the access token
            localStorage.setItem('access_token', loginData.access_token);
            localStorage.setItem('token_type', loginData.token_type);
            
            return loginData;
        } else if (response.status === 422) {
            const errorData = await response.json();
            console.error('Validation error:', errorData.detail);
            throw new Error('Invalid phone number or password');
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

function getStoredToken(): { accessToken: string | null, tokenType: string | null } {
    return {
        accessToken: localStorage.getItem('access_token'),
        tokenType: localStorage.getItem('token_type')
    };
}
