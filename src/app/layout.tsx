import type { Metadata } from 'next'
import '@/styles/global.css'
import { Header } from '@/components/Header'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: '5P System — Profit AI Lab',
  description: 'Discover how many leads you\'re leaving on the table and build your conversion system.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Header />
          <div className="page-wrapper">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
