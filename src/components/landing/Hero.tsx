'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { setVaultUnlocked } from '@/lib/vaultSession'

gsap.registerPlugin(ScrollTrigger)

export function Hero() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-hero-line]', { yPercent: 125, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.2 })
        gsap.from('[data-hero-sub]', { y: 16, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.7, stagger: 0.1 })
        // Photo sinks slightly and the copy lifts away as the story begins.
        gsap.to('[data-hero-media]', {
          yPercent: 12,
          scale: 1.04,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        })
        gsap.to('[data-hero-copy]', {
          y: -80,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: '60% top', scrub: true },
        })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="cin-hero">
      <div data-hero-media className="cin-hero__media grain">
        {/* Desktop: seamless video loop. Mobile: portrait still with a slow drift. */}
        <video className="cin-hero__video" autoPlay muted loop playsInline preload="auto" poster="/media/hero-desktop.jpg">
          <source src="/media/hero-loop.mp4" type="video/mp4" media="(min-width: 1440px)" />
          <source src="/media/hero-loop-1280.mp4" type="video/mp4" />
        </video>
        <div className="cin-hero__still">
          <Image src="/media/hero-mobile.jpg" alt="" fill priority sizes="100vw" className="cin-hero__still-img" />
        </div>
        <div className="cin-hero__scrim" />
      </div>

      <div data-hero-copy className="cin-hero__copy">
        <div className="cin-hero__text">
          <p className="text-eyebrow cin-hero__eyebrow">Friday · 4:47 pm</p>
          <h1 className="text-hero cin-hero__title">
            <span className="cin-mask"><span data-hero-line className="cin-mask__line">A lead just asked</span></span>
            <span className="cin-mask"><span data-hero-line className="cin-mask__line">for a quote.</span></span>
          </h1>
          <p data-hero-sub className="cin-hero__sub">
            How long until someone replies? Nine questions show what that wait is costing you.
          </p>
          <div data-hero-sub className="cin-hero__actions">
            <Link href="/simulator" onClick={() => setVaultUnlocked()} className="cin-btn cin-btn--light">
              Calculate now <span aria-hidden="true">→</span>
            </Link>
            <span className="cin-hero__note">Takes 3 minutes</span>
          </div>
        </div>
      </div>

      <a href="#story" className="cin-cue">
        Scroll
        <span className="cin-cue__line" />
      </a>
    </section>
  )
}
