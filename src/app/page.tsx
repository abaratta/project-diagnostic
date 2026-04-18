import { Suspense } from 'react'
import { AuditForm } from '@/components/AuditForm'

export default function HomePage() {
  return (
    <main>
      <Suspense>
        <AuditForm />
      </Suspense>
    </main>
  )
}
