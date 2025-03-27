//src\app\api\messages\route.ts
import { NextResponse } from 'next/server';
import { Message, MessageStatus } from '@/types';

class MessageManager {
  private static instance: MessageManager;
  private messages: Message[] = [];
  private persistentMessages: { [phoneNumber: string]: Message[] } = {};

  private constructor() {
    // Load persistent messages from local storage on initialization
    this.loadPersistentMessages();
  }

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
    // Existing date validation logic remains the same
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

  private loadPersistentMessages(): void {
    if (typeof window !== 'undefined') {
      const storedMessages = localStorage.getItem('persistentMessages');
      if (storedMessages) {
        try {
          this.persistentMessages = JSON.parse(storedMessages);
        } catch (error) {
          console.error('Error loading persistent messages:', error);
        }
      }
    }
  }

  private savePersistentMessages(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('persistentMessages', JSON.stringify(this.persistentMessages));
    }
  }

  public addMessage(phoneNumber: string, messageData: Partial<Message>): Message | null {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

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

    // Check for duplicates within 1 second
    const isDuplicate = this.messages.some(
      msg => msg.content === newMessage.content && 
             msg.contactPhoneNumber === newMessage.contactPhoneNumber &&
             Math.abs(new Date(msg.timestamp).getTime() - timestamp.getTime()) < 1000
    );

    if (!isDuplicate) {
      // Add to current messages
      this.messages.push(newMessage);
      this.sortMessages();

      // Add to persistent messages for the specific phone number
      if (!this.persistentMessages[normalizedNumber]) {
        this.persistentMessages[normalizedNumber] = [];
      }
      this.persistentMessages[normalizedNumber].push(newMessage);
      
      // Save to local storage
      this.savePersistentMessages();

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
    
    // Retrieve messages from persistent storage for the phone number
    const persistentMessages = this.persistentMessages[normalizedNumber] || [];
    
    // Sort and return persistent messages
    return [...persistentMessages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }

  public getAllMessages(): Message[] {
    // Compile messages from all phone numbers
    const allMessages = Object.values(this.persistentMessages)
      .flat()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return allMessages;
  }

  public updateMessageStatus(messageId: string, status: MessageStatus): boolean {
    let updated = false;

    // Update in persistent messages across all phone numbers
    Object.keys(this.persistentMessages).forEach(phoneNumber => {
      const messages = this.persistentMessages[phoneNumber];
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex !== -1) {
        messages[messageIndex].status = status;
        updated = true;
      }
    });

    // Save updated messages
    if (updated) {
      this.savePersistentMessages();
    }

    return updated;
  }

  public clearMessages(): void {
    this.messages = [];
    this.persistentMessages = {};
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('persistentMessages');
    }
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