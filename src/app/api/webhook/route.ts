// src/app/api/webhook/route.ts
import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';

// Enable CORS and handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } else {
    return new NextResponse("Forbidden", { 
      status: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    // Ensure MongoDB connection
    await connectMongoDB();

    const rawBody = await request.text();
    console.log("Raw Webhook Payload:", rawBody);

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return new NextResponse("Invalid JSON payload", { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    if (data && data.object === "whatsapp_business_account") {
      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            const value = change.value || {};

            if (value.messages && Array.isArray(value.messages)) {
              for (const message of value.messages) {
                console.log("Processing Message:", JSON.stringify(message, null, 2));

                if (message.type === "text" && message.text) {
                  try {
                    // Use absolute URL for production
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                    
                    const storeResponse = await fetch(
                      `${appUrl}/api/messages`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          phoneNumber: message.from,
                          message: {
                            ...message,
                            text: { body: message.text.body },
                            from: 'contact',
                            content: message.text.body,
                          },
                        }),
                      }
                    );

                    const storeResult = await storeResponse.json();
                    console.log("Message Storage Result:", storeResult);
                  } catch (storeError) {
                    console.error("Error storing message:", storeError);
                  }
                }
              }
            }
          }
        }
      }

      return new NextResponse("EVENT_RECEIVED", {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new NextResponse("Not a WhatsApp event", { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error("Comprehensive Webhook Error:", error);
    return new NextResponse("Error processing webhook", { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}