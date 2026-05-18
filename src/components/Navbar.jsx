import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'

const links = ['Features', 'How It Works', 'Demo', 'Pricing']

export default function Navbar({ onLaunchChat }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass border-b border-white/10 py-3' : 'py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <motion.a
          href="#"
          whileHover={{ scale: 1.03 }}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-zenthara-500 to-aurora-purple animate-pulse-glow" />
            <div className="absolute inset-0.5 rounded-[10px] bg-[#020817] flex items-center justify-center">
              <Zap size={16} className="text-zenthara-400 fill-zenthara-400" />
            </div>
          </div>
          <span className="font-display text-xl font-semibold text-white tracking-wider group-hover:text-gradient transition-all duration-300">
            ZENTHARA
          </span>
        </motion.a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200 relative group"
            >
              {link}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-zenthara-400 to-aurora-cyan group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <motion.button
            onClick={onLaunchChat}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="relative text-sm font-semibold text-white px-5 py-2.5 rounded-xl overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zenthara-600 to-aurora-purple" />
            <div className="absolute inset-0 bg-gradient-to-r from-aurora-purple to-aurora-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative">Launch Chat</span>
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 px-6 py-4 flex flex-col gap-4"
          >
            {links.map(link => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-slate-300 hover:text-white text-sm py-1"
                onClick={() => setOpen(false)}
              >
                {link}
              </a>
            ))}
            <button onClick={onLaunchChat} className="text-sm font-semibold text-white py-2.5 px-4 rounded-xl bg-gradient-to-r from-zenthara-600 to-aurora-purple text-center mt-2 cursor-pointer">
              Launch Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
