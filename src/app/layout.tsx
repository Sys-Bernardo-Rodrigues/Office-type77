import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Type77 Multi-Agent Pixel Office',
  description: 'Gamified Multi-Agent AI Orchestration Platform in 2D Pixel Art',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased select-none bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
