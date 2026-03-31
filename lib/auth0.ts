import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    // We removed 'offline_access' so Auth0 stops panicking!
    scope: "openid profile email", 
    connection_scope: "repo"
    // connection: "github" 
  }
});