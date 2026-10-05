'use client'

import Image from 'next/image'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

const BEATS = [
  { eyebrow: '4:47 pm', title: 'The lead is ready to buy.', body: 'They filled in your form, then moved on to the next tab. The clock has started.' },
  { eyebrow: 'The usual', title: 'Most replies arrive hours later.', body: 'By then the lead has often booked whoever answered first. The cost never shows up on a report.' },
  { eyebrow: 'The question', title: 'So what is the wait really costing?', body: 'Your leads, your conversion rate, your team’s time. Put them in and see one number.' },
]

/** Sticky photo with three text beats that crossfade on scroll (no pinning, so Lenis stays smooth). */
export function Story() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const beats = gsap.utils.toArray<HTMLElement>('[data-beat]')
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(beats.slice(1), { autoAlpha: 0, y: 40 })
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut', duration: 1 },
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        })
        beats.forEach((beat, i) => {
          if (i === 0) return
          tl.to(beats[i - 1], { autoAlpha: 0, y: -40 }, '+=0.6').to(beat, { autoAlpha: 1, y: 0 }, '<0.3')
        })
        tl.to('[data-story-photo]', { scale: 1.08, ease: 'none', duration: tl.duration() }, 0)
        tl.to({}, { duration: 0.6 })
      })
    },
    { scope: root },
  )

  return (
    <section id="story" ref={root} className="cin-story">
      {/* Mobile: text on top, photo fills the rest, so a short screen only crops the photo, never the words. */}
      <div className="cin-story__frame">
        <div className="cin-story__photo">
          <Image
            data-story-photo
            src="/media/phone-hand.jpg"
            alt="A hand reaching for a phone on a terrace table by the sea"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="cin-story__img"
          />
          <div className="cin-story__fade" />
        </div>

        <div className="cin-story__copy">
          <div className="cin-story__beats">
            {BEATS.map((b) => (
              <div key={b.title} data-beat className="cin-story__beat">
                <p className="text-eyebrow cin-story__eyebrow">{b.eyebrow}</p>
                <h2 className="text-statement">{b.title}</h2>
                <p className="cin-story__body">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
