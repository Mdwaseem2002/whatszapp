import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  contactName: {
    type: String,
    default: 'Unknown'
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTimestamp: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);