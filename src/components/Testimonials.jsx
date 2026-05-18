import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Aria Chen',
    role: 'CTO, NovaTech',
    text: 'Zenthara replaced three separate AI tools for our team. The quality of reasoning is leagues ahead of anything I\'ve tried. It\'s become indispensable.',
    rating: 5,
    avatar: 'AC',
    color: 'from-zenthara-500 to-aurora-purple',
  },
  {
    name: 'Marcus Webb',
    role: 'Senior Writer, The Atlantic',
    text: 'I was skeptical of AI writing tools. Zenthara changed my mind completely. It doesn\'t replace my voice — it amplifies it. Genuinely impressive.',
    rating: 5,
    avatar: 'MW',
    color: 'from-aurora-purple to-aurora-pink',
  },
  {
    name: 'Priya Sharma',
    role: 'Product Lead, Luminary',
    text: 'The response time is insane. Sub-50ms with that level of intelligence? We\'ve integrated Zenthara into our product and users love it.',
    rating: 5,
    avatar: 'PS',
    color: 'from-aurora-cyan to-zenthara-500',
  },
  {
    name: 'James Okafor',
    role: 'Researcher, MIT',
    text: 'Asked Zenthara to help me debug a complex theorem proof. It didn\'t just find the error — it explained why my entire approach needed restructuring. Mind-blowing.',
    rating: 5,
    avatar: 'JO',
    color: 'from-emerald-500 to-aurora-cyan',
  },
  {
    name: 'Sofia Ramirez',
    role: 'Founder, DaydreamAI',
    text: 'The multilingual capability is extraordinary. Native Spanish, Japanese, and Arabic — all in one conversation. Zero loss of nuance.',
    rating: 5,
    avatar: 'SR',
    color: 'from-amber-400 to-aurora-pink',
  },
  {
    name: 'Kai Nakamura',
    role: 'Lead Engineer, Quantum Labs',
    text: 'Privacy-first architecture sealed the deal for us. Zenthara passed our security audit and now handles sensitive internal documentation.',
    rating: 5,
    avatar: 'KN',
    color: 'from-zenthara-400 to-emerald-500',
  },
]

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zenthara-950/20 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div ref={ref} className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide"
          >
            Loved by{' '}
            <span className="text-gradient">thousands</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 text-lg"
          >
            From researchers to writers to engineers — Zenthara elevates every workflow.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-6 relative group cursor-default"
            >
              <div className="absolute top-4 right-5 text-white/5 group-hover:text-white/10 transition-colors">
                <Quote size={40} />
              </div>

              <div className="flex gap-1 mb-4">
                {Array(t.rating).fill(0).map((_, j) => (
                  <Star key={j} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">
                "{t.text}"
              </p>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-slate-600 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
