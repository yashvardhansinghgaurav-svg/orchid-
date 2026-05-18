import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { MessageCircle, Cpu, Wand2, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: MessageCircle,
    num: '01',
    title: 'You Speak',
    desc: 'Type, speak, or upload any file. Zenthara receives your input across all modalities simultaneously.',
    color: 'text-zenthara-400',
    bg: 'from-zenthara-500/20 to-zenthara-700/10',
    border: 'border-zenthara-500/30',
  },
  {
    icon: Cpu,
    num: '02',
    title: 'Zenthara Thinks',
    desc: 'Quantum neural processing analyzes context, intent, emotion, and history in milliseconds.',
    color: 'text-aurora-purple',
    bg: 'from-aurora-purple/20 to-zenthara-600/10',
    border: 'border-aurora-purple/30',
  },
  {
    icon: Wand2,
    num: '03',
    title: 'Intelligence Flows',
    desc: 'Our engine synthesizes knowledge from 500B+ parameters to craft the perfect, nuanced response.',
    color: 'text-aurora-cyan',
    bg: 'from-aurora-cyan/20 to-aurora-blue/10',
    border: 'border-aurora-cyan/30',
  },
  {
    icon: CheckCircle,
    num: '04',
    title: 'You Receive',
    desc: 'A clear, accurate, and human-feeling response delivered instantly with full transparency.',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/20 to-aurora-cyan/10',
    border: 'border-emerald-500/30',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="how-it-works" className="relative py-28 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zenthara-950/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div ref={ref} className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide"
          >
            How{' '}
            <span className="text-gradient">Zenthara</span> works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 text-lg max-w-xl mx-auto"
          >
            Four elegant steps. Infinite intelligence.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-px">
            <div className="w-full h-px bg-gradient-to-r from-zenthara-500/50 via-aurora-cyan/50 to-emerald-500/50" />
            <motion.div
              className="absolute inset-0 h-px shimmer-line"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1 }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: 'easeOut' }}
                  className="relative"
                >
                  <div className={`glass rounded-2xl p-6 border ${step.border} text-center group hover:scale-105 transition-transform duration-300`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.bg} border ${step.border} flex items-center justify-center mx-auto mb-5`}>
                      <Icon size={24} className={step.color} />
                    </div>
                    <div className={`font-mono text-xs font-bold mb-3 ${step.color} tracking-widest`}>
                      STEP {step.num}
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
