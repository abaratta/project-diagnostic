'use client'

import { Suspense } from 'react'
import { LeadGenForm } from '@/components/LeadGenForm'

export default function LeadGenPage() {
  return (
    <Suspense>
      <LeadGenForm />
    </Suspense>
  )
}
