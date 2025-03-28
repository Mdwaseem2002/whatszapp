import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import MessageModel from '@/models/Message';
import { Message, MessageStatus } from '@/types';

export async function POST(request: Request) {
  try {
    console.log('Message Storage Request Received');
    
    await connectMongoDB();

    const body = await request.json();
    console.log('Request Body:', JSON.stringify(body, null, 2));

    const { phoneNumber, message } = body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.error('Invalid phone number:', phoneNumber);
      return NextResponse.json(
        { error: 'Invalid or missing phone number' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'object') {
      console.error('Invalid message:', message);
      return NextResponse.json(
        { error: 'Invalid or missing message' },
        { status: 400 }
      );
    }

    // Enhanced logging for message data preparation
    const messageData: Partial<Message> = {
      id: `${Date.now()}_${message.id || 'generated'}`,
      content: message.text?.body || message.content || '',
      timestamp: message.timestamp
        ? new Date(Number(message.timestamp) * 1000).toISOString()
        : new Date().toISOString(),
      sender: message.from === 'user' ? 'user' : 'contact',
      status: message.status || MessageStatus.DELIVERED,
      recipientId: phoneNumber,
      contactPhoneNumber: phoneNumber,
      originalId: message.id,
      conversationId: phoneNumber,
    };

    console.log('Prepared Message Data:', JSON.stringify(messageData, null, 2));

    try {
      const newMessage = new MessageModel(messageData);
      const savedMessage = await newMessage.save();

      console.log('Message Saved Successfully:', savedMessage);

      return NextResponse.json({
        success: true,
        message: savedMessage,
      });
    } catch (saveError: unknown) {
      console.error('Full Save Error:', saveError);
      
      if (typeof saveError === 'object' && saveError !== null && 'code' in saveError) {
        const errorWithCode = saveError as { code: number };
        if (errorWithCode.code === 11000) {
          console.error('Duplicate Message Detected');
          return NextResponse.json(
            { error: 'Duplicate message', success: false },
            { status: 409 }
          );
        }
      }

      if (saveError instanceof Error) {
        console.error('Detailed Save Error:', {
          message: saveError.message,
          name: saveError.name,
          stack: saveError.stack
        });
      }

      return NextResponse.json(
        { error: 'Error saving message', success: false },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Comprehensive Message Storage Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}