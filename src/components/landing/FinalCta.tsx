'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { setVaultUnlocked } from '@/lib/vaultSession'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { n: '01', title: 'Your leads', body: 'How many arrive, where from, and how fast you reply today.' },
  { n: '02', title: 'Your numbers', body: 'Conversion rate, deal value, and the time your team spends per lead.' },
  { n: '03', title: 'Your number', body: 'Revenue you could recover each year, with the maths shown.' },
]

export function FinalCta() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-reveal]', {
          y: 32,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '[data-reveal-group]', start: 'top 80%' },
        })
        gsap.fromTo('[data-cta-photo]', { scale: 1.12 }, {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: '[data-cta-band]', start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="cin-final">
      <div className="cin-steps" data-reveal-group>
        <p className="text-eyebrow" data-reveal>How it works</p>
        <h2 className="text-statement cin-steps__title" data-reveal>Nine questions. One number.</h2>
        <ol className="cin-steps__list">
          {STEPS.map((s) => (
            <li key={s.n} className="cin-steps__item" data-reveal>
              <span className="cin-steps__n">{s.n}</span>
              <h3 className="cin-steps__name">{s.title}</h3>
              <p className="cin-steps__body">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="cin-band grain" data-cta-band>
        <Image data-cta-photo src="/media/monday-desk.jpg" alt="" fill sizes="100vw" className="cin-band__img" />
        <div className="cin-band__scrim" />
        <div className="cin-band__copy">
          <p className="text-eyebrow cin-band__eyebrow">Before the next lead arrives</p>
          <h2 className="text-statement cin-band__title">See what slow replies are costing you.</h2>
          <Link href="/simulator" onClick={() => setVaultUnlocked()} className="cin-btn cin-btn--light">
            Calculate now <span aria-hidden="true">→</span>
          </Link>
          <p className="cin-band__note">Takes 3 minutes · An estimate, not a guarantee</p>
        </div>
      </div>
    </section>
  )
}
