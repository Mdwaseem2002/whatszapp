import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Contact, Message, MessageStatus } from '@/types';
import { formatTimestamp } from '@/utils/formatters';

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSimulateIncoming: () => void; // For testing only
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  contact, 
  messages, 
  onSendMessage,
  onSimulateIncoming
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
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
        return '🕒'; // Clock for pending
      case MessageStatus.SENT:
        return '✓'; // Single check for sent
      case MessageStatus.DELIVERED:
        return '✓✓'; // Double check for delivered
      case MessageStatus.READ:
        return '✓✓'; // Double blue check for read (simplified)
      case MessageStatus.FAILED:
        return '⚠️'; // Warning for failed
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center p-3 bg-green-500 text-white">
        <Image 
          src={contact.avatar || '/default-avatar.png'} 
          alt={contact.name} 
          width={40} 
          height={40}
          className="rounded-full mr-3"
        />
        <div>
          <h2 className="font-bold">{contact.name}</h2>
          <p className="text-xs">
            {contact.lastSeen 
              ? `Last seen ${formatTimestamp(contact.lastSeen)}` 
              : 'Offline'}
          </p>
        </div>
        {/* Testing button for simulating incoming messages - would be removed in production */}
        <button 
          onClick={onSimulateIncoming}
          className="ml-auto text-xs bg-green-600 px-2 py-1 rounded opacity-50 hover:opacity-100"
        >
          Test Receive
        </button>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-200" style={{ 
        backgroundImage: 'url(/whatsapp-bg.png)',
        backgroundSize: 'contain'
      }}>
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
              <div 
                key={message.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3`}
              >
                <div 
                  className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                    isSent ? 'bg-green-100' : 'bg-white'
                  }`}
                >
                  <p className="text-gray-800">{message.content}</p>
                  <div className="flex justify-end items-center mt-1 text-xs text-gray-500">
                    <span className="mr-1">{formatTimestamp(message.timestamp)}</span>
                    {isSent && (
                      <span>{getStatusIcon(message.status)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 py-2 px-4 bg-gray-100 rounded-full focus:outline-none"
        />
        <button 
          type="submit"
          className="ml-2 bg-green-500 text-white p-2 rounded-full"
          disabled={!newMessage.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;