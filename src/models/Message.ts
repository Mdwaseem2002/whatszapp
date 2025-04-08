// src/models/Message.ts
import mongoose from 'mongoose';
import { Message, MessageStatus } from '@/types';

const MessageSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true,
    index: true,
    unique: true 
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sender: { type: String, enum: ['user', 'contact'], required: true },
  status: { 
    type: String, 
    enum: Object.values(MessageStatus), 
    default: MessageStatus.DELIVERED 
  },
  recipientId: { type: String, required: true },
  contactPhoneNumber: { type: String, required: true },
  conversationId: { type: String, required: true },
  originalId: { type: String }
}, {
  timestamps: true
});

// Remove any existing model to prevent recompilation warnings
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

// Create the model
const MessageModel = mongoose.model<Message>('Message', MessageSchema);

export default MessageModel;