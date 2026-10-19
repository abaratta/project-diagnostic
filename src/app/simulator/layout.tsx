import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lead Response Revenue Simulator',
  description:
    'Model how much revenue faster lead response, follow-up and qualification could add to your service business.',
  alternates: { canonical: '/simulator' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
