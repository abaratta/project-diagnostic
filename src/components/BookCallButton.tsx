'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const CAL_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0oqJLtMOIzgsbfQcuYrfzg4b4e-4pJz5MaGrnpEgIzoCBUvmsBYKUP4ZMBVsh62CvXTYobRgX7?gv=true'

export function BookCallButton({ className, children }: {
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && createPortal(
        <div className="gcal-overlay" onClick={() => setOpen(false)}>
          <div className="gcal-modal" onClick={e => e.stopPropagation()}>
            <button className="gcal-modal__close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <iframe
              src={CAL_URL}
              title="Book an appointment"
              className="gcal-modal__frame"
              loading="lazy"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
