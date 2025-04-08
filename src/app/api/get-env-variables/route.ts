//src\app\api\get-env-variables\route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a production environment, you would implement proper authentication
    // before exposing any sensitive environment variables
    
    // Return environment variables safely
    return NextResponse.json({
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      verificationToken: process.env.WHATSAPP_VERIFY_TOKEN || 'Pentacloud@123',
    });
  } catch (error) {
    console.error('Error fetching environment variables:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}