import { MessageStatus } from '@prisma/client';

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status: MessageStatus;
  recipientId: string;
  contactPhoneNumber: string;
  [key: string]: unknown;
}

export class MessageManager {
  private messages: Message[] = [];

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