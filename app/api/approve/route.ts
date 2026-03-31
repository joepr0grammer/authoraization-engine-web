import { NextResponse } from 'next/server';
import { auth0 } from '../../../lib/auth0';

export async function POST(req: Request) {
  try {
    const { token } = await auth0.getAccessToken();
    const body = await req.json();

    const response = await fetch('https://authoraization-engine-api.onrender.com/api/approve-ciba', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pr_number: body.pr_number })
    });

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Bridge Error:", error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}