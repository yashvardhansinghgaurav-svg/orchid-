import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import ChatApp from './components/ChatApp'

function App() {
  const [page, setPage] = useState('landing')

  return (
    <AnimatePresence mode="wait">
      {page === 'landing' ? (
        <LandingPage key="landing" onLaunchChat={() => setPage('chat')} />
      ) : (
        <ChatApp key="chat" onBackToHome={() => setPage('landing')} />
      )}
    </AnimatePresence>
  )
}

export default App
