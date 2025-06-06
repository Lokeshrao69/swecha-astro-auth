// src/pages/api/auth/verify-otp.js
// API endpoint for verifying the OTP entered by the user

export async function post({ request }) {
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
    
    // Validate OTP format (6-digit numeric)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid OTP format. Please enter 6 digits.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // TODO: Integration with database/cache and auth system
    // This is where you would:
    // 1. Retrieve the stored OTP session using the sessionToken
    // 2. Verify that the OTP hasn't expired
    // 3. Verify that the OTP matches what was stored
    // 4. For sign-up, create a new user account if OTP is valid
    // 5. For sign-in, verify the user exists
    // 6. Generate a JWT token for authentication
    
    // For demonstration purposes, we'll validate only if OTP is '123456'
    if (otp !== '123456') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid OTP. Please try again or request a new code.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Sample implementation for actual OTP verification
    /*
    // Find the OTP session
    const otpSession = await db.otpSessions.findOne({
      where: {
        phone,
        sessionToken
      }
    });
    
    if (!otpSession) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid session. Please request a new OTP.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Check if OTP has expired
    if (new Date() > new Date(otpSession.expiresAt)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Verify OTP
    if (otpSession.otp !== otp) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid OTP. Please try again.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // If it's a sign-up flow, create a new user
    let user;
    if (otpSession.action === 'signup') {
      user = await db.users.create({
        phone,
        createdAt: new Date()
      });
    } else {
      // For sign-in, find the existing user
      user = await db.users.findOne({
        where: { phone }
      });
    }
    
    // Delete the used OTP session
    await db.otpSessions.delete({
      where: { id: otpSession.id }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    */
    
    // Simulate JWT token generation
    const simulatedJwtToken = `jwt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Return success response with JWT token
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP verification successful',
        token: simulatedJwtToken,
        user: {
          id: `user_${Math.random().toString(36).substring(2, 10)}`,
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
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to verify OTP. Please try again.'
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