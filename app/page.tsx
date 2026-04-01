'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [pendingCiba, setPendingCiba] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (error && error.message !== 'Unauthorized') return <div>{error.message}</div>;
  if (isLoading) return <div className="flex h-screen items-center justify-center text-teal-400 font-mono animate-pulse">Initializing Zero-Trust Environment...</div>;

  const handleResetDemo = async () => {
    setIsResetting(true);
    setResetMessage("Connecting to GitHub to prime repository...");
    
    try {
      // 🛑 ACTION REQUIRED: Replace the URL below with your REAL Render domain! 🛑
      const res = await fetch('https://authoraization-engine-api.onrender.com/api/reset-demo', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setResetMessage(`✅ ${data.message} You may now proceed to Step 2.`);
      } else {
        setResetMessage(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setResetMessage("❌ Failed to reach the backend server. (Check the URL in page.tsx!)");
    }
    setIsResetting(false);
  };

  const handleChat = async () => {
    if (!prompt.trim()) return;
    
    setIsSending(true);
    setMessages((prev) => [...prev, `You: ${prompt}`]);
    
    try {
      const res = await fetch('/chat', {
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
    
    setPrompt('');
    setIsSending(false);
  };

  const handleApprove = async (prNumber: number) => {
    setMessages((prev) => [...prev, `[CIBA]: Out-of-band mobile approval confirmed. Executing merge...`]);
    setPendingCiba(null); 
    setIsSending(true);
    
    try {
      const res = await fetch('/approve', {
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
    // REDUCED PADDING: Changed p-24 to p-4 sm:p-8 to pull everything up
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-white p-4 sm:p-8 relative overflow-hidden">
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        
        {/* REDUCED MARGINS: Changed mb-12 to mb-6 */}
        <div className="flex flex-col items-center mb-6 mt-4">
          {/* OPTIMIZED LOGO SIZE: Reduced to w-32/h-32 (w-40 on desktop) */}
          <div className="mb-4 relative w-32 h-32 sm:w-40 sm:h-40 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]">
            <Image 
              src="/logo.png" 
              alt="AuthorAIzation Engine Logo" 
              fill
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-1 tracking-tight bg-gradient-to-r from-blue-400 via-teal-300 to-teal-500 text-transparent bg-clip-text">
            AuthorAIzation
          </h1>
          <p className="text-center text-gray-400 text-sm sm:text-base uppercase tracking-widest font-semibold">Zero-Trust Infrastructure Agent</p>
        </div>

        {!user ? (
          <div className="flex flex-col items-center max-w-md mx-auto bg-gray-900/60 backdrop-blur-md p-6 rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/50">
            
            <div className="w-full mb-6 pb-6 border-b border-gray-800/80 text-center">
              <h3 className="text-base font-bold text-gray-200 mb-2 flex items-center justify-center gap-2">
                <span className="bg-teal-500/20 text-teal-400 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span> 
                Stage Demo Data
              </h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Securely generate a dummy Pull Request in the isolated sandbox repository to initialize the AI's interactive environment.
              </p>
              <button 
                onClick={handleResetDemo}
                disabled={isResetting}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-teal-500/50 text-sm font-medium rounded-xl text-teal-400 bg-gray-900/50 hover:bg-teal-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-all duration-200"
              >
                {isResetting ? 'Staging Repository...' : 'Prime Demo Environment'}
              </button>
              {resetMessage && (
                <div className={`mt-3 p-2 rounded-lg text-xs font-medium transition-all ${resetMessage.includes('✅') ? 'bg-teal-900/20 text-teal-400 border border-teal-800/50' : 'bg-red-900/20 text-red-400 border border-red-800/50'}`}>
                  {resetMessage}
                </div>
              )}
            </div>

            <div className="w-full text-center">
              <h3 className="text-base font-bold text-gray-200 mb-4 flex items-center justify-center gap-2">
                <span className="bg-blue-500/20 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span> 
                Authenticate Agent
              </h3>
              <a href="/auth/login" className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 shadow-lg shadow-teal-500/25 transition-all duration-200">
                Secure Login via Auth0
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 sm:p-6 max-w-3xl mx-auto shadow-2xl shadow-black/50">
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-800/80">
              <img src={user.picture || ''} alt="Profile" className="w-10 h-10 rounded-full border-2 border-teal-500/50 shadow-lg" />
              <div>
                <h2 className="text-lg font-semibold text-gray-100">Welcome, {user.name === user.email ? user.nickname : (user.name || user.nickname || 'Developer')}</h2>
                <p className="text-teal-500/80 text-[10px] font-mono bg-teal-900/20 px-2 py-0.5 rounded inline-block mt-1">Session Active</p>
              </div>
              <a href="/auth/logout" className="ml-auto text-xs font-medium text-gray-500 hover:text-red-400 transition-colors px-3 py-1 rounded-md hover:bg-red-900/20">Disconnect</a>
            </div>

            {/* REDUCED CHAT HEIGHT: h-80 to h-64 to save vertical space */}
            <div className="h-64 bg-[#0a0a0a] rounded-xl border border-gray-800 p-4 mb-4 font-mono text-xs sm:text-sm overflow-y-auto flex flex-col space-y-3 shadow-inner">
              {messages.length === 0 ? (
                <div className="m-auto text-center">
                  <div className="text-teal-500/50 mb-2">● ● ●</div>
                  <div className="text-gray-500">Agent securely connected to Identity Provider.</div>
                  <div className="text-gray-600 text-xs mt-1">Awaiting secure commands...</div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`whitespace-pre-wrap leading-relaxed ${msg.startsWith('You:') ? 'text-blue-300 ml-4 border-l-2 border-blue-500/30 pl-3' : msg.startsWith('[SYSTEM') ? 'text-red-400 font-bold bg-red-950/30 p-2 rounded border border-red-900/50' : 'text-gray-300 mr-4 border-l-2 border-teal-500/30 pl-3'}`}>
                    {msg}
                  </div>
                ))
              )}
            </div>

            {pendingCiba && (
              <div className="mt-2 mb-4 p-4 bg-red-950/40 backdrop-blur-sm border border-red-500/50 rounded-xl flex flex-col sm:flex-row justify-between items-center shadow-[0_0_20px_rgba(239,68,68,0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse"></div>
                <div className="mb-3 sm:mb-0 pl-2">
                  <h3 className="text-red-400 font-bold flex items-center text-base">
                    <span className="mr-2 animate-bounce">🚨</span> Action Intercepted
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Zero-Trust lock engaged for PR #{pendingCiba}.</p>
                </div>
                <button 
                  onClick={() => handleApprove(pendingCiba)}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-red-900/50 w-full sm:w-auto whitespace-nowrap"
                >
                  Confirm Authorization
                </button>
              </div>
            )}

            <div className="flex space-x-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Instruct the agent..." 
                className="flex-1 bg-[#0a0a0a] text-gray-100 rounded-xl px-4 py-2 border border-gray-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono text-sm placeholder-gray-600"
              />
              <button 
                onClick={handleChat}
                disabled={isSending}
                className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-900/20"
              >
                {isSending ? '...' : 'Execute'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}