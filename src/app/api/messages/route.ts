import { NextRequest, NextResponse } from 'next/server';
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
      msg => this.normalizePhoneNumber(msg.contactPhoneNumber) === normalizedNumber
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

// Create a singleton instance
const messageManager = MessageManager.getInstance();

// POST Route Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing phone number or message' },
        { status: 400 }
      );
    }

    const newMessage = messageManager.addMessage(phoneNumber, {
      content: message.text?.body || message.content,
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

// GET Route Handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

// PUT Route Handler
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, status } = body;

    if (!messageId || !status) {
      return NextResponse.json(
        { error: 'Missing message ID or status' },
        { status: 400 }
      );
    }

    const success = messageManager.updateMessageStatus(messageId, status);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export singleton instance for use in other parts of the application
export { messageManager };