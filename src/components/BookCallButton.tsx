const CAL_URL = 'https://links.profitailab.com/widget/booking/Ee4rrLM6m7WERplmNmWh'

export function BookCallButton({ className, children }: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <a className={className} href={CAL_URL} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}
