import { NextResponse } from 'next/server';
import { Message, MessageStatus } from '@/types';

class MessageManager {
  private static instance: MessageManager;
  private messages: Message[] = [];

  private constructor() {}

  public static getInstance(): MessageManager {
    if (!MessageManager.instance) {
      MessageManager.instance = new MessageManager();
    }
    return MessageManager.instance;
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  private ensureValidDate(timestamp: string | number | Date | undefined): Date {
    // Handle undefined case
    if (timestamp === undefined) {
      return new Date();
    }

    // Handle Unix timestamp (seconds since epoch)
    if (typeof timestamp === 'number') {
      // Check if it's in milliseconds or seconds
      return timestamp > 9999999999 ? new Date(timestamp) : new Date(timestamp * 1000);
    }
    
    // Handle string Unix timestamp
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      const num = parseInt(timestamp, 10);
      return num > 9999999999 ? new Date(num) : new Date(num * 1000);
    }
    
    // Handle ISO string or other Date-parsable format
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  public addMessage(phoneNumber: string, messageData: Partial<Message>): Message | null {
    // Ensure phoneNumber is a non-empty string
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
    const timestamp = this.ensureValidDate(messageData.timestamp);

    // Create complete message object
    const newMessage: Message = {
      id: messageData.id || Date.now().toString(),
      content: messageData.content || '',
      timestamp: timestamp.toISOString(),
      sender: messageData.sender || 'user',
      status: messageData.status || MessageStatus.DELIVERED,
      recipientId: normalizedNumber,
      contactPhoneNumber: phoneNumber,
      // Add any additional fields from messageData
      ...messageData
    };

    // Prevent duplicates with same content within 1 second
    const isDuplicate = this.messages.some(
      msg => msg.content === newMessage.content && 
             msg.contactPhoneNumber === newMessage.contactPhoneNumber &&
             Math.abs(new Date(msg.timestamp).getTime() - timestamp.getTime()) < 1000
    );

    if (!isDuplicate) {
      this.messages.push(newMessage);
      this.sortMessages();
      return newMessage;
    }

    return null;
  }

  private sortMessages(): void {
    this.messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      
      // If timestamps are equal, sort by ID to maintain consistent order
      if (timeA === timeB) {
        return a.id.localeCompare(b.id);
      }
      
      return timeA - timeB;
    });
  }

  public getMessages(phoneNumber: string): Message[] {
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
    const filtered = this.messages.filter(
      msg => {
        // Add a null/undefined check before normalization
        if (!msg.contactPhoneNumber) return false;
        return this.normalizePhoneNumber(msg.contactPhoneNumber) === normalizedNumber;
      }
    );
    
    // Create a new sorted array to ensure proper ordering
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }

  public getAllMessages(): Message[] {
    // Return a new sorted array
    return [...this.messages].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  public updateMessageStatus(messageId: string, status: MessageStatus): boolean {
    const message = this.messages.find(msg => msg.id === messageId);
    if (message) {
      message.status = status;
      return true;
    }
    return false;
  }

  public clearMessages(): void {
    this.messages = [];
  }

  public getLastMessage(phoneNumber: string): Message | null {
    const messages = this.getMessages(phoneNumber);
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }
}

// Create the singleton instance
const messageManager = MessageManager.getInstance();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    // Validate inputs with more robust type checking
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

    const newMessage = messageManager.addMessage(phoneNumber, {
      content: message.text?.body || message.content || '',
      timestamp: message.timestamp,
      sender: message.from === 'user' ? 'user' : 'contact',
      status: message.status || MessageStatus.DELIVERED
    });

    return NextResponse.json({ 
      success: !!newMessage, 
      message: newMessage 
    });
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
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    // Ensure phoneNumber is a non-empty string
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'Valid phone number is required' },
        { status: 400 }
      );
    }

    const messages = messageManager.getMessages(phoneNumber);

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { messageId, status } = body;

    // Validate inputs with more robust type checking
    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing message ID' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing status' },
        { status: 400 }
      );
    }

    const success = messageManager.updateMessageStatus(messageId, status as MessageStatus);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}