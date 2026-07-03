import { Component } from 'react'

// Keeps a single bad render from white-screening the whole app — important when
// a stranger's pasted build or odd input hits an edge case.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('TBH Strategist error:', error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
    if (this.props.onReset) this.props.onReset()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg p-8 text-center">
          <div className="card">
            <h2 className="text-xl text-gold-400">Something went sideways</h2>
            <p className="mt-2 text-sm text-slate-400">
              The strategist hit an unexpected error. Your saved data is fine — try resetting the
              view. If it keeps happening, clearing the imported build usually fixes it.
            </p>
            <pre className="mt-3 overflow-auto rounded-lg bg-navy-950 p-3 text-left text-xs text-rose-300">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={this.handleReset}
                className="rounded-lg border border-gold-600/60 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-300 hover:bg-gold-500/20"
              >
                Reset view
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-navy-700 bg-navy-850 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-navy-800"
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
