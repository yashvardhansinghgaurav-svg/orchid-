import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react'

const TYPEWRITER_STRINGS = [
  'Think. Understand. Respond.',
  'Your AI companion, evolved.',
  'Intelligence beyond limits.',
  'The future of conversation.',
]

function useTypewriter(strings, speed = 70, pause = 2000) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const current = strings[idx % strings.length]
    let timeout
    if (!deleting && display === current) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && display === '') {
      setDeleting(false)
      setIdx(i => i + 1)
    } else if (!deleting) {
      timeout = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), speed)
    } else {
      timeout = setTimeout(() => setDisplay(current.slice(0, display.length - 1)), speed / 2)
    }
    return () => clearTimeout(timeout)
  }, [display, deleting, idx, strings, speed, pause])
  return display
}

function ZentharaOrb() {
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto">
      <div className="absolute inset-0 rounded-full border border-zenthara-500/20 animate-rotate-slow" />
      <div className="absolute inset-4 rounded-full border border-aurora-purple/20 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
      <div className="absolute inset-8 rounded-full border border-aurora-cyan/15" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? '#3d5aff' : '#7c3aed',
            top: '50%', left: '50%',
            transformOrigin: `${i % 2 === 0 ? 140 : 160}px 0`,
            transform: `rotate(${deg}deg) translateX(${i % 2 === 0 ? 140 : 160}px) translateY(-50%)`,
            boxShadow: `0 0 8px ${i % 2 === 0 ? '#3d5aff' : '#7c3aed'}`,
          }}
          animate={{ rotate: [deg, deg + 360] }}
          transition={{ duration: i % 2 === 0 ? 12 : 18, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      <motion.div
        className="absolute inset-16 rounded-full"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(61,90,255,0.6) 0%, rgba(124,58,237,0.4) 50%, rgba(6,182,212,0.2) 100%)',
          boxShadow: '0 0 60px rgba(61,90,255,0.5), 0 0 120px rgba(124,58,237,0.3)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-80">
            <defs>
              <linearGradient id="zentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93b0ff" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="url(#zentGrad)" strokeWidth="1.5" />
            <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="none" stroke="url(#zentGrad)" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="8" fill="url(#zentGrad)" opacity="0.9" />
          </svg>
        </motion.div>
      </div>
      <motion.div className="absolute inset-16 rounded-full overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(61,90,255,0.15) 50%, transparent 60%)' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </div>
  )
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }

export default function Hero({ onLaunchChat }) {
  const typed = useTypewriter(TYPEWRITER_STRINGS)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const y = useTransform(scrollYProgress, [0, 1], [0, 180])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88])
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 0.7])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-zenthara-600/10 blur-3xl animate-orb-drift pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-aurora-purple/10 blur-3xl animate-orb-drift pointer-events-none" style={{ animationDelay: '-4s' }} />

      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <motion.div style={{ y, opacity, scale }} variants={stagger} initial="hidden" animate="show" className="text-center md:text-left">
          <motion.div variants={item} className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
            <Sparkles size={14} className="text-zenthara-400" />
            <span className="text-xs text-slate-300 tracking-wider uppercase font-mono">Powered by Quantum Neural Architecture</span>
          </motion.div>
          <motion.h1 variants={item} className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-wide mb-2">Meet</motion.h1>
          <motion.h1 variants={item} className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-wide mb-6">
            <span className="text-gradient glow-text">ZENTHARA</span>
          </motion.h1>
          <motion.div variants={item} className="text-xl md:text-2xl font-mono text-zenthara-300 mb-8 h-8 flex items-center gap-1 justify-center md:justify-start">
            <span>{typed}</span>
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }} className="inline-block w-0.5 h-6 bg-zenthara-400" />
          </motion.div>
          <motion.p variants={item} className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md mx-auto md:mx-0">
            Zenthara is a next-generation AI that understands context, emotion, and nuance — delivering conversations that feel effortlessly human, yet infinitely intelligent.
          </motion.p>
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <motion.button onClick={onLaunchChat} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="group relative overflow-hidden flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl text-base cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-zenthara-600 via-aurora-purple to-aurora-cyan bg-[length:200%_100%] animate-gradient-x" />
              <span className="relative">Start Talking Free</span>
              <ArrowRight size={18} className="relative group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.a href="#demo" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="glass-strong flex items-center justify-center gap-2 text-slate-200 font-medium px-8 py-4 rounded-2xl text-base hover:border-zenthara-500/40 transition-colors">
              See Live Demo
            </motion.a>
          </motion.div>
          <motion.div variants={item} className="mt-10 flex items-center gap-8 justify-center md:justify-start">
            {[{ num: '10M+', label: 'Conversations' }, { num: '99.9%', label: 'Uptime' }, { num: '180+', label: 'Languages' }].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gradient">{stat.num}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div style={{ y: orbY, scale: orbScale, opacity }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} className="flex justify-center">
          <ZentharaOrb />
        </motion.div>
      </div>

      <motion.div style={{ opacity }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-xs text-slate-600 tracking-widest uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown size={18} className="text-slate-600" />
        </motion.div>
      </motion.div>
    </section>
  )
}
