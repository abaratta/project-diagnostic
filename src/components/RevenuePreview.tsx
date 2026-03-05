type Props = {
  monthlyLeads:    number
  costPerLead:     number
  conversionRate:  number  // 0–100
  revenuePerClient: number
  timePerLead:     number  // hours per lead
  hourlyCost:      number  // $/hour
}

export function RevenuePreview({ monthlyLeads, costPerLead, conversionRate, revenuePerClient, timePerLead, hourlyCost }: Props) {
  const monthlyRevenue     = monthlyLeads * (conversionRate / 100) * revenuePerClient
  const acquisitionCost    = monthlyLeads * costPerLead
  const timeCost           = monthlyLeads * timePerLead * hourlyCost
  const monthlyLeadCost    = acquisitionCost + timeCost
  const monthlyProfit      = monthlyRevenue - monthlyLeadCost

  function fmt(n: number) {
    return '$' + Math.round(n).toLocaleString()
  }

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Your current numbers
      </div>
      <div className="stat-block">
        <div className="stat-item">
          <div className="stat-item__value" style={{ fontSize: '1.5rem' }}>{fmt(monthlyRevenue)}</div>
          <div className="stat-item__label">Monthly Revenue</div>
        </div>
        <div className="stat-item">
          <div className="stat-item__value" style={{ fontSize: '1.5rem', color: 'var(--color-danger)' }}>{fmt(monthlyLeadCost)}</div>
          <div className="stat-item__label">Monthly Lead Cost</div>
          {timeCost > 0 && (
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', marginTop: '0.25rem', lineHeight: 1.4 }}>
              {fmt(acquisitionCost)} ads + {fmt(timeCost)} time
            </div>
          )}
        </div>
        <div className="stat-item">
          <div className="stat-item__value" style={{ fontSize: '1.5rem', color: monthlyProfit >= 0 ? 'var(--color-accent-green)' : 'var(--color-danger)' }}>
            {fmt(monthlyProfit)}
          </div>
          <div className="stat-item__label">Monthly Profit from Leads</div>
        </div>
      </div>
    </div>
  )
}
