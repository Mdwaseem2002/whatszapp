// src/app/api/webhook/route.ts

import { getWhatsAppService } from '@/services/whatsappService';

// GET route for webhook verification
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get the query parameters
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
    
    // Log verification attempt for debugging
    console.log(`Verification attempt with: { mode: ${mode}, token: ${token}, challenge: ${challenge} }`);
    
    // Verify token from environment variable with fallback
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'Pentacloud@123';
    
    // Check if mode and token are in the query string
    if (mode === 'subscribe' && token === verifyToken && challenge) {
      console.log('Webhook verified successfully');
      // Important: Return the challenge value as plain text
      return new Response(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    } else {
      console.error('Webhook verification failed', { 
        expectedToken: verifyToken, 
        receivedToken: token, 
        mode 
      });
      
      // Return success with instructions even when verification parameters aren't present
      // This will make your endpoint always return 200 to browser access
      if (!mode || !token || !challenge) {
        return new Response(
          'WhatsApp webhook endpoint is active. For Meta verification, ensure the following:\n' +
          '1. Your callback URL should be exactly: ' + (new URL(request.url).origin + '/api/webhook') + '\n' +
          '2. Your verify token should be: ' + verifyToken + '\n' +
          '3. Make sure you\'re using HTTPS in production',
          { 
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          }
        );
      }
      
      return new Response('Verification failed', { status: 403 });
    }
  } catch (error) {
    console.error('Error during webhook verification:', error);
    return new Response('Server error during verification', { status: 500 });
  }
}

// POST route for receiving messages
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    let data;
    
    // Handle different content types that Meta might send
    if (contentType && contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // Handle form data or other formats if necessary
      const text = await request.text();
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Failed to parse webhook payload:', text);
        return new Response('Invalid payload format', { status: 400 });
      }
    }
    
    console.log('Received webhook data:', JSON.stringify(data));
    
    // Process incoming messages
    if (data && data.object === 'whatsapp_business_account') {
      // Get WhatsApp service instance
      const accessToken = process.env.WHATSAPP_TOKEN || '';
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
      
      if (!accessToken || !phoneNumberId) {
        console.error('Missing WhatsApp API credentials');
        // Still return success to avoid Meta retries
        return new Response('Missing API credentials', { status: 200 });
      }
      
      const whatsappService = getWhatsAppService(accessToken, phoneNumberId);
      
      // Loop through each entry
      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value || {};
            
            // Process incoming messages
            if (value.messages && Array.isArray(value.messages) && value.messages.length > 0) {
              for (const message of value.messages) {
                const from = message.from;
                
                // Mark message as read to provide good user experience
                try {
                  await whatsappService.markMessageAsRead(message.id);
                  console.log(`Marked message ${message.id} as read`);
                } catch (err) {
                  console.error(`Failed to mark message as read: ${err}`);
                }
                
                // Handle different message types
                if (message.type === 'text' && message.text) {
                  const text = message.text.body;
                  console.log(`Received message from ${from}: ${text}`);
                  
                  // Process the received message and send reply
                  await processIncomingMessage(whatsappService, from, text);
                } else if (message.type === 'image' && message.image) {
                  console.log(`Received image from ${from}, media ID: ${message.image.id}`);
                  await whatsappService.sendTextMessage(from, 'Thanks for the image! Our team will review it.');
                } else if (message.type === 'audio' && message.audio) {
                  console.log(`Received audio from ${from}, media ID: ${message.audio.id}`);
                  await whatsappService.sendTextMessage(from, 'Thanks for the audio message! Our team will listen to it.');
                } else if (message.type === 'document' && message.document) {
                  console.log(`Received document from ${from}, filename: ${message.document.filename}`);
                  await whatsappService.sendTextMessage(from, `Thanks for sending "${message.document.filename}"! Our team will review it.`);
                } else {
                  console.log(`Received message of type ${message.type} from ${from}`);
                  await whatsappService.sendTextMessage(from, 'We received your message. Our team will get back to you soon.');
                }
              }
            }
            
            // Handle message status updates
            if (value.statuses && Array.isArray(value.statuses) && value.statuses.length > 0) {
              for (const status of value.statuses) {
                const recipientId = status.recipient_id;
                const statusType = status.status; // sent, delivered, read, failed
                
                console.log(`Message ${status.id} to ${recipientId} status: ${statusType}`);
                
                // TODO: Update status in your database
                // For example: updateMessageStatusInDB(status.id, statusType);
              }
            }
          }
        }
      }
      
      // Return a 200 OK to acknowledge receipt - IMPORTANT for Meta to consider it successful
      return new Response('EVENT_RECEIVED', { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Not a WhatsApp Business Account event
    return new Response('Not a WhatsApp event', { status: 200 }); // Return 200 anyway to avoid Meta retries
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to avoid Meta retrying constantly
    return new Response('Error processing webhook', { status: 200 });
  }
}

// Process incoming messages and decide how to respond
async function processIncomingMessage(
  whatsappService: ReturnType<typeof getWhatsAppService>,
  from: string, 
  text: string
): Promise<void> {
  // Convert text to lowercase for easier matching
  const lowerText = text.toLowerCase().trim();
  
  try {
    // Basic response logic - expand as needed for your use case
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText === 'hey') {
      await whatsappService.sendTextMessage(
        from, 
        'Hello! 👋 Welcome to Pentacloud. How can we assist you today?'
      );
    } else if (lowerText.includes('help')) {
      await whatsappService.sendTextMessage(
        from,
        'I\'m here to help! You can ask about our services, pricing, or support.'
      );
    } else if (lowerText.includes('service')) {
      await whatsappService.sendTextMessage(
        from,
        'Pentacloud offers a range of services including web development, cloud solutions, and digital marketing. What specific service are you interested in?'
      );
    } else if (lowerText.includes('price') || lowerText.includes('cost')) {
      await whatsappService.sendTextMessage(
        from,
        'Our pricing varies based on project requirements. Would you like to discuss your specific needs with one of our representatives?'
      );
    } else if (lowerText.includes('contact') || lowerText.includes('speak to')) {
      await whatsappService.sendTextMessage(
        from,
        'One of our representatives will get back to you shortly. Alternatively, you can reach us at contact@pentacloud.com or call +1234567890.'
      );
    } else if (lowerText.includes('thank')) {
      await whatsappService.sendTextMessage(
        from,
        'You\'re welcome! Is there anything else we can help you with?'
      );
    } else {
      // Default response
      await whatsappService.sendTextMessage(
        from,
        'Thank you for your message. Our team will review it and get back to you soon.'
      );
    }
  } catch (error) {
    console.error(`Failed to process message from ${from}:`, error);
    // You might want to implement retry logic here or store failed messages for later processing
  }
}