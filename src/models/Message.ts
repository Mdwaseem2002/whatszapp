export interface Message {
    id: string;
    conversationId: string;
    sender: 'user' | 'system';
    phoneNumber: string;
    content: string;
    timestamp: Date;
    messageType: 'text' | 'image' | 'audio' | 'document';
    mediaUrl?: string;
    status?: 'sent' | 'delivered' | 'read' | 'failed';
  }