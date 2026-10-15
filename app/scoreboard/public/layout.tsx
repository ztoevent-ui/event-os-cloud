import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Family Day 2026 | Live Scoreboard',
  description: 'Shell MDS Family Day 2026 - Real-time team standings and live scoreboard.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#07070a',
};

export default function PublicScoreboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
