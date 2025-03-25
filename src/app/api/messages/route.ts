// src/app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { Message, MessageStatus } from '@/types';

// Persistent storage mechanism (you can replace this with a database)
const storedMessages: Record<string, Message[]> = {};

export async function POST(request: Request) {
  try {
    // Log the entire request body for debugging
    const rawBody = await request.text();
    console.log('Raw Message Storage Payload:', rawBody);

    // Parse the JSON
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse message storage payload:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload', rawBody },
        { status: 400 }
      );
    }

    const { phoneNumber, message } = body;
    console.log('Parsed Message Body:', JSON.stringify(body, null, 2));

    if (!phoneNumber || !message) {
      console.error('Missing phone number or message', { phoneNumber, message });
      return NextResponse.json(
        { error: 'Missing phone number or message' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove any non-digit characters except +)
    const normalizedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    const newMessage: Message = {
      id: message.id || Date.now().toString(),
      content: message.text?.body || 'No content',
      timestamp: message.timestamp 
        ? new Date(parseInt(message.timestamp) * 1000).toISOString() 
        : new Date().toISOString(),
      sender: 'contact',
      status: MessageStatus.DELIVERED,
      recipientId: normalizedPhoneNumber,
      contactPhoneNumber: message.from || normalizedPhoneNumber
    };

    // Ensure the phone number key exists in storedMessages
    if (!storedMessages[normalizedPhoneNumber]) {
      storedMessages[normalizedPhoneNumber] = [];
    }

    // Add the new message
    storedMessages[normalizedPhoneNumber].push(newMessage);

    console.log('Message Stored Successfully:', JSON.stringify(newMessage, null, 2));
    console.log('Current Messages for Phone Number:', 
      JSON.stringify(storedMessages[normalizedPhoneNumber], null, 2)
    );

    return NextResponse.json({ 
      success: true, 
      message: newMessage,
      storedMessagesCount: storedMessages[normalizedPhoneNumber].length
    });
  } catch (error) {
    console.error('Comprehensive Message Storage Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Retrieve messages for the specific phone number
    const messages = storedMessages[normalizedPhoneNumber] || [];

    console.log(`Retrieved ${messages.length} messages for ${normalizedPhoneNumber}`);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
