import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gold Price Predictor — Smart Investment Analyzer',
  description:
    'Real-time gold price tracker and AI-powered sell recommendation tool. Enter your purchase details and get a data-driven analysis of when to sell your gold for maximum profit.',
  keywords: 'gold price prediction, gold investment calculator, when to sell gold, gold market analysis',
  openGraph: {
    title: 'Gold Price Predictor',
    description: 'Real-time gold analysis & smart sell recommendations',
    type: 'website',
  },
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
      </head>
      <body className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #1a1208 0%, #080808 60%)' }}>
        {children}
      </body>
    </html>
  );
}
