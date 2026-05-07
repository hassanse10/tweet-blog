import { Suspense } from 'react';
import './globals.css';
import ThemeToggle from './components/ThemeToggle';
import SearchBar from './components/SearchBar';
import NotificationBanner from './components/NotificationBanner';
import ReadingProgress from './components/ReadingProgress';

export const metadata = {
  title: 'AI News Digest',
  description: 'Auto-generated articles from top AI companies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ReadingProgress />
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
            <a href="/" className="text-base font-bold tracking-tight text-gray-900 dark:text-white shrink-0 hover:text-blue-600 dark:hover:text-blue-400 transition">
              AI Digest
            </a>
            <Suspense>
              <SearchBar />
            </Suspense>
            <ThemeToggle />
          </div>
          <NotificationBanner />
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
