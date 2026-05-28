const CAL_URL = 'https://tidycal.com/andrea-baratta/lead-conversion-review'

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
