export type SliderKey = 'pace' | 'personalization' | 'presence'

export type TooltipStat = { stat: string; source: string }

export type SliderConfig = {
  key:               SliderKey
  label:             string
  subtext:           string
  label_left:        string    // descriptor at slider = 0
  label_right:       string    // descriptor at slider = 100
  ref_label_min?:    string    // override for the "0" ref tick (default: "0")
  ref_label_mid?:    string    // override for the "50%" ref tick (default: "50%")
  ref_label_max?:    string    // override for the "100%" ref tick (default: "100%")
  industry_standard: number    // 0–100, where average businesses sit today
  max_gain:          number    // maximum percentage points added to conversion rate at slider = 100
  gain_per_10:       number    // percentage points added per 10 slider units
  tooltip:           { what: string; stats: TooltipStat[] }
}

export const sliders: SliderConfig[] = [
  {
    key:               'pace',
    label:             'Pace — How fast you respond',
    subtext:           'Research shows leads contacted in under 5 minutes are 9× more likely to convert.',
    label_left:        'Days delay',
    label_right:       '< 5 min response',
    ref_label_min:     'Slow (Days)',
    ref_label_mid:     'Moderate (Hours)',
    ref_label_max:     'Fast (< 5 min)',
    industry_standard: 35,
    max_gain:          4,
    gain_per_10:       0.4,
    tooltip: {
      what: 'Speed to lead is the single biggest driver of conversion. Leads expect an immediate response — every minute of delay dramatically reduces your chances of connecting.',
      stats: [
        { stat: 'Leads contacted within 5 min are 100× more likely to connect than those called 30 min later.', source: 'InsideSales.com / Harvard Business Review' },
        { stat: '35–50% of sales go to the vendor that responds first.', source: 'InsideSales.com' },
        { stat: 'Companies responding within an hour are 7× more likely to qualify the lead vs. waiting 2+ hours.', source: 'HubSpot Research' },
      ],
    },
  },
  {
    key:               'personalization',
    label:             'Personalization — How relevant your response is',
    subtext:           'Personalised follow-up increases conversion by up to 20% compared to generic responses.',
    label_left:        'Generic reply',
    label_right:       'Hyper-personalised',
    ref_label_min:     'Generic',
    ref_label_mid:     'Some',
    ref_label_max:     'Hyper',
    industry_standard: 25,
    max_gain:          3,
    gain_per_10:       0.3,
    tooltip: {
      what: 'Generic, one-size-fits-all responses get ignored. Leads convert at higher rates when your message speaks directly to their specific situation and pain points.',
      stats: [
        { stat: 'Personalised CTAs convert 202% better than generic calls-to-action.', source: 'HubSpot Research' },
        { stat: '80% of consumers are more likely to buy from brands offering personalised experiences.', source: 'Epsilon Research' },
        { stat: 'Personalisation can lift revenues 5–15% and increase marketing ROI by 10–30%.', source: 'McKinsey & Company' },
      ],
    },
  },
  {
    key:               'presence',
    label:             'Presence — How available you are',
    subtext:           'Responding after hours and on multiple channels captures leads your competitors miss.',
    label_left:        'Business hours',
    label_right:       '24/7 multichannel',
    ref_label_min:     'Some days',
    ref_label_mid:     'Every day',
    ref_label_max:     '24/7 (multichannel)',
    industry_standard: 20,
    max_gain:          2,
    gain_per_10:       0.2,
    tooltip: {
      what: 'Leads don\'t wait until Monday morning. Availability after hours and across multiple channels (email, SMS, chat) means you capture prospects the moment they\'re ready to act.',
      stats: [
        { stat: 'Businesses engaging across 3+ channels see 287% higher purchase rates than single-channel campaigns.', source: 'Aberdeen Group' },
        { stat: '89% of customers are retained by businesses with strong omni-channel engagement vs. 33% for weak omni-channel.', source: 'Aberdeen Group / Aspect Software' },
        { stat: '76% of buyers expect consistent interactions across all channels.', source: 'Salesforce State of the Connected Customer' },
      ],
    },
  },
]
