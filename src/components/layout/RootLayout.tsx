import { ReactNode } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
      <header className="sticky top-0 z-40 w-full border-b bg-white">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">
          <div className="flex flex-1 items-center justify-between">
            <nav className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Cocoon</h1>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
} 