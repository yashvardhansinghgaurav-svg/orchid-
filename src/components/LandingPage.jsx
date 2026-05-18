import { motion } from 'framer-motion'
import Navbar from './Navbar'
import Hero from './Hero'
import Features from './Features'
import Demo from './Demo'
import HowItWorks from './HowItWorks'
import Testimonials from './Testimonials'
import Pricing from './Pricing'
import CTA from './CTA'
import Footer from './Footer'
import ParticleField from './ParticleField'

export default function LandingPage({ onLaunchChat }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen bg-[#020817] overflow-hidden"
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-zenthara-600/20 via-aurora-purple/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-[600px] h-[600px] bg-gradient-radial from-aurora-cyan/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-aurora-pink/8 to-transparent rounded-full blur-3xl" />
      </div>
      <ParticleField />
      <div className="relative z-10">
        <Navbar onLaunchChat={onLaunchChat} />
        <Hero onLaunchChat={onLaunchChat} />
        <Features />
        <HowItWorks />
        <Demo />
        <Testimonials />
        <Pricing />
        <CTA onLaunchChat={onLaunchChat} />
        <Footer />
      </div>
    </motion.div>
  )
}
