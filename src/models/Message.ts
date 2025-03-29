// src/models/Message.ts
import mongoose from 'mongoose';
import { Message, MessageStatus } from '@/types';

const MessageSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true,
    // Remove the unique: true here since we're adding an index below
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  sender: { 
    type: String, 
    enum: ['user', 'contact'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(MessageStatus), 
    default: MessageStatus.DELIVERED 
  },
  recipientId: { 
    type: String, 
    required: true 
  },
  contactPhoneNumber: { 
    type: String, 
    required: true 
  },
  conversationId: {
    type: String,
    required: true
  },
  originalId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create the index only once, fixing the duplicate index warning
MessageSchema.index({ id: 1 }, { unique: true });

// Check if model exists before creating it
const MessageModel = mongoose.models.Message || mongoose.model<Message>('Message', MessageSchema);

export default MessageModel;