import type { Metadata } from 'next';
import './globals.css';
import { Header } from './components/Header';

export const metadata: Metadata = {
  title: 'Difficult Chat Mentor',
  description: 'Prepare for difficult conversations with confidence',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAF9] flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
