export default function PTWLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Work Permit & Site Activity Notice · ZTO Event OS</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body style={{ margin: 0, background: '#f5f5f5', fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
