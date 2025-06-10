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
