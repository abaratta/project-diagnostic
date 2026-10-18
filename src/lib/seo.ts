import type { Metadata } from 'next'

export const SITE_URL = 'https://sim.profitailab.com'
export const MAIN_SITE_URL = 'https://profitailab.com'

// Funnel steps (gate, results, booking, confirmation) are personal to each
// visitor and add nothing to search. Keep them out of the index, but let
// crawlers follow their links back to the main site.
export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: true },
}
