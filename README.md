
## Frontend Installation Guide

This is the Next.js web interface for the AuthorAIzation Engine. Built with Next.js and styled with a dark-mode glassmorphism aesthetic, this frontend connects users securely via Auth0 to our Python/FastAPI AI Bouncer.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/joepr0grammer/authoraization-frontend.git](https://github.com/joepr0grammer/authoraization-frontend.git)
   cd authoraization-frontend

2. **Install dependencies:**
    ```bash
    npm install

3. **Configure Environment Variables:**
Create a .env.local file in the root directory and add your Auth0 and Backend configurations:
    ```bash
    # Auth0 Configuration
    NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-tenant.auth0.com
    NEXT_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id

    # FastAPI Backend URL
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

4. **Running the Development Server:**
    ```bash
    npm run dev