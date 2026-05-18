import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root render error:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#f3f4f6', background: '#0f1318', minHeight: '100svh', padding: '24px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          <h2>UI failed to load</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
