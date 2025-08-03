import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { DevModeIndicator } from '@/components/dev-mode-indicator'
import { FloatingNav } from '@/components/floating-nav'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IntentJournal+ | AI-Powered DeFi Journaling',
  description: 'Journal your financial intents and get AI-powered DeFi recommendations with 1inch integration',
  keywords: ['DeFi', 'AI', 'Journaling', '1inch', 'Fusion+', 'Etherlink', 'Web3'],
  authors: [{ name: 'IntentJournal+ Team' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IntentJournal+'
  },
  openGraph: {
    title: 'IntentJournal+ | AI-Powered DeFi Journaling',
    description: 'Journal your financial intents and get AI-powered DeFi recommendations',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} mobile-safe-area mobile-tap-highlight`}>
        <Providers>
          <div className="min-h-screen mobile-scroll-container">
            {children}
          </div>
          <FloatingNav />
          <DevModeIndicator />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}