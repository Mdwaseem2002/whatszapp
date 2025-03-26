import React from 'react';
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
          const initials = contact.name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');

          return (
            <div 
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`p-4 border-b border-gray-200 flex items-center cursor-pointer hover:bg-gray-50 ${
                isSelected ? 'bg-gray-100' : ''
              }`}
            >
              {/* Circular Icon with Initials */}
              <div 
                className="w-14 h-14 flex items-center justify-center rounded-full text-white font-bold text-xl mr-4"
                style={{ backgroundColor: '#128C7E' }}
              >
                {initials}
              </div>

              {/* Contact Name and Last Message */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-base font-semibold text-gray-900">
                  {contact.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {lastMessage.text}
                </p>
              </div>

              {/* Last Message Timestamp */}
              {lastMessage.time && (
                <span className="text-xs text-gray-400 ml-auto">
                  {lastMessage.time}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;
