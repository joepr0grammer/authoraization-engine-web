import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AuthorAIzation | Zero-Trust DevOps',
  description: 'Enterprise AI Agent secured by Auth0 Token Vault',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Auth0Provider>
        <body className={inter.className}>{children}</body>
      </Auth0Provider>
    </html>
  );
}