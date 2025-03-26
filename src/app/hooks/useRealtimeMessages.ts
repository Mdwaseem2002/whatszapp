import { useState, useEffect } from 'react';
import { Contact, Message } from '@/types';

export function useRealtimeMessages(selectedContact: Contact | null) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!selectedContact) return;

    // Initial fetch
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?phoneNumber=${selectedContact.phoneNumber}`);
        const data = await response.json();
        
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // Create an EventSource for real-time updates
    const setupEventSource = () => {
      const eventSource = new EventSource(`/api/messages/stream?phoneNumber=${selectedContact.phoneNumber}`);

      eventSource.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);
        setMessages(prevMessages => {
          // Avoid duplicates
          const isDuplicate = prevMessages.some(msg => msg.id === newMessage.id);
          return isDuplicate 
            ? prevMessages 
            : [...prevMessages, newMessage];
        });
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        eventSource.close();
      };

      return () => eventSource.close();
    };

    fetchMessages();
    const cleanup = setupEventSource();

    return () => {
      cleanup();
    };
  }, [selectedContact]);

  return messages;
}