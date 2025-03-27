import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import ConversationModel from '@/models/Conversation';

export async function GET() {
  try {
    await connectMongoDB();

    // Fetch conversations, sorted by last message timestamp
    const conversations = await ConversationModel.find()
      .sort({ lastMessageTimestamp: -1 })
      .limit(50); // Limit to 50 most recent conversations

    return NextResponse.json({ 
      success: true,
      conversations 
    });
  } catch (error) {
    console.error('Error retrieving conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}