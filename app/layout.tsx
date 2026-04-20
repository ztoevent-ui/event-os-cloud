import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ztoevent.com"),
  title: {
    default: "ZTO Event OS | Sarawak Event Management & Technical Production",
    template: "%s | ZTO Event OS",
  },
  description:
    "Sarawak's premier event management and technical production company. Headquartered in Bintulu, serving the whole of Sarawak. Professional event planning, high-end equipment supply (audio, LED, lighting), and the ZTO Arena OS for live sports tournaments.",
  keywords: [
    "Sarawak Event Management",
    "Bintulu Equipment Supply",
    "Sarawak Event Production",
    "Bintulu Event Company",
    "LED Screen Rental Sarawak",
    "Sound System Rental Bintulu",
    "Event Management Sarawak",
    "Sports Tournament Management",
    "ZTO Arena",
    "Technical Production Sarawak",
    "Pickleball Tournament Malaysia",
    "Corporate Event Bintulu",
  ],
  authors: [{ name: "ZTO Event OS" }],
  creator: "ZTO",
  publisher: "ZTO Event OS",
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://ztoevent.com",
    siteName: "ZTO Event OS",
    title: "ZTO Event OS | Sarawak Event Management & Technical Production",
    description:
      "From Bintulu to the whole of Sarawak — we engineer experiences with state-of-the-art equipment and the ZTO Arena OS.",
    images: [
      {
        url: "/project_pickleball_open.png",
        width: 1200,
        height: 630,
        alt: "ZTO Event OS — Premier Event Management in Sarawak",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZTO Event OS | Sarawak Event Management",
    description:
      "Premier event management & technical production in Sarawak. Bintulu-based, Sarawak-wide.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG",
    shortcut:
      "https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG",
    apple:
      "https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-MY">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          rel="icon"
          href="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
          sizes="any"
        />
        <link
          rel="shortcut icon"
          href="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
          type="image/jpeg"
        />
        <meta name="geo.region" content="MY-13" />
        <meta name="geo.placename" content="Bintulu, Sarawak, Malaysia" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18091278870"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'AW-18091278870');
            `,
          }}
        />

        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('SW registered: ', registration.scope);
                }, function(err) {
                  console.log('SW registration failed: ', err);
                });
              });
            }`,
          }}
        />
      </body>
    </html>
  );
}
