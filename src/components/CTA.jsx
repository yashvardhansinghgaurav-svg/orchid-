import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'

export default function CTA({ onLaunchChat }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div ref={ref} className="max-w-4xl mx-auto text-center relative">
        {/* Glow behind */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-zenthara-600/25 via-aurora-purple/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Orbiting particles */}
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: i % 2 === 0 ? '#3d5aff' : '#06b6d4',
              top: '50%',
              left: '50%',
              boxShadow: `0 0 6px ${i % 2 === 0 ? '#3d5aff' : '#06b6d4'}`,
            }}
            animate={{
              x: Math.cos((deg * Math.PI) / 180) * 280,
              y: Math.sin((deg * Math.PI) / 180) * 140,
              rotate: [0, 360],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="glass-strong rounded-3xl p-12 md:p-16 border border-white/10 relative"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-7"
          >
            <Zap size={13} className="text-zenthara-400 fill-zenthara-400" />
            <span className="text-xs text-slate-400 tracking-wider uppercase font-mono">Join 2 million+ users</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="font-display text-4xl md:text-6xl font-bold text-white mb-5 tracking-wide leading-tight"
          >
            Ready to meet your{' '}
            <span className="text-gradient">AI future</span>?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-lg mb-10 max-w-xl mx-auto"
          >
            Start talking to Zenthara right now. No credit card required. Experience intelligence that doesn't just answer — it understands.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              onClick={onLaunchChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden flex items-center gap-2 text-white font-bold px-10 py-4 rounded-2xl text-base cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zenthara-600 via-aurora-purple to-aurora-cyan bg-[length:200%_100%] animate-gradient-x" />
              <Sparkles size={16} className="relative" />
              <span className="relative">Start Free — No Card Needed</span>
              <ArrowRight size={16} className="relative group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-600"
          >
            {['No credit card', 'Cancel anytime', 'GDPR compliant', 'SOC 2 certified'].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-zenthara-500" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
