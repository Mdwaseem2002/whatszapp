import React, { useState } from 'react';
import { Contact } from '@/types';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface AddRecipientModalProps {
  onAdd: (contact: Contact) => void;
  onClose: () => void;
}

const AddRecipientModal: React.FC<AddRecipientModalProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      setError('Both name and phone number are required');
      return;
    }
    if (!/^[+]?\d{10,15}$/.test(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    const lastLetter = name.trim().slice(-1).toUpperCase();

    onAdd({
      id: Date.now().toString(),
      name,
      phoneNumber,
      avatar: lastLetter, // Using last letter instead of an image
      lastSeen: new Date().toISOString(),
      online: undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative"
      >
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Add New Recipient</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="+1234567890"
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#075E54' }}
            >
              Add Recipient
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddRecipientModal;
