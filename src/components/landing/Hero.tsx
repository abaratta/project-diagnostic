'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { setVaultUnlocked } from '@/lib/vaultSession'

/** The lead has already been waiting a while when the visitor lands. */
const START_SECONDS = 3 * 3600 + 47 * 60 + 12

function formatWait(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

/** Ticks once a second while mounted. */
function useWaitClock() {
  const [seconds, setSeconds] = useState(START_SECONDS)
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return formatWait(seconds)
}

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const wait = useWaitClock()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-hero-line]', { yPercent: 125, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.15 })
        gsap.from('[data-hero-sub]', { y: 16, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.6, stagger: 0.1 })
        gsap.from('[data-hero-frame]', { y: 40, opacity: 0, scale: 0.97, duration: 1.4, ease: 'expo.out', delay: 0.25 })
        gsap.from('[data-hero-card]', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', delay: 1, stagger: 0.18 })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="cin-hero">
      <div className="cin-hero__grid">
        <div className="cin-hero__text">
          <p data-hero-sub className="text-eyebrow">Revenue Conversion Diagnostic</p>
          <h1 className="text-hero cin-hero__title">
            <span className="cin-mask"><span data-hero-line className="cin-mask__line">Every slow reply</span></span>
            <span className="cin-mask"><span data-hero-line className="cin-mask__line">has a <span className="cin-hero__accent">price.</span></span></span>
          </h1>
          <p data-hero-sub className="cin-hero__sub">
            A lead asks for a quote and waits hours for an answer. Put in your numbers and see what that wait costs you each year.
          </p>
          <div data-hero-sub className="cin-hero__actions">
            <Link href="/simulator" onClick={() => setVaultUnlocked()} className="cin-btn cin-btn--dark">
              Calculate now <span aria-hidden="true">→</span>
            </Link>
            <span className="cin-hero__note">Takes 3 minutes · Free</span>
          </div>
        </div>

        <div data-hero-frame className="cin-hero__frame grain">
          <Image
            src="/media/hero-mobile.jpg"
            alt="A phone lying on a sunlit table with a new message nobody has opened"
            fill
            priority
            sizes="(min-width: 900px) 40vw, 100vw"
            className="cin-hero__img"
          />
          <div className="cin-hero__frame-scrim" />

          <div data-hero-card className="cin-lead-card">
            <div className="cin-lead-card__head">
              <span className="cin-lead-card__avatar" aria-hidden="true">JM</span>
              <div>
                <strong>New enquiry · Website form</strong>
                <small>Friday, 4:47 pm</small>
              </div>
            </div>
            <p className="cin-lead-card__msg">&ldquo;Hi, could you send me a quote this week? Ready to get started.&rdquo;</p>
          </div>

          <div data-hero-card className="cin-wait-chip" aria-live="off">
            <span className="cin-wait-chip__dot" aria-hidden="true" />
            <span>Unanswered</span>
            <strong className="cin-wait-chip__time">{wait}</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
