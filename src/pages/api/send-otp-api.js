export async function POST({ request }) {
  try {
    const data = await request.json();
    const { phone, action } = data;

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, message: 'Phone number is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid phone number format. Please enter 10 digits.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🌐 Send POST request to Swecha's external API
    const response = await fetch('https://backend2.swecha.org/api/v1/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        phone_number: phone // 🔁 Correct field name!
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, message: result.detail || 'External API failed' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message || 'OTP sent successfully',
        referenceId: result.reference_id || null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to send OTP. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
