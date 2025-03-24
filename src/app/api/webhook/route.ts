import { getWhatsAppService } from '@/services/whatsappService';

// Load environment variables
const accessToken = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'Pentacloud@123';

if (!accessToken || !phoneNumberId) {
  console.error('❌ ERROR: Missing WhatsApp API credentials.');
}

// GET route for webhook verification
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log(`🔍 Verification attempt: { mode: ${mode}, token: ${token}, challenge: ${challenge} }`);

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      console.log('✅ Webhook verified successfully');
      return new Response(challenge, { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }

    console.error('❌ Webhook verification failed');
    return new Response('Verification failed', { status: 403 });
  } catch (error) {
    console.error('⚠️ Error during webhook verification:', error);
    return new Response('Server error during verification', { status: 500 });
  }
}

// POST route for receiving messages
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('📩 Received webhook data:', JSON.stringify(data, null, 2));

    if (data.object === 'whatsapp_business_account') {
      if (!accessToken || !phoneNumberId) {
        console.error('❌ Missing WhatsApp API credentials.');
        return new Response('Missing API credentials', { status: 200 });
      }

      const whatsappService = getWhatsAppService(accessToken, phoneNumberId);

      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value || {};

            if (value.messages && Array.isArray(value.messages)) {
              for (const message of value.messages) {
                const from = message.from;

                try {
                  await whatsappService.markMessageAsRead(message.id);
                  console.log(`✅ Marked message ${message.id} as read`);
                } catch (err) {
                  console.error(`⚠️ Failed to mark message as read: ${err}`);
                }

                if (message.type === 'text' && message.text) {
                  const text = message.text.body;
                  console.log(`📨 Received text from ${from}: ${text}`);
                  await processIncomingMessage(whatsappService, from, text);
                } else {
                  console.log(`📨 Received message of type ${message.type} from ${from}`);
                  await whatsappService.sendTextMessage(from, 'We received your message. Our team will get back to you soon.');
                }
              }
            }
          }
        }
      }

      return new Response('EVENT_RECEIVED', { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }

    return new Response('Not a WhatsApp event', { status: 200 });
  } catch (error) {
    console.error('⚠️ Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 200 });
  }
}

// Process incoming messages and decide how to respond
async function processIncomingMessage(
  whatsappService: ReturnType<typeof getWhatsAppService>,
  from: string, 
  text: string
): Promise<void> {
  const lowerText = text.toLowerCase().trim();

  try {
    if (lowerText.includes('hello') || lowerText.includes('hi')) {
      await whatsappService.sendTextMessage(from, 'Hello! 👋 Welcome to Pentacloud. How can we assist you today?');
    } else if (lowerText.includes('help')) {
      await whatsappService.sendTextMessage(from, 'I\'m here to help! You can ask about our services, pricing, or support.');
    } else {
      await whatsappService.sendTextMessage(from, 'Thank you for your message. Our team will get back to you soon.');
    }
  } catch (error) {
    console.error(`⚠️ Failed to process message from ${from}:`, error);
  }
}
