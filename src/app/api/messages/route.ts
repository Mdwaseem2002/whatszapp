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
    if (timestamp === undefined) {
      return new Date();
    }

    if (typeof timestamp === 'number') {
      return timestamp > 9999999999 ? new Date(timestamp) : new Date(timestamp * 1000);
    }
    
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      const num = parseInt(timestamp, 10);
      return num > 9999999999 ? new Date(num) : new Date(num * 1000);
    }
    
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  public addMessage(phoneNumber: string, messageData: Partial<Message>): Message | null {
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
    const timestamp = this.ensureValidDate(messageData.timestamp);

    const newMessage: Message = {
      id: messageData.id || Date.now().toString(),
      content: messageData.content || '',
      timestamp: timestamp.toISOString(),
      sender: messageData.sender || 'user',
      status: messageData.status || MessageStatus.DELIVERED,
      recipientId: normalizedNumber,
      contactPhoneNumber: phoneNumber,
      ...messageData
    };

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
    
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }

  public getAllMessages(): Message[] {
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

// Instantiate the singleton outside of the route handlers
const messageManagerInstance = MessageManager.getInstance();

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

    const newMessage = messageManagerInstance.addMessage(phoneNumber, {
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

    const messages = messageManagerInstance.getMessages(phoneNumber);

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

    const success = messageManagerInstance.updateMessageStatus(messageId, status);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}