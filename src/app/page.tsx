'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import WhatsAppConfig from '@/components/WhatsAppConfig';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import AddRecipientModal from '@/components/AddRecipientModel'; // Change Modal to Model
import { Contact, Message, MessageStatus } from '@/types';

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isConfigured, setIsConfigured] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [config, setConfig] = useState({
    accessToken: '',
    phoneNumberId: ''
  });

  // Load config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('whatsappConfig');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      setIsConfigured(true);
    }

    const savedContacts = localStorage.getItem('whatsappContacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }

    const savedMessages = localStorage.getItem('whatsappMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (contacts.length > 0) {
      localStorage.setItem('whatsappContacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      localStorage.setItem('whatsappMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleConfigSave = (accessToken: string, phoneNumberId: string) => {
    const newConfig = { accessToken, phoneNumberId };
    setConfig(newConfig);
    localStorage.setItem('whatsappConfig', JSON.stringify(newConfig));
    setIsConfigured(true);
  };

  const handleAddContact = (contact: Contact) => {
    setContacts(prev => [...prev, contact]);
    setShowAddModal(false);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const sendMessage = async (content: string) => {
    if (!selectedContact) return;

    // Create a new message
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      sender: 'user',
      status: MessageStatus.PENDING,
      recipientId: selectedContact.phoneNumber
    };

    // Update messages state with the new message
    setMessages(prev => {
      const contactMessages = prev[selectedContact.phoneNumber] || [];
      return {
        ...prev,
        [selectedContact.phoneNumber]: [...contactMessages, newMessage]
      };
    });

    try {
      // Call the API to send the message
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedContact.phoneNumber,
          message: content,
          accessToken: config.accessToken,
          phoneNumberId: config.phoneNumberId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Update message status to sent
      setMessages(prev => {
        const contactMessages = prev[selectedContact.phoneNumber].map(msg => 
          msg.id === newMessage.id ? { ...msg, status: MessageStatus.SENT } : msg
        );
        return {
          ...prev,
          [selectedContact.phoneNumber]: contactMessages
        };
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to failed
      setMessages(prev => {
        const contactMessages = prev[selectedContact.phoneNumber].map(msg => 
          msg.id === newMessage.id ? { ...msg, status: MessageStatus.FAILED } : msg
        );
        return {
          ...prev,
          [selectedContact.phoneNumber]: contactMessages
        };
      });
    }
  };

  // Mock function to simulate receiving a message
  const simulateIncomingMessage = (contact: Contact, content: string) => {
    const incomingMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      sender: 'contact',
      status: MessageStatus.DELIVERED,
      recipientId: 'me'
    };

    setMessages(prev => {
      const contactMessages = prev[contact.phoneNumber] || [];
      return {
        ...prev,
        [contact.phoneNumber]: [...contactMessages, incomingMessage]
      };
    });
  };

  return (
    <main className="flex h-screen bg-gray-100">
      {/* Left side - 30% width */}
      <div className="w-3/10 h-full flex flex-col border-r border-gray-300 bg-white">
        {/* WhatsApp logo and config */}
        <div className="p-4 flex justify-between items-center bg-teal-500 text-white">
          <div className="flex items-center">
            <Image 
              src="/whatsapp-logo.png" 
              alt="WhatsApp Logo" 
              width={30} 
              height={30} 
              className="mr-2"
            />
            <h1 className="text-xl font-bold">WhatsZapp</h1>
          </div>
          {isConfigured ? (
            <button 
              onClick={() => setIsConfigured(false)}
              className="text-sm bg-green-600 px-2 py-1 rounded"
            >
              Configure
            </button>
          ) : null}
        </div>

        {/* WhatsApp Configuration or Chat List */}
        {!isConfigured ? (
          <WhatsAppConfig onSave={handleConfigSave} />
        ) : (
          <>
            <div className="p-4 border-b border-gray-300">
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full bg-green-500 text-white py-2 rounded-md font-medium hover:bg-green-600 transition"
              >
                Add Recipient
              </button>
            </div>
            <ChatList 
              contacts={contacts} 
              selectedContact={selectedContact}
              onSelectContact={handleContactSelect}
              messages={messages}
            />
          </>
        )}
      </div>

      {/* Right side - 70% width */}
      <div className="w-7/10 h-full flex flex-col bg-gray-200">
        {selectedContact ? (
          <ChatWindow 
            contact={selectedContact}
            messages={messages[selectedContact.phoneNumber] || []}
            onSendMessage={sendMessage}
            onSimulateIncoming={() => simulateIncomingMessage(selectedContact, 'This is a test reply')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
      <Image 
        src="/image.png"  // Updated path for public/image.png
        alt="Background Image" 
        width={200} 
        height={200} 
        className="opacity-20 mb-4"
      />
      <p className="text-xl">Select a chat to start messaging</p>
    </div>
        )}
      </div>

      {/* Add Recipient Modal */}
      {showAddModal && (
        <AddRecipientModal 
          onAdd={handleAddContact} 
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </main>
  );
}