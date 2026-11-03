import { MAIN_SITE_URL } from '@/lib/seo'

// Plain server-rendered text, so search engines and AI answers can read what the calculator does.
// The same questions feed the FAQPage JSON-LD on the landing page.
export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What does the lead response calculator work out?',
    a: 'It estimates how much revenue a service business loses each year because new enquiries wait too long for a reply, get patchy follow-up or are handled by hand. You enter your own numbers and it shows the revenue you could recover, with the maths shown.',
  },
  {
    q: 'What numbers do I need?',
    a: 'How many leads you get a month and where they come from, how fast you reply today, your conversion rate from lead to client, the average value of a client, and how much team time each lead takes. A rough figure for each is enough.',
  },
  {
    q: 'How is the estimate calculated?',
    a: 'It starts from your current conversion rate, then models what changes when you reply faster, follow up with more relevant messages and automate the manual steps. The gap between the two results, multiplied by your client value, is the revenue at stake.',
  },
  {
    q: 'Is the result a guarantee?',
    a: 'No. It is an estimate based on the numbers you enter and on the well-documented pattern that leads go cold fast when replies are slow. Treat it as a way to size the problem, not as a promised result.',
  },
  {
    q: 'Who is it for?',
    a: 'Service businesses that get inbound enquiries from a website, ads, calls or referrals: trades, clinics, professional services and agencies. It is free and takes about three minutes.',
  },
]

export function Faq() {
  return (
    <section className="cin-final" aria-labelledby="faq-title">
      <div className="cin-steps cin-faq">
        <p className="text-eyebrow">Questions</p>
        <h2 id="faq-title" className="text-statement cin-steps__title">About the lead response calculator</h2>
        <div className="cin-faq__list">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="cin-steps__item">
              <h3 className="cin-steps__name">{q}</h3>
              <p className="cin-steps__body">{a}</p>
            </div>
          ))}
        </div>
        <p className="cin-steps__body cin-faq__more">
          Want the reasoning behind the numbers? Read{' '}
          <a href={`${MAIN_SITE_URL}/blog/speed-to-lead`}>our speed to lead guide</a> or{' '}
          <a href={`${MAIN_SITE_URL}/blog/why-youre-losing-leads-and-why-more-ads-wont-fix-it`}>why you are losing leads</a>.
        </p>
      </div>
    </section>
  )
}
