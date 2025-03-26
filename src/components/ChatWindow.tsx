import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ChevronLeft } from 'lucide-react';
import { Contact, Message, MessageStatus } from '@/types';
import { formatTimestamp } from '@/utils/formatters';

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSimulateIncoming: () => void; // For testing only
  onCloseChat: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  contact,
  messages,
  onSendMessage,
  onSimulateIncoming,
  onCloseChat,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.PENDING:
        return '🕒';
      case MessageStatus.SENT:
        return '✓';
      case MessageStatus.DELIVERED:
        return '✓✓';
      case MessageStatus.READ:
        return '✓✓'; 
      case MessageStatus.FAILED:
        return '⚠️';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#ece5dd]">
      {/* Chat header */}
      <div className="flex items-center p-3 bg-[#075E54] text-white shadow-md">
        <button onClick={onCloseChat} className="mr-3">
          <ChevronLeft size={24} />
        </button>
        <div className="w-10 h-10 flex items-center justify-center bg-gray-500 rounded-full mr-3">
          <span className="text-lg font-bold uppercase">
            {contact.name.charAt(0)}
          </span>
        </div>
        <div>
          <h2 className="font-bold">{contact.name}</h2>
          <p className="text-xs text-gray-300">
            {contact.lastSeen ? `Last seen ${formatTimestamp(contact.lastSeen)}` : 'Offline'}
          </p>
        </div>
        <button
          onClick={onSimulateIncoming}
          className="ml-auto text-xs bg-green-600 px-2 py-1 rounded opacity-50 hover:opacity-100"
        >
          Test Receive
        </button>
      </div>

      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundImage: 'url(/whatsapp-bg.png)',
          backgroundSize: 'cover',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 bg-white bg-opacity-70 p-3 rounded-lg">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isSent = message.sender === 'user';

            return (
              <motion.div
                key={message.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg p-3 shadow-md ${
                    isSent ? 'bg-[#dcf8c6] text-black' : 'bg-white'
                  }`}
                >
                  <p className="text-gray-800">{message.content}</p>
                  <div className="flex justify-end items-center mt-1 text-xs text-gray-500">
                    <span className="mr-1">{formatTimestamp(message.timestamp)}</span>
                    {isSent && <span>{getStatusIcon(message.status)}</span>}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white flex items-center border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 py-2 px-4 bg-gray-100 rounded-full focus:outline-none"
        />
        <button
          type="submit"
          className="ml-2 bg-[#075E54] text-white p-3 rounded-full shadow-md disabled:opacity-50"
          disabled={!newMessage.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
