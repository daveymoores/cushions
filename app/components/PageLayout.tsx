import type {ReactNode} from 'react';
import {AnnouncementBar} from './AnnouncementBar';
import {Header} from './Header';
import {Footer} from './Footer';

export function PageLayout({children}: {children: ReactNode}) {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
