//src\components\ChatComponent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageStatus } from '@/types';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'contact';
  status: MessageStatus;
  contactPhoneNumber: string;
  conversationId: string;
  originalId?: string;
}

interface ChatComponentProps {
  phoneNumber: string;
}

export default function ChatComponent({ phoneNumber }: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get(`/api/messages`, {
        params: { 
          phoneNumber, 
          conversationId: phoneNumber 
        }
      });
      
      console.log('Fetched Messages:', response.data);
      
      const processedMessages = (response.data.messages || []).map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })).sort(
        (a: Message, b: Message) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setMessages(prevMessages => {
        const existingMessageIds = new Set(prevMessages.map(m => m.id));
        
        const newUniqueMessages = processedMessages.filter(
          (msg: { id: string; }) => !existingMessageIds.has(msg.id)
        );

        const combinedMessages = newUniqueMessages.length > 0 
          ? [...prevMessages, ...newUniqueMessages].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
          : prevMessages;

        return combinedMessages;
      });
      
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages. Please try again.');
    }
  }, [phoneNumber]);

  // Rest of the component remains the same as in the original code
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post('/api/messages', {
        phoneNumber,
        message: {
          text: { body: newMessage },
          from: 'user',
          type: 'text',
          timestamp: Math.floor(Date.now() / 1000),
          id: `user_${Date.now()}`
        }
      });

      // Immediately add the message to the UI
      const sentMessage: Message = {
        id: response.data.message.id,
        content: newMessage,
        timestamp: new Date(),
        sender: 'user',
        status: MessageStatus.DELIVERED,
        contactPhoneNumber: phoneNumber,
        conversationId: phoneNumber
      };

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, sentMessage].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        return updatedMessages;
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Initial fetch and set up polling with increased frequency
  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 2 seconds
    const intervalId = setInterval(fetchMessages, 2000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [phoneNumber, fetchMessages]);

  return (
    <div className="flex flex-col h-screen">
      {/* Messages container with improved scrolling */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${
              message.sender === 'user' 
                ? 'justify-end' 
                : 'justify-start'
            }`}
          >
            <div 
              className={`max-w-[70%] p-2 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-black'
              }`}
            >
              {message.content}
              <span className="text-xs block mt-1 opacity-50">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Message input with improved styling */}
      <div className="flex p-4 border-t">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button 
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}