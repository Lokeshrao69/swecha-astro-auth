// src/pages/api/auth/send-otp.js
// API endpoint for sending OTP to the user's phone number

export async function POST({ request }) {
  try {
    // Parse request body
    const data = await request.json();
    const { phone, action } = data;
    
    // Validate request data
    if (!phone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Phone number is required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid phone number format. Please enter 10 digits.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Determine if this is sign-in or sign-up
    const isSignUp = action === 'signup';
    
    // Prepare the payload for the external API
    const apiPayload = {
      phone: phone,
      action: action || 'signin'
    };
    
    // Make API call to the external Swecha backend
    const externalApiUrl = 'https://backend2.swecha.org/api/v1/auth/send-otp';
    
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
      // Return success response with session token from external API
      return new Response(
        JSON.stringify({
          success: true,
          message: externalData.message || 'OTP sent successfully',
          sessionToken: externalData.sessionToken || externalData.token || `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
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
          message: externalData.message || 'Failed to send OTP. Please try again.'
        }),
        {
          status: externalResponse.status || 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    
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