import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gold Price Predictor — Smart Investment Analyzer',
  description:
    'Real-time gold price tracker with smart sell recommendations, Srinagar & India city live rates, LTCG tax calculator, and portfolio analyzer.',
  keywords: 'gold price prediction, gold investment calculator, srinagar gold rate, india gold price, when to sell gold, gold market analysis, LTCG gold tax',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'GoldPredictor' },
  openGraph: {
    title: 'Gold Price Predictor',
    description: 'Real-time gold analysis, India city rates & smart sell recommendations',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFD700',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen transition-colors duration-300"
            style={{ background: 'radial-gradient(ellipse at top, #1a1208 0%, #080808 60%)' }}>
        {children}
      </body>
    </html>
  );
}
