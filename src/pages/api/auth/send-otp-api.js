// src/pages/api/auth/send-otp.js
// API endpoint for sending OTP to the user's phone number

export async function post({ request }) {
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
    
    // TODO: Integration with SMS service
    // This is where you would:
    // 1. Check if the phone number exists in the database (for sign-in)
    // 2. Generate a random OTP (usually 6 digits)
    // 3. Store the OTP and its expiration time in the database or cache
    // 4. Send the OTP via SMS using a service like Twilio, MSG91, etc.
    
    // For demonstration, we'll simulate the process
    const simulatedSessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Sample implementation for SMS sending service
    /*
    const otpCode = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    
    // Store in database or cache (Redis is common for this)
    await db.otpSessions.create({
      phone,
      otp: otpCode,
      sessionToken: simulatedSessionToken,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      action: isSignUp ? 'signup' : 'signin'
    });
    
    // Send SMS
    await smsService.send({
      to: phone,
      message: `Your Swecha verification code is ${otpCode}. Valid for 5 minutes.`
    });
    */
    
    // Return success response with session token
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        sessionToken: simulatedSessionToken
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to send OTP. Please try again.'
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