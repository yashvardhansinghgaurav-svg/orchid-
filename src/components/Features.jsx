import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Brain, Zap, Globe, Shield, Layers, Sparkles, MessageSquare, BarChart2 } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Cognitive Reasoning',
    desc: 'Deep multi-step reasoning with contextual memory that spans entire conversations, not just the last message.',
    color: 'from-zenthara-500 to-zenthara-700',
    glow: 'rgba(61,90,255,0.3)',
  },
  {
    icon: Zap,
    title: 'Instant Response',
    desc: 'Sub-50ms latency powered by our proprietary inference engine — real-time conversations with zero wait.',
    color: 'from-aurora-purple to-zenthara-600',
    glow: 'rgba(124,58,237,0.3)',
  },
  {
    icon: Globe,
    title: '180+ Languages',
    desc: 'Native-level fluency across 180 languages with cultural nuance and regional dialect understanding.',
    color: 'from-aurora-cyan to-zenthara-500',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    desc: 'End-to-end encrypted conversations. Zero data retention. Your conversations are yours alone.',
    color: 'from-emerald-500 to-aurora-cyan',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    icon: Layers,
    title: 'Multimodal Input',
    desc: 'Understands text, images, documents, and voice. Seamlessly switch between modes mid-conversation.',
    color: 'from-aurora-pink to-aurora-purple',
    glow: 'rgba(236,72,153,0.3)',
  },
  {
    icon: BarChart2,
    title: 'Analytics Dashboard',
    desc: 'Deep insights into your AI usage patterns, conversation quality scores, and performance metrics.',
    color: 'from-amber-400 to-aurora-pink',
    glow: 'rgba(251,191,36,0.3)',
  },
  {
    icon: MessageSquare,
    title: 'Personality Modes',
    desc: 'Switch between Professional, Creative, Casual, and Expert modes. Zenthara adapts to your style.',
    color: 'from-zenthara-400 to-aurora-cyan',
    glow: 'rgba(61,90,255,0.3)',
  },
  {
    icon: Sparkles,
    title: 'Creative Engine',
    desc: 'Generate stories, code, art prompts, songs, and more with a dedicated high-creativity mode.',
    color: 'from-aurora-purple to-aurora-pink',
    glow: 'rgba(124,58,237,0.3)',
  },
]

function FeatureCard({ feature, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const Icon = feature.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group glass rounded-2xl p-6 cursor-default relative overflow-hidden"
      style={{ '--glow': feature.glow }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ boxShadow: `inset 0 0 40px ${feature.glow}` }}
      />
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`h-px w-full bg-gradient-to-r ${feature.color}`} />
      </div>

      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        style={{ boxShadow: `0 0 20px ${feature.glow}` }}
      >
        <Icon size={22} className="text-white" />
      </div>

      <h3 className="font-semibold text-white text-base mb-2 group-hover:text-gradient transition-all duration-300">
        {feature.title}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-400 transition-colors duration-300">
        {feature.desc}
      </p>
    </motion.div>
  )
}

export default function Features() {
  const titleRef = useRef(null)
  const inView = useInView(titleRef, { once: true })

  return (
    <section id="features" className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={titleRef} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5"
          >
            <Sparkles size={13} className="text-zenthara-400" />
            <span className="text-xs text-slate-400 tracking-wider uppercase font-mono">Capabilities</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide"
          >
            Built for the{' '}
            <span className="text-gradient">extraordinary</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-500 text-lg max-w-2xl mx-auto"
          >
            Every feature in Zenthara is engineered to make your AI experience seamless, powerful, and genuinely useful.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
