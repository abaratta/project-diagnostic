import type { Metadata } from 'next'
import '@/styles/global.css'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: '5P System — Profit AI Lab',
  description: 'Discover how many leads you\'re leaving on the table and build your conversion system.',
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Header />
        <div className="page-wrapper">
          {children}
        </div>
      </body>
    </html>
  )
}
