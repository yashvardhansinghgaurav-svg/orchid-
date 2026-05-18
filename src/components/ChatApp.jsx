import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Plus, Trash2, Paperclip, X, Bot, User,
  Sparkles, ChevronDown, Zap, Settings2, MessageSquare
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:5000`

const MODELS = [
  { id: 'geminirotating', label: 'Gemini 2.5 Flash (Rotating)', desc: 'Auto-rotating keys, never runs out' },
  { id: 'cerebras', label: 'Cerebras', desc: 'Ultra-fast inference' },
  { id: 'groq', label: 'Groq', desc: 'Lightning-fast LLM' },
  { id: 'gemini', label: 'Gemini (Single Key)', desc: 'Standard single-key' },
  { id: 'openrouter-gemini-2.5-flash', label: 'Gemini 2.5 Flash (OpenRouter)', desc: 'Via OpenRouter' },
  { id: 'openrouter-deepseek-r1', label: 'DeepSeek R1 (OpenRouter)', desc: 'Deep reasoning model' },
  { id: 'openrouter-chatgpt-4o-latest', label: 'ChatGPT 4o Latest', desc: 'OpenAI via OpenRouter' },
  { id: 'openrouter-o3-mini', label: 'o3-mini (OpenRouter)', desc: 'Compact reasoning' },
]

const REASONING = ['low', 'medium', 'high']

function makeThread() {
  return { id: Date.now(), title: 'New Chat', messages: [] }
}

export default function ChatApp({ onBackToHome }) {
  const [threads, setThreads] = useState(() => [makeThread()])
  const [activeId, setActiveId] = useState(() => threads[0]?.id)
  const [model, setModel] = useState('geminirotating')
  const [reasoning, setReasoning] = useState('medium')
  const [input, setInput] = useState('')
  const [files, setFiles] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [quota, setQuota] = useState(null)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const abortRef = useRef(null)

  const thread = threads.find(t => t.id === activeId)
  const messages = thread?.messages || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/quota`).then(r => r.json()).then(setQuota).catch(() => {})
  }, [])

  const updateThread = useCallback((id, fn) => {
    setThreads(prev => prev.map(t => t.id === id ? fn(t) : t))
  }, [])

  const addThread = () => {
    const t = makeThread()
    setThreads(prev => [...prev, t])
    setActiveId(t.id)
  }

  const removeThread = (id) => {
    setThreads(prev => {
      const next = prev.filter(t => t.id !== id)
      if (next.length === 0) {
        const t = makeThread()
        next.push(t)
      }
      if (activeId === id) setActiveId(next[0].id)
      return next
    })
  }

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files)
    setFiles(prev => [...prev, ...chosen])
    e.target.value = ''
  }

  const sendMessage = async () => {
    const text = input.trim()
    if ((!text && files.length === 0) || streaming) return

    const userMsg = { role: 'user', content: text, files: files.map(f => f.name) }
    const aiMsg = { role: 'assistant', content: '', thinking: '' }

    updateThread(activeId, t => {
      const title = t.messages.length === 0 ? text.slice(0, 40) || 'File upload' : t.title
      return { ...t, title, messages: [...t.messages, userMsg, aiMsg] }
    })
    setInput('')
    setStreaming(true)

    const body = new FormData()
    body.append('prompt', text)
    body.append('provider', model)
    body.append('reasoningEffort', reasoning)
    const hist = [...messages, userMsg]
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role, content: m.content }))
    body.append('history', JSON.stringify(hist))
    files.forEach(f => body.append('files', f))
    setFiles([])

    try {
      abortRef.current = new AbortController()
      const res = await fetch(`${API_BASE_URL}/api/collaborate/stream`, {
        method: 'POST',
        body,
        signal: abortRef.current.signal,
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'delta') {
              updateThread(activeId, t => {
                const msgs = [...t.messages]
                const last = { ...msgs[msgs.length - 1] }
                last.content += evt.text
                msgs[msgs.length - 1] = last
                return { ...t, messages: msgs }
              })
            } else if (evt.type === 'thinking_delta') {
              updateThread(activeId, t => {
                const msgs = [...t.messages]
                const last = { ...msgs[msgs.length - 1] }
                last.thinking = (last.thinking || '') + evt.text
                msgs[msgs.length - 1] = last
                return { ...t, messages: msgs }
              })
            } else if (evt.type === 'meta') {
              if (evt.quota) setQuota(evt.quota)
            } else if (evt.type === 'error') {
              updateThread(activeId, t => {
                const msgs = [...t.messages]
                const last = { ...msgs[msgs.length - 1] }
                last.content += '\n\n**Error:** ' + evt.message
                msgs[msgs.length - 1] = last
                return { ...t, messages: msgs }
              })
            }
          } catch (_e) { /* skip malformed */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        updateThread(activeId, t => {
          const msgs = [...t.messages]
          const last = { ...msgs[msgs.length - 1] }
          last.content = 'Connection failed. Make sure the backend server is running.'
          msgs[msgs.length - 1] = last
          return { ...t, messages: msgs }
        })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const stopStreaming = () => abortRef.current?.abort()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen flex bg-[#020817] text-white font-body"
    >
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-72 flex-shrink-0 border-r border-white/10 bg-[#0a0f1e] flex flex-col"
          >
            <div className="p-4 border-b border-white/10">
              <button
                onClick={onBackToHome}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={14} />
                Back to Home
              </button>
              <button
                onClick={addThread}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-zenthara-600 to-aurora-purple text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={14} />
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {threads.map(t => (
                <div
                  key={t.id}
                  className={'group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ' +
                    (t.id === activeId
                      ? 'bg-zenthara-600/20 border border-zenthara-500/30'
                      : 'hover:bg-white/5')
                  }
                  onClick={() => setActiveId(t.id)}
                >
                  <MessageSquare size={14} className="text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 truncate flex-1">{t.title}</span>
                  <button
                    onClick={e => { e.stopPropagation(); removeThread(t.id) }}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            {quota && (
              <div className="p-4 border-t border-white/10 text-xs text-slate-500">
                <div className="flex justify-between mb-1">
                  <span>Provider</span>
                  <span className="text-slate-400">{quota.provider || model}</span>
                </div>
                {quota.perKeyUsage && (
                  <div className="mt-1 space-y-0.5">
                    {quota.perKeyUsage.map((k, i) => (
                      <div key={i} className="flex justify-between">
                        <span>Key {i + 1}</span>
                        <span className="text-slate-400">{k.minuteCount}/{k.perMinLimit} rpm</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-md">
          <button
            onClick={() => setShowSidebar(s => !s)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Settings2 size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-zenthara-600 to-aurora-purple flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-display text-sm font-semibold tracking-wider text-white">ZENTHARA</span>
          </div>

          <div className="relative ml-auto">
            <button
              onClick={() => setShowModelMenu(v => !v)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              {MODELS.find(m => m.id === model)?.label || model}
              <ChevronDown size={12} />
            </button>
            {showModelMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0d1320] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setShowModelMenu(false) }}
                    className={'w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ' +
                      (model === m.id ? 'bg-zenthara-600/15' : '')
                    }
                  >
                    <div className="text-sm text-white">{m.label}</div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {REASONING.map(r => (
              <button
                key={r}
                onClick={() => setReasoning(r)}
                className={'text-xs px-2.5 py-1 rounded-md transition-all ' +
                  (reasoning === r
                    ? 'bg-zenthara-600/40 text-zenthara-300'
                    : 'text-slate-500 hover:text-slate-300')
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zenthara-600 to-aurora-purple flex items-center justify-center mb-6"
                animate={{ boxShadow: ['0 0 30px rgba(61,90,255,0.3)', '0 0 60px rgba(61,90,255,0.5)', '0 0 30px rgba(61,90,255,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles size={28} className="text-white" />
              </motion.div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">How can I help you?</h3>
              <p className="text-slate-500 text-sm max-w-md">
                Ask anything. I support multiple AI models, file analysis, and deep reasoning.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={'flex gap-3 ' + (msg.role === 'user' ? 'justify-end' : '')}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3d5aff, #7c3aed)' }}>
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={'max-w-2xl ' + (msg.role === 'user' ? 'order-first' : '')}>
                {msg.thinking && (
                  <details className="mb-2">
                    <summary className="text-xs text-aurora-purple cursor-pointer">Thinking...</summary>
                    <pre className="mt-1 text-xs text-slate-500 whitespace-pre-wrap bg-white/5 rounded-xl p-3">
                      {msg.thinking}
                    </pre>
                  </details>
                )}
                {msg.files && msg.files.length > 0 && (
                  <div className="flex gap-1 mb-1 flex-wrap">
                    {msg.files.map((f, j) => (
                      <span key={j} className="text-xs bg-white/10 rounded-lg px-2 py-0.5 text-slate-400">
                        <Paperclip size={10} className="inline mr-1" />{f}
                      </span>
                    ))}
                  </div>
                )}
                <div className={'rounded-2xl px-4 py-3 text-sm leading-relaxed ' +
                  (msg.role === 'user'
                    ? 'bg-gradient-to-br from-zenthara-600/30 to-aurora-purple/20 border border-zenthara-500/20 text-slate-200 rounded-tr-sm'
                    : 'glass rounded-tl-sm text-slate-200')
                }>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || ''}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                  {streaming && i === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
                    <div className="flex gap-1.5 items-center py-1">
                      {[0, 1, 2].map(d => (
                        <motion.div
                          key={d}
                          className="w-2 h-2 rounded-full bg-zenthara-400"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-slate-300" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 p-4 bg-[#0a0f1e]/80 backdrop-blur-md">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300">
                  <Paperclip size={10} />
                  {f.name}
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-slate-500 hover:text-white transition-colors p-2"
            >
              <Paperclip size={18} />
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
            <div className="flex-1 glass rounded-2xl px-4 py-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Message Zenthara..."
                rows={1}
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none resize-none max-h-40"
                style={{ minHeight: '24px' }}
              />
            </div>
            {streaming ? (
              <button
                onClick={stopStreaming}
                className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X size={18} />
              </button>
            ) : (
              <motion.button
                onClick={sendMessage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-zenthara-600 to-aurora-purple"
              >
                <Send size={18} className="text-white" />
              </motion.button>
            )}
          </div>
          <p className="text-center text-xs text-slate-700 mt-3">
            Zenthara may make mistakes. Always verify critical information.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
