import { motion } from 'framer-motion'
import { Zap, AtSign, Code2, Briefcase, MessageSquare } from 'lucide-react'

const footerLinks = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'],
  Company: ['About', 'Blog', 'Careers', 'Press Kit', 'Contact'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
}

export default function Footer() {
  return (
    <footer className="relative border-t border-white/8 pt-16 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-zenthara-500 to-aurora-purple" />
                <div className="absolute inset-0.5 rounded-[10px] bg-[#020817] flex items-center justify-center">
                  <Zap size={16} className="text-zenthara-400 fill-zenthara-400" />
                </div>
              </div>
              <span className="font-display text-xl font-semibold text-white tracking-wider">ZENTHARA</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-5 max-w-xs">
              Next-generation AI that understands context, emotion, and nuance. The future of conversation starts here.
            </p>
            <div className="flex items-center gap-3">
              {[AtSign, Code2, Briefcase, MessageSquare].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.15, y: -2 }}
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                >
                  <Icon size={15} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <div className="text-white text-sm font-semibold mb-4">{section}</div>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-500 text-sm hover:text-slate-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            © 2026 Zenthara AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 text-sm">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
