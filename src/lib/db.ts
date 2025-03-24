import { Message } from '@/models/Message';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo purposes
// Replace with your actual database implementation (MongoDB, PostgreSQL, etc.)
let messages: Message[] = [];

export async function storeMessage(message: Omit<Message, 'id'>): Promise<Message> {
  const newMessage: Message = {
    ...message,
    id: uuidv4()
  };
  
  messages.push(newMessage);
  console.log(`Stored message: ${newMessage.id}`);
  
  return newMessage;
}

export async function getMessagesForConversation(conversationId: string): Promise<Message[]> {
  return messages
    .filter(message => message.conversationId === conversationId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export async function getConversations(): Promise<{phoneNumber: string, lastMessage: string, timestamp: Date}[]> {
  // Group by conversation and get the latest message
  const conversationMap = new Map<string, {phoneNumber: string, lastMessage: string, timestamp: Date}>();
  
  messages.forEach(message => {
    const current = conversationMap.get(message.phoneNumber);
    if (!current || message.timestamp > current.timestamp) {
      conversationMap.set(message.phoneNumber, {
        phoneNumber: message.phoneNumber,
        lastMessage: message.content,
        timestamp: message.timestamp
      });
    }
  });
  
  return Array.from(conversationMap.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateConversationId(phoneNumber: string): string {
  return `conv_${phoneNumber}`;
}

export async function updateMessageStatus(messageId: string, status: Message['status']): Promise<void> {
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex !== -1) {
    messages[messageIndex] = {
      ...messages[messageIndex],
      status
    };
  }
}
