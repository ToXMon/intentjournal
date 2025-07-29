import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IntentJournal+ | AI-Powered DeFi Journaling',
  description: 'Journal your financial intents and get AI-powered DeFi recommendations with 1inch integration',
  keywords: ['DeFi', 'AI', 'Journaling', '1inch', 'Fusion+', 'Etherlink', 'Web3'],
  authors: [{ name: 'IntentJournal+ Team' }],
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
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}