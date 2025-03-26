import React, { useState, useEffect } from 'react';
import { FaClipboard, FaSave } from 'react-icons/fa';

interface WhatsAppConfigProps {
  onSave: (accessToken: string, phoneNumberId: string) => void;
}

const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ onSave }) => {
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [verificationToken, setVerificationToken] = useState('Pentacloud@123');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEnvVariables = async () => {
      try {
        const response = await fetch('/api/get-env-variables');
        if (response.ok) {
          const data = await response.json();
          if (data.accessToken) setAccessToken(data.accessToken);
          if (data.phoneNumberId) setPhoneNumberId(data.phoneNumberId);
          if (data.verificationToken) setVerificationToken(data.verificationToken);
        }
      } catch (err) {
        console.error('Error loading environment variables', err);
      }
    };

    loadEnvVariables();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim() || !phoneNumberId.trim()) {
      setError('Both WhatsApp API access token and phone number ID are required');
      return;
    }
    onSave(accessToken, phoneNumberId);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          WhatsApp Business API Setup
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Access Token */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Meta WhatsApp API Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your access token"
            />
            <p className="text-xs text-gray-500 mt-1">Find this in your Meta Developer dashboard</p>
          </div>

          {/* Phone Number ID */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              WhatsApp Business Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your phone number ID"
            />
            <p className="text-xs text-gray-500 mt-1">This is the ID of your registered WhatsApp Business phone number</p>
          </div>

          {/* Webhook Configuration */}
          <div className="bg-gray-100 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Webhook Configuration</h3>
            <p className="text-sm text-gray-600 mb-3">To receive messages, configure a webhook in Meta Developer Dashboard:</p>

            {/* Callback URL */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Callback URL</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={webhookUrl || 'Your-hosted-URL/api/webhook'}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none"
                />
                <button
                  type="button"
                  className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 rounded-lg transition"
                  onClick={() => navigator.clipboard.writeText(webhookUrl || 'Your-hosted-URL/api/webhook')}
                >
                  <FaClipboard />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Replace with your actual hosted URL once deployed</p>
            </div>

            {/* Verification Token */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Verification Token</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={verificationToken}
                  readOnly
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  type="button"
                  className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 rounded-lg transition"
                  onClick={() => navigator.clipboard.writeText(verificationToken)}
                >
                  <FaClipboard />
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
            >
              <FaSave /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
