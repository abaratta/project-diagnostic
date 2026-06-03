import type { Metadata } from 'next'
import '@/styles/global.css'
import { Header } from '@/components/Header'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Revenue Conversion Diagnostic - Profit AI Lab',
  description: 'Estimate annual revenue growth from improving lead response, personalisation, and automation.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZJE9CQ0BW4" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-ZJE9CQ0BW4');`,
          }}
        />
      </head>
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
