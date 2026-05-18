import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Check, Zap, Crown, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Spark',
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    desc: 'For curious minds getting started',
    color: 'text-slate-400',
    border: 'border-white/10',
    features: [
      '50 messages / day',
      'Standard response speed',
      'Text input only',
      '10 languages',
      'Community support',
    ],
    cta: 'Start for Free',
    ctaClass: 'glass border border-white/20 text-white hover:border-zenthara-500/50',
  },
  {
    name: 'Nova',
    icon: Sparkles,
    price: { monthly: 19, yearly: 15 },
    desc: 'For power users and professionals',
    color: 'text-zenthara-400',
    border: 'border-zenthara-500/40',
    popular: true,
    features: [
      'Unlimited messages',
      'Priority 50ms response',
      'Text, image & voice input',
      '180+ languages',
      'Personality modes',
      'Analytics dashboard',
      'Email support',
    ],
    cta: 'Start Nova',
    ctaClass: 'bg-gradient-to-r from-zenthara-600 to-aurora-purple text-white',
  },
  {
    name: 'Quantum',
    icon: Crown,
    price: { monthly: 49, yearly: 39 },
    desc: 'For teams building the future',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    features: [
      'Everything in Nova',
      'API access (10M tokens/mo)',
      'Custom AI personality',
      'SSO & team management',
      'Advanced data controls',
      'SLA 99.99% uptime',
      'Dedicated account manager',
    ],
    cta: 'Start Quantum',
    ctaClass: 'bg-gradient-to-r from-amber-400 to-aurora-pink text-white',
  },
]

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="pricing" className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide"
          >
            Simple,{' '}
            <span className="text-gradient">honest</span> pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 text-lg mb-8"
          >
            Start free. Scale as you grow.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3"
          >
            <span className={`text-sm ${!yearly ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${yearly ? 'bg-zenthara-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${yearly ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm ${yearly ? 'text-white' : 'text-slate-500'}`}>
              Yearly
              <span className="ml-2 text-xs text-emerald-400 font-semibold">Save 20%</span>
            </span>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            const price = yearly ? plan.price.yearly : plan.price.monthly
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeOut' }}
                className={`relative glass rounded-3xl p-7 border ${plan.border} ${plan.popular ? 'glow-blue' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zenthara-600 to-aurora-purple text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  plan.popular ? 'bg-zenthara-600/20 border border-zenthara-500/30' : 'bg-white/5 border border-white/10'
                }`}>
                  <Icon size={20} className={plan.color} />
                </div>

                <div className="mb-1 text-white font-display font-bold text-xl tracking-wide">{plan.name}</div>
                <div className="text-slate-500 text-sm mb-5">{plan.desc}</div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {price === 0 ? 'Free' : `$${price}`}
                  </span>
                  {price > 0 && <span className="text-slate-500 text-sm ml-1">/mo</span>}
                </div>

                <a
                  href="#"
                  className={`block text-center text-sm font-semibold py-3 rounded-xl transition-all duration-200 hover:opacity-90 hover:scale-[1.02] mb-7 ${plan.ctaClass}`}
                >
                  {plan.cta}
                </a>

                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <Check size={14} className={plan.color} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
