import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lead Response Revenue Simulator',
  description:
    'Model how much revenue faster lead response, follow-up and qualification could add to your service business.',
  alternates: { canonical: '/simulator' },
}

// The simulator renders on the client, so crawlers see no heading in the server HTML.
// This visually hidden H1 gives the page one real H1; the step titles are H2s.
const visuallyHidden: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0,
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 style={visuallyHidden}>Lead Response Revenue Simulator</h1>
      {children}
    </>
  )
}
