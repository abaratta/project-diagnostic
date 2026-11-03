import type { Metadata } from 'next'
import { Hero } from '@/components/landing/Hero'
import { Story } from '@/components/landing/Story'
import { FinalCta } from '@/components/landing/FinalCta'
import { Faq, FAQS } from '@/components/landing/Faq'
import { MAIN_SITE_URL, SITE_URL } from '@/lib/seo'

const DESCRIPTION =
  'Free lead response calculator for service businesses. Enter your leads, conversion rate and client value to see what slow replies cost you each year.'

export const metadata: Metadata = {
  title: { absolute: 'Lead Response Calculator: What Slow Replies Cost | Profit AI LAB' },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
}

const appLd = {
  '@type': 'WebApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'Lead Response Calculator',
  alternateName: 'Revenue Conversion Diagnostic',
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
  description: DESCRIPTION,
  publisher: { '@id': `${MAIN_SITE_URL}/#organization` },
  isPartOf: { '@id': `${MAIN_SITE_URL}/#website` },
}

const faqLd = {
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
}

const jsonLd = { '@context': 'https://schema.org', '@graph': [appLd, faqLd] }

export default function HomePage() {
  return (
    <main className="cin-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <Story />
      <FinalCta />
      <Faq />
      <footer className="cin-footer">
        <a href={MAIN_SITE_URL}>Profit AI LAB</a>
        <a href={`${MAIN_SITE_URL}/l2r-system`}>The Lead-to-Revenue™ System</a>
        <a href={`${MAIN_SITE_URL}/blog`}>Blog</a>
        <span>Lead Response Calculator</span>
      </footer>
    </main>
  )
}
