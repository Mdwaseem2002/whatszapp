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

  // Generate a color based on the contact's name for avatar
  const getAvatarColor = (name: string) => {
    const colors = [
      '#00A884', // WhatsApp green
      '#34B7F1', // WhatsApp blue
      '#F15C6D', // Soft red
      '#A15CDE', // Purple
      '#F1AE5C', // Orange
      '#5CCEF1', // Light blue
    ];
    
    // Simple hash function to get a consistent color for each name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#111B21]">
      <div className="sticky top-0 bg-[#111B21] p-3 border-b border-gray-800">
        <h2 className="text-lg font-bold text-gray-100">Chats</h2>
      </div>
      
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 p-6">
          <div className="rounded-full bg-gray-800 p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p>No contacts yet. Add a recipient to start chatting.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {contacts.map(contact => {
            const lastMessage = getLastMessage(contact.phoneNumber);
            const isSelected = selectedContact?.id === contact.id;
            const initials = contact.name
              .split(' ')
              .map(word => word.charAt(0).toUpperCase())
              .slice(0, 2)
              .join('');
            
            const avatarColor = getAvatarColor(contact.name);
            
            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`p-3 flex items-center cursor-pointer transition-all duration-200 ${
                  isSelected ? 'bg-gray-800' : 'hover:bg-gray-900'
                }`}
              >
                {/* Circular Icon with Initials */}
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-full text-white font-bold text-lg mr-3 flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>
                
                {/* Contact Name and Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-base font-medium text-gray-100 truncate">
                      {contact.name}
                    </h3>
                    {lastMessage.time && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {lastMessage.time}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center mt-1">
                    <p className="text-sm text-gray-400 truncate">
                      {lastMessage.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;