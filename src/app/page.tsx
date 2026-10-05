import { Hero } from '@/components/landing/Hero'
import { Story } from '@/components/landing/Story'
import { FinalCta } from '@/components/landing/FinalCta'

export default function HomePage() {
  return (
    <main className="cin-page">
      <Hero />
      <Story />
      <FinalCta />
      <footer className="cin-footer">
        <a href="https://profitailab.com" target="_blank" rel="noopener noreferrer">Profit AI Lab</a>
        <span>Revenue Conversion Diagnostic</span>
      </footer>
    </main>
  )
}
