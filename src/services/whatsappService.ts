import { Message, MessageStatus } from '@/types';

/**
 * WhatsApp API response interfaces
 */
interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

/**
 * Service for interacting with the WhatsApp Business API
 */
export class WhatsAppService {
  readonly accessToken: string;
  readonly phoneNumberId: string;
  
  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }
  
  /**
   * Send a text message to a WhatsApp recipient
   * @param to Recipient phone number with country code
   * @param text Message text content
   * @returns Promise with the API response
   */
  async sendTextMessage(to: string, text: string): Promise<WhatsAppApiResponse> {
    try {
      // Format the phone number if needed
      const formattedPhone = to.startsWith('+') ? to : `+${to}`;
      
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as WhatsAppErrorResponse;
        throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
      }
      
      return await response.json() as WhatsAppApiResponse;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
  
  /**
   * Mark a message as read in WhatsApp
   * @param messageId The ID of the message to mark as read
   * @returns Promise with the API response
   */
  async markMessageAsRead(messageId: string): Promise<WhatsAppApiResponse> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as WhatsAppErrorResponse;
        throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
      }
      
      return await response.json() as WhatsAppApiResponse;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to update local message status
   * @param messages Array of messages
   * @param messageId ID of the message to update
   * @param newStatus New status to set
   * @returns Updated messages array
   */
  static updateMessageStatus(messages: Message[], messageId: string, newStatus: MessageStatus): Message[] {
    return messages.map(message => 
      message.id === messageId 
        ? { ...message, status: newStatus } 
        : message
    );
  }
}

// Export a singleton instance for easy import
let whatsappServiceInstance: WhatsAppService | null = null;

export function getWhatsAppService(accessToken: string, phoneNumberId: string): WhatsAppService {
  if (!whatsappServiceInstance || 
      whatsappServiceInstance.accessToken !== accessToken || 
      whatsappServiceInstance.phoneNumberId !== phoneNumberId) {
    whatsappServiceInstance = new WhatsAppService(accessToken, phoneNumberId);
  }
  return whatsappServiceInstance;
}