export type SliderKey = 'pace' | 'personalization' | 'presence'

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
    industry_standard: 35,   // most businesses respond within 1–2 hours
    max_gain:          4,
    gain_per_10:       0.4,
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
    industry_standard: 25,   // most use basic templates with little variation
    max_gain:          3,
    gain_per_10:       0.3,
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
    industry_standard: 20,   // most only cover standard business hours
    max_gain:          2,
    gain_per_10:       0.2,
  },
]
