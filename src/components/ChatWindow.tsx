import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ChevronLeft, MoreVertical, Search, Paperclip, Mic, Phone, Video } from 'lucide-react';
import { Contact, Message, MessageStatus } from '@/types';

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSimulateIncoming: () => void; // For testing only
  onCloseChat: () => void;
}

// Improved date and time formatting utility functions
const formatMessageTime = (timestamp: string | number | Date) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Invalid time';
  
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatLastSeen = (timestamp: string | number | Date | undefined) => {
  if (!timestamp) return 'Offline';
  
  const date = new Date(timestamp);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Offline';
  
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const getMessageDate = (timestamp: string | number | Date) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Unknown';
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  contact,
  messages,
  onSendMessage,
  onSimulateIncoming,
  onCloseChat,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
    inputRef.current?.focus();
  };

  const handleAttachmentClick = () => {
    setShowAttachments(!showAttachments);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Here you would typically upload the file and then send it
      // For now, just send a message about the attachment
      const file = e.target.files[0];
      onSendMessage(`Sent attachment: ${file.name}`);
      setShowAttachments(false);
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.PENDING:
        return <span className="text-gray-400">🕒</span>;
      case MessageStatus.SENT:
        return <span className="text-gray-400">✓</span>;
      case MessageStatus.DELIVERED:
        return <span className="text-gray-400">✓✓</span>;
      case MessageStatus.READ:
        return <span className="text-blue-400">✓✓</span>; 
      case MessageStatus.FAILED:
        return <span className="text-red-500">⚠️</span>;
      default:
        return '';
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    // Ensure timestamp is a number
    const timestamp = typeof message.timestamp === 'string' 
      ? new Date(message.timestamp).getTime() 
      : message.timestamp;
    
    // Use a safe timestamp for grouping
    const messageDate = getMessageDate(timestamp);
    
    if (!groups[messageDate]) {
      groups[messageDate] = [];
    }
    groups[messageDate].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full bg-[#0c1317] rounded-lg overflow-hidden shadow-xl">
      {/* Chat header */}
      <div className="flex items-center p-3 bg-[#1f2c34] text-gray-200">
        <motion.button 
          onClick={onCloseChat} 
          className="mr-3 text-gray-300 hover:text-white rounded-full p-1 hover:bg-gray-700"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={24} />
        </motion.button>
        <motion.div 
          className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 rounded-full mr-3 overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Always show the first letter of contact name */}
          <span className="text-lg font-bold uppercase text-white">
            {contact.name.charAt(0)}
          </span>
        </motion.div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-100">{contact.name}</h2>
          <p className="text-xs text-gray-400 flex items-center">
            {contact.online ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                <span>Online</span>
              </>
            ) : (
              formatLastSeen(contact.lastSeen)
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button 
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Video size={20} />
          </motion.button>
          <motion.button 
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Phone size={20} />
          </motion.button>
          <motion.button 
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Search size={20} />
          </motion.button>
          <motion.button
            onClick={onSimulateIncoming}
            className="text-xs bg-green-800 px-2 py-1 rounded opacity-70 hover:opacity-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Test
          </motion.button>
          <motion.button 
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreVertical size={20} />
          </motion.button>
        </div>
      </div>

      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundImage: 'url(/whatsapp-dark-bg.png)',
          backgroundSize: 'repeat',
          backgroundColor: '#0b141a',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <motion.div 
              className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded-full"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Send size={32} className="text-gray-400" />
            </motion.div>
            <motion.p 
              className="text-gray-400 bg-gray-800 bg-opacity-70 p-4 rounded-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              No messages yet.<br />Start the conversation with {contact.name}!
            </motion.p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <span className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              
              {dateMessages.map((message, index) => {
                const isSent = message.sender === 'user';
                const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null;
                
                const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender;
                const isLastInGroup = !nextMessage || nextMessage.sender !== message.sender;
                
                // Calculate border radius for group chat bubbles
                let borderRadiusClass = "rounded-lg";
                if (isSent) {
                  if (isFirstInGroup && isLastInGroup) borderRadiusClass = "rounded-lg";
                  else if (isFirstInGroup) borderRadiusClass = "rounded-bl-lg rounded-tl-lg rounded-tr-lg rounded-br-sm";
                  else if (isLastInGroup) borderRadiusClass = "rounded-bl-lg rounded-tl-sm rounded-tr-lg rounded-br-lg";
                  else borderRadiusClass = "rounded-bl-lg rounded-tl-sm rounded-tr-lg rounded-br-sm";
                } else {
                  if (isFirstInGroup && isLastInGroup) borderRadiusClass = "rounded-lg";
                  else if (isFirstInGroup) borderRadiusClass = "rounded-bl-sm rounded-tl-lg rounded-tr-lg rounded-br-lg";
                  else if (isLastInGroup) borderRadiusClass = "rounded-bl-lg rounded-tl-lg rounded-tr-sm rounded-br-lg";
                  else borderRadiusClass = "rounded-bl-lg rounded-tl-lg rounded-tr-sm rounded-br-sm";
                }

                return (
                  <motion.div
                    key={message.id}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-1'} ${isLastInGroup ? 'mb-3' : 'mb-1'}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className={`max-w-xs md:max-w-md p-3 shadow-md ${borderRadiusClass} ${
                        isSent 
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-gray-100' 
                          : 'bg-[#1f2c34] text-gray-200'
                      }`}
                    >
                      {/* Message content with inline timestamp */}
                      <div className="break-words">
                        <span>{message.content}</span>
                        <span className="inline-flex ml-2 text-xs text-gray-400 items-center align-bottom">
                          {formatMessageTime(message.timestamp)}
                          {isSent && <span className="ml-1">{getStatusIcon(message.status)}</span>}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 bg-[#1f2c34] flex items-center">
        <div className="flex-1 flex items-center bg-[#2a3942] rounded-full px-2">
          <motion.button 
            className="p-2 text-gray-400 hover:text-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <span className="text-xl">😊</span>
          </motion.button>
          
          <motion.button 
            className="mr-2 p-2 text-gray-400 hover:text-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAttachmentClick}
          >
            <Paperclip size={20} />
          </motion.button>
          
          {/* Hidden file input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <form onSubmit={handleSubmit} className="flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 py-2 px-2 bg-transparent text-gray-100 focus:outline-none placeholder-gray-400"
            />
          </form>
          
          <motion.button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Mic size={20} />
          </motion.button>
        </div>
        
        <motion.button
          onClick={handleSubmit}
          className="ml-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3 rounded-full shadow-md disabled:opacity-50"
          disabled={!newMessage.trim()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={false}
          animate={
            newMessage.trim() 
              ? { rotate: 0, backgroundColor: "#00a884" } 
              : { rotate: 90, backgroundColor: "#00a884" }
          }
          transition={{ duration: 0.2 }}
        >
          {newMessage.trim() ? <Send size={20} /> : <Mic size={20} />}
        </motion.button>
      </div>
      
      {/* Emoji picker (simplified) */}
      {showEmoji && (
        <motion.div 
          className="bg-[#1f2c34] border-t border-gray-800 p-2 grid grid-cols-8 gap-2 h-40 overflow-y-auto"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "10rem" }}
        >
          {["😊","😂","🤣","❤️","👍","🔥","🎉","😍","😘","🥰","😁","👋","🤔","🙏","👏","🎂","🌹","💯"].map(emoji => (
            <motion.button
              key={emoji}
              className="text-2xl hover:bg-gray-700 rounded p-1"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setNewMessage(current => current + emoji)}
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
      )}
      
      {/* Attachment options */}
      {showAttachments && (
        <motion.div 
          className="bg-[#1f2c34] border-t border-gray-800 p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <div className="grid grid-cols-4 gap-4">
            <motion.button
              className="flex flex-col items-center justify-center p-3 bg-[#2a3942] rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFileInputClick}
            >
              <div className="bg-purple-600 p-3 rounded-full mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-300">Document</span>
            </motion.button>
            
            <motion.button
              className="flex flex-col items-center justify-center p-3 bg-[#2a3942] rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFileInputClick}
            >
              <div className="bg-red-600 p-3 rounded-full mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-300">Camera</span>
            </motion.button>
            
            <motion.button
              className="flex flex-col items-center justify-center p-3 bg-[#2a3942] rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFileInputClick}
            >
              <div className="bg-blue-600 p-3 rounded-full mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-300">Gallery</span>
            </motion.button>
            
            <motion.button
              className="flex flex-col items-center justify-center p-3 bg-[#2a3942] rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFileInputClick}
            >
              <div className="bg-yellow-600 p-3 rounded-full mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0l-2.828 2.828m2.828-2.828a9 9 0 010-12.728m0 0l2.828 2.828m-2.828-2.828L5.586 8.464m0 0a5 5 0 01-1.414 1.414" />
                </svg>
              </div>
              <span className="text-xs text-gray-300">Audio</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatWindow;