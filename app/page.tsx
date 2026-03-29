'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [pendingCiba, setPendingCiba] = useState<number | null>(null);

  // Ignore the standard "Unauthorized" error when a user is simply logged out
  if (error && error.message !== 'Unauthorized') return <div>{error.message}</div>;
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading AuthorAIzation...</div>;

  const handleChat = async () => {
    if (!prompt.trim()) return;
    
    setIsSending(true);
    setMessages((prev) => [...prev, `You: ${prompt}`]);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await res.json();
      
      // If the AI triggers our Push Notification CIBA flow!
      if (data.status === 'pending_ciba') {
        setMessages((prev) => [...prev, `[SYSTEM ALERT]: ${data.message}`]);
        setPendingCiba(data.pr_number); 
      } else {        
        // Combine the message and the data (if it exists) so we can see the issues!
        const finalMessage = data.data ? `${data.message}\n\n${data.data}` : data.message;
        setMessages((prev) => [...prev, `Agent: ${finalMessage}`]);
      }
      
    } catch (err) {
      setMessages((prev) => [...prev, `[SYSTEM ERROR]: Could not reach agent.`]);
    }
    
    setPrompt('');
    setIsSending(false);
  };

  const handleApprove = async (prNumber: number) => {
    setMessages((prev) => [...prev, `[CIBA]: Out-of-band mobile approval confirmed. Executing merge...`]);
    setPendingCiba(null); // Hide the alert box
    setIsSending(true);
    
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pr_number: prNumber })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, `Agent: ${data.message}`]);
    } catch (err) {
      setMessages((prev) => [...prev, `[SYSTEM ERROR]: Could not execute CIBA merge.`]);
    }
    setIsSending(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-blue-500 to-teal-400 text-transparent bg-clip-text">
          AuthorAIzation
        </h1>
        <p className="text-center text-gray-400 mb-12 text-lg">Zero-Trust Infrastructure Agent</p>

        {!user ? (
          <div className="flex justify-center">
            <a href="/auth/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all">
              Secure Login via Auth0
            </a>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl mx-auto shadow-2xl">
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-800">
              <img src={user.picture || ''} alt="Profile" className="w-12 h-12 rounded-full border-2 border-teal-500" />
              <div>
                <h2 className="text-xl font-semibold">Welcome, {user.name === user.email ? user.nickname : (user.name || user.nickname || 'Developer')}</h2>                <p className="text-gray-400 text-xs font-mono">{user.sub}</p>
              </div>
              <a href="/auth/logout" className="ml-auto text-sm text-red-400 hover:text-red-300">Disconnect</a>
            </div>

            {/* Chat Display Window */}
            <div className="h-64 bg-gray-950 rounded-lg border border-gray-800 p-4 mb-4 font-mono text-sm text-gray-400 overflow-y-auto flex flex-col space-y-2">
              {messages.length === 0 ? (
                <div className="m-auto text-gray-600">Agent securely connected. Awaiting command...</div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`whitespace-pre-wrap ${msg.startsWith('You:') ? 'text-teal-400' : msg.startsWith('[SYSTEM') ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                    {msg}
                  </div>
                ))
              )}
            </div>

            {/* CIBA Push Notification Intercept UI */}
            {pendingCiba && (
              <div className="mt-2 mb-6 p-4 bg-gray-900 border-2 border-red-500 rounded-lg animate-pulse flex justify-between items-center shadow-lg shadow-red-500/20">
                <div>
                  <h3 className="text-red-400 font-bold flex items-center">
                    <span className="mr-2">🚨</span> Auth0 CIBA Approval Required
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Push notification sent to admin device for PR #{pendingCiba}.</p>
                </div>
                <button 
                  onClick={() => handleApprove(pendingCiba)}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
                >
                  Simulate Mobile Approval
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask the agent to merge a PR..." 
                className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-teal-500"
              />
              <button 
                onClick={handleChat}
                disabled={isSending}
                className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 text-white px-6 py-2 rounded-lg font-bold transition-all"
              >
                {isSending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}