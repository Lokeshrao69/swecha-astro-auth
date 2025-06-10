export async function POST({ request }) {
  try {
    // Parse request body
    const data = await request.json();
    const { phone, sessionToken } = data;
    
    // Validate request data
    if (!phone || !sessionToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Phone number and session token are required'
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
      sessionToken: sessionToken
    };
    
    // Make API call to the external Swecha backend
    const externalApiUrl = 'https://backend2.swecha.org/api/v1/auth/resend-otp';
    
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
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: externalData.message || 'OTP resent successfully'
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
          message: externalData.message || 'Failed to resend OTP'
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
    console.error('Error resending OTP:', error);
    
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