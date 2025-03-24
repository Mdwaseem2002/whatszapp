import React from 'react';
import Image from 'next/image';
import { Contact, Message } from '@/types';
import { formatTimestamp } from '@/utils/formatters';

interface ChatListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Record<string, Message[]>;
}

const ChatList: React.FC<ChatListProps> = ({ 
  contacts, 
  selectedContact, 
  onSelectContact,
  messages
}) => {
  const getLastMessage = (phoneNumber: string): { text: string; time: string } => {
    const contactMessages = messages[phoneNumber] || [];
    if (contactMessages.length === 0) {
      return { text: 'No messages yet', time: '' };
    }
    
    const lastMsg = contactMessages[contactMessages.length - 1];
    return {
      text: lastMsg.content.length > 30 
        ? lastMsg.content.substring(0, 27) + '...' 
        : lastMsg.content,
      time: formatTimestamp(lastMsg.timestamp)
    };
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {contacts.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No contacts yet. Add a recipient to start chatting.
        </div>
      ) : (
        contacts.map(contact => {
          const lastMessage = getLastMessage(contact.phoneNumber);
          const isSelected = selectedContact?.id === contact.id;
          
          return (
            <div 
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`p-3 border-b border-gray-200 flex items-center cursor-pointer hover:bg-gray-50 ${
                isSelected ? 'bg-gray-100' : ''
              }`}
            >
              <div className="relative mr-3">
                <Image 
                  src={contact.avatar || '/default-avatar.png'} 
                  alt={contact.name} 
                  width={50} 
                  height={50}
                  className="rounded-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {contact.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {lastMessage.time}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {lastMessage.text}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;