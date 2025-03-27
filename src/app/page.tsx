'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-900">
      <header className="w-full py-4 px-6 bg-white shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Professional Website</h1>
        <button 
          onClick={() => router.push('/login')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-4xl font-semibold mb-4">Welcome to Our Platform</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-xl">
          Experience the best services with seamless integration and modern design. Join us today.
        </p>
        <button 
          onClick={() => router.push('/signup')} 
          className="px-6 py-3 bg-green-600 text-white rounded-lg text-lg hover:bg-green-700 transition"
        >
          Get Started
        </button>
      </main>

      <footer className="w-full py-4 bg-white text-center shadow-md">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} My Professional Website. All rights reserved.</p>
      </footer>
    </div>
  );
}
