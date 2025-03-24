import React, { useState, useEffect } from 'react';

interface WhatsAppConfigProps {
  onSave: (accessToken: string, phoneNumberId: string) => void;
}

const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ onSave }) => {
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [verificationToken, setVerificationToken] = useState('Pentacloud@123');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [error, setError] = useState('');

  // Load env variables if available
  useEffect(() => {
    const loadEnvVariables = async () => {
      try {
        // In a real app, you'd fetch these from an API that securely accesses env variables
        // This is a mock implementation
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
    <div className="p-6 flex-1 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">WhatsApp Business API Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Meta WhatsApp API Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your access token"
          />
          <p className="text-xs text-gray-500 mt-1">
            Find this in your Meta for Developers dashboard
          </p>
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            WhatsApp Business Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your phone number ID"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the ID of your registered WhatsApp Business phone number
          </p>
        </div>
        
        <div>
          <h3 className="text-md font-bold mb-2">Webhook Configuration</h3>
          <p className="text-sm text-gray-600 mb-4">
            To receive incoming messages, configure a webhook in the Meta Developer Dashboard:
          </p>
          
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <div className="mb-3">
              <p className="text-sm font-bold">Callback URL:</p>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={webhookUrl || 'Your-hosted-URL/api/webhook'}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="shadow appearance-none border rounded flex-1 py-1 px-3 text-gray-700 text-sm"
                  placeholder="Your hosted URL/api/webhook"
                />
                <button 
                  type="button"
                  className="ml-2 bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
                  onClick={() => navigator.clipboard.writeText(webhookUrl || 'Your-hosted-URL/api/webhook')}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Replace with your actual hosted URL once deployed
              </p>
            </div>
            
            <div>
              <p className="text-sm font-bold">Verification Token:</p>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={verificationToken}
                  readOnly
                  className="shadow appearance-none border rounded flex-1 py-1 px-3 text-gray-700 text-sm bg-gray-50"
                />
                <button 
                  type="button"
                  className="ml-2 bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
                  onClick={() => navigator.clipboard.writeText(verificationToken)}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        
        <div>
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default WhatsAppConfig;