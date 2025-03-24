/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Server Components (default in Next.js 13+)
  reactStrictMode: true,
  
  // Images configuration
  images: {
    domains: [
      'localhost', // For development
      'api.whatsapp.com', // For WhatsApp profile images
    ],
  },
  
  // Environment variables that will be available to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // API and webhook endpoints should be serverless functions
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;