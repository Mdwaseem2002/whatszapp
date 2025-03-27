//src\app\api\messages\route.ts
import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import MessageModel from '@/models/Message';
import { Message, MessageStatus } from '@/types';

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing phone number' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'object') {
      return NextResponse.json(
        { error: 'Invalid or missing message' },
        { status: 400 }
      );
    }

    // Prepare message data
    const messageData: Partial<Message> = {
      // Use a combination of timestamp and original ID for uniqueness
      id: `${Date.now()}_${message.id || 'generated'}`,
      content: message.text?.body || message.content || '',
      timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date(),
      sender: message.from === 'user' ? 'user' : 'contact',
      status: message.status || MessageStatus.DELIVERED,
      recipientId: phoneNumber,
      contactPhoneNumber: phoneNumber,
      originalId: message.id,
      conversationId: phoneNumber // Explicitly set as string
    };

    try {
      // Create and save new message
      const newMessage = new MessageModel(messageData);
      const savedMessage = await newMessage.save();

      // Send response for webhook
      return NextResponse.json({ 
        success: true, 
        message: savedMessage 
      });

    } catch (saveError: any) {
      // Handle duplicate key errors
      if (saveError.code === 11000) {
        return NextResponse.json(
          { error: 'Duplicate message', success: false },
          { status: 409 }
        );
      }

      console.error('Message Save Error:', saveError);
      return NextResponse.json(
        { 
          error: 'Error saving message', 
          success: false, 
          details: saveError.message,
          validationErrors: saveError.errors 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Message Storage Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const conversationId = searchParams.get('conversationId') || phoneNumber;
    const afterTimestamp = searchParams.get('afterTimestamp');

    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { error: 'Valid conversation ID or phone number is required' },
        { status: 400 }
      );
    }

    // Build query with optional timestamp filter
    const query: any = { conversationId };
    if (afterTimestamp) {
      query.timestamp = { $gt: new Date(afterTimestamp) };
    }

    // Retrieve messages for the specific conversation, sorted by timestamp
    const messages = await MessageModel.find(query).sort({ timestamp: 1 });

    return NextResponse.json({ 
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}