import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Scan for Live Scores | Family Day 2026',
  description: 'Shell MDS Family Day 2026 - Scan QR code to view live scores on your phone.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07070a',
};

export default function QRScoreboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
