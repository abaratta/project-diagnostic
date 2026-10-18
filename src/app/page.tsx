import type { Metadata } from 'next'
import { Hero } from '@/components/landing/Hero'
import { Story } from '@/components/landing/Story'
import { FinalCta } from '@/components/landing/FinalCta'
import { MAIN_SITE_URL, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'Revenue Conversion Diagnostic',
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
  description:
    'Estimate annual revenue growth from improving lead response, personalisation, and automation.',
  publisher: { '@id': `${MAIN_SITE_URL}/#organization` },
  isPartOf: { '@id': `${MAIN_SITE_URL}/#website` },
}

export default function HomePage() {
  return (
    <main className="cin-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <Story />
      <FinalCta />
      <footer className="cin-footer">
        <a href={MAIN_SITE_URL}>Profit AI LAB</a>
        <a href={`${MAIN_SITE_URL}/l2r-system`}>The Lead-to-Revenue™ System</a>
        <a href={`${MAIN_SITE_URL}/blog`}>Blog</a>
        <span>Revenue Conversion Diagnostic</span>
      </footer>
    </main>
  )
}
