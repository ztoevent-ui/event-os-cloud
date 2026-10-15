import type { Metadata, Viewport } from 'next';
import { Fredoka } from 'next/font/google';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Family Day 2026 | House Cup Live Scoreboard',
  description: 'Shell MDS Family Day 2026 - Real-time house standings and live scoreboard for attendees.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0d9488',
};

export default function PublicScoreboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fredoka.variable}`} style={{ fontFamily: "var(--font-fredoka), 'Fredoka', 'Comic Sans MS', cursive, sans-serif" }}>
      {children}
    </div>
  );
}

