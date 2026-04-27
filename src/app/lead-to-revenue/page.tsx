'use client'

import { Suspense } from 'react'
import { AuditForm } from '@/components/AuditForm'

export default function LeadToRevenuePage() {
  return (
    <Suspense>
      <AuditForm />
    </Suspense>
  )
}
