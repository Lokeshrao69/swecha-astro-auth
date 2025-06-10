// src/pages/api/auth/verify-otp.js
// API endpoint for verifying the OTP entered by the user

export async function POST({ request }) {
  try {
    // Parse request body
    const data = await request.json();
    const { phone, otp, sessionToken } = data;
    
    // Validate request data
    if (!phone || !otp || !sessionToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Phone number, OTP, and session token are required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Validate OTP format
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid OTP format. OTP must be 6 digits.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Prepare the payload for the external API
    const apiPayload = {
      phone: phone,
      otp: otp,
      sessionToken: sessionToken
    };
    
    // Make API call to the external Swecha backend
    const externalApiUrl = 'https://backend2.swecha.org/api/v1/auth/verify-otp';
    
    const externalResponse = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });
    
    // Parse the response from external API
    const externalData = await externalResponse.json();
    
    // Check if the external API call was successful
    if (externalResponse.ok && externalData.success) {
      // Return success response with token from external API
      return new Response(
        JSON.stringify({
          success: true,
          message: externalData.message || 'OTP verified successfully',
          token: externalData.token || externalData.authToken || `jwt_token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          user: externalData.user || {
            id: `user_${Date.now()}`,
            phone: phone
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      // Handle external API error
      return new Response(
        JSON.stringify({
          success: false,
          message: externalData.message || 'Invalid OTP or session expired'
        }),
        {
          status: externalResponse.status || 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    // Handle network errors or other exceptions
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Network error. Please check your internet connection and try again.'
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error. Please try again later.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}



