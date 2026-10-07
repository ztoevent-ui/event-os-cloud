import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export const metadata: Metadata = {
    title: 'Photobooth Kiosk',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Photobooth',
    },
};

export default function PhotoboothKioskLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
