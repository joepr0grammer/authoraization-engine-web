import { NextResponse } from 'next/server';
import { auth0 } from '../../../lib/auth0';

export async function POST(req: Request) {
try {
    // 1. Get the cryptographically signed JWT from the Auth0 session
    const { token } = await auth0.getAccessToken();
    
    // DEBUG: Look in your VSCode terminal for this! 
    // If it is a massive string of random characters, we win.
    // If it is a short 32-character string, it is still an opaque token.
    console.log("\n[SECURE BRIDGE] Intercepted Token:", token.substring(0, 20) + "...\n");

    // 2. Parse the chat message the user typed in the browser
    const body = await req.json();

    // 3. Securely forward the request to your Python FastAPI backend
    const response = await fetch('https://authoraization-engine-api.onrender.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // This is the Bouncer's VIP pass
      },
      body: JSON.stringify({ prompt: body.prompt })
    });

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Bridge Error:", error);
    return NextResponse.json({ error: 'Unauthorized or Backend Error' }, { status: 401 });
  }
}