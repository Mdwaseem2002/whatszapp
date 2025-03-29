// src/app/api/messages/route.ts
import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import MessageModel from '@/models/Message';
import { Message, MessageStatus } from '@/types';

// Added timeout handling for serverless functions
const TIMEOUT = 9000; // 9 seconds (Vercel has a 10s limit for hobby plans)

// Helper function to create a timeout promise
const createTimeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
};

export async function POST(request: Request) {
  try {
    // Connect to MongoDB with timeout protection
    const dbPromise = connectMongoDB();
    await Promise.race([dbPromise, createTimeout(TIMEOUT)]);

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

    try {
      // Create and save new message with timeout protection
      const newMessage = new MessageModel(messageData);
      const savePromise = newMessage.save();
      const savedMessage = await Promise.race([savePromise, createTimeout(TIMEOUT)]);

      // Send response for webhook
      return NextResponse.json({
        success: true,
        message: savedMessage,
      });
    } catch (saveError: unknown) {
      if (typeof saveError === 'object' && saveError !== null && 'code' in saveError) {
        const errorWithCode = saveError as { code: number };
        if (errorWithCode.code === 11000) {
          return NextResponse.json(
            { error: 'Duplicate message', success: false },
            { status: 409 }
          );
        }
      }

      console.error('Message Save Error:', saveError);
      return NextResponse.json(
        {
          error: 'Error saving message',
          success: false,
          details: saveError instanceof Error ? saveError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Message Storage Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Connect to MongoDB with timeout protection
    const dbPromise = connectMongoDB();
    await Promise.race([dbPromise, createTimeout(TIMEOUT)]);

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
    const query: Record<string, unknown> = { conversationId };
    if (afterTimestamp) {
      query.timestamp = { $gt: new Date(afterTimestamp).toISOString() };
    }

    // Retrieve messages with timeout protection
    const findPromise = MessageModel.find(query).sort({ timestamp: 1 }).lean();
    const messages = await Promise.race([findPromise, createTimeout(TIMEOUT)]);

    return NextResponse.json({
      success: true,
      messages,
      count: Array.isArray(messages) ? messages.length : 0,
    });
  } catch (error: unknown) {
    console.error('Error retrieving messages:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}