//src\app\api\messages\stream\route.ts
import { NextResponse } from 'next/server';
import { Message } from '@/types';

// Simple in-memory event emitter for demonstration
const messageEmitters: Record<string, Set<(message: Message) => void>> = {};

// Internal function for broadcasting messages (not exported)
function broadcastMessageInternal(phoneNumber: string, message: Message) {
  const emitters = messageEmitters[phoneNumber];
  if (emitters) {
    emitters.forEach(emitter => emitter(message));
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get('phoneNumber');

  if (!phoneNumber) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  // Create a transform stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Create a listener for new messages
      const messageListener = (message: Message) => {
        const eventData = JSON.stringify(message);
        controller.enqueue(`data: ${eventData}\n\n`);
      };

      // Initialize emitters for this phone number if not exists
      if (!messageEmitters[phoneNumber]) {
        messageEmitters[phoneNumber] = new Set();
      }
      messageEmitters[phoneNumber].add(messageListener);

      // Cleanup function
      return () => {
        messageEmitters[phoneNumber].delete(messageListener);
      };
    }
  });

  // Return the Server-Sent Events response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-open'
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing phone number or message' },
        { status: 400 }
      );
    }

    // Broadcast the message internally
    broadcastMessageInternal(phoneNumber, message);

    return NextResponse.json({ 
      success: true, 
      message: 'Message broadcasted' 
    });
  } catch (error) {
    console.error('Message Broadcast Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}