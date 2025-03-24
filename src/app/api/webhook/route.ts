import { NextResponse } from 'next/server';

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
      } catch (e) {
        console.error('Failed to parse webhook payload:', text);
        return new Response('Invalid payload format', { status: 400 });
      }
    }
    
    console.log('Received webhook data:', JSON.stringify(data));
    
    // Process incoming messages
    if (data && data.object === 'whatsapp_business_account') {
      // Loop through each entry
      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value || {};
            
            // Process incoming messages
            if (value.messages && Array.isArray(value.messages) && value.messages.length > 0) {
              for (const message of value.messages) {
                const from = message.from;
                const messageId = message.id;
                
                // Handle different message types
                if (message.type === 'text' && message.text) {
                  const text = message.text.body;
                  console.log(`Received message from ${from}: ${text}`);
                  
                  // TODO: Add your business logic here:
                  // 1. Store the message in your database
                  // 2. Emit an event to connected clients
                  // 3. Process the message with your business logic
                  
                  // For example, send an automatic reply
                  // await sendWhatsAppReply(from, `We received your message: ${text}`);
                } else if (message.type === 'image' && message.image) {
                  console.log(`Received image from ${from}, media ID: ${message.image.id}`);
                  // Handle image processing
                } else if (message.type === 'audio' && message.audio) {
                  console.log(`Received audio from ${from}, media ID: ${message.audio.id}`);
                  // Handle audio processing
                } else if (message.type === 'document' && message.document) {
                  console.log(`Received document from ${from}, filename: ${message.document.filename}`);
                  // Handle document processing
                } else {
                  console.log(`Received message of type ${message.type} from ${from}`);
                }
              }
            }
            
            // Handle message status updates
            if (value.statuses && Array.isArray(value.statuses) && value.statuses.length > 0) {
              for (const status of value.statuses) {
                const recipientId = status.recipient_id;
                const messageId = status.id;
                const statusType = status.status; // sent, delivered, read, failed
                
                console.log(`Message ${messageId} to ${recipientId} status: ${statusType}`);
                
                // TODO: Update status in your database
                // await updateMessageStatus(messageId, statusType);
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

// Helper function for sending replies (you'll need to implement this)
async function sendWhatsAppReply(to: string, message: string) {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('Missing WhatsApp API credentials');
      return;
    }
    
    // Example API call (you would implement this)
    /*
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: message }
        }),
      }
    );
    
    const data = await response.json();
    console.log('Message sent successfully:', data);
    */
    
    console.log(`Would send message to ${to}: ${message}`);
  } catch (error) {
    console.error('Error sending WhatsApp reply:', error);
  }
}