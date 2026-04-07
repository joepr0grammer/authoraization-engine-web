'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [pendingCiba, setPendingCiba] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (error && error.message !== 'Unauthorized') return <div className="text-white p-10">Error: {error.message}</div>;
  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-950 text-teal-400 font-mono animate-pulse text-xl">Initializing Zero-Trust Environment...</div>;

  const handleResetDemo = async () => {
    setIsResetting(true);
    setResetMessage("Connecting to GitHub to prime repository...");
    try {
      const res = await fetch('https://authoraization-engine-api.onrender.com/api/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setResetMessage(`✅ ${data.message} Proceed to Step 2.`);
      } else {
        // Fallback to data.detail (FastAPI's default error key) or stringify the whole crash!
        const errorText = data.message || data.detail || JSON.stringify(data);
        setResetMessage(`Error: ${errorText}`);
      }    } catch (err) {
      setResetMessage("Failed to reach the backend server.");
    }
    setIsResetting(false);
  };

  const handleChat = async () => {
    if (!prompt.trim()) return;
    setIsSending(true);
    setMessages((prev) => [...prev, `You: ${prompt}`]);
    setPrompt('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (data.status === 'pending_ciba') {
        setMessages((prev) => [...prev, `[SYSTEM ALERT]: ${data.message}`]);
        setPendingCiba(data.pr_number); 
      } else {        
        const finalMessage = data.data ? `${data.message}\n\n${data.data}` : data.message;
        setMessages((prev) => [...prev, `Agent: ${finalMessage}`]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, `[SYSTEM ERROR]: Could not reach agent.`]);
    }
    setIsSending(false);
  };

  const handleApprove = async (prNumber: number) => {
    setMessages((prev) => [...prev, `[CIBA]: Out-of-band mobile approval confirmed. Executing merge...`]);
    setPendingCiba(null); 
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
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-mono selection:bg-teal-500/30 relative">
      
      {/* SaaS HEADER */}
      <header className="w-full h-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6 fixed top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)]">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-teal-400 text-transparent bg-clip-text tracking-tight">
              AuthorAIzation
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold">Zero-Trust Engine</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 mr-2">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-200">{user.name === user.email ? user.nickname : (user.name || user.nickname)}</div>
                <div className="text-[10px] text-teal-400 bg-teal-900/20 px-1.5 py-0.5 rounded border border-teal-800/50 inline-block">Authenticated</div>
              </div>
              <img src={user.picture || ''} alt="Profile" className="w-10 h-10 rounded-full border border-gray-600" />
            </div>
            {/* HIGH CONTRAST DISCONNECT BUTTON */}
            <a href="/auth/logout" className="text-red-400 font-bold border-2 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500 transition-all px-4 py-2 rounded-lg text-sm shadow-[0_0_10px_rgba(239,68,68,0.1)]">
              Disconnect
            </a>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col items-center justify-center pt-24 pb-10 px-4 w-full max-w-4xl mx-auto z-10">
        
        {!user ? (
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl">
            <div className="mb-8 pb-8 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white mb-2">1. Stage Demo Data</h3>
              <p className="text-sm text-gray-400 mb-5">Generate a dummy PR in the sandbox repository to initialize the interactive environment.</p>
              <button onClick={handleResetDemo} disabled={isResetting} className="w-full bg-gray-800 hover:bg-gray-700 text-teal-400 border border-teal-500/30 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50">
                {isResetting ? 'Staging Repository...' : 'Prime Demo Environment'}
              </button>
              {resetMessage && (
                <div className={`mt-4 p-3 rounded-lg text-sm font-bold ${resetMessage.includes('✅') ? 'bg-teal-900/30 text-teal-400 border border-teal-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                  {resetMessage}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-5">2. Authenticate Agent</h3>
              <a href="/auth/login" className="w-full block text-center bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-teal-900/30">
                Secure Login via Auth0
              </a>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col h-[calc(100vh-140px)] max-h-[700px]">
            {/* CHAT WINDOW */}
            <div className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-4 overflow-y-auto flex flex-col space-y-4 shadow-xl">
              {messages.length === 0 ? (
                <div className="m-auto text-center">
                  <div className="text-teal-500 mb-2">● ● ●</div>
                  <div className="text-gray-300 font-bold text-lg">Agent connected.</div>
                  <div className="text-gray-500 text-sm mt-1">Awaiting secure commands...</div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`whitespace-pre-wrap leading-relaxed text-sm ${msg.startsWith('You:') ? 'text-blue-300 ml-4 border-l-2 border-blue-500/50 pl-3 py-1' : msg.startsWith('[SYSTEM') ? 'text-red-400 font-bold bg-red-950/40 p-3 rounded-lg border border-red-500/30' : 'text-gray-200 mr-4 border-l-2 border-teal-500/50 pl-3 py-1'}`}>
                    {msg}
                  </div>
                ))
              )}
              
              {/* LOADING INDICATOR */}
              {isSending && (
                <div className="text-teal-400 ml-4 border-l-2 border-teal-500/50 pl-3 py-1 flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="animate-pulse text-sm font-bold">AuthorAIzation is processing...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CIBA INTERCEPT */}
            {pendingCiba && (
              <div className="mb-4 p-5 bg-red-950 border-2 border-red-500/80 rounded-xl flex flex-col sm:flex-row justify-between items-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-red-400 font-bold text-lg flex items-center gap-2">
                    <span className="animate-pulse">🚨</span> Action Intercepted
                  </h3>
                  <p className="text-sm text-red-200 mt-1">Zero-Trust lock engaged for PR #{pendingCiba}.</p>
                </div>
                <button onClick={() => handleApprove(pendingCiba)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-lg transition-all w-full sm:w-auto">
                  Confirm Authorization
                </button>
              </div>
            )}

            {/* INPUT AREA */}
            <div className="flex gap-3">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask for open issues, or instruct the agent to merge a PR..." 
                disabled={isSending || pendingCiba !== null}
                className="flex-1 bg-gray-900 text-white rounded-xl px-5 py-4 border border-gray-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50 text-sm shadow-inner"
              />
              <button 
                onClick={handleChat}
                disabled={isSending || pendingCiba !== null}
                className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-teal-900/20 border border-teal-500"
              >
                Execute
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}