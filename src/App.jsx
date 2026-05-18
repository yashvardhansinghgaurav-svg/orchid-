import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Clock3,
  Loader2,
  Paperclip,
  PenSquare,
  Search,
  SendHorizontal,
  Settings,
  Sparkles,
  SquareTerminal,
  Wrench,
  X,
} from 'lucide-react';

const MODELS = [
  { value: 'auto', label: 'Auto' },
  { value: 'geminirotating', label: 'Gemini Rotating Keys (Grounded)' },
  { value: 'cerebras', label: 'Cerebras GPT-OSS-120B' },
  { value: 'groq', label: 'Groq Compound' },
  { value: 'gemini', label: 'Gemini Grounded' },
  { value: 'gemma', label: 'Gemma 4 31B' },
  { value: 'minimax', label: 'Minimax M2.7' },
  { value: 'mistralvision', label: 'Mistral Vision' },
];

const EFFORTS = ['low', 'medium', 'high'];
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:5000`;

function createThread(title = 'New chat', model = 'auto', reasoningEffort = 'medium') {
  let threadId = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      threadId = globalThis.crypto.randomUUID();
    }
  } catch {
    // Non-secure origins may expose randomUUID but throw on call.
  }

  return {
    id: threadId,
    title,
    updatedAt: Date.now(),
    model,
    reasoningEffort,
    messages: [{ role: 'assistant', content: 'ZENTHARA AI ready. Ask me anything.' }],
  };
}

function readAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsText(file);
  });
}

function readAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function readAsBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

function parseSseEvent(rawChunk) {
  const lines = rawChunk.split('\n');
  let event = 'message';
  let data = '';
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) data += `${line.slice(5).trim()}\n`;
  }
  return { event, data: data.trim() };
}

function App() {
  const [threads, setThreads] = useState([createThread('Welcome')]);
  const [activeThreadId, setActiveThreadId] = useState(() => threads[0].id);
  const [activeTab, setActiveTab] = useState('Chat');
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState(null);

  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0],
    [threads, activeThreadId],
  );

  const visibleThreads = useMemo(
    () => threads.filter((thread) => thread.title.toLowerCase().includes(search.toLowerCase())),
    [threads, search],
  );

  const stats = useMemo(() => {
    const messages = activeThread?.messages ?? [];
    return {
      total: messages.length,
      user: messages.filter((message) => message.role === 'user').length,
      assistant: messages.filter((message) => message.role === 'assistant').length,
    };
  }, [activeThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread, loading]);

  useEffect(() => {
    const loadQuota = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/quota`);
        const data = await response.json();
        setQuota(data?.quota || null);
      } catch {
        setQuota(null);
      }
    };
    loadQuota();
    const timer = setInterval(loadQuota, 8000);
    return () => clearInterval(timer);
  }, []);

  function createNewChat() {
    const model = activeThread?.model || 'auto';
    const reasoningEffort = activeThread?.reasoningEffort || 'medium';
    const nextThread = createThread('New chat', model, reasoningEffort);
    setThreads((prev) => [nextThread, ...prev]);
    setActiveThreadId(nextThread.id);
    setComposer('');
    setAttachments([]);
  }

  function patchThread(threadId, updater) {
    setThreads((prev) =>
      prev
        .map((thread) => (thread.id === threadId ? updater(thread) : thread))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );
  }

  function appendMessage(threadId, message, titleIfEmpty = '') {
    patchThread(threadId, (thread) => {
      const userCount = thread.messages.filter((entry) => entry.role === 'user').length;
      const title = userCount === 0 && titleIfEmpty ? titleIfEmpty : thread.title;
      return {
        ...thread,
        title,
        updatedAt: Date.now(),
        messages: [...thread.messages, message],
      };
    });
  }

  function updateLastAssistant(threadId, updater) {
    patchThread(threadId, (thread) => {
      const nextMessages = [...thread.messages];
      for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
        if (nextMessages[index].role === 'assistant') {
          nextMessages[index] = updater(nextMessages[index]);
          break;
        }
      }
      return {
        ...thread,
        updatedAt: Date.now(),
        messages: nextMessages,
      };
    });
  }

  async function addFiles(fileList) {
    const loaded = await Promise.all(
      [...fileList].slice(0, 8).map(async (file) => {
        const type = file.type || 'application/octet-stream';
        const attachment = {
          name: file.name,
          size: file.size,
          type,
          content: '',
          base64: '',
          dataUrl: '',
        };

        if (type.startsWith('image/')) {
          attachment.dataUrl = await readAsDataURL(file);
          return attachment;
        }

        if (type === 'application/pdf') {
          attachment.base64 = await readAsBase64(file);
          return attachment;
        }

        if (type.startsWith('text/') || /\.(md|txt|json|js|jsx|ts|tsx|css|html|yaml|yml|xml|csv)$/i.test(file.name)) {
          attachment.content = await readAsText(file);
          return attachment;
        }

        attachment.base64 = await readAsBase64(file);
        return attachment;
      }),
    );

    setAttachments((prev) => [...prev, ...loaded].slice(-8));
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = composer.trim();
    if (!text || loading || !activeThread) return;

    const threadId = activeThread.id;
    const titleCandidate = text.slice(0, 40);
    const userMessage = {
      role: 'user',
      content: text,
      files: attachments.map((item) => item.name),
    };
    appendMessage(threadId, userMessage, titleCandidate);
    appendMessage(threadId, { role: 'assistant', content: '', meta: 'Streaming...' });

    const threadForRequest = threads.find((thread) => thread.id === threadId) ?? activeThread;
    const requestMessages = [...threadForRequest.messages, { role: 'user', content: text }];
    const modelChoice = threadForRequest.model || 'auto';
    const reasoningEffort = threadForRequest.reasoningEffort || 'medium';

    setComposer('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/collaborate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          messages: requestMessages,
          attachments,
          modelChoice,
          reasoningEffort,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming endpoint unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          const parsed = parseSseEvent(chunk);
          if (!parsed.data) continue;

          if (parsed.event === 'delta') {
            const payload = JSON.parse(parsed.data);
            updateLastAssistant(threadId, (message) => ({
              ...message,
              content: payload.text || message.content,
            }));
          } else if (parsed.event === 'meta') {
            const payload = JSON.parse(parsed.data);
            updateLastAssistant(threadId, (message) => ({
              ...message,
              meta: `${payload.engine} | ${payload.model} | ${(payload.route || []).join(' -> ') || 'n/a'} | ${payload.intent || 'n/a'}`,
            }));
          } else if (parsed.event === 'done') {
            const payload = JSON.parse(parsed.data);
            updateLastAssistant(threadId, (message) => ({
              ...message,
              content: payload.assistantMessage || message.content,
              meta: `${payload.engine} | ${payload.model} | ${(payload.route || []).join(' -> ') || 'n/a'} | ${payload.intent || 'n/a'}`,
            }));
            if (payload.quota) setQuota(payload.quota);
          } else if (parsed.event === 'error') {
            const payload = JSON.parse(parsed.data);
            updateLastAssistant(threadId, () => ({
              role: 'assistant',
              content: `Request failed: ${payload.error || 'Unknown error'}`,
            }));
          }
        }
      }

      setAttachments([]);
    } catch (error) {
      updateLastAssistant(threadId, () => ({
        role: 'assistant',
        content: `Request failed: ${error.message}`,
      }));
    } finally {
      setLoading(false);
    }
  }

  function updateThreadModel(value) {
    if (!activeThread) return;
    patchThread(activeThread.id, (thread) => ({ ...thread, model: value, updatedAt: Date.now() }));
  }

  function updateThreadEffort(value) {
    if (!activeThread) return;
    patchThread(activeThread.id, (thread) => ({ ...thread, reasoningEffort: value, updatedAt: Date.now() }));
  }

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <button type="button" onClick={createNewChat} className="side-action strong">
          <PenSquare size={18} />
          <span>New chat</span>
        </button>
        <button type="button" className="side-action">
          <Search size={18} />
          <span>Search</span>
        </button>
        <button type="button" className="side-action">
          <Wrench size={18} />
          <span>Plugins</span>
        </button>
        <button type="button" className="side-action">
          <Clock3 size={18} />
          <span>Automations</span>
        </button>

        <div className="thread-search">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search threads" />
        </div>

        <div className="thread-label">Threads</div>
        <div className="thread-list scrollbar-thin">
          {visibleThreads.map((thread) => (
            <button
              type="button"
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
            >
              <span>{thread.title}</span>
            </button>
          ))}
        </div>

        <div className="side-footer">
          <button type="button" className="side-action">
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button type="button" className="upgrade-btn">Upgrade</button>
        </div>
      </aside>

      <main className="chat-main">
        <header className="main-header">
          <div className="tabs">
            {['Chat', 'Projects', 'Agents'].map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'tab active' : 'tab'}>
                {tab}
              </button>
            ))}
          </div>
          <div className="top-controls">
            <select value={activeThread?.model || 'auto'} onChange={(event) => updateThreadModel(event.target.value)}>
              {MODELS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
            <select value={activeThread?.reasoningEffort || 'medium'} onChange={(event) => updateThreadEffort(event.target.value)}>
              {EFFORTS.map((effort) => (
                <option key={effort} value={effort}>
                  Reasoning: {effort}
                </option>
              ))}
            </select>
            <span className="stats-inline">U {stats.user} | A {stats.assistant}</span>
          </div>
        </header>

        <section ref={scrollRef} className="message-area scrollbar-thin">
          {(activeThread?.messages || []).map((message, index) => (
            <article key={`${message.role}-${index}`} className={message.role === 'assistant' ? 'bubble assistant' : 'bubble user'}>
              <div className="bubble-head">
                {message.role === 'assistant' ? <Sparkles size={14} /> : <SquareTerminal size={14} />}
                <span>{message.role === 'assistant' ? 'ZENTHARA AI' : 'You'}</span>
              </div>
              <div className="markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || ''}</ReactMarkdown>
              </div>
              {message.files?.length ? <p className="bubble-meta">Files: {message.files.join(', ')}</p> : null}
              {message.meta ? <p className="bubble-meta">{message.meta}</p> : null}
            </article>
          ))}
          {loading ? (
            <div className="thinking">
              <Loader2 size={14} className="animate-spin" />
              <span>Streaming response...</span>
            </div>
          ) : null}
        </section>

        <footer className="composer-wrap">
          {attachments.length ? (
            <div className="attach-row">
              {attachments.map((file, index) => (
                <span key={`${file.name}-${index}`} className="attach-chip">
                  {file.name}
                  <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <form onSubmit={sendMessage} className="composer">
            <button type="button" onClick={() => fileRef.current?.click()} className="icon-btn">
              <Paperclip size={16} />
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && addFiles(event.target.files)} />
            <textarea
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              placeholder="Message ZENTHARA AI"
              rows={2}
            />
            <button type="submit" className="send-btn" disabled={loading}>
              <SendHorizontal size={16} />
            </button>
          </form>
          <div className="quota-line">
            {quota
              ? Object.entries(quota)
                  .map(([provider, values]) => `${provider} ${values.minute}/${values.day}`)
                  .join(' | ')
              : 'Quota unavailable'}
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
