import { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";

// Notice the function is now explicitly called 'proxy'
export async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // 1. We MUST match the /auth routes so the login/logout buttons work
    "/auth/:path*",
    
    // 2. We match the API routes the AI will use to talk to GitHub
    "/api/github/:path*",
    
    // Notice we removed the catch-all. The home page (/) is now public!
  ]
};