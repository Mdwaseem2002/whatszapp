// src/components/ChatComponent.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Enhanced fetch messages function with improved error handling
  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`/api/messages`, {
        params: { 
          phoneNumber, 
          conversationId: phoneNumber 
        },
        // Set a reasonable timeout for the request
        timeout: 8000
      });
      
      if (!response.data.success) {
        console.warn('API returned unsuccessful status:', response.data);
        return;
      }
      
      // Convert and sort all messages chronologically
      const processedMessages = (response.data.messages || []).map((msg: Message) => ({
        ...msg,
        timestamp: new Date(Number(msg.timestamp) * 1000), // Ensure timestamp is converted correctly
      })).sort(
        (a: Message, b: Message) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Update messages, ensuring no duplicates
      setMessages(prevMessages => {
        // Create a map of existing message IDs for efficient comparison
        const existingMessageIds = new Set(prevMessages.map(m => m.id));
        
        // Filter out duplicate messages
        const newUniqueMessages = processedMessages.filter(
          (msg: { id: string; }) => !existingMessageIds.has(msg.id)
        );

        // Combine and re-sort if new messages are found
        const combinedMessages = newUniqueMessages.length > 0 
          ? [...prevMessages, ...newUniqueMessages].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
          : prevMessages;

        return combinedMessages;
      });
    } catch (error: unknown) { // Use 'unknown' instead of 'any'
  console.error('Error fetching messages:', error);

  // Type guard to check if error is an instance of Error
  if (error instanceof Error) {
    // Don't show error UI for normal polling - only for user-initiated actions
    if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
      setError('Failed to load messages. Please try refreshing.');
    }
  }
}

  }, [phoneNumber]);

  // Optimized message sending with better error handling
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    setError(null);
    
    // Optimistically add message to UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: newMessage,
      timestamp: new Date(),
      sender: 'user',
      status: MessageStatus.PENDING,
      contactPhoneNumber: phoneNumber,
      conversationId: phoneNumber
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageText = newMessage;
    setNewMessage('');

    try {
      const response = await axios.post('/api/messages', {
        phoneNumber,
        message: {
          text: { body: messageText },
          from: 'user',
          type: 'text',
          timestamp: Math.floor(Date.now() / 1000),
          id: `user_${Date.now()}`
        }
      }, { timeout: 8000 });

      if (response.data.success) {
        // Replace temp message with confirmed one
        setMessages(prevMessages => {
          return prevMessages.map(msg => 
            msg.id === tempId ? {
              ...msg,
              id: response.data.message.id,
              status: MessageStatus.DELIVERED
            } : msg
          );
        });
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Mark the optimistic message as failed
      setMessages(prevMessages => {
        return prevMessages.map(msg => 
          msg.id === tempId ? {
            ...msg,
            status: MessageStatus.FAILED
          } : msg
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and set up polling
  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 3 seconds (reduced from 2s to decrease server load)
    const intervalId = setInterval(fetchMessages, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [phoneNumber, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h2 className="font-semibold">Chat with {phoneNumber}</h2>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative">
          {error}
          <button 
            className="ml-2 font-bold" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Messages container with improved scrolling */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            No messages yet. Start a conversation!
          </div>
        )}
        
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
              className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-black border border-gray-200'
              }`}
            >
              <div>{message.content}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                {message.sender === 'user' && (
                  <span className="text-xs ml-2">
                    {message.status === MessageStatus.PENDING ? '⏳' : 
                     message.status === MessageStatus.FAILED ? '❌' : 
                     message.status === MessageStatus.DELIVERED ? '✓' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input with improved styling */}
      <div className="flex p-4 border-t bg-white shadow-inner">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
          disabled={isLoading}
          className="flex-grow p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button 
          onClick={sendMessage}
          disabled={isLoading || !newMessage.trim()}

          className={`p-3 rounded-r-lg transition-colors ${
            isLoading || !newMessage.trim()
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
          } text-white font-medium`}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );

}