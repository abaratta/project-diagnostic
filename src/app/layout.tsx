import type { Metadata, Viewport } from 'next'
import { Exo_2, Outfit } from 'next/font/google'
import '@/styles/global.css'
import { Header } from '@/components/Header'
import { SmoothScroll } from '@/components/SmoothScroll'
import { ThemeProvider } from '@/components/theme-provider'

const exo = Exo_2({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-exo' })
const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Revenue Conversion Diagnostic - Profit AI Lab',
  description: 'Estimate annual revenue growth from improving lead response, personalisation, and automation.',
  icons: { icon: '/favicon.png' },
}

export const viewport: Viewport = {
  themeColor: '#f3f6fa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${exo.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-X9VJ7GT96P" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-X9VJ7GT96P');`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
          <SmoothScroll>
            <Header />
            <div className="page-wrapper">
              {children}
            </div>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  )
}
