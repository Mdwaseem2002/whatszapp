import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Verify the request has a valid payload
    if (!body.entry || !body.entry[0]?.changes) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Extract message details
    const message = body.entry[0].changes[0]?.value?.messages?.[0];
    if (!message) {
      return NextResponse.json({ message: "No new messages" }, { status: 200 });
    }

    const senderId = message.from;
    const text = message.text?.body;

    console.log(`📩 New message from ${senderId}: ${text}`);

    // Respond back to confirm receipt
    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "your-secret-token";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully!");
    return new Response(challenge, { status: 200 });
  } else {
    console.warn("⚠️ Webhook verification failed!");
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }
}
