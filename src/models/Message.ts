import mongoose from 'mongoose';
import { MessageStatus } from '@/types';

const MessageSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    required: true, 
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
  originalId: String
});

const MessageModel = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default MessageModel;