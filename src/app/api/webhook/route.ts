// src/app/api/webhook/route.ts
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    console.log('Raw Webhook Payload:', rawBody);

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError);
      return new Response('Invalid JSON payload', { status: 400 });
    }

    console.log('Parsed Webhook Data:', JSON.stringify(data, null, 2));

    if (data && data.object === 'whatsapp_business_account') {
      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          console.log('Change Field:', change.field);
          console.log('Change Value:', JSON.stringify(change.value, null, 2));

          if (change.field === 'messages') {
            const value = change.value || {};
            
            if (value.messages && Array.isArray(value.messages)) {
              for (const message of value.messages) {
                console.log('Processing Incoming Message:', JSON.stringify(message, null, 2));

                // Handle different message types
                if (message.type === 'text' && message.text) {
                  try {
                    const storeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/messages`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        phoneNumber: message.from,
                        message: {
                          ...message,
                          content: message.text.body
                        }
                      }),
                    });

                    const storeResult = await storeResponse.json();
                    console.log('Message Storage Result:', storeResult);
                  } catch (storeError) {
                    console.error('Error storing message:', storeError);
                  }
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
    console.error('Comprehensive Webhook Error:', error);
    return new Response('Error processing webhook', { status: 200 });
  }
}
