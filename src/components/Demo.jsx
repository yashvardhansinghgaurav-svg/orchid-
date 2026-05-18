import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, RefreshCw, Loader2 } from 'lucide-react'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:5000`

const CONVERSATIONS = [
  {
    label: 'Creative Writing',
    prompt: 'Write me an opening line for a sci-fi novel set in a dying galaxy.',
  },
  {
    label: 'Code Assistant',
    prompt: 'How do I debounce a function in JavaScript? Show a short code example.',
  },
  {
    label: 'Deep Analysis',
    prompt: 'What makes a startup idea defensible? Give me 3 key moats with examples.',
  },
]

function CodeBlock({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).replace(/^[a-z]*\n/, '')
          return (
            <pre key={i} className="mt-3 mb-2 p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zenthara-300 overflow-x-auto whitespace-pre-wrap">
              {code}
            </pre>
          )
        }
        const boldParts = part.split(/(\*\*.*?\*\*)/g)
        return (
          <span key={i}>
            {boldParts.map((bp, j) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{bp.slice(2, -2)}</strong>
              }
              return <span key={j}>{bp}</span>
            })}
          </span>
        )
      })}
    </span>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-zenthara-400"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

export default function Demo() {
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [userInput, setUserInput] = useState('')
  const [customPrompt, setCustomPrompt] = useState(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const conv = CONVERSATIONS[selected]
  const displayPrompt = customPrompt !== null ? customPrompt : conv.prompt

  useEffect(() => {
    setResponse('')
    setCustomPrompt(null)
    fetchResponse(CONVERSATIONS[selected].prompt)
  }, [selected])

  async function fetchResponse(prompt) {
    setLoading(true)
    setResponse('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, reasoningEffort: 'medium' }),
      })
      const data = await res.json()
      setResponse(data.reply || 'No response received.')
    } catch {
      setResponse('Could not reach the backend. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => {
    const text = userInput.trim()
    if (!text || loading) return
    setCustomPrompt(text)
    setUserInput('')
    fetchResponse(text)
  }

  const handleReplay = () => {
    setCustomPrompt(null)
    fetchResponse(conv.prompt)
  }

  return (
    <section id="demo" className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div ref={ref} className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide"
          >
            See it in{' '}
            <span className="text-gradient">action</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 text-lg"
          >
            Real conversations. Real intelligence. Live from the backend.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass-strong rounded-3xl overflow-hidden border border-white/10"
        >
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-5 py-4 border-b border-white/10 bg-white/2">
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            {CONVERSATIONS.map((c, i) => (
              <button
                key={c.label}
                onClick={() => setSelected(i)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selected === i
                    ? 'bg-zenthara-600/30 text-zenthara-300 border border-zenthara-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {c.label}
              </button>
            ))}
            <button
              onClick={handleReplay}
              className="ml-auto text-slate-600 hover:text-slate-400 transition-colors"
              title="Replay with preset prompt"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Chat area */}
          <div className="p-6 min-h-64 space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`user-${selected}-${displayPrompt}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-end gap-3"
              >
                <div className="max-w-lg">
                  <div className="glass rounded-2xl rounded-tr-sm px-4 py-3 text-slate-200 text-sm leading-relaxed">
                    {displayPrompt}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-slate-300" />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3">
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                animate={{ boxShadow: loading ? '0 0 20px rgba(61,90,255,0.6)' : '0 0 8px rgba(61,90,255,0.3)' }}
                style={{ background: 'linear-gradient(135deg, #3d5aff, #7c3aed)' }}
              >
                <Bot size={14} className="text-white" />
              </motion.div>
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-zenthara-400 font-mono">ZENTHARA</span>
                  {loading ? (
                    <Loader2 size={10} className="text-zenthara-400 animate-spin" />
                  ) : (
                    <Sparkles size={10} className="text-zenthara-400" />
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {loading && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="glass rounded-2xl rounded-tl-sm px-4 py-3"
                    >
                      <TypingDots />
                    </motion.div>
                  )}
                  {!loading && response && (
                    <motion.div
                      key={`response-${response.slice(0, 20)}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="glass rounded-2xl rounded-tl-sm px-4 py-3 text-slate-200 text-sm leading-relaxed"
                    >
                      <CodeBlock text={response} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-5 pb-5">
            <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask Zenthara anything..."
                className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
                disabled={loading}
              />
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={loading}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-zenthara-600 to-aurora-purple flex items-center justify-center disabled:opacity-50"
              >
                <Send size={13} className="text-white" />
              </motion.button>
            </div>
            <p className="text-center text-xs text-slate-700 mt-3">
              Zenthara may make mistakes. Always verify critical information.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
